import { useMemo, useRef } from "react";
import { Play, Search, ChevronUp, ChevronDown } from "lucide-react";
import { useLibraryStore } from "@/stores/library-store";
import { usePlayerStore } from "@/stores/player-store";
import { useUiStore } from "@/stores/ui-store";
import { CoverArt } from "@/components/common/cover-art";
import { FolderPicker } from "@/components/folder-picker";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import type { SortColumn } from "@/lib/song-queries";

// CSS equalizer bars for now-playing indicator
function EqualizerBars({ active }: { active: boolean }) {
  return (
    <span className="flex items-end gap-px" aria-hidden="true">
      {[3, 5, 4].map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-0.5 rounded-sm bg-primary transition-all",
            active ? "animate-pulse" : "opacity-50",
          )}
          style={{ height: `${active ? h * 2 : 4}px` }}
        />
      ))}
    </span>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <ChevronUp size={12} className="opacity-30" />;
  return direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

export function LibraryPage() {
  const { songs, isScanning, sortColumn, sortDirection, toggleSort } = useLibraryStore();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playSong = usePlayerStore((s) => s.playSong);
  const { searchQuery, setSearchQuery } = useUiStore();
  const searchRef = useRef<HTMLInputElement>(null);

  // Expose search focus for Ctrl+F shortcut (called from keyboard-shortcuts)
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__focusSearch = () => searchRef.current?.focus();
  }

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q) ||
        s.album?.toLowerCase().includes(q),
    );
  }, [songs, searchQuery]);

  function handlePlaySong(index: number) {
    const song = filtered[index];
    if (song) playSong(song, filtered);
  }

  function handlePlayAll() {
    if (filtered.length > 0) playSong(filtered[0]!, filtered);
  }

  const SORT_COLS: { col: SortColumn; label: string; className?: string }[] = [
    { col: "title", label: "Title" },
    { col: "artist", label: "Artist" },
    { col: "album", label: "Album", className: "hidden md:table-cell" },
    { col: "duration", label: "Time", className: "w-16 text-right" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold">Library</h1>
        {filtered.length > 0 && (
          <button
            onClick={handlePlayAll}
            aria-label="Play all songs"
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Play size={12} /> Play All
          </button>
        )}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            id="library-search"
            type="text"
            placeholder="Search songs... (Ctrl+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search songs"
            className="h-8 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {songs.length === 0 && !isScanning ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <FolderPicker />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "No songs match your search." : "No songs found."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="w-10 px-3 py-2 text-center">#</th>
                  {SORT_COLS.map(({ col, label, className }) => (
                    <th key={col} className={cn("px-3 py-2", className)}>
                      <button
                        onClick={() => toggleSort(col)}
                        aria-label={`Sort by ${label}`}
                        className="flex items-center gap-1 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {label}
                        <SortIcon active={sortColumn === col} direction={sortDirection} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((song, i) => {
                  const isCurrent = currentSong?.id === song.id;
                  return (
                    <tr
                      key={song.id}
                      onClick={() => handlePlaySong(i)}
                      className={cn(
                        "group cursor-pointer border-b border-border/30 transition-colors hover:bg-accent/50",
                        isCurrent && "bg-accent/30",
                      )}
                    >
                      <td className="px-3 py-1.5 text-center">
                        {isCurrent ? (
                          <EqualizerBars active={isPlaying} />
                        ) : (
                          <>
                            <span className="text-muted-foreground group-hover:hidden">{i + 1}</span>
                            <Play size={12} className="mx-auto hidden text-foreground group-hover:block" />
                          </>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <CoverArt src={song.cover_art} size={32} />
                          <span
                            title={song.title || "Unknown"}
                            className={cn("truncate font-medium", isCurrent && "text-primary")}
                          >
                            {song.title || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td
                        title={song.artist || "Unknown"}
                        className="truncate px-3 py-1.5 text-muted-foreground"
                      >
                        {song.artist || "Unknown"}
                      </td>
                      <td
                        title={song.album || "Unknown"}
                        className="hidden truncate px-3 py-1.5 text-muted-foreground md:table-cell"
                      >
                        {song.album || "Unknown"}
                      </td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground">
                        {song.duration ? formatDuration(song.duration) : "--:--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
