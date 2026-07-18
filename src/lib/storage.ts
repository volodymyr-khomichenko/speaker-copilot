import type { Presentation } from "./types";
import { applyPercents, uid } from "./types";

const KEY = "scl:presentations:v1";
const SEED_VERSION_KEY = "scl:seed-version";
/**
 * DEV MODE: bump this on every release to wipe on-device talks and re-seed
 * the fresh default talk. Remove this reset before real production use.
 */
const SEED_VERSION = "33";

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

export function upsertPresentation(p: Presentation): Presentation[] {
  const list = loadPresentations();
  const i = list.findIndex((x) => x.id === p.id);
  const next = i === -1 ? [p, ...list] : list.map((x) => (x.id === p.id ? p : x));
  savePresentations(next);
  return next;
}

export function deletePresentation(id: string): Presentation[] {
  const next = loadPresentations().filter((x) => x.id !== id);
  savePresentations(next);
  return next;
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

/** Demo run ratings in base-criteria order, showing week-over-week growth. */
function demoRatings(v: [number, number, number, number, number]) {
  return {
    "English pronunciation": v[0],
    "Clarity of delivery": v[1],
    Timing: v[2],
    Confidence: v[3],
    "Structure & flow": v[4]
  };
}

/**
 * The default talk every device starts with — including five finished
 * demo test runs, so the run-history logic explains itself.
 */
function seedTalk(): Presentation {
  const p = newPresentation();
  p.name = "Warsaw";
  p.eventDate = "2026-07-27";
  p.totalTime = 45 * 60;
  p.sections = applyPercents(p.totalTime, p.sections);
  p.testRunsDone = 5;
  const day = 86400000;
  const now = Date.now();
  p.runs = [
    {
      id: uid(),
      mode: "test",
      endedAt: now - 2 * day,
      plannedTotal: p.totalTime,
      actualTotal: 45 * 60 + 10,
      ratings: demoRatings([4, 4, 5, 4, 5]),
      comment: "Almost there. Polish the closing and the final call to action."
    },
    {
      id: uid(),
      mode: "test",
      endedAt: now - 4 * day,
      plannedTotal: p.totalTime,
      actualTotal: 44 * 60 + 52,
      ratings: demoRatings([4, 4, 4, 4, 4]),
      comment: "Solid run. Confidence is growing, timing finally on point."
    },
    {
      id: uid(),
      mode: "test",
      endedAt: now - 6 * day,
      plannedTotal: p.totalTime,
      actualTotal: 45 * 60 + 45,
      ratings: demoRatings([4, 3, 4, 3, 4]),
      comment: "Transitions are smoother. Work on pronunciation of key terms."
    },
    {
      id: uid(),
      mode: "test",
      endedAt: now - 8 * day,
      plannedTotal: p.totalTime,
      actualTotal: 47 * 60 + 5,
      ratings: demoRatings([3, 3, 3, 3, 4]),
      comment: "Better pace, still stumbling between sections."
    },
    {
      id: uid(),
      mode: "test",
      endedAt: now - 10 * day,
      plannedTotal: p.totalTime,
      actualTotal: 49 * 60 + 12,
      ratings: demoRatings([3, 3, 2, 3, 3]),
      comment: "Ran way over time. Need to cut the middle section."
    }
  ];
  return p;
}

/**
 * DEV MODE loader: if the stored seed version differs from the current
 * release, all local talks are replaced with the fresh default talk.
 * This keeps every device in sync with the latest default content.
 */
export function loadPresentationsWithSeed(): Presentation[] {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(SEED_VERSION_KEY);
  } catch {
    /* storage unavailable */
  }
  if (stored !== SEED_VERSION) {
    const p = seedTalk();
    savePresentations([p]);
    try {
      localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    } catch {
      /* storage unavailable */
    }
    return [p];
  }
  return loadPresentations();
}
