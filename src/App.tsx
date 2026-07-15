import { useState } from "react";
import type { Presentation, RunReport } from "./lib/types";
import {
  deletePresentation,
  loadPresentationsWithSeed,
  newPresentation,
  upsertPresentation
} from "./lib/storage";
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
    loadPresentationsWithSeed
  );
  const [route, setRoute] = useState<Route>({ screen: "list" });
  const [soundOn, setSoundOn] = useState(false);


  const byId = (id: string) => presentations.find((p) => p.id === id);

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
          onExit={() => setRoute({ screen: "list" })}
          onEditTalk={() =>
            setRoute({ screen: "edit", presentation: route.presentation })
          }
          onUpdate={(p) => {
            setPresentations(upsertPresentation(p));
            setRoute({ screen: "present", presentation: p });
          }}
          onEnd={(report, mode) => {
            // A finished test run counts toward the rehearsal goal.
            if (mode === "test") {
              const updated = {
                ...route.presentation,
                testRunsDone: (route.presentation.testRunsDone ?? 0) + 1,
                updatedAt: Date.now()
              };
              setPresentations(upsertPresentation(updated));
            }
            setRoute({ screen: "summary", report });
          }}
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
          onOpen={(id) => {
            const p = byId(id);
            if (p) setRoute({ screen: "present", presentation: p });
          }}
          onDelete={(id) => setPresentations(deletePresentation(id))}
        />
      );
  }
}
