import { open } from "@tauri-apps/plugin-dialog";
import { readDir, stat } from "@tauri-apps/plugin-fs";
import { parseAudioFile } from "./metadata-parser";
import { getSongByPath, upsertSong, deleteSongsByPaths, getAllSongs, getSetting, setSetting } from "./song-queries";
import { SUPPORTED_EXTENSIONS } from "./song-types";
import type { ScanProgress } from "./song-types";

const SETTINGS_KEY_FOLDER = "music_folder_path";

// Common Android music paths for mobile detection
const ANDROID_MUSIC_PATHS = [
  "/storage/emulated/0/Music",
  "/storage/emulated/0/Download",
];

/** Detect if running on mobile (Android) */
export function isMobile(): boolean {
  return /Android/i.test(navigator.userAgent);
}

/** Open native folder picker and return selected path */
export async function selectMusicFolder(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false, title: "Select Music Folder" });
  if (typeof selected === "string") {
    await setSetting(SETTINGS_KEY_FOLDER, selected);
    return selected;
  }
  return null;
}

/** Get saved folder path from settings, with Android default fallback */
export async function getSavedFolderPath(): Promise<string | null> {
  const saved = await getSetting(SETTINGS_KEY_FOLDER);
  if (saved) return saved;

  // On Android, try default Music folder
  if (isMobile()) {
    return ANDROID_MUSIC_PATHS[0] ?? null;
  }
  return null;
}

/** Recursively collect audio file paths from a directory */
async function collectAudioFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readDir(dirPath);
    for (const entry of entries) {
      const fullPath = `${dirPath}/${entry.name}`;
      if (entry.isDirectory) {
        const subFiles = await collectAudioFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile) {
        const ext = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.warn(`Failed to read directory: ${dirPath}`, err);
  }
  return files;
}

/** Scan a folder for audio files, extract metadata, save to DB */
export async function scanFolder(
  folderPath: string,
  onProgress?: (progress: ScanProgress) => void,
): Promise<{ added: number; skipped: number; errors: number }> {
  const audioPaths = await collectAudioFiles(folderPath);
  const total = audioPaths.length;
  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < audioPaths.length; i++) {
    const filePath = audioPaths[i]!;
    onProgress?.({ current: i + 1, total });

    try {
      // Incremental scan: skip only if DB mtime >= file's current mtime
      const existing = await getSongByPath(filePath);
      if (existing?.modified_at) {
        const fileStat = await stat(filePath);
        const fileMtime = fileStat.mtime ? new Date(fileStat.mtime).getTime() : 0;
        if (existing.modified_at >= fileMtime) {
          skipped++;
          continue;
        }
      }

      const metadata = await parseAudioFile(filePath);
      await upsertSong(metadata);
      added++;
    } catch (err) {
      console.warn(`Failed to process: ${filePath}`, err);
      errors++;
    }
  }

  // Remove songs whose files no longer exist on disk
  await removeDeletedSongs(folderPath, audioPaths);

  return { added, skipped, errors };
}

/** Remove DB entries for files that no longer exist */
async function removeDeletedSongs(folderPath: string, currentPaths: string[]): Promise<void> {
  const allSongs = await getAllSongs();
  const currentSet = new Set(currentPaths);
  const toDelete = allSongs
    .filter((s) => s.file_path.startsWith(folderPath) && !currentSet.has(s.file_path))
    .map((s) => s.file_path);

  if (toDelete.length > 0) {
    await deleteSongsByPaths(toDelete);
  }
}
