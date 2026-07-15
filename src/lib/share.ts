import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Presentation } from "./types";
import { uid } from "./types";

/**
 * Device-to-device transfer with no server and no account:
 * the whole talk is compressed into the URL fragment (#import=...).
 * The fragment never leaves the browser — servers don't even see it.
 */

export function encodeShareUrl(p: Presentation): string {
  const payload = compressToEncodedURIComponent(JSON.stringify(p));
  return `${location.origin}${location.pathname}#import=${payload}`;
}

export function decodeSharedPresentation(fragment: string): Presentation | null {
  try {
    const json = decompressFromEncodedURIComponent(fragment);
    if (!json) return null;
    const p = JSON.parse(json) as Presentation;
    if (!p || !Array.isArray(p.sections)) return null;
    // Imported copy gets a fresh identity so it never collides with local talks.
    return { ...p, id: uid(), createdAt: Date.now(), updatedAt: Date.now() };
  } catch {
    return null;
  }
}

/** Read #import=... from the address bar once, then clean the URL. */
export function consumeImportFromLocation(): Presentation | null {
  const m = location.hash.match(/^#import=(.+)$/);
  if (!m) return null;
  const p = decodeSharedPresentation(m[1]);
  history.replaceState(null, "", location.pathname + location.search);
  return p;
}
