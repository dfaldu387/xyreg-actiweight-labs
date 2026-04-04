import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentTemplate } from '@/types/documentComposer';

export class DocumentTemplatePersistenceService {
  /**
   * Save document template changes to the database
   */
  static async saveTemplateChanges(
    templateId: string,
    template: DocumentTemplate,
    companyId: string
  ): Promise<boolean> {
    try {
      // console.log('Saving template changes:', { templateId, companyId });
      
      // For non-UUID template IDs (like "change-control"), we'll save to localStorage only
      // and create a user-specific template entry
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(templateId);
      
      if (!isValidUUID) {
        // console.log('Non-UUID template ID, saving to localStorage only:', templateId);
        this.saveTemplateToLocalStorage(templateId, template);
        return true; // Return success for localStorage save
      }
      
      // For UUID template IDs, try to save to database
      const { data: existingTemplate, error: fetchError } = await supabase
        .from('company_document_templates')
        .select('id, structure')
        .eq('id', templateId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching template:', fetchError);
        // Fallback to localStorage
        this.saveTemplateToLocalStorage(templateId, template);
        return true;
      }

      if (existingTemplate) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('company_document_templates')
          .update({
            structure: JSON.parse(JSON.stringify(template)),
            updated_at: new Date().toISOString()
          })
          .eq('id', templateId)
          .eq('company_id', companyId);

        if (updateError) {
          console.error('Error updating template:', updateError);
          // Fallback to localStorage
          this.saveTemplateToLocalStorage(templateId, template);
          return true;
        }

        // console.log('Template updated successfully');
        return true;
      } else {
        // Create new template if it doesn't exist
        const { error: insertError } = await supabase
          .from('company_document_templates')
          .insert({
            id: templateId,
            company_id: companyId,
            name: template.name,
            document_type: template.type,
            description: (template as any).metadata?.description || template.name || '',
            structure: JSON.parse(JSON.stringify(template)),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating template:', insertError);
          // Fallback to localStorage
          this.saveTemplateToLocalStorage(templateId, template);
          return true;
        }

        // console.log('Template created successfully');
        return true;
      }
    } catch (error) {
      console.error('Error saving template changes:', error);
      // Always fallback to localStorage
      this.saveTemplateToLocalStorage(templateId, template);
      return true;
    }
  }

  /**
   * Save template changes to localStorage as backup
   */
  static saveTemplateToLocalStorage(templateId: string, template: DocumentTemplate): void {
    try {
      const documentData = {
        template,
        savedAt: new Date().toISOString(),
        id: templateId
      };
      localStorage.setItem(`document_template_${templateId}`, JSON.stringify(documentData));
      // console.log('Template saved to localStorage:', templateId);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Load template from localStorage as fallback
   */
  static loadTemplateFromLocalStorage(templateId: string): DocumentTemplate | null {
    try {
      const savedData = localStorage.getItem(`document_template_${templateId}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // console.log('Template loaded from localStorage:', templateId);
        return parsed.template;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  }

  /**
   * Auto-save template changes with debouncing
   */
  static debouncedSave = (() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (templateId: string, template: DocumentTemplate, companyId: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        await this.saveTemplateChanges(templateId, template, companyId);
        this.saveTemplateToLocalStorage(templateId, template);
      }, 2000); // Auto-save after 2 seconds of inactivity
    };
  })();

  /**
   * Save individual content item changes
   */
  static async saveContentChange(
    templateId: string,
    contentId: string,
    newContent: string,
    companyId: string,
    fullTemplate: DocumentTemplate
  ): Promise<boolean> {
    try {
      // Update the template with the new content
      const updatedTemplate = {
        ...fullTemplate,
        sections: fullTemplate.sections.map(section => ({
          ...section,
          content: section.content.map(contentItem => 
            contentItem.id === contentId 
              ? { ...contentItem, content: newContent }
              : contentItem
          )
        }))
      };

      // Save to database
      const success = await this.saveTemplateChanges(templateId, updatedTemplate, companyId);
      
      if (success) {
        // Also save to localStorage as backup
        this.saveTemplateToLocalStorage(templateId, updatedTemplate);
      }
      
      return success;
    } catch (error) {
      console.error('Error saving content change:', error);
      toast.error('Failed to save content change');
      return false;
    }
  }
}
