import { memo } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from "lucide-react";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";

export const PlayerControls = memo(function PlayerControls() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffleEnabled = usePlayerStore((s) => s.shuffleEnabled);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleShuffle}
        aria-label="Shuffle"
        title="Shuffle (S)"
        className={cn(
          "rounded p-1.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
          shuffleEnabled ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Shuffle size={14} />
      </button>
      <button
        onClick={prev}
        aria-label="Previous"
        title="Previous (P)"
        className="rounded p-1.5 text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SkipBack size={16} />
      </button>
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <button
        onClick={next}
        aria-label="Next"
        title="Next (N)"
        className="rounded p-1.5 text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SkipForward size={16} />
      </button>
      <button
        onClick={cycleRepeat}
        aria-label={`Repeat: ${repeatMode}`}
        title={`Repeat (R) — ${repeatMode}`}
        className={cn(
          "rounded p-1.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
          repeatMode !== "off" ? "text-primary" : "text-muted-foreground",
        )}
      >
        {repeatMode === "one" ? <Repeat1 size={14} /> : <Repeat size={14} />}
      </button>
    </div>
  );
});
