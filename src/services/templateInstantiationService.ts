
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TemplateDocument {
  id: string;
  name: string;
  description?: string;
  document_type?: string;
  status?: string;
  phase_name?: string;
  phase_id?: string;
  isTemplate?: boolean;
  document_scope?: string;
  tech_applicability?: string;
}

export interface ProductDocumentInstance {
  id: string;
  name: string;
  description?: string;
  document_type: string;
  status: string;
  product_id: string;
  company_id: string;
  phase_id?: string;
  document_scope: string;
  template_source_id?: string;
  created_at: string;
  updated_at: string;
}

export class TemplateInstantiationService {
  private productId: string;
  private companyId: string;

  constructor(productId: string, companyId: string) {
    this.productId = productId;
    this.companyId = companyId;
  }

  /**
   * Check if a document instance already exists for a template
   */
  async findExistingInstance(templateDoc: TemplateDocument): Promise<ProductDocumentInstance | null> {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("product_id", this.productId)
        .eq("name", templateDoc.name)
        .eq("document_scope", "product_document")
        .maybeSingle();

      if (error) {
        console.error("Error finding existing instance:", error);
        return null;
      }

      return data as ProductDocumentInstance;
    } catch (error) {
      console.error("Error in findExistingInstance:", error);
      return null;
    }
  }

  /**
   * Create a product-specific instance from a company template
   */
  async instantiateTemplate(templateDoc: TemplateDocument): Promise<ProductDocumentInstance | null> {
    try {
      console.log("Creating product instance from template:", templateDoc.name);

      // Check if instance already exists
      const existingInstance = await this.findExistingInstance(templateDoc);
      if (existingInstance) {
        console.log("Instance already exists:", existingInstance.id);
        return existingInstance;
      }

      // Get phase end date for due date assignment
      let phaseDueDate = null;
      if (templateDoc.phase_id) {
        try {
          const { data: phaseData } = await supabase
            .from('lifecycle_phases')
            .select('end_date')
            .eq('id', templateDoc.phase_id)
            .single();
          
          phaseDueDate = phaseData?.end_date || null;
        } catch (error) {
          console.warn('Could not fetch phase end date for due date assignment:', error);
        }
      }

      // Create new product document instance
      const newInstance = {
        name: templateDoc.name,
        description: templateDoc.description || `Product instance of ${templateDoc.name}`,
        document_type: templateDoc.document_type || 'Standard',
        status: 'Not Started', // Start with clean status
        product_id: this.productId,
        company_id: this.companyId,
        phase_id: templateDoc.phase_id,
        document_scope: 'product_document' as const,
        tech_applicability: templateDoc.tech_applicability || 'All device types',
        template_source_id: templateDoc.id, // Link back to original template
        due_date: phaseDueDate,
        milestone_due_date: phaseDueDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("documents")
        .insert(newInstance)
        .select()
        .single();

      if (error) {
        console.error("Error creating product instance:", error);
        toast.error("Failed to create document instance");
        return null;
      }

      console.log("Successfully created product instance:", data.id);
      toast.success(`Created product instance: ${templateDoc.name}`);
      
      return data as ProductDocumentInstance;
    } catch (error) {
      console.error("Error in instantiateTemplate:", error);
      toast.error("Failed to create document instance");
      return null;
    }
  }

  /**
   * Find or create a product instance for a template
   */
  async findOrCreateProductInstance(templateDoc: TemplateDocument): Promise<ProductDocumentInstance | null> {
    // First try to find existing instance
    const existingInstance = await this.findExistingInstance(templateDoc);
    if (existingInstance) {
      return existingInstance;
    }

    // Create new instance if none exists
    return await this.instantiateTemplate(templateDoc);
  }

  /**
   * Enhanced template detection using database fields
   */
  static isTemplate(document: any): boolean {
    // Primary check: document_scope field
    if (document.document_scope === 'company_template') {
      return true;
    }
    
    // Secondary checks for UI-added flags
    if (document.isTemplate === true || document.isCompanyTemplate === true) {
      return true;
    }
    
    // If no product_id, it's likely a company-level template
    if (!document.product_id) {
      return true;
    }
    
    return false;
  }

  /**
   * Batch instantiate multiple templates
   */
  async batchInstantiate(templateDocs: TemplateDocument[]): Promise<ProductDocumentInstance[]> {
    const instances: ProductDocumentInstance[] = [];
    
    for (const template of templateDocs) {
      const instance = await this.findOrCreateProductInstance(template);
      if (instance) {
        instances.push(instance);
      }
    }
    
    return instances;
  }
}
