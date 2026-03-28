-- ── coach_groups ──────────────────────────────────────────────────────────────
CREATE TABLE coach_groups (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description text        CHECK (char_length(description) <= 300),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coach_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY coach_owns_groups
  ON coach_groups
  FOR ALL
  USING (coach_id = auth.uid());

-- ── group_members ─────────────────────────────────────────────────────────────
CREATE TABLE group_members (
  group_id    uuid        NOT NULL REFERENCES coach_groups(id) ON DELETE CASCADE,
  athlete_id  uuid        NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, athlete_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY coach_owns_group_members
  ON group_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coach_groups
      WHERE coach_groups.id = group_members.group_id
        AND coach_groups.coach_id = auth.uid()
    )
  );
