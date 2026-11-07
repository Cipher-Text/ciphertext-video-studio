CREATE TABLE IF NOT EXISTS media_assets (
  path TEXT PRIMARY KEY,
  media_type TEXT NOT NULL CHECK(media_type IN ('image','video')),
  bytes INTEGER NOT NULL DEFAULT 0 CHECK(bytes >= 0),
  credit TEXT NOT NULL DEFAULT '',
  license TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
