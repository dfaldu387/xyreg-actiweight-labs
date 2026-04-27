import { supabase } from '@/integrations/supabase/client';
import { showNoCreditDialog } from '@/context/AiCreditContext';
import type {
  ProcessValidationRationale,
  SupplierCriticalityRationale,
  ValidationRationaleContext,
  SupplierRationaleContext,
  GenerateRationaleResponse,
} from '@/types/riskBasedRationale';

// Generate document ID using database function
export async function generateDocumentId(
  prefix: 'RBR-ENG' | 'RBR-SUP',
  companyId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_rbr_document_id', {
    prefix,
    p_company_id: companyId,
  });

  if (error) {
    console.error('Error generating document ID:', error);
    // Fallback to timestamp-based ID
    return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  }

  return data;
}

// Call AI to generate rationale - supports all RBR types
export async function generateRationale(
  type: 'validation' | 'supplier' | 'sample_size' | 'design_change' | 'capa_priority' | 'pathway' | 'clinical' | 'software' | 'training',
  context: any, // Accept any context - validated by edge function
  companyId: string
): Promise<GenerateRationaleResponse> {
  const { data, error } = await supabase.functions.invoke('generate-qmsr-rationale', {
    body: { type, context, companyId },
  });

  if (error) {
    console.error('Error generating rationale:', error);
    throw new Error(error.message || 'Failed to generate rationale');
  }

  if (data?.error === 'NO_CREDITS') {
    showNoCreditDialog();
    throw new Error('NO_CREDITS');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to generate rationale');
  }

  return data.data;
}

// Process Validation Rationales CRUD
export async function createProcessValidationRationale(
  rationale: Omit<ProcessValidationRationale, 'id' | 'created_at' | 'updated_at'>
): Promise<ProcessValidationRationale> {
  // Use type assertion since database types aren't updated yet
  const { data, error } = await (supabase
    .from('process_validation_rationales' as any)
    .insert([rationale])
    .select()
    .single()) as { data: ProcessValidationRationale | null; error: any };

  if (error) {
    console.error('Error creating validation rationale:', error);
    throw new Error(error.message || 'Failed to create validation rationale');
  }

  return data as ProcessValidationRationale;
}

export async function getProcessValidationRationales(
  companyId: string,
  productId?: string
): Promise<ProcessValidationRationale[]> {
  let query = (supabase
    .from('process_validation_rationales' as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })) as any;

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching validation rationales:', error);
    throw new Error(error.message || 'Failed to fetch validation rationales');
  }

  return (data || []) as ProcessValidationRationale[];
}

export async function updateProcessValidationRationale(
  id: string,
  updates: Partial<ProcessValidationRationale>
): Promise<ProcessValidationRationale> {
  const { data, error } = await (supabase
    .from('process_validation_rationales' as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()) as { data: ProcessValidationRationale | null; error: any };

  if (error) {
    console.error('Error updating validation rationale:', error);
    throw new Error(error.message || 'Failed to update validation rationale');
  }

  return data as ProcessValidationRationale;
}

export async function deleteProcessValidationRationale(id: string): Promise<void> {
  const { error } = await (supabase
    .from('process_validation_rationales' as any)
    .delete()
    .eq('id', id)) as { error: any };

  if (error) {
    console.error('Error deleting validation rationale:', error);
    throw new Error(error.message || 'Failed to delete validation rationale');
  }
}

// Supplier Criticality Rationales CRUD
export async function createSupplierCriticalityRationale(
  rationale: Omit<SupplierCriticalityRationale, 'id' | 'created_at' | 'updated_at'>
): Promise<SupplierCriticalityRationale> {
  const { data, error } = await (supabase
    .from('supplier_criticality_rationales' as any)
    .insert([rationale])
    .select()
    .single()) as { data: SupplierCriticalityRationale | null; error: any };

  if (error) {
    console.error('Error creating supplier rationale:', error);
    throw new Error(error.message || 'Failed to create supplier rationale');
  }

  return data as SupplierCriticalityRationale;
}

export async function getSupplierCriticalityRationales(
  companyId: string,
  supplierId?: string
): Promise<SupplierCriticalityRationale[]> {
  let query = (supabase
    .from('supplier_criticality_rationales' as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })) as any;

  if (supplierId) {
    query = query.eq('supplier_id', supplierId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching supplier rationales:', error);
    throw new Error(error.message || 'Failed to fetch supplier rationales');
  }

  return (data || []) as SupplierCriticalityRationale[];
}

export async function getSupplierCriticalityRationale(
  supplierId: string
): Promise<SupplierCriticalityRationale | null> {
  const { data, error } = await (supabase
    .from('supplier_criticality_rationales' as any)
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: SupplierCriticalityRationale | null; error: any };

  if (error) {
    console.error('Error fetching supplier rationale:', error);
    return null;
  }

  return data;
}

export async function updateSupplierCriticalityRationale(
  id: string,
  updates: Partial<SupplierCriticalityRationale>
): Promise<SupplierCriticalityRationale> {
  const { data, error } = await (supabase
    .from('supplier_criticality_rationales' as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()) as { data: SupplierCriticalityRationale | null; error: any };

  if (error) {
    console.error('Error updating supplier rationale:', error);
    throw new Error(error.message || 'Failed to update supplier rationale');
  }

  return data as SupplierCriticalityRationale;
}

export async function deleteSupplierCriticalityRationale(id: string): Promise<void> {
  const { error } = await (supabase
    .from('supplier_criticality_rationales' as any)
    .delete()
    .eq('id', id)) as { error: any };

  if (error) {
    console.error('Error deleting supplier rationale:', error);
    throw new Error(error.message || 'Failed to delete supplier rationale');
  }
}
