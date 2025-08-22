/*
  # Create execute_sql function for Schema Explorer

  1. New Functions
    - `execute_sql(query text)` - Executes dynamic SQL queries and returns results as JSONB
  
  2. Security
    - Grant execute permissions to authenticated and service_role users
    - Function uses SECURITY DEFINER to run with elevated privileges for schema queries
  
  3. Purpose
    - Enables the Schema Explorer tool to execute database schema analysis queries
    - Returns results in JSONB format for easy frontend consumption
*/

CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$;

-- Grant execute permissions to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;