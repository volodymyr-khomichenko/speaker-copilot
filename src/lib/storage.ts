import type { Presentation } from "./types";
import { applyPercents, uid } from "./types";

const KEY = "scl:presentations:v1";

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
  return { ...p, totalTime: total, sections: applyPercents(total, sections), sosNotes };
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
        title: "Tough question",
        text: "\u201cGreat question. The short answer is\u2026 and I\u2019m happy to go deeper after the talk.\u201d",
        category: "FAQ",
        deck: "qna"
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
        title: "\u201cI don\u2019t know\u201d done right",
        text: "\u201cI don\u2019t have that number with me \u2014 leave me your contact and I\u2019ll send it today.\u201d Honest beats improvised.",
        category: "FAQ",
        deck: "qna"
      },
      {
        id: uid(),
        title: "Hostile question",
        text: "\u201cThat\u2019s a fair challenge.\u201d Restate it neutrally, answer the neutral version, move on. Never argue from the stage.",
        category: "FAQ",
        deck: "qna"
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
        title: "Example clue card",
        text: "Create your own cards here \u2014 a number, a quote, a diagram in words. On stage, tap a card to show it full screen.",
        deck: "clue"
      }
    ],
    createdAt: now,
    updatedAt: now
  };
}
