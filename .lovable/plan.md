## Autoplay Playlist Web Player for put.io

A frontend-only app (no backend / no Lovable Cloud) that reads a put.io folder and plays its videos back-to-back in a custom HTML5 player.

### Routes
- `/` — Player. Reads folder from `?folder=ID` (or `#folder=ID`). If no token stored, shows a setup prompt linking to `/settings`. If no folder param, shows a "paste folder ID or URL" form.
- `/settings` — Paste/replace/clear put.io OAuth token. Stored in `localStorage` under `putio_token`. Includes a link to put.io's OAuth token page and a clear warning that the token stays on this device only.

### Data flow
- `GET https://api.put.io/v2/files/list?parent_id={folderId}` with `Authorization: token {token}`.
- Filter `file_type === "VIDEO"` (fallback: mime prefix `video/`). Sort by name (natural sort) with a toggle for "by created_at".
- Stream URL: `https://api.put.io/v2/files/{id}/stream?oauth_token={token}` (token required in query since `<video>` can't send headers).
- Thumbnails: `file.screenshot` when present, otherwise a generic icon.

### Player behavior
- Single `<video>` element, `autoPlay` + `playsInline` + `controls`.
- `onEnded` → advance queue index → swap `src` → `.play()`. If last video, show "Playlist finished — Replay" overlay.
- Keyboard: Space (play/pause), →/← (next/prev), F (fullscreen), M (mute).
- Persist last-played index per folder in `localStorage` so refresh resumes.
- Smooth 200ms crossfade on the video element between tracks.

### Playlist UI
- Desktop: right sidebar (w-96), scrollable list of items with thumbnail, filename, duration, "now playing" indicator, click to jump.
- Mobile/tablet: playlist collapses under the player as a horizontally-scrolling row + expandable full list (Sheet).
- Controls row above playlist: Prev, Play/Pause, Next, Shuffle toggle, Repeat (off/all/one), Sort menu, Share.

### Share
- "Copy share link" button → `${origin}/?folder={folderId}`. Toast confirmation. Recipient needs their own token.
- Also accept a full put.io folder URL pasted into the folder input; extract the numeric ID.

### Design
- Dark cinema theme by default (no theme toggle). Tokens updated in `src/styles.css`:
  - `--background` near-black `oklch(0.14 0.01 260)`, `--card` `oklch(0.18 0.01 260)`, `--foreground` `oklch(0.97 0 0)`, `--primary` warm amber `oklch(0.78 0.15 65)` for the "now playing" accent, `--muted-foreground` `oklch(0.65 0.02 260)`.
  - Light-mode vars left as sensible fallback but `<html class="dark">` set in `__root.tsx`.
- Typography: Inter via `@fontsource/inter` (400/500/600/700). Tight tracking on headings.
- shadcn components: Button, Input, Sheet, ScrollArea, Toast (sonner), DropdownMenu, Skeleton.
- Layout: player uses `aspect-video` capped by viewport height; sidebar hides <lg breakpoint.
- Motion: subtle fade+scale on track change, hover lift on playlist items.

### File structure
- `src/routes/index.tsx` — player page (reads folder from URL).
- `src/routes/settings.tsx` — token management.
- `src/routes/__root.tsx` — set dark class, update head metadata (title "Playlist Player for put.io", description, og tags).
- `src/lib/putio.ts` — API client (`listFolder`, `streamUrl`, `extractFolderId`), types.
- `src/lib/storage.ts` — token + resume-index helpers.
- `src/hooks/usePlaylist.ts` — queue state (index, shuffle, repeat, next/prev/jump).
- `src/components/player/VideoPlayer.tsx`
- `src/components/player/PlaylistSidebar.tsx`
- `src/components/player/PlayerControls.tsx`
- `src/components/player/FolderPrompt.tsx`
- Update `src/styles.css` with cinema tokens; install `@fontsource/inter`; import in `src/main.tsx` (or root).

### Non-goals
- No OAuth redirect flow, no backend, no server functions.
- No HLS, no captions upload, no download UI.
- No token in share links.

### Security notes
- Token is stored only in `localStorage` on this device; the settings screen states this clearly and offers a one-click "Clear token".
- Stream URLs contain the token in the query string — surfaced only inside the `<video src>` attribute for the current track; not logged, not put into shareable links.
