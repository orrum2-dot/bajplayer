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

const API = "https://api.put.io/v2";

export async function listFolder(folderId: string, token: string): Promise<PutioFile[]> {
  // Auth is passed as the `oauth_token` query param (not an Authorization header).
  // A custom Authorization header turns this into a "non-simple" CORS request, which
  // triggers a preflight OPTIONS call — put.io's API doesn't answer that the way
  // browsers expect, so the real GET never happens and shows up as a 404 in the app.
  // Passing the token as a query param keeps this a simple GET and avoids the
  // preflight entirely, matching the official put.io v2 API spec.
  const url = new URL(`${API}/files/list`);
  url.searchParams.set("parent_id", folderId);
  url.searchParams.set("per_page", "1000");
  url.searchParams.set("oauth_token", token);

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Intentionally NOT clearing the saved token here (see storage.ts / settings.tsx).
    // A failed request (bad folder id, rate limit, transient 5xx, etc.) should never
    // wipe out a token the user already entered — that would force them to re-paste
    // it every time something goes wrong.
    throw new Error(`put.io API error ${res.status}: ${text || res.statusText}`);
  }
  const data = (await res.json()) as { files: PutioFile[] };
  return data.files ?? [];
}

export function streamUrl(fileId: number, token: string): string {
  return `${API}/files/${fileId}/stream?oauth_token=${encodeURIComponent(token)}`;
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
