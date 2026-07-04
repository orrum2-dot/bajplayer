import { Film, PlayCircle } from "lucide-react";
import type { PutioFile } from "@/lib/putio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Props {
  files: PutioFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

function formatDuration(seconds?: number) {
  if (!seconds || !isFinite(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlaylistSidebar({ files, currentIndex, onSelect }: Props) {
  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">Up next</h2>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} / {files.length}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <ul className="p-2">
          {files.map((f, i) => {
            const active = i === currentIndex;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md p-2 text-left transition-all",
                    "hover:bg-accent hover:-translate-y-px",
                    active && "bg-accent ring-1 ring-primary/40",
                  )}
                >
                  <div className="relative aspect-video w-24 flex-shrink-0 overflow-hidden rounded bg-muted">
                    {f.screenshot ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.screenshot}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    {active && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <PlayCircle className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "line-clamp-2 text-sm",
                        active ? "font-medium text-foreground" : "text-foreground/90",
                      )}
                    >
                      {f.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDuration((f as unknown as { duration?: number }).duration)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </aside>
  );
}
