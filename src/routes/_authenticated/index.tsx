import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { listFolder, streamUrl, isVideo, naturalSort, type PutioFile } from "@/lib/putio";
import {
  getToken,
  getSortMode,
  setSortMode,
  type SortMode,
} from "@/lib/storage";
import { usePlaylist } from "@/hooks/usePlaylist";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { PlaylistSidebar } from "@/components/player/PlaylistSidebar";
import { PlayerControls } from "@/components/player/PlayerControls";
import { FolderPrompt } from "@/components/player/FolderPrompt";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Settings } from "lucide-react";

const searchSchema = z.object({
  folder: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Autoplay Playlist Player for put.io" },
      {
        name: "description",
        content:
          "Stream a put.io folder as a continuous playlist with autoplay, shuffle, and a clean cinema-style UI.",
      },
      { property: "og:title", content: "Autoplay Playlist Player for put.io" },
      {
        property: "og:description",
        content: "Continuous playback for any put.io folder.",
      },
    ],
  }),
  component: PlayerPage,
});

function PlayerPage() {
  const { folder } = Route.useSearch();
  const [token, setTokenState] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("name");

  useEffect(() => {
    setTokenState(getToken());
    setSort(getSortMode());
  }, []);

  const changeSort = (m: SortMode) => {
    setSort(m);
    setSortMode(m);
  };

  if (!folder) return <FolderPrompt hasToken={!!token} />;

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-primary" />
        <h1 className="text-2xl font-semibold">put.io token required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your personal OAuth token to load and play this folder.
        </p>
        <Button asChild className="mt-6">
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" /> Open settings
          </Link>
        </Button>
      </div>
    );
  }

  return <LoadedPlayer folderId={folder} token={token} sort={sort} onSort={changeSort} />;
}

function LoadedPlayer({
  folderId,
  token,
  sort,
  onSort,
}: {
  folderId: string;
  token: string;
  sort: SortMode;
  onSort: (m: SortMode) => void;
}) {
  const query = useQuery({
    queryKey: ["putio-folder", folderId, token],
    queryFn: () => listFolder(folderId, token),
    staleTime: 60_000,
  });

  const files = useMemo<PutioFile[]>(() => {
    const list = (query.data ?? []).filter(isVideo);
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => naturalSort(a.name, b.name));
    else
      sorted.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    return sorted;
  }, [query.data, sort]);

  const { index, current, next, prev, jump, shuffle, setShuffle, repeat, setRepeat, isLast } =
    usePlaylist(files, folderId);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    setEnded(false);
  }, [current?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const handleEnded = () => {
    if (isLast && repeat === "off") {
      setEnded(true);
    } else {
      next();
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/?folder=${encodeURIComponent(folderId)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied", { description: "Recipient needs their own put.io token." });
    } catch {
      toast.error("Couldn't copy link", { description: url });
    }
  };

  const src = current ? streamUrl(current.id, token) : null;
  const cycleRepeat = () =>
    setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off");

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 lg:px-6 lg:py-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_384px] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <VideoPlayer
            src={src}
            title={current?.name ?? ""}
            onEnded={handleEnded}
            showReplay={ended}
            onReplay={() => {
              setEnded(false);
              jump(0);
            }}
          />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {current?.name ?? (query.isLoading ? "Loading…" : "No videos")}
            </h1>
            <p className="text-xs text-muted-foreground">
              Folder {folderId} · {files.length} video{files.length === 1 ? "" : "s"}
            </p>
          </div>
          <PlayerControls
            onPrev={prev}
            onNext={next}
            shuffle={shuffle}
            onShuffle={() => setShuffle((s) => !s)}
            repeat={repeat}
            onRepeat={cycleRepeat}
            sort={sort}
            onSort={onSort}
            onShare={share}
          />
          {query.isError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <p className="font-medium text-destructive">Couldn't load folder</p>
              <p className="mt-1 text-muted-foreground">{(query.error as Error).message}</p>
            </div>
          )}
        </div>

        <div className="min-h-[400px] lg:h-[calc(100vh-3rem)]">
          {query.isLoading ? (
            <div className="space-y-2 rounded-lg border bg-card p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="aspect-video w-24 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : files.length > 0 ? (
            <PlaylistSidebar files={files} currentIndex={index} onSelect={jump} />
          ) : (
            !query.isError && (
              <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                No video files found in this folder.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
