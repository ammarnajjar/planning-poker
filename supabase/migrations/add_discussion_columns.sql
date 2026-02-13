-- Add discussion mode columns to rooms table
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS discussion_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS discussion_min_voter TEXT,
ADD COLUMN IF NOT EXISTS discussion_max_voter TEXT;
