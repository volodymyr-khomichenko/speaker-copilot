import type { Presentation } from "./types";
import { applyPercents, uid } from "./types";
import {
  BACKUP_KEY,
  addTombstone,
  clearHold,
  demoIdsInitialized,
  forgetUntouchedDemo,
  notifyLocalChange,
  recordUntouchedDemos,
  setDirty
} from "./syncMeta";

const KEY = "scl:presentations:v1";
const SEED_VERSION_KEY = "scl:seed-version";
/**
 * RELEASE MODE: this value is stable and must never be bumped again.
 * Devices still on a dev seed get one final reset to the demo talks;
 * after that, user data is never touched by releases.
 */
const SEED_VERSION = "release-1";

/** Older saved talks may lack totalTime/percent — patch them on load. */
function migrate(p: Presentation): Presentation {
  const total =
    p.totalTime || p.sections.reduce((a, s) => a + (s.duration || 0), 0) || 1200;
  const sections = p.sections.map((s) => ({
    ...s,
    percent:
      typeof s.percent === "number" && s.percent > 0
        ? s.percent
        : total > 0
          ? Math.round(((s.duration || 0) / total) * 1000) / 10
          : 0
  }));
  const sosNotes = (p.sosNotes ?? []).map((n) => ({
    ...n,
    deck: n.deck ?? ("sos" as const)
  }));
  return {
    ...p,
    totalTime: total,
    sections: applyPercents(total, sections),
    sosNotes,
    testRunGoal: p.testRunGoal ?? 10,
    testRunsDone: p.testRunsDone ?? 0,
    runs: p.runs ?? [],
    readyTarget: p.readyTarget ?? 4
  };
}

export function loadPresentations(): Presentation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Presentation[]).map(migrate) : [];
  } catch {
    return [];
  }
}

export function savePresentations(list: Presentation[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full or unavailable — the app keeps working in memory.
  }
}

/** A real edit: dirty for sync, and a demo id stops being "untouched". */
function commitUserList(list: Presentation[]): void {
  clearHold();
  setDirty();
  savePresentations(list);
  notifyLocalChange();
}

export function upsertPresentation(p: Presentation): Presentation[] {
  forgetUntouchedDemo(p.id);
  const list = loadPresentations();
  const i = list.findIndex((x) => x.id === p.id);
  const next = i === -1 ? [p, ...list] : list.map((x) => (x.id === p.id ? p : x));
  commitUserList(next);
  return next;
}

export function deletePresentation(id: string): Presentation[] {
  forgetUntouchedDemo(id);
  addTombstone(id);
  const next = loadPresentations().filter((x) => x.id !== id);
  commitUserList(next);
  return next;
}

/** Copy of local talks taken before a cloud snapshot replaces them. */
export function backupPresentations(): void {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw != null) localStorage.setItem(BACKUP_KEY, raw);
  } catch {
    /* the cloud copy is still applied */
  }
}

/**
 * Write a cloud (or merged) list without marking it dirty.
 * The upcoming demo, if it is still here, keeps its relative date.
 */
export function replacePresentationsFromCloud(list: Presentation[]): Presentation[] {
  const cleaned = list.map((p) => migrate(p));
  savePresentations(cleaned);
  return keepFutureDemoUpcoming(loadPresentations());
}

export function coercePresentation(raw: unknown): Presentation | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Presentation;
  if (typeof p.id !== "string" || !p.id || typeof p.updatedAt !== "number") return null;
  if (!Array.isArray(p.sections)) return null;
  try {
    return migrate(p);
  } catch {
    return null;
  }
}

/** Default split: Opening 15% / Main part 70% / Closing 15% of a 20-minute talk. */
export function newPresentation(): Presentation {
  const now = Date.now();
  const totalTime = 20 * 60;
  const sections = applyPercents(totalTime, [
    { id: uid(), name: "Opening", percent: 15, duration: 0, notes: "" },
    { id: uid(), name: "Main part", percent: 70, duration: 0, notes: "" },
    { id: uid(), name: "Closing", percent: 15, duration: 0, notes: "" }
  ]);
  return {
    id: uid(),
    name: "",
    totalTime,
    testRunGoal: 10,
    testRunsDone: 0,
    readyTarget: 4,
    sections,
    sosNotes: [
      {
        id: uid(),
        title: "Let me rephrase that.",
        text: "I want to make sure I explain it clearly.",
        category: "You Lost Your Train of Thought",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Let me come back to the main point.",
        text: "The key takeaway is...",
        category: "You Lost Your Train of Thought",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Let's take a step back.",
        text: "Here's the most important thing to remember.",
        category: "You Lost Your Train of Thought",
        deck: "sos"
      },
      {
        id: uid(),
        title: "That's a good question.",
        text: "Let me think about the best way to answer it.",
        category: "You Need a Few Seconds to Think",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Give me a moment.",
        text: "I want to make sure I answer accurately.",
        category: "You Need a Few Seconds to Think",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Let me gather my thoughts.",
        text: "I think there are a couple of important points here.",
        category: "You Need a Few Seconds to Think",
        deck: "sos"
      },
      {
        id: uid(),
        title: "I don't have that number with me.",
        text: "I'll verify it and follow up afterward.",
        category: "You Don't Have the Information",
        deck: "sos"
      },
      {
        id: uid(),
        title: "I don't want to guess.",
        text: "Let me confirm the details before answering.",
        category: "You Don't Have the Information",
        deck: "sos"
      },
      {
        id: uid(),
        title: "I don't have the exact data today.",
        text: "I'll make sure to send it after the meeting.",
        category: "You Don't Have the Information",
        deck: "sos"
      },
      {
        id: uid(),
        title: "In the interest of time...",
        text: "Let me focus on the key takeaway.",
        category: "You're Running Out of Time",
        deck: "sos"
      },
      {
        id: uid(),
        title: "I'll keep this brief.",
        text: "The most important point is...",
        category: "You're Running Out of Time",
        deck: "sos"
      },
      {
        id: uid(),
        title: "To stay on schedule...",
        text: "I'll summarize this section and move on.",
        category: "You're Running Out of Time",
        deck: "sos"
      },
      {
        id: uid(),
        title: "It looks like we're having a technical issue.",
        text: "Let's continue while it's being resolved.",
        category: "Technical Issues",
        deck: "sos"
      },
      {
        id: uid(),
        title: "While we fix that...",
        text: "Let me explain the main idea without the slide.",
        category: "Technical Issues",
        deck: "sos"
      },
      {
        id: uid(),
        title: "No problem.",
        text: "I'll continue from memory, and we'll come back to the visuals.",
        category: "Technical Issues",
        deck: "sos"
      },
      {
        id: uid(),
        title: "That's a valid concern.",
        text: "Let me explain how we're approaching it.",
        category: "Difficult or Unexpected Situation",
        deck: "sos"
      },
      {
        id: uid(),
        title: "I appreciate you bringing that up.",
        text: "Here's the context behind our decision.",
        category: "Difficult or Unexpected Situation",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Let's separate the facts from the assumptions.",
        text: "Here's what we know so far.",
        category: "Difficult or Unexpected Situation",
        deck: "sos"
      },
      {
        id: uid(),
        title: "That's a great question.",
        text: "Let me explain how we approached it.",
        category: "When You Know the Answer",
        deck: "qna"
      },
      {
        id: uid(),
        title: "From our perspective...",
        text: "Here's what the data tells us.",
        category: "When You Know the Answer",
        deck: "qna"
      },
      {
        id: uid(),
        title: "Based on what we've seen...",
        text: "This is the conclusion we reached.",
        category: "When You Know the Answer",
        deck: "qna"
      },
      {
        id: uid(),
        title: "Let me think about that for a second.",
        text: "I want to give you an accurate answer.",
        category: "When You Need a Moment to Think",
        deck: "qna"
      },
      {
        id: uid(),
        title: "That's an interesting point.",
        text: "Let me take a moment to organize my thoughts.",
        category: "When You Need a Moment to Think",
        deck: "qna"
      },
      {
        id: uid(),
        title: "Before I answer...",
        text: "I'd like to add a bit of context first.",
        category: "When You Need a Moment to Think",
        deck: "qna"
      },
      {
        id: uid(),
        title: "I don't have that information right now.",
        text: "I'll verify it and follow up afterward.",
        category: "When You Don't Know the Answer",
        deck: "qna"
      },
      {
        id: uid(),
        title: "That's a good question.",
        text: "I don't want to speculate, so I'll confirm the details.",
        category: "When You Don't Know the Answer",
        deck: "qna"
      },
      {
        id: uid(),
        title: "I can't answer that with confidence today.",
        text: "Let me check and get back to you.",
        category: "When You Don't Know the Answer",
        deck: "qna"
      },
      {
        id: uid(),
        title: "I understand the concern.",
        text: "Here's how we're looking at this situation.",
        category: "When the Question Is Challenging",
        deck: "qna"
      },
      {
        id: uid(),
        title: "That's a fair point.",
        text: "Let me explain the reasoning behind our decision.",
        category: "When the Question Is Challenging",
        deck: "qna"
      },
      {
        id: uid(),
        title: "I can see why you're asking.",
        text: "Here's the context that may help.",
        category: "When the Question Is Challenging",
        deck: "qna"
      },
      {
        id: uid(),
        title: "That's related, but...",
        text: "Let me first answer the main question.",
        category: "When You Want to Redirect",
        deck: "qna"
      },
      {
        id: uid(),
        title: "Before we go there...",
        text: "I'd like to finish this point because it's important.",
        category: "When You Want to Redirect",
        deck: "qna"
      },
      {
        id: uid(),
        title: "We'll definitely come back to that.",
        text: "For now, let's stay focused on this topic.",
        category: "When You Want to Redirect",
        deck: "qna"
      },
      {
        id: uid(),
        title: "Does that answer your question?",
        text: "I'm happy to expand if needed.",
        category: "Closing an Answer",
        deck: "qna"
      },
      {
        id: uid(),
        title: "Hopefully that provides some context.",
        text: "Let me know if you'd like me to go deeper.",
        category: "Closing an Answer",
        deck: "qna"
      },
      {
        id: uid(),
        title: "If you'd like more detail...",
        text: "We can discuss that after the presentation or during the Q&A.",
        category: "Closing an Answer",
        deck: "qna"
      },
      {
        id: uid(),
        title: "Start with the Why",
        text: "Explain why this report matters and what business outcome it supports.",
        category: "Opening the Presentation",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Set the Agenda",
        text: "Briefly outline what you'll cover so everyone knows what to expect.",
        category: "Opening the Presentation",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Create the Context",
        text: "Provide a quick overview of the reporting period and the business context.",
        category: "Opening the Presentation",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Big Picture First",
        text: "Start with the overall performance before diving into specific metrics.",
        category: "Presenting Results",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Highlight Key Wins",
        text: "Lead with the biggest achievements before discussing the details.",
        category: "Presenting Results",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Support with Data",
        text: "Share the key numbers, then explain what they mean for the business.",
        category: "Presenting Results",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Bridge to the Next Topic",
        text: "Wrap up the current section in one sentence and smoothly transition to the next.",
        category: "Moving Between Sections",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Connect the Story",
        text: "Show how the previous topic naturally leads into the next discussion.",
        category: "Moving Between Sections",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Pause and Refocus",
        text: "Briefly summarize before introducing the next key point.",
        category: "Moving Between Sections",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Address Challenges",
        text: "Be honest about what didn't work and briefly explain the key lesson learned.",
        category: "Discussing Challenges",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Explain the Root Cause",
        text: "Focus on why it happened instead of who was responsible.",
        category: "Discussing Challenges",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Share the Learning",
        text: "Turn every challenge into a clear takeaway and improvement opportunity.",
        category: "Discussing Challenges",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Focus on Business Impact",
        text: "Connect marketing results to business goals, not just marketing metrics.",
        category: "Looking Ahead",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Next Steps",
        text: "Clearly explain the priorities and actions for the next reporting period.",
        category: "Looking Ahead",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Future Opportunities",
        text: "Highlight where the biggest growth potential exists moving forward.",
        category: "Looking Ahead",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Key Takeaways",
        text: "Summarize the two or three most important messages from the presentation.",
        category: "Closing the Presentation",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Strong Closing",
        text: "End with a confident summary, thank the audience, and invite questions.",
        category: "Closing the Presentation",
        deck: "clue"
      },
      {
        id: uid(),
        title: "Open for Discussion",
        text: "Encourage feedback, questions, or suggestions for the next steps.",
        category: "Closing the Presentation",
        deck: "clue"
      }
    ],
    createdAt: now,
    updatedAt: now
  };
}

/** Demo run ratings in base-criteria order. */
function demoRatings(v: [number, number, number, number, number]) {
  return {
    "English pronunciation": v[0],
    "Clarity of delivery": v[1],
    Timing: v[2],
    Confidence: v[3],
    "Structure & flow": v[4]
  };
}

/** Live demo ratings: 5 base + 3 live-only criteria. */
function demoRatingsLive(
  v: [number, number, number, number, number, number, number, number]
) {
  return {
    ...demoRatings([v[0], v[1], v[2], v[3], v[4]]),
    "Goal achievement": v[5],
    "Audience engagement": v[6],
    "Q&A handling": v[7]
  };
}

const DAY = 86400000;
const isoDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

const FUTURE_DEMO_NAME = "Demo · Future Talk";
/** How far ahead the upcoming demo sits, counted from the day the app is opened. */
const FUTURE_DEMO_IN_DAYS = 14;

function futureDemoDate(from = new Date()): string {
  const d = new Date(from.getTime());
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + FUTURE_DEMO_IN_DAYS);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * While a talk is still named "Demo · Future Talk", each open puts its
 * talk day 14 days ahead of today — so the sample card stays Upcoming.
 * Rename it or delete it and it is left alone. Never recreated.
 * Does not bump SEED_VERSION and does not reset runs.
 */
function keepFutureDemoUpcoming(list: Presentation[]): Presentation[] {
  const nextDate = futureDemoDate();
  let changed = false;
  const next = list.map((p) => {
    if (p.name !== FUTURE_DEMO_NAME || p.eventDate === nextDate) return p;
    changed = true;
    return { ...p, eventDate: nextDate };
  });
  if (changed) savePresentations(next);
  return changed ? next : list;
}

/**
 * Demo talk #1 — an upcoming talk, mid-preparation: rehearsals in
 * progress, average still below the readiness target.
 */
function buildFutureTalk(): Presentation {
  const p = newPresentation();
  p.name = "Demo · Future Talk";
  p.eventDate = futureDemoDate();
  p.totalTime = 30 * 60;
  p.sections = applyPercents(p.totalTime, [
    {
      id: uid(),
      name: "Opening & hook",
      percent: 15,
      duration: 0,
      notes: "Why this talk matters. One-line agenda."
    },
    {
      id: uid(),
      name: "Core story",
      percent: 55,
      duration: 0,
      notes: "Three key points. Big picture first, then the data."
    },
    {
      id: uid(),
      name: "Case study",
      percent: 15,
      duration: 0,
      notes: "The example — key numbers are on a clue card."
    },
    {
      id: uid(),
      name: "Closing & CTA",
      percent: 15,
      duration: 0,
      notes: "Two takeaways. Invite questions."
    }
  ]);
  p.testRunGoal = 10;
  p.testRunsDone = 4;
  const runData: Array<
    [number, [number, number, number, number, number], number, string]
  > = [
    [2, [4, 4, 4, 4, 4], 30 * 60 + 40, "Getting close. Tighten the case study."],
    [4, [4, 3, 4, 4, 4], 31 * 60 + 20, "Better flow. Watch the pace in the core story."],
    [6, [3, 3, 4, 3, 4], 32 * 60 + 30, "Opening works now. Middle still drifts."],
    [8, [3, 3, 3, 3, 3], 34 * 60 + 10, "First full run. Way over time on the core story."]
  ];
  p.runs = runData.map(([d, r, actual, comment]) => ({
    id: uid(),
    mode: "test" as const,
    endedAt: Date.now() - d * DAY,
    plannedTotal: p.totalTime,
    actualTotal: actual,
    ratings: demoRatings(r),
    comment
  }));
  return p;
}

/**
 * Demo talk #2 — a finished talk: rehearsal goal completed, readiness
 * reached, and a live session with a final score above target.
 */
function buildPastTalk(): Presentation {
  const now = Date.now();
  const p = newPresentation();
  p.name = "Demo · Past Talk";
  p.eventDate = isoDate(now - 10 * DAY);
  p.totalTime = 20 * 60;
  p.testRunGoal = 10;
  p.testRunsDone = 10;
  const ratingsLadder: Array<[number, number, number, number, number]> = [
    [3, 3, 2, 3, 3],
    [3, 3, 3, 3, 3],
    [3, 3, 3, 4, 3],
    [3, 4, 3, 4, 4],
    [4, 3, 4, 4, 4],
    [4, 4, 4, 4, 4],
    [4, 4, 4, 4, 5],
    [4, 4, 5, 4, 5],
    [5, 4, 5, 4, 5],
    [5, 4, 5, 5, 5]
  ];
  const comments = [
    "Rough first run — over time everywhere.",
    "Cut two slides from the middle. Better.",
    "Confidence up. Timing still loose.",
    "Structure finally clicks.",
    "Pronunciation drills paid off.",
    "Solid, on time. Repeat tomorrow.",
    "Closing lands now.",
    "Nearly clean. One stumble in Q&A prep.",
    "Best run yet. Above target.",
    "Ready. Locking the script here."
  ];
  const actuals = [
    23 * 60 + 40, 22 * 60 + 50, 22 * 60 + 5, 21 * 60 + 30, 21 * 60,
    20 * 60 + 25, 20 * 60 + 15, 20 * 60 + 5, 19 * 60 + 58, 20 * 60 + 2
  ];
  p.runs = ratingsLadder.map((r, i) => ({
    id: uid(),
    mode: "test" as const,
    endedAt: now - (32 - i * 2) * DAY,
    plannedTotal: p.totalTime,
    actualTotal: actuals[i],
    ratings: demoRatings(r),
    comment: comments[i]
  }));
  // The live session itself — the headline result.
  p.runs.unshift({
    id: uid(),
    mode: "live",
    endedAt: now - 10 * DAY,
    plannedTotal: p.totalTime,
    actualTotal: 20 * 60 + 12,
    ratings: demoRatingsLive([5, 4, 5, 4, 5, 4, 5, 4]),
    comment:
      "Finished right on time. The room stayed with me — best delivery yet."
  });
  return p;
}

const DEMO_NAMES = new Set(["Demo · Future Talk", "Demo · Past Talk"]);

/**
 * Remember the seeded sample talks so they are not treated as user edits.
 * Once the key exists it is never rebuilt, so a later rename stays a real talk.
 */
function ensureUntouchedDemoIds(list: Presentation[]): void {
  if (demoIdsInitialized()) return;
  const ids = list
    .filter(
      (p) => DEMO_NAMES.has(p.name) && p.createdAt === p.updatedAt
    )
    .map((p) => p.id);
  recordUntouchedDemos(ids);
}

/**
 * Seed once: new devices (and devices still on a dev seed) get the two
 * demo talks. From release-1 on, user data is never reset by updates.
 */
export function loadPresentationsWithSeed(): Presentation[] {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(SEED_VERSION_KEY);
  } catch {
    /* storage unavailable */
  }
  if (stored !== SEED_VERSION) {
    const list = [buildFutureTalk(), buildPastTalk()];
    savePresentations(list);
    recordUntouchedDemos(list.map((p) => p.id));
    try {
      localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    } catch {
      /* storage unavailable */
    }
    return list;
  }
  const list = keepFutureDemoUpcoming(loadPresentations());
  ensureUntouchedDemoIds(list);
  return list;
}
