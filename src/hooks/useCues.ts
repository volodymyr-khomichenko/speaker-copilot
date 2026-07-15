import { useCallback, useRef } from "react";

export type CueKind = "transition" | "warning" | "finish";

const PATTERNS: Record<CueKind, number[]> = {
  // Section change: two firm pulses — unmistakable in a hand or on a lectern.
  transition: [140, 90, 140],
  // 30 s left in section: one short nudge.
  warning: [70],
  // Planned time is up: long triple.
  finish: [220, 110, 220, 110, 220]
};

/**
 * Haptic + optional audio cues.
 * Audio uses a tiny WebAudio beep — no assets, works offline.
 * The AudioContext is created lazily on first use (requires a user gesture,
 * which "Start talk" provides).
 */
export function useCues(soundOn: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const beep = useCallback((times: number, freq: number) => {
    try {
      ctxRef.current ??= new AudioContext();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      for (let i = 0; i < times; i++) {
        const t0 = ctx.currentTime + i * 0.22;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.18);
      }
    } catch {
      // Audio unavailable — vibration still fires.
    }
  }, []);

  const cue = useCallback(
    (kind: CueKind) => {
      try {
        navigator.vibrate?.(PATTERNS[kind]);
      } catch {
        // Vibration unsupported (e.g. iOS Safari) — visual + audio cues remain.
      }
      if (soundOn) {
        if (kind === "transition") beep(2, 880);
        if (kind === "warning") beep(1, 660);
        if (kind === "finish") beep(3, 523);
      }
    },
    [soundOn, beep]
  );

  /** Call from a user gesture (Start button) to unlock audio on mobile. */
  const unlockAudio = useCallback(() => {
    try {
      ctxRef.current ??= new AudioContext();
      if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    } catch {
      /* noop */
    }
  }, []);

  return { cue, unlockAudio };
}
