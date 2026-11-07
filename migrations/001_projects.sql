CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL CHECK(language IN ('en', 'bn')),
  format TEXT NOT NULL CHECK(format IN ('landscape', 'portrait', 'square')),
  script TEXT NOT NULL,
  script_approved INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  storyboard_json TEXT
);
