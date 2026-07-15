interface Props {
  /** Bump this key to replay the flash. */
  flashKey: number;
  nextName: string;
}

/**
 * A brief full-screen "light change" when a new section starts —
 * visible even in peripheral vision while the speaker faces the room.
 */
export function TransitionAlert({ flashKey, nextName }: Props) {
  if (flashKey === 0) return null;
  return (
    <div
      key={flashKey}
      className="stage-flash pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-onair/15"
    >
      <div className="rounded-2xl bg-panel-2/90 px-6 py-4 text-center shadow-xl">
        <div className="display text-xs font-semibold uppercase tracking-[0.2em] text-onair">
          Next section
        </div>
        <div className="display mt-1 text-2xl font-bold">{nextName}</div>
      </div>
    </div>
  );
}
