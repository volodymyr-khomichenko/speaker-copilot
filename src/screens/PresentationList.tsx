import { useEffect, useState } from "react";
import type { Presentation } from "../lib/types";
import { totalDuration } from "../lib/types";
import { fmtLong } from "../lib/time";

interface Props {
  presentations: Presentation[];
  onCreate: () => void;
  onEdit: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Whole days from today to the event date; null when no date is set. */
function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function countdown(d: number): { text: string; tone: string } {
  if (d > 1) return { text: `in ${d} days`, tone: d <= 7 ? "text-onair" : "text-dim" };
  if (d === 1) return { text: "tomorrow", tone: "text-onair" };
  if (d === 0) return { text: "today!", tone: "text-sos" };
  return { text: `${-d} days ago`, tone: "text-dim" };
}

export function PresentationList({
  presentations,
  onCreate,
  onEdit,
  onOpen,
  onDelete
}: Props) {
  // Two-tap delete: first tap arms the button, second tap deletes.
  const [armedId, setArmedId] = useState<string | null>(null);
  useEffect(() => {
    if (!armedId) return;
    const t = setTimeout(() => setArmedId(null), 3000);
    return () => clearTimeout(t);
  }, [armedId]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="mb-7 pt-2 text-center">
        {/* Logo mark — same stopwatch as the app icon. */}
        <svg
          viewBox="0 0 512 512"
          className="mx-auto h-16 w-16 rounded-[22%] shadow-lg shadow-onair/20"
          aria-hidden
        >
          <rect width="512" height="512" rx="112" fill="#0A0B0D" />
          <circle cx="256" cy="200" r="118" fill="none" stroke="#4D9FFF" strokeWidth="30" />
          <line x1="256" y1="200" x2="256" y2="122" stroke="#F5F7FA" strokeWidth="26" strokeLinecap="round" />
          <line x1="256" y1="200" x2="316" y2="236" stroke="#F5F7FA" strokeWidth="26" strokeLinecap="round" />
          <circle cx="256" cy="200" r="16" fill="#4D9FFF" />
          <rect x="136" y="372" width="240" height="66" rx="33" fill="#4D9FFF" />
          <circle cx="176" cy="405" r="14" fill="#0A0B0D" />
          <rect x="206" y="393" width="140" height="24" rx="12" fill="#0A0B0D" />
        </svg>
        <h1 className="display mt-3 text-2xl font-extrabold tracking-tight">
          Speaker <span className="text-onair">Copilot</span>
        </h1>
        <p className="mt-0.5 flex items-center justify-center gap-2 text-sm text-dim">
          <span className="lamp" aria-hidden />
          Your copilot on stage. Timing first.
        </p>
      </header>

      {presentations.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="display mb-2 text-lg font-bold">No talks yet</p>
          <p className="mb-6 max-w-xs text-dim">
            Create your first talk, split it into timed sections, and let the
            copilot run it on stage.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {presentations.map((p) => {
          const total = totalDuration(p);
          const days = daysUntil(p.eventDate);
          const canRun = p.sections.length > 0 && total > 0;
          return (
            <div key={p.id} className="rounded-2xl border border-line bg-panel p-4">
              <div className="mb-3">
                <div className="display text-lg font-bold leading-tight">
                  {p.name || "Untitled talk"}
                </div>
                <div className="mt-0.5 text-sm text-dim">
                  {p.sections.length} sections · {fmtLong(total)}
                </div>
                {days !== null && (
                  <div className="mt-1 text-sm">
                    <span className="text-dim">
                      Talk day:{" "}
                      {new Date(`${p.eventDate}T00:00:00`).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short" }
                      )}
                    </span>{" "}
                    <span className={`font-semibold ${countdown(days).tone}`}>
                      · {countdown(days).text}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onOpen(p.id)}
                  disabled={!canRun}
                  className="display flex-1 rounded-xl bg-onair py-3 font-bold text-stage disabled:opacity-40"
                >
                  Open talk
                </button>
                <button
                  onClick={() => onEdit(p.id)}
                  className="rounded-xl border border-line bg-panel-2 px-4 py-3 font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (armedId === p.id) {
                      onDelete(p.id);
                      setArmedId(null);
                    } else setArmedId(p.id);
                  }}
                  aria-label="Delete talk"
                  className={`rounded-xl border px-4 py-3 ${
                    armedId === p.id
                      ? "border-onair bg-panel-2 text-onair"
                      : "border-line bg-panel-2 text-dim"
                  }`}
                >
                  {armedId === p.id ? "Sure?" : "✕"}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      <button
        onClick={onCreate}
        className="display mt-6 rounded-2xl border-2 border-dashed border-line py-4 text-lg font-bold text-dim hover:text-ink"
      >
        + New talk
      </button>

      <footer className="mt-auto pt-8 text-center text-xs text-dim">
        © {new Date().getFullYear()} Speaker Copilot · built for live speakers
      </footer>
    </div>
  );
}
