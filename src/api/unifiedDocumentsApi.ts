
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuditTrailService } from "@/services/auditTrailService";

/**
 * Unified API for document operations using the consolidated documents table
 */

export const fetchPhaseDocuments = async (phaseId: string, companyId: string) => {
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('phase_id', phaseId)
    .eq('company_id', companyId)
    .eq('document_scope', 'company_template')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return { data: data || [] };
};

export const addPhaseDocument = async (phaseId: string, companyId: string, documentName: string) => {
  if (!documentName.trim()) return false;

  const { error } = await supabase
    .from('documents')
    .upsert({
      phase_id: phaseId,
      company_id: companyId,
      name: documentName.trim(),
      status: 'In Review',
      document_type: 'Standard',
      document_scope: 'company_template'
    }, { 
      onConflict: 'name,phase_id,company_id,document_scope'
    });

  if (error) {
    toast.error(`Failed to add document: ${error.message}`);
    return false;
  }
  
  toast.success('Document added successfully');
  return true;
};

export const removePhaseDocument = async (documentId: string) => {
  // Capture document info before deletion for audit trail
  const { data: docData } = await supabase
    .from('documents')
    .select('name, company_id')
    .eq('id', documentId)
    .maybeSingle();

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;

  // Log deletion to audit trail
  const { data: { user } } = await supabase.auth.getUser();
  if (user && docData?.company_id) {
    await AuditTrailService.logDocumentRecordEvent({
      userId: user.id,
      companyId: docData.company_id,
      action: 'document_deleted',
      entityType: 'document',
      entityId: documentId,
      entityName: docData.name || 'Unknown document',
    });
  }

  toast.success('Document removed successfully');
};

export const updateDocumentStatus = async (documentId: string, status: string) => {
  // Capture old status for audit trail
  const { data: docData } = await supabase
    .from('documents')
    .select('name, status, company_id')
    .eq('id', documentId)
    .maybeSingle();

  const { error } = await supabase
    .from('documents')
    .update({ status: status })
    .eq('id', documentId);

  if (error) {
    toast.error('Failed to update document status');
    throw error;
  }

  // Log status change to audit trail
  const { data: { user } } = await supabase.auth.getUser();
  if (user && docData?.company_id) {
    await AuditTrailService.logDocumentRecordEvent({
      userId: user.id,
      companyId: docData.company_id,
      action: 'document_status_changed',
      entityType: 'document',
      entityId: documentId,
      entityName: docData.name || 'Unknown document',
      changes: [{ field: 'status', oldValue: docData.status || 'Unknown', newValue: status }],
    });
  }

  toast.success(`Document marked as ${status}`);
  return true;
};

export const updateDocumentDeadline = async (documentId: string, deadline: Date | null) => {
  // Capture old deadline for audit trail
  const { data: docData } = await supabase
    .from('documents')
    .select('name, due_date, company_id')
    .eq('id', documentId)
    .maybeSingle();

  const { error } = await supabase
    .from('documents')
    .update({
      due_date: deadline ? deadline.toISOString().split('T')[0] : null
    })
    .eq('id', documentId);

  if (error) {
    toast.error('Failed to update document deadline');
    throw error;
  }

  // Log deadline change to audit trail
  const { data: { user } } = await supabase.auth.getUser();
  if (user && docData?.company_id) {
    await AuditTrailService.logDocumentRecordEvent({
      userId: user.id,
      companyId: docData.company_id,
      action: 'document_updated',
      entityType: 'document',
      entityId: documentId,
      entityName: docData.name || 'Unknown document',
      changes: [{
        field: 'due_date',
        oldValue: docData.due_date || 'None',
        newValue: deadline ? deadline.toISOString().split('T')[0] : 'None',
      }],
    });
  }

  toast.success(deadline ? 'Document deadline updated' : 'Document deadline removed');
  return true;
};

export const toggleDocumentExclusion = async (documentId: string, isExcluded: boolean, reason?: string) => {
  const { error } = await supabase
    .from('documents')
    .update({ 
      is_excluded: isExcluded,
      exclusion_reason: isExcluded ? reason : null,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', documentId);

  if (error) {
    toast.error('Failed to update document exclusion');
    return false;
  }
  
  toast.success(`Document ${isExcluded ? 'excluded' : 'included'} successfully`);
  return true;
};

export const fetchCompanyTemplateDocuments = async (companyId: string, phaseId?: string) => {
  try {
    // Create base filters
    const filters = {
      company_id: companyId,
      document_scope: 'company_template',
      is_excluded: false
    };

    // Add phase filter if provided
    const queryFilters = phaseId ? { ...filters, phase_id: phaseId } : filters;

    // Execute query with explicit type to avoid inference issues
    const result = await supabase
      .from('documents')
      .select('*')
      .match(queryFilters)
      .order('position');

    if (result.error) {
      throw result.error;
    }

    return result.data || [];
  } catch (error) {
    throw error;
  }
};
