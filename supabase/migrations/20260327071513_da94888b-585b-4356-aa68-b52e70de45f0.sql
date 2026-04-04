-- Create funding_programmes table
CREATE TABLE public.funding_programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region text NOT NULL DEFAULT 'EU',
  programme_code text,
  description text,
  funding_body text,
  typical_budget_range text,
  trl_range text,
  deadline_info text,
  eligibility_criteria jsonb DEFAULT '[]'::jsonb,
  checklist_items jsonb DEFAULT '[]'::jsonb,
  url text,
  is_builtin boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_funding_applications table
CREATE TABLE public.company_funding_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  programme_id uuid NOT NULL REFERENCES public.funding_programmes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'exploring',
  eligibility_score numeric DEFAULT 0,
  checklist_responses jsonb DEFAULT '{}'::jsonb,
  notes text,
  target_call text,
  submission_deadline date,
  requested_amount numeric,
  workspace_items jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.funding_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_funding_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read built-in funding programmes"
ON public.funding_programmes FOR SELECT TO authenticated
USING (is_builtin = true);

CREATE POLICY "Company members can view funding applications"
ON public.company_funding_applications FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = company_funding_applications.company_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Company editors can insert funding applications"
ON public.company_funding_applications FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = company_funding_applications.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

CREATE POLICY "Company editors can update funding applications"
ON public.company_funding_applications FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = company_funding_applications.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

CREATE POLICY "Company editors can delete funding applications"
ON public.company_funding_applications FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.company_id = company_funding_applications.company_id
    AND uca.user_id = auth.uid()
    AND uca.access_level = ANY(ARRAY['admin'::user_role_type, 'editor'::user_role_type, 'consultant'::user_role_type])
  )
);

-- Seed built-in funding programmes
INSERT INTO public.funding_programmes (name, region, programme_code, description, funding_body, typical_budget_range, trl_range, deadline_info, url, eligibility_criteria, checklist_items) VALUES
('Horizon Europe Cluster 1 — Health', 'EU', 'HORIZON-HLTH', 'The largest EU research and innovation programme funding health research including medical devices, diagnostics, and digital health solutions.', 'European Commission', '€2M – €10M per project', 'TRL 2–6', 'Annual calls, typically January–April deadlines', 'https://ec.europa.eu/info/funding-tenders/opportunities/portal', '[{"id":"org_type","question":"Is your organisation eligible (SME, university, research institute, hospital)?","category":"Organisation"},{"id":"consortium","question":"Do you have a consortium of at least 3 partners from 3 EU/Associated countries?","category":"Consortium"},{"id":"trl","question":"Is your technology at TRL 2-6?","category":"Technical"},{"id":"ethics","question":"Have you identified your ethics approval pathway?","category":"Regulatory"},{"id":"gender","question":"Do you have a Gender Equality Plan in place?","category":"Organisation"},{"id":"open_science","question":"Can you comply with Open Science requirements?","category":"Compliance"},{"id":"dmp","question":"Can you provide a Data Management Plan?","category":"Compliance"},{"id":"impact","question":"Can you demonstrate clear societal/health impact at EU level?","category":"Impact"}]'::jsonb, '[{"id":"abstract","title":"Proposal Abstract","type":"document","required":true},{"id":"budget","title":"Budget Template","type":"document","required":true},{"id":"consortium_agreement","title":"Consortium Agreement","type":"document","required":true},{"id":"ethics_self_assessment","title":"Ethics Self-Assessment","type":"document","required":true},{"id":"technical_annex","title":"Technical Annex (Part B)","type":"document","required":true}]'::jsonb),
('EU Mission on Cancer', 'EU', 'HORIZON-MISS-CANCER', 'EU Mission dedicated to cancer research covering prevention, early detection, diagnostics, treatment innovation, and quality of life.', 'European Commission', '€3M – €12M per project', 'TRL 3–7', 'Annual calls aligned with Horizon Europe work programmes', 'https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/eu-missions-horizon-europe/eu-mission-cancer_en', '[{"id":"org_type","question":"Is your organisation eligible for Horizon Europe funding?","category":"Organisation"},{"id":"cancer_focus","question":"Does your project directly address cancer prevention, detection, diagnosis, or treatment?","category":"Scope"},{"id":"consortium","question":"Do you have a transnational consortium (3+ partners, 3+ countries)?","category":"Consortium"},{"id":"patient_involvement","question":"Have you planned patient/survivor involvement?","category":"Impact"},{"id":"clinical_validation","question":"Is clinical validation included in the project plan?","category":"Technical"}]'::jsonb, '[{"id":"abstract","title":"Proposal Abstract","type":"document","required":true},{"id":"budget","title":"Budget Template","type":"document","required":true},{"id":"clinical_protocol","title":"Clinical Protocol Outline","type":"document","required":false}]'::jsonb),
('EIC Accelerator — Health Challenges', 'EU', 'EIC-ACCELERATOR', 'Supports individual SMEs with breakthrough health innovations. Blended finance (grant + equity) for high-risk, high-impact technologies.', 'European Innovation Council', '€0.5M – €2.5M grant + up to €15M equity', 'TRL 5–9', 'Cut-off dates: typically March, June, October', 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en', '[{"id":"sme_status","question":"Is your company a registered SME (<250 employees)?","category":"Organisation"},{"id":"single_entity","question":"Are you applying as a single entity (not consortium)?","category":"Organisation"},{"id":"breakthrough","question":"Does your innovation represent a breakthrough?","category":"Technical"},{"id":"market_risk","question":"Is there clear market deployment risk justifying public funding?","category":"Commercial"},{"id":"ip_freedom","question":"Do you have freedom to operate (IP clearance)?","category":"Legal"},{"id":"scalability","question":"Can you demonstrate European/global scalability?","category":"Commercial"}]'::jsonb, '[{"id":"short_application","title":"Short Application (Step 1)","type":"document","required":true},{"id":"full_application","title":"Full Business Plan (Step 2)","type":"document","required":true},{"id":"pitch_deck","title":"Pitch Deck & Video","type":"document","required":true},{"id":"financial_projections","title":"Financial Projections (5-year)","type":"document","required":true}]'::jsonb),
('Digital Europe Programme — Health & AI', 'EU', 'DIGITAL-HEALTH', 'Funds deployment of digital technologies in health: AI diagnostics, European Health Data Space, cybersecurity, and digital skills.', 'European Commission (DG CNECT)', '€1M – €5M per project', 'TRL 6–9', 'Calls published on Funding & Tenders Portal', 'https://digital-strategy.ec.europa.eu/en/activities/digital-programme', '[{"id":"digital_focus","question":"Does your project deploy advanced digital technology (AI, HPC, cybersecurity)?","category":"Technical"},{"id":"health_application","question":"Is it applied to the health/medtech domain?","category":"Scope"},{"id":"data_compliance","question":"Can you comply with GDPR and EU data governance?","category":"Compliance"},{"id":"interoperability","question":"Does your solution support EHDS interoperability standards?","category":"Technical"}]'::jsonb, '[{"id":"proposal","title":"Project Proposal","type":"document","required":true},{"id":"budget","title":"Budget Breakdown","type":"document","required":true}]'::jsonb),
('Innovative Health Initiative (IHI)', 'EU', 'IHI-JU', 'Public-private partnership between the EU and European life science industries. Funds large-scale collaborative health research.', 'Innovative Health Initiative Joint Undertaking', '€5M – €25M per project', 'TRL 3–7', 'Annual calls, deadlines vary by topic', 'https://www.ihi.europa.eu/', '[{"id":"org_type","question":"Are you eligible as an academic, SME, hospital, or industry partner?","category":"Organisation"},{"id":"industry_partner","question":"Do you have contributing industry partners (in-kind)?","category":"Consortium"},{"id":"multi_stakeholder","question":"Does your consortium include multi-stakeholder representation?","category":"Consortium"},{"id":"regulatory_pathway","question":"Is there a clear regulatory pathway for project outputs?","category":"Regulatory"}]'::jsonb, '[{"id":"proposal","title":"Full Proposal","type":"document","required":true},{"id":"budget","title":"Budget & In-Kind Contributions","type":"document","required":true}]'::jsonb),
('EUROSTARS (Eureka)', 'EU', 'EUROSTARS-3', 'Supports international innovative R&D projects led by SMEs. National co-funding for near-market research.', 'Eureka Network', '€0.5M – €3M (national co-funding varies)', 'TRL 4–7', 'Two cut-off dates per year (February and September)', 'https://www.eurostars-eureka.eu/', '[{"id":"sme_led","question":"Is the project led by an R&D-performing SME?","category":"Organisation"},{"id":"international","question":"Do you have 2+ partners from 2+ Eurostars countries?","category":"Consortium"},{"id":"market_timeline","question":"Can the product reach market within 2 years after project end?","category":"Commercial"},{"id":"rd_spend","question":"Does your SME spend >10% of revenue or FTE on R&D?","category":"Organisation"}]'::jsonb, '[{"id":"application_form","title":"Eurostars Application Form","type":"document","required":true},{"id":"budget","title":"National Budget Forms","type":"document","required":true}]'::jsonb),
('NIH SBIR/STTR', 'US', 'NIH-SBIR', 'US federal funding for small businesses conducting health-related R&D. Phase I (feasibility) and Phase II (development).', 'National Institutes of Health', '$150K – $1.15M', 'TRL 1–6', 'Multiple receipt dates per year', 'https://sbir.nih.gov/', '[{"id":"us_entity","question":"Is your company a US-based small business (<500 employees)?","category":"Organisation"},{"id":"ownership","question":"Is the company >50% owned by US citizens/permanent residents?","category":"Organisation"},{"id":"pi_employment","question":"Will the PI be primarily employed by the small business?","category":"Organisation"},{"id":"research_plan","question":"Do you have specific aims and a research plan?","category":"Technical"},{"id":"commercialization","question":"Can you demonstrate a commercialization pathway?","category":"Commercial"}]'::jsonb, '[{"id":"specific_aims","title":"Specific Aims Page","type":"document","required":true},{"id":"research_plan","title":"Research Strategy","type":"document","required":true},{"id":"budget","title":"NIH Budget Form (PHS 398)","type":"document","required":true},{"id":"biosketch","title":"NIH Biosketch (PI)","type":"document","required":true},{"id":"commercialization_plan","title":"Commercialization Plan","type":"document","required":true}]'::jsonb),
('BARDA DRIVe', 'US', 'BARDA-DRIVE', 'Funds medical countermeasures, diagnostics, and innovative health security solutions.', 'US HHS / BARDA', '$0.5M – $10M+', 'TRL 3–8', 'Rolling BAA (Broad Agency Announcement)', 'https://drive.hhs.gov/', '[{"id":"us_entity","question":"Is your entity eligible under US federal contracting rules?","category":"Organisation"},{"id":"health_security","question":"Does your technology address health security threats?","category":"Scope"},{"id":"prototype","question":"Do you have a working prototype or preclinical data?","category":"Technical"},{"id":"regulatory_plan","question":"Do you have a defined FDA regulatory pathway?","category":"Regulatory"}]'::jsonb, '[{"id":"white_paper","title":"White Paper / Concept","type":"document","required":true},{"id":"full_proposal","title":"Full Technical Proposal","type":"document","required":true},{"id":"budget","title":"Cost Proposal","type":"document","required":true}]'::jsonb),
('NSF SBIR', 'US', 'NSF-SBIR', 'NSF small business innovation for deep-tech including biomedical engineering, health IT, and sensors.', 'National Science Foundation', '$275K (Phase I) – $1M (Phase II)', 'TRL 1–5', 'Phase I: June deadline; Phase II: rolling', 'https://seedfund.nsf.gov/', '[{"id":"us_sme","question":"Is your company a US-based small business?","category":"Organisation"},{"id":"deep_tech","question":"Does your innovation involve fundamental scientific research?","category":"Technical"},{"id":"nsf_fit","question":"Does your technology fit NSF research areas?","category":"Scope"},{"id":"team","question":"Do you have a qualified technical team?","category":"Organisation"}]'::jsonb, '[{"id":"project_pitch","title":"Project Pitch","type":"document","required":true},{"id":"proposal","title":"Full Proposal","type":"document","required":true},{"id":"budget","title":"NSF Budget Forms","type":"document","required":true}]'::jsonb),
('BMBF Health Research (Germany)', 'National', 'BMBF-HEALTH', 'German federal funding for health research, medical devices, and digital health.', 'BMBF', '€0.3M – €5M', 'TRL 2–7', 'Programme-specific deadlines', 'https://www.bmbf.de/bmbf/en/research/health-research/', '[{"id":"de_entity","question":"Is your organisation registered in Germany?","category":"Organisation"},{"id":"collaborative","question":"Is this collaborative with German research partners?","category":"Consortium"},{"id":"health_innovation","question":"Does the project address health innovation priorities?","category":"Scope"}]'::jsonb, '[{"id":"skizze","title":"Projektskizze","type":"document","required":true},{"id":"full_proposal","title":"Vollantrag","type":"document","required":true},{"id":"budget","title":"Finanzierungsplan","type":"document","required":true}]'::jsonb),
('BPI France Innovation', 'National', 'BPI-INNOVATION', 'French public investment bank supporting innovative health/medtech companies with grants and loans.', 'Bpifrance', '€0.2M – €3M', 'TRL 3–8', 'Rolling applications', 'https://www.bpifrance.fr/', '[{"id":"fr_entity","question":"Is your company registered in France?","category":"Organisation"},{"id":"innovation","question":"Does your project involve significant R&D investment?","category":"Technical"},{"id":"financial_health","question":"Is your company financially viable?","category":"Organisation"}]'::jsonb, '[{"id":"business_plan","title":"Business Plan","type":"document","required":true},{"id":"budget","title":"Budget Prévisionnel","type":"document","required":true}]'::jsonb),
('Innovate UK — Biomedical Catalyst', 'National', 'IUK-BMC', 'UK funding for early-stage life science and medtech companies.', 'Innovate UK (UKRI)', '£150K – £4M', 'TRL 2–6', 'Competition-based, multiple rounds per year', 'https://www.ukri.org/councils/innovate-uk/', '[{"id":"uk_entity","question":"Is your organisation based in the UK?","category":"Organisation"},{"id":"life_science","question":"Is your project in life sciences / medtech?","category":"Scope"},{"id":"clinical_need","question":"Does it address an unmet clinical need?","category":"Impact"},{"id":"regulatory_awareness","question":"Have you identified the MHRA regulatory pathway?","category":"Regulatory"}]'::jsonb, '[{"id":"application","title":"Competition Application Form","type":"document","required":true},{"id":"budget","title":"Project Costs Breakdown","type":"document","required":true}]'::jsonb);