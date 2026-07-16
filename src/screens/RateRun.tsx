import { useState } from "react";
import type { RunReport } from "../lib/types";
import { criteriaFor } from "../lib/types";
import { fmtClock } from "../lib/time";

interface Props {
  report: RunReport;
  mode: "test" | "live";
  onSave: (ratings: Record<string, number>, comment: string) => void;
  /** Skip for now — the run is saved unrated and can be rated from history. */
  onSkip: () => void;
}

/**
 * Post-run self-assessment: five criteria, five stars each, one note
 * about what to improve next time. Saved into the talk's run history.
 */
export function RateRun({ report, mode, onSave, onSkip }: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="mb-5 text-center">
        <div className="display text-xs font-semibold uppercase tracking-[0.2em] text-onair">
          {mode === "test" ? "Test run finished" : "Live session finished"}
        </div>
        <h1 className="display mt-1 text-2xl font-extrabold leading-tight">
          How did it go?
        </h1>
        <p className="digits mt-1 text-sm text-dim">
          Planned {fmtClock(report.plannedTotal)} · Actual{" "}
          {fmtClock(report.actualTotal)}
        </p>
      </header>

      <div className="space-y-3">
        {criteriaFor(mode).map((c) => (
          <div
            key={c}
            className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-4 py-3"
          >
            <span className="display min-w-0 font-bold leading-tight">{c}</span>
            <div className="flex shrink-0">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatings((r) => ({ ...r, [c]: n }))}
                  aria-label={`${c}: ${n} of 5`}
                  className={`px-0.5 text-2xl leading-none ${
                    (ratings[c] ?? 0) >= n ? "text-onair" : "text-line"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="mt-5 mb-1 block text-sm text-dim" htmlFor="run-comment">
        What to improve next time?
      </label>
      <textarea
        id="run-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="One or two thoughts while they're fresh…"
        rows={3}
        className="w-full resize-y rounded-2xl border border-line bg-panel px-4 py-3 outline-none focus:border-onair"
      />

      <div className="flex-1" />

      <button
        onClick={() => onSave(ratings, comment.trim())}
        className="display mt-6 w-full rounded-2xl bg-onair py-4 text-lg font-bold text-stage"
      >
        Save & back to talk
      </button>
      <button
        onClick={onSkip}
        className="mt-2 w-full rounded-2xl border border-line py-3 font-semibold text-dim"
      >
        Rate later
      </button>
    </div>
  );
}
