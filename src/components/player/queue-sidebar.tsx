import { X, Trash2 } from "lucide-react";
import { usePlayerStore } from "@/stores/player-store";
import { useUiStore } from "@/stores/ui-store";
import { CoverArt } from "@/components/common/cover-art";
import { cn } from "@/lib/utils";

export function QueueSidebar() {
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const queueOpen = useUiStore((s) => s.queueOpen);
  const toggleQueue = useUiStore((s) => s.toggleQueue);

  if (!queueOpen) return null;

  function handleJumpTo(index: number) {
    playQueue(queue, index);
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Queue</h2>
        <div className="flex items-center gap-1">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              aria-label="Clear queue"
              className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring"
              title="Clear queue"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={toggleQueue}
            aria-label="Close queue"
            className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Queue is empty</p>
        ) : (
          queue.map((song, i) => {
            const isCurrent = currentSong?.id === song.id && i === queueIndex;
            return (
              <div
                key={`${song.id}-${i}`}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 transition-colors hover:bg-accent/50",
                  isCurrent && "bg-accent/30",
                )}
              >
                {/* Clickable area to jump to song */}
                <button
                  onClick={() => handleJumpTo(i)}
                  aria-label={`Play ${song.title || "Unknown"}`}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CoverArt src={song.cover_art} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-xs font-medium", isCurrent && "text-primary")}>
                      {song.title || "Unknown"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{song.artist || "Unknown"}</p>
                  </div>
                </button>
                <button
                  onClick={() => removeFromQueue(i)}
                  aria-label={`Remove ${song.title || "Unknown"} from queue`}
                  className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
