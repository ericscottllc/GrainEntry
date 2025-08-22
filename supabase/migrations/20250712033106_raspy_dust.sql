/*
  # Add redirect_active column to navigation_items

  1. Changes
    - Add `redirect_active` column to `navigation_items` table
    - Set default value to `false` for existing records
    - Update Dashboard item to have `redirect_active = true`

  2. Purpose
    - Restore the redirect functionality that determines whether clicking a navigation item
      should redirect to the subdomain URL or show local content
    - Dashboard will redirect to its subdomain by default
    - All other items will show local content by default
*/

-- Add the redirect_active column
ALTER TABLE public.navigation_items 
ADD COLUMN IF NOT EXISTS redirect_active BOOLEAN NOT NULL DEFAULT false;

-- Update the Dashboard item to have redirect_active = true
UPDATE public.navigation_items 
SET redirect_active = true 
WHERE title = 'Dashboard';

-- Update all other items to ensure they have redirect_active = false (just to be explicit)
UPDATE public.navigation_items 
SET redirect_active = false 
WHERE title != 'Dashboard';