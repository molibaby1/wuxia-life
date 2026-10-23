CREATE TABLE IF NOT EXISTS game_life_rng_states (
  snapshot_id UUID PRIMARY KEY,
  save_slot_id UUID NOT NULL,
  life_id UUID NOT NULL,
  algorithm TEXT NOT NULL CHECK (algorithm = 'mulberry32'),
  algorithm_version INTEGER NOT NULL CHECK (algorithm_version = 1),
  seed_source TEXT NOT NULL CHECK (seed_source = 'server_csprng'),
  initial_seed BIGINT NOT NULL CHECK (initial_seed BETWEEN 0 AND 4294967295),
  current_state BIGINT NOT NULL CHECK (current_state BETWEEN 0 AND 4294967295),
  draw_index BIGINT NOT NULL CHECK (draw_index >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT game_life_rng_states_snapshot_fk
    FOREIGN KEY (save_slot_id, snapshot_id)
    REFERENCES game_snapshots(save_slot_id, id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT game_life_rng_states_position_check CHECK (
    mod(initial_seed::numeric + 1831565813::numeric * draw_index::numeric, 4294967296::numeric)
      = current_state::numeric
  )
);

CREATE INDEX IF NOT EXISTS idx_game_life_rng_states_life
  ON game_life_rng_states (save_slot_id, life_id, snapshot_id);

ALTER TABLE save_slot_progression_checkpoints
  ADD COLUMN IF NOT EXISTS runtime_state_version INTEGER NOT NULL DEFAULT 0
    CHECK (runtime_state_version IN (0, 1)),
  ADD COLUMN IF NOT EXISTS runtime_state JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(runtime_state) = 'object'),
  ADD CONSTRAINT save_slot_progression_runtime_state_shape_check CHECK (
    (runtime_state_version = 0 AND runtime_state = '{}'::jsonb)
    OR runtime_state_version = 1
  );
