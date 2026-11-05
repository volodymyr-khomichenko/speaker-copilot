import { useState } from "react";
import type { SyncStatus } from "../lib/cloud";

interface Props {
  email: string | null;
  status: SyncStatus;
  notice: string;
  accountChoice: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onDeleteCloud: () => void;
  onRetry: () => void;
  onKeepSeparate: () => void;
  onMergeAccounts: () => void;
  onDismissAccountChoice: () => void;
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
            <a
              href="https://khomichenko.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dim underline underline-offset-2"
            >
              Privacy
            </a>
          </div>
          {props.accountChoice ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={props.onKeepSeparate}
                className="rounded-xl border border-line bg-panel-2 px-3 py-2 text-xs font-semibold"
              >
                Keep it separate
              </button>
              <button
                type="button"
                onClick={props.onMergeAccounts}
                className="rounded-xl bg-onair px-3 py-2 text-xs font-bold text-stage"
              >
                Merge it into this account
              </button>
              <button
                type="button"
                onClick={props.onDismissAccountChoice}
                className="px-2 py-2 text-xs text-dim underline underline-offset-2"
              >
                Not now
              </button>
            </div>
          ) : null}
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
            <a
              href="https://khomichenko.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-onair underline underline-offset-2"
            >
              Privacy
            </a>
          </p>
        </>
      )}
      {props.notice ? <p className="mt-2 text-xs">{props.notice}</p> : null}
    </div>
  );
}
