import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Presentation } from "../lib/types";
import { encodeShareUrl } from "../lib/share";

interface Props {
  presentation: Presentation;
  onClose: () => void;
}

/**
 * Device-to-device sync without accounts: scan the QR (or copy the link)
 * on another device — the talk imports there instantly.
 */
export function ShareOverlay({ presentation, onClose }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = encodeShareUrl(presentation);

  useEffect(() => {
    let alive = true;
    setQrFailed(false);
    // Level "L" maximizes QR capacity (~2.9 KB) — talks with many cards
    // produce long links, and higher correction levels can't fit them.
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "L",
      margin: 2,
      width: 640,
      color: { dark: "#0E1116", light: "#FFFFFF" }
    })
      .then((d) => {
        if (alive) setQr(d);
      })
      .catch(() => {
        if (alive) setQrFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the link below is selectable by hand.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stage/98 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 text-left"
      >
        <span className="display text-lg font-bold tracking-wide text-onair">
          Send to another device
        </span>
        <span className="text-sm text-dim">tap to close</span>
      </button>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <p className="mb-4 text-sm text-dim">
          Scan this QR code with your phone (or open the copied link on any
          device) — the talk “
          <span className="text-ink">
            {presentation.name || "Untitled talk"}
          </span>
          ” will import there. The whole talk travels inside the link itself:
          no account, no server storage.
        </p>

        {qr && !qrFailed && (
          <img
            src={qr}
            alt="QR code with the talk"
            className="mx-auto w-full max-w-xs rounded-2xl border border-line"
          />
        )}
        {!qr && !qrFailed && (
          <p className="py-10 text-center text-dim">Generating QR…</p>
        )}
        {qrFailed && (
          <p className="rounded-xl border border-line bg-panel-2 p-4 text-sm text-dim">
            This talk is too large to fit into a QR code. Use “Copy link”
            below instead — the link carries everything, just open it on the
            other device (send it to yourself in any messenger).
          </p>
        )}

        <button
          onClick={copy}
          className="display mt-4 w-full rounded-xl border border-onair/60 bg-onair/10 py-3 font-bold text-onair"
        >
          {copied ? "Link copied ✓" : "Copy link"}
        </button>
        <p className="mt-2 break-all rounded-xl border border-line bg-panel p-3 text-xs text-dim">
          {url}
        </p>
      </div>

      <button
        onClick={onClose}
        className="display mx-5 mb-[max(1.25rem,env(safe-area-inset-bottom))] rounded-2xl bg-panel-2 py-4 text-lg font-bold"
      >
        Close
      </button>
    </div>
  );
}
