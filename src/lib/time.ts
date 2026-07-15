/** 754 -> "12:34"; negative values are clamped to 0. */
export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Overtime display: "+1:07". */
export function fmtOver(totalSeconds: number): string {
  return `+${fmtClock(totalSeconds)}`;
}

/** 754 -> "12 min 34 s" (report-friendly). */
export function fmtLong(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r} s`;
  if (r === 0) return `${m} min`;
  return `${m} min ${r} s`;
}

/** Signed diff for reports: "+0:40" / "−0:12" / "on time". */
export function fmtDiff(actual: number, planned: number): string {
  const d = Math.round(actual - planned);
  if (d === 0) return "on time";
  return d > 0 ? `+${fmtClock(d)}` : `−${fmtClock(-d)}`;
}
