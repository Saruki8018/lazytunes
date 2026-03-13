import { convertFileSrc } from "@tauri-apps/api/core";

export type AudioEventCallback = {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: string) => void;
  onLoaded?: (duration: number) => void;
};

class AudioEngine {
  private audio: HTMLAudioElement;
  private callbacks: AudioEventCallback = {};

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";

    this.audio.addEventListener("timeupdate", () => {
      this.callbacks.onTimeUpdate?.(this.audio.currentTime, this.audio.duration);
    });

    this.audio.addEventListener("ended", () => {
      this.callbacks.onEnded?.();
    });

    this.audio.addEventListener("play", () => {
      this.callbacks.onPlay?.();
    });

    this.audio.addEventListener("pause", () => {
      this.callbacks.onPause?.();
    });

    this.audio.addEventListener("loadedmetadata", () => {
      this.callbacks.onLoaded?.(this.audio.duration);
    });

    this.audio.addEventListener("error", () => {
      const err = this.audio.error?.message || "Unknown playback error";
      // Import lazily to avoid circular dep at module init time
      import("@/stores/ui-store").then(({ useUiStore }) => {
        useUiStore.getState().showToast(`Playback error: ${err}`);
      });
      this.callbacks.onError?.(err);
    });
  }

  setCallbacks(cb: AudioEventCallback) {
    this.callbacks = cb;
  }

  async loadAndPlay(filePath: string): Promise<void> {
    const src = convertFileSrc(filePath);
    this.audio.src = src;
    await this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  resume() {
    // Catch AbortError and NotAllowedError that browsers throw when play() is interrupted
    this.audio.play().catch((err: unknown) => {
      console.warn("resume() play rejected:", err);
    });
  }

  seek(time: number) {
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
  }

  setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  setMuted(muted: boolean) {
    this.audio.muted = muted;
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getDuration(): number {
    return this.audio.duration || 0;
  }

  getVolume(): number {
    return this.audio.volume;
  }
}

// Singleton
export const audioEngine = new AudioEngine();
