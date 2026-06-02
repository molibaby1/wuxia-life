-- P6B initial schema (US-003, US-004)

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anonymous_devices (
  id UUID PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_catalog_versions (
  catalog_version TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'deprecated')),
  metadata JSONB NOT NULL,
  bundle JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS save_slots (
  id UUID PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES anonymous_devices(id) ON DELETE CASCADE,
  slot_index SMALLINT NOT NULL CHECK (slot_index BETWEEN 1 AND 3),
  label TEXT NOT NULL DEFAULT '',
  current_snapshot_id UUID,
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, slot_index)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES anonymous_devices(id) ON DELETE CASCADE,
  save_slot_id UUID REFERENCES save_slots(id) ON DELETE SET NULL,
  token_hash TEXT NOT NULL UNIQUE,
  engine_version TEXT NOT NULL,
  event_catalog_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'terminal', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_device_status ON game_sessions (device_id, status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_save_slot ON game_sessions (save_slot_id);

CREATE TABLE IF NOT EXISTS game_snapshots (
  id UUID PRIMARY KEY,
  save_slot_id UUID NOT NULL REFERENCES save_slots(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  slot_version INTEGER NOT NULL,
  schema_version TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  event_catalog_version TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE save_slots
  ADD CONSTRAINT save_slots_current_snapshot_fk
  FOREIGN KEY (current_snapshot_id) REFERENCES game_snapshots(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS replay_actions (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  save_slot_id UUID NOT NULL REFERENCES save_slots(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  event_id TEXT,
  choice_id TEXT,
  snapshot_hash_before TEXT,
  snapshot_hash_after TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_replay_actions_session ON replay_actions (session_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_game_snapshots_slot ON game_snapshots (save_slot_id, created_at DESC);
