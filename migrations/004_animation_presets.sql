CREATE TABLE IF NOT EXISTS animation_presets (
  id TEXT PRIMARY KEY,
  brand_id TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  renderer_key TEXT NOT NULL,
  version INTEGER NOT NULL CHECK(version > 0),
  tags_json TEXT NOT NULL DEFAULT '[]',
  defaults_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS animation_presets_brand_idx ON animation_presets(brand_id, category, name);
