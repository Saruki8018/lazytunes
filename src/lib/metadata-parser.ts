import { readFile, stat } from "@tauri-apps/plugin-fs";
// @ts-expect-error music-metadata has no type declarations
import { parseBuffer } from "music-metadata";
import type { SongMetadata } from "./song-types";

const MAX_COVER_ART_BYTES = 200 * 1024; // 200KB cap

/**
 * Convert Uint8Array to base64 string using chunked processing.
 * Avoids "Maximum call stack size exceeded" from spread operator on large arrays.
 */
function uint8ToBase64(data: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < data.length; i += chunkSize) {
    binary += String.fromCharCode(...data.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** Extract metadata from a single audio file */
export async function parseAudioFile(filePath: string): Promise<SongMetadata> {
  const fileBytes = await readFile(filePath);
  const fileStat = await stat(filePath);
  // parseBuffer accepts Uint8Array directly
  const metadata = await parseBuffer(fileBytes);

  // Extract cover art (first picture, capped size)
  let coverArt: string | null = null;
  const picture = metadata.common.picture?.[0];
  if (picture && picture.data.length <= MAX_COVER_ART_BYTES) {
    const base64 = uint8ToBase64(picture.data);
    coverArt = `data:${picture.format};base64,${base64}`;
  }

  // Fallback: derive title from filename if no tag
  const title = metadata.common.title || fileNameToTitle(filePath);

  return {
    file_path: filePath,
    title,
    artist: metadata.common.artist || "Unknown Artist",
    album: metadata.common.album || "Unknown Album",
    duration: metadata.format.duration || 0,
    cover_art: coverArt,
    file_size: fileStat.size,
    modified_at: fileStat.mtime ? new Date(fileStat.mtime).getTime() : Date.now(),
  };
}

/** Convert file path to a readable title */
function fileNameToTitle(filePath: string): string {
  const parts = filePath.replace(/\\/g, "/").split("/");
  const fileName = parts[parts.length - 1] || "Unknown";
  // Remove extension
  const dotIndex = fileName.lastIndexOf(".");
  const name = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  // Remove common prefixes like "01 - " or "01. "
  return name.replace(/^\d+[\s.\-_]+/, "").trim() || name;
}
