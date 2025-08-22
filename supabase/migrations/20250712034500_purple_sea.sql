/*
  # Fix execute_sql function to properly handle query results

  1. Function Updates
    - Drop and recreate execute_sql function with proper result handling
    - Use dynamic SQL execution with proper JSON conversion
    - Handle both single row and multi-row results
    - Return consistent JSONB format

  2. Security
    - Maintain SECURITY DEFINER for schema access
    - Keep existing permissions for authenticated users
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS public.execute_sql(text);

-- Create the corrected function that properly handles query results
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json jsonb;
BEGIN
    -- Execute the query and convert to JSON
    EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query) INTO result_json;
    
    -- Return empty array if no results
    IF result_json IS NULL THEN
        result_json := '[]'::jsonb;
    END IF;
    
    RETURN result_json;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;