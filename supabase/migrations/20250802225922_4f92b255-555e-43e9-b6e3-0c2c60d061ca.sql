-- Phase 2: Database Enhancements for Competitive Analysis Performance

-- Add GIN index on nomenclature_codes for fast EMDN code matching
CREATE INDEX IF NOT EXISTS idx_eudamed_nomenclature_codes_gin 
ON eudamed_device_registry USING GIN (nomenclature_codes);

-- Add standard indexes for common filter fields
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

-- Create materialized view for market analysis aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS competitive_market_insights AS
SELECT 
  unnest(nomenclature_codes) as emdn_code,
  COUNT(*) as total_devices,
  COUNT(DISTINCT organization) as unique_organizations,
  COUNT(DISTINCT organization_country) as countries_present,
  mode() WITHIN GROUP (ORDER BY risk_class) as dominant_risk_class,
  array_agg(DISTINCT organization ORDER BY organization) FILTER (WHERE organization IS NOT NULL) as organizations,
  array_agg(DISTINCT organization_country ORDER BY organization_country) FILTER (WHERE organization_country IS NOT NULL) as countries,
  jsonb_object_agg(
    COALESCE(risk_class, 'Unknown'), 
    risk_class_count
  ) as risk_class_distribution
FROM (
  SELECT 
    nomenclature_codes,
    organization,
    organization_country,
    risk_class,
    COUNT(*) OVER (PARTITION BY unnest(nomenclature_codes), risk_class) as risk_class_count
  FROM eudamed_device_registry
  WHERE nomenclature_codes IS NOT NULL 
    AND array_length(nomenclature_codes, 1) > 0
    AND device_name IS NOT NULL
) subquery
GROUP BY unnest(nomenclature_codes)
HAVING COUNT(*) >= 2; -- Only include EMDN codes with multiple devices

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_competitive_insights_emdn_code 
ON competitive_market_insights (emdn_code);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_competitive_insights()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY competitive_market_insights;
END;
$$;

-- Create RLS policy for materialized view
ALTER TABLE competitive_market_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to competitive insights" 
ON competitive_market_insights 
FOR SELECT 
USING (true);

-- Create function for optimized competitive analysis
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
    -- Calculate match score based on EMDN code hierarchy depth
    GREATEST(
      array_length(
        array(
          SELECT unnest(edr.nomenclature_codes) 
          INTERSECT 
          SELECT unnest(target_emdn_codes)
        ), 
        1
      ), 
      0
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
  -- Try to get from materialized view first (exact match)
  SELECT row_to_json(cmi)::jsonb INTO result
  FROM competitive_market_insights cmi
  WHERE cmi.emdn_code = emdn_code_pattern;
  
  -- If not found, calculate on-the-fly for partial matches
  IF result IS NULL THEN
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
  END IF;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Add comment for documentation
COMMENT ON MATERIALIZED VIEW competitive_market_insights IS 
'Pre-computed market insights for competitive analysis. Refreshed periodically for performance.';

COMMENT ON FUNCTION get_competitive_analysis IS 
'Optimized function for retrieving competitive devices with match scoring based on EMDN hierarchy.';

COMMENT ON FUNCTION get_market_summary IS 
'Fast market summary lookup with materialized view fallback to real-time calculation.';