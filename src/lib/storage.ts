import type { Presentation } from "./types";
import { applyPercents, uid } from "./types";

const KEY = "scl:presentations:v1";
const SEED_KEY = "scl:seeded:v1";

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
    testRunsDone: p.testRunsDone ?? 0
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
    sections,
    sosNotes: [
      {
        id: uid(),
        title: "Bridge to the next topic",
        text: "\u201cAnd this brings me to the next point\u2026\u201d",
        category: "Transitions",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Wrap a topic cleanly",
        text: "\u201cThe takeaway here is simple\u2026\u201d \u2014 one sentence, then move on.",
        category: "Transitions",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Rephrase",
        text: "\u201cLet me put this another way.\u201d Pause. Breathe. Sip of water.",
        category: "Buy time",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Turn to the room",
        text: "\u201cQuick show of hands \u2014 who has run into this?\u201d Scan the room while you regroup.",
        category: "Buy time",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Return to the core",
        text: "\u201cThe key thing I want you to remember is\u2026\u201d \u2014 restate your main message, the thread will come back.",
        category: "Lost the thread",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Own it, keep going",
        text: "\u201cI\u2019ll come back to that detail \u2014 what matters right now is\u2026\u201d Nobody notices a skipped detail.",
        category: "Lost the thread",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Your numbers",
        text: "Put the 3\u20135 figures you must not get wrong here: metrics, prices, dates.",
        category: "Key numbers",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Message #1",
        text: "Write the one sentence this talk exists for. If everything falls apart \u2014 say this.",
        category: "Core messages",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Recap to move on",
        text: "\u201cSo, three things so far: \u2026, \u2026, \u2026. Now \u2014 the next one.\u201d A recap is a bridge and a breather at once.",
        category: "Transitions",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Tell a micro-story",
        text: "\u201cLet me give you a quick example\u2026\u201d \u2014 a 20-second story you know by heart buys time and adds life.",
        category: "Buy time",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Slow down on purpose",
        text: "Speaking slower reads as confidence, not confusion. Drop the pace, land every word.",
        category: "Buy time",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Use the slide",
        text: "Look at the screen and narrate it: \u201cWhat you see here is\u2026\u201d The slide is your legal cheat sheet.",
        category: "Lost the thread",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Ask the room",
        text: "\u201cBefore I go on \u2014 any questions so far?\u201d The audience talks, you find the thread.",
        category: "Lost the thread",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Message #2",
        text: "Your second must-land point. If time runs out \u2014 cut everything except messages #1 and #2.",
        category: "Core messages",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Tech fails",
        text: "\u201cWhile we fix this \u2014 let me tell you the story behind this slide.\u201d The show goes on without the screen.",
        category: "Buy time",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Restart the sentence",
        text: "Stop mid-sentence, pause, start the sentence again from the top. The room reads it as emphasis.",
        category: "Lost the thread",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Energy drop in the room",
        text: "Change something physical: step forward, raise your voice one notch, ask the room to stand or vote by hand.",
        category: "Buy time",
        deck: "sos"
      },
      {
        id: uid(),
        title: "Skipped something important",
        text: "\u201cOne thing I should have mentioned earlier\u2026\u201d \u2014 nobody knows your plan. Insert it now, no apology.",
        category: "Lost the thread",
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

/**
 * First launch: pre-create one ready talk so there's something to open
 * right away. Seeds only once — if the user deletes it, it stays deleted.
 */
export function loadPresentationsWithSeed(): Presentation[] {
  let list = loadPresentations();
  let seeded = false;
  try {
    seeded = localStorage.getItem(SEED_KEY) === "1";
  } catch {
    /* storage unavailable */
  }
  if (list.length === 0 && !seeded) {
    const p = newPresentation();
    p.name = "Warsaw";
    p.eventDate = "2026-07-27";
    p.totalTime = 90 * 60;
    p.sections = applyPercents(p.totalTime, p.sections);
    list = [p];
    savePresentations(list);
  }
  try {
    localStorage.setItem(SEED_KEY, "1");
  } catch {
    /* storage unavailable */
  }
  return list;
}
