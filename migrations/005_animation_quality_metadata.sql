CREATE TABLE IF NOT EXISTS animation_preset_quality_config (
  preset_id TEXT PRIMARY KEY REFERENCES animation_presets(id) ON DELETE CASCADE,
  config_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);
