import { useState } from "react";
import type { SyncStatus } from "../lib/cloud";

interface Props {
  email: string | null;
  status: SyncStatus;
  notice: string;
  onSignIn: () => void;
  onSignOut: () => void;
  onDeleteCloud: () => void;
  onRetry: () => void;
  onPrivacy: () => void;
}

function statusText(status: SyncStatus): string {
  if (status === "synced") return "Synced";
  if (status === "syncing") return "Syncing";
  if (status === "offline") return "Offline - will sync later";
  if (status === "error") return "Error - tap to retry";
  return "";
}

export function AccountBar(props: Props) {
  const [busy, setBusy] = useState(false);
  const signedIn = Boolean(props.email);
  const label = statusText(props.status);

  const run = (fn: () => void) => {
    setBusy(true);
    fn();
    window.setTimeout(() => setBusy(false), 400);
  };

  return (
    <div className="mt-4 rounded-2xl border border-line bg-panel px-3 py-3 text-center">
      {signedIn ? (
        <>
          <p className="text-sm font-semibold">{props.email}</p>
          {label &&
            (props.status === "error" ? (
              <button
                type="button"
                onClick={props.onRetry}
                className="mt-1 text-xs font-semibold underline underline-offset-2"
              >
                {label}
              </button>
            ) : (
              <p className="mt-1 text-xs text-dim">{label}</p>
            ))}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(props.onSignOut)}
              className="text-onair underline underline-offset-2 disabled:opacity-50"
            >
              Sign out
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  !window.confirm(
                    "Delete your cloud data? Talks on this device stay. This removes only the copy in your account."
                  )
                )
                  return;
                run(props.onDeleteCloud);
              }}
              className="text-dim underline underline-offset-2 disabled:opacity-50"
            >
              Delete my cloud data
            </button>
            <button
              type="button"
              onClick={props.onPrivacy}
              className="text-dim underline underline-offset-2"
            >
              Privacy
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(props.onSignIn)}
            className="display rounded-xl border border-line bg-panel-2 px-4 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            Sign in with Google
          </button>
          <p className="mt-2 text-xs text-dim">
            Optional. Sync talks across devices.{" "}
            <button
              type="button"
              onClick={props.onPrivacy}
              className="font-semibold text-onair underline underline-offset-2"
            >
              Privacy
            </button>
          </p>
        </>
      )}
      {props.notice ? <p className="mt-2 text-xs">{props.notice}</p> : null}
    </div>
  );
}
