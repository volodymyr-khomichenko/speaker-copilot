import { useEffect, useState } from "react";
import type { Presentation } from "../lib/types";
import { totalDuration } from "../lib/types";
import { fmtLong } from "../lib/time";
import { ShareOverlay } from "../components/ShareOverlay";

interface Props {
  presentations: Presentation[];
  onCreate: () => void;
  onEdit: (id: string) => void;
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PresentationList({
  presentations,
  onCreate,
  onEdit,
  onStart,
  onDelete
}: Props) {
  // Two-tap delete: first tap arms the button, second tap deletes.
  const [armedId, setArmedId] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const sharing = presentations.find((p) => p.id === shareId) ?? null;
  useEffect(() => {
    if (!armedId) return;
    const t = setTimeout(() => setArmedId(null), 3000);
    return () => clearTimeout(t);
  }, [armedId]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {sharing && (
        <ShareOverlay presentation={sharing} onClose={() => setShareId(null)} />
      )}
      <header className="mb-6 flex items-center gap-3">
        <span className="lamp" aria-hidden />
        <div>
          <h1 className="display text-xl font-extrabold tracking-tight">
            Speaker <span className="text-onair">Copilot</span>
          </h1>
          <p className="text-sm text-dim">Your copilot on stage. Timing first.</p>
        </div>
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
          return (
            <div key={p.id} className="rounded-2xl border border-line bg-panel p-4">
              <div className="mb-3">
                <div className="display text-lg font-bold leading-tight">
                  {p.name || "Untitled talk"}
                </div>
                <div className="mt-0.5 text-sm text-dim">
                  {p.sections.length} sections · {fmtLong(total)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onStart(p.id)}
                  disabled={p.sections.length === 0 || total === 0}
                  className="display flex-1 rounded-xl bg-onair py-3 font-bold text-stage disabled:opacity-40"
                >
                  Start talk
                </button>
                <button
                  onClick={() => onEdit(p.id)}
                  className="rounded-xl border border-line bg-panel-2 px-4 py-3 font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShareId(p.id)}
                  aria-label="Send to another device"
                  className="rounded-xl border border-line bg-panel-2 px-4 py-3 font-semibold text-onair"
                >
                  QR
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
    </div>
  );
}
