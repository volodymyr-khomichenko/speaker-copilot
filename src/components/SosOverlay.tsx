import type { SosNote } from "../lib/types";
import { SOS_CATEGORIES } from "../lib/types";

interface Props {
  title: string;
  accent: "clue" | "sos";
  notes: SosNote[];
  emptyHint: string;
  onClose: () => void;
}

/** Group notes by category, keeping the canonical category order first. */
function groupNotes(notes: SosNote[]): Array<[string, SosNote[]]> {
  const map = new Map<string, SosNote[]>();
  for (const cat of SOS_CATEGORIES) map.set(cat, []);
  for (const n of notes) {
    const cat = n.category?.trim() || "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(n);
  }
  return [...map.entries()].filter(([, xs]) => xs.length > 0);
}

/**
 * Full-screen card deck overlay. Opens with one tap, closes with one tap.
 * Blue accent = planned clue cards, red accent = SOS emergencies.
 */
export function CardsOverlay({ title, accent, notes, emptyHint, onClose }: Props) {
  const head = accent === "sos" ? "text-sos" : "text-onair";
  const border = accent === "sos" ? "border-sos/40" : "border-line";

  const groups = groupNotes(notes);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stage/97 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 text-left"
      >
        <span className={`display text-lg font-bold tracking-wide ${head}`}>
          {title}
        </span>
        <span className="text-sm text-dim">tap to close</span>
      </button>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-4">
        {groups.length === 0 && (
          <p className="pt-10 text-center text-dim">{emptyHint}</p>
        )}
        {groups.map(([cat, xs]) => (
          <section key={cat}>
            <h3
              className={`display mb-2 border-b border-line pb-1 text-xs font-bold uppercase tracking-[0.2em] ${head}`}
            >
              {cat}
            </h3>
            <div className="space-y-2">
              {xs.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-2xl border bg-panel p-4 ${border}`}
                >
                  {n.title && (
                    <div
                      className={`display mb-1 text-sm font-semibold uppercase tracking-wider ${head}`}
                    >
                      {n.title}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-lg leading-snug">
                    {n.text}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button
        onClick={onClose}
        className="display mx-5 mb-[max(1.25rem,env(safe-area-inset-bottom))] rounded-2xl bg-panel-2 py-4 text-lg font-bold"
      >
        Back to the talk
      </button>
    </div>
  );
}
