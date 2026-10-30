import { useCallback, useState, type ReactNode } from "react";
import type { Presentation, RunRecord, RunReport } from "./lib/types";
import { uid } from "./lib/types";
import {
  deletePresentation,
  loadPresentationsWithSeed,
  newPresentation,
  upsertPresentation
} from "./lib/storage";
import { useCloud } from "./hooks/useCloud";
import { AccountBar } from "./components/AccountBar";
import { PresentationList } from "./screens/PresentationList";
import { PresentationEditor } from "./screens/PresentationEditor";
import { PresentationMode } from "./screens/PresentationMode";
import { RateRun } from "./screens/RateRun";
import { Privacy } from "./screens/Privacy";

type Route =
  | { screen: "list" }
  | { screen: "privacy" }
  | { screen: "edit"; presentation: Presentation }
  | { screen: "present"; presentation: Presentation }
  | {
      screen: "rate";
      presentation: Presentation;
      mode: "test" | "live";
      report: RunReport;
    };

export default function App() {
  const [presentations, setPresentations] = useState<Presentation[]>(
    loadPresentationsWithSeed
  );
  const [route, setRoute] = useState<Route>({ screen: "list" });
  const [soundOn, setSoundOn] = useState(false);
  const onCloudList = useCallback((list: Presentation[]) => {
    setPresentations(list);
  }, []);
  const cloud = useCloud(onCloudList);

  let account: ReactNode = null;
  if (cloud.enabled && route.screen === "list") {
    account = (
      <AccountBar
        email={cloud.email}
        status={cloud.status}
        notice={cloud.notice}
        onSignIn={cloud.signIn}
        onSignOut={cloud.signOut}
        onDeleteCloud={cloud.deleteCloud}
        onRetry={cloud.retry}
        onPrivacy={() => setRoute({ screen: "privacy" })}
      />
    );
  }


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
          onEnd={(report, mode) =>
            setRoute({
              screen: "rate",
              presentation: route.presentation,
              mode,
              report
            })
          }
        />
      );

    case "rate": {
      const saveRun = (ratings: Record<string, number>, comment: string) => {
        const record: RunRecord = {
          id: uid(),
          mode: route.mode,
          endedAt: route.report.endedAt,
          plannedTotal: route.report.plannedTotal,
          actualTotal: route.report.actualTotal,
          ratings,
          comment
        };
        const updated: Presentation = {
          ...route.presentation,
          runs: [record, ...(route.presentation.runs ?? [])],
          testRunsDone:
            route.mode === "test"
              ? (route.presentation.testRunsDone ?? 0) + 1
              : (route.presentation.testRunsDone ?? 0),
          updatedAt: Date.now()
        };
        setPresentations(upsertPresentation(updated));
        // Back to this talk's card (standby), not to the whole list.
        setRoute({ screen: "present", presentation: updated });
      };
      return (
        <RateRun
          report={route.report}
          mode={route.mode}
          onSave={saveRun}
          onSkip={() => saveRun({}, "")}
        />
      );
    }

    default:
      if (route.screen === "privacy") {
        return <Privacy onBack={() => setRoute({ screen: "list" })} />;
      }
      return (
        <PresentationList
          presentations={presentations}
          account={account}
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
