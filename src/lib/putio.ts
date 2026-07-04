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
  const res = await fetch(`${API}/files/list?parent_id=${encodeURIComponent(folderId)}&per_page=1000`, {
    headers: { Authorization: `token ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
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
