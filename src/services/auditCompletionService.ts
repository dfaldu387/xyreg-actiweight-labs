import { supabase } from "@/integrations/supabase/client";
import { 
  AuditFinding, 
  AuditRecommendation, 
  AuditCompletionDocument,
  AuditCompletionData 
} from "@/types/auditCompletion";
import { toast } from "sonner";

// Audit Findings Services
export const fetchAuditFindings = async (auditId: string, auditType: 'company' | 'product'): Promise<AuditFinding[]> => {
  try {
    const { data, error } = await supabase
      .from('audit_findings')
      .select('*')
      .eq('audit_id', auditId)
      .eq('audit_type', auditType)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      audit_type: auditType // Ensure correct type
    })) as AuditFinding[];
  } catch (error) {
    console.error('Error fetching audit findings:', error);
    toast.error('Failed to load audit findings');
    return [];
  }
};

export const createAuditFinding = async (finding: Omit<AuditFinding, 'id' | 'created_at' | 'updated_at'>): Promise<AuditFinding | null> => {
  try {
    const { data, error } = await supabase
      .from('audit_findings')
      .insert(finding)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      audit_type: finding.audit_type
    } as AuditFinding;
  } catch (error) {
    console.error('Error creating audit finding:', error);
    toast.error('Failed to create audit finding');
    return null;
  }
};

export const updateAuditFinding = async (id: string, updates: Partial<AuditFinding>): Promise<AuditFinding | null> => {
  try {
    const { data, error } = await supabase
      .from('audit_findings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      audit_type: updates.audit_type || data.audit_type
    } as AuditFinding;
  } catch (error) {
    console.error('Error updating audit finding:', error);
    toast.error('Failed to update audit finding');
    return null;
  }
};

export const deleteAuditFinding = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('audit_findings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting audit finding:', error);
    toast.error('Failed to delete audit finding');
    return false;
  }
};

// Audit Recommendations Services
export const fetchAuditRecommendations = async (auditId: string, auditType: 'company' | 'product'): Promise<AuditRecommendation[]> => {
  try {
    const { data, error } = await supabase
      .from('audit_recommendations')
      .select('*')
      .eq('audit_id', auditId)
      .eq('audit_type', auditType)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      audit_type: auditType
    })) as AuditRecommendation[];
  } catch (error) {
    console.error('Error fetching audit recommendations:', error);
    toast.error('Failed to load audit recommendations');
    return [];
  }
};

export const createAuditRecommendation = async (recommendation: Omit<AuditRecommendation, 'id' | 'created_at' | 'updated_at'>): Promise<AuditRecommendation | null> => {
  try {
    const { data, error } = await supabase
      .from('audit_recommendations')
      .insert(recommendation)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      audit_type: recommendation.audit_type
    } as AuditRecommendation;
  } catch (error) {
    console.error('Error creating audit recommendation:', error);
    toast.error('Failed to create audit recommendation');
    return null;
  }
};

export const updateAuditRecommendation = async (id: string, updates: Partial<AuditRecommendation>): Promise<AuditRecommendation | null> => {
  try {
    const { data, error } = await supabase
      .from('audit_recommendations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      audit_type: updates.audit_type || data.audit_type
    } as AuditRecommendation;
  } catch (error) {
    console.error('Error updating audit recommendation:', error);
    toast.error('Failed to update audit recommendation');
    return null;
  }
};

export const deleteAuditRecommendation = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('audit_recommendations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting audit recommendation:', error);
    toast.error('Failed to delete audit recommendation');
    return false;
  }
};

// Audit Completion Documents Services
export const fetchAuditCompletionDocuments = async (auditId: string, auditType: 'company' | 'product'): Promise<AuditCompletionDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('audit_completion_documents')
      .select('*')
      .eq('audit_id', auditId)
      .eq('audit_type', auditType)
      .order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      audit_type: auditType
    })) as AuditCompletionDocument[];
  } catch (error) {
    console.error('Error fetching audit completion documents:', error);
    toast.error('Failed to load audit documents');
    return [];
  }
};

export const uploadAuditDocument = async (
  file: File, 
  auditId: string, 
  auditType: 'company' | 'product',
  description?: string
): Promise<AuditCompletionDocument | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${auditId}_${Date.now()}.${fileExt}`;
    const filePath = `${auditType}/${auditId}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('audit-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Create database record
    const documentData = {
      audit_id: auditId,
      audit_type: auditType,
      file_name: file.name,
      storage_path: filePath,
      description: description,
      document_type: 'Evidence'
    };

    const { data, error } = await supabase
      .from('audit_completion_documents')
      .insert(documentData)
      .select()
      .single();

    if (error) throw error;
    toast.success('Document uploaded successfully');
    return {
      ...data,
      audit_type: auditType
    } as AuditCompletionDocument;
  } catch (error) {
    console.error('Error uploading audit document:', error);
    toast.error('Failed to upload document');
    return null;
  }
};

export const deleteAuditDocument = async (id: string, storagePath: string): Promise<boolean> => {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('audit-documents')
      .remove([storagePath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error } = await supabase
      .from('audit_completion_documents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    toast.success('Document deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting audit document:', error);
    toast.error('Failed to delete document');
    return false;
  }
};

// Get document download URL
export const getDocumentDownloadUrl = async (storagePath: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('audit-documents')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting document download URL:', error);
    return null;
  }
};

// Fetch all completion data for an audit
export const fetchAuditCompletionData = async (auditId: string, auditType: 'company' | 'product'): Promise<AuditCompletionData> => {
  try {
    const [findings, recommendations, documents] = await Promise.all([
      fetchAuditFindings(auditId, auditType),
      fetchAuditRecommendations(auditId, auditType),
      fetchAuditCompletionDocuments(auditId, auditType)
    ]);

    return {
      findings,
      recommendations,
      documents
    };
  } catch (error) {
    console.error('Error fetching audit completion data:', error);
    return {
      findings: [],
      recommendations: [],
      documents: []
    };
  }
};
