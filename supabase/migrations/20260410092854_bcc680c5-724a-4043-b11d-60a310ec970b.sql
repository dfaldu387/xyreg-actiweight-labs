
-- Create the standard_version_status table
CREATE TABLE public.standard_version_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_key TEXT UNIQUE NOT NULL,
  standard_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Force',
  successor_name TEXT,
  iso_url TEXT,
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.standard_version_status ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users
CREATE POLICY "Anyone can read standard statuses"
  ON public.standard_version_status FOR SELECT TO authenticated USING (true);

-- Seed with standards
INSERT INTO public.standard_version_status (framework_key, standard_name, status, iso_url) VALUES
  ('ISO_13485', 'ISO 13485:2016', 'In Force', 'https://www.iso.org/standard/59752.html'),
  ('ISO_14971', 'ISO 14971:2019', 'In Force', 'https://www.iso.org/standard/72704.html'),
  ('IEC_62304', 'IEC 62304:2006+AMD1:2015', 'In Force', 'https://webstore.iec.ch/en/publication/22794'),
  ('IEC_62366', 'IEC 62366-1:2015+AMD1:2020', 'In Force', 'https://webstore.iec.ch/en/publication/67220'),
  ('IEC_60601_1', 'IEC 60601-1:2005+AMD1:2012+AMD2:2020', 'In Force', 'https://webstore.iec.ch/en/publication/67497'),
  ('IEC_60601_1_2', 'IEC 60601-1-2:2014+AMD1:2020', 'In Force', 'https://webstore.iec.ch/en/publication/67236'),
  ('IEC_60601_1_6', 'IEC 60601-1-6:2010+AMD1:2013+AMD2:2020', 'In Force', 'https://webstore.iec.ch/en/publication/67498'),
  ('ISO_15223', 'ISO 15223-1:2021/Amd 1:2025', 'In Force', 'https://www.iso.org/standard/77326.html'),
  ('ISO_20417', 'ISO 20417:2021', 'In Force', 'https://www.iso.org/standard/78122.html'),
  ('ISO_10993', 'ISO 10993-1:2018', 'In Force', 'https://www.iso.org/standard/68936.html'),
  ('MDR_ANNEX_I', 'EU MDR 2017/745 Annex I', 'In Force', 'https://eur-lex.europa.eu/eli/reg/2017/745/oj'),
  ('MDR_ANNEX_II', 'EU MDR 2017/745 Annex II', 'In Force', 'https://eur-lex.europa.eu/eli/reg/2017/745/oj'),
  ('MDR_ANNEX_III', 'EU MDR 2017/745 Annex III', 'In Force', 'https://eur-lex.europa.eu/eli/reg/2017/745/oj'),
  ('IEC_20957', 'IEC 20957-1:2013', 'In Force', 'https://webstore.iec.ch/en/publication/6129'),
  -- ASTM standards
  ('ASTM_F1980', 'ASTM F1980-21', 'In Force', 'https://www.astm.org/f1980-21.html'),
  ('ASTM_F2100', 'ASTM F2100-23', 'In Force', 'https://www.astm.org/f2100-23.html'),
  -- AAMI standards
  ('AAMI_TIR57', 'AAMI TIR57:2016/(R)2023', 'In Force', 'https://www.aami.org/store/products/aami-tir57-2016-r-2023'),
  ('AAMI_ST79', 'AAMI ST79:2017', 'In Force', 'https://www.aami.org/store/products/ansi-aami-st79-2017'),
  -- IEEE standards
  ('IEEE_11073', 'IEEE 11073-10101:2020', 'In Force', 'https://standards.ieee.org/ieee/11073-10101/10542/'),
  ('IEEE_14971', 'IEEE 14971:2019', 'In Force', 'https://standards.ieee.org/ieee/14971/7382/'),
  -- CLSI standards
  ('CLSI_EP05', 'CLSI EP05-A3:2014', 'In Force', 'https://clsi.org/standards/products/method-evaluation/documents/ep05/'),
  ('CLSI_EP17', 'CLSI EP17-A2:2012', 'In Force', 'https://clsi.org/standards/products/method-evaluation/documents/ep17/'),
  -- USP standards
  ('USP_88', 'USP <88> In Vivo Biological Reactivity Tests', 'In Force', 'https://www.usp.org/'),
  ('USP_87', 'USP <87> Biological Reactivity Tests, In Vitro', 'In Force', 'https://www.usp.org/');
