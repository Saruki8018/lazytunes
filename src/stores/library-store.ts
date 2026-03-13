import { create } from "zustand";
import type { Song, ScanProgress } from "@/lib/song-types";
import { getAllSongs, type SortColumn, type SortDirection } from "@/lib/song-queries";
import { selectMusicFolder, getSavedFolderPath, scanFolder } from "@/lib/library-scanner";
import { startFileWatcher } from "@/lib/file-watcher";
import { usePlayerStore } from "@/stores/player-store";
import { useUiStore } from "@/stores/ui-store";

interface LibraryStore {
  songs: Song[];
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  folderPath: string | null;
  initialized: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;

  initialize: () => Promise<void>;
  loadSongs: () => Promise<void>;
  selectFolder: () => Promise<void>;
  startScan: () => Promise<void>;
  setSortColumn: (col: SortColumn) => void;
  setSortDirection: (dir: SortDirection) => void;
  toggleSort: (col: SortColumn) => void;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  songs: [],
  isScanning: false,
  scanProgress: null,
  folderPath: null,
  initialized: false,
  sortColumn: "title",
  sortDirection: "desc",

  initialize: async () => {
    if (get().initialized) return;
    const folderPath = await getSavedFolderPath();
    set({ folderPath, initialized: true });

    // Restore persisted volume/mute from localStorage
    const savedVolume = localStorage.getItem("player_volume");
    const savedMuted = localStorage.getItem("player_muted");
    if (savedVolume !== null) {
      const volume = parseFloat(savedVolume);
      if (!isNaN(volume)) usePlayerStore.getState().setVolume(volume);
    }
    if (savedMuted !== null) {
      const muted = savedMuted === "true";
      const store = usePlayerStore.getState();
      if (store.isMuted !== muted) store.toggleMute();
    }

    await get().loadSongs();

    if (folderPath) {
      await get().startScan();
      startFileWatcher(folderPath, () => get().startScan()).catch((err) => {
        console.warn("File watcher failed to start:", err);
      });
    }
  },

  loadSongs: async () => {
    const { sortColumn, sortDirection } = get();
    const songs = await getAllSongs(sortColumn, sortDirection);
    set({ songs });
  },

  selectFolder: async () => {
    const path = await selectMusicFolder();
    if (path) {
      set({ folderPath: path });
      await get().startScan();
      startFileWatcher(path, () => get().startScan()).catch((err) => {
        console.warn("File watcher failed to start:", err);
      });
    }
  },

  startScan: async () => {
    const { folderPath, isScanning } = get();
    if (!folderPath || isScanning) return;

    set({ isScanning: true, scanProgress: null });
    try {
      const result = await scanFolder(folderPath, (progress) => {
        set({ scanProgress: progress });
      });
      await get().loadSongs();
      // Show scan complete toast
      useUiStore.getState().showToast(`Added ${result.added} songs, skipped ${result.skipped}`);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      set({ isScanning: false, scanProgress: null });
    }
  },

  setSortColumn: (col) => set({ sortColumn: col }),
  setSortDirection: (dir) => set({ sortDirection: dir }),

  toggleSort: (col) => {
    const { sortColumn, sortDirection } = get();
    if (sortColumn === col) {
      // Same column: flip direction
      const newDir: SortDirection = sortDirection === "asc" ? "desc" : "asc";
      set({ sortDirection: newDir });
    } else {
      set({ sortColumn: col, sortDirection: "asc" });
    }
    // Reload songs with new sort
    get().loadSongs();
  },
}));

// Persist volume and mute state to localStorage whenever they change
usePlayerStore.subscribe((state) => {
  localStorage.setItem("player_volume", String(state.volume));
  localStorage.setItem("player_muted", String(state.isMuted));
});
