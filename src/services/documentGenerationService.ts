import { DocumentTemplate, DocumentContent, DocumentSection } from '@/types/documentComposer';
import { supabase } from '@/integrations/supabase/client';
import { AIContentRecommendationService } from './aiContentRecommendationService';
import { AIChangeTrackingService } from './aiChangeTrackingService';
import { AISuggestionService } from './aiSuggestionService';
import { showNoCreditDialog } from '@/context/AiCreditContext';

interface DocumentGenerationRequest {
  template: DocumentTemplate;
  companyId: string;
  additionalContext?: string;
}

export interface DocumentGenerationResponse {
  success: boolean;
  updatedTemplate?: DocumentTemplate;
  smartData?: any;
  aiGeneratedSuggestions?: Array<{
    contentId: string;
    originalContent: string;
    suggestedContent: string;
  }>;
  error?: string;
}

export class DocumentGenerationService {
  /**
   * Get AI providers configured for the company
   */
  static async getCompanyAIProviders(companyId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('Error fetching company AI providers:', error);
        return [];
      }

      // Mock AI providers for now - in real implementation, check company settings
      return [{ provider: 'openai', configured: true }];
    } catch (error) {
      console.error('Error fetching AI providers:', error);
      return [];
    }
  }

  /**
   * Generate a complete smart document with inline AI suggestions
   */
  static async generateSmartDocumentWithSuggestions(
    templateId: string,
    companyId: string,
    productId?: string
  ): Promise<DocumentGenerationResponse> {
    // Clear previous suggestions
    AISuggestionService.clearSuggestions();
    
    const result = await this.generateSmartDocument(templateId, companyId, productId);
    
    if (result.success && result.updatedTemplate) {
      const aiGeneratedSuggestions: Array<{
        contentId: string;
        originalContent: string;
        suggestedContent: string;
      }> = [];
      
      // Convert AI-generated content to suggestions instead of direct replacement
      const changes = AIChangeTrackingService.getAllChanges();
      const updatedSections = result.updatedTemplate.sections.map(section => ({
        ...section,
        content: section.content.map(content => {
          // Check if this content has AI-generated changes tracked
          const compoundId = `${section.id}-${content.id}`;
          const change = changes.get(compoundId) || changes.get(content.id);
          
          if (change && change.changeType === 'ai-generated') {
            // Create suggestion from tracked AI change
            AISuggestionService.createSuggestion(
              content.id,
              change.originalContent,
              change.modifiedContent
            );

            aiGeneratedSuggestions.push({
              contentId: content.id,
              originalContent: change.originalContent,
              suggestedContent: change.modifiedContent
            });

            // Return the original content so suggestions display inline
            return {
              ...content,
              content: change.originalContent,
              metadata: {
                ...content.metadata,
                aiUsed: false // Clear AI flag since we're now showing a suggestion
              }
            };
          }
          return content;
        })
      }));
      
      return {
        ...result,
        updatedTemplate: {
          ...result.updatedTemplate,
          sections: updatedSections
        },
        aiGeneratedSuggestions
      };
    }
    
    return result;
  }

  /**
   * Generate smart template with automated company data integration
   */
  static async generateSmartDocument(templateId: string, companyId: string, productId?: string): Promise<DocumentGenerationResponse> {
    try {
      console.log('[DocumentGeneration] Starting automated smart document generation:', { templateId, companyId, productId });
      
      // First, try to get the base template
      const { SmartTemplateService } = await import('./smartTemplateService');
      const { HardcodedTemplateService } = await import('./hardcodedTemplateService');
      const { AutomatedTemplatePopulationService } = await import('./automatedTemplatePopulationService');
      
      let baseTemplate = null;
      
      // Try SmartTemplateService first
      const smartResult = await SmartTemplateService.generateSmartTemplate(templateId, companyId, productId);
      if (smartResult) {
        baseTemplate = smartResult.template;
        console.log('[DocumentGeneration] Using SmartTemplateService result');
      }
      
      // Fallback to hardcoded templates
      if (!baseTemplate) {
        const hardcodedTemplate = HardcodedTemplateService.getTemplate(templateId);
        if (hardcodedTemplate) {
          baseTemplate = hardcodedTemplate.template;
          console.log('[DocumentGeneration] Using hardcoded template:', hardcodedTemplate.name);
        }
      }
      
      if (!baseTemplate) {
        console.error('[DocumentGeneration] No template found for ID:', templateId);
        return {
          success: false,
          error: 'Template not found'
        };
      }
      
      console.log('[DocumentGeneration] Successfully got base template:', baseTemplate.name);
      
      // Step 2: Populate template with automated data
      const populatedTemplate = await AutomatedTemplatePopulationService.autoPopulateTemplate(
        baseTemplate,
        companyId,
        productId
      );
      
      console.log('[DocumentGeneration] Template populated successfully');
      
      return {
        success: true,
        updatedTemplate: populatedTemplate.template || baseTemplate,
        smartData: {
          completionPercentage: 85,
          missingDataIndicators: [],
          suggestions: ['Document populated with available data']
        }
      };
      
    } catch (error) {
      console.error('[DocumentGeneration] Error generating smart document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate document content using AI with comprehensive context
   */
  static async generateDocument(request: DocumentGenerationRequest): Promise<DocumentGenerationResponse> {
    try {
      console.log('Starting AI-powered document generation:', {
        templateName: request.template.name,
        companyId: request.companyId,
        sectionsCount: request.template.sections?.length || 0
      });

      // Check if AI providers are configured
      const aiProviders = await this.getCompanyAIProviders(request.companyId);
      if (aiProviders.length === 0) {
        return {
          success: false,
          error: 'No AI providers configured. Please configure at least one AI service in company settings to generate documents.'
        };
      }

      // Extract product ID if available from template context
      const productId = request.template.productContext?.id;

      // Call the AI-powered generation service
      const { data, error } = await supabase.functions.invoke('ai-document-generator', {
        body: {
          template: request.template,
          companyId: request.companyId,
          productId: productId,
          additionalContext: request.additionalContext
        }
      });

      if (error) {
        console.error('AI document generation error:', error);
        return {
          success: false,
          error: error.message || 'AI-powered document generation failed'
        };
      }

      if (data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        return { success: false, error: 'NO_CREDITS' };
      }

      if (!data || !data.template) {
        console.error('Invalid response from AI document generator:', data);
        return {
          success: false,
          error: data.error || 'AI-powered document generation failed'
        };
      }

      console.log('AI-powered document generation completed successfully');
      console.log('Generation metadata:', data.metadata);
      
      return {
        success: true,
        updatedTemplate: data.template,
        smartData: {
          populatedFields: data.metadata?.contextUsed ? Object.keys(data.metadata.contextUsed) : [],
          missingDataIndicators: data.metadata?.missingDataIndicators || [],
          suggestions: ['AI-powered generation used comprehensive company context', 'Content generated with regulatory compliance focus'],
          completionPercentage: data.metadata?.qualityMetrics?.dataCompletenessScore || 85
        }
      };
    } catch (error) {
      console.error('AI document generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during AI generation'
      };
    }
  }
}