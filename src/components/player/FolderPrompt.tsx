import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Film } from "lucide-react";
import { extractFolderId } from "@/lib/putio";
import { toast } from "sonner";

export function FolderPrompt({ hasToken }: { hasToken: boolean }) {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractFolderId(value);
    if (!id) {
      toast.error("Couldn't parse a folder ID from that input.");
      return;
    }
    navigate({ to: "/", search: { folder: id } });
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
        <Film className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Autoplay for put.io</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste a put.io folder ID or URL to play every video in sequence.
      </p>

      {!hasToken && (
        <div className="mt-6 w-full rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          You haven't added a put.io token yet.{" "}
          <Link to="/settings" className="font-medium text-primary underline underline-offset-4">
            Add it in Settings
          </Link>{" "}
          to start playing.
        </div>
      )}

      <form onSubmit={submit} className="mt-6 flex w-full gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="12345 or https://app.put.io/files/12345"
          className="flex-1"
          aria-label="Folder ID or URL"
        />
        <Button type="submit">Load</Button>
      </form>
    </div>
  );
}
