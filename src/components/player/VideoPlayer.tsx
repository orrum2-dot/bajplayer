import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  src: string | null;
  title: string;
  onEnded: () => void;
  showReplay: boolean;
  onReplay: () => void;
}

export function VideoPlayer({ src, title, onEnded, showReplay, onReplay }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setFading(true);
    const t = setTimeout(() => setFading(false), 150);
    const v = ref.current;
    if (v && src) {
      v.load();
      v.play().catch(() => {
        /* autoplay may be blocked before user interaction */
      });
    }
    return () => clearTimeout(t);
  }, [src]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-border">
      <div className="aspect-video w-full">
        {src ? (
          <video
            ref={ref}
            key={src}
            src={src}
            controls
            autoPlay
            playsInline
            onEnded={onEnded}
            className={`h-full w-full bg-black transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}
            aria-label={title}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No video selected
          </div>
        )}
      </div>
      {showReplay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
          <p className="text-lg font-medium">Playlist finished</p>
          <Button onClick={onReplay} variant="default" size="lg">
            <RotateCcw className="mr-2 h-4 w-4" /> Replay
          </Button>
        </div>
      )}
    </div>
  );
}
