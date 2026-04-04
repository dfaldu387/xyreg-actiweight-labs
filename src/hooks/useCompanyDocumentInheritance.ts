
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCompanyDocumentInheritance(productId: string | undefined, companyId: string | undefined, currentPhase: string | null) {
  const [isInheriting, setIsInheriting] = useState(false);
  const [lastInheritance, setLastInheritance] = useState<Date | null>(null);

  const inheritCompanyDocuments = async (forceRefresh = false) => {
    if (!productId || !companyId || !currentPhase) {
      console.log("Missing required data for inheritance:", { productId, companyId, currentPhase });
      return { success: false, inherited: 0 };
    }

    setIsInheriting(true);
    try {
      console.log(`Starting document inheritance for product ${productId}, phase: ${currentPhase}`);
      
      // 1. Find the company phase that matches the current lifecycle phase
      const { data: companyPhase, error: phaseError } = await supabase
        .from('phases')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', currentPhase)
        .single();

      if (phaseError || !companyPhase) {
        console.error("Company phase not found:", phaseError);
        return { success: false, inherited: 0, error: "Company phase not found" };
      }

      console.log(`Found company phase ID: ${companyPhase.id}`);

      // 2. Get all documents assigned to this company phase
      const { data: companyDocuments, error: docsError } = await supabase
        .from('phase_assigned_documents')
        .select('*')
        .eq('phase_id', companyPhase.id);

      if (docsError) {
        console.error("Error fetching company documents:", docsError);
        return { success: false, inherited: 0, error: "Failed to fetch company documents" };
      }

      console.log(`Found ${companyDocuments?.length || 0} company documents for phase ${currentPhase}`);

      if (!companyDocuments || companyDocuments.length === 0) {
        return { success: true, inherited: 0 };
      }

      // 3. Get the product's lifecycle phase - THIS IS THE KEY FIX
      const { data: productPhase, error: productPhaseError } = await supabase
        .from('lifecycle_phases')
        .select('id')
        .eq('product_id', productId)
        .eq('name', currentPhase)
        .single();

      if (productPhaseError || !productPhase) {
        console.error("Product lifecycle phase not found:", productPhaseError);
        return { success: false, inherited: 0, error: "Product lifecycle phase not found" };
      }

      console.log(`Found product lifecycle phase ID: ${productPhase.id}`);

      // 4. Get existing product documents for this phase
      const { data: existingDocs, error: existingError } = await supabase
        .from('documents')
        .select('name')
        .eq('product_id', productId)
        .eq('phase_id', productPhase.id);

      if (existingError) {
        console.error("Error fetching existing documents:", existingError);
        return { success: false, inherited: 0, error: "Failed to fetch existing documents" };
      }

      const existingDocNames = new Set((existingDocs || []).map(doc => doc.name));
      console.log(`Found ${existingDocNames.size} existing product documents`);

      // 5. Filter out documents that already exist
      const documentsToInherit = companyDocuments.filter(doc => 
        !existingDocNames.has(doc.name) || forceRefresh
      );

      console.log(`Will inherit ${documentsToInherit.length} documents`);

      if (documentsToInherit.length === 0) {
        return { success: true, inherited: 0 };
      }

      // 6. If force refresh, delete existing documents first
      if (forceRefresh) {
        const { error: deleteError } = await supabase
          .from('documents')
          .delete()
          .eq('product_id', productId)
          .eq('phase_id', productPhase.id);

        if (deleteError) {
          console.error("Error deleting existing documents:", deleteError);
        } else {
          console.log("Deleted existing documents for force refresh");
        }
      }

      // 7. Create product documents based on company documents - USING CORRECT PHASE ID
      const documentsToCreate = documentsToInherit.map(companyDoc => ({
        product_id: productId,
        company_id: companyId,
        phase_id: productPhase.id, // Use the product's lifecycle phase ID, not company phase ID
        name: companyDoc.name,
        status: companyDoc.status || 'Not Started',
        document_type: companyDoc.document_type || 'Standard',
        description: `Inherited from company phase: ${currentPhase}`
      }));

      const { error: insertError } = await supabase
        .from('documents')
        .insert(documentsToCreate);

      if (insertError) {
        console.error("Error inserting inherited documents:", insertError);
        return { success: false, inherited: 0, error: "Failed to inherit documents" };
      }

      console.log(`Successfully inherited ${documentsToCreate.length} documents`);
      setLastInheritance(new Date());
      
      return { success: true, inherited: documentsToCreate.length };

    } catch (error) {
      console.error("Error in document inheritance:", error);
      return { success: false, inherited: 0, error: error instanceof Error ? error.message : "Unknown error" };
    } finally {
      setIsInheriting(false);
    }
  };

  // Auto-inherit on mount and when dependencies change
  useEffect(() => {
    if (productId && companyId && currentPhase) {
      inheritCompanyDocuments();
    }
  }, [productId, companyId, currentPhase]);

  const manualSync = async () => {
    console.log("Manual sync triggered");
    const result = await inheritCompanyDocuments(true);
    
    if (result.success) {
      if (result.inherited > 0) {
        toast.success(`Successfully inherited ${result.inherited} documents from company settings`);
      } else {
        toast.info("All company documents are already up to date");
      }
    } else {
      toast.error(`Failed to sync documents: ${result.error || 'Unknown error'}`);
    }
    
    return result;
  };

  return {
    inheritCompanyDocuments,
    manualSync,
    isInheriting,
    lastInheritance
  };
}
