const TOKEN_KEY = "putio_token";
const RESUME_PREFIX = "putio_resume_";
const SORT_KEY = "putio_sort";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  window.localStorage.setItem(TOKEN_KEY, t.trim());
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getResumeIndex(folderId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(RESUME_PREFIX + folderId);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
export function setResumeIndex(folderId: string, index: number) {
  window.localStorage.setItem(RESUME_PREFIX + folderId, String(index));
}

export type SortMode = "name" | "created_at";
export function getSortMode(): SortMode {
  if (typeof window === "undefined") return "name";
  const v = window.localStorage.getItem(SORT_KEY);
  return v === "created_at" ? "created_at" : "name";
}
export function setSortMode(mode: SortMode) {
  window.localStorage.setItem(SORT_KEY, mode);
}
