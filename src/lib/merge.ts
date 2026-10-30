import type { Presentation } from "./types";
import { untouchedDemoIdSet, type Tombstone } from "./syncMeta";

export interface CloudPayload {
  version: 1;
  presentations: Presentation[];
  deletedIds: Tombstone[];
  /** Talks this app could not read. Written back unchanged so they are not deleted. */
  preserved?: unknown[];
}

export function mergeTombstones(a: Tombstone[], b: Tombstone[]): Tombstone[] {
  const map = new Map<string, number>();
  for (const t of [...a, ...b]) {
    if (!t || typeof t.id !== "string" || typeof t.deletedAt !== "number") continue;
    const prev = map.get(t.id) ?? 0;
    if (t.deletedAt > prev) map.set(t.id, t.deletedAt);
  }
  return [...map.entries()].map(([id, deletedAt]) => ({ id, deletedAt }));
}

function validTalk(p: Presentation): boolean {
  return Boolean(p && typeof p.id === "string" && p.id && typeof p.updatedAt === "number");
}

/** Drop untouched demo talks once any real talk is in the list. */
export function dropUntouchedDemos(list: Presentation[]): Presentation[] {
  const demos = untouchedDemoIdSet();
  if (demos.size === 0) return list;
  const real = list.filter((p) => !demos.has(p.id));
  return real.length > 0 ? real : list;
}

export function hasRealTalk(list: Presentation[]): boolean {
  const demos = untouchedDemoIdSet();
  return list.some((p) => !demos.has(p.id));
}

/**
 * Match talks by id. The later updatedAt wins. A tombstone removes a talk
 * when its deletedAt is at least that talk's updatedAt. Returns null when
 * the data is too broken to merge safely.
 */
export function mergeTalks(
  local: Presentation[],
  cloud: Presentation[],
  tombstones: Tombstone[]
): Presentation[] | null {
  if (!Array.isArray(local) || !Array.isArray(cloud)) return null;
  const tomb = new Map<string, number>();
  for (const t of tombstones) {
    if (!t || typeof t.id !== "string" || typeof t.deletedAt !== "number") return null;
    tomb.set(t.id, Math.max(tomb.get(t.id) ?? 0, t.deletedAt));
  }
  const byId = new Map<string, Presentation>();
  const consider = (p: Presentation): boolean => {
    if (!validTalk(p)) return false;
    const deletedAt = tomb.get(p.id);
    if (deletedAt !== undefined && deletedAt >= p.updatedAt) return true;
    const prev = byId.get(p.id);
    if (!prev || p.updatedAt >= prev.updatedAt) byId.set(p.id, p);
    return true;
  };
  for (const p of cloud) if (!consider(p)) return null;
  for (const p of local) if (!consider(p)) return null;
  const merged = dropUntouchedDemos([...byId.values()]);
  merged.sort((a, b) => b.updatedAt - a.updatedAt);
  return merged;
}
