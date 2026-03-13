import { RefreshCw, FolderOpen, Loader2 } from "lucide-react";
import { useLibraryStore } from "@/stores/library-store";

export function SettingsPage() {
  const { folderPath, isScanning, scanProgress, songs, selectFolder, startScan } = useLibraryStore();

  // Guard against division by zero — only compute percentage when total > 0
  const scanPercent =
    scanProgress && scanProgress.total > 0
      ? (scanProgress.current / scanProgress.total) * 100
      : 0;

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-lg font-bold">Settings</h1>

      <section className="mb-6 rounded-lg border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold">Music Library</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Music Folder</label>
            <p className="font-mono text-sm">{folderPath || "Not set"}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {songs.length} song{songs.length !== 1 ? "s" : ""} in library
          </p>
          <div className="flex gap-2">
            <button
              onClick={selectFolder}
              disabled={isScanning}
              className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-50"
            >
              <FolderOpen size={14} />
              {folderPath ? "Change Folder" : "Select Folder"}
            </button>
            {folderPath && (
              <button
                onClick={startScan}
                disabled={isScanning}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isScanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {isScanning ? "Scanning..." : "Rescan"}
              </button>
            )}
          </div>
          {isScanning && scanProgress && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Scanning...</span>
                <span>{scanProgress.current} / {scanProgress.total}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${scanPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold">About</h2>
        <p className="text-sm">LazyTunes</p>
        <p className="text-xs text-muted-foreground">Version 0.1.0</p>
        <p className="mt-2 text-xs text-muted-foreground">Offline music player for your local collection.</p>
      </section>
    </div>
  );
}
