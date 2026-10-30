import type { Presentation } from "./types";
import {
  backupPresentations,
  coercePresentation,
  loadPresentations,
  replacePresentationsFromCloud
} from "./storage";
import {
  clearDirty,
  hasSyncedOnce,
  isDirty,
  isHeld,
  loadTombstones,
  markSyncedOnce,
  saveTombstones,
  setHold
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

export type SyncStatus = "idle" | "synced" | "syncing" | "offline" | "error";

export interface CloudSnapshot {
  email: string | null;
  status: SyncStatus;
  notice: string;
}

export interface CloudHandle {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteCloud: () => Promise<void>;
  retry: () => void;
  dispose: () => void;
}

interface Handlers {
  onPresentations: (list: Presentation[]) => void;
  onSnapshot: (snapshot: CloudSnapshot) => void;
}

function parsePayload(data: unknown): CloudPayload | null {
  if (!data || typeof data !== "object") return null;
  const row = data as { version?: unknown; presentations?: unknown; deletedIds?: unknown };
  if (row.version !== 1 || !Array.isArray(row.presentations)) return null;
  const presentations: Presentation[] = [];
  for (const item of row.presentations) {
    const talk = coercePresentation(item);
    if (!talk) return null;
    presentations.push(talk);
  }
  const deletedIds = Array.isArray(row.deletedIds)
    ? row.deletedIds.filter(
        (t): t is { id: string; deletedAt: number } =>
          Boolean(t) &&
          typeof (t as { id?: unknown }).id === "string" &&
          typeof (t as { deletedAt?: unknown }).deletedAt === "number"
      )
    : [];
  return { version: 1, presentations, deletedIds };
}

function payloadFromLocal(): CloudPayload {
  const local = loadPresentations();
  const presentations = hasRealTalk(local) ? dropUntouchedDemos(local) : [];
  return { version: 1, presentations, deletedIds: loadTombstones() };
}

function cleanOAuthParams(): void {
  try {
    const url = new URL(window.location.href);
    const hasCode = url.searchParams.has("code");
    const hasError = url.searchParams.has("error");
    const hasToken = url.hash.includes("access_token");
    if (!hasCode && !hasError && !hasToken) return;
    window.history.replaceState({}, "", url.pathname);
  } catch {
    /* ignore */
  }
}

/**
 * Optional sync. Local talks stay the source of truth on this device.
 * A failed read never uploads and never overwrites local or cloud data.
 */
export function startCloud(handlers: Handlers): CloudHandle {
  const supabase = supabaseBrowser();
  if (!supabase) {
    return {
      signIn: async () => {},
      signOut: async () => {},
      deleteCloud: async () => {},
      retry: () => {},
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
  let sawCloud = false;
  let timer = 0;
  let chain: Promise<void> = Promise.resolve();
  let disposed = false;

  const publish = () => {
    if (disposed) return;
    handlers.onSnapshot({ email, status, notice });
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

  async function upload(keepalive: boolean): Promise<void> {
    const local = loadPresentations();
    const tombs = loadTombstones();
    if (!hasRealTalk(local) && tombs.length === 0) {
      setStatus("synced", "");
      return;
    }
    if (isHeld() && !isDirty()) {
      setStatus("synced", "");
      return;
    }
    const body = payloadFromLocal();
    await writeRow(body, keepalive);
    clearDirty();
    markSyncedOnce();
    if (hasRealTalk(local)) applyLocal(body.presentations);
    setStatus("synced", "");
  }

  async function reconcile(): Promise<void> {
    if (!userId) return;
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
      await upload(false);
      return;
    }

    const cloud = parsePayload(data.data);
    const pending =
      isDirty() || (!hasSyncedOnce() && hasRealTalk(local));
    if (!cloud) {
      if (pending) {
        await upload(false);
        return;
      }
      setStatus("error", "Couldn't read your cloud copy. Nothing was changed.");
      return;
    }

    if (pending) {
      const tombs = mergeTombstones(loadTombstones(), cloud.deletedIds);
      const merged = mergeTalks(local, cloud.presentations, tombs);
      if (!merged) {
        await upload(false);
        return;
      }
      saveTombstones(tombs);
      applyLocal(merged);
      await upload(false);
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
    void enqueue(async () => {
      try {
        await reconcile();
      } catch {
        if (userId) setStatus("error", "Couldn't sync. Nothing else was changed.");
      }
    });
  };

  const schedule = () => {
    if (!userId) return;
    window.clearTimeout(timer);
    if (!navigator.onLine) {
      setStatus("offline", "");
      return;
    }
    setStatus("syncing", "");
    timer = window.setTimeout(() => runReconcile(), 2000);
  };

  const flushKeepalive = () => {
    if (!userId || !accessToken || !sawCloud || !isDirty()) return;
    if (!navigator.onLine) return;
    try {
      void writeRow(payloadFromLocal(), true).catch(() => {
        setStatus("error", "Couldn't sync. Nothing else was changed.");
      });
    } catch {
      setStatus("error", "Couldn't sync. Nothing else was changed.");
    }
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
      window.clearTimeout(timer);
      if (oauthError) setStatus("error", "Couldn't sign in. Please try again.");
      else setStatus("idle", notice);
      return;
    }
    userId = nextId;
    publish();
    if (event === "TOKEN_REFRESHED") return;
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN") runReconcile();
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
      setStatus("idle", "");
    },
    deleteCloud: () => {
      window.clearTimeout(timer);
      return enqueue(async () => {
        if (!userId) return;
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
    retry: () => runReconcile(),
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
