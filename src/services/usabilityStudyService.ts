import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────────────

export interface StudyParticipant {
  id: string;
  participant_id: string;
  user_group: string;
  demographics: string;
}

export interface StudyTask {
  id: string;
  task_id: string;
  description: string;
  instruction: string;
  acceptance_criteria: string;
  ui_area: string;
}

export interface TaskObservation {
  task_id: string;
  participant_id: string;
  observation: string;
  outcome: 'success' | 'partial_success' | 'fail';
  severity?: 'low' | 'mid' | 'high' | 'critical';
  use_errors: string;
  hazards_encountered: string;
}

export interface UsabilityStudyRow {
  id: string;
  uef_id: string | null;
  product_id: string;
  company_id: string;
  study_type: 'formative' | 'summative';
  name: string;
  study_subtype: string;
  status: 'draft' | 'planned' | 'in_progress' | 'completed';
  objective: string;
  method: string;
  acceptance_criteria: string;
  study_dates: string;
  conductors: string;
  test_location: string;
  test_conditions: string;
  prototype_id: string;
  software_version: string;
  ui_under_evaluation: string;
  training_description: string;
  training_to_test_interval: string;
  methods_used: string[];
  accompanying_docs: string;
  interview_questions: string;
  other_equipment: string;
  participants_structured: StudyParticipant[];
  tasks_structured: StudyTask[];
  observations: TaskObservation[];
  positive_learnings: string;
  negative_learnings: string;
  recommendations: string;
  overall_conclusion: string;
  participants_text: string;
  tasks_text: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────

function castRow(row: any): UsabilityStudyRow {
  return {
    ...row,
    methods_used: (row.methods_used as string[]) || [],
    participants_structured: (row.participants_structured as StudyParticipant[]) || [],
    tasks_structured: (row.tasks_structured as StudyTask[]) || [],
    observations: (row.observations as TaskObservation[]) || [],
  };
}

// ── CRUD ───────────────────────────────────────────────────────────

export async function getUsabilityStudies(
  productId: string,
  studyType?: 'formative' | 'summative'
): Promise<UsabilityStudyRow[]> {
  let query = supabase
    .from('usability_studies')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (studyType) {
    query = query.eq('study_type', studyType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(castRow);
}

export async function createUsabilityStudy(
  study: Partial<UsabilityStudyRow> & { product_id: string; company_id: string; study_type: string }
): Promise<UsabilityStudyRow> {
  const { data, error } = await supabase
    .from('usability_studies')
    .insert(study as any)
    .select()
    .single();

  if (error) throw error;
  return castRow(data);
}

export async function updateUsabilityStudy(
  id: string,
  updates: Partial<UsabilityStudyRow>
): Promise<UsabilityStudyRow> {
  const { data, error } = await supabase
    .from('usability_studies')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return castRow(data);
}

export async function deleteUsabilityStudy(id: string): Promise<void> {
  const { error } = await supabase
    .from('usability_studies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function bulkUpsertStudies(
  studies: Partial<UsabilityStudyRow>[]
): Promise<void> {
  // Simple approach: upsert each study
  for (const study of studies) {
    if (study.id) {
      const { id, created_at, updated_at, ...updates } = study;
      await updateUsabilityStudy(id, updates);
    } else {
      await createUsabilityStudy(study as any);
    }
  }
}
