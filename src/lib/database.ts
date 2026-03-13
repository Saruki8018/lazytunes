import Database from "@tauri-apps/plugin-sql";

// Promise-based singleton prevents parallel load() calls racing each other
let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:lazytunes.db");
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  const database = await getDb();

  await database.execute(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL UNIQUE,
      title TEXT,
      artist TEXT,
      album TEXT,
      duration REAL,
      cover_art TEXT,
      file_size INTEGER,
      modified_at INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS playlist_songs (
      playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
      song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      PRIMARY KEY (playlist_id, song_id)
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  await database.execute("CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist)");
  await database.execute("CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album)");
  await database.execute("CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title)");
}
