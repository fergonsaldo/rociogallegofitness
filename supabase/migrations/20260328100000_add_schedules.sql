CREATE TABLE schedules (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id             uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                text        NOT NULL,
  start_date           date        NOT NULL,
  end_date             date        NOT NULL,
  start_time           text        NOT NULL DEFAULT '09:00',
  end_time             text        NOT NULL DEFAULT '18:00',
  slot_duration_minutes int        NOT NULL DEFAULT 60,
  modality             text        NOT NULL DEFAULT 'in_person',
  is_active            boolean     NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX schedules_coach_id_idx ON schedules (coach_id);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY schedules_coach_owns
  ON schedules
  FOR ALL
  USING (coach_id = auth.uid());
