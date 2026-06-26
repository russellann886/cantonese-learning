CREATE TABLE IF NOT EXISTS translation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  cantonese TEXT NOT NULL,
  tone_note TEXT NOT NULL,
  reading_version TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'none',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_translation_history_created_at
  ON translation_history(created_at DESC);
