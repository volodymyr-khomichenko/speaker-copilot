import { useState } from "react";
import type { Presentation, RunReport } from "./lib/types";
import {
  deletePresentation,
  loadPresentations,
  newPresentation,
  upsertPresentation
} from "./lib/storage";
import { consumeImportFromLocation } from "./lib/share";
import { PresentationList } from "./screens/PresentationList";
import { PresentationEditor } from "./screens/PresentationEditor";
import { PresentationMode } from "./screens/PresentationMode";
import { Summary } from "./screens/Summary";

type Route =
  | { screen: "list" }
  | { screen: "edit"; presentation: Presentation }
  | { screen: "present"; presentation: Presentation }
  | { screen: "summary"; report: RunReport };

export default function App() {
  const [presentations, setPresentations] = useState<Presentation[]>(
    loadPresentations
  );
  const [route, setRoute] = useState<Route>({ screen: "list" });
  const [soundOn, setSoundOn] = useState(false);
  // A talk arriving through a shared link/QR waits for one confirmation tap.
  const [incoming, setIncoming] = useState<Presentation | null>(
    consumeImportFromLocation
  );

  const byId = (id: string) => presentations.find((p) => p.id === id);

  if (incoming) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <div className="display text-xs font-semibold uppercase tracking-[0.2em] text-onair">
          Incoming talk
        </div>
        <h1 className="display mt-2 text-2xl font-extrabold leading-tight">
          {incoming.name || "Untitled talk"}
        </h1>
        <p className="mt-1 text-dim">
          {incoming.sections.length} sections ·{" "}
          {Math.round(incoming.totalTime / 60)} min
        </p>
        <button
          onClick={() => {
            setPresentations(upsertPresentation(incoming));
            setIncoming(null);
          }}
          className="display mt-6 w-full rounded-2xl bg-onair py-4 text-lg font-bold text-stage"
        >
          Add to my talks
        </button>
        <button
          onClick={() => setIncoming(null)}
          className="mt-3 w-full rounded-2xl border border-line py-3 font-semibold text-dim"
        >
          Dismiss
        </button>
      </div>
    );
  }

  switch (route.screen) {
    case "edit":
      return (
        <PresentationEditor
          key={route.presentation.id}
          initial={route.presentation}
          onSave={(p) => {
            setPresentations(upsertPresentation(p));
            setRoute({ screen: "list" });
          }}
          onCancel={() => setRoute({ screen: "list" })}
        />
      );

    case "present":
      return (
        <PresentationMode
          presentation={route.presentation}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((v) => !v)}
          onEnd={(report) => setRoute({ screen: "summary", report })}
        />
      );

    case "summary":
      return (
        <Summary report={route.report} onDone={() => setRoute({ screen: "list" })} />
      );

    default:
      return (
        <PresentationList
          presentations={presentations}
          onCreate={() =>
            setRoute({ screen: "edit", presentation: newPresentation() })
          }
          onEdit={(id) => {
            const p = byId(id);
            if (p) setRoute({ screen: "edit", presentation: p });
          }}
          onStart={(id) => {
            const p = byId(id);
            if (p) setRoute({ screen: "present", presentation: p });
          }}
          onDelete={(id) => setPresentations(deletePresentation(id))}
        />
      );
  }
}
