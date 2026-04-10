
import { standardDocData } from '@/data/standardDocData';
import { supabase } from '@/integrations/supabase/client';
import { DefaultDocumentTemplateService } from '@/services/defaultDocumentTemplateService';
import { NoPhaseService } from '@/services/noPhaseService';
import { encryptApiKey } from '@/utils/apiKeyUtils';

export interface StandardPhase {
  name: string;
  description: string;
  category: string;
}

interface SOPDocumentTemplate {
  name: string;
  type: string;
  file?: File;
  description?: string;
}

interface SOPUploadResult {
  success: boolean;
  message: string;
  documentId?: string;
  filePath?: string;
  error?: string;
}



// Linear Development Phases - 7 sequential phases (must finish first before starting second)
// Based on spreadsheet: typical_start_day and typical_duration_days
export interface LinearPhaseData extends StandardPhase {
  typical_start_day: number;
  typical_duration_days: number;
  is_continuous_process: boolean; // false for sequential, true for parallel (e.g., Risk Management)
  position: number; // Explicit position for correct ordering
}

// Concurrent Phases - 4 phases that run in parallel throughout the project (staggered starts)
interface ConcurrentPhaseData extends StandardPhase {
  is_continuous_process: true;
  typical_start_day: number;
  typical_duration_days: number;
  position: number; // Explicit position for correct ordering
}

// 7 Linear Development Phases (sequential order)
const LINEAR_DEVELOPMENT_PHASES: LinearPhaseData[] = [
  { name: "Concept & Feasibility", description: "Initial concept development and feasibility assessment", category: "Design Control Steps", typical_start_day: 0, typical_duration_days: 30, is_continuous_process: false, position: 0 },
  { name: "Project Initiation & Planning", description: "Project initiation and planning activities", category: "Design Control Steps", typical_start_day: 30, typical_duration_days: 30, is_continuous_process: false, position: 1 },
  { name: "Requirements & Design Inputs", description: "Definition of requirements and design inputs", category: "Design Control Steps", typical_start_day: 60, typical_duration_days: 60, is_continuous_process: false, position: 2 },
  { name: "Design & Development (Output)", description: "Design and development activities and outputs", category: "Design Control Steps", typical_start_day: 120, typical_duration_days: 240, is_continuous_process: false, position: 3 },
  { name: "Verification & Validation (V&V)", description: "Verification and validation activities", category: "Design Control Steps", typical_start_day: 360, typical_duration_days: 210, is_continuous_process: false, position: 4 },
  { name: "Finalization & Transfer", description: "Finalization and transfer to manufacturing", category: "Design Control Steps", typical_start_day: 570, typical_duration_days: 45, is_continuous_process: false, position: 5 },
  { name: "Regulatory Submission & Approval", description: "Regulatory submission and approval processes", category: "Design Control Steps", typical_start_day: 615, typical_duration_days: 180, is_continuous_process: false, position: 6 },
  { name: "Launch & Post-Launch", description: "Launch and post-launch activities", category: "Design Control Steps", typical_start_day: 795, typical_duration_days: 30, is_continuous_process: false, position: 7 },
];

// 4 Concurrent Phases (run in parallel throughout project lifecycle with staggered starts)
// Start days: 0, 60, 120, 360 - aligned with related linear phases
const CONCURRENT_PHASES: ConcurrentPhaseData[] = [
  { name: "Risk Management", description: "Risk management throughout product lifecycle", category: "Design Control Steps", is_continuous_process: true, typical_start_day: 0, typical_duration_days: 795, position: 8 },
  { name: "Technical Documentation", description: "Creation and maintenance of technical documentation", category: "Design Control Steps", is_continuous_process: true, typical_start_day: 60, typical_duration_days: 555, position: 9 },
  { name: "Supplier Management", description: "Supplier management and oversight", category: "Supply Chain & Quality Assurance", is_continuous_process: true, typical_start_day: 120, typical_duration_days: 675, position: 10 },
  { name: "Post-Market Surveillance", description: "Post-market surveillance and monitoring (PMS)", category: "Post-Market & Lifecycle Management", is_continuous_process: true, typical_start_day: 360, typical_duration_days: 30, position: 11 },
];

// Product Realisation Lifecycle - 6 ISO 13485-aligned phases (additional group)
export const PRODUCT_REALISATION_PHASES: LinearPhaseData[] = [
  { 
    name: "Concept & Planning (ISO 13485 §7.1)", 
    description: '"Defining the Strategy" The initial stage where the medical need and commercial feasibility are validated. You define the project scope, allocate resources, identify regulatory pathways, and create the core plan that guides the entire project.',
    category: "Product Realisation Lifecycle", 
    typical_start_day: 0, 
    typical_duration_days: 30, 
    is_continuous_process: false, 
    position: 12 
  },
  { 
    name: "Design Inputs (ISO 13485 §7.3.3)", 
    description: '"Freezing the Requirements" The translation of vague user needs into precise, measurable technical requirements. This phase establishes exactly what the device must do, defining the performance, safety, and regulatory constraints that the engineering team must meet.',
    category: "Product Realisation Lifecycle", 
    typical_start_day: 30, 
    typical_duration_days: 30, 
    is_continuous_process: false, 
    position: 13 
  },
  { 
    name: "Design & Development (ISO 13485 §7.3.4)", 
    description: '"Building the Solution" The iterative engineering process of creating the device. This involves designing the physical architecture, writing software, creating schematics, and conducting technical reviews to ensure the emerging design aligns with the inputs.',
    category: "Product Realisation Lifecycle", 
    typical_start_day: 60, 
    typical_duration_days: 120, 
    is_continuous_process: false, 
    position: 14 
  },
  { 
    name: "Verification & Validation (ISO 13485 §7.3.5–6)", 
    description: '"Proving It Works" Verification: Testing to prove the device was built correctly (Does it meet the specs?). Validation: Testing to prove the right device was built (Does it actually help the user/patient in the real world?).',
    category: "Product Realisation Lifecycle", 
    typical_start_day: 180, 
    typical_duration_days: 90, 
    is_continuous_process: false, 
    position: 15 
  },
  { 
    name: "Transfer & Production (ISO 13485 §7.3.8, §7.5)", 
    description: '"Scaling for Manufacture" Moving the design from R&D to the manufacturing floor. This involves freezing the "recipe" (Device Master Record), validating manufacturing equipment, training operators, and finalizing the supply chain.',
    category: "Product Realisation Lifecycle", 
    typical_start_day: 270, 
    typical_duration_days: 60, 
    is_continuous_process: false, 
    position: 16 
  },
  {
    name: "Market & Surveillance (ISO 13485 §8.2.1)",
    description: '"Monitoring Real-World Safety" The active maintenance phase after launch. You continuously collect data on how the device performs in the field, handle customer complaints, report adverse events, and update risk management files.',
    category: "Product Realisation Lifecycle",
    typical_start_day: 330,
    typical_duration_days: 30,
    is_continuous_process: false,
    position: 17
  },
  {
    name: "Risk Management (ISO 14971, ISO 13485 §7.1)",
    description: '"Managing Safety Throughout the Lifecycle" A continuous process that runs in parallel with all development stages. You identify hazards, estimate and evaluate risks, implement risk controls, and verify their effectiveness. Risk management is not a phase you start and finish — it accompanies the device from concept through post-market.',
    category: "Product Realisation Lifecycle",
    typical_start_day: 0,
    typical_duration_days: 360,
    is_continuous_process: true, // Runs in parallel, not sequential - no dependencies
    position: 18
  }
];

// Combined standard phases for backward compatibility (8 linear + 4 concurrent + 6 realisation = 18 total)
const STANDARD_PHASES: StandardPhase[] = [
  ...LINEAR_DEVELOPMENT_PHASES.map(p => ({ name: p.name, description: p.description, category: p.category })),
  ...CONCURRENT_PHASES.map(p => ({ name: p.name, description: p.description, category: p.category })),
  ...PRODUCT_REALISATION_PHASES.map(p => ({ name: p.name, description: p.description, category: p.category })),
];
const STANDARD_DOCUMENT_TEMPLATES = standardDocData;

// Mapping: Design Control phase names → corresponding Product Realisation phase names
// Used to also assign documents to active phases
const DC_TO_PR_PHASE_MAP: Record<string, string[]> = {
  "Concept & Feasibility": ["Concept & Planning (ISO 13485 §7.1)"],
  "Project Initiation & Planning": ["Concept & Planning (ISO 13485 §7.1)"],
  "Requirements & Design Inputs": ["Design Inputs (ISO 13485 §7.3.3)"],
  "Design & Development (Output)": ["Design & Development (ISO 13485 §7.3.4)"],
  "Verification & Validation (V&V)": ["Verification & Validation (ISO 13485 §7.3.5–6)"],
  "Finalization & Transfer": ["Transfer & Production (ISO 13485 §7.3.8, §7.5)"],
  "Regulatory Submission & Approval": ["Transfer & Production (ISO 13485 §7.3.8, §7.5)"],
  "Launch & Post-Launch": ["Market & Surveillance (ISO 13485 §8.2.1)"],
  "Risk Management": ["Risk Management (ISO 14971, ISO 13485 §7.1)"],
  "Technical Documentation": ["Design & Development (ISO 13485 §7.3.4)", "Verification & Validation (ISO 13485 §7.3.5–6)"],
  "Supplier Management": ["Transfer & Production (ISO 13485 §7.3.8, §7.5)"],
  "Post-Market Surveillance": ["Market & Surveillance (ISO 13485 §8.2.1)"],
};
export interface CompanyInitializationResult {
  success: boolean;
  message: string;
  phasesCreated?: number;
  categoryId?: string;
  error?: string;
}

export interface InitializationProgress {
  step: number;
  totalSteps: number;
  stepName: string;
  percentage: number;
}

export type ProgressCallback = (progress: InitializationProgress) => void;

export class CompanyInitializationService {
  /**
   * Helper to report progress
   */
  private static reportProgress(
    onProgress: ProgressCallback | undefined,
    step: number,
    totalSteps: number,
    stepName: string
  ) {
    if (onProgress) {
      const percentage = Math.round((step / totalSteps) * 100);
      onProgress({ step, totalSteps, stepName, percentage });
    }
  }

  /**
   * Initialize a new company with standard system phases
   */
  static async initializeCompany(
    companyId: string,
    companyName: string,
    onProgress?: ProgressCallback
  ): Promise<CompanyInitializationResult> {
    const TOTAL_STEPS = 12;

    try {
      // console.log(`[CompanyInitializationService] Initializing company: ${companyName} (${companyId})`);

      // Step 1: Set the current user as admin in user_company_access
      this.reportProgress(onProgress, 1, TOTAL_STEPS, 'Setting up user access');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Could not get current user for admin assignment');
      }
      // Store user for reuse in later steps (especially Step 3 for document types)
      const currentUser = user;
      // Check if user already has access
      const { data: existingAccess, error: accessCheckError } = await supabase
        .from('user_company_access')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('company_id', companyId)
        .single();
      // console.log(`[CompanyInitializationService] Existing access: ${existingAccess}`);
      if (accessCheckError && accessCheckError.code !== 'PGRST116') {
        throw accessCheckError;
      }
      if (!existingAccess) {
        const { error: insertError } = await supabase
          .from('user_company_access')
          .insert({
            user_id: currentUser.id,
            company_id: companyId,
            access_level: 'admin',
            affiliation_type: 'internal',
            is_primary: true
          });
        if (insertError) {
          throw insertError;
        }
      }

      // Step 2: Create or get all three categories
      this.reportProgress(onProgress, 2, TOTAL_STEPS, 'Creating phase categories');
      const categories = [
        { name: 'Design Control Steps', position: 1 },
        { name: 'Supply Chain & Quality Assurance', position: 2 },
        { name: 'Product Realisation Lifecycle', position: 3 },
        { name: 'Post-Market & Lifecycle Management', position: 4 }
      ];

      const categoryMap: Record<string, string> = {};

      for (const category of categories) {
        const { data: existingCategory, error: categoryFetchError } = await supabase
          .from('phase_categories')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', category.name)
          .single();

        if (categoryFetchError && categoryFetchError.code !== 'PGRST116') {
          throw categoryFetchError;
        }

        if (existingCategory) {
          categoryMap[category.name] = existingCategory.id;
          // console.log(`[CompanyInitializationService] Using existing ${category.name} category: ${existingCategory.id}`);
        } else {
          const { data: newCategory, error: categoryCreateError } = await supabase
            .from('phase_categories')
            .insert({
              company_id: companyId,
              name: category.name,
              position: category.position,
              is_system_category: true // Mark as system category
            })
            .select('id')
            .single();

          if (categoryCreateError) throw categoryCreateError;

          categoryMap[category.name] = newCategory.id;
          // console.log(`[CompanyInitializationService] Created ${category.name} category: ${newCategory.id}`);
        }
      }

      // Set default category for backward compatibility
      const categoryId = categoryMap['Design Control Steps'];

      // Step 3: Create default document types
      this.reportProgress(onProgress, 3, TOTAL_STEPS, 'Creating default document types');
      const DEFAULT_DOCUMENT_TYPES = [
        'Standard',
        'Regulatory',
        'Technical',
        'Clinical',
        'Quality',
        'Design',
        'SOP'
      ];

      try {
        // Check if document types already exist for this company (idempotent)
        const { data: existingTypes, error: typesCheckError } = await supabase
          .from('document_types')
          .select('name')
          .eq('company_id', companyId);

        if (typesCheckError && typesCheckError.code !== 'PGRST116') {
          console.error('[CompanyInitializationService] Error checking existing document types:', typesCheckError);
        } else {
          const existingTypeNames = existingTypes?.map(t => t.name) || [];
          const typesToCreate = DEFAULT_DOCUMENT_TYPES.filter(type => !existingTypeNames.includes(type));

          if (typesToCreate.length > 0) {
            // Use the user from Step 1 (stored as currentUser) for consistency and reliability
            if (!currentUser) {
              console.warn('[CompanyInitializationService] User not available for document types creation, skipping');
            } else {
              // Batch insert document types
              const documentTypeInserts = typesToCreate.map(typeName => ({
                company_id: companyId,
                user_id: currentUser.id,
                name: typeName.trim(),
                created_by: currentUser.id
              }));

              const { error: typesInsertError } = await supabase
                .from('document_types')
                .insert(documentTypeInserts);

              if (typesInsertError) {
                console.error('[CompanyInitializationService] Error creating document types:', typesInsertError);
              } else {
                // console.log(`[CompanyInitializationService] Successfully created ${typesToCreate.length} default document types`);
              }
            }
          } else {
            // console.log('[CompanyInitializationService] Document types already exist, skipping creation');
          }
        }
      } catch (error) {
        console.error('[CompanyInitializationService] Error in document types creation:', error);
        // Don't fail initialization if document types creation fails
      }

      // Check if company already has phases
      const { data: existingPhases, error: phaseCheckError } = await supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);

      if (phaseCheckError) throw phaseCheckError;

      if (existingPhases && existingPhases.length > 0) {
        return {
          success: true,
          message: 'Company already has phases initialized',
          phasesCreated: 0,
          categoryId
        };
      }

      // Step 4: Create all standard system phases (7 Linear + 4 Concurrent = 11 total)
      this.reportProgress(onProgress, 4, TOTAL_STEPS, 'Creating development phases');
      // Linear phases first (positions 1-7), then Concurrent phases (positions 8-11)
      // Only Product Realisation Lifecycle phases are active by default
      const linearPhaseInserts = LINEAR_DEVELOPMENT_PHASES.map((phase, index) => ({
        company_id: companyId,
        name: phase.name,
        description: phase.description,
        position: index + 1,
        category_id: categoryMap[phase.category],
        is_active: false, // Not active by default - only Product Realisation Lifecycle is active
        is_continuous_process: false,
        typical_start_day: phase.typical_start_day,
        typical_duration_days: phase.typical_duration_days,
        duration_days: phase.typical_duration_days
      }));

      const concurrentPhaseInserts = CONCURRENT_PHASES.map((phase, index) => ({
        company_id: companyId,
        name: phase.name,
        description: phase.description,
        position: LINEAR_DEVELOPMENT_PHASES.length + index + 1,
        category_id: categoryMap[phase.category],
        is_active: false, // Not active by default - only Product Realisation Lifecycle is active
        is_continuous_process: true,
        typical_start_day: phase.typical_start_day, // Staggered starts: 0, 60, 120, 360
        typical_duration_days: phase.typical_duration_days,
        duration_days: phase.typical_duration_days
      }));

      // Product Realisation Lifecycle phases (positions 12-17)
      const realisationPhaseInserts = PRODUCT_REALISATION_PHASES.map((phase, index) => ({
        company_id: companyId,
        name: phase.name,
        description: phase.description,
        position: LINEAR_DEVELOPMENT_PHASES.length + CONCURRENT_PHASES.length + index + 1,
        category_id: categoryMap[phase.category],
        is_active: true,
        is_continuous_process: phase.is_continuous_process,
        typical_start_day: phase.typical_start_day,
        typical_duration_days: phase.typical_duration_days,
        duration_days: phase.typical_duration_days
      }));

      const phaseInserts = [...linearPhaseInserts, ...concurrentPhaseInserts, ...realisationPhaseInserts];

      const { data: createdPhases, error: phaseCreateError } = await supabase
        .from('company_phases')
        .insert(phaseInserts)
        .select('id, name');

      if (phaseCreateError) throw phaseCreateError;

      // Step 5: Create finish-to-start (FS) dependencies between linear phases
      this.reportProgress(onProgress, 5, TOTAL_STEPS, 'Setting up phase dependencies');
      // Each linear phase depends on the previous one finishing first
      const linearCreatedPhases = createdPhases.slice(0, LINEAR_DEVELOPMENT_PHASES.length);
      const dependencyInserts = [];

      for (let i = 1; i < linearCreatedPhases.length; i++) {
        const sourcePhase = linearCreatedPhases[i - 1]; // Previous phase
        const targetPhase = linearCreatedPhases[i];     // Current phase

        dependencyInserts.push({
          company_id: companyId,
          source_phase_id: sourcePhase.id,
          target_phase_id: targetPhase.id,
          dependency_type: 'finish_to_start',
          lag_days: 0
        });
      }

      // Create finish-to-start dependencies for Product Realisation Lifecycle phases
      // Skip Risk Management phase - it runs in parallel with no dependencies
      const realisationCreatedPhases = createdPhases.slice(
        LINEAR_DEVELOPMENT_PHASES.length + CONCURRENT_PHASES.length
      );

      for (let i = 1; i < realisationCreatedPhases.length; i++) {
        const sourcePhase = realisationCreatedPhases[i - 1];
        const targetPhase = realisationCreatedPhases[i];

        // Skip creating dependency if target is Risk Management (runs in parallel)
        if (targetPhase.name.includes('Risk Management')) {
          continue;
        }

        dependencyInserts.push({
          company_id: companyId,
          source_phase_id: sourcePhase.id,
          target_phase_id: targetPhase.id,
          dependency_type: 'finish_to_start',
          lag_days: 0
        });
      }

      if (dependencyInserts.length > 0) {
        const { error: dependencyError } = await supabase
          .from('phase_dependencies')
          .insert(dependencyInserts);

        if (dependencyError) {
          console.error('[CompanyInitializationService] Error creating phase dependencies:', dependencyError);
        }
      }

      // Only add Product Realisation Lifecycle phases to company_chosen_phases (active by default)
      // Other phases are created but not chosen - they remain in the non-active pool
      const chosenPhaseInserts = PRODUCT_REALISATION_PHASES.map((standardPhase) => {
        const createdPhase = createdPhases.find(cp => cp.name === standardPhase.name);
        if (!createdPhase) {
          console.warn(`[CompanyInitializationService] Could not find created phase: ${standardPhase.name}`);
          return null;
        }
        return {
          company_id: companyId,
          phase_id: createdPhase.id,
          position: standardPhase.position // Use explicit position from phase definition
        };
      }).filter(Boolean) as Array<{ company_id: string; phase_id: string; position: number }>;

      const { data: chosenPhase, error: chosenPhaseError } = await supabase
        .from('company_chosen_phases')
        .insert(chosenPhaseInserts) 
        .select("*")

      if (chosenPhaseError) throw chosenPhaseError;

      // Step 6: Create "No Phase" first (needed for SOP documents)
      this.reportProgress(onProgress, 6, TOTAL_STEPS, 'Creating No Phase entry');
      let noPhaseId: string | null = null;
      try {
        const noPhase = await NoPhaseService.getOrCreateNoPhase(companyId);
        if (noPhase) {
          noPhaseId = noPhase.id;
          // console.log(`[CompanyInitializationService] Created No Phase entry: ${noPhase.id}`);
        } else {
          console.warn('[CompanyInitializationService] Failed to create No Phase entry');
        }
      } catch (noPhaseError) {
        console.error('[CompanyInitializationService] Error creating No Phase:', noPhaseError);
        // Don't fail initialization if No Phase creation fails
      }

      // Step 6b: Create all SOP document templates in phase_assigned_document_template table with No Phase
      this.reportProgress(onProgress, 6, TOTAL_STEPS, 'Creating document templates');
      try {
        const defaultTemplates = await DefaultDocumentTemplateService.getAllTemplates();
        // console.log(`[CompanyInitializationService] Fetched ${defaultTemplates.length} default document templates`);

        // Batch insert all templates into phase_assigned_document_template table with No Phase ID
        if (defaultTemplates.length > 0 && noPhaseId) {
          const templateInserts = defaultTemplates
            .filter(template => template.document_type !== 'SOP' && !template.name?.startsWith('SOP-'))
            .map(template => ({
            name: template.name,
            document_type: template.document_type || 'SOP',
            document_scope: 'company_template' as const, // Changed from 'company_document' to 'company_template'
            status: 'Not Started',
            tech_applicability: 'All device types',
            company_id: companyId,
            phase_id: noPhaseId, // Assign to No Phase
            description: template.description,
            file_name: template.file_name,
            file_path: template.file_path,
            file_size: template.file_size,
            file_type: template.file_type,
            public_url: template.public_url,
            markets: [],
            classes_by_market: {},
            is_predefined_core_template: true,
            uploaded_at: template.uploaded_at || null,
            uploaded_by: null,
            reviewers: [],
            due_date: null,
            reviewer_group_id: null
          }));

          const { error: batchInsertError } = await supabase
            .from('phase_assigned_document_template')
            .insert(templateInserts);

          if (batchInsertError) {
            // console.log(`[CompanyInitializationService] Error batch creating SOP document templates: ${batchInsertError}`);
          } else {
            // console.log(`[CompanyInitializationService] Successfully created ${defaultTemplates.length} SOP document templates in phase_assigned_document_template with No Phase`);
          }
        } else if (defaultTemplates.length > 0 && !noPhaseId) {
          console.warn('[CompanyInitializationService] No Phase ID not available, skipping SOP document creation');
        }
      } catch (error) {
        // console.log(`[CompanyInitializationService] Error fetching default document templates: ${error}`);
      }

      // Step 7: Create phase records
      this.reportProgress(onProgress, 7, TOTAL_STEPS, 'Setting up phase records');
      const insertPhase = STANDARD_PHASES.map((phase, index) => ({
        id: createdPhases[index].id,
        company_id: companyId,
        name: phase.name,
        description: phase.description,
        position: index + 1,
        category_id: categoryMap[phase.category],
      }));
      const { data: createPhase, error: createPhaseError } = await supabase
        .from('phases')
        .insert(insertPhase)
        .select("*")

      if (createPhaseError) {
        // console.log(`[CompanyInitializationService] Error creating phase: ${createPhaseError}`);
        return {
          success: false,
          message: 'Failed to create phase records',
          error: createPhaseError.message
        };
      }
      // console.log(`[CompanyInitializationService] Successfully created ${createPhase.length} phase records`);

      // Step 8: Assign document templates to phases
      this.reportProgress(onProgress, 8, TOTAL_STEPS, 'Assigning document templates');

      // Batch all phase assignments together
      const allPhaseAssignments: any[] = [];
      const assignedPairs = new Set<string>(); // track "docName|phaseId" to avoid duplicates

      for (const template of STANDARD_DOCUMENT_TEMPLATES) {
        // Collect all target phase names: original DC phases + mapped PR phases
        const allTargetPhaseNames = new Set<string>();
        for (const dcPhaseName of template.phases) {
          allTargetPhaseNames.add(dcPhaseName);
          const prPhases = DC_TO_PR_PHASE_MAP[dcPhaseName];
          if (prPhases) {
            prPhases.forEach(pr => allTargetPhaseNames.add(pr));
          }
        }

        const phaseAssignments = createPhase
          .filter(phase => allTargetPhaseNames.has(phase.name))
          .map(phase => {
            const key = `${template.name}|${phase.id}`;
            if (assignedPairs.has(key)) return null;
            assignedPairs.add(key);
            return {
              phase_id: phase.id,
              name: template.name,
              document_type: 'Standard',
              document_scope: 'company_template' as const,
              status: 'Not Started',
              tech_applicability: 'All device types',
              company_id: companyId,
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
              reviewer_group_id: null
            };
          })
          .filter(Boolean);
        allPhaseAssignments.push(...phaseAssignments);
      }

      // Single batch insert for all phase assignments
      if (allPhaseAssignments.length > 0) {
        const { error: assignmentError } = await supabase
          .from('phase_assigned_document_template')
          .insert(allPhaseAssignments);

        if (assignmentError) {
          // console.log(`[CompanyInitializationService] Error creating phase assignments: ${assignmentError}`);
        } else {
          // console.log(`[CompanyInitializationService] Successfully created ${allPhaseAssignments.length} phase assignments`);
        }
      }

      // Step 9: Create QMS Node SOPs and Link them
      this.reportProgress(onProgress, 9, TOTAL_STEPS, 'Creating QMS Node SOPs');
      await this.createQmsNodeSOPs(companyId);

      // Step 10: Assign default SerpAPI key
      this.reportProgress(onProgress, 10, TOTAL_STEPS, 'Assigning default API keys');
      await this.assignDefaultApiKeys(companyId);

      // Step 11: Set default password expiration policy (90 days, enabled)
      this.reportProgress(onProgress, 11, TOTAL_STEPS, 'Setting default password policy');
      await this.setDefaultPasswordPolicy(companyId);

      // Step 12: Complete
      this.reportProgress(onProgress, 12, TOTAL_STEPS, 'Complete');

      return {
        success: true,
        message: `Successfully initialized company with ${createdPhases.length} standard system phases`,
        phasesCreated: createdPhases.length,
        categoryId
      };



    } catch (error) {
      console.error(' :', error);
      return {
        success: false,
        message: 'Failed to initialize company phases',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sync only the standard phases (without document templates)
   * This method adds missing standard phases and updates category assignments for existing phases
   */
  static async syncStandardPhasesOnly(companyId: string, companyName: string): Promise<CompanyInitializationResult> {
    try {

      // Step 1: Create or get all three categories
      const categories = [
        { name: 'Design Control Steps', position: 1 },
        { name: 'Supply Chain & Quality Assurance', position: 2 },
        { name: 'Post-Market & Lifecycle Management', position: 3 }
      ];

      const categoryMap: Record<string, string> = {};

      for (const category of categories) {
        const { data: existingCategory, error: categoryFetchError } = await supabase
          .from('phase_categories')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', category.name)
          .single();

        if (categoryFetchError && categoryFetchError.code !== 'PGRST116') {
          throw categoryFetchError;
        }

        if (existingCategory) {
          categoryMap[category.name] = existingCategory.id;
        } else {
          const { data: newCategory, error: categoryCreateError } = await supabase
            .from('phase_categories')
            .insert({
              company_id: companyId,
              name: category.name,
              position: category.position,
              is_system_category: true
            })
            .select('id')
            .single();

          if (categoryCreateError) throw categoryCreateError;

          categoryMap[category.name] = newCategory.id;
        }
      }

      const categoryId = categoryMap['Design Control Steps'];

      // Step 2: Get existing phases for this company
      const { data: existingPhases, error: phaseCheckError } = await supabase
        .from('company_phases')
        .select('id, name, category_id')
        .eq('company_id', companyId);

      if (phaseCheckError) throw phaseCheckError;

      const existingPhaseMap = new Map(existingPhases?.map(p => [p.name, p]) || []);

      // Step 3: Update existing phases with correct category, is_continuous_process, and timing data
      // Helper function to match phase names (handles prefixed names like "(01) Concept & Feasibility")
      const matchPhaseName = (dbName: string, standardName: string): boolean => {
        // Exact match
        if (dbName === standardName) return true;
        // Check if DB name contains the standard name (handles prefixed names)
        if (dbName.includes(standardName)) return true;
        // Check if removing prefix pattern matches
        const withoutPrefix = dbName.replace(/^\(\d+\)\s*/, '').replace(/^\([A-Z]\d+\)\s*/, '');
        return withoutPrefix === standardName;
      };

      let phasesUpdated = 0;
      for (const standardPhase of STANDARD_PHASES) {
        // Find existing phase by matching name (exact or partial match)
        let existingPhase = existingPhaseMap.get(standardPhase.name);
        if (!existingPhase) {
          // Try to find by partial match
          for (const [dbName, phase] of existingPhaseMap) {
            if (matchPhaseName(dbName, standardPhase.name)) {
              existingPhase = phase;
              break;
            }
          }
        }

        if (existingPhase) {
          // Find if it's a linear or concurrent phase
          const linearPhase = LINEAR_DEVELOPMENT_PHASES.find(lp => lp.name === standardPhase.name);
          const concurrentPhase = CONCURRENT_PHASES.find(cp => cp.name === standardPhase.name);

          const correctCategoryId = categoryMap[standardPhase.category];
          const isContinuous = concurrentPhase ? true : false;
          // Concurrent phases use staggered start days: 0, 60, 120, 360
          const typicalStartDay = concurrentPhase ? concurrentPhase.typical_start_day : (linearPhase ? linearPhase.typical_start_day : 0);
          const typicalDurationDays = concurrentPhase ? concurrentPhase.typical_duration_days : (linearPhase ? linearPhase.typical_duration_days : 0);

          // Calculate start_date based on typical_start_day (from today as base)
          const baseDate = new Date();
          const startDate = new Date(baseDate.getTime() + typicalStartDay * 24 * 60 * 60 * 1000);

          // Update with all the correct values
          const { error: updateError } = await supabase
            .from('company_phases')
            .update({
              category_id: correctCategoryId,
              is_continuous_process: isContinuous,
              typical_start_day: typicalStartDay,
              typical_duration_days: typicalDurationDays,
              duration_days: typicalDurationDays || 30,
              start_date: startDate.toISOString().split('T')[0] // Set start_date based on typical_start_day
            })
            .eq('id', existingPhase.id);

          if (updateError) {
            console.error(`[CompanyInitializationService] Error updating phase ${existingPhase.name}:`, updateError);
          } else {
            // console.log(`[CompanyInitializationService] Updated phase: ${existingPhase.name} -> is_continuous_process: ${isContinuous}, typical_start_day: ${typicalStartDay}, start_date: ${startDate.toISOString().split('T')[0]}`);
            phasesUpdated++;
          }
        }
      }

      // Step 4: Filter out phases that already exist
      const missingPhases = STANDARD_PHASES.filter(phase => !existingPhaseMap.has(phase.name));

      if (missingPhases.length === 0 && phasesUpdated === 0) {
        // Still sync dependencies even if no phases were updated
        const dependenciesCreated = await this.syncLinearPhaseDependencies(companyId);
        return {
          success: true,
          message: dependenciesCreated > 0
            ? `All standard phases already configured. Created ${dependenciesCreated} dependencies.`
            : 'All standard phases are already configured for this company',
          phasesCreated: 0,
          categoryId
        };
      }

      if (missingPhases.length === 0 && phasesUpdated > 0) {
        // Sync dependencies after updating phases
        const dependenciesCreated = await this.syncLinearPhaseDependencies(companyId);
        return {
          success: true,
          message: `Updated category assignments for ${phasesUpdated} phases${dependenciesCreated > 0 ? ` and created ${dependenciesCreated} dependencies` : ''}`,
          phasesCreated: 0,
          categoryId
        };
      }

      // Step 5: Create missing phases with proper timing data
      // Get the max position of existing phases
      const { data: maxPositionData } = await supabase
        .from('company_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const startPosition = (maxPositionData?.position || 0) + 1;

      const phaseInserts = missingPhases.map((phase, index) => {
        // Check if this is a linear or concurrent phase
        const linearPhase = LINEAR_DEVELOPMENT_PHASES.find(lp => lp.name === phase.name);
        const concurrentPhase = CONCURRENT_PHASES.find(cp => cp.name === phase.name);

        return {
          company_id: companyId,
          name: phase.name,
          description: phase.description,
          position: startPosition + index,
          category_id: categoryMap[phase.category],
          is_active: true,
          is_continuous_process: concurrentPhase ? true : false,
          typical_start_day: concurrentPhase ? concurrentPhase.typical_start_day : (linearPhase ? linearPhase.typical_start_day : 0),
          typical_duration_days: concurrentPhase ? concurrentPhase.typical_duration_days : (linearPhase ? linearPhase.typical_duration_days : 0),
          duration_days: concurrentPhase ? concurrentPhase.typical_duration_days : (linearPhase ? linearPhase.typical_duration_days : 0)
        };
      });

      const { data: createdPhases, error: phaseCreateError } = await supabase
        .from('company_phases')
        .insert(phaseInserts)
        .select('id, name');

      if (phaseCreateError) throw phaseCreateError;

      // Step 6: Add created phases to company_chosen_phases
      // Match phases by name to ensure correct position order based on STANDARD_PHASES
      const allStandardPhases = [...LINEAR_DEVELOPMENT_PHASES, ...CONCURRENT_PHASES];
      const chosenPhaseInserts = missingPhases.map((standardPhase) => {
        // Find the phase definition with explicit position
        const phaseDef = allStandardPhases.find(sp => sp.name === standardPhase.name);
        // Match created phase by name to handle any database ordering issues
        const createdPhase = createdPhases.find(cp => cp.name === standardPhase.name);
        
        if (!createdPhase) {
          console.warn(`[CompanyInitializationService] Could not find created phase: ${standardPhase.name}`);
          return null;
        }
        
        if (!phaseDef) {
          console.warn(`[CompanyInitializationService] Could not find phase definition for: ${standardPhase.name}`);
          return null;
        }
        
        return {
          company_id: companyId,
          phase_id: createdPhase.id,
          position: phaseDef.position // Use explicit position from phase definition
        };
      }).filter(Boolean) as Array<{ company_id: string; phase_id: string; position: number }>;

      const { error: chosenPhaseError } = await supabase
        .from('company_chosen_phases')
        .insert(chosenPhaseInserts);

      if (chosenPhaseError) throw chosenPhaseError;

      // Step 7: Create/Update finish-to-start dependencies for linear phases
      const dependenciesCreated = await this.syncLinearPhaseDependencies(companyId);

      const totalChanges = createdPhases.length + phasesUpdated;

      return {
        success: true,
        message: `Successfully synced ${createdPhases.length} new phases${phasesUpdated > 0 ? ` and updated ${phasesUpdated} existing phases` : ''}${dependenciesCreated > 0 ? ` and created ${dependenciesCreated} dependencies` : ''}`,
        phasesCreated: createdPhases.length,
        categoryId
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to sync standard phases',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create finish-to-start dependencies between linear phases
   * This ensures sequential execution: Phase 1 must finish before Phase 2 starts
   */
  static async syncLinearPhaseDependencies(companyId: string): Promise<number> {
    try {
      // console.log(`[CompanyInitializationService] Syncing FS dependencies for company: ${companyId}`);

      // Get all linear phases for this company (sorted by position)
      // Linear phases have is_continuous_process = false OR null (not true)
      // We need to match by name against LINEAR_DEVELOPMENT_PHASES to identify linear phases
      const { data: allCompanyPhases, error: phasesError } = await supabase
        .from('company_phases')
        .select('id, name, position, is_continuous_process')
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) throw phasesError;

      // Helper to match phase names (handles prefixes like "(01) Concept & Feasibility")
      const matchPhaseName = (dbName: string, standardName: string): boolean => {
        if (dbName === standardName) return true;
        if (dbName.includes(standardName)) return true;
        const withoutPrefix = dbName.replace(/^\(\d+\)\s*/, '').replace(/^\([A-Z]\d+\)\s*/, '');
        return withoutPrefix === standardName;
      };

      // Filter to only linear phases (match against LINEAR_DEVELOPMENT_PHASES names)
      const linearPhaseNames = LINEAR_DEVELOPMENT_PHASES.map(p => p.name);
      const companyPhases = (allCompanyPhases || [])
        .filter(phase => linearPhaseNames.some(lpName => matchPhaseName(phase.name, lpName)))
        .sort((a, b) => {
          // Sort by the order in LINEAR_DEVELOPMENT_PHASES
          const aIndex = linearPhaseNames.findIndex(lpName => matchPhaseName(a.name, lpName));
          const bIndex = linearPhaseNames.findIndex(lpName => matchPhaseName(b.name, lpName));
          return aIndex - bIndex;
        });

      // console.log(`[CompanyInitializationService] Found ${companyPhases.length} linear phases:`, companyPhases.map(p => p.name));

      if (!companyPhases || companyPhases.length < 2) {
        // console.log('[CompanyInitializationService] Not enough linear phases to create dependencies');
        return 0;
      }

      // Check existing dependencies
      const { data: existingDeps, error: depsError } = await supabase
        .from('phase_dependencies')
        .select('source_phase_id, target_phase_id')
        .eq('company_id', companyId);

      if (depsError) throw depsError;

      const existingDepsSet = new Set(
        (existingDeps || []).map(d => `${d.source_phase_id}-${d.target_phase_id}`)
      );

      // Create FS dependencies between consecutive linear phases
      const newDependencies = [];
      for (let i = 1; i < companyPhases.length; i++) {
        const sourcePhase = companyPhases[i - 1]; // Previous phase
        const targetPhase = companyPhases[i];     // Current phase

        const depKey = `${sourcePhase.id}-${targetPhase.id}`;
        if (!existingDepsSet.has(depKey)) {
          newDependencies.push({
            company_id: companyId,
            source_phase_id: sourcePhase.id,
            target_phase_id: targetPhase.id,
            dependency_type: 'finish_to_start',
            lag_days: 0
          });
          // console.log(`[CompanyInitializationService] Creating FS dependency: ${sourcePhase.name} -> ${targetPhase.name}`);
        }
      }

      // console.log(`[CompanyInitializationService] newDependencies to insert:`, newDependencies);
      // console.log(`[CompanyInitializationService] existingDeps from DB:`, existingDeps);

      if (newDependencies.length > 0) {
        const { data: insertedDeps, error: insertError } = await supabase
          .from('phase_dependencies')
          .insert(newDependencies)
          .select('*');

        if (insertError) {
          console.error('[CompanyInitializationService] Error creating dependencies:', insertError);
          console.error('[CompanyInitializationService] Insert error details:', JSON.stringify(insertError, null, 2));
          return 0;
        }

        // console.log(`[CompanyInitializationService] Created ${newDependencies.length} new FS dependencies`);
        // console.log(`[CompanyInitializationService] Inserted dependencies:`, insertedDeps);
      } else {
        // console.log('[CompanyInitializationService] All FS dependencies already exist');
      }

      return newDependencies.length;
    } catch (error) {
      console.error('[CompanyInitializationService] Error syncing dependencies:', error);
      return 0;
    }
  }

  /**
   * Verify that a company has been properly initialized
   */
  static async verifyCompanyInitialization(companyId: string): Promise<boolean> {
    try {
      const { data: phases, error } = await supabase
        .from('company_chosen_phases')
        .select('id')
        .eq('company_id', companyId);

      if (error) throw error;

      return (phases?.length || 0) >= 11; // 7 Linear + 4 Concurrent = 11 phases
    } catch (error) {
      console.error('[CompanyInitializationService] Error verifying company initialization:', error);
      return false;
    }
  }

  /**
   * Assign default API keys to a newly created company.
   * Reads API keys from environment variables and stores them encrypted in company_api_keys.
   */
  private static async assignDefaultApiKeys(companyId: string): Promise<void> {
    const keyConfigs: { keyType: string; envVar: string }[] = [
      { keyType: 'serpapi', envVar: 'VITE_SERPAPI_KEY' },
      { keyType: 'gemini', envVar: 'VITE_GEMINI_API_KEY' },
      { keyType: 'openai', envVar: 'VITE_OPENAI_API_KEY' },
      { keyType: 'anthropic', envVar: 'VITE_ANTHROPIC_API_KEY' },
    ];

    for (const { keyType, envVar } of keyConfigs) {
      try {
        const apiKey = import.meta.env[envVar];
        if (!apiKey) {
          continue;
        }

        // Check if company already has this key type
        const { data: existing, error: checkError } = await supabase
          .from('company_api_keys')
          .select('id')
          .eq('company_id', companyId)
          .eq('key_type', keyType)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`[CompanyInitializationService] Error checking existing ${keyType} key:`, checkError);
          continue;
        }

        if (existing) {
          continue; // Already has this key type
        }

        const encryptedKey = encryptApiKey(apiKey);
        const { error: insertError } = await supabase
          .from('company_api_keys')
          .insert({
            company_id: companyId,
            key_type: keyType,
            encrypted_key: encryptedKey
          });

        if (insertError) {
          console.error(`[CompanyInitializationService] Error assigning default ${keyType} key:`, insertError);
        }
      } catch (error) {
        console.error(`[CompanyInitializationService] Error assigning ${keyType} key:`, error);
        // Don't fail initialization if API key assignment fails
      }
    }
  }

  /**
   * Set default password expiration policy (enabled, 90 days) for a newly created company.
   * Also seeds the current user's password_change_log so they aren't immediately expired.
   */
  private static async setDefaultPasswordPolicy(companyId: string): Promise<void> {
    try {
      // Get existing description data
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('description')
        .eq('id', companyId)
        .single();

      if (fetchError) {
        console.error('[CompanyInitializationService] Error fetching company for password policy:', fetchError);
        return;
      }

      let existingData: Record<string, any> = {};
      if (company?.description) {
        try {
          existingData = JSON.parse(company.description);
        } catch {
          // description is not JSON, start fresh
        }
      }

      // Only set if not already configured
      if (existingData.passwordPolicy) {
        return;
      }

      const updatedDescription = JSON.stringify({
        ...existingData,
        passwordPolicy: { enabled: true, expirationDays: 90 }
      });

      const { error: updateError } = await supabase
        .from('companies')
        .update({ description: updatedDescription })
        .eq('id', companyId);

      if (updateError) {
        console.error('[CompanyInitializationService] Error setting default password policy:', updateError);
      }

      // Seed the current user's password_change_log so they aren't immediately expired
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingLog } = await supabase
          .from('password_change_log')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (!existingLog || existingLog.length === 0) {
          await supabase
            .from('password_change_log')
            .insert({
              user_id: user.id,
              changed_at: new Date().toISOString(),
              change_source: 'initial_seed'
            });
        }
      }
    } catch (error) {
      console.error('[CompanyInitializationService] Error in setDefaultPasswordPolicy:', error);
      // Don't fail initialization if password policy setup fails
    }
  }

  /**
   * Create QMS Node SOPs and link them to their respective nodes
   */
  private static async createQmsNodeSOPs(companyId: string): Promise<void> {
    try {
      // Import the default SOP templates
      const { DEFAULT_QMS_NODE_SOPS } = await import('@/services/qmsNodeProcessService');
      
      // Get or create "No Phase" ID for company documents
      const noPhaseInfo = await NoPhaseService.getOrCreateNoPhase(companyId);
      const noPhaseId = noPhaseInfo?.id;
      
      if (!noPhaseId) {
        console.warn('[CompanyInitializationService] No Phase ID not available, skipping QMS Node SOP creation');
        return;
      }

      // Check existing SOPs to avoid duplicates
      const { data: existingDocs } = await supabase
        .from('phase_assigned_document_template')
        .select('name')
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document')
        .eq('document_type', 'SOP');

      const existingNames = new Set(existingDocs?.map(d => d.name) || []);

      // Filter out already-existing SOPs
      const sopsToCreate = DEFAULT_QMS_NODE_SOPS.filter(sop => !existingNames.has(sop.sopName));

      if (sopsToCreate.length === 0) {
        // console.log('[CompanyInitializationService] QMS Node SOPs already exist, skipping');
        return;
      }

      // Create the SOP documents
      const sopInserts = sopsToCreate.map(sop => ({
        company_id: companyId,
        phase_id: noPhaseId,
        name: sop.sopName,
        description: sop.defaultDescription || null,
        document_type: 'SOP',
        document_scope: 'company_document' as const,
        status: 'Draft',
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
        due_date: null,
        reviewer_group_id: null,
      }));

      const { data: createdDocs, error: createError } = await supabase
        .from('phase_assigned_document_template')
        .insert(sopInserts)
        .select('id, name');

      if (createError) {
        console.error('[CompanyInitializationService] Error creating QMS Node SOPs:', createError);
        return;
      }

      // Create the links between SOPs and nodes
      if (createdDocs && createdDocs.length > 0) {
        const linkInserts = createdDocs.map(doc => {
          const sopConfig = sopsToCreate.find(s => s.sopName === doc.name);
          return {
            company_id: companyId,
            node_id: sopConfig?.nodeId || '',
            document_id: doc.id,
          };
        }).filter(link => link.node_id);

        if (linkInserts.length > 0) {
          const { error: linkError } = await supabase
            .from('qms_node_sop_links')
            .insert(linkInserts);

          if (linkError) {
            console.error('[CompanyInitializationService] Error linking QMS Node SOPs:', linkError);
          }
        }
      }

      // console.log(`[CompanyInitializationService] Created ${createdDocs?.length || 0} QMS Node SOPs`);
    } catch (error) {
      console.error('[CompanyInitializationService] Error in createQmsNodeSOPs:', error);
    }
  }
}

// Export functions for backward compatibility
export async function initializeCompany(companyId: string, companyName: string): Promise<CompanyInitializationResult> {
  return CompanyInitializationService.initializeCompany(companyId, companyName);
}

export async function verifyCompanyInitialization(companyId: string): Promise<boolean> {
  return CompanyInitializationService.verifyCompanyInitialization(companyId);
}
