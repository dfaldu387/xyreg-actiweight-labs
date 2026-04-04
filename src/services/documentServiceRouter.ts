
  import { supabase } from "@/integrations/supabase/client";
  import { TemplateInstanceDocumentService } from "./templateInstanceDocumentService";
  import { UnifiedDocumentUpdateService } from "./unifiedDocumentUpdateService";
  import { toast } from "sonner";

  /**
   * Service router that determines which document service to use based on document type
   */
  export class DocumentServiceRouter {
    private productId: string;
    private companyId: string;

    constructor(productId: string, companyId: string) {
      this.productId = productId;
      this.companyId = companyId;
    }

    /**
     * Get the appropriate service for a specific document
     */
    private async getServiceForDocument(documentId: string): Promise<{
      service: 'template-instance' | 'unified';
      document: any;
    } | null> {
      try {
        console.log("[DocumentServiceRouter] Determining service for document:", documentId);
        const cleanDocumentId = documentId.replace("template-", "");
        if (documentId.startsWith('template-')) {
          const { data: templateDocument, error: templateError } = await supabase
            .from("phase_assigned_document_template")
            .select("*")
            .eq("id", cleanDocumentId)
            .maybeSingle();
          if (templateError) {
            console.error("[DocumentServiceRouter] Database error:", templateError);
            return null;
          }
          if (templateDocument) {
            return { service: 'template-instance', document: templateDocument };
          }
          else {
            return { service: 'unified', document: null };
          }
        }
        // Fetch document to determine type
        const { data: document, error: fetchError } = await supabase
          .from("documents")
          .select("*")
          .eq("id", cleanDocumentId)
          .maybeSingle();

        if (fetchError) {
          console.error("[DocumentServiceRouter] Database error:", fetchError);
          toast.error("Database error occurred");
          return null;
        }

        if (!document) {
          console.error("[DocumentServiceRouter] Document not found:", documentId);
          toast.error("Document not found");
          return null;
        }

        console.log("[DocumentServiceRouter] Document analysis:", {
          id: document.id,
          name: document.name,
          template_source_id: document.template_source_id,
          document_scope: document.document_scope,
          product_id: document.product_id,
          company_id: document.company_id
        });

        // Determine service based on document properties
        if (document.template_source_id &&
          document.document_scope === 'product_document' &&
          document.product_id === this.productId) {
          console.log("[DocumentServiceRouter] Using template-instance service");
          return { service: 'template-instance', document };
        } else {
          console.log("[DocumentServiceRouter] Using unified service");
          return { service: 'unified', document };
        }
      } catch (error) {
        console.error("[DocumentServiceRouter] Error determining service:", error);
        toast.error("Failed to determine document service");
        return null;
      }
    }

    /**
     * Update document status using the appropriate service
     */
    async updateDocumentStatus(documentId: string, status: string): Promise<boolean> {
      console.log("[DocumentServiceRouter] Routing status update for document:", documentId, "to status:", status);
      const cleanDocumentId = documentId.replace("template-", "");
      const serviceInfo = await this.getServiceForDocument(documentId);
      console.log("serviceInfo", serviceInfo);
      if (!serviceInfo) {
        return false;
      }

      try {
        if (serviceInfo.service === 'template-instance') {
          const service = new TemplateInstanceDocumentService(this.productId, this.companyId);
          return await service.updateStatus(documentId, status);
        } else {
          const service = new UnifiedDocumentUpdateService(this.productId, this.companyId);
          return await service.updateDocumentStatus(cleanDocumentId, status);
        }
      } catch (error) {
        console.error("[DocumentServiceRouter] Error in status update:", error);
        toast.error("Failed to update document status");
        return false;
      }
    }

    /**
     * Update document deadline using the appropriate service
     */
    async updateDocumentDeadline(documentId: string, deadline: Date | undefined): Promise<boolean> {
      console.log("[DocumentServiceRouter] Routing deadline update for document:", documentId);

      const serviceInfo = await this.getServiceForDocument(documentId);
      if (!serviceInfo) {
        return false;
      }

      try {
        if (serviceInfo.service === 'template-instance') {
          const service = new TemplateInstanceDocumentService(this.productId, this.companyId);
          return await service.updateDeadline(documentId, deadline);
        } else {
          const service = new UnifiedDocumentUpdateService(this.productId, this.companyId);
          return await service.updateDocumentDeadline(documentId, deadline);
        }
      } catch (error) {
        console.error("[DocumentServiceRouter] Error in deadline update:", error);
        toast.error("Failed to update document deadline");
        return false;
      }
    }

    /**
     * Update document reviewers using the appropriate service
     */
    async updateDocumentReviewers(documentId: string, reviewers: any[]): Promise<boolean> {
      console.log("[DocumentServiceRouter] Routing reviewers update for document:", documentId);

      const serviceInfo = await this.getServiceForDocument(documentId);
      if (!serviceInfo) {
        return false;
      }

      try {
        if (serviceInfo.service === 'template-instance') {
          const service = new TemplateInstanceDocumentService(this.productId, this.companyId);
          return await service.updateReviewers(documentId, reviewers);
        } else {
          // For non-template instances, use unified service with direct update
          const service = new UnifiedDocumentUpdateService(this.productId, this.companyId);
          return await service.updateDocumentStatus(documentId, serviceInfo.document.status || 'Not Started');
        }
      } catch (error) {
        console.error("[DocumentServiceRouter] Error in reviewers update:", error);
        toast.error("Failed to update document reviewers");
        return false;
      }
    }
  }
