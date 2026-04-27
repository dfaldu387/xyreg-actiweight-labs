// Curated reference data for the Regulatory Atlas (Help -> Reference)
// All content is static, public-domain regulatory knowledge.

export interface MdcgGuidance {
  id: string;
  title: string;
  topic: string;
  url: string;
}

export interface GlobalMarket {
  region: string;
  country: string;
  authority: string;
  primaryRegulation: string;
  pathway: 'Direct' | 'Reliance' | 'Hybrid';
  qmsExpectation: string;
  uniqueId: string;
  notes: string;
  link?: string;
}

export interface DigitalThreadStandard {
  name: string;
  acronym: string;
  scope: string;
  why: string;
}

export interface LaunchStep {
  order: number;
  market: string;
  rationale: string;
}

export interface LaunchPlan {
  deviceClass: string;
  description: string;
  recommendedSequence: LaunchStep[];
  prerequisites: string[];
}

export const EU_MDR_OVERVIEW = `Regulation (EU) 2017/745 (MDR) governs medical devices placed on the EU market. It replaced the MDD (93/42/EEC) and AIMDD (90/385/EEC).

Key pillars:
- Risk-based classification (Class I, IIa, IIb, III) per Annex VIII rules
- General Safety & Performance Requirements (GSPRs, Annex I)
- Conformity assessment via Notified Body (Annex IX-XI), except self-certified Class I
- EUDAMED registration: actors, devices (UDI-DI / Basic UDI-DI), certificates, vigilance, PMS
- Post-Market Surveillance (PMS), PSUR, PMCF (Annex XIV Part B), vigilance reporting
- Person Responsible for Regulatory Compliance (PRRC, Article 15)`;

export const EU_IVDR_OVERVIEW = `Regulation (EU) 2017/746 (IVDR) governs in-vitro diagnostic devices. It replaced the IVDD (98/79/EC).

Key differences vs IVDD:
- New risk-based classification: Class A, B, C, D (Annex VIII, 7 rules)
- ~80% of IVDs now require Notified Body involvement (vs ~20% under IVDD)
- Performance Evaluation Report (PER) replacing simpler legacy evidence
- Companion diagnostics explicitly regulated (Rule 3(g))
- In-house IVDs (Article 5(5)) - strict conditions for health-institution exemption
- EUDAMED registration parallel to MDR`;

export const MDCG_GUIDANCE: MdcgGuidance[] = [
  { id: 'MDCG 2019-11', title: 'Qualification & Classification of Software', topic: 'SaMD / MDSW', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2019-11-guidance-qualification-and-classification-software-regulation-eu-2017745-mdr-and-2019-10-11_en' },
  { id: 'MDCG 2020-1', title: 'Clinical Evaluation (MDR) / Performance Evaluation (IVDR) of MDSW', topic: 'Clinical / Performance', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2020-1-guidance-clinical-evaluation-medical-device-software-2020-03-11_en' },
  { id: 'MDCG 2020-3', title: 'Significant changes under Article 120(3) MDR', topic: 'Legacy devices', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2020-3-guidance-significant-changes-regarding-transitional-provision-under-article-120-mdr-2020-03-23_en' },
  { id: 'MDCG 2020-5', title: 'Clinical Evaluation - Equivalence', topic: 'Clinical', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2020-5-guidance-clinical-evaluation-equivalence-2020-04-02_en' },
  { id: 'MDCG 2020-6', title: 'Sufficient clinical evidence for legacy devices', topic: 'Clinical', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2020-6-guidance-sufficient-clinical-evidence-legacy-devices-2020-04-02_en' },
  { id: 'MDCG 2020-7', title: 'PMCF Plan Template', topic: 'PMS / PMCF', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2020-7-guidance-pmcf-plan-template-2020-04-02_en' },
  { id: 'MDCG 2020-8', title: 'PMCF Evaluation Report Template', topic: 'PMS / PMCF', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2020-8-guidance-pmcf-evaluation-report-template-2020-04-02_en' },
  { id: 'MDCG 2021-24', title: 'Classification of medical devices (MDR Annex VIII)', topic: 'Classification', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2021-24-guidance-classification-medical-devices-2021-10-04_en' },
  { id: 'MDCG 2022-2', title: 'General Principles of Clinical Evidence for IVDs', topic: 'IVDR', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2022-2-guidance-general-principles-clinical-evidence-vitro-diagnostic-medical-devices-ivds-2022-01-25_en' },
  { id: 'MDCG 2022-14', title: 'Transition to MDR & IVDR - Notified Body capacity', topic: 'Transition', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2022-14-transition-mdr-and-ivdr-notified-body-capacity-and-availability-medical-devices-and-2022-08-26_en' },
  { id: 'MDCG 2023-3', title: 'Vigilance terms & concepts (MDR/IVDR)', topic: 'Vigilance', url: 'https://health.ec.europa.eu/latest-updates/mdcg-2023-3-questions-and-answers-vigilance-terms-and-concepts-outlined-regulation-eu-2017745-2023-02-28_en' },
  { id: 'MDCG 2024-3', title: 'Investigators Brochure for clinical investigations', topic: 'Clinical', url: 'https://health.ec.europa.eu/latest-updates_en' },
];

export const GLOBAL_MARKETS: GlobalMarket[] = [
  { region: 'North America', country: 'USA', authority: 'FDA (CDRH)', primaryRegulation: '21 CFR 820 / QSR -> QMSR (Feb 2026)', pathway: 'Direct', qmsExpectation: 'QMSR (ISO 13485:2016 + FDA-specific)', uniqueId: 'UDI (GUDID)', notes: '510(k), De Novo, PMA. eSTAR mandatory for 510(k).', link: 'https://www.fda.gov/medical-devices' },
  { region: 'North America', country: 'Canada', authority: 'Health Canada', primaryRegulation: 'Medical Devices Regulations (SOR/98-282)', pathway: 'Direct', qmsExpectation: 'MDSAP (mandatory for Class II-IV)', uniqueId: 'Device Licence #', notes: 'Class I via MDEL; Class II-IV via MDL. MDSAP audit required.', link: 'https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices.html' },
  { region: 'Europe', country: 'EU / EEA (27 + 3)', authority: 'Notified Bodies + Competent Authorities', primaryRegulation: 'MDR (EU) 2017/745 / IVDR (EU) 2017/746', pathway: 'Direct', qmsExpectation: 'ISO 13485:2016 (harmonised)', uniqueId: 'Basic UDI-DI / UDI-DI (EUDAMED)', notes: 'CE marking. PRRC required. EUDAMED rollout phased.', link: 'https://health.ec.europa.eu/medical-devices-sector_en' },
  { region: 'Europe', country: 'United Kingdom', authority: 'MHRA', primaryRegulation: 'UK MDR 2002 (as amended) -> new framework 2025+', pathway: 'Hybrid', qmsExpectation: 'ISO 13485:2016', uniqueId: 'UKCA / CE recognition', notes: 'CE marking accepted until 30 Jun 2030 (MDR) / 2028 (IVDR). UK Approved Body for UKCA.', link: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency' },
  { region: 'Europe', country: 'Switzerland', authority: 'Swissmedic', primaryRegulation: 'MedDO (812.213) / IvDO (812.219)', pathway: 'Direct', qmsExpectation: 'ISO 13485:2016', uniqueId: 'CHRN / Swiss UDI', notes: 'CH-REP required for non-Swiss manufacturers. Aligned with EU MDR/IVDR.', link: 'https://www.swissmedic.ch/swissmedic/en/home/medical-devices.html' },
  { region: 'Asia-Pacific', country: 'Japan', authority: 'PMDA / MHLW', primaryRegulation: 'PMD Act (Act No. 145/1960, as amended)', pathway: 'Direct', qmsExpectation: 'MHLW MO169 (~ ISO 13485)', uniqueId: 'JMDN code', notes: 'Class I notification, Class II-IV via certification body or PMDA review. MAH required.', link: 'https://www.pmda.go.jp/english/' },
  { region: 'Asia-Pacific', country: 'China', authority: 'NMPA', primaryRegulation: 'Order 739 (2021)', pathway: 'Direct', qmsExpectation: 'GB/T 42061 (~ ISO 13485) + China-specific', uniqueId: 'UDI (CN-UDID)', notes: 'In-country testing often required. Local Legal Agent mandatory. Type testing for Class II/III.', link: 'https://english.nmpa.gov.cn/' },
  { region: 'Asia-Pacific', country: 'South Korea', authority: 'MFDS', primaryRegulation: 'Medical Devices Act', pathway: 'Direct', qmsExpectation: 'KGMP (~ ISO 13485 + Korean addendum)', uniqueId: 'UDI-KR', notes: 'Class II-IV require KGMP certification. KLH (Korea License Holder) required.', link: 'https://www.mfds.go.kr/eng/' },
  { region: 'Asia-Pacific', country: 'Australia', authority: 'TGA', primaryRegulation: 'Therapeutic Goods Act 1989 / TG(MD)R 2002', pathway: 'Reliance', qmsExpectation: 'ISO 13485:2016 (MDSAP accepted)', uniqueId: 'ARTG entry', notes: 'Accepts EU MDR / FDA / Health Canada / MDSAP evidence under abridged route.', link: 'https://www.tga.gov.au/' },
  { region: 'Asia-Pacific', country: 'Singapore', authority: 'HSA', primaryRegulation: 'Health Products Act / HP(MD) Regulations', pathway: 'Reliance', qmsExpectation: 'ISO 13485:2016', uniqueId: 'SMDR listing', notes: 'Reference Agency Route: FDA, EU, TGA, Health Canada, MHLW. Abridged review available.', link: 'https://www.hsa.gov.sg/medical-devices' },
  { region: 'Asia-Pacific', country: 'India', authority: 'CDSCO', primaryRegulation: 'Medical Devices Rules 2017', pathway: 'Hybrid', qmsExpectation: 'ISO 13485:2016', uniqueId: 'MD Registration #', notes: 'All devices notified under MDR 2017. Class A/B via State Licensing; C/D via Central.', link: 'https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostics/' },
  { region: 'Latin America', country: 'Brazil', authority: 'ANVISA', primaryRegulation: 'RDC 751/2022 / RDC 830/2023', pathway: 'Direct', qmsExpectation: 'B-GMP (RDC 665/2022) / MDSAP accepted', uniqueId: 'ANVISA registration #', notes: 'BRH (Brazilian Registration Holder) required. MDSAP audit accepted in lieu of B-GMP inspection.', link: 'https://www.gov.br/anvisa/pt-br/english' },
  { region: 'Latin America', country: 'Mexico', authority: 'COFEPRIS', primaryRegulation: 'LGS / NOM-241-SSA1-2021', pathway: 'Reliance', qmsExpectation: 'NOM-241 (~ ISO 13485)', uniqueId: 'COFEPRIS registration', notes: 'Equivalence Agreement: FDA, Health Canada approval accelerates review.', link: 'https://www.gob.mx/cofepris' },
  { region: 'Middle East', country: 'Saudi Arabia', authority: 'SFDA', primaryRegulation: 'Medical Devices Interim Regulation', pathway: 'Reliance', qmsExpectation: 'ISO 13485:2016', uniqueId: 'MDMA / MDNR', notes: 'Accepts CE/FDA approvals under MDMA. Authorised Representative required.', link: 'https://www.sfda.gov.sa/en' },
];

export const DIGITAL_THREAD: DigitalThreadStandard[] = [
  { name: 'International Medical Device Regulators Forum', acronym: 'IMDRF', scope: 'Global harmonisation body (succeeded GHTF). Publishes guidance on SaMD, ToC, AI/ML, UDI.', why: 'Common regulatory vocabulary across FDA, EU, Japan, Brazil, Canada, China, Australia, Singapore, S. Korea.' },
  { name: 'Summary Technical Documentation', acronym: 'STED / IMDRF ToC', scope: 'Standardised structure for technical documentation submissions.', why: 'A single ToC-aligned dossier can be reused across MDSAP markets with regional annexes.' },
  { name: 'Medical Device Single Audit Program', acronym: 'MDSAP', scope: 'One QMS audit covering 5 regulators: FDA, Health Canada, ANVISA, TGA, MHLW/PMDA.', why: 'Reduces audit burden; mandatory in Canada, accepted in Brazil/Australia/Japan/USA.' },
  { name: 'Unique Device Identification', acronym: 'UDI', scope: 'Globally aligned device identifier (DI + PI). Issued via GS1, HIBCC, ICCBBA, IFA.', why: 'Required by FDA (GUDID), EU (EUDAMED), China (CN-UDID), Korea (UDI-KR), Saudi Arabia.' },
  { name: 'ISO 13485:2016', acronym: 'ISO 13485', scope: 'Quality management systems for medical devices. Globally recognised baseline.', why: 'Foundation for MDR Annex IX, MDSAP, QMSR (FDA 2026), KGMP, B-GMP, MO169, NMPA.' },
  { name: 'ISO 14971:2019 + AMD 1:2024', acronym: 'ISO 14971', scope: 'Application of risk management to medical devices.', why: 'Globally accepted process for hazard analysis, benefit-risk, residual risk acceptability.' },
];

export const LAUNCH_PLANS: LaunchPlan[] = [
  {
    deviceClass: 'Class I (non-sterile, non-measuring)',
    description: 'Lowest-risk devices. Self-declared in most jurisdictions.',
    recommendedSequence: [
      { order: 1, market: 'EU (Self-declaration + EUDAMED)', rationale: 'No NB needed; PRRC + Technical File only.' },
      { order: 2, market: 'USA (510(k) exempt or listing)', rationale: 'Many Class I are 510(k) exempt; FDA establishment registration only.' },
      { order: 3, market: 'UK (UKCA / CE recognition)', rationale: 'Self-cert recognised. UK Responsible Person required.' },
      { order: 4, market: 'Australia / Singapore (Reliance)', rationale: 'Abridged route on EU/FDA evidence.' },
    ],
    prerequisites: ['ISO 13485 QMS', 'Technical File / DHF', 'PRRC (EU)', 'Authorised Rep (EU/UK/CH)'],
  },
  {
    deviceClass: 'Class IIa / IIb (FDA Class II)',
    description: 'Moderate risk. Notified Body / 510(k) review required.',
    recommendedSequence: [
      { order: 1, market: 'USA (510(k))', rationale: 'Predicate-based, 90-180 day median review. Largest single market.' },
      { order: 2, market: 'EU MDR (Notified Body, Annex IX)', rationale: 'Required for CE. Plan 12-18 months for NB queue + review.' },
      { order: 3, market: 'Canada (MDSAP + MDL)', rationale: 'Leverage MDSAP audit. Class III in CAN ~ EU IIb.' },
      { order: 4, market: 'Australia (TGA Conformity Assessment)', rationale: 'Accepts MDSAP and CE/FDA evidence.' },
      { order: 5, market: 'Brazil (ANVISA, MDSAP path)', rationale: 'MDSAP avoids dual GMP inspection.' },
      { order: 6, market: 'Japan (PMDA)', rationale: 'Marketing authorisation via certified body or PMDA.' },
    ],
    prerequisites: ['ISO 13485 / MDSAP', 'Clinical Evaluation Report', 'Risk Management File (ISO 14971)', 'PMS Plan + PSUR'],
  },
  {
    deviceClass: 'Class III / Implantable',
    description: 'Highest risk. Full design dossier review and PMCF mandatory.',
    recommendedSequence: [
      { order: 1, market: 'USA (PMA or De Novo)', rationale: 'Largest market with reimbursement clarity. PMA panel review possible.' },
      { order: 2, market: 'EU MDR (Annex IX + Annex XI)', rationale: 'Design dossier review by NB. SSCP mandatory. PMCF Plan + Report.' },
      { order: 3, market: 'Canada (Class IV via MDSAP)', rationale: 'Leverage MDSAP. Significant testing evidence required.' },
      { order: 4, market: 'Japan (PMDA full review)', rationale: 'In-country clinical bridging study often required.' },
      { order: 5, market: 'China (NMPA, Class III)', rationale: 'Local clinical trial frequently required. Long timelines.' },
      { order: 6, market: 'Brazil (ANVISA Class IV)', rationale: 'B-GMP + product registration. Use MDSAP.' },
    ],
    prerequisites: ['MDSAP', 'Full clinical investigation (ISO 14155)', 'SSCP (EU)', 'PMCF Plan + Annual PMCF Report', 'Implant Card (EU)'],
  },
  {
    deviceClass: 'IVD (IVDR Class B / C / D)',
    description: 'In-vitro diagnostics. NB scrutiny scaled by class; Class D adds CRL + EU Reference Lab.',
    recommendedSequence: [
      { order: 1, market: 'USA (510(k) / De Novo / PMA via CDRH)', rationale: 'CLIA waiver consideration for POC IVDs.' },
      { order: 2, market: 'EU IVDR (Notified Body, Class C/D)', rationale: 'Class D adds EU Reference Lab batch testing & CRL consultation.' },
      { order: 3, market: 'Canada (Health Canada IVD MDL)', rationale: 'MDSAP route. Risk-based class I-IV.' },
      { order: 4, market: 'Australia (TGA IVD)', rationale: 'Reliance on EU/FDA accepted.' },
      { order: 5, market: 'Japan (PMDA, IVD route)', rationale: 'JMDN classification required. MAH licence.' },
    ],
    prerequisites: ['ISO 13485 + ISO 15189 awareness', 'Performance Evaluation Report (PER)', 'Scientific Validity Report', 'Analytical & Clinical Performance studies'],
  },
];

export const REGIONS = ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East'] as const;

export const PATHWAY_DESCRIPTIONS: Record<GlobalMarket['pathway'], string> = {
  Direct: 'Independent local review process - full submission required.',
  Reliance: 'Local authority leverages approval from a Reference Agency (FDA / EU / TGA / HC / MHLW) for abridged review.',
  Hybrid: 'Mix of independent review and reliance - typically transitioning regimes.',
};
