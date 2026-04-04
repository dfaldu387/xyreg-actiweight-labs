import { supabase } from "@/integrations/supabase/client";
import { CompanyAudit, ProductAudit, AuditDocument, AuditMetadata, AuditStatus } from "@/types/audit";
import { toast } from "sonner";
import { syncAuditToGapStatus } from "@/utils/statusSyncUtils";

// Company Audit Services
export const fetchCompanyAudits = async (companyId: string): Promise<CompanyAudit[]> => {
  try {
    const { data, error } = await supabase
      .from('company_audits')
      .select('*')
      .eq('company_id', companyId)
      .order('deadline_date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Ensure the status is one of the valid AuditStatus types
    return (data || []).map(audit => ({
      ...audit,
      status: audit.status as AuditStatus
    }));
  } catch (error) {
    toast.error('Failed to load company audits');
    return [];
  }
};

export const createCompanyAudit = async (audit: Omit<CompanyAudit, 'id' | 'created_at' | 'updated_at'>): Promise<CompanyAudit | null> => {
  try {
    // Validate required fields
    if (!audit.company_id) {
      throw new Error('Company ID is required');
    }
    if (!audit.audit_name) {
      throw new Error('Audit name is required');
    }
    if (!audit.audit_type) {
      throw new Error('Audit type is required');
    }

    const { data, error } = await supabase
      .from('company_audits')
      .insert(audit)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    toast.success('Audit created successfully');
    return {
      ...data,
      status: data.status as AuditStatus
    };
  } catch (error) {
    toast.error(`Failed to create audit: ${error.message}`);
    return null;
  }
};

export const updateCompanyAudit = async (id: string, updates: Partial<CompanyAudit>): Promise<CompanyAudit | null> => {
  try {
    const { data, error } = await supabase
      .from('company_audits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // If status was updated, sync with related gap items
    if (updates.status) {
      await syncAuditToGapStatus(id, 'company', updates.status);
    }
    
    toast.success('Audit updated successfully');
    return {
      ...data,
      status: data.status as AuditStatus
    };
  } catch (error) {
    toast.error('Failed to update audit');
    return null;
  }
};

export const deleteCompanyAudit = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('company_audits')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    toast.success('Audit deleted successfully');
    return true;
  } catch (error) {
    toast.error('Failed to delete audit');
    return false;
  }
};

// Product Audit Services
export const fetchProductAudits = async (productId: string): Promise<ProductAudit[]> => {
  try {
    
    const { data, error } = await supabase
      .from('product_audits')
      .select('*')
      .eq('product_id', productId)
      .order('deadline_date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return (data || []).map(audit => ({
      ...audit,
      status: audit.status as AuditStatus
    }));
  } catch (error) {
    toast.error('Failed to load product audits');
    return [];
  }
};

export const createProductAudit = async (audit: Omit<ProductAudit, 'id' | 'created_at' | 'updated_at'>): Promise<ProductAudit | null> => {
  try {
    
    
    // Validate required fields
    if (!audit.product_id) {
      throw new Error('Product ID is required');
    }
    if (!audit.audit_name) {
      throw new Error('Audit name is required');
    }
    if (!audit.audit_type) {
      throw new Error('Audit type is required');
    }

    const auditData = { ...audit };
    if (auditData.phase_id) {
      const { data: lifecyclePhase, error: lifecycleError } = await supabase
        .from('lifecycle_phases')
        .select('id, phase_id')
        .eq('id', auditData.phase_id)
        .eq('product_id', auditData.product_id)
        .maybeSingle();
      
      if (lifecycleError || !lifecyclePhase) {
        delete auditData.phase_id;
      } else if (lifecyclePhase.phase_id) {
        auditData.phase_id = lifecyclePhase.phase_id;
        
        const { data: companyPhaseCheck, error: companyPhaseError } = await supabase
          .from('company_phases')
          .select('id')
          .eq('id', auditData.phase_id)
          .maybeSingle();
        
        if (companyPhaseError || !companyPhaseCheck) {
          delete auditData.phase_id;
        }
      } else {
        delete auditData.phase_id;
      }
    }

    const { data, error } = await supabase
      .from('product_audits')
      .insert(auditData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    toast.success('Audit created successfully');
    return {
      ...data,
      status: data.status as AuditStatus
    };
  } catch (error) {
    toast.error(`Failed to create audit: ${error.message}`);
    return null;
  }
};

export const updateProductAudit = async (id: string, updates: Partial<ProductAudit>): Promise<ProductAudit | null> => {
  try {
    const { data, error } = await supabase
      .from('product_audits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // If status was updated, sync with related gap items
    if (updates.status) {
      await syncAuditToGapStatus(id, 'product', updates.status);
    }
    
    toast.success('Audit updated successfully');
    return {
      ...data,
      status: data.status as AuditStatus
    };
  } catch (error) {
    toast.error('Failed to update audit');
    return null;
  }
};

export const deleteProductAudit = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('product_audits')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    toast.success('Audit deleted successfully');
    return true;
  } catch (error) {
    toast.error('Failed to delete audit');
    return false;
  }
};

// New functions to link audits with documents and gap items
export const linkAuditToDocument = async (
  auditId: string, 
  auditType: 'product' | 'company',
  documentId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('audit_documents')
      .insert({
        audit_id: auditId,
        document_id: documentId,
        audit_type: auditType
      });
      
    if (error) {
      throw error;
    }
    
    toast.success('Document linked to audit');
    return true;
  } catch (error) {
    toast.error('Failed to link document to audit');
    return false;
  }
};

export const linkAuditToGapItem = async (
  auditId: string,
  auditType: 'product' | 'company',
  gapItemId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('gap_audit_links')
      .insert({
        audit_id: auditId,
        gap_item_id: gapItemId,
        audit_type: auditType
      });
      
    if (error) {
      // Check if it's a unique constraint violation (already linked)
      if (error.code === '23505') {
        return true;
      }
      throw error;
    }
    
    toast.success('Gap item linked to audit');
    return true;
  } catch (error) {
    toast.error('Failed to link gap item to audit');
    return false;
  }
};

/**
 * Fetches audit metadata
 */
export const fetchAuditMetadata = async (auditType?: string): Promise<AuditMetadata[]> => {
  try {
    let query = supabase
      .from('audit_types_metadata')
      .select('*');
    
    if (auditType) {
      query = query.eq('audit_type', auditType);
    }
    
    const { data, error } = await query;
      
    if (error) {
      throw error;
    }
    
    return data as AuditMetadata[];
  } catch (error) {
    toast.error('Failed to load audit metadata');
    return [];
  }
};

/**
 * Gets documents for audit
 */
export const getDocumentsForAudit = async (
  auditId: string, 
  auditType: 'product' | 'company'
): Promise<AuditDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('audit_documents')
      .select('*, documents(*)')
      .eq('audit_id', auditId)
      .eq('audit_type', auditType);
      
    if (error) {
      throw error;
    }
    
    // Transform the data to match the AuditDocument type
    // Ensure audit_type is explicitly cast to the union type 'product' | 'company'
    return data.map(item => ({
      audit_id: item.audit_id || '',
      document_id: item.document_id || '',
      audit_type: item.audit_type as 'product' | 'company',
      id: item.documents?.id,
      name: item.documents?.name,
      status: item.documents?.status,
      type: item.documents?.document_type,
      dueDate: item.documents?.due_date,
      description: item.documents?.description,
      created_at: item.created_at || item.documents?.created_at || '',
      updated_at: item.updated_at || item.documents?.updated_at || '',
      inserted_at: item.documents?.inserted_at,
      product_id: item.documents?.product_id,
      phase_id: item.documents?.phase_id,
      company_id: item.documents?.company_id,
      document_type: item.documents?.document_type,
      due_date: item.documents?.due_date
    }));
  } catch {
    return [];
  }
};
