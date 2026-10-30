import type { Presentation } from "./types";
import {
  backupPresentations,
  coercePresentation,
  loadPresentations,
  replacePresentationsFromCloud
} from "./storage";
import {
  clearDirty,
  currentRevision,
  hasSyncedOnce,
  isDirty,
  isHeld,
  lastSyncUser,
  loadTombstones,
  markSyncedOnce,
  saveTombstones,
  setHold,
  setLastSyncUser
} from "./syncMeta";
import {
  dropUntouchedDemos,
  hasRealTalk,
  mergeTalks,
  mergeTombstones,
  type CloudPayload
} from "./merge";
import { supabaseBrowser } from "./supabaseBrowser";

const TABLE = "speaker_copilot_data";
const KNOWN_VERSION = 1;
const UNREADABLE = "Cloud data could not be read - not synced";
const KEEPALIVE_LIMIT = 60 * 1024;

export type SyncStatus = "idle" | "synced" | "syncing" | "offline" | "error";

export interface CloudSnapshot {
  email: string | null;
  status: SyncStatus;
  notice: string;
  accountChoice: boolean;
}

export interface CloudHandle {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteCloud: () => Promise<void>;
  retry: () => void;
  keepSeparate: () => void;
  mergeAccounts: () => void;
  dismissAccountChoice: () => void;
  dispose: () => void;
}

interface Handlers {
  onPresentations: (list: Presentation[]) => void;
  onSnapshot: (snapshot: CloudSnapshot) => void;
}

type Parsed =
  | { fatal: true }
  | { fatal: false; payload: CloudPayload };

function parsePayload(data: unknown): Parsed {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { fatal: true };
  const row = data as Record<string, unknown>;
  if (row.version !== KNOWN_VERSION) return { fatal: true };
  if (!Array.isArray(row.presentations)) return { fatal: true };

  const presentations: Presentation[] = [];
  const preserved: unknown[] = [];
  for (const item of row.presentations) {
    const talk = coercePresentation(item);
    if (talk) presentations.push(talk);
    else preserved.push(item);
  }
  if (Array.isArray(row.preserved)) {
    for (const item of row.preserved) preserved.push(item);
  }
  if (row.deletedIds !== undefined && !Array.isArray(row.deletedIds)) {
    preserved.push({ preservedDeletedIds: row.deletedIds });
  }

  const deletedIds = Array.isArray(row.deletedIds)
    ? row.deletedIds.filter(
        (t): t is { id: string; deletedAt: number } =>
          Boolean(t) &&
          typeof (t as { id?: unknown }).id === "string" &&
          typeof (t as { deletedAt?: unknown }).deletedAt === "number"
      )
    : [];

  return {
    fatal: false,
    payload: {
      version: 1,
      presentations,
      deletedIds,
      preserved: preserved.length > 0 ? preserved : undefined
    }
  };
}

function payloadFromLocal(preserved?: unknown[]): CloudPayload {
  const local = loadPresentations();
  const presentations = hasRealTalk(local) ? dropUntouchedDemos(local) : [];
  const body: CloudPayload = { version: 1, presentations, deletedIds: loadTombstones() };
  if (preserved && preserved.length > 0) body.preserved = preserved;
  return body;
}

function cleanOAuthParams(): void {
  try {
    const url = new URL(window.location.href);
    const hasCode = url.searchParams.has("code");
    const hasError = url.searchParams.has("error");
    if (!hasCode && !hasError) return;
    window.history.replaceState({}, "", url.pathname);
  } catch {
    /* ignore */
  }
}

function otherAccountData(nextId: string): boolean {
  const previous = lastSyncUser();
  return Boolean(previous && previous !== nextId && (isDirty() || hasSyncedOnce()));
}

/**
 * Optional sync. Local talks stay the source of truth on this device.
 * A failed or unreadable cloud read never uploads and never overwrites local data.
 */
export function startCloud(handlers: Handlers): CloudHandle {
  const supabase = supabaseBrowser();
  if (!supabase) {
    return {
      signIn: async () => {},
      signOut: async () => {},
      deleteCloud: async () => {},
      retry: () => {},
      keepSeparate: () => {},
      mergeAccounts: () => {},
      dismissAccountChoice: () => {},
      dispose: () => {}
    };
  }

  const client = supabase;
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  let userId: string | null = null;
  let email: string | null = null;
  let accessToken: string | null = null;
  let status: SyncStatus = "idle";
  let notice = "";
  let accountChoice = false;
  let syncPaused = false;
  let sawCloud = false;
  let timer = 0;
  let chain: Promise<void> = Promise.resolve();
  let disposed = false;

  const publish = () => {
    if (disposed) return;
    handlers.onSnapshot({ email, status, notice, accountChoice });
  };

  const setStatus = (next: SyncStatus, nextNotice = notice) => {
    status = next;
    notice = nextNotice;
    publish();
  };

  const enqueue = (job: () => Promise<void>) => {
    chain = chain.then(job, job);
    return chain;
  };

  const applyLocal = (list: Presentation[]) => {
    const stored = replacePresentationsFromCloud(list);
    handlers.onPresentations(stored);
    return stored;
  };

  const blocked = () => accountChoice || syncPaused;

  async function writeRow(body: CloudPayload, keepalive: boolean): Promise<void> {
    if (!userId || !accessToken) throw new Error("Not signed in");
    const endpoint = `${url}/rest/v1/${TABLE}?on_conflict=user_id`;
    const response = await fetch(endpoint, {
      method: "POST",
      keepalive,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({ user_id: userId, data: body })
    });
    if (!response.ok) throw new Error("Upload failed");
  }

  async function upload(preserved?: unknown[]): Promise<void> {
    const rev = currentRevision();
    const local = loadPresentations();
    const tombs = loadTombstones();
    if (!hasRealTalk(local) && tombs.length === 0 && !(preserved && preserved.length > 0)) {
      setStatus("synced", "");
      return;
    }
    if (isHeld() && !isDirty()) {
      setStatus("synced", "");
      return;
    }
    const body = payloadFromLocal(preserved);
    await writeRow(body, false);
    if (currentRevision() !== rev) {
      schedule();
      return;
    }
    clearDirty();
    markSyncedOnce();
    if (hasRealTalk(local)) applyLocal(body.presentations);
    setStatus("synced", "");
  }

  async function adoptCloud(): Promise<boolean> {
    if (!userId) return false;
    if (!navigator.onLine) {
      setStatus("offline", "");
      return false;
    }
    setStatus("syncing", "");
    const { data, error } = await client
      .from(TABLE)
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      setStatus("error", "Couldn't read your cloud copy. Nothing was changed.");
      return false;
    }
    sawCloud = true;
    if (!data) {
      saveTombstones([]);
      applyLocal([]);
      clearDirty();
      markSyncedOnce();
      setStatus("synced", "");
      return true;
    }
    const parsed = parsePayload(data.data);
    if (parsed.fatal) {
      setStatus("error", UNREADABLE);
      return false;
    }
    saveTombstones(parsed.payload.deletedIds);
    applyLocal(dropUntouchedDemos(parsed.payload.presentations));
    clearDirty();
    markSyncedOnce();
    setStatus("synced", "");
    return true;
  }

  async function reconcile(): Promise<void> {
    if (!userId || blocked()) return;
    if (!navigator.onLine) {
      if (isDirty()) setStatus("offline", "");
      return;
    }
    setStatus("syncing", "");
    const { data, error } = await client
      .from(TABLE)
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setStatus("error", "Couldn't read your cloud copy. Nothing was changed.");
      return;
    }

    sawCloud = true;
    const local = loadPresentations();

    if (!data) {
      if (isHeld() && !isDirty()) {
        setStatus("idle");
        return;
      }
      if (!hasRealTalk(local)) {
        markSyncedOnce();
        setStatus("synced", "");
        return;
      }
      await upload();
      return;
    }

    const parsed = parsePayload(data.data);
    if (parsed.fatal) {
      setStatus("error", UNREADABLE);
      return;
    }

    const cloud = parsed.payload;
    const pending = isDirty() || (!hasSyncedOnce() && hasRealTalk(local));
    if (pending) {
      const tombs = mergeTombstones(loadTombstones(), cloud.deletedIds);
      const merged = mergeTalks(local, cloud.presentations, tombs);
      if (!merged) {
        setStatus("error", UNREADABLE);
        return;
      }
      backupPresentations();
      saveTombstones(tombs);
      applyLocal(merged);
      await upload(cloud.preserved);
      return;
    }

    backupPresentations();
    saveTombstones(cloud.deletedIds);
    applyLocal(dropUntouchedDemos(cloud.presentations));
    clearDirty();
    markSyncedOnce();
    setStatus("synced", "");
  }

  const runReconcile = () => {
    if (blocked()) return;
    void enqueue(async () => {
      try {
        await reconcile();
      } catch {
        if (userId) setStatus("error", "Couldn't sync. Nothing else was changed.");
      }
    });
  };

  const schedule = () => {
    if (!userId || blocked()) return;
    window.clearTimeout(timer);
    if (!navigator.onLine) {
      setStatus("offline", "");
      return;
    }
    setStatus("syncing", "");
    timer = window.setTimeout(() => runReconcile(), 2000);
  };

  const flushKeepalive = () => {
    if (blocked()) return;
    if (!userId || !accessToken || !sawCloud || !isDirty()) return;
    if (!navigator.onLine) return;
    let body: CloudPayload;
    try {
      body = payloadFromLocal();
    } catch {
      return;
    }
    const json = JSON.stringify({ user_id: userId, data: body });
    if (new Blob([json]).size > KEEPALIVE_LIMIT) return;
    try {
      void writeRow(body, true).catch(() => {
        /* page is closing; the dirty flag stays for the next open */
      });
    } catch {
      /* page is closing; the dirty flag stays for the next open */
    }
  };

  const showAccountChoice = () => {
    window.clearTimeout(timer);
    syncPaused = false;
    accountChoice = true;
    setStatus(
      "idle",
      "This device has data from another account. Keep it separate (start from this account's cloud data; the local data is saved to the backup key first) or Merge it into this account."
    );
  };

  const onLocal = () => schedule();
  const onOnline = () => runReconcile();
  const onHide = () => {
    if (document.visibilityState === "hidden") flushKeepalive();
  };
  const onPageHide = () => flushKeepalive();

  window.addEventListener("scl:local-change", onLocal);
  window.addEventListener("online", onOnline);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("beforeunload", onPageHide);
  document.addEventListener("visibilitychange", onHide);

  const { data: authSub } = client.auth.onAuthStateChange((event, session) => {
    const oauthError = window.location.search.includes("error=");
    accessToken = session?.access_token ?? null;
    email = session?.user?.email ?? null;
    const nextId = session?.user?.id ?? null;
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT") {
      cleanOAuthParams();
    }
    if (!nextId) {
      userId = null;
      sawCloud = false;
      accountChoice = false;
      syncPaused = false;
      window.clearTimeout(timer);
      if (oauthError) setStatus("error", "Couldn't sign in. Please try again.");
      else setStatus("idle", notice);
      return;
    }
    userId = nextId;
    publish();
    if (event === "TOKEN_REFRESHED") return;
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
      if (otherAccountData(nextId)) {
        showAccountChoice();
        return;
      }
      syncPaused = false;
      accountChoice = false;
      setLastSyncUser(nextId);
      runReconcile();
    }
  });

  return {
    signIn: async () => {
      setStatus(status, "");
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (error) setStatus("error", "Couldn't sign in. Please try again.");
    },
    signOut: async () => {
      window.clearTimeout(timer);
      const { error } = await client.auth.signOut();
      if (error) {
        setStatus("error", "Couldn't sign out. Please try again.");
        return;
      }
      userId = null;
      email = null;
      accessToken = null;
      sawCloud = false;
      accountChoice = false;
      syncPaused = false;
      setStatus("idle", "");
    },
    deleteCloud: () => {
      window.clearTimeout(timer);
      return enqueue(async () => {
        if (!userId || blocked()) return;
        setStatus("syncing", "");
        try {
          const { error } = await client.from(TABLE).delete().eq("user_id", userId);
          if (error) throw error;
          clearDirty();
          setHold();
          setStatus("idle", "Cloud data deleted. The copy on this device stays.");
        } catch {
          setStatus("error", "Couldn't delete cloud data. Please try again.");
        }
      });
    },
    retry: () => {
      if (accountChoice || syncPaused) {
        showAccountChoice();
        return;
      }
      runReconcile();
    },
    keepSeparate: () => {
      void enqueue(async () => {
        accountChoice = false;
        syncPaused = false;
        backupPresentations();
        const ok = await adoptCloud();
        if (!ok) {
          showAccountChoice();
          return;
        }
        if (userId) setLastSyncUser(userId);
      });
    },
    mergeAccounts: () => {
      if (userId) setLastSyncUser(userId);
      accountChoice = false;
      syncPaused = false;
      runReconcile();
    },
    dismissAccountChoice: () => {
      accountChoice = false;
      syncPaused = true;
      window.clearTimeout(timer);
      setStatus("idle", "");
    },
    dispose: () => {
      disposed = true;
      window.clearTimeout(timer);
      authSub.subscription.unsubscribe();
      window.removeEventListener("scl:local-change", onLocal);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
      document.removeEventListener("visibilitychange", onHide);
    }
  };
}
