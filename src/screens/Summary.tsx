import type { RunReport } from "../lib/types";
import { fmtClock, fmtDiff } from "../lib/time";

interface Props {
  report: RunReport;
  onDone: () => void;
}

export function Summary({ report, onDone }: Props) {
  const diffTotal = report.actualTotal - report.plannedTotal;
  const totalTone =
    diffTotal > 15 ? "text-over" : diffTotal < -15 ? "text-warn" : "text-cue";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="mb-6">
        <div className="display text-xs font-semibold uppercase tracking-[0.2em] text-onair">
          Talk report
        </div>
        <h1 className="display mt-1 text-2xl font-extrabold leading-tight">
          {report.presentationName || "Untitled talk"}
        </h1>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-panel p-4">
          <div className="text-sm text-dim">Planned</div>
          <div className="digits text-3xl font-extrabold">
            {fmtClock(report.plannedTotal)}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <div className="text-sm text-dim">Actual</div>
          <div className={`digits text-3xl font-extrabold ${totalTone}`}>
            {fmtClock(report.actualTotal)}
          </div>
          <div className={`text-sm ${totalTone}`}>
            {fmtDiff(report.actualTotal, report.plannedTotal)}
          </div>
        </div>
      </div>

      <h2 className="display mb-3 text-sm font-semibold uppercase tracking-wider text-dim">
        By section
      </h2>
      <div className="space-y-2">
        {report.sections.map((s, i) => {
          const d = s.actual - s.planned;
          const tone = d > 5 ? "text-over" : d < -5 ? "text-warn" : "text-cue";
          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3"
            >
              <div className="min-w-0">
                <div className="display truncate font-bold">
                  {s.name || `Section ${i + 1}`}
                </div>
                <div className="digits text-sm text-dim">
                  {fmtClock(s.actual)} of {fmtClock(s.planned)}
                </div>
              </div>
              <div className={`digits font-bold ${tone}`}>
                {fmtDiff(s.actual, s.planned)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1" />

      <button
        onClick={onDone}
        className="display mt-8 w-full rounded-2xl bg-onair py-4 text-lg font-bold text-stage"
      >
        Back to all talks
      </button>
    </div>
  );
}
