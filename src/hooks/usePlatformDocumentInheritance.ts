import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePlatformDocumentInheritance() {
  const [isInheriting, setIsInheriting] = useState(false);

  const inheritPlatformDocuments = async (
    productId: string, 
    platformName: string, 
    companyId: string
  ) => {
    if (!productId || !platformName || !companyId) {
      console.log("Missing required data for platform inheritance:", { productId, platformName, companyId });
      return { success: false, inherited: 0 };
    }

    setIsInheriting(true);
    try {
      console.log(`Starting platform document inheritance for product ${productId}, platform: ${platformName}`);
      
      // 1. Find platform products that match the platform name
      const { data: platformProducts, error: platformError } = await supabase
        .from('products')
        .select('id')
        .eq('company_id', companyId)
        .eq('product_platform', platformName)
        .eq('is_archived', false);

      if (platformError) {
        console.error("Error finding platform products:", platformError);
        return { success: false, inherited: 0, error: "Failed to find platform products" };
      }

      if (!platformProducts || platformProducts.length === 0) {
        console.log("No platform products found");
        return { success: true, inherited: 0 };
      }

      // 2. Get platform documents from the first platform product (master)
      const masterPlatformProductId = platformProducts[0].id;
      const { data: platformDocuments, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('product_id', masterPlatformProductId)
        .in('document_type', ['Platform Core', 'Architecture', 'Risk Management Platform']);

      if (docsError) {
        console.error("Error fetching platform documents:", docsError);
        return { success: false, inherited: 0, error: "Failed to fetch platform documents" };
      }

      console.log(`Found ${platformDocuments?.length || 0} platform documents to inherit`);

      if (!platformDocuments || platformDocuments.length === 0) {
        return { success: true, inherited: 0 };
      }

      // 3. Get existing product documents to avoid duplicates
      const { data: existingDocs, error: existingError } = await supabase
        .from('documents')
        .select('name, document_type')
        .eq('product_id', productId);

      if (existingError) {
        console.error("Error fetching existing documents:", existingError);
        return { success: false, inherited: 0, error: "Failed to fetch existing documents" };
      }

      const existingDocKeys = new Set(
        (existingDocs || []).map(doc => `${doc.name}_${doc.document_type}`)
      );

      // 4. Filter documents to inherit (only new ones)
      const documentsToInherit = platformDocuments.filter(doc => 
        !existingDocKeys.has(`${doc.name}_${doc.document_type}`)
      );

      console.log(`Will inherit ${documentsToInherit.length} new platform documents`);

      if (documentsToInherit.length === 0) {
        return { success: true, inherited: 0 };
      }

      // 5. Create inherited documents with platform references
      const documentsToCreate = documentsToInherit.map(platformDoc => ({
        product_id: productId,
        company_id: companyId,
        phase_id: platformDoc.phase_id,
        name: `${platformDoc.name} (Platform: ${platformName})`,
        status: 'Inherited',
        document_type: platformDoc.document_type,
        description: `Inherited from platform: ${platformName}`,
        document_scope: 'product_document' as const,
        version: '1.0',
        file_name: platformDoc.file_name,
        file_path: platformDoc.file_path,
        file_size: platformDoc.file_size
      }));

      const { error: insertError } = await supabase
        .from('documents')
        .insert(documentsToCreate);

      if (insertError) {
        console.error("Error inserting inherited platform documents:", insertError);
        return { success: false, inherited: 0, error: "Failed to inherit platform documents" };
      }

      console.log(`Successfully inherited ${documentsToCreate.length} platform documents`);
      
      return { success: true, inherited: documentsToCreate.length };

    } catch (error) {
      console.error("Error in platform document inheritance:", error);
      return { success: false, inherited: 0, error: error instanceof Error ? error.message : "Unknown error" };
    } finally {
      setIsInheriting(false);
    }
  };

  return {
    inheritPlatformDocuments,
    isInheriting
  };
}