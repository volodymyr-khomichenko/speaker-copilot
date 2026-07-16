import { useState } from "react";
import type { Presentation, Section, SosNote } from "../lib/types";
import { applyPercents, CLUE_CATEGORIES, QNA_CATEGORIES, SOS_CATEGORIES, uid } from "../lib/types";
import { fmtClock, fmtLong } from "../lib/time";

interface Props {
  initial: Presentation;
  onSave: (p: Presentation) => void;
  onCancel: () => void;
}

/**
 * The speaker sets ONE number — the total talk time.
 * Sections split it by percent; minutes per section are always derived.
 */
export function PresentationEditor({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial.name);
  const [totalMin, setTotalMin] = useState(Math.round(initial.totalTime / 60));
  const [eventDate, setEventDate] = useState(initial.eventDate ?? "");
  const [testRunGoal, setTestRunGoal] = useState(initial.testRunGoal ?? 10);
  // Kept as text so both "4,25" and "4.25" can be typed on any keyboard.
  const [readyTargetStr, setReadyTargetStr] = useState(
    String(initial.readyTarget ?? 4)
  );
  const parseTarget = (s: string): number => {
    const v = Number(s.replace(",", "."));
    if (!Number.isFinite(v)) return 4;
    return Math.min(5, Math.max(1, v));
  };
  const [sections, setSections] = useState<Section[]>(initial.sections);
  const [sosNotes, setSosNotes] = useState<SosNote[]>(initial.sosNotes);

  const totalTime = Math.max(0, totalMin) * 60;
  const percentSum = Math.round(
    sections.reduce((a, s) => a + Math.max(0, s.percent), 0)
  );
  // Live preview of derived durations (exactly what will be saved).
  const derived = applyPercents(totalTime, sections);

  const patchSection = (id: string, patch: Partial<Section>) =>
    setSections((xs) => xs.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const move = (i: number, dir: -1 | 1) =>
    setSections((xs) => {
      const j = i + dir;
      if (j < 0 || j >= xs.length) return xs;
      const next = [...xs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const splitEvenly = () =>
    setSections((xs) =>
      xs.map((s) => ({ ...s, percent: Math.round(1000 / xs.length) / 10 }))
    );

  const patchSos = (id: string, patch: Partial<SosNote>) =>
    setSosNotes((xs) => xs.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const save = () =>
    onSave({
      ...initial,
      name: name.trim(),
      totalTime,
      eventDate: eventDate || undefined,
      testRunGoal: Math.max(0, testRunGoal),
      readyTarget: parseTarget(readyTargetStr),
      sections: applyPercents(totalTime, sections),
      sosNotes: sosNotes.filter((n) => n.title.trim() || n.text.trim()),
      updatedAt: Date.now()
    });

  return (
    <div className="mx-auto max-w-md px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="mb-5 flex items-center justify-between">
        <button onClick={onCancel} className="text-dim">
          ← Back
        </button>
        <button
          onClick={save}
          className="display rounded-xl bg-onair px-5 py-2 font-bold text-stage"
        >
          Save
        </button>
      </header>

      <label className="mb-1 block text-sm text-dim" htmlFor="talk-name">
        Talk name
      </label>
      <input
        id="talk-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Marketing as a Revenue Multiplier"
        className="display mb-4 w-full rounded-xl border border-line bg-panel px-4 py-3 text-lg font-bold outline-none focus:border-onair"
      />

      {/* The one number that drives everything */}
      <div className="mb-6 rounded-2xl border border-onair/40 bg-panel p-4">
        <label className="mb-1 block text-sm text-dim" htmlFor="total-time">
          Total talk time
        </label>
        <div className="flex items-center gap-2">
          <input
            id="total-time"
            type="number"
            min={1}
            inputMode="numeric"
            value={totalMin}
            onChange={(e) => setTotalMin(Math.max(0, Number(e.target.value) || 0))}
            className="digits w-24 rounded-lg border border-line bg-panel-2 px-3 py-2 text-center text-2xl font-extrabold outline-none focus:border-onair"
          />
          <span className="text-dim">minutes</span>
        </div>
        <p className="mt-2 text-sm text-dim">
          Sections split this time by percent — change the total and every
          section rescales automatically.
        </p>
      </div>

      {/* When is the talk + how many rehearsals before it */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-panel p-4">
          <label className="mb-1 block text-sm text-dim" htmlFor="event-date">
            Talk day
          </label>
          <input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="digits w-full rounded-lg border border-line bg-panel-2 px-2 py-2 font-bold outline-none focus:border-onair"
          />
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <label className="mb-1 block text-sm text-dim" htmlFor="run-goal">
            Test runs goal
          </label>
          <input
            id="run-goal"
            type="number"
            min={0}
            inputMode="numeric"
            value={testRunGoal}
            onChange={(e) =>
              setTestRunGoal(Math.max(0, Number(e.target.value) || 0))
            }
            className="digits w-full rounded-lg border border-line bg-panel-2 px-2 py-2 text-center text-xl font-extrabold outline-none focus:border-onair"
          />
        </div>
        <div className="col-span-2 rounded-2xl border border-line bg-panel p-4">
          <label className="mb-1 block text-sm text-dim" htmlFor="ready-target">
            Readiness target (average ★ to reach before the talk)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="ready-target"
              type="text"
              inputMode="decimal"
              value={readyTargetStr}
              onChange={(e) => {
                // Digits plus a single comma or dot — nothing else.
                const raw = e.target.value.replace(/[^0-9.,]/g, "");
                const firstSep = raw.search(/[.,]/);
                const cleaned =
                  firstSep === -1
                    ? raw
                    : raw.slice(0, firstSep + 1) +
                      raw.slice(firstSep + 1).replace(/[.,]/g, "");
                setReadyTargetStr(cleaned);
              }}
              onBlur={() => setReadyTargetStr(String(parseTarget(readyTargetStr)))}
              placeholder="4.00"
              className="digits w-24 rounded-lg border border-line bg-panel-2 px-2 py-2 text-center text-xl font-extrabold outline-none focus:border-onair"
            />
            <span className="text-sm text-dim">
              of 5 · default 4.00, raise it if you want a stricter bar
            </span>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="display text-sm font-semibold uppercase tracking-wider text-dim">
          Sections
        </h2>
        <button
          onClick={splitEvenly}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-dim"
        >
          Split evenly
        </button>
      </div>

      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={s.id} className="rounded-2xl border border-line bg-panel p-4">
            <div className="mb-2 flex items-center gap-2">
              <input
                value={s.name}
                onChange={(e) => patchSection(s.id, { name: e.target.value })}
                placeholder={`Section ${i + 1}`}
                aria-label={`Section ${i + 1} name`}
                className="display min-w-0 flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 font-bold outline-none focus:border-onair"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  inputMode="numeric"
                  value={s.percent}
                  onChange={(e) =>
                    patchSection(s.id, {
                      percent: Math.max(0, Number(e.target.value) || 0)
                    })
                  }
                  aria-label={`Section ${i + 1} share in percent`}
                  className="digits w-16 rounded-lg border border-line bg-panel-2 px-2 py-2 text-center font-bold outline-none focus:border-onair"
                />
                <span className="text-sm text-dim">%</span>
              </div>
            </div>
            <div className="digits mb-2 text-sm text-onair">
              = {fmtClock(derived[i]?.duration ?? 0)} of the talk
            </div>
            <textarea
              value={s.notes}
              onChange={(e) => patchSection(s.id, { notes: e.target.value })}
              placeholder="Short notes for this section — keywords, not a script."
              rows={2}
              aria-label={`Section ${i + 1} notes`}
              className="w-full resize-y rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-onair"
            />
            <div className="mt-2 flex gap-2 text-sm">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded-lg border border-line px-3 py-1.5 text-dim disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === sections.length - 1}
                className="rounded-lg border border-line px-3 py-1.5 text-dim disabled:opacity-30"
              >
                ↓
              </button>
              <button
                onClick={() =>
                  setSections((xs) => xs.filter((x) => x.id !== s.id))
                }
                className="ml-auto rounded-lg border border-line px-3 py-1.5 text-dim"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {percentSum !== 100 && sections.length > 0 && (
        <p className="mt-3 text-sm text-warn">
          Shares add up to {percentSum}% — that's fine, they'll be scaled to
          100% of {fmtLong(totalTime)} on save.
        </p>
      )}

      <button
        onClick={() =>
          setSections((xs) => [
            ...xs,
            { id: uid(), name: "", percent: 10, duration: 0, notes: "" }
          ])
        }
        className="mt-3 w-full rounded-2xl border-2 border-dashed border-line py-3 font-semibold text-dim hover:text-ink"
      >
        + Add section
      </button>

      {(
        [
          {
            deck: "clue" as const,
            title: "Clue cards",
            tone: "text-onair",
            hint:
              "Planned hints for every stage of the talk: opening, results, transitions, challenges, closing. On stage: pick the stage, tap a card, it goes full screen.",
            add: "+ Add clue card",
            defaultCat: CLUE_CATEGORIES[0] as string | undefined,
            cats: CLUE_CATEGORIES as readonly string[]
          },
          {
            deck: "sos" as const,
            title: "SOS cards",
            tone: "text-sos",
            hint:
              "For when something goes wrong: lost the thread, need to buy time, tough question from the room. Grouped by category.",
            add: "+ Add SOS card",
            defaultCat: SOS_CATEGORIES[0] as string | undefined,
            cats: SOS_CATEGORIES as readonly string[]
          },
          {
            deck: "qna" as const,
            title: "Q&A",
            tone: "text-qna",
            hint:
              "Ready-made answer phrases for every Q&A situation: you know it, you need a moment, you don't know, it's challenging. Pick the situation, tap a card.",
            add: "+ Add Q&A card",
            defaultCat: QNA_CATEGORIES[0] as string | undefined,
            cats: QNA_CATEGORIES as readonly string[]
          }
        ]
      ).map(({ deck, title, tone, hint, add, defaultCat, cats }) => (
        <div key={deck}>
          <h2
            className={`display mt-8 mb-1 text-sm font-semibold uppercase tracking-wider ${tone}`}
          >
            {title}
          </h2>
          <p className="mb-3 text-sm text-dim">{hint}</p>
          <div className="space-y-3">
            {sosNotes
              .filter((n) => (n.deck ?? "sos") === deck)
              .map((n) => (
                <div
                  key={n.id}
                  className="rounded-2xl border border-line bg-panel p-4"
                >
                  <div className="mb-2 flex gap-2">
                    <input
                      value={n.title}
                      onChange={(e) => patchSos(n.id, { title: e.target.value })}
                      placeholder="Card title"
                      aria-label="Card title"
                      className="display min-w-0 flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 font-bold outline-none focus:border-onair"
                    />
                    {defaultCat !== undefined && (
                      <select
                        value={n.category ?? "Other"}
                        onChange={(e) =>
                          patchSos(n.id, { category: e.target.value })
                        }
                        aria-label="Card category"
                        className="rounded-lg border border-line bg-panel-2 px-2 py-2 text-sm text-dim outline-none focus:border-onair"
                      >
                        {(cats ?? SOS_CATEGORIES).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    )}
                  </div>
                  <textarea
                    value={n.text}
                    onChange={(e) => patchSos(n.id, { text: e.target.value })}
                    placeholder="The exact words or numbers you want one tap away."
                    rows={2}
                    aria-label="Card text"
                    className="w-full resize-y rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-onair"
                  />
                  <button
                    onClick={() =>
                      setSosNotes((xs) => xs.filter((x) => x.id !== n.id))
                    }
                    className="mt-2 rounded-lg border border-line px-3 py-1.5 text-sm text-dim"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
          <button
            onClick={() =>
              setSosNotes((xs) => [
                ...xs,
                { id: uid(), title: "", text: "", category: defaultCat, deck }
              ])
            }
            className="mt-3 w-full rounded-2xl border-2 border-dashed border-line py-3 font-semibold text-dim hover:text-ink"
          >
            {add}
          </button>
        </div>
      ))}

      <button
        onClick={save}
        className="display mt-8 w-full rounded-2xl bg-onair py-4 text-lg font-bold text-stage"
      >
        Save talk
      </button>
    </div>
  );
}
