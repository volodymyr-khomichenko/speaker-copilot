import { useState } from "react";
import type { SosNote } from "../lib/types";
import { CardForm } from "./CardForm";
import { FullCardView } from "./FullCardView";

interface Props {
  title: string;
  accent: "clue" | "sos" | "qna";
  notes: SosNote[];
  emptyHint: string;
  /** Situation buttons on level 1, in this order. */
  categories: readonly string[];
  /** A recognizable glyph per situation — findable in one glance under stress. */
  glyphs: Record<string, string>;
  /** Max cards shown per situation (keeps the stress-time list short). */
  maxPerCategory?: number;
  onAdd?: (card: { title: string; text: string; category?: string }) => void;
  onClose: () => void;
}

/**
 * Two-level SOS. Level 1: six big situation buttons — pick what's
 * happening. Level 2: a short list (max 5) of rescue cards for it.
 * Tap a card to blow it up full screen; swipe sideways to flip through.
 */
export function CardsOverlay({
  title,
  accent,
  notes,
  emptyHint,
  categories: baseCategories,
  glyphs,
  maxPerCategory = Infinity,
  onAdd,
  onClose
}: Props) {
  const head =
    accent === "sos" ? "text-sos" : accent === "qna" ? "text-qna" : "text-onair";
  const frame =
    accent === "sos"
      ? "border-sos/40"
      : accent === "qna"
        ? "border-qna/40"
        : "border-line";
  const [situation, setSituation] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const categories: string[] = [...baseCategories];
  if (notes.some((n) => !categories.includes(n.category?.trim() || "Other")))
    categories.push("Other");

  const inSituation = (cat: string) =>
    notes
      .filter((n) => (n.category?.trim() || "Other") === cat)
      .slice(0, maxPerCategory);

  /* ---- Level 3: one card full screen, swipe within the situation ---- */
  if (situation && openId) {
    const cards = inSituation(situation);
    if (cards.some((c) => c.id === openId)) {
      return (
        <FullCardView
          cards={cards}
          openId={openId}
          headClass={head}
          showCategory
          onNavigate={setOpenId}
          onBack={() => setOpenId(null)}
        />
      );
    }
  }

  /* ---- Level 2: short list of rescue cards for the chosen situation ---- */
  if (situation) {
    const cards = inSituation(situation);
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-stage/98 backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <button onClick={() => setSituation(null)} className="text-dim">
            ‹ Situations
          </button>
          <span className={`display text-lg font-bold tracking-wide ${head}`}>
            {glyphs[situation] ?? ""} {situation}
          </span>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-5 pb-4">
          {cards.length === 0 && (
            <p className="pt-10 text-center text-dim">
              No cards for this situation yet — add one below.
            </p>
          )}
          {cards.map((n) => (
            <button
              key={n.id}
              onClick={() => setOpenId(n.id)}
              className={`w-full rounded-2xl border bg-panel p-4 text-left ${frame}`}
            >
              {n.title && (
                <div
                  className={`display mb-1 text-sm font-semibold uppercase tracking-wider ${head}`}
                >
                  {n.title}
                </div>
              )}
              <div className="whitespace-pre-wrap leading-snug">{n.text}</div>
              <div className="mt-2 text-xs text-dim">tap to show full screen</div>
            </button>
          ))}
          {onAdd && (
            <CardForm
              accentBorder={frame}
              onSave={(c) => onAdd({ ...c, category: situation })}
            />
          )}
        </div>

        <button
          onClick={() => setSituation(null)}
          className="display mx-5 mb-[max(1.25rem,env(safe-area-inset-bottom))] rounded-2xl bg-panel-2 py-4 text-lg font-bold"
        >
          ‹ Back to situations
        </button>
      </div>
    );
  }

  /* ---- Level 1: six big situation buttons ---- */
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

      <p className="px-5 pb-3 text-sm text-dim">What's happening?</p>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {notes.length === 0 && (
          <p className="pt-6 text-center text-dim">{emptyHint}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const count = notes.filter(
              (n) => (n.category?.trim() || "Other") === cat
            ).length;
            return (
              <button
                key={cat}
                onClick={() => setSituation(cat)}
                className={`flex h-28 flex-col items-center justify-center gap-1 rounded-2xl border bg-panel p-3 ${frame}`}
              >
                <span className={`text-2xl ${head}`}>{glyphs[cat] ?? "•"}</span>
                <span className="display text-center text-sm font-bold leading-tight">
                  {cat}
                </span>
                <span className="text-xs text-dim">
                  {count > 0 ? `${Math.min(count, maxPerCategory)} cards` : "empty"}
                </span>
              </button>
            );
          })}
        </div>
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
