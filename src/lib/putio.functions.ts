import { createServerFn } from "@tanstack/react-start";
import type { PutioFile } from "./putio";

/**
 * Server-side folder listing.
 *
 * Called from the browser via TanStack Start's RPC. The token travels in the
 * POST body to our own origin (not visible as a put.io URL parameter in the
 * user's Network tab), and the outbound fetch to put.io happens here.
 *
 * Auth is passed to put.io as the `oauth_token` query parameter (not a
 * Bearer header) — this matches the official v2 API and avoids a CORS
 * preflight in case this is ever called from the browser again.
 *
 * On failure we throw an Error with status + body text so callers can show
 * something useful. We DO NOT clear the saved token on any failure — that
 * is intentional and must only ever happen via the explicit "Clear" button
 * in Settings.
 */
export const listFolderServer = createServerFn({ method: "POST" })
  .inputValidator((data: { folderId: string; token: string }) => {
    if (!data || typeof data.folderId !== "string" || typeof data.token !== "string") {
      throw new Error("folderId and token are required");
    }
    return data;
  })
  .handler(async ({ data }): Promise<PutioFile[]> => {
    const url = new URL("https://api.put.io/v2/files/list");
    url.searchParams.set("parent_id", data.folderId);
    url.searchParams.set("per_page", "1000");
    url.searchParams.set("oauth_token", data.token);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // Note for deployers: put.io folder IDs are large (8-10 digit) globally
      // sequential numbers. A 404 with `error_type: "NotFound"` almost always
      // means the wrong folder id was entered, or the token doesn't own that
      // folder (put.io returns 404 instead of 403 for unauthorized folders to
      // avoid confirming/denying their existence). Check `app.put.io/files/<id>`.
      throw new Error(`put.io API error ${res.status}: ${body || res.statusText}`);
    }
    const json = (await res.json()) as { files?: PutioFile[] };
    return json.files ?? [];
  });
