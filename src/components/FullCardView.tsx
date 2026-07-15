import { useRef } from "react";
import type { SosNote } from "../lib/types";

interface Props {
  cards: SosNote[];
  openId: string;
  headClass: string;
  showCategory?: boolean;
  onNavigate: (id: string) => void;
  onBack: () => void;
}

/**
 * Full-screen card with sideways navigation:
 * swipe left/right (or tap the edge arrows) to flip through the deck
 * without going back to the list. Tap the middle to return.
 */
export function FullCardView({
  cards,
  openId,
  headClass,
  showCategory,
  onNavigate,
  onBack
}: Props) {
  const idx = cards.findIndex((c) => c.id === openId);
  const card = cards[idx];
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);

  if (!card) return null;

  const go = (d: -1 | 1) => {
    const next = cards[idx + d];
    if (next) onNavigate(next.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-stage"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        swiped.current = false;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) {
          swiped.current = true;
          go(dx < 0 ? 1 : -1);
        }
      }}
      onClick={() => {
        // A swipe also fires a click on some browsers — don't treat it as "back".
        if (swiped.current) {
          swiped.current = false;
          return;
        }
        onBack();
      }}
    >
      {/* Edge arrows for non-touch use; stopPropagation so they don't close. */}
      {idx > 0 && (
        <button
          aria-label="Previous card"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          className="absolute left-0 top-0 z-10 flex h-full w-14 items-center justify-start pl-2 text-2xl text-dim"
        >
          ‹
        </button>
      )}
      {idx < cards.length - 1 && (
        <button
          aria-label="Next card"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          className="absolute right-0 top-0 z-10 flex h-full w-14 items-center justify-end pr-2 text-2xl text-dim"
        >
          ›
        </button>
      )}

      <div
        key={card.id}
        className="card-swap flex flex-1 flex-col items-center justify-center px-14 text-center"
      >
        {showCategory && card.category && (
          <div className="display mb-2 text-xs font-bold uppercase tracking-[0.25em] text-dim">
            {card.category}
          </div>
        )}
        {card.title && (
          <div
            className={`display mb-4 text-sm font-bold uppercase tracking-[0.25em] ${headClass}`}
          >
            {card.title}
          </div>
        )}
        <div className="display max-h-[65dvh] overflow-y-auto whitespace-pre-wrap text-[clamp(1.5rem,6.5vw,3rem)] font-extrabold leading-tight">
          {card.text}
        </div>
      </div>

      <div className="pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center">
        <div className={`digits text-sm font-bold ${headClass}`}>
          {idx + 1} / {cards.length}
        </div>
        <div className="mt-1 text-xs text-dim">
          swipe sideways to change · tap to go back
        </div>
      </div>
    </div>
  );
}
