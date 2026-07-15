import { useEffect, useMemo, useRef, useState } from "react";
import type { Presentation, RunReport, SectionResult } from "../lib/types";
import { totalDuration } from "../lib/types";
import type { CueKind } from "./useCues";

const TICK_MS = 200;
const WARNING_BEFORE = 30; // seconds before a section ends

export interface TimerState {
  /** Seconds since Start. */
  elapsed: number;
  /** Index of the current section (stays on the last one in overtime). */
  index: number;
  sectionElapsed: number;
  sectionRemaining: number;
  totalRemaining: number;
  /** True once the whole planned time is used up. */
  overtime: boolean;
  overtimeSeconds: number;
  /** 0..1 progress within the current section (caps at 1). */
  sectionProgress: number;
  /** 0..1 progress of the whole talk (caps at 1). */
  totalProgress: number;
}

/**
 * Drives a live talk. Time is derived from Date.now() against a fixed start
 * timestamp, so background-tab throttling can never make the clock drift.
 * Sections advance automatically; the hook fires cues through `onCue`.
 */
export function usePresentationTimer(
  presentation: Presentation,
  onCue: (kind: CueKind, nextIndex?: number) => void
) {
  const [startedAt] = useState(() => Date.now());
  const [nowMs, setNowMs] = useState(startedAt);
  // Pause: freeze the clock at pausedAt; pausedAccum collects finished pauses.
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedAccum, setPausedAccum] = useState(0);

  const durations = useMemo(
    () => presentation.sections.map((s) => s.duration),
    [presentation]
  );
  const boundaries = useMemo(() => {
    // Cumulative end time of each section, in seconds from start.
    const out: number[] = [];
    let acc = 0;
    for (const d of durations) {
      acc += d;
      out.push(acc);
    }
    return out;
  }, [durations]);
  const total = useMemo(() => totalDuration(presentation), [presentation]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const effectiveNow = pausedAt ?? nowMs;
  const elapsed = Math.max(0, (effectiveNow - startedAt - pausedAccum) / 1000);

  const state: TimerState = useMemo(() => {
    let index = boundaries.findIndex((b) => elapsed < b);
    const overtime = index === -1;
    if (overtime) index = durations.length - 1;
    const sectionStart = index === 0 ? 0 : boundaries[index - 1];
    const sectionElapsed = elapsed - sectionStart;
    const sectionRemaining = durations[index] - sectionElapsed;
    return {
      elapsed,
      index,
      sectionElapsed,
      sectionRemaining: Math.max(0, sectionRemaining),
      totalRemaining: Math.max(0, total - elapsed),
      overtime,
      overtimeSeconds: Math.max(0, elapsed - total),
      sectionProgress: Math.min(1, sectionElapsed / Math.max(1, durations[index])),
      totalProgress: Math.min(1, elapsed / Math.max(1, total))
    };
  }, [elapsed, boundaries, durations, total]);

  // --- Cues: fire exactly once per event ---------------------------------
  const prevIndex = useRef(0);
  const warnedFor = useRef(new Set<number>());
  const finishFired = useRef(false);

  useEffect(() => {
    if (state.index !== prevIndex.current && !state.overtime) {
      prevIndex.current = state.index;
      onCue("transition", state.index);
    }
  }, [state.index, state.overtime, onCue]);

  useEffect(() => {
    const isLast = state.index === durations.length - 1;
    if (
      !state.overtime &&
      !isLast &&
      state.sectionRemaining <= WARNING_BEFORE &&
      state.sectionRemaining > 0 &&
      !warnedFor.current.has(state.index)
    ) {
      warnedFor.current.add(state.index);
      onCue("warning");
    }
  }, [state.sectionRemaining, state.index, state.overtime, durations.length, onCue]);

  useEffect(() => {
    if (state.overtime && !finishFired.current) {
      finishFired.current = true;
      onCue("finish");
    }
  }, [state.overtime, onCue]);

  const pause = () => setPausedAt((p) => p ?? Date.now());
  const resume = () =>
    setPausedAt((p) => {
      if (p !== null) setPausedAccum((a) => a + Date.now() - p);
      return null;
    });

  /** Build the post-talk report at the moment the speaker taps End. */
  function buildReport(): RunReport {
    const endElapsed = Math.max(
      0,
      ((pausedAt ?? Date.now()) - startedAt - pausedAccum) / 1000
    );
    const sections: SectionResult[] = presentation.sections.map((s, i) => {
      const start = i === 0 ? 0 : boundaries[i - 1];
      const isLast = i === presentation.sections.length - 1;
      const rawActual = isLast
        ? Math.max(0, endElapsed - start) // last section absorbs overtime
        : Math.min(s.duration, Math.max(0, endElapsed - start));
      return { name: s.name, planned: s.duration, actual: Math.round(rawActual) };
    });
    return {
      presentationId: presentation.id,
      presentationName: presentation.name,
      startedAt,
      endedAt: Date.now(),
      plannedTotal: total,
      actualTotal: Math.round(endElapsed),
      sections
    };
  }

  return { state, paused: pausedAt !== null, pause, resume, buildReport };
}
