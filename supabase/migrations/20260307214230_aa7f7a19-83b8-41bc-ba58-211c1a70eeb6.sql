CREATE TABLE public.feature_user_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  user_need_id uuid NOT NULL REFERENCES public.user_needs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, feature_name, user_need_id)
);

ALTER TABLE public.feature_user_needs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feature_user_needs"
  ON public.feature_user_needs FOR SELECT TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      WHERE p.company_id IN (
        SELECT uca.company_id FROM user_company_access uca WHERE uca.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert feature_user_needs"
  ON public.feature_user_needs FOR INSERT TO authenticated
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM products p
      WHERE p.company_id IN (
        SELECT uca.company_id FROM user_company_access uca
        WHERE uca.user_id = auth.uid()
          AND uca.access_level IN ('admin', 'editor', 'consultant')
      )
    )
  );

CREATE POLICY "Users can delete feature_user_needs"
  ON public.feature_user_needs FOR DELETE TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      WHERE p.company_id IN (
        SELECT uca.company_id FROM user_company_access uca
        WHERE uca.user_id = auth.uid()
          AND uca.access_level IN ('admin', 'editor', 'consultant')
      )
    )
  );