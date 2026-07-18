import { useEffect, useState } from "react";
import type { RunRecord } from "../lib/types";
import { criteriaFor } from "../lib/types";
import { fmtClock } from "../lib/time";

interface Props {
  runs: RunRecord[];
  goal: number;
  done: number;
  /** Average rating to reach before the talk feels safe. */
  target: number;
  onAddToGoal: (n: number) => void;
  onUpdateRun: (id: string, ratings: Record<string, number>, comment: string) => void;
  /** Removes a run; a deleted test run returns its attempt to the goal. */
  onDeleteRun: (id: string) => void;
  onClose: () => void;
}

/** Two-decimal average so runs can be compared precisely (★ 4.25 vs ★ 4.40). */
function avg(r: RunRecord): string | null {
  const vals = Object.values(r.ratings).filter((v) => v > 0);
  if (vals.length === 0) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

function overallOf(runs: RunRecord[]): string | null {
  const rated = runs.map(avg).filter((x): x is string => x !== null);
  if (rated.length === 0) return null;
  return (rated.reduce((a, b) => a + Number(b), 0) / rated.length).toFixed(2);
}

/**
 * Two separate histories: rehearsals (test runs, with the readiness
 * average and the goal) and the final live-session report(s).
 */
export function RunHistoryOverlay({
  runs,
  goal,
  done,
  target,
  onAddToGoal,
  onUpdateRun,
  onDeleteRun,
  onClose
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const byDate = (a: RunRecord, b: RunRecord) => b.endedAt - a.endedAt;
  const liveRuns = runs.filter((r) => r.mode === "live").sort(byDate);
  const testRuns = runs.filter((r) => r.mode !== "live").sort(byDate);

  const testOverall = overallOf(testRuns);
  const ready = testOverall !== null && Number(testOverall) >= target;

  const card = (r: RunRecord) => {
    const a = avg(r);
    const open = openId === r.id;
    return (
      <div key={r.id} className="rounded-2xl border border-line bg-panel p-4">
        <button
          onClick={() => setOpenId(open ? null : r.id)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span
            className={`display rounded-md px-2 py-0.5 text-xs font-bold uppercase ${
              r.mode === "live" ? "bg-sos/10 text-sos" : "bg-onair/10 text-onair"
            }`}
          >
            {r.mode === "live" ? "Live" : "Test"}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-dim">
            {new Date(r.endedAt).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
          <span
            className={`digits shrink-0 font-bold ${
              r.mode === "live" ? "text-sos" : "text-onair"
            }`}
          >
            {a === null ? "not rated" : `★ ${a}`}
          </span>
        </button>

        {!open && r.comment && (
          <p className="mt-2 truncate text-sm text-dim">{r.comment}</p>
        )}

        {open && (
          <RunDetail
            key={r.id}
            run={r}
            onSave={(ratings, comment) => {
              onUpdateRun(r.id, ratings, comment);
              setOpenId(null);
            }}
            onDelete={() => {
              onDeleteRun(r.id);
              setOpenId(null);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stage/98 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 text-left"
      >
        <span className="display text-lg font-bold tracking-wide text-onair">
          Results
        </span>
        <span className="text-sm text-dim">tap to close</span>
      </button>

      <div className="flex-1 space-y-2 overflow-y-auto px-5 pb-4">
        {/* ---- Live session: the headline result, separate from run history ---- */}
        {liveRuns.length > 0 && (
          <>
            <h3 className="display pt-1 text-xs font-bold uppercase tracking-[0.2em] text-sos">
              Live session
            </h3>
            {liveRuns.map((r) => {
              const a = avg(r);
              const good = a !== null && Number(a) >= target;
              const open = openId === r.id;
              const tone = good ? "text-qna" : "text-sos";
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border-2 p-5 ${
                    good ? "border-qna/60 bg-qna/5" : "border-sos/60 bg-sos/5"
                  }`}
                >
                  <button
                    onClick={() => setOpenId(open ? null : r.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="display text-sm font-bold uppercase tracking-wider text-dim">
                        Final talk score
                      </span>
                      <span className={`digits text-4xl font-extrabold ${tone}`}>
                        {a === null ? "not rated" : `★ ${a}`}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-dim">
                      {new Date(r.endedAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                      {a !== null &&
                        (good ? " · above target ✓" : " · below target")}
                    </div>
                    {!open && r.comment && (
                      <p className="mt-2 truncate text-sm text-dim">
                        {r.comment}
                      </p>
                    )}
                  </button>
                  {open && (
                    <RunDetail
                      key={r.id}
                      run={r}
                      onSave={(ratings, comment) => {
                        onUpdateRun(r.id, ratings, comment);
                        setOpenId(null);
                      }}
                      onDelete={() => {
                        onDeleteRun(r.id);
                        setOpenId(null);
                      }}
                    />
                  )}
                </div>
              );
            })}
            <div className="pt-2" />
          </>
        )}

        {/* ---- Rehearsals: test runs with readiness average and goal ---- */}
        <h3 className="display pt-1 text-xs font-bold uppercase tracking-[0.2em] text-onair">
          Run history · {testRuns.length} test runs
        </h3>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-dim">Average across test runs</span>
            <span
              className={`digits text-2xl font-extrabold ${
                testOverall === null
                  ? "text-dim"
                  : ready
                    ? "text-qna"
                    : "text-sos"
              }`}
            >
              {testOverall === null ? "—" : `★ ${testOverall}`}
            </span>
          </div>
          <div className="mt-0.5 text-right text-xs text-dim">
            readiness target ★ {target.toFixed(2)}
            {testOverall !== null && !ready && " — keep rehearsing"}
            {ready && " — you're ready ✓"}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
            <span className="text-sm text-dim">
              Goal:{" "}
              <span className="digits font-bold text-ink">
                {done} / {goal}
              </span>{" "}
              test runs
            </span>
            <span className="flex gap-2">
              <button
                onClick={() => onAddToGoal(1)}
                className="rounded-lg border border-onair/60 bg-onair/10 px-3 py-1.5 text-sm font-bold text-onair"
              >
                +1 run
              </button>
              <button
                onClick={() => onAddToGoal(5)}
                className="rounded-lg border border-onair/60 bg-onair/10 px-3 py-1.5 text-sm font-bold text-onair"
              >
                +5 runs
              </button>
            </span>
          </div>
        </div>

        {testRuns.length === 0 && (
          <p className="pt-6 text-center text-dim">
            No test runs yet. Finish one — your self-assessment will be saved
            here.
          </p>
        )}
        {testRuns.map(card)}
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

/** Expanded run: fully editable stars and comment — rate now or fix later. */
function RunDetail({
  run,
  onSave,
  onDelete
}: {
  run: RunRecord;
  onSave: (ratings: Record<string, number>, comment: string) => void;
  onDelete: () => void;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    ...run.ratings
  });
  const [comment, setComment] = useState(run.comment);
  // Two-tap delete: first tap arms, second tap removes the run.
  const [delArmed, setDelArmed] = useState(false);
  useEffect(() => {
    if (!delArmed) return;
    const t = setTimeout(() => setDelArmed(false), 3000);
    return () => clearTimeout(t);
  }, [delArmed]);
  const unrated = Object.values(run.ratings).filter((v) => v > 0).length === 0;

  return (
    <div className="mt-3 space-y-2">
      <div className="digits text-sm text-dim">
        Planned {fmtClock(run.plannedTotal)} · Actual {fmtClock(run.actualTotal)}
      </div>
      {unrated && (
        <p className="text-sm font-semibold text-onair">
          Not rated yet — rate it now:
        </p>
      )}
      {criteriaFor(run.mode).map((c) => (
        <div key={c} className="flex items-center justify-between text-sm">
          <span className="text-dim">{c}</span>
          <span className="shrink-0">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRatings((x) => ({ ...x, [c]: n }))}
                aria-label={`${c}: ${n} of 5`}
                className={`px-0.5 text-xl leading-none ${
                  (ratings[c] ?? 0) >= n ? "text-onair" : "text-line"
                }`}
              >
                ★
              </button>
            ))}
          </span>
        </div>
      ))}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What to improve next time?"
        rows={2}
        aria-label="Run comment"
        className="w-full resize-y rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-onair"
      />
      <button
        onClick={() => onSave(ratings, comment.trim())}
        className="display w-full rounded-xl bg-onair py-2.5 font-bold text-stage"
      >
        Save
      </button>
      <button
        onClick={() => {
          if (delArmed) onDelete();
          else setDelArmed(true);
        }}
        className={`w-full rounded-xl border py-2.5 text-sm font-bold ${
          delArmed
            ? "border-sos bg-sos text-stage"
            : "border-sos/60 bg-sos/10 text-sos"
        }`}
      >
        {delArmed
          ? "Tap again to delete this run"
          : run.mode === "test"
            ? "Delete run (returns the attempt to the goal)"
            : "Delete run"}
      </button>
    </div>
  );
}
