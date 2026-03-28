CREATE TABLE session_types (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text        NOT NULL DEFAULT '#6B7280',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX session_types_coach_id_idx ON session_types (coach_id);

ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_types_coach_owns
  ON session_types
  FOR ALL
  USING (coach_id = auth.uid());
