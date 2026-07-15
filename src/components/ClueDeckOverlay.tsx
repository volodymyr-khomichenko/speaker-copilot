import { useState } from "react";
import type { SosNote } from "../lib/types";

interface Props {
  title: string;
  accent: "clue" | "qna";
  cards: SosNote[];
  emptyHint: string;
  onClose: () => void;
}

/**
 * The speaker's own full-screen cards.
 * List view: tap a card to blow it up full screen.
 * Full-screen view: tap anywhere to go back to the list.
 */
export function ClueDeckOverlay({ title, accent, cards, emptyHint, onClose }: Props) {
  const head = accent === "qna" ? "text-qna" : "text-onair";
  const frame = accent === "qna" ? "border-qna/40" : "border-onair/40";
  const [openId, setOpenId] = useState<string | null>(null);
  const open = cards.find((c) => c.id === openId);

  if (open) {
    return (
      <button
        onClick={() => setOpenId(null)}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stage px-6 text-center"
      >
        {open.title && (
          <div className={`display mb-4 text-sm font-bold uppercase tracking-[0.25em] ${head}`}>
            {open.title}
          </div>
        )}
        <div className="display max-h-[70dvh] overflow-y-auto whitespace-pre-wrap text-[clamp(1.75rem,7.5vw,3.5rem)] font-extrabold leading-tight">
          {open.text}
        </div>
        <div className="mt-8 text-sm text-dim">tap anywhere to go back</div>
      </button>
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

      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
        {cards.length === 0 && (
          <p className="pt-10 text-center text-dim">{emptyHint}</p>
        )}
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => setOpenId(c.id)}
            className={`w-full rounded-2xl border bg-panel p-5 text-left ${frame}`}
          >
            {c.title && (
              <div className={`display mb-1 text-sm font-semibold uppercase tracking-wider ${head}`}>
                {c.title}
              </div>
            )}
            <div className="display line-clamp-2 text-xl font-bold leading-snug">
              {c.text}
            </div>
            <div className="mt-2 text-xs text-dim">tap to show full screen</div>
          </button>
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
