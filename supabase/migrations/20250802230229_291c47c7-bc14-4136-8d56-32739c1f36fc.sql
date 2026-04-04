-- Phase 2: Database Enhancements for Competitive Analysis Performance (Simplified)

-- Add standard indexes for common filter fields (text arrays need different approach)
CREATE INDEX IF NOT EXISTS idx_eudamed_organization 
ON eudamed_device_registry (organization) WHERE organization IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eudamed_risk_class 
ON eudamed_device_registry (risk_class) WHERE risk_class IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eudamed_organization_country 
ON eudamed_device_registry (organization_country) WHERE organization_country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eudamed_device_name 
ON eudamed_device_registry (device_name) WHERE device_name IS NOT NULL;

-- Composite index for competitive analysis queries
CREATE INDEX IF NOT EXISTS idx_eudamed_competitive_analysis 
ON eudamed_device_registry (organization, risk_class, organization_country) 
WHERE device_name IS NOT NULL AND organization IS NOT NULL;

-- Create function for optimized competitive analysis using array overlap operator
CREATE OR REPLACE FUNCTION get_competitive_analysis(
  target_emdn_codes text[],
  result_limit integer DEFAULT 50
)
RETURNS TABLE(
  device_id text,
  basic_udi_di_code text,
  device_name text,
  organization text,
  nomenclature_codes text[],
  risk_class text,
  organization_country text,
  organization_status text,
  match_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    edr.id::text,
    edr.basic_udi_di_code,
    edr.device_name,
    edr.organization,
    edr.nomenclature_codes,
    edr.risk_class,
    edr.organization_country,
    edr.organization_status,
    -- Calculate match score based on EMDN code hierarchy overlap
    (
      SELECT COUNT(*)::integer 
      FROM unnest(edr.nomenclature_codes) AS emdn_code
      WHERE emdn_code = ANY(target_emdn_codes)
    ) as match_score
  FROM eudamed_device_registry edr
  WHERE edr.nomenclature_codes && target_emdn_codes
    AND edr.device_name IS NOT NULL
    AND edr.organization IS NOT NULL
  ORDER BY match_score DESC, edr.organization, edr.device_name
  LIMIT result_limit;
END;
$$;

-- Create cached summary function for quick insights
CREATE OR REPLACE FUNCTION get_market_summary(emdn_code_pattern text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'emdn_code', emdn_code_pattern,
    'total_devices', COUNT(*),
    'unique_organizations', COUNT(DISTINCT organization),
    'countries_present', COUNT(DISTINCT organization_country),
    'dominant_risk_class', mode() WITHIN GROUP (ORDER BY risk_class),
    'organizations', array_agg(DISTINCT organization ORDER BY organization) FILTER (WHERE organization IS NOT NULL),
    'countries', array_agg(DISTINCT organization_country ORDER BY organization_country) FILTER (WHERE organization_country IS NOT NULL),
    'risk_class_distribution', jsonb_object_agg(
      COALESCE(risk_class, 'Unknown'), 
      COUNT(*)
    )
  ) INTO result
  FROM eudamed_device_registry
  WHERE emdn_code_pattern = ANY(nomenclature_codes)
    AND device_name IS NOT NULL;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Create RLS policies for the functions
CREATE POLICY IF NOT EXISTS "Allow access to competitive analysis functions" 
ON eudamed_device_registry 
FOR SELECT 
USING (true);

-- Add comments for documentation
COMMENT ON FUNCTION get_competitive_analysis IS 
'Optimized function for retrieving competitive devices with match scoring based on EMDN hierarchy overlap.';

COMMENT ON FUNCTION get_market_summary IS 
'Fast market summary lookup for competitive analysis with real-time calculation.';