import { useState } from "react";
import { SOS_CATEGORIES } from "../lib/types";

interface Props {
  accentBorder: string;
  withCategory?: boolean;
  onSave: (card: { title: string; text: string; category?: string }) => void;
}

/** Inline "add a card" form used inside every deck overlay. */
export function CardForm({ accentBorder, withCategory, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>(SOS_CATEGORIES[0]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-line py-3 font-semibold text-dim"
      >
        + Add card
      </button>
    );
  }

  const save = () => {
    if (!title.trim() && !text.trim()) return;
    onSave({
      title: title.trim(),
      text: text.trim(),
      category: withCategory ? category : undefined
    });
    setTitle("");
    setText("");
    setOpen(false);
  };

  return (
    <div className={`rounded-2xl border bg-panel p-4 ${accentBorder}`}>
      <div className="mb-2 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Card title"
          aria-label="New card title"
          className="display min-w-0 flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 font-bold outline-none focus:border-onair"
        />
        {withCategory && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="New card category"
            className="rounded-lg border border-line bg-panel-2 px-2 py-2 text-sm text-dim outline-none focus:border-onair"
          >
            {SOS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Card text"
        rows={3}
        aria-label="New card text"
        className="w-full resize-y rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-onair"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={save}
          className="display flex-1 rounded-lg bg-onair py-2 font-bold text-stage"
        >
          Save card
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg border border-line px-4 py-2 text-dim"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
