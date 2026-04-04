
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TemplateInstantiationService } from "./templateInstantiationService";

/**
 * Utility to clean and validate document IDs
 */
const cleanDocumentId = (id: string): string => {
  // Validate UUID format directly - no prefix cleaning needed anymore
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error(`Invalid UUID format: ${id}`);
  }
  
  return id;
};

/**
 * Service for managing product-specific document operations with strict isolation
 */
export class ProductDocumentService {
  private productId: string;
  private companyId: string;
  private templateService: TemplateInstantiationService;

  constructor(productId: string, companyId: string) {
    this.productId = productId;
    this.companyId = companyId;
    this.templateService = new TemplateInstantiationService(productId, companyId);
  }

  /**
   * Update document status with automatic template instantiation
   */
  async updateDocumentStatus(documentId: string, status: string): Promise<boolean> {
    try {
      // Clean the document ID
      const cleanId = cleanDocumentId(documentId);

      // First, get the document to check if it's a template
      const { data: document, error: fetchError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", cleanId)
        .single();

      if (fetchError || !document) {
        console.error("Document not found:", fetchError);
        toast.error("Document not found");
        return false;
      }

      // Check if this is a company template that needs instantiation
      if (TemplateInstantiationService.isTemplate(document)) {
        console.log("Document is company template, creating instance for status update");
        const instance = await this.templateService.findOrCreateProductInstance(document);
        if (!instance) {
          toast.error("Failed to create document instance");
          return false;
        }
        // Update the instance instead
        return this.updateDocumentStatus(instance.id, status);
      }

      // Verify the document belongs to this product
      if (document.product_id !== this.productId) {
        console.error("Document doesn't belong to this product");
        toast.error("Document access denied");
        return false;
      }

      // Update with double verification
      const { error: updateError } = await supabase
        .from("documents")
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq("id", cleanId)
        .eq("product_id", this.productId);

      if (updateError) {
        console.error("Error updating document status:", updateError);
        toast.error("Failed to update document status");
        return false;
      }

      console.log(`Document ${document.name} status updated to ${status} for product ${this.productId}`);
      toast.success("Document status updated successfully");
      return true;
    } catch (error) {
      console.error("Error in updateDocumentStatus:", error);
      toast.error("Failed to update document status");
      return false;
    }
  }

  /**
   * Update document deadline with automatic template instantiation
   */
  async updateDocumentDeadline(documentId: string, deadline: Date | undefined): Promise<boolean> {
    try {
      // Clean the document ID
      const cleanId = cleanDocumentId(documentId);

      // First, get the document to check if it's a template
      const { data: document, error: fetchError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", cleanId)
        .single();

      if (fetchError || !document) {
        console.error("Document not found:", fetchError);
        toast.error("Document not found");
        return false;
      }

      // Check if this is a company template that needs instantiation
      if (TemplateInstantiationService.isTemplate(document)) {
        console.log("Document is company template, creating instance for deadline update");
        const instance = await this.templateService.findOrCreateProductInstance(document);
        if (!instance) {
          toast.error("Failed to create document instance");
          return false;
        }
        // Update the instance instead
        return this.updateDocumentDeadline(instance.id, deadline);
      }

      // Verify document ownership
      if (document.product_id !== this.productId) {
        console.error("Document doesn't belong to this product");
        toast.error("Document access denied");
        return false;
      }

      // Update with product verification
      const { error: updateError } = await supabase
        .from("documents")
        .update({ 
          due_date: deadline?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", cleanId)
        .eq("product_id", this.productId);

      if (updateError) {
        console.error("Error updating document deadline:", updateError);
        toast.error("Failed to update document deadline");
        return false;
      }

      console.log(`Document ${document.name} deadline updated for product ${this.productId}`);
      toast.success(deadline ? "Document deadline updated" : "Document deadline removed");
      return true;
    } catch (error) {
      console.error("Error in updateDocumentDeadline:", error);
      toast.error("Failed to update document deadline");
      return false;
    }
  }

  /**
   * Get or create a product document instance for editing
   */
  async getOrCreateDocumentInstance(documentId: string): Promise<any | null> {
    try {
      // Clean the document ID
      const cleanId = cleanDocumentId(documentId);

      // Get the document
      const { data: document, error: fetchError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", cleanId)
        .single();

      if (fetchError || !document) {
        console.error("Document not found:", fetchError);
        return null;
      }

      // Check if this is a company template that needs instantiation
      if (TemplateInstantiationService.isTemplate(document)) {
        console.log("Document is company template, creating instance for editing");
        return await this.templateService.findOrCreateProductInstance(document);
      }

      // Return existing product document
      return document;
    } catch (error) {
      console.error("Error in getOrCreateDocumentInstance:", error);
      toast.error("Failed to get or create document instance");
      return null;
    }
  }

  /**
   * Verify document belongs to this product
   */
  async verifyDocumentOwnership(documentId: string): Promise<boolean> {
    try {
      // Clean the document ID
      const cleanId = cleanDocumentId(documentId);

      const { data, error } = await supabase
        .from("documents")
        .select("id")
        .eq("id", cleanId)
        .eq("product_id", this.productId)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error("Error verifying document ownership:", error);
      return false;
    }
  }
}
