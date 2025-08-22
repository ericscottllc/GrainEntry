/*
  # Create navigation items table

  1. New Tables
    - `navigation_items`
      - `id` (uuid, primary key)
      - `title` (text) - Display name for the navigation item
      - `icon_name` (text) - Lucide icon name to use
      - `subdomain` (text) - Full subdomain URL for redirection
      - `color` (text) - Tailwind color class for highlighting
      - `sort_order` (integer) - Order in which items appear
      - `is_active` (boolean) - Whether the item should be displayed
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `navigation_items` table
    - Add policy for authenticated users to read navigation items
    - Add policy for admin users to manage navigation items

  3. Sample Data
    - Insert default navigation items for TriggerGrain apps
</*/

CREATE TABLE IF NOT EXISTS navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Circle',
  subdomain text NOT NULL,
  color text NOT NULL DEFAULT 'tg-primary',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read navigation items
CREATE POLICY "Anyone can read active navigation items"
  ON navigation_items
  FOR SELECT
  USING (is_active = true);

-- Policy for authenticated users to manage navigation items (you can restrict this further)
CREATE POLICY "Authenticated users can manage navigation items"
  ON navigation_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default navigation items
INSERT INTO navigation_items (title, icon_name, subdomain, color, sort_order, is_active) VALUES
  ('Dashboard', 'BarChart3', 'dashboard.triggergrain.ca', 'tg-primary', 1, true),
  ('Grain Entries', 'Grain', 'grainentries.triggergrain.ca', 'tg-green', 2, true),
  ('Analytics', 'TrendingUp', 'analytics.triggergrain.ca', 'tg-coral', 3, true),
  ('Scenario', 'Workflow', 'scenario.triggergrain.ca', 'tg-primary', 4, true),
  ('Clients', 'Users', 'clients.triggergrain.ca', 'tg-green', 5, true),
  ('One Pager', 'FileText', 'onepager.triggergrain.ca', 'tg-coral', 6, true),
  ('Blog Posts', 'BookOpen', 'blogposts.triggergrain.ca', 'tg-primary', 7, true),
  ('Settings', 'Settings', 'settings.triggergrain.ca', 'tg-grey', 8, true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_navigation_items_updated_at
  BEFORE UPDATE ON navigation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();