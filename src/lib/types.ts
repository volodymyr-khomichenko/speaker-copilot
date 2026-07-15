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

/** Fixed order of rescue-note groups on the SOS screen. */
export const SOS_CATEGORIES = [
  "Transitions",
  "Buy time",
  "Lost the thread",
  "Key numbers",
  "Core messages",
  "FAQ"
] as const;

export interface Presentation {
  id: string;
  name: string;
  /** Total planned talk time in seconds. Sections split it by percent. */
  totalTime: number;
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
