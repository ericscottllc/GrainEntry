/*
  # Create grain entries table

  1. New Tables
    - `grain_entries`
      - `id` (uuid, primary key)
      - `date` (date) - Date of the grain entry
      - `crop` (text) - Type of crop (Corn, Wheat, Soybeans, etc.)
      - `elevator` (text) - Name of the elevator
      - `town` (text) - Name of the town
      - `month` (text) - Contract month (Jan, Feb, Mar, etc.)
      - `year` (integer) - Contract year
      - `cash_price` (decimal) - Cash price for the grain
      - `futures_price` (decimal) - Futures price for the grain
      - `basis` (decimal) - Calculated difference (cash_price - futures_price)
      - `is_active` (boolean) - Soft delete flag
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `grain_entries` table
    - Add policy for authenticated users to manage their grain entries
    - Add policy for authenticated users to read active grain entries

  3. Indexes
    - Index on date for efficient date-based queries
    - Index on crop for filtering
    - Index on is_active for soft delete queries
    - Composite index on elevator and town for location-based queries
*/

CREATE TABLE IF NOT EXISTS grain_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  crop text NOT NULL,
  elevator text NOT NULL,
  town text NOT NULL,
  month text NOT NULL,
  year integer NOT NULL,
  cash_price decimal(10,2) NOT NULL,
  futures_price decimal(10,2) NOT NULL,
  basis decimal(10,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE grain_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_grain_entries_date ON grain_entries(date);
CREATE INDEX IF NOT EXISTS idx_grain_entries_crop ON grain_entries(crop);
CREATE INDEX IF NOT EXISTS idx_grain_entries_is_active ON grain_entries(is_active);
CREATE INDEX IF NOT EXISTS idx_grain_entries_elevator_town ON grain_entries(elevator, town);
CREATE INDEX IF NOT EXISTS idx_grain_entries_month_year ON grain_entries(month, year);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_grain_entries_updated_at'
    ) THEN
        CREATE TRIGGER update_grain_entries_updated_at
            BEFORE UPDATE ON grain_entries
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;