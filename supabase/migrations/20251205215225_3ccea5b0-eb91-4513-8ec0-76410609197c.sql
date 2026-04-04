-- Create RLS policies for public investor view access

-- 1. Allow anonymous users to read active investor share settings by public_slug
CREATE POLICY "Allow public read of active share settings"
ON public.company_investor_share_settings
FOR SELECT
TO anon
USING (is_active = true);

-- 2. Allow anonymous users to read companies that have active share links
CREATE POLICY "Allow public read of companies with active shares"
ON public.companies
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.company_investor_share_settings
    WHERE company_investor_share_settings.company_id = companies.id
    AND company_investor_share_settings.is_active = true
  )
);

-- 3. Allow anonymous users to read products for companies with active share links
CREATE POLICY "Allow public read of products for investor view"
ON public.products
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.company_investor_share_settings
    WHERE company_investor_share_settings.company_id = products.company_id
    AND company_investor_share_settings.is_active = true
  )
);

-- 4. Allow anonymous users to read viability scorecards for products with active share links
CREATE POLICY "Allow public read of scorecards for investor view"
ON public.product_viability_scorecards
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.company_investor_share_settings s ON s.company_id = p.company_id
    WHERE p.id = product_viability_scorecards.product_id
    AND s.is_active = true
  )
);

-- 5. Allow anonymous users to read business canvas for products with active share links
CREATE POLICY "Allow public read of business canvas for investor view"
ON public.business_canvas
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.company_investor_share_settings s ON s.company_id = p.company_id
    WHERE p.id = business_canvas.product_id
    AND s.is_active = true
  )
);