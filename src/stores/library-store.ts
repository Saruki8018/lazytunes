import { create } from "zustand";
import type { Song, ScanProgress } from "@/lib/song-types";
import { getAllSongs } from "@/lib/song-queries";
import { selectMusicFolder, getSavedFolderPath, scanFolder } from "@/lib/library-scanner";
import { startFileWatcher } from "@/lib/file-watcher";
import { usePlayerStore } from "@/stores/player-store";

interface LibraryStore {
  songs: Song[];
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  folderPath: string | null;
  initialized: boolean;

  initialize: () => Promise<void>;
  loadSongs: () => Promise<void>;
  selectFolder: () => Promise<void>;
  startScan: () => Promise<void>;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  songs: [],
  isScanning: false,
  scanProgress: null,
  folderPath: null,
  initialized: false,

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
      // Only toggle if current mute state differs from saved
      if (store.isMuted !== muted) store.toggleMute();
    }

    // Load existing songs from DB
    await get().loadSongs();

    // Auto-scan if folder is set, then wire file watcher
    if (folderPath) {
      await get().startScan();
      startFileWatcher(folderPath, () => get().startScan()).catch((err) => {
        console.warn("File watcher failed to start:", err);
      });
    }
  },

  loadSongs: async () => {
    const songs = await getAllSongs();
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
      await scanFolder(folderPath, (progress) => {
        set({ scanProgress: progress });
      });
      await get().loadSongs();
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      set({ isScanning: false, scanProgress: null });
    }
  },
}));

// Persist volume and mute state to localStorage whenever they change
usePlayerStore.subscribe((state) => {
  localStorage.setItem("player_volume", String(state.volume));
  localStorage.setItem("player_muted", String(state.isMuted));
});
