import { useCallback, useEffect, useState } from "react";
import type { Presentation, RunReport } from "../lib/types";
import { fmtClock, fmtOver } from "../lib/time";
import { usePresentationTimer } from "../hooks/usePresentationTimer";
import { useCues, type CueKind } from "../hooks/useCues";
import { useWakeLock } from "../hooks/useWakeLock";
import { CardsOverlay } from "../components/SosOverlay";
import { ClueDeckOverlay } from "../components/ClueDeckOverlay";
import { TransitionAlert } from "../components/TransitionAlert";

interface Props {
  presentation: Presentation;
  soundOn: boolean;
  onToggleSound: () => void;
  onEnd: (report: RunReport) => void;
}

export function PresentationMode({
  presentation,
  soundOn,
  onToggleSound,
  onEnd
}: Props) {
  useWakeLock(true);
  const { cue } = useCues(soundOn);
  const [openDeck, setOpenDeck] = useState<null | "clue" | "sos" | "qna">(null);
  const [flash, setFlash] = useState({ key: 0, name: "" });
  // Two-tap safety for End talk: first tap arms, second tap ends.
  const [endArmed, setEndArmed] = useState(false);
  useEffect(() => {
    if (!endArmed) return;
    const t = setTimeout(() => setEndArmed(false), 3000);
    return () => clearTimeout(t);
  }, [endArmed]);

  const onCue = useCallback(
    (kind: CueKind, nextIndex?: number) => {
      cue(kind);
      if (kind === "transition" && nextIndex !== undefined) {
        setFlash((f) => ({
          key: f.key + 1,
          name: presentation.sections[nextIndex]?.name || `Section ${nextIndex + 1}`
        }));
      }
    },
    [cue, presentation]
  );

  const { state, paused, pause, resume, buildReport } = usePresentationTimer(
    presentation,
    onCue
  );

  // Stage-light states for the current section timer.
  const sectionLight = state.overtime
    ? "text-over"
    : state.sectionRemaining <= 30
      ? "text-warn"
      : "text-cue";
  const bar = state.overtime
    ? "bg-over"
    : state.sectionRemaining <= 30
      ? "bg-warn"
      : "bg-cue";

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <TransitionAlert flashKey={flash.key} nextName={flash.name} />
      {openDeck === "sos" && (
        <CardsOverlay
          title="SOS · emergency"
          accent="sos"
          notes={presentation.sosNotes.filter((n) => (n.deck ?? "sos") === "sos")}
          emptyHint="No SOS cards yet. Add what to do when something goes wrong — in the editor."
          onClose={() => setOpenDeck(null)}
        />
      )}
      {openDeck === "clue" && (
        <ClueDeckOverlay
          title="Clue cards"
          accent="clue"
          cards={presentation.sosNotes.filter((n) => n.deck === "clue")}
          emptyHint="No clue cards yet. Create cards in the editor — on stage, tap one to show it full screen while you speak."
          onClose={() => setOpenDeck(null)}
        />
      )}
      {openDeck === "qna" && (
        <ClueDeckOverlay
          title="Q&A"
          accent="qna"
          cards={presentation.sosNotes.filter((n) => n.deck === "qna")}
          emptyHint="No Q&A cards yet. Add expected questions and your short answers in the editor."
          onClose={() => setOpenDeck(null)}
        />
      )}

      {/* Fixed top block: lamp + the big talk timer. Never moves. */}
      <header className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={paused ? "lamp opacity-30" : "lamp"} aria-hidden />
          <span
            className={`display text-xs font-semibold uppercase tracking-[0.2em] ${
              paused ? "text-dim" : "text-onair"
            }`}
          >
            {paused ? "Paused" : "On air"}
          </span>
        </div>
        <span className="digits text-sm text-dim">
          Section {state.index + 1} / {presentation.sections.length}
        </span>
      </header>

      <div className="shrink-0 text-center">
        {/* Full-bleed: stretch past the page padding so digits span the whole screen. */}
        <div className={`digits -mx-5 text-center text-[clamp(4.5rem,31vw,12rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-onair glow-blue ${paused ? "opacity-40" : ""}`}>
          {state.overtime
            ? fmtOver(state.overtimeSeconds)
            : fmtClock(state.totalRemaining)}
        </div>
        <div className="text-sm text-dim">
          {state.overtime ? "overtime — wrap up" : "left in the talk"}
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-panel-2">
          <div
            className={`h-full ${bar} transition-[width] duration-300`}
            style={{ width: `${state.totalProgress * 100}%` }}
          />
        </div>
      </div>

      {/* The route of the talk: done → current → ahead. One glance = where am I. */}
      <div className="mt-4 flex-1 space-y-2 overflow-y-auto pb-2">
        {presentation.sections.map((s, i) => {
          const status =
            i < state.index ? "done" : i === state.index ? "now" : "next";

          if (status === "now") {
            return (
              <div
                key={s.id}
                className="rounded-2xl border-2 border-onair bg-panel p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <h2 className="display min-w-0 text-xl font-extrabold leading-tight">
                    {s.name || `Section ${i + 1}`}
                  </h2>
                  <div
                    className={`digits shrink-0 text-6xl font-extrabold ${sectionLight}`}
                  >
                    {state.overtime ? "0:00" : fmtClock(state.sectionRemaining)}
                  </div>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-panel-2">
                  <div
                    className={`h-full ${bar} transition-[width] duration-300`}
                    style={{ width: `${state.sectionProgress * 100}%` }}
                  />
                </div>
                {s.notes && (
                  <p className="mt-2 whitespace-pre-wrap leading-snug text-ink/90">
                    {s.notes}
                  </p>
                )}
              </div>
            );
          }

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
                status === "done"
                  ? "border-transparent bg-panel/50 text-dim/60"
                  : "border-line bg-panel text-dim"
              }`}
            >
              <span
                className={`display min-w-0 truncate text-lg font-semibold ${
                  status === "done" ? "line-through decoration-1" : ""
                }`}
              >
                {status === "done" ? "✓ " : ""}
                {s.name || `Section ${i + 1}`}
              </span>
              <span className="digits ml-3 shrink-0 text-xl font-bold">
                {fmtClock(s.duration)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom controls: Pause, then three color-coded decks, then End/Sound. */}
      <div className="shrink-0 pt-2">
        <button
          onClick={() => (paused ? resume() : pause())}
          className={`display h-14 w-full rounded-xl border text-lg font-bold ${
            paused
              ? "border-ink bg-ink text-stage"
              : "border-ink/40 bg-panel text-ink"
          }`}
        >
          {paused ? "▶ Resume" : "❚❚ Pause"}
        </button>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button
            onClick={() => setOpenDeck("clue")}
            className="display h-16 rounded-xl border border-onair/60 bg-onair/10 font-bold text-onair"
          >
            Clue cards
          </button>
          <button
            onClick={() => setOpenDeck("sos")}
            className="display h-16 rounded-xl border border-sos/60 bg-sos/10 font-bold tracking-widest text-sos"
          >
            SOS
          </button>
          <button
            onClick={() => setOpenDeck("qna")}
            className="display h-16 rounded-xl border border-qna/60 bg-qna/10 font-bold text-qna"
          >
            Q&A
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (endArmed) onEnd(buildReport());
              else setEndArmed(true);
            }}
            className={`display h-16 rounded-xl border font-bold ${
              endArmed
                ? "border-onair text-onair"
                : "border-line bg-panel text-dim"
            }`}
          >
            {endArmed ? "Tap again to end" : "End talk"}
          </button>
          <button
            onClick={onToggleSound}
            aria-pressed={soundOn}
            className={`display h-16 rounded-xl border font-bold ${
              soundOn
                ? "border-onair/50 bg-panel text-onair"
                : "border-line bg-panel text-dim"
            }`}
          >
            {soundOn ? "Sound on" : "Sound off"}
          </button>
        </div>
      </div>
    </div>
  );
}
