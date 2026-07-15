import { useEffect } from "react";

/**
 * Keeps the screen awake while the component is mounted.
 * Re-acquires the lock when the tab becomes visible again
 * (browsers release wake locks on visibility change).
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    let lock: WakeLockSentinel | null = null;
    let disposed = false;

    const acquire = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Not supported or denied — the talk still works, screen may dim.
      }
    };

    const onVisibility = () => {
      if (!disposed && document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}
