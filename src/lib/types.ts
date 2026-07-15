export interface Section {
  id: string;
  name: string;
  /** Share of the whole talk, in percent. Durations are derived from this. */
  percent: number;
  /** Duration in seconds — computed from totalTime × percent on save. */
  duration: number;
  notes: string;
}

export interface SosNote {
  id: string;
  title: string;
  text: string;
  /** Grouping inside a deck. One of SOS_CATEGORIES or a custom label. */
  category?: string;
  /** Which deck the card belongs to: full-screen cards, emergencies, or Q&A. */
  deck?: "clue" | "sos" | "qna";
}

/** Fixed order of situation groups on the Clue cards screen. */
export const CLUE_CATEGORIES = [
  "Opening the Presentation",
  "Presenting Results",
  "Moving Between Sections",
  "Discussing Challenges",
  "Looking Ahead",
  "Closing the Presentation"
] as const;

/** Fixed order of answer-situation groups on the Q&A screen. */
export const QNA_CATEGORIES = [
  "When You Know the Answer",
  "When You Need a Moment to Think",
  "When You Don't Know the Answer",
  "When the Question Is Challenging",
  "When You Want to Redirect",
  "Closing an Answer"
] as const;

/** Fixed order of rescue-note groups on the SOS screen. */
export const SOS_CATEGORIES = [
  "You Lost Your Train of Thought",
  "You Need a Few Seconds to Think",
  "You Don't Have the Information",
  "You're Running Out of Time",
  "Technical Issues",
  "Difficult or Unexpected Situation"
] as const;

export interface Presentation {
  id: string;
  name: string;
  /** Total planned talk time in seconds. Sections split it by percent. */
  totalTime: number;
  /** Date of the live talk (YYYY-MM-DD). Drives the countdown on the list. */
  eventDate?: string;
  /** How many rehearsal runs the speaker plans to do before the live talk. */
  testRunGoal: number;
  /** How many rehearsal runs are already done. */
  testRunsDone: number;
  sections: Section[];
  sosNotes: SosNote[];
  createdAt: number;
  updatedAt: number;
}

/** Result of one finished (or aborted) run of a talk. */
export interface RunReport {
  presentationId: string;
  presentationName: string;
  startedAt: number;
  endedAt: number;
  plannedTotal: number;
  actualTotal: number;
  sections: SectionResult[];
}

export interface SectionResult {
  name: string;
  planned: number;
  actual: number;
}

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const totalDuration = (p: Pick<Presentation, "sections">): number =>
  p.sections.reduce((sum, s) => sum + s.duration, 0);

/**
 * Turn percents into second-durations that sum exactly to totalTime.
 * Percents are normalized proportionally, the last section absorbs rounding.
 */
export function applyPercents(totalTime: number, sections: Section[]): Section[] {
  const sum = sections.reduce((a, s) => a + Math.max(0, s.percent), 0) || 1;
  let used = 0;
  return sections.map((s, i) => {
    const norm = (Math.max(0, s.percent) / sum) * 100;
    const isLast = i === sections.length - 1;
    const duration = isLast
      ? Math.max(0, totalTime - used)
      : Math.round((totalTime * norm) / 100);
    used += duration;
    return { ...s, percent: Math.round(norm * 10) / 10, duration };
  });
}
