import { useEffect, useState } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { initDb } from "@/lib/database";
import { useLibraryStore } from "@/stores/library-store";
import { usePlayerStore } from "@/stores/player-store";
import { initMediaSessionHandlers } from "@/lib/media-session-handler";
import { initKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { audioEngine } from "@/lib/audio-engine";
import { AppLayout } from "@/components/layout/app-layout";
import { LibraryPage } from "@/components/library/library-page";
import { SettingsPage } from "@/components/settings/settings-page";
import { ErrorBoundary } from "@/components/error-boundary";
import { ToastNotifications } from "@/components/common/toast-notifications";

export default function App() {
  const [ready, setReady] = useState(false);
  const initialize = useLibraryStore((s) => s.initialize);

  useEffect(() => {
    initDb()
      .then(() => initialize())
      .then(() => setReady(true))
      .catch((err) => console.error("Init failed:", err));
  }, [initialize]);

  // Wire keyboard shortcuts + MediaSession
  useEffect(() => {
    const store = usePlayerStore.getState;
    initMediaSessionHandlers({
      togglePlay: () => store().togglePlay(),
      next: () => store().next(),
      prev: () => store().prev(),
      seek: (t) => store().seek(t),
    });

    const cleanup = initKeyboardShortcuts({
      togglePlay: () => store().togglePlay(),
      next: () => store().next(),
      prev: () => store().prev(),
      seek: (t) => store().seek(t),
      getCurrentTime: () => audioEngine.getCurrentTime(),
      setVolume: (v) => store().setVolume(v),
      getVolume: () => audioEngine.getVolume(),
      toggleMute: () => store().toggleMute(),
    });

    return cleanup;
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        {/* Spinning ring */}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-base font-semibold text-muted-foreground">LazyTunes</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <MemoryRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AppLayout>
        <ToastNotifications />
      </MemoryRouter>
    </ErrorBoundary>
  );
}
