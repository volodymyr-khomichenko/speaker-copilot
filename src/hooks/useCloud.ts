import { useEffect, useRef, useState } from "react";
import type { Presentation } from "../lib/types";
import type { CloudHandle, CloudSnapshot, SyncStatus } from "../lib/cloud";

const configured =
  !__OFFLINE_PREVIEW__ &&
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export interface CloudApi {
  enabled: boolean;
  email: string | null;
  status: SyncStatus;
  notice: string;
  signIn: () => void;
  signOut: () => void;
  deleteCloud: () => void;
  retry: () => void;
}

/**
 * Loads sync only when Supabase env is present. The offline preview build
 * constant-folds this to off, so the login code is not required there.
 */
export function useCloud(onPresentations: (list: Presentation[]) => void): CloudApi {
  const [snap, setSnap] = useState<CloudSnapshot>({
    email: null,
    status: "idle",
    notice: ""
  });
  const handle = useRef<CloudHandle | null>(null);
  const onList = useRef(onPresentations);
  onList.current = onPresentations;

  useEffect(() => {
    if (!configured) return;
    let dead = false;
    let dispose = () => {};
    void import("../lib/cloud")
      .then((mod) => {
        if (dead) return;
        const started = mod.startCloud({
          onPresentations: (list) => onList.current(list),
          onSnapshot: (next) => {
            if (!dead) setSnap(next);
          }
        });
        handle.current = started;
        dispose = started.dispose;
      })
      .catch(() => {
        if (!dead) {
          setSnap({
            email: null,
            status: "error",
            notice: "Couldn't start sync. Your talks on this device are unchanged."
          });
        }
      });
    return () => {
      dead = true;
      dispose();
      handle.current = null;
    };
  }, []);

  return {
    enabled: configured,
    email: snap.email,
    status: snap.status,
    notice: snap.notice,
    signIn: () => {
      void handle.current?.signIn();
    },
    signOut: () => {
      void handle.current?.signOut();
    },
    deleteCloud: () => {
      void handle.current?.deleteCloud();
    },
    retry: () => handle.current?.retry()
  };
}
