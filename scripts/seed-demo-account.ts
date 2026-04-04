/**
 * WHX Demo Account Seed Script
 *
 * Creates a fully populated demo account for the WHX event.
 * Uses the same initialization logic as CompanyInitializationService.
 *
 * Usage: npx tsx scripts/seed-demo-account.ts
 *
 * Credentials:
 *   Email:    demo@xyreg.com
 *   Password: XyregDemo#2026
 *   Company:  NovaMed Devices GmbH
 *   Plan:     Helix OS (Core)
 */

import { createClient } from '@supabase/supabase-js';

// ─── Supabase Client ─────────────────────────────────────────────
const SUPABASE_URL = "https://wzzkbmmgxxrfhhxggrcl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6emtibW1neHhyZmhoeGdncmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTY1OTksImV4cCI6MjA2MDk3MjU5OX0.IILyYxMvAEyt5DrRWvF7NR0omsg2DKbhh5b-C4N73ME";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Constants ───────────────────────────────────────────────────
const DEMO_EMAIL = 'demo@xyreg.com';
const DEMO_PASSWORD = 'XyregDemo#2026';
const COMPANY_NAME = 'NovaMed Devices GmbH';

// Helper: date offset from today
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────
// Phase definitions — mirrors CompanyInitializationService exactly
// ─────────────────────────────────────────────────────────────────

interface PhaseData {
  name: string;
  description: string;
  category: string;
  typical_start_day: number;
  typical_duration_days: number;
  is_continuous_process: boolean;
  position: number;
}

const LINEAR_DEVELOPMENT_PHASES: PhaseData[] = [
  { name: "Concept & Feasibility", description: "Initial concept development and feasibility assessment", category: "Design Control Steps", typical_start_day: 0, typical_duration_days: 30, is_continuous_process: false, position: 0 },
  { name: "Project Initiation & Planning", description: "Project initiation and planning activities", category: "Design Control Steps", typical_start_day: 30, typical_duration_days: 30, is_continuous_process: false, position: 1 },
  { name: "Requirements & Design Inputs", description: "Definition of requirements and design inputs", category: "Design Control Steps", typical_start_day: 60, typical_duration_days: 60, is_continuous_process: false, position: 2 },
  { name: "Design & Development (Output)", description: "Design and development activities and outputs", category: "Design Control Steps", typical_start_day: 120, typical_duration_days: 240, is_continuous_process: false, position: 3 },
  { name: "Verification & Validation (V&V)", description: "Verification and validation activities", category: "Design Control Steps", typical_start_day: 360, typical_duration_days: 210, is_continuous_process: false, position: 4 },
  { name: "Finalization & Transfer", description: "Finalization and transfer to manufacturing", category: "Design Control Steps", typical_start_day: 570, typical_duration_days: 45, is_continuous_process: false, position: 5 },
  { name: "Regulatory Submission & Approval", description: "Regulatory submission and approval processes", category: "Design Control Steps", typical_start_day: 615, typical_duration_days: 180, is_continuous_process: false, position: 6 },
  { name: "Launch & Post-Launch", description: "Launch and post-launch activities", category: "Design Control Steps", typical_start_day: 795, typical_duration_days: 30, is_continuous_process: false, position: 7 },
];

const CONCURRENT_PHASES: PhaseData[] = [
  { name: "Risk Management", description: "Risk management throughout product lifecycle", category: "Design Control Steps", is_continuous_process: true, typical_start_day: 0, typical_duration_days: 795, position: 8 },
  { name: "Technical Documentation", description: "Creation and maintenance of technical documentation", category: "Design Control Steps", is_continuous_process: true, typical_start_day: 60, typical_duration_days: 555, position: 9 },
  { name: "Supplier Management", description: "Supplier management and oversight", category: "Supply Chain & Quality Assurance", is_continuous_process: true, typical_start_day: 120, typical_duration_days: 675, position: 10 },
  { name: "Post-Market Surveillance", description: "Post-market surveillance and monitoring (PMS)", category: "Post-Market & Lifecycle Management", is_continuous_process: true, typical_start_day: 360, typical_duration_days: 30, position: 11 },
];

const ALL_PHASES = [...LINEAR_DEVELOPMENT_PHASES, ...CONCURRENT_PHASES];

// ─────────────────────────────────────────────────────────────────
// Standard document data — mirrors src/data/standardDocData.ts
// ─────────────────────────────────────────────────────────────────

const STANDARD_DOCUMENT_TEMPLATES: { name: string; phases: string[] }[] = [
  { name: "Quality Management Plan", phases: ["Concept & Feasibility","Project Initiation & Planning","Requirements & Design Inputs","Design & Development (Output)","Verification & Validation (V&V)","Finalization & Transfer","Technical Documentation","Regulatory Submission & Approval","Launch & Post-Launch","Supplier Management","Post-Market Surveillance","Risk Management"] },
  { name: "Internal Audit Reports", phases: ["Concept & Feasibility","Project Initiation & Planning","Requirements & Design Inputs","Design & Development (Output)","Verification & Validation (V&V)","Finalization & Transfer","Technical Documentation","Regulatory Submission & Approval","Launch & Post-Launch","Supplier Management","Post-Market Surveillance","Risk Management"] },
  { name: "Management Review Minutes", phases: ["Concept & Feasibility","Project Initiation & Planning","Requirements & Design Inputs","Design & Development (Output)","Verification & Validation (V&V)","Finalization & Transfer","Technical Documentation","Regulatory Submission & Approval","Launch & Post-Launch","Supplier Management","Post-Market Surveillance","Risk Management"] },
  { name: "Periodic Audit / Review Schedule", phases: ["Concept & Feasibility","Project Initiation & Planning","Requirements & Design Inputs","Design & Development (Output)","Verification & Validation (V&V)","Finalization & Transfer","Technical Documentation","Regulatory Submission & Approval","Launch & Post-Launch","Supplier Management","Post-Market Surveillance","Risk Management"] },
  { name: "Traceability Matrices (Req → Design → Verif → Valid → Risk)", phases: ["Concept & Feasibility","Project Initiation & Planning","Requirements & Design Inputs","Design & Development (Output)","Verification & Validation (V&V)","Finalization & Transfer","Technical Documentation","Regulatory Submission & Approval","Launch & Post-Launch","Supplier Management","Post-Market Surveillance","Risk Management"] },
  { name: "Design & Development Plan", phases: ["Project Initiation & Planning","Verification & Validation (V&V)"] },
  { name: "Verification Test Reports (functional, EMC, biocomp., sterility, SW)", phases: ["Verification & Validation (V&V)"] },
  { name: "Biocompatibility Requirements", phases: ["Verification & Validation (V&V)"] },
  { name: "Calibration Certificates for Test Equipment", phases: ["Verification & Validation (V&V)"] },
  { name: "Design Review Records", phases: ["Requirements & Design Inputs","Design & Development (Output)","Verification & Validation (V&V)"] },
  { name: "EMC Requirements (IEC 60601-1-2)", phases: ["Verification & Validation (V&V)"] },
  { name: "Environmental & Sterilization Specs", phases: ["Verification & Validation (V&V)"] },
  { name: "Packaging Design Drawings", phases: ["Design & Development (Output)","Verification & Validation (V&V)"] },
  { name: "Packaging Validation Reports", phases: ["Verification & Validation (V&V)"] },
  { name: "Pre-Clinical / Pre-Study Protocols", phases: ["Verification & Validation (V&V)"] },
  { name: "Process Validation Protocols & Reports (sterility, shelf-life)", phases: ["Verification & Validation (V&V)"] },
  { name: "Risk Control Implementation Records", phases: ["Verification & Validation (V&V)","Risk Management"] },
  { name: "Software Architecture & Code Documentation", phases: ["Design & Development (Output)","Verification & Validation (V&V)"] },
  { name: "Software Lifecycle Documentation (IEC 62304)", phases: ["Project Initiation & Planning","Verification & Validation (V&V)"] },
  { name: "Software Validation Reports (IQ/OQ/PQ)", phases: ["Verification & Validation (V&V)"] },
  { name: "Sterilization & Shelf-Life Validation Summaries", phases: ["Verification & Validation (V&V)"] },
  { name: "Test Method Development Plan", phases: ["Project Initiation & Planning","Verification & Validation (V&V)"] },
  { name: "Test Method Validation Reports", phases: ["Verification & Validation (V&V)"] },
  { name: "CE Technical File & EU Declaration of Conformity", phases: ["Technical Documentation"] },
  { name: "Technical File / Design Dossier / Device Master Record", phases: ["Technical Documentation"] },
  { name: "Business Case / Project Charter", phases: ["Project Initiation & Planning"] },
  { name: "Concept Brief", phases: ["Concept & Feasibility"] },
  { name: "Risk Management Report", phases: ["Risk Management"] },
  { name: "User Needs Overview", phases: ["Requirements & Design Inputs"] },
  { name: "Detailed CAD Drawings & BOM", phases: ["Design & Development (Output)"] },
  { name: "Device History File (DHF) Index", phases: ["Finalization & Transfer"] },
  { name: "Labeling & IFU Final", phases: ["Finalization & Transfer","Launch & Post-Launch"] },
  { name: "Supplier Qualification Records", phases: ["Supplier Management"] },
  { name: "Early Competitive Landscape Summary", phases: ["Concept & Feasibility","Requirements & Design Inputs","Post-Market Surveillance"] },
  { name: "Draft Risk Management Plan", phases: ["Concept & Feasibility","Requirements & Design Inputs"] },
  { name: "Feasibility Study Report (with risk inputs)", phases: ["Concept & Feasibility"] },
  { name: "High-Level Architecture / Concept Diagram", phases: ["Concept & Feasibility","Requirements & Design Inputs"] },
  { name: "Initial Hazard Log / FMEA Entries", phases: ["Concept & Feasibility","Requirements & Design Inputs"] },
  { name: "Intellectual Property (IP) Review", phases: ["Concept & Feasibility"] },
  { name: "Preliminary Hazard Analysis (PHA)", phases: ["Concept & Feasibility"] },
  { name: "Preliminary Market Analysis", phases: ["Concept & Feasibility","Post-Market Surveillance"] },
  { name: "Regulatory Strategy Outline", phases: ["Concept & Feasibility","Project Initiation & Planning"] },
  { name: "Resource & Budget Feasibility Study", phases: ["Concept & Feasibility","Project Initiation & Planning"] },
  { name: "Verification Master Plan", phases: ["Verification & Validation (V&V)"] },
  { name: "510(k) Submission / PMA Package", phases: ["Regulatory Submission & Approval"] },
  { name: "ANVISA Registro", phases: ["Regulatory Submission & Approval"] },
  { name: "ARTG Inclusion", phases: ["Regulatory Submission & Approval"] },
  { name: "CAPA Procedure (Post-Market)", phases: ["Post-Market Surveillance"] },
  { name: "CAPA Records & Effectiveness Checks", phases: ["Post-Market Surveillance"] },
  { name: "CDSCO Device Registration", phases: ["Regulatory Submission & Approval"] },
  { name: "Clinical Evaluation Plan & Protocols", phases: ["Verification & Validation (V&V)"] },
  { name: "Clinical Investigation / Trial Protocols & CRFs", phases: ["Verification & Validation (V&V)"] },
  { name: "CN Registration Certificate application", phases: ["Regulatory Submission & Approval"] },
  { name: "Design Validation Reports (simulated & actual use)", phases: ["Verification & Validation (V&V)"] },
  { name: "Electrical Schematics & PCB Layouts", phases: ["Design & Development (Output)"] },
  { name: "Executive Sign-Off on Risk Acceptance", phases: ["Risk Management"] },
  { name: "Field Safety Corrective Action (FSCA) Reports", phases: ["Post-Market Surveillance"] },
  { name: "Final Design Review Minutes", phases: ["Finalization & Transfer"] },
  { name: "Human Factors Use-Specifications", phases: ["Requirements & Design Inputs"] },
  { name: "Installation, Operation & Servicing Instructions Drafts", phases: ["Design & Development (Output)"] },
  { name: "KR Marketing Authorization", phases: ["Regulatory Submission & Approval"] },
  { name: "Labeling Drafts & UDI Assignments", phases: ["Design & Development (Output)"] },
  { name: "Manufacturing Process Flowcharts & Work Instructions", phases: ["Finalization & Transfer"] },
  { name: "Medical Device License (MDL) application", phases: ["Regulatory Submission & Approval"] },
  { name: "Periodic Safety Update Reports (PSUR/PBRER)", phases: ["Post-Market Surveillance"] },
  { name: "Post-Market Clinical Follow-Up (PMCF) Plan", phases: ["Post-Market Surveillance"] },
  { name: "Post-Market Risk Reassessment Updates", phases: ["Post-Market Surveillance"] },
  { name: "Post-Market Surveillance (PMS) Plan", phases: ["Post-Market Surveillance"] },
  { name: "Project Schedule / Gantt Chart", phases: ["Project Initiation & Planning"] },
  { name: "Regulatory & Standards Mapping Matrix", phases: ["Project Initiation & Planning"] },
  { name: "Regulatory Submission Roadmap", phases: ["Project Initiation & Planning","Regulatory Submission & Approval"] },
  { name: "Risk Management Plan (Final)", phases: ["Requirements & Design Inputs","Risk Management"] },
  { name: "Risk/Benefit Analysis & Residual Risk Summary", phases: ["Risk Management"] },
  { name: "Shonin / Ninsho dossier", phases: ["Regulatory Submission & Approval"] },
  { name: "Software Requirements Specification (SRS)", phases: ["Requirements & Design Inputs"] },
  { name: "Stakeholder Requirements Specification", phases: ["Requirements & Design Inputs"] },
  { name: "Supplier / Contract Manufacturer Agreements", phases: ["Supplier Management"] },
  { name: "Supplier Selection & Qualification Plan", phases: ["Supplier Management"] },
  { name: "Usability Engineering File (UEF)", phases: ["Requirements & Design Inputs"] },
  { name: "Use Environment & Maintenance Profiles", phases: ["Requirements & Design Inputs","Verification & Validation (V&V)"] },
  { name: "User Needs Specification (UNS)", phases: ["Requirements & Design Inputs"] },
  { name: "Validation Master Plan (Design, Clinical, Usability)", phases: ["Verification & Validation (V&V)"] },
  { name: "Vigilance & Adverse Event Reporting Procedure", phases: ["Post-Market Surveillance"] },
  { name: "Vigilance Reports (MDR, MedWatch, etc.)", phases: ["Post-Market Surveillance"] },
];

// ─── Step 1: Sign Up ────────────────────────────────────────────
async function signUpUser(): Promise<string> {
  console.log('Step 1: Signing up user...');

  const { data, error } = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    options: {
      emailRedirectTo: 'https://xyreg.com/',
      data: {
        first_name: 'Anna',
        last_name: 'Mueller',
        phone: '+49 30 1234567',
        role: 'business',
        selected_plan_tier: 'core',
        selected_plan_power_packs: ['build', 'ops', 'monitor'],
        selected_plan_monthly_price: 499,
        client_company_name: COMPANY_NAME,
        client_country: 'Germany',
      }
    }
  });

  if (error) {
    if (error.message?.includes('User already registered')) {
      console.log('  User already exists, signing in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (signInError) throw signInError;
      return signInData.user!.id;
    }
    throw error;
  }

  console.log('  User created:', data.user?.id);
  return data.user!.id;
}

// ─── Step 2: Create Company ──────────────────────────────────────
async function createCompany(userId: string): Promise<string> {
  console.log('Step 2: Creating company...');

  // Check if company already exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('name', COMPANY_NAME)
    .maybeSingle();

  if (existing) {
    console.log('  Company already exists:', existing.id);
    return existing.id;
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: COMPANY_NAME,
      description: 'NovaMed Devices GmbH is a Berlin-based medical device company specializing in advanced cardiac monitoring and AI-powered diagnostic solutions. Founded in 2019, we develop Class IIa-III medical devices for European and global markets.',
      address: 'Friedrichstrasse 123',
      city: 'Berlin',
      country: 'Germany',
      postal_code: '10117',
      email: 'info@novamed-devices.com',
      phone: '+49 30 1234567',
      telephone: '+49 30 1234568',
      contact_person: 'Dr. Anna Mueller',
      website: 'https://www.novamed-devices.com',
      srn: 'DE-MF-000012345',
      production_site_name: 'NovaMed Manufacturing Center',
      production_site_address: 'Industriestrasse 45',
      production_site_city: 'Munich',
      production_site_country: 'Germany',
      production_site_postal_code: '80331',
      subscription_plan: 'Helix OS',
      default_markets: ['EU', 'USA'],
      department_structure: {
        departments: [
          { name: 'Research & Development', head: 'Dr. Klaus Weber', members: 12 },
          { name: 'Quality & Regulatory', head: 'Maria Schmidt', members: 8 },
          { name: 'Clinical Affairs', head: 'Dr. Sarah Fischer', members: 5 },
          { name: 'Operations', head: 'Thomas Braun', members: 10 },
          { name: 'Commercial', head: 'Lisa Hoffmann', members: 6 },
        ]
      },
    })
    .select('id')
    .single();

  if (error) throw error;
  console.log('  Company created:', data.id);
  return data.id;
}

// ─── Step 3: Initialize Company (mirrors CompanyInitializationService) ──
async function initializeCompany(companyId: string, userId: string): Promise<void> {
  console.log('Step 3: Initializing company (CompanyInitializationService logic)...');

  // ── 3.1: User-company access ──
  console.log('  3.1: Setting up user access...');
  const { data: existingAccess } = await supabase
    .from('user_company_access')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (!existingAccess) {
    const { error } = await supabase
      .from('user_company_access')
      .insert({
        user_id: userId,
        company_id: companyId,
        access_level: 'admin',
        affiliation_type: 'internal',
        is_primary: true,
        department: 'Quality & Regulatory',
        functional_area: 'regulatory_affairs',
      });
    if (error) throw error;
    console.log('  User access created');
  } else {
    console.log('  User access already exists');
  }

  // ── 3.2: Phase categories ──
  console.log('  3.2: Creating phase categories...');
  const categories = [
    { name: 'Design Control Steps', position: 1 },
    { name: 'Supply Chain & Quality Assurance', position: 2 },
    { name: 'Post-Market & Lifecycle Management', position: 3 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const { data: existing } = await supabase
      .from('phase_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', cat.name)
      .maybeSingle();

    if (existing) {
      categoryMap[cat.name] = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from('phase_categories')
        .insert({ company_id: companyId, name: cat.name, position: cat.position, is_system_category: true })
        .select('id')
        .single();
      if (error) throw error;
      categoryMap[cat.name] = created.id;
    }
  }

  // ── 3.3: Document types ──
  console.log('  3.3: Creating document types...');
  const docTypeNames = ['Standard', 'Regulatory', 'Technical', 'Clinical', 'Quality', 'Design', 'SOP'];
  const { data: existingTypes } = await supabase
    .from('document_types')
    .select('name')
    .eq('company_id', companyId);

  const existingTypeNames = existingTypes?.map(t => t.name) || [];
  const typesToCreate = docTypeNames.filter(t => !existingTypeNames.includes(t));

  if (typesToCreate.length > 0) {
    await supabase.from('document_types').insert(
      typesToCreate.map(name => ({ company_id: companyId, user_id: userId, name, created_by: userId }))
    );
  }

  // Check if phases already exist
  const { data: existingPhases } = await supabase
    .from('company_phases')
    .select('id')
    .eq('company_id', companyId)
    .limit(1);

  if (existingPhases && existingPhases.length > 0) {
    console.log('  Company already initialized (phases exist), skipping');
    return;
  }

  // ── 3.4: Create company_phases (7 linear + 4 concurrent = 11 total) ──
  console.log('  3.4: Creating company phases...');
  const linearInserts = LINEAR_DEVELOPMENT_PHASES.map((p, i) => ({
    company_id: companyId,
    name: p.name,
    description: p.description,
    position: i + 1,
    category_id: categoryMap[p.category],
    is_active: true,
    is_continuous_process: false,
    typical_start_day: p.typical_start_day,
    typical_duration_days: p.typical_duration_days,
    duration_days: p.typical_duration_days,
  }));

  const concurrentInserts = CONCURRENT_PHASES.map((p, i) => ({
    company_id: companyId,
    name: p.name,
    description: p.description,
    position: LINEAR_DEVELOPMENT_PHASES.length + i + 1,
    category_id: categoryMap[p.category],
    is_active: true,
    is_continuous_process: true,
    typical_start_day: p.typical_start_day,
    typical_duration_days: p.typical_duration_days,
    duration_days: p.typical_duration_days,
  }));

  const { data: createdPhases, error: phaseErr } = await supabase
    .from('company_phases')
    .insert([...linearInserts, ...concurrentInserts])
    .select('id, name');

  if (phaseErr) throw phaseErr;
  console.log(`  Created ${createdPhases.length} company phases`);

  // ── 3.5: Phase dependencies (finish-to-start for linear phases) ──
  console.log('  3.5: Creating phase dependencies...');
  const linearCreated = createdPhases.slice(0, LINEAR_DEVELOPMENT_PHASES.length);
  const depInserts = [];
  for (let i = 1; i < linearCreated.length; i++) {
    depInserts.push({
      company_id: companyId,
      source_phase_id: linearCreated[i - 1].id,
      target_phase_id: linearCreated[i].id,
      dependency_type: 'finish_to_start',
      lag_days: 0,
    });
  }
  if (depInserts.length > 0) {
    const { error } = await supabase.from('phase_dependencies').insert(depInserts);
    if (error) console.error('  Error creating dependencies:', error.message);
  }

  // ── 3.5b: Chosen phases ──
  const chosenInserts = ALL_PHASES.map(sp => {
    const cp = createdPhases.find(p => p.name === sp.name);
    return cp ? { company_id: companyId, phase_id: cp.id, position: sp.position } : null;
  }).filter(Boolean);

  await supabase.from('company_chosen_phases').insert(chosenInserts);

  // ── 3.6: Create "No Phase" entry ──
  console.log('  3.6: Creating No Phase entry...');
  let noPhaseId: string | null = null;
  const { data: noPhase, error: noPhaseErr } = await supabase
    .from('company_phases')
    .insert({
      company_id: companyId,
      name: 'No Phase',
      description: 'Documents not assigned to any specific phase',
      position: -1,
      duration_days: 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (noPhaseErr) {
    console.error('  Error creating No Phase:', noPhaseErr.message);
  } else {
    noPhaseId = noPhase.id;
    await supabase.from('company_chosen_phases').insert({
      company_id: companyId, phase_id: noPhase.id, position: -1,
    });
    console.log('  No Phase created:', noPhaseId);
  }

  // ── 3.6b: SOP document templates (from default_company_document_template) ──
  console.log('  3.6b: Creating SOP document templates...');
  if (noPhaseId) {
    const { data: defaultTemplates } = await supabase
      .from('default_company_document_template')
      .select('*')
      .order('name');

    if (defaultTemplates && defaultTemplates.length > 0) {
      const sopInserts = defaultTemplates.map((t: any) => ({
        name: t.name,
        document_type: t.document_type || 'SOP',
        document_scope: 'company_template',
        status: 'Not Started',
        tech_applicability: 'All device types',
        company_id: companyId,
        phase_id: noPhaseId,
        description: t.description,
        file_name: t.file_name,
        file_path: t.file_path,
        file_size: t.file_size,
        file_type: t.file_type,
        public_url: t.public_url,
        markets: [],
        classes_by_market: {},
        is_predefined_core_template: true,
        uploaded_at: t.uploaded_at || null,
        uploaded_by: null,
        reviewers: [],
        due_date: null,
        reviewer_group_id: null,
      }));

      const { error } = await supabase.from('phase_assigned_document_template').insert(sopInserts);
      if (error) console.error('  Error creating SOP templates:', error.message);
      else console.log(`  Created ${sopInserts.length} SOP document templates`);
    }
  }

  // ── 3.7: Create records in `phases` table (mirrors company_phases) ──
  console.log('  3.7: Creating phases table records...');
  const phaseTableInserts = ALL_PHASES.map((sp, i) => {
    const cp = createdPhases[i];
    return {
      id: cp.id,
      company_id: companyId,
      name: sp.name,
      description: sp.description,
      position: i + 1,
      category_id: categoryMap[sp.category],
    };
  });

  const { data: phasesTableData, error: phasesTableErr } = await supabase
    .from('phases')
    .insert(phaseTableInserts)
    .select('id, name');

  if (phasesTableErr) {
    console.error('  Error creating phases table records:', phasesTableErr.message);
    return;
  }
  console.log(`  Created ${phasesTableData.length} phases table records`);

  // ── 3.8: Assign standard documents to phases ──
  console.log('  3.8: Assigning standard document templates to phases...');
  const phaseNameToId: Record<string, string> = {};
  phasesTableData.forEach((p: any) => { phaseNameToId[p.name] = p.id; });

  const allAssignments: any[] = [];
  for (const template of STANDARD_DOCUMENT_TEMPLATES) {
    for (const phaseName of template.phases) {
      const phaseId = phaseNameToId[phaseName];
      if (phaseId) {
        allAssignments.push({
          phase_id: phaseId,
          name: template.name,
          document_type: 'Standard',
          document_scope: 'company_template',
          status: 'Not Started',
          tech_applicability: 'All device types',
          markets: [],
          classes_by_market: {},
          file_name: '',
          file_path: '',
          file_size: 0,
          file_type: '',
          is_predefined_core_template: true,
          uploaded_at: null,
          uploaded_by: null,
          reviewers: [],
          description: null,
          due_date: null,
          reviewer_group_id: null,
        });
      }
    }
  }

  if (allAssignments.length > 0) {
    const BATCH_SIZE = 100;
    let inserted = 0;
    for (let i = 0; i < allAssignments.length; i += BATCH_SIZE) {
      const batch = allAssignments.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('phase_assigned_document_template').insert(batch);
      if (error) console.error(`  Error inserting doc batch:`, error.message);
      else inserted += batch.length;
    }
    console.log(`  Created ${inserted} standard document assignments`);
  }

  console.log('  Company initialization complete!');
}

// ─── Step 4: Assign Helix OS Plan ────────────────────────────────
async function assignPlan(companyId: string, userId: string): Promise<void> {
  console.log('Step 4: Assigning Helix OS plan...');

  const { data: plan } = await supabase
    .from('new_pricing_plans')
    .select('id, name')
    .eq('name', 'core')
    .maybeSingle();

  if (!plan) {
    console.log('  Warning: core plan not found, skipping');
    return;
  }

  const { data: existing } = await supabase
    .from('new_pricing_company_plans')
    .select('id')
    .eq('company_id', companyId)
    .maybeSingle();

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  const metadata = { selectedPacks: ['build', 'ops', 'monitor'], isGrowthSuite: true, monthlyTotal: 499 };

  if (existing) {
    await supabase
      .from('new_pricing_company_plans')
      .update({ status: 'active', expires_at: expiresAt.toISOString(), metadata })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('new_pricing_company_plans')
      .insert({
        company_id: companyId,
        plan_id: plan.id,
        status: 'active',
        assigned_by: userId,
        expires_at: expiresAt.toISOString(),
        metadata,
      });
  }
  console.log('  Helix OS plan assigned');
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   WHX Demo Account Seed Script              ║');
  console.log('║   Email:    demo@xyreg.com                  ║');
  console.log('║   Password: XyregDemo#2026                  ║');
  console.log('║   Company:  NovaMed Devices GmbH            ║');
  console.log('║   Plan:     Helix OS (Core)                 ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  try {
    const userId = await signUpUser();
    const companyId = await createCompany(userId);
    await initializeCompany(companyId, userId);
    await assignPlan(companyId, userId);

    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('  Demo account created successfully!');
    console.log('');
    console.log('  Login:    demo@xyreg.com / XyregDemo#2026');
    console.log('  Company:  NovaMed Devices GmbH');
    console.log('  Plan:     Helix OS (Core)');
    console.log('═══════════════════════════════════════════════');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('SEED SCRIPT FAILED:', error.message || error);
    console.error('');
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

main();
