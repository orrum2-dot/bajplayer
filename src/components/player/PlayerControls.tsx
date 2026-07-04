import {
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Share2,
  ArrowUpDown,
  Settings,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RepeatMode } from "@/hooks/usePlaylist";
import type { SortMode } from "@/lib/storage";

interface Props {
  onPrev: () => void;
  onNext: () => void;
  shuffle: boolean;
  onShuffle: () => void;
  repeat: RepeatMode;
  onRepeat: () => void;
  sort: SortMode;
  onSort: (m: SortMode) => void;
  onShare: () => void;
}

export function PlayerControls({
  onPrev,
  onNext,
  shuffle,
  onShuffle,
  repeat,
  onRepeat,
  sort,
  onSort,
  onShare,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="icon" onClick={onPrev} aria-label="Previous">
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button variant="secondary" size="icon" onClick={onNext} aria-label="Next">
        <SkipForward className="h-4 w-4" />
      </Button>
      <Button
        variant={shuffle ? "default" : "secondary"}
        size="icon"
        onClick={onShuffle}
        aria-label="Shuffle"
      >
        <Shuffle className="h-4 w-4" />
      </Button>
      <Button
        variant={repeat !== "off" ? "default" : "secondary"}
        size="icon"
        onClick={onRepeat}
        aria-label="Repeat"
      >
        {repeat === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort: {sort === "name" ? "Name" : "Date"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSort("name")}>Name (natural)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort("created_at")}>Date added</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
        <Button asChild variant="ghost" size="icon" aria-label="Settings">
          <Link to="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
