
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isValidUuid } from "@/utils/companyIdResolver";

/**
 * Unified service for document updates that handles all document types gracefully
 * This service determines the best update strategy based on document properties
 */
export class UnifiedDocumentUpdateService {
  private productId: string;
  private companyId: string;

  constructor(productId: string, companyId: string) {
    // Validate that we have proper UUIDs
    if (!isValidUuid(productId)) {
      throw new Error(`Invalid product ID format: ${productId}`);
    }
    if (!isValidUuid(companyId)) {
      throw new Error(`Invalid company ID format: ${companyId}`);
    }

    this.productId = productId;
    this.companyId = companyId;
    
    console.log('[UnifiedDocumentUpdateService] Initialized with:', {
      productId: this.productId,
      companyId: this.companyId
    });
  }

  /**
   * Update document status with fallback strategies
   * If status is "Approved", also set approval_date to current timestamp
   */
  async updateDocumentStatus(documentId: string, status: string): Promise<boolean> {
    console.log(`[UnifiedDocumentUpdateService] Updating document ${documentId} status to ${status}`);
    console.log(`[UnifiedDocumentUpdateService] Using productId: ${this.productId}, companyId: ${this.companyId}`);

    try {
      // First, get the document to understand its type - use maybeSingle() to avoid errors
      const { data: document, error: fetchError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .maybeSingle();

      if (fetchError) {
        console.error("[UnifiedDocumentUpdateService] Database error:", fetchError);
        toast.error("Database error occurred");
        return false;
      }

      if (!document) {
        console.error("[UnifiedDocumentUpdateService] Document not found:", documentId);
        toast.error("Document not found");
        return false;
      }

      console.log("[UnifiedDocumentUpdateService] Document details:", {
        id: document.id,
        name: document.name,
        template_source_id: document.template_source_id,
        document_scope: document.document_scope,
        product_id: document.product_id,
        company_id: document.company_id
      });

      // Build updates object
      const updates: any = { status };

      // Set approval_date when status changes to Approved
      if (status.toLowerCase() === 'approved') {
        updates.approval_date = new Date().toISOString();
      }

      // Strategy 1: Direct update with ownership validation
      const success = await this.performDirectUpdate(document, updates);

      if (success) {
        console.log("[UnifiedDocumentUpdateService] Status update successful");
        toast.success(`Document status updated to ${status}`);
        return true;
      }

      return false;

    } catch (error) {
      console.error("[UnifiedDocumentUpdateService] Error updating document status:", error);
      toast.error("Failed to update document status");
      return false;
    }
  }

  /**
   * Update document deadline with fallback strategies
   */
  async updateDocumentDeadline(documentId: string, deadline: Date | undefined): Promise<boolean> {
    console.log(`[UnifiedDocumentUpdateService] Updating document ${documentId} deadline`);

    try {
      // Get the document to understand its type - use maybeSingle() to avoid errors
      const { data: document, error: fetchError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .maybeSingle();

      if (fetchError) {
        console.error("[UnifiedDocumentUpdateService] Database error:", fetchError);
        toast.error("Database error occurred");
        return false;
      }

      if (!document) {
        console.error("[UnifiedDocumentUpdateService] Document not found:", documentId);
        toast.error("Document not found");
        return false;
      }

      // Strategy 1: Direct update with ownership validation
      const success = await this.performDirectUpdate(document, { 
        due_date: deadline?.toISOString() 
      });
      
      if (success) {
        console.log("[UnifiedDocumentUpdateService] Deadline update successful");
        toast.success(deadline ? "Document deadline updated" : "Document deadline removed");
        return true;
      }

      return false;

    } catch (error) {
      console.error("[UnifiedDocumentUpdateService] Error updating document deadline:", error);
      toast.error("Failed to update document deadline");
      return false;
    }
  }

  /**
   * Perform direct database update with ownership validation
   */
  private async performDirectUpdate(document: any, updates: any): Promise<boolean> {
    console.log("[UnifiedDocumentUpdateService] Performing direct update with ownership validation");

    // Validate ownership based on document type
    if (!this.validateDocumentOwnership(document)) {
      console.error("[UnifiedDocumentUpdateService] Document ownership validation failed");
      console.error("[UnifiedDocumentUpdateService] Expected companyId:", this.companyId);
      console.error("[UnifiedDocumentUpdateService] Expected productId:", this.productId);
      console.error("[UnifiedDocumentUpdateService] Document companyId:", document.company_id);
      console.error("[UnifiedDocumentUpdateService] Document productId:", document.product_id);
      toast.error("You don't have permission to update this document");
      return false;
    }

    // Perform the update
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", document.id);

    if (updateError) {
      console.error("[UnifiedDocumentUpdateService] Direct update failed:", updateError);
      toast.error(`Update failed: ${updateError.message}`);
      return false;
    }

    console.log("[UnifiedDocumentUpdateService] Direct update successful");
    return true;
  }

  /**
   * Validate document ownership based on document properties
   */
  private validateDocumentOwnership(document: any): boolean {
    console.log("[UnifiedDocumentUpdateService] Validating document ownership", {
      documentProductId: document.product_id,
      documentCompanyId: document.company_id,
      expectedProductId: this.productId,
      expectedCompanyId: this.companyId,
      documentScope: document.document_scope
    });

    // For product documents, must belong to our product
    if (document.product_id && document.product_id !== this.productId) {
      console.log("[UnifiedDocumentUpdateService] Product ID mismatch");
      return false;
    }

    // For company documents, must belong to our company
    if (document.company_id && document.company_id !== this.companyId) {
      console.log("[UnifiedDocumentUpdateService] Company ID mismatch");
      return false;
    }

    // If it's a product document but we don't have a product context, reject
    if (document.document_scope === 'product_document' && !this.productId) {
      console.log("[UnifiedDocumentUpdateService] Product document without product context");
      return false;
    }

    console.log("[UnifiedDocumentUpdateService] Ownership validation passed");
    return true;
  }

  /**
   * Get document type for debugging
   */
  getDocumentType(document: any): string {
    if (document.template_source_id && document.document_scope === 'product_document') {
      return 'template-instance';
    } else if (!document.template_source_id && document.document_scope === 'product_document') {
      return 'product-specific';
    } else if (document.document_scope === 'company_template') {
      return 'company-template';
    } else {
      return 'unknown';
    }
  }
}
