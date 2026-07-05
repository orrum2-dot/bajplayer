import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearToken, getToken, setToken } from "@/lib/storage";

// Change this to rotate the admin password. Client-side only — this is a
// convenience gate, not real authentication. The put.io token itself never
// leaves this browser's localStorage.
const ADMIN_PASSWORD = "MySecretPlaylist2026";
const UNLOCK_KEY = "putio_settings_unlocked";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Autoplay Player for put.io" },
      { name: "description", content: "Manage your put.io OAuth token for the autoplay player." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [value, setValue] = useState("");
  const [existing, setExisting] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  useEffect(() => {
    setExisting(getToken());
    setUnlocked(window.localStorage.getItem(UNLOCK_KEY) === "1");
  }, []);

  const tryUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      window.localStorage.setItem(UNLOCK_KEY, "1");
      setUnlocked(true);
      setPw("");
      setPwError(false);
      toast.success("Settings unlocked");
    } else {
      setPwError(true);
    }
  };

  const lock = () => {
    window.localStorage.removeItem(UNLOCK_KEY);
    setUnlocked(false);
    toast.success("Settings locked");
  };


  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setToken(value.trim());
    setExisting(value.trim());
    setValue("");
    toast.success("Token saved to this device");
  };

  const remove = () => {
    clearToken();
    setExisting(null);
    toast.success("Token cleared");
  };

  const masked = existing ? `${existing.slice(0, 4)}••••${existing.slice(-4)}` : null;

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to player
        </Link>
      </Button>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
          {unlocked ? (
            <KeyRound className="h-5 w-5 text-primary" />
          ) : (
            <Lock className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {unlocked ? "put.io token" : "Locked"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {unlocked
              ? "Stored only in your browser's localStorage."
              : "Enter the admin password to manage the token."}
          </p>
        </div>
      </div>

      {!unlocked ? (
        <form onSubmit={tryUnlock} className="space-y-3 rounded-lg border bg-card p-4">
          <label className="block text-sm font-medium">Admin password</label>
          <Input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setPwError(false);
            }}
            placeholder="••••••••"
            autoComplete="off"
            autoFocus
          />
          {pwError && (
            <p className="text-sm text-destructive">Incorrect password.</p>
          )}
          <Button type="submit" disabled={!pw} className="w-full">
            Unlock
          </Button>
          <p className="pt-2 text-xs text-muted-foreground">
            Regular visitors don't need this — they can watch the playlist without unlocking anything.
          </p>
        </form>
      ) : (
        <>


      {existing && (
        <div className="mb-6 flex items-center justify-between rounded-lg border bg-card p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current token</p>
            <p className="mt-1 font-mono text-sm">{masked}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </Button>
        </div>
      )}

      <form onSubmit={save} className="space-y-3 rounded-lg border bg-card p-4">
        <label className="block text-sm font-medium">
          {existing ? "Replace with new token" : "Paste your OAuth token"}
        </label>
        <Input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="put.io OAuth token"
          autoComplete="off"
        />
        <Button type="submit" disabled={!value.trim()} className="w-full">
          Save token
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <p>
          Get a personal OAuth token from{" "}
          <a
            href="https://app.put.io/oauth/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4"
          >
            app.put.io/oauth/apps
          </a>
          .
        </p>
        <p>
          The token stays on this device. It's never sent to any server other than put.io's API,
          and it isn't included in shareable playlist links.
        </p>
      </div>

      <Button variant="ghost" size="sm" onClick={lock} className="mt-6">
        <Lock className="mr-2 h-4 w-4" /> Lock settings
      </Button>
        </>
      )}
    </div>
  );
}
