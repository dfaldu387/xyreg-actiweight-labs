
-- ============================================
-- Calibration Schedule Tables (ISO 13485 §7.6)
-- ============================================

-- 1. calibration_instruments — equipment registry
CREATE TABLE public.calibration_instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  instrument_name text NOT NULL,
  instrument_id_code text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  manufacturer text,
  model text,
  serial_number text,
  location text NOT NULL DEFAULT '',
  calibration_interval_months integer NOT NULL DEFAULT 12,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calibration_instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view instruments for their companies"
  ON public.calibration_instruments FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create instruments for their companies"
  ON public.calibration_instruments FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update instruments for their companies"
  ON public.calibration_instruments FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete instruments for their companies"
  ON public.calibration_instruments FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM public.user_company_access WHERE user_id = auth.uid()
  ));

CREATE TRIGGER update_calibration_instruments_updated_at
  BEFORE UPDATE ON public.calibration_instruments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. calibration_records — individual calibration events
CREATE TABLE public.calibration_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES public.calibration_instruments(id) ON DELETE CASCADE,
  calibration_date date NOT NULL,
  next_due_date date NOT NULL,
  performed_by text NOT NULL DEFAULT '',
  certificate_number text,
  result text NOT NULL DEFAULT 'pass',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calibration_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage calibration records for their instruments"
  ON public.calibration_records FOR ALL
  USING (instrument_id IN (
    SELECT ci.id FROM public.calibration_instruments ci
    JOIN public.user_company_access uca ON uca.company_id = ci.company_id
    WHERE uca.user_id = auth.uid()
  ));
