/*
  # Comprehensive Grain Entry System

  1. Master Tables
    - `master_crops` - Crop types (Corn, Wheat, Soybeans, etc.)
    - `master_elevators` - Elevator locations
    - `master_towns` - Town locations
    - `grain_entries` - Main entries table with foreign keys

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data

  3. Features
    - Proper foreign key relationships
    - Soft delete functionality
    - Automatic timestamps
    - Indexes for performance
*/

-- Master Crops Table
CREATE TABLE IF NOT EXISTS master_crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Master Elevators Table
CREATE TABLE IF NOT EXISTS master_elevators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Master Towns Table
CREATE TABLE IF NOT EXISTS master_towns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  province text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drop existing grain_entries table if it exists
DROP TABLE IF EXISTS grain_entries;

-- Grain Entries Table (updated with foreign keys)
CREATE TABLE IF NOT EXISTS grain_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  crop_id uuid NOT NULL REFERENCES master_crops(id),
  elevator_id uuid NOT NULL REFERENCES master_elevators(id),
  town_id uuid NOT NULL REFERENCES master_towns(id),
  month text NOT NULL,
  year integer NOT NULL,
  cash_price numeric(10,2),
  futures numeric(10,2),
  notes text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE master_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_elevators ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE grain_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for master_crops
CREATE POLICY "Authenticated users can read active crops"
  ON master_crops
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage crops"
  ON master_crops
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for master_elevators
CREATE POLICY "Authenticated users can read active elevators"
  ON master_elevators
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage elevators"
  ON master_elevators
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for master_towns
CREATE POLICY "Authenticated users can read active towns"
  ON master_towns
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage towns"
  ON master_towns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for grain_entries
CREATE POLICY "Authenticated users can read active grain entries"
  ON grain_entries
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert grain entries"
  ON grain_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update grain entries"
  ON grain_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_grain_entries_date ON grain_entries(date);
CREATE INDEX IF NOT EXISTS idx_grain_entries_crop_id ON grain_entries(crop_id);
CREATE INDEX IF NOT EXISTS idx_grain_entries_elevator_id ON grain_entries(elevator_id);
CREATE INDEX IF NOT EXISTS idx_grain_entries_town_id ON grain_entries(town_id);
CREATE INDEX IF NOT EXISTS idx_grain_entries_month_year ON grain_entries(month, year);
CREATE INDEX IF NOT EXISTS idx_grain_entries_is_active ON grain_entries(is_active);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_master_crops_updated_at BEFORE UPDATE ON master_crops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_elevators_updated_at BEFORE UPDATE ON master_elevators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_towns_updated_at BEFORE UPDATE ON master_towns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grain_entries_updated_at BEFORE UPDATE ON grain_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO master_crops (name, code) VALUES
  ('Corn', 'CORN'),
  ('Wheat', 'WHEAT'),
  ('Soybeans', 'SOY'),
  ('Oats', 'OATS'),
  ('Barley', 'BARLEY')
ON CONFLICT (name) DO NOTHING;

INSERT INTO master_elevators (name, code) VALUES
  ('Grain Co-op', 'GCO'),
  ('Prairie Elevator', 'PE'),
  ('Harvest Point', 'HP'),
  ('Golden Grain', 'GG'),
  ('Farm Fresh', 'FF'),
  ('Midwest Grain', 'MG'),
  ('Central Elevator', 'CE')
ON CONFLICT (name) DO NOTHING;

INSERT INTO master_towns (name, province) VALUES
  ('Winnipeg', 'MB'),
  ('Calgary', 'AB'),
  ('Edmonton', 'AB'),
  ('Saskatoon', 'SK'),
  ('Regina', 'SK'),
  ('Brandon', 'MB'),
  ('Lethbridge', 'AB'),
  ('Prince Albert', 'SK'),
  ('Portage la Prairie', 'MB'),
  ('Red Deer', 'AB')
ON CONFLICT (name) DO NOTHING;