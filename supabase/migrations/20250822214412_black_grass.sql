/*
  # Update grain entries to use crop classes instead of crops

  1. Schema Changes
    - Update grain_entries table to reference crop_classes instead of master_crops
    - Add new foreign key constraint
    - Update indexes

  2. Data Migration
    - This assumes existing data needs to be preserved
    - You may need to create crop_classes entries for existing crops first
*/

-- Add new class_id column to grain_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grain_entries' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE grain_entries ADD COLUMN class_id uuid;
  END IF;
END $$;

-- Update the foreign key constraint (remove old crop_id constraint if it exists)
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'grain_entries' AND constraint_name = 'grain_entries_crop_id_fkey'
  ) THEN
    ALTER TABLE grain_entries DROP CONSTRAINT grain_entries_crop_id_fkey;
  END IF;
  
  -- Add new constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'grain_entries' AND constraint_name = 'grain_entries_class_id_fkey'
  ) THEN
    ALTER TABLE grain_entries ADD CONSTRAINT grain_entries_class_id_fkey 
    FOREIGN KEY (class_id) REFERENCES crop_classes(id);
  END IF;
END $$;

-- Add index for class_id
CREATE INDEX IF NOT EXISTS idx_grain_entries_class_id ON grain_entries(class_id);

-- Update RLS policies to work with crop_classes
DROP POLICY IF EXISTS "Authenticated users can read active grain entries" ON grain_entries;
CREATE POLICY "Authenticated users can read active grain entries"
  ON grain_entries
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Note: You may want to migrate existing crop_id data to class_id
-- This would require creating appropriate crop_classes entries first
-- Example migration (uncomment and modify as needed):
/*
-- Create default crop classes for existing crops
INSERT INTO crop_classes (crop_id, name, code, description)
SELECT 
  id as crop_id,
  name || ' - Default' as name,
  code || '_DEFAULT' as code,
  'Default class for ' || name as description
FROM master_crops 
WHERE is_active = true
ON CONFLICT (crop_id, name) DO NOTHING;

-- Update grain_entries to use the new crop_classes
UPDATE grain_entries 
SET class_id = (
  SELECT cc.id 
  FROM crop_classes cc 
  WHERE cc.crop_id = grain_entries.crop_id 
  AND cc.name LIKE '% - Default'
  LIMIT 1
)
WHERE class_id IS NULL AND crop_id IS NOT NULL;
*/

-- Eventually you can drop the old crop_id column (after data migration)
-- ALTER TABLE grain_entries DROP COLUMN IF EXISTS crop_id;