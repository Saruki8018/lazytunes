import { ListMusic } from "lucide-react";
import { usePlayerStore } from "@/stores/player-store";
import { useUiStore } from "@/stores/ui-store";
import { CoverArt } from "@/components/common/cover-art";
import { PlayerControls } from "./player-controls";
import { SeekBar } from "./seek-bar";
import { VolumeControl } from "./volume-control";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const queueLength = usePlayerStore((s) => s.queue.length);
  const toggleQueue = useUiStore((s) => s.toggleQueue);
  const queueOpen = useUiStore((s) => s.queueOpen);

  return (
    <div className="flex h-20 shrink-0 items-center border-t border-border bg-card px-4">
      {/* Left: Song info */}
      <div className="flex w-56 items-center gap-3">
        {currentSong ? (
          <>
            <CoverArt src={currentSong.cover_art} size={48} className="rounded" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={currentSong.title || "Unknown"}>
                {currentSong.title || "Unknown"}
              </p>
              <p className="truncate text-xs text-muted-foreground" title={currentSong.artist || "Unknown"}>
                {currentSong.artist || "Unknown"}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No song playing</p>
        )}
      </div>

      {/* Center: Controls + seek */}
      <div className="flex flex-1 flex-col items-center gap-1">
        <PlayerControls />
        <div className="w-full max-w-md">
          <SeekBar />
        </div>
      </div>

      {/* Right: Volume + queue toggle */}
      <div className="flex w-56 items-center justify-end gap-2">
        <VolumeControl />
        <button
          onClick={toggleQueue}
          aria-label="Toggle queue"
          title="Queue"
          className={cn(
            "rounded p-1.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
            queueOpen ? "text-primary" : "text-muted-foreground",
          )}
        >
          <ListMusic size={16} />
        </button>
        {queueLength > 0 && (
          <span className="text-xs text-muted-foreground">{queueLength}</span>
        )}
      </div>
    </div>
  );
}
