import { FolderOpen, RefreshCw, Loader2 } from "lucide-react";
import { useLibraryStore } from "@/stores/library-store";

export function FolderPicker() {
  const { folderPath, isScanning, scanProgress, selectFolder, startScan, songs } =
    useLibraryStore();

  // Guard against division by zero — only compute percentage when total > 0
  const scanPercent =
    scanProgress && scanProgress.total > 0
      ? (scanProgress.current / scanProgress.total) * 100
      : 0;

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6">
      {folderPath ? (
        <>
          <p className="text-sm text-muted-foreground">
            Music folder:{" "}
            <span className="font-mono text-foreground">{folderPath}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {songs.length} song{songs.length !== 1 ? "s" : ""} in library
          </p>
          <div className="flex gap-2">
            <button
              onClick={selectFolder}
              disabled={isScanning}
              className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <FolderOpen size={16} />
              Change Folder
            </button>
            <button
              onClick={startScan}
              disabled={isScanning}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isScanning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {isScanning ? "Scanning..." : "Rescan"}
            </button>
          </div>
        </>
      ) : (
        <>
          <FolderOpen size={48} className="text-muted-foreground" />
          <p className="text-muted-foreground">No music folder selected</p>
          <button
            onClick={selectFolder}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <FolderOpen size={16} />
            Select Music Folder
          </button>
        </>
      )}

      {isScanning && scanProgress && (
        <div className="w-full max-w-xs">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Scanning...</span>
            <span>
              {scanProgress.current} / {scanProgress.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${scanPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
