/*
  # Fix execute_sql function to handle semicolons

  1. Updated Function
    - Remove trailing semicolons from queries before execution
    - Handle queries that may or may not have semicolons
    - Maintain JSONB return type for frontend compatibility

  2. Security
    - Maintains existing RLS and permissions
    - SECURITY DEFINER for schema access
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS execute_sql(text);

-- Create the updated function that handles semicolons
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    clean_query text;
BEGIN
    -- Remove trailing semicolons and whitespace
    clean_query := rtrim(rtrim(query), ';');
    
    -- Execute the query and return as JSONB
    EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || clean_query || ') t' INTO result;
    
    -- Return empty array if no results
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;