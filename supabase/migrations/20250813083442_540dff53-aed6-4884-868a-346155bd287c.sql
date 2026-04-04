-- Pricing Strategy Module - Phase 1 (Schema, RLS, functions, triggers) - retry without IF NOT EXISTS for policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'price_rule_type') THEN
    CREATE TYPE public.price_rule_type AS ENUM ('BASE', 'RELATIVE', 'ABSOLUTE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'price_modifier_type') THEN
    CREATE TYPE public.price_modifier_type AS ENUM ('PERCENT', 'FIXED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  model_name text,
  rule_type public.price_rule_type NOT NULL,
  market_code text NOT NULL DEFAULT 'US',
  currency_code text NOT NULL DEFAULT 'USD',
  base_price numeric(12,2),
  relative_type public.price_modifier_type,
  relative_value numeric(12,4),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pricing_rules_scope_xor CHECK (((product_id IS NOT NULL)::int + (model_name IS NOT NULL)::int) = 1),
  CONSTRAINT pricing_rules_fields_check CHECK (
    (rule_type IN ('BASE','ABSOLUTE') AND base_price IS NOT NULL AND relative_type IS NULL AND relative_value IS NULL)
    OR
    (rule_type = 'RELATIVE' AND base_price IS NULL AND relative_type IS NOT NULL AND relative_value IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_pricing_rules_product_market
  ON public.pricing_rules(company_id, market_code, product_id)
  WHERE product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_pricing_rules_model_market
  ON public.pricing_rules(company_id, market_code, lower(model_name))
  WHERE model_name IS NOT NULL;

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- Replace policies
DROP POLICY IF EXISTS "pricing_rules_select" ON public.pricing_rules;
CREATE POLICY "pricing_rules_select"
  ON public.pricing_rules
  FOR SELECT
  USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pricing_rules_insert" ON public.pricing_rules;
CREATE POLICY "pricing_rules_insert"
  ON public.pricing_rules
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca 
      WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

DROP POLICY IF EXISTS "pricing_rules_update" ON public.pricing_rules;
CREATE POLICY "pricing_rules_update"
  ON public.pricing_rules
  FOR UPDATE
  USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca 
      WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca 
      WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

DROP POLICY IF EXISTS "pricing_rules_delete" ON public.pricing_rules;
CREATE POLICY "pricing_rules_delete"
  ON public.pricing_rules
  FOR DELETE
  USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca 
      WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin','editor')
    )
  );

CREATE TABLE IF NOT EXISTS public.pricing_effective (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  market_code text NOT NULL,
  currency_code text NOT NULL,
  effective_price numeric(12,2) NOT NULL,
  source_rule_id uuid REFERENCES public.pricing_rules(id) ON DELETE SET NULL,
  inheritance_path text[] NOT NULL DEFAULT '{}'::text[],
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_pricing_effective_product_market
  ON public.pricing_effective(product_id, market_code);

CREATE INDEX IF NOT EXISTS idx_pricing_effective_company_market
  ON public.pricing_effective(company_id, market_code);

ALTER TABLE public.pricing_effective ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pricing_effective_select" ON public.pricing_effective;
CREATE POLICY "pricing_effective_select"
  ON public.pricing_effective
  FOR SELECT
  USING (
    company_id IN (
      SELECT uca.company_id FROM public.user_company_access uca WHERE uca.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pricing_rules_set_updated_at ON public.pricing_rules;
CREATE TRIGGER trg_pricing_rules_set_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.price_compute_effective_for_product(p_company_id uuid, p_product_id uuid, p_market_code text DEFAULT 'US')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id uuid := p_company_id;
  v_market text := COALESCE(p_market_code, 'US');
  v_price numeric(12,2);
  v_currency text := 'USD';
  v_source_rule uuid;
  v_path text[] := ARRAY[]::text[];
  v_node record;
  v_rule record;
  v_model_rule record;
  v_product_company uuid;
BEGIN
  -- Ensure product belongs to company
  SELECT company_id INTO v_product_company FROM public.products WHERE id = p_product_id;
  IF v_product_company IS NULL OR v_product_company <> v_company_id THEN
    RETURN;
  END IF;

  -- Walk ancestors from root to leaf
  FOR v_node IN
    WITH RECURSIVE ancestors AS (
      SELECT p.id, p.parent_product_id, p.model_reference, 1 AS depth
      FROM public.products p WHERE p.id = p_product_id
      UNION ALL
      SELECT p2.id, p2.parent_product_id, p2.model_reference, a.depth + 1
      FROM public.products p2
      JOIN ancestors a ON a.parent_product_id = p2.id
    )
    SELECT * FROM ancestors ORDER BY depth DESC
  LOOP
    -- Product-level rule at this node
    SELECT r.* INTO v_rule
    FROM public.pricing_rules r
    WHERE r.company_id = v_company_id
      AND r.market_code = v_market
      AND r.product_id = v_node.id
    LIMIT 1;

    IF FOUND THEN
      IF v_rule.rule_type IN ('BASE','ABSOLUTE') THEN
        v_price := v_rule.base_price;
        v_currency := v_rule.currency_code;
        v_source_rule := v_rule.id;
        v_path := v_path || ('product:' || v_node.id || '=' || v_rule.rule_type);
      ELSIF v_rule.rule_type = 'RELATIVE' THEN
        IF v_price IS NULL THEN
          -- Try model-level anchor at this node
          IF v_node.model_reference IS NOT NULL THEN
            SELECT r.* INTO v_model_rule
            FROM public.pricing_rules r
            WHERE r.company_id = v_company_id
              AND r.market_code = v_market
              AND r.model_name ILIKE v_node.model_reference
            LIMIT 1;
            IF FOUND AND v_model_rule.rule_type IN ('BASE','ABSOLUTE') THEN
              v_price := v_model_rule.base_price;
              v_currency := v_model_rule.currency_code;
              v_source_rule := v_model_rule.id;
              v_path := v_path || ('model:' || v_node.model_reference || '=' || v_model_rule.rule_type);
            END IF;
          END IF;
        END IF;

        IF v_price IS NOT NULL THEN
          IF v_rule.relative_type = 'PERCENT' THEN
            v_price := ROUND(v_price * (1 + v_rule.relative_value / 100.0), 2);
          ELSE
            v_price := ROUND(v_price + v_rule.relative_value, 2);
          END IF;
          v_currency := v_rule.currency_code;
          v_source_rule := v_rule.id;
          v_path := v_path || ('product:' || v_node.id || '=RELATIVE');
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Final fallback: model-level base/absolute if still no price
  IF v_price IS NULL THEN
    SELECT r.* INTO v_model_rule
    FROM public.pricing_rules r
    JOIN public.products p ON p.id = p_product_id
    WHERE r.company_id = v_company_id
      AND r.market_code = v_market
      AND r.model_name ILIKE p.model_reference
    LIMIT 1;

    IF FOUND AND v_model_rule.rule_type IN ('BASE','ABSOLUTE') THEN
      v_price := v_model_rule.base_price;
      v_currency := v_model_rule.currency_code;
      v_source_rule := v_model_rule.id;
      v_path := v_path || ('model:' || COALESCE(v_model_rule.model_name,'') || '=' || v_model_rule.rule_type);
    END IF;
  END IF;

  -- Upsert or clear pricing_effective
  IF v_price IS NOT NULL THEN
    INSERT INTO public.pricing_effective AS pe
      (company_id, product_id, market_code, currency_code, effective_price, source_rule_id, inheritance_path, computed_at)
    VALUES
      (v_company_id, p_product_id, v_market, v_currency, v_price, v_source_rule, v_path, now())
    ON CONFLICT (product_id, market_code)
    DO UPDATE SET
      company_id = EXCLUDED.company_id,
      currency_code = EXCLUDED.currency_code,
      effective_price = EXCLUDED.effective_price,
      source_rule_id = EXCLUDED.source_rule_id,
      inheritance_path = EXCLUDED.inheritance_path,
      computed_at = now();
  ELSE
    DELETE FROM public.pricing_effective
    WHERE product_id = p_product_id AND market_code = v_market;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.price_recompute_company(p_company_id uuid, p_market_code text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int := 0;
  v_market text;
  v_markets text[];
  v_product_id uuid;
BEGIN
  IF p_market_code IS NOT NULL THEN
    v_markets := ARRAY[p_market_code];
  ELSE
    SELECT COALESCE(array_agg(DISTINCT market_code), ARRAY['US']::text[])
    INTO v_markets
    FROM public.pricing_rules
    WHERE company_id = p_company_id;
  END IF;

  FOREACH v_market IN ARRAY v_markets LOOP
    FOR v_product_id IN SELECT id FROM public.products WHERE company_id = p_company_id AND (is_archived IS NULL OR is_archived = false) LOOP
      PERFORM public.price_compute_effective_for_product(p_company_id, v_product_id, v_market);
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_pricing_rules_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company uuid := COALESCE(NEW.company_id, OLD.company_id);
  v_market text := COALESCE(NEW.market_code, OLD.market_code);
BEGIN
  PERFORM public.price_recompute_company(v_company, v_market);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_pricing_rules_after_change ON public.pricing_rules;
CREATE TRIGGER trg_pricing_rules_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.pricing_rules
FOR EACH ROW EXECUTE FUNCTION public.trg_pricing_rules_after_change();

CREATE OR REPLACE FUNCTION public.trg_products_after_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_markets text[];
  v_market text;
BEGIN
  IF (TG_OP = 'UPDATE') AND (NEW.parent_product_id IS DISTINCT FROM OLD.parent_product_id OR NEW.model_reference IS DISTINCT FROM OLD.model_reference) THEN
    SELECT COALESCE(array_agg(DISTINCT market_code), ARRAY['US']::text[]) INTO v_markets
    FROM public.pricing_rules WHERE company_id = NEW.company_id;

    FOREACH v_market IN ARRAY v_markets LOOP
      PERFORM public.price_compute_effective_for_product(NEW.company_id, NEW.id, v_market);
    END LOOP;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_after_update ON public.products;
CREATE TRIGGER trg_products_after_update
AFTER UPDATE OF parent_product_id, model_reference ON public.products
FOR EACH ROW EXECUTE FUNCTION public.trg_products_after_update();
