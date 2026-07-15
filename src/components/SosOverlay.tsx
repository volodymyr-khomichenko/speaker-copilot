import { useState } from "react";
import type { SosNote } from "../lib/types";
import { SOS_CATEGORIES } from "../lib/types";
import { CardForm } from "./CardForm";
import { FullCardView } from "./FullCardView";

interface Props {
  title: string;
  accent: "clue" | "sos";
  notes: SosNote[];
  emptyHint: string;
  onAdd?: (card: { title: string; text: string; category?: string }) => void;
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
 * Categorized card deck (used for SOS). Tap a card to blow it up full
 * screen; tap again to come back. New cards can be added right here.
 */
export function CardsOverlay({
  title,
  accent,
  notes,
  emptyHint,
  onAdd,
  onClose
}: Props) {
  const head = accent === "sos" ? "text-sos" : "text-onair";
  const border = accent === "sos" ? "border-sos/40" : "border-line";
  const [openId, setOpenId] = useState<string | null>(null);
  const groups = groupNotes(notes);
  // Swipe order = visual order: category by category.
  const ordered = groups.flatMap(([, xs]) => xs);

  if (openId && ordered.some((n) => n.id === openId)) {
    return (
      <FullCardView
        cards={ordered}
        openId={openId}
        headClass={head}
        showCategory
        onNavigate={setOpenId}
        onBack={() => setOpenId(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stage/98 backdrop-blur-sm">
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
                <button
                  key={n.id}
                  onClick={() => setOpenId(n.id)}
                  className={`w-full rounded-2xl border bg-panel p-4 text-left ${border}`}
                >
                  {n.title && (
                    <div
                      className={`display mb-1 text-sm font-semibold uppercase tracking-wider ${head}`}
                    >
                      {n.title}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-snug">
                    {n.text}
                  </div>
                  <div className="mt-2 text-xs text-dim">
                    tap to show full screen
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
        {onAdd && (
          <CardForm
            accentBorder={accent === "sos" ? "border-sos/40" : "border-line"}
            withCategory
            onSave={onAdd}
          />
        )}
      </div>

      <button
        onClick={onClose}
        className="display mx-5 mb-[max(1.25rem,env(safe-area-inset-bottom))] rounded-2xl bg-panel-2 py-4 text-lg font-bold"
      >
        Close
      </button>
    </div>
  );
}
