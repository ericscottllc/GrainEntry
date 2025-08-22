/*
  # Create schema queries table

  1. New Tables
    - `schema_queries`
      - `id` (uuid, primary key)
      - `name` (text, query name)
      - `description` (text, query description)
      - `sql_query` (text, the actual SQL query)
      - `sort_order` (integer, for ordering queries)
      - `is_active` (boolean, to enable/disable queries)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `schema_queries` table
    - Add policy for authenticated users to read queries
    - Add policy for authenticated users to manage queries

  3. Sample Data
    - Insert two placeholder queries for testing
*/

CREATE TABLE IF NOT EXISTS schema_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  sql_query text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE schema_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read schema queries"
  ON schema_queries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage schema queries"
  ON schema_queries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
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
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_schema_queries_updated_at'
  ) THEN
    CREATE TRIGGER update_schema_queries_updated_at
      BEFORE UPDATE ON schema_queries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert sample queries for testing
INSERT INTO schema_queries (name, description, sql_query, sort_order) VALUES
(
  'Table Schemas',
  'Get all table schemas with column details',
  'SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length
  FROM information_schema.tables t
  JOIN information_schema.columns c ON t.table_name = c.table_name
  WHERE t.table_schema = ''public''
    AND t.table_type = ''BASE TABLE''
  ORDER BY t.table_name, c.ordinal_position;',
  1
),
(
  'RLS Policies',
  'Get all Row Level Security policies',
  'SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
  FROM pg_policies
  WHERE schemaname = ''public''
  ORDER BY tablename, policyname;',
  2
);