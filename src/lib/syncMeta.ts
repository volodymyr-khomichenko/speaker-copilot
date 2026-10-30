/** Local bookkeeping for optional cloud sync. Never uploaded as its own row. */

const EVER_KEY = "scl:sync-ever";
const DIRTY_KEY = "scl:sync-dirty";
const REV_KEY = "scl:sync-rev";
const USER_KEY = "scl:sync-user";
const HOLD_KEY = "scl:sync-hold";
const TOMB_KEY = "scl:sync-tombstones";
const DEMO_KEY = "scl:untouched-demo-ids";
export const BACKUP_KEY = "scl:presentations:backup-before-sync";

export interface Tombstone {
  id: string;
  deletedAt: number;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage full or unavailable */
  }
}

export function hasSyncedOnce(): boolean {
  return read(EVER_KEY) === "1";
}

export function markSyncedOnce(): void {
  write(EVER_KEY, "1");
}

export function isDirty(): boolean {
  return read(DIRTY_KEY) === "1";
}

/** Bumps on every user edit so an in-flight upload can see that local data moved. */
export function currentRevision(): number {
  const n = Number(read(REV_KEY));
  return Number.isFinite(n) ? n : 0;
}

export function setDirty(): void {
  write(DIRTY_KEY, "1");
  write(REV_KEY, String(currentRevision() + 1));
}

export function clearDirty(): void {
  try {
    localStorage.removeItem(DIRTY_KEY);
  } catch {
    /* ignore */
  }
}

/** After "Delete my cloud data", do not upload the old copy until the next edit. */
export function isHeld(): boolean {
  return read(HOLD_KEY) === "1";
}

export function setHold(): void {
  write(HOLD_KEY, "1");
}

export function clearHold(): void {
  try {
    localStorage.removeItem(HOLD_KEY);
  } catch {
    /* ignore */
  }
}

export function lastSyncUser(): string | null {
  const id = read(USER_KEY);
  return id && id.length > 0 ? id : null;
}

export function setLastSyncUser(id: string): void {
  write(USER_KEY, id);
}

export function loadTombstones(): Tombstone[] {
  try {
    const raw = read(TOMB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Tombstone[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t) => t && typeof t.id === "string" && typeof t.deletedAt === "number"
    );
  } catch {
    return [];
  }
}

export function saveTombstones(list: Tombstone[]): void {
  write(TOMB_KEY, JSON.stringify(list));
}

export function addTombstone(id: string): void {
  const next = loadTombstones().filter((t) => t.id !== id);
  next.push({ id, deletedAt: Date.now() });
  saveTombstones(next.slice(-200));
}

export function demoIdsInitialized(): boolean {
  return read(DEMO_KEY) !== null;
}

export function untouchedDemoIdSet(): Set<string> {
  try {
    const raw = read(DEMO_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function recordUntouchedDemos(ids: string[]): void {
  write(DEMO_KEY, JSON.stringify(ids));
}

export function forgetUntouchedDemo(id: string): void {
  if (!demoIdsInitialized()) return;
  const next = [...untouchedDemoIdSet()].filter((x) => x !== id);
  recordUntouchedDemos(next);
}

export function notifyLocalChange(): void {
  try {
    window.dispatchEvent(new Event("scl:local-change"));
  } catch {
    /* no window */
  }
}
