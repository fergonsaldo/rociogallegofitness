-- ── tag_automations ───────────────────────────────────────────────────────────
-- Stores the content auto-assignment config per tag.
-- When a tag is assigned to an athlete, the referenced routine/cardio/plan
-- are automatically assigned to that athlete.

CREATE TABLE tag_automations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id            uuid        NOT NULL REFERENCES client_tags(id) ON DELETE CASCADE,
  routine_id        uuid        REFERENCES routines(id) ON DELETE SET NULL,
  cardio_id         uuid        REFERENCES cardios(id) ON DELETE SET NULL,
  nutrition_plan_id uuid        REFERENCES nutrition_plans(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tag_id)
);

ALTER TABLE tag_automations ENABLE ROW LEVEL SECURITY;

-- Coach can only access automations for tags they own
CREATE POLICY coach_owns_tag_automations
  ON tag_automations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM client_tags
      WHERE client_tags.id = tag_automations.tag_id
        AND client_tags.coach_id = auth.uid()
    )
  );
