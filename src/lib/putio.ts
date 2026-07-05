import { listFolderServer } from "./putio.functions";

export interface PutioFile {
  id: number;
  name: string;
  file_type: string;
  size: number;
  created_at: string;
  screenshot?: string | null;
  icon?: string | null;
  parent_id?: number | null;
}

/**
 * Lists videos in a put.io folder.
 *
 * The actual fetch to put.io runs on our server via a TanStack Start server
 * function (see `putio.functions.ts`). The client POSTs `{ folderId, token }`
 * to our own origin, and the server does the outbound call — so the token
 * never appears in the browser's Network tab for the listing request.
 *
 * Accepted limitation: video playback still uses a direct, token-bearing
 * `<video src>` URL (see `streamUrl` below), because `<video>` can't attach
 * an Authorization header or a POST body. Proxying full video streams
 * through a serverless function would be impractical for large files.
 *
 * Signature is unchanged so all existing callers keep working.
 */
export async function listFolder(folderId: string, token: string): Promise<PutioFile[]> {
  return listFolderServer({ data: { folderId, token } });
}

/**
 * Direct, token-bearing stream URL.
 *
 * KNOWN, ACCEPTED LIMITATION: the OAuth token is visible in DevTools /
 * Network tab for the playing video, because HTML `<video>` elements can
 * only accept a plain URL — no custom headers, no POST body.
 * We deliberately do NOT proxy video streams through our server (would
 * blow past Vercel/Cloudflare execution time and bandwidth limits for
 * large files, and would degrade seek performance).
 */
export function streamUrl(fileId: number, token: string): string {
  return `https://api.put.io/v2/files/${fileId}/stream?oauth_token=${encodeURIComponent(token)}`;
}

export function isVideo(f: PutioFile): boolean {
  return f.file_type === "VIDEO";
}

/** Accepts a raw folder ID, a put.io URL like https://app.put.io/files/12345, or trailing slug */
export function extractFolderId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/\/files\/(\d+)/);
  if (m) return m[1];
  const last = trimmed.match(/(\d+)(?!.*\d)/);
  return last ? last[1] : null;
}

export function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
