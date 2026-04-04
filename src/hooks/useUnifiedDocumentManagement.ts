import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DocumentSyncService } from "@/services/documentSyncService";
import { toast } from "sonner";

export interface UnifiedDocument {
  id: string;
  name: string;
  document_type: string;
  status: string;
  tech_applicability: string;
  phase_id?: string;
  phase_name?: string;
  source: 'phase_assigned' | 'company_template' | 'both';
  is_synced: boolean;
  created_at: string;
  updated_at: string;
}

export function useUnifiedDocumentManagement(companyId: string | undefined) {
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<UnifiedDocument[]>([]);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  const fetchUnifiedDocuments = async () => {
    if (!companyId) {
      // console.log("No company ID provided, setting loading to false");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // console.log("Starting fetchUnifiedDocuments for company:", companyId);

      // Resolve company ID if it's a name
      let actualCompanyId = companyId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
      
      if (!isUUID) {
        // console.log("Resolving company name to ID:", companyId);
        const decodedCompanyName = decodeURIComponent(companyId);
        // console.log("Decoded company name:", decodedCompanyName);
        
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('name', decodedCompanyName)
          .maybeSingle();
          
        if (companyError) {
          console.error('Error resolving company ID:', companyError);
          toast.error('Failed to resolve company information');
          setIsLoading(false);
          return;
        }
        
        if (!companyData) {
          console.error('Company not found:', decodedCompanyName);
          toast.error('Company not found');
          setIsLoading(false);
          return;
        }
        
        actualCompanyId = companyData.id;
        // console.log("Resolved company ID:", actualCompanyId);
      }

      // First, get all phases for this company
      // console.log("Fetching phases for company:", actualCompanyId);
      const { data: companyPhases, error: phasesError } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', actualCompanyId);

      if (phasesError) {
        console.error("Error fetching company phases:", phasesError);
        toast.error("Failed to load company phases");
        setIsLoading(false);
        return;
      }

      // console.log("Found phases:", companyPhases);

      if (!companyPhases || companyPhases.length === 0) {
        // console.log("No phases found for company");
        setDocuments([]);
        setIsLoading(false);
        return;
      }

      const phaseIds = companyPhases.map(p => p.id);
      const phaseNameMap = new Map(companyPhases.map(p => [p.id, p.name]));

      // Get phase assigned documents with simpler query
      // console.log("Fetching phase assigned documents for phase IDs:", phaseIds);
      const { data: phaseDocuments, error: phaseError } = await supabase
        .from('phase_assigned_documents')
        .select('*')
        .in('phase_id', phaseIds)
        .eq('document_scope', 'company_template');

      if (phaseError) {
        console.error("Error fetching phase documents:", phaseError);
        toast.error("Failed to load phase documents");
        setIsLoading(false);
        return;
      }

      // console.log("Found phase documents:", phaseDocuments);

      // Get company template documents
      // console.log("Fetching company template documents for company:", actualCompanyId);
      const { data: templateDocuments, error: templateError } = await supabase
        .from('company_document_templates')
        .select('*')
        .eq('company_id', actualCompanyId);

      if (templateError) {
        console.error("Error fetching template documents:", templateError);
        toast.error("Failed to load template documents");
        setIsLoading(false);
        return;
      }

      // console.log("Found template documents:", templateDocuments);

      // Merge and deduplicate documents
      const documentMap = new Map<string, UnifiedDocument>();

      // Add phase documents
      (phaseDocuments || []).forEach(doc => {
        const phaseName = phaseNameMap.get(doc.phase_id) || 'Unknown Phase';
        const key = `${doc.name}_${doc.phase_id}`;
        // console.log("Processing phase document:", doc.name, "in phase:", phaseName);
        
        documentMap.set(key, {
          id: doc.id,
          name: doc.name,
          document_type: doc.document_type || 'Standard',
          status: doc.status || 'Not Started',
          tech_applicability: doc.tech_applicability || 'All device types',
          phase_id: doc.phase_id,
          phase_name: phaseName,
          source: 'phase_assigned',
          is_synced: false, // Will be updated below if matched with template
          created_at: doc.created_at,
          updated_at: doc.updated_at
        });
      });

      // Check which documents are synced with templates and add template-only documents
      (templateDocuments || []).forEach(template => {
        // console.log("Processing template document:", template.name);
        
        // Find matching phase documents
        const matchingPhaseKeys = Array.from(documentMap.keys()).filter(key => {
          const doc = documentMap.get(key);
          return doc && doc.name === template.name;
        });

        if (matchingPhaseKeys.length > 0) {
          // Update existing documents to show they're synced
          // console.log("Found matching phase documents for template:", template.name);
          matchingPhaseKeys.forEach(key => {
            const doc = documentMap.get(key);
            if (doc) {
              documentMap.set(key, {
                ...doc,
                source: 'both',
                is_synced: true
              });
            }
          });
        } else {
          // Add template-only document
          // console.log("Adding template-only document:", template.name);
          documentMap.set(`template_${template.id}`, {
            id: template.id,
            name: template.name,
            document_type: template.document_type || 'Standard',
            status: 'Not Started', // Templates don't have status
            tech_applicability: template.tech_applicability || 'All device types',
            source: 'company_template',
            is_synced: false,
            created_at: template.created_at,
            updated_at: template.updated_at
          });
        }
      });

      const unifiedDocuments = Array.from(documentMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      // console.log(`Final unified documents (${unifiedDocuments.length}):`, unifiedDocuments);
      setDocuments(unifiedDocuments);

      // Get sync status
      // console.log("Getting sync status for company:", actualCompanyId);
      const status = await DocumentSyncService.getDocumentSyncStatus(actualCompanyId);
      // console.log("Sync status:", status);
      setSyncStatus(status);

    } catch (error) {
      console.error("Error in fetchUnifiedDocuments:", error);
      toast.error("Failed to load unified documents");
    } finally {
      setIsLoading(false);
    }
  };

  const createDocument = async (
    phaseName: string,
    documentName: string,
    documentType: string = 'Standard'
  ): Promise<boolean> => {
    if (!companyId) return false;

    try {
      // Resolve company ID
      let actualCompanyId = companyId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
      
      if (!isUUID) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('id')
          .eq('name', decodeURIComponent(companyId))
          .single();
        actualCompanyId = companyData?.id || companyId;
      }

      // Find phase ID
      const { data: phaseData, error: phaseError } = await supabase
        .from('phases')
        .select('id')
        .eq('company_id', actualCompanyId)
        .eq('name', phaseName)
        .single();

      if (phaseError || !phaseData) {
        toast.error("Phase not found");
        return false;
      }

      // Create document with sync
      const result = await DocumentSyncService.createDocumentWithSync(
        phaseData.id,
        documentName,
        documentType
      );

      if (result.success) {
        toast.success("Document created and synced successfully");
        await fetchUnifiedDocuments(); // Refresh data
        return true;
      } else {
        toast.error(result.message || "Failed to create document");
        return false;
      }

    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to create document");
      return false;
    }
  };

  const syncAllDocuments = async (): Promise<boolean> => {
    try {
      // console.log("Starting syncAllDocuments");
      const results = await DocumentSyncService.migrateExistingDocuments();
      const totalMigrated = results.reduce((sum, result) => sum + result.documents_migrated, 0);
      
      if (totalMigrated > 0) {
        toast.success(`Synced ${totalMigrated} documents`);
      } else {
        toast.info("All documents are already synced");
      }
      
      await fetchUnifiedDocuments(); // Refresh data
      return true;
    } catch (error) {
      console.error("Error syncing documents:", error);
      toast.error("Failed to sync documents");
      return false;
    }
  };

  useEffect(() => {
    // console.log("useEffect triggered with companyId:", companyId);
    fetchUnifiedDocuments();
  }, [companyId]);

  return {
    isLoading,
    documents,
    syncStatus,
    createDocument,
    syncAllDocuments,
    refreshDocuments: fetchUnifiedDocuments
  };
}
