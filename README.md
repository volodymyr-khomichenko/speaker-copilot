# Speaker Copilot

A stage copilot for live speakers. **Timing is the first feature — not the last.**

Speaker Copilot is a mobile-first PWA that runs your talk for you. You split the talk into timed sections before going on stage. During the talk the app auto-advances through sections, signals each transition with a short vibration, and shows your notes — completely hands-free. One tap opens SOS rescue notes if you lose your train of thought.

This is **not a teleprompter**. It's a pacer and a copilot.

## Vision

Every speaker who performs live (and, later, online) should have one app open on stage. Timing is the foundational feature; more copilot capabilities will be layered on top over time.

## Problem

During a live talk it's easy to lose track of time or structure. Teleprompters kill live delivery, plain timers show only total time, and switching notes manually on stage is extra cognitive load.

## MVP Features

- Talks with sections: name, duration, short notes
- Fully automatic section transitions — no tapping on stage
- Vibration + optional sound cues on each transition
- Warning cue 30 seconds before a section ends
- Big stage-readable timer with color states (green → amber → red)
- One-tap SOS screen with pre-written rescue notes
- Post-talk report: planned vs actual time, per section
- Screen stays awake during the talk (Wake Lock API)
- Works offline (PWA), installable on the home screen
- LocalStorage only — no login, no backend, no cloud
- Talk day with a countdown on the list — see how close the talk is
- Rehearsal goal: plan N test runs (default 10) and watch the counter go down with every finished run
- Separate small "Start live talk" — the big button is for rehearsals

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS v4
- vite-plugin-pwa
- Vercel (hosting)

## Getting Started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

Set your links and deploy the repo to Vercel — no configuration needed.

## Roadmap

- Configurable transition signals and vibration patterns
- Rehearsal mode with run history
- Export/import talks as JSON files
- Pause + emergency section skip (for Q&A mid-talk)
- Talk templates (20-min conference talk, 5-min pitch, 60-min workshop)
- Earbud-only audio cues (AirPods) so the audience hears nothing
- More copilot features beyond timing

## Positioning

A small AI-assisted side project built by a speaker to solve a real on-stage problem: keeping time without losing flow.
