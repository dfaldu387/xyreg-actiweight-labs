import { supabase } from '@/integrations/supabase/client';
import { DueType } from '@/types/training';

/**
 * Calculate due date based on due type and configuration
 */
function calculateDueDate(
  dueType: DueType,
  dueDays: number,
  annualMonth?: number | null,
  annualDay?: number | null,
  hireDate?: Date
): Date {
  const now = new Date();
  
  switch (dueType) {
    case 'days_after_assignment':
      return new Date(now.getTime() + dueDays * 24 * 60 * 60 * 1000);
    
    case 'days_after_hire':
      const baseDate = hireDate || now;
      return new Date(baseDate.getTime() + dueDays * 24 * 60 * 60 * 1000);
    
    case 'annual':
      if (annualMonth && annualDay) {
        const thisYear = new Date(now.getFullYear(), annualMonth - 1, annualDay);
        if (thisYear > now) {
          return thisYear;
        }
        return new Date(now.getFullYear() + 1, annualMonth - 1, annualDay);
      }
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    case 'one_time':
    default:
      return new Date(now.getTime() + dueDays * 24 * 60 * 60 * 1000);
  }
}

/**
 * Auto-assign training modules to a user based on their role
 */
export async function assignTrainingForRole(
  userId: string,
  roleId: string,
  companyId: string,
  hireDate?: Date
): Promise<{ success: boolean; recordsCreated: number; error?: string }> {
  try {
    // Get all training requirements for this role
    const { data: requirements, error: reqError } = await supabase
      .from('role_training_requirements')
      .select('*, training_module:training_modules(*)')
      .eq('role_id', roleId)
      .eq('company_id', companyId);
    
    if (reqError) throw reqError;
    if (!requirements || requirements.length === 0) {
      return { success: true, recordsCreated: 0 };
    }

    // Check existing records to avoid duplicates
    const { data: existingRecords } = await supabase
      .from('training_records')
      .select('training_module_id')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .in('status', ['not_started', 'in_progress', 'scheduled']);

    const existingModuleIds = new Set(existingRecords?.map(r => r.training_module_id) || []);

    // Create training records for each requirement
    const recordsToCreate = requirements
      .filter(req => !existingModuleIds.has(req.training_module_id))
      .map(req => {
        const dueDate = calculateDueDate(
          req.due_type as DueType,
          req.due_days,
          req.annual_due_month,
          req.annual_due_day,
          hireDate
        );

        const trainingModule = req.training_module as any;
        const expiresAt = trainingModule?.validity_days
          ? new Date(dueDate.getTime() + trainingModule.validity_days * 24 * 60 * 60 * 1000)
          : null;

        return {
          company_id: companyId,
          user_id: userId,
          training_module_id: req.training_module_id,
          role_requirement_id: req.id,
          status: 'not_started',
          assigned_at: new Date().toISOString(),
          due_date: dueDate.toISOString(),
          expires_at: expiresAt?.toISOString() || null,
        };
      });

    if (recordsToCreate.length === 0) {
      return { success: true, recordsCreated: 0 };
    }

    const { error: insertError } = await supabase
      .from('training_records')
      .insert(recordsToCreate);

    if (insertError) throw insertError;

    return { success: true, recordsCreated: recordsToCreate.length };
  } catch (error) {
    return { 
      success: false, 
      recordsCreated: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Reissue training records when a module version is updated
 */
export async function reissueTrainingOnVersionUpdate(
  moduleId: string,
  newVersion: string,
  companyId: string,
  reissueDueDays: number = 30
): Promise<{ success: boolean; recordsReissued: number; error?: string }> {
  try {
    // Find all completed records for this module
    const { data: completedRecords, error: fetchError } = await supabase
      .from('training_records')
      .select('*')
      .eq('training_module_id', moduleId)
      .eq('company_id', companyId)
      .eq('status', 'completed');

    if (fetchError) throw fetchError;
    if (!completedRecords || completedRecords.length === 0) {
      return { success: true, recordsReissued: 0 };
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + reissueDueDays * 24 * 60 * 60 * 1000);

    // Create new records for each completed record
    const newRecords = completedRecords.map(record => ({
      company_id: companyId,
      user_id: record.user_id,
      training_module_id: moduleId,
      role_requirement_id: record.role_requirement_id,
      status: 'not_started',
      assigned_at: now.toISOString(),
      due_date: dueDate.toISOString(),
      previous_record_id: record.id,
      reissue_reason: `Module updated to version ${newVersion}`,
    }));

    const { error: insertError } = await supabase
      .from('training_records')
      .insert(newRecords);

    if (insertError) throw insertError;

    return { success: true, recordsReissued: newRecords.length };
  } catch (error) {
    return { 
      success: false, 
      recordsReissued: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update overdue statuses for all records in a company
 */
export async function updateOverdueStatuses(companyId: string): Promise<{ updated: number }> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('training_records')
      .update({ status: 'overdue' })
      .eq('company_id', companyId)
      .in('status', ['not_started', 'in_progress', 'scheduled'])
      .lt('due_date', now)
      .select();

    if (error) throw error;
    
    return { updated: data?.length || 0 };
  } catch {
    return { updated: 0 };
  }
}

/**
 * Bulk assign training to multiple users
 */
export async function bulkAssignTraining(
  userIds: string[],
  moduleId: string,
  companyId: string,
  dueDate: Date
): Promise<{ success: boolean; recordsCreated: number; error?: string }> {
  try {
    // Check for existing records
    const { data: existingRecords } = await supabase
      .from('training_records')
      .select('user_id')
      .eq('training_module_id', moduleId)
      .eq('company_id', companyId)
      .in('user_id', userIds)
      .in('status', ['not_started', 'in_progress', 'scheduled']);

    const existingUserIds = new Set(existingRecords?.map(r => r.user_id) || []);
    
    const recordsToCreate = userIds
      .filter(userId => !existingUserIds.has(userId))
      .map(userId => ({
        company_id: companyId,
        user_id: userId,
        training_module_id: moduleId,
        status: 'not_started',
        assigned_at: new Date().toISOString(),
        due_date: dueDate.toISOString(),
      }));

    if (recordsToCreate.length === 0) {
      return { success: true, recordsCreated: 0 };
    }

    const { error: insertError } = await supabase
      .from('training_records')
      .insert(recordsToCreate);

    if (insertError) throw insertError;

    return { success: true, recordsCreated: recordsToCreate.length };
  } catch (error) {
    return { 
      success: false, 
      recordsCreated: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
