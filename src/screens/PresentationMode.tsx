import { useCallback, useEffect, useState } from "react";
import type { Presentation, RunReport } from "../lib/types";
import { CLUE_CATEGORIES, QNA_CATEGORIES, SOS_CATEGORIES, totalDuration, uid } from "../lib/types";
import { fmtClock, fmtLong, fmtOver } from "../lib/time";
import { usePresentationTimer } from "../hooks/usePresentationTimer";
import { useCues, type CueKind } from "../hooks/useCues";
import { useWakeLock } from "../hooks/useWakeLock";
import { CardsOverlay } from "../components/SosOverlay";
import { TransitionAlert } from "../components/TransitionAlert";
import { RunHistoryOverlay } from "../components/RunHistoryOverlay";

type Deck = "clue" | "sos" | "qna";

type Mode = "test" | "live";

interface Props {
  presentation: Presentation;
  soundOn: boolean;
  onToggleSound: () => void;
  onEnd: (report: RunReport, mode: Mode) => void;
  onExit: () => void;
  onEditTalk: () => void;
  onUpdate: (p: Presentation) => void;
}

/**
 * Two phases. Standby: review sections and decks, nothing is ticking.
 * Run: tap Start and the clock takes over.
 */
export function PresentationMode(props: Props) {
  const { presentation, onUpdate } = props;
  // The mode is chosen on the standby screen: test run or live session.
  const [mode, setMode] = useState<Mode | null>(null);
  const [openDeck, setOpenDeck] = useState<Deck | null>(null);

  const addCard = (
    deck: Deck,
    card: { title: string; text: string; category?: string }
  ) =>
    onUpdate({
      ...presentation,
      sosNotes: [...presentation.sosNotes, { id: uid(), deck, ...card }],
      updatedAt: Date.now()
    });

  const overlays = (
    <>
      {openDeck === "sos" && (
        <CardsOverlay
          title="SOS · emergency"
          accent="sos"
          categories={SOS_CATEGORIES}
          glyphs={{
            "You Lost Your Train of Thought": "✱",
            "You Need a Few Seconds to Think": "…",
            "You Don't Have the Information": "○",
            "You're Running Out of Time": "⏳",
            "Technical Issues": "⚙",
            "Difficult or Unexpected Situation": "▲"
          }}
          maxPerCategory={5}
          notes={presentation.sosNotes.filter((n) => (n.deck ?? "sos") === "sos")}
          emptyHint="No SOS cards yet. Add what to do when something goes wrong."
          onAdd={(c) => addCard("sos", c)}
          onClose={() => setOpenDeck(null)}
        />
      )}
      {openDeck === "clue" && (
        <CardsOverlay
          title="Clue cards"
          accent="clue"
          categories={CLUE_CATEGORIES}
          glyphs={{
            "Opening the Presentation": "▶",
            "Presenting Results": "◆",
            "Moving Between Sections": "⇄",
            "Discussing Challenges": "▲",
            "Looking Ahead": "✦",
            "Closing the Presentation": "■"
          }}
          notes={presentation.sosNotes.filter((n) => n.deck === "clue")}
          emptyHint="No clue cards yet. Pick a stage of the talk and add cards for it."
          onAdd={(c) => addCard("clue", c)}
          onClose={() => setOpenDeck(null)}
        />
      )}
      {openDeck === "qna" && (
        <CardsOverlay
          title="Q&A"
          accent="qna"
          categories={QNA_CATEGORIES}
          glyphs={{
            "When You Know the Answer": "✓",
            "When You Need a Moment to Think": "…",
            "When You Don't Know the Answer": "○",
            "When the Question Is Challenging": "▲",
            "When You Want to Redirect": "↪",
            "Closing an Answer": "■"
          }}
          notes={presentation.sosNotes.filter((n) => n.deck === "qna")}
          emptyHint="No Q&A cards yet. Pick an answer situation and add phrases for it."
          onAdd={(c) => addCard("qna", c)}
          onClose={() => setOpenDeck(null)}
        />
      )}
    </>
  );

  const deckButtons = (
    <div className="grid grid-cols-3 gap-2">
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
  );

  if (mode === null) {
    return (
      <Standby
        {...props}
        overlays={overlays}
        deckButtons={deckButtons}
        onStart={setMode}
      />
    );
  }
  return (
    <Run {...props} mode={mode} overlays={overlays} deckButtons={deckButtons} />
  );
}

/* ------------------------------------------------------------------ */

interface PhaseProps extends Props {
  overlays: React.ReactNode;
  deckButtons: React.ReactNode;
}

/** Pre-start screen: everything is visible, nothing is running. */
function Standby({
  presentation,
  overlays,
  deckButtons,
  onExit,
  onEditTalk,
  onUpdate,
  onStart
}: PhaseProps & { onStart: (mode: Mode) => void }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const total = totalDuration(presentation);
  const left = Math.max(
    0,
    (presentation.testRunGoal ?? 10) - (presentation.testRunsDone ?? 0)
  );
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {overlays}
      {historyOpen && (
        <RunHistoryOverlay
          runs={presentation.runs ?? []}
          goal={presentation.testRunGoal ?? 10}
          done={presentation.testRunsDone ?? 0}
          target={presentation.readyTarget ?? 4}
          onAddToGoal={(n) =>
            onUpdate({
              ...presentation,
              testRunGoal: (presentation.testRunGoal ?? 10) + n,
              updatedAt: Date.now()
            })
          }
          onUpdateRun={(id, ratings, comment) =>
            onUpdate({
              ...presentation,
              runs: (presentation.runs ?? []).map((r) =>
                r.id === id ? { ...r, ratings, comment } : r
              ),
              updatedAt: Date.now()
            })
          }
          onClose={() => setHistoryOpen(false)}
        />
      )}

      <header className="mb-3 flex items-center justify-between">
        <button onClick={onExit} className="text-dim">
          ← Back
        </button>
        <button onClick={onEditTalk} className="font-semibold text-onair">
          Edit talk
        </button>
      </header>

      <div className="shrink-0 text-center">
        <div className="display text-xs font-semibold uppercase tracking-[0.2em] text-dim">
          Ready
        </div>
        <h1 className="display mt-1 text-2xl font-extrabold leading-tight">
          {presentation.name || "Untitled talk"}
        </h1>
        <div className="digits mt-2 text-5xl font-extrabold text-onair">
          {fmtClock(total)}
        </div>
        <div className="text-sm text-dim">{fmtLong(total)} planned</div>
        <button
          onClick={() => setHistoryOpen(true)}
          className="mt-1 text-sm font-semibold text-dim underline underline-offset-4"
        >
          Run history · {(presentation.runs ?? []).length}
        </button>
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto pb-2">
        {presentation.sections.map((s, i) => (
          <div key={s.id} className="rounded-xl border border-line bg-panel px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="display min-w-0 truncate text-lg font-semibold">
                {s.name || `Section ${i + 1}`}
              </span>
              <span className="digits ml-3 shrink-0 text-xl font-bold text-dim">
                {fmtClock(s.duration)}
              </span>
            </div>
            {s.notes && (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-snug text-dim">
                {s.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="shrink-0 pt-2">
        {deckButtons}
        {/* Pick how to run it: rehearsal or the real thing. */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => onStart("test")}
            className="display flex h-16 flex-col items-center justify-center rounded-xl bg-onair font-extrabold text-stage"
          >
            <span className="text-lg leading-tight">▶ Start test run</span>
            <span className="text-xs font-semibold opacity-80">
              {left > 0 ? `${left} left to goal` : "goal done ✓"}
            </span>
          </button>
          <button
            onClick={() => onStart("live")}
            className="display flex h-16 flex-col items-center justify-center rounded-xl border-2 border-ink font-extrabold text-ink"
          >
            <span className="text-lg leading-tight">Start live session</span>
            <span className="text-xs font-semibold text-dim">on air</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** The running talk — mounted only after Start, so the clock begins here. */
function Run({
  presentation,
  mode,
  soundOn,
  onToggleSound,
  onEnd,
  overlays,
  deckButtons
}: PhaseProps & { mode: Mode }) {
  useWakeLock(true);
  const { cue } = useCues(soundOn);
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
          name:
            presentation.sections[nextIndex]?.name || `Section ${nextIndex + 1}`
        }));
      }
    },
    [cue, presentation]
  );

  const { state, paused, pause, resume, buildReport } = usePresentationTimer(
    presentation,
    onCue
  );

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
      {overlays}

      <header className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={paused ? "lamp opacity-30" : "lamp"} aria-hidden />
          <span
            className={`display text-xs font-semibold uppercase tracking-[0.2em] ${
              paused ? "text-dim" : "text-onair"
            }`}
          >
            {paused ? "Paused" : mode === "test" ? "Test run" : "On air"}
          </span>
        </div>
        <span className="digits text-sm text-dim">
          Section {state.index + 1} / {presentation.sections.length}
        </span>
      </header>

      <div className="shrink-0 text-center">
        {/* Full-bleed: stretch past the page padding so digits span the whole screen. */}
        <div
          className={`digits -mx-5 text-center text-[clamp(4.5rem,31vw,12rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-onair glow-blue ${paused ? "opacity-40" : ""}`}
        >
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
        <div className="mt-2">{deckButtons}</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (endArmed) onEnd(buildReport(), mode);
              else setEndArmed(true);
            }}
            className={`display h-16 rounded-xl border font-bold ${
              endArmed
                ? "border-onair text-onair"
                : "border-line bg-panel text-dim"
            }`}
          >
            {endArmed
              ? "Tap again to end"
              : mode === "test"
                ? "End test run"
                : "End live session"}
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
