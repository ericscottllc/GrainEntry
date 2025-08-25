/*
  # Add user_id column to grain_entries table

  1. Changes
    - Add `user_id` column to `grain_entries` table
    - Update RLS policies to be user-specific
    - Add foreign key constraint to auth.users

  2. Security
    - Users can only access their own grain entries
    - Proper user isolation
*/

-- Add user_id column to grain_entries table
ALTER TABLE grain_entries 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Update existing entries to have a user_id (set to the first authenticated user if any exist)
-- This is a one-time migration for existing data
DO $$
DECLARE
    first_user_id uuid;
BEGIN
    -- Get the first user ID from auth.users
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- Update existing entries without user_id
    IF first_user_id IS NOT NULL THEN
        UPDATE grain_entries 
        SET user_id = first_user_id 
        WHERE user_id IS NULL;
    END IF;
END $$;

-- Make user_id NOT NULL after setting existing values
ALTER TABLE grain_entries 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Authenticated users can read active grain entries" ON grain_entries;
DROP POLICY IF EXISTS "Authenticated users can insert grain entries" ON grain_entries;
DROP POLICY IF EXISTS "Authenticated users can update grain entries" ON grain_entries;

-- Create new user-specific RLS policies
CREATE POLICY "Users can read their own active grain entries"
  ON grain_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_active = true);

CREATE POLICY "Users can insert their own grain entries"
  ON grain_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own grain entries"
  ON grain_entries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add index for user_id for better performance
CREATE INDEX IF NOT EXISTS idx_grain_entries_user_id ON grain_entries(user_id);