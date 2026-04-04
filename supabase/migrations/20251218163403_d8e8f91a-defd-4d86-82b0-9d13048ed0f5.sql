ALTER TABLE public.product_manual_competitors
  ADD COLUMN IF NOT EXISTS device_classification TEXT,
  ADD COLUMN IF NOT EXISTS market_share_estimate TEXT;