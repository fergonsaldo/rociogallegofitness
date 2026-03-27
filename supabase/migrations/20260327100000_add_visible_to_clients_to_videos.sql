-- RF-E5-02: add visible_to_clients flag to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS visible_to_clients boolean NOT NULL DEFAULT false;
