import { useState } from "react";
import type { SosNote } from "../lib/types";
import { CardForm } from "./CardForm";
import { FullCardView } from "./FullCardView";

interface Props {
  title: string;
  accent: "clue" | "qna";
  cards: SosNote[];
  emptyHint: string;
  onAdd?: (card: { title: string; text: string }) => void;
  onClose: () => void;
}

/**
 * The speaker's own full-screen cards.
 * List view: tap a card to blow it up full screen.
 * Full-screen view: tap anywhere to go back to the list.
 */
export function ClueDeckOverlay({ title, accent, cards, emptyHint, onAdd, onClose }: Props) {
  const head = accent === "qna" ? "text-qna" : "text-onair";
  const frame = accent === "qna" ? "border-qna/40" : "border-onair/40";
  const [openId, setOpenId] = useState<string | null>(null);

  if (openId && cards.some((c) => c.id === openId)) {
    return (
      <FullCardView
        cards={cards}
        openId={openId}
        headClass={head}
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
        {onAdd && <CardForm accentBorder={frame} onSave={onAdd} />}
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
