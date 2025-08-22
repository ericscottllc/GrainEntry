/*
  # Add redirect_active column to navigation_items

  1. Changes
    - Add `redirect_active` boolean column to `navigation_items` table
    - Set default value to `false` for existing records
    - Update existing records to have appropriate redirect_active values

  2. Security
    - No changes to RLS policies needed
    - Column inherits existing security model
*/

-- Add the redirect_active column
ALTER TABLE navigation_items 
ADD COLUMN redirect_active boolean NOT NULL DEFAULT false;

-- Update existing records with appropriate redirect_active values
-- You can customize these based on which items should redirect
UPDATE navigation_items 
SET redirect_active = true 
WHERE subdomain LIKE '%.triggergrain.ca';

-- For demo purposes, let's set dashboard to not redirect initially
UPDATE navigation_items 
SET redirect_active = false 
WHERE title = 'Dashboard';