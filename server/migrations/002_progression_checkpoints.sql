-- Persist only settled progression summaries that cannot be reconstructed from a snapshot.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'game_snapshots_slot_id_unique'
       AND conrelid = 'game_snapshots'::regclass
  ) THEN
    ALTER TABLE game_snapshots
      ADD CONSTRAINT game_snapshots_slot_id_unique UNIQUE (save_slot_id, id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS save_slot_progression_checkpoints (
  save_slot_id UUID PRIMARY KEY REFERENCES save_slots(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL,
  protocol_version INTEGER NOT NULL CHECK (protocol_version = 1),
  checkpoint_state TEXT NOT NULL CHECK (
    checkpoint_state IN ('clear', 'pending', 'legacy_unknown')
  ),
  phase TEXT CHECK (
    phase IN ('action_summary', 'disturbance_narrative', 'period_summary')
  ),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT save_slot_progression_checkpoints_snapshot_fk
    FOREIGN KEY (save_slot_id, snapshot_id)
    REFERENCES game_snapshots(save_slot_id, id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT save_slot_progression_checkpoints_shape_check CHECK (
    (checkpoint_state = 'pending' AND phase IS NOT NULL AND payload <> '{}'::jsonb)
    OR
    (checkpoint_state IN ('clear', 'legacy_unknown') AND phase IS NULL AND payload = '{}'::jsonb)
  )
);

CREATE INDEX IF NOT EXISTS idx_progression_checkpoints_snapshot
  ON save_slot_progression_checkpoints (snapshot_id);

INSERT INTO save_slot_progression_checkpoints (
  save_slot_id, snapshot_id, protocol_version, checkpoint_state, phase, payload
)
SELECT
  slot.id,
  slot.current_snapshot_id,
  1,
  CASE
    WHEN snapshot.snapshot #>> '{state,player,alive}' = 'false'
      OR (
        snapshot.snapshot #> '{state,ending}' IS NOT NULL
        AND snapshot.snapshot #> '{state,ending}' <> 'null'::jsonb
      )
    THEN 'clear'
    ELSE 'legacy_unknown'
  END,
  NULL,
  '{}'::jsonb
FROM save_slots AS slot
JOIN game_snapshots AS snapshot
  ON snapshot.id = slot.current_snapshot_id
 AND snapshot.save_slot_id = slot.id
ON CONFLICT (save_slot_id) DO NOTHING;
