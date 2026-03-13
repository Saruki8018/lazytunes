import { create } from "zustand";
import type { Song } from "@/lib/song-types";
import { audioEngine } from "@/lib/audio-engine";
import { updateMediaSession } from "@/lib/media-session-handler";

type RepeatMode = "off" | "all" | "one";

interface PlayerStore {
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  shuffledIndices: number[];

  playSong: (song: Song, queue?: Song[]) => void;
  playQueue: (songs: Song[], startIndex?: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

function shuffleArray(length: number, startIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  // Move startIndex to front so current song plays first
  const pos = indices.indexOf(startIndex);
  if (pos > 0) {
    [indices[0], indices[pos]] = [indices[pos]!, indices[0]!];
  }
  return indices;
}

export const usePlayerStore = create<PlayerStore>((set, get) => {
  // Wire audio engine events to store
  audioEngine.setCallbacks({
    onTimeUpdate: (currentTime, duration) => {
      set({ currentTime, duration: duration || get().duration });
    },
    onLoaded: (duration) => {
      set({ duration });
    },
    onEnded: () => {
      const { repeatMode, currentSong } = get();
      if (repeatMode === "one" && currentSong) {
        audioEngine.seek(0);
        audioEngine.resume();
      } else {
        get().next();
      }
    },
    onPlay: () => set({ isPlaying: true }),
    onPause: () => set({ isPlaying: false }),
    onError: (err) => {
      console.error("Playback error:", err);
      // Skip to next on error
      get().next();
    },
  });

  function playAtIndex(index: number) {
    const { queue, shuffleEnabled, shuffledIndices } = get();
    const actualIndex = shuffleEnabled ? (shuffledIndices[index] ?? index) : index;
    const song = queue[actualIndex];
    if (!song) return;

    set({ currentSong: song, queueIndex: index, currentTime: 0, duration: 0 });
    audioEngine.loadAndPlay(song.file_path).catch((err) => {
      console.error("Failed to play:", err);
    });
    updateMediaSession(song);
  }

  return {
    currentSong: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    shuffleEnabled: false,
    repeatMode: "off",
    shuffledIndices: [],

    playSong: (song, queue) => {
      const songs = queue || get().queue;
      const index = songs.findIndex((s) => s.id === song.id);
      set({
        queue: songs,
        shuffledIndices: get().shuffleEnabled ? shuffleArray(songs.length, Math.max(0, index)) : [],
      });
      playAtIndex(Math.max(0, index));
    },

    playQueue: (songs, startIndex = 0) => {
      set({
        queue: songs,
        shuffledIndices: get().shuffleEnabled ? shuffleArray(songs.length, startIndex) : [],
      });
      playAtIndex(startIndex);
    },

    togglePlay: () => {
      const { isPlaying, currentSong } = get();
      if (!currentSong) return;
      if (isPlaying) {
        audioEngine.pause();
      } else {
        audioEngine.resume();
      }
    },

    next: () => {
      const { queue, queueIndex, repeatMode } = get();
      if (queue.length === 0) return;

      let nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === "all") {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }
      playAtIndex(nextIndex);
    },

    prev: () => {
      const { queueIndex, currentTime } = get();
      // If more than 3s into song, restart it
      if (currentTime > 3) {
        audioEngine.seek(0);
        return;
      }
      const prevIndex = Math.max(0, queueIndex - 1);
      playAtIndex(prevIndex);
    },

    seek: (time) => {
      audioEngine.seek(time);
      set({ currentTime: time });
    },

    setVolume: (v) => {
      const volume = Math.max(0, Math.min(1, v));
      audioEngine.setVolume(volume);
      set({ volume, isMuted: false });
    },

    toggleMute: () => {
      const muted = !get().isMuted;
      audioEngine.setMuted(muted);
      set({ isMuted: muted });
    },

    toggleShuffle: () => {
      const enabled = !get().shuffleEnabled;
      const { queue, queueIndex } = get();
      set({
        shuffleEnabled: enabled,
        shuffledIndices: enabled ? shuffleArray(queue.length, queueIndex) : [],
      });
    },

    cycleRepeat: () => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const current = modes.indexOf(get().repeatMode);
      set({ repeatMode: modes[(current + 1) % modes.length]! });
    },

    addToQueue: (song) => {
      set((s) => ({ queue: [...s.queue, song] }));
    },

    removeFromQueue: (index) => {
      set((s) => {
        const queue = [...s.queue];
        queue.splice(index, 1);

        let queueIndex = s.queueIndex;
        if (index < queueIndex) {
          // Removed a song before the current one — shift index back
          queueIndex--;
        } else if (index === queueIndex) {
          // Removed the currently playing song — stop playback
          audioEngine.pause();
          const currentSong = queue[queueIndex] ?? queue[queueIndex - 1] ?? null;
          return { queue, queueIndex: currentSong ? Math.min(queueIndex, queue.length - 1) : -1, currentSong, isPlaying: false };
        }
        // index > queueIndex: no adjustment needed

        return { queue, queueIndex };
      });
    },

    clearQueue: () => {
      set({ queue: [], queueIndex: -1, currentSong: null, isPlaying: false });
      audioEngine.pause();
    },
  };
});
