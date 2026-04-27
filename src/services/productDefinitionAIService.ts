import { supabase } from '@/integrations/supabase/client';
import * as mammoth from 'mammoth';
import { toast } from 'sonner';
import { showNoCreditDialog } from '@/context/AiCreditContext';

export interface DocumentUploadRequest {
  file: File;
  companyId: string;
}

export interface FieldSuggestionRequest {
  documentText: string;
  fieldType: 'intended_use' | 'intended_function' | 'mode_of_action' | 'patient_population' | 'intended_user' | 'contraindications' | 'warnings_precautions' | 'clinical_benefits';
  companyId: string;
  existingValue?: string;
}

export interface FieldSuggestion {
  fieldType: string;
  suggestion: string;
  confidence: number;
  reasoning: string;
}

// Device context for AI suggestions with richer information
export interface DeviceContext {
  productName: string;
  deviceCategory?: string;
  deviceDescription?: string;
  emdnCode?: string;
  emdnDescription?: string;
  primaryRegulatoryType?: string;
  coreDeviceNature?: string;
  keyFeatures?: string[];
  isActiveDevice?: boolean;
  deviceCharacteristics?: {
    isImplantable?: boolean;
    isSoftwareMobileApp?: boolean;
    isSoftwareAsaMedicalDevice?: boolean;
    isInVitroDiagnostic?: boolean;
    containsHumanAnimalMaterial?: boolean;
    incorporatesMedicinalSubstance?: boolean;
  };
}

// Helper function to validate if there's enough context for meaningful AI suggestions
export function hasMinimumContext(context?: DeviceContext): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  if (!context) {
    return { valid: false, missingFields: ['Device Information'] };
  }

  // Check available descriptive fields
  const hasDescription = !!context.deviceDescription?.trim() && context.deviceDescription.trim().length > 10;
  const hasEMDN = !!context.emdnCode?.trim() || !!context.emdnDescription?.trim();
  const hasFeatures = context.keyFeatures && context.keyFeatures.length > 0;
  const hasRegulatoryType = !!context.primaryRegulatoryType?.trim();
  const hasCoreNature = !!context.coreDeviceNature?.trim();
  const hasDeviceChars = context.deviceCharacteristics && Object.values(context.deviceCharacteristics).some(v => v === true);

  const genericCategories = ['new device', 'device', 'product', 'new product', 'untitled'];
  const categoryValue = context.deviceCategory?.toLowerCase().trim() || '';
  const hasMeaningfulCategory = !!context.deviceCategory?.trim() &&
    !genericCategories.some(g => categoryValue === g || categoryValue.startsWith(g + ' ('));

  const genericNames = ['new device', 'untitled', 'my device', 'current medical device', 'new product', 'device'];
  const nameValue = context.productName?.toLowerCase().trim() || '';
  const hasMeaningfulName = !!context.productName?.trim() &&
    !genericNames.includes(nameValue) &&
    !/^device\s*\d*$/i.test(nameValue);

  const hasAnyMeaningfulContext = hasMeaningfulName || hasDescription || hasEMDN ||
    hasMeaningfulCategory || hasFeatures || hasRegulatoryType || hasCoreNature || hasDeviceChars;

  if (!hasAnyMeaningfulContext) {
    if (!hasMeaningfulName) missingFields.push('Product Name');
    if (!hasMeaningfulCategory && !hasDescription) {
      missingFields.push('Device Category');
      missingFields.push('Description');
    }
    if (!hasEMDN) missingFields.push('EMDN Code');
  }

  return { valid: missingFields.length === 0, missingFields };
}

export interface ProductDefinitionAIResponse {
  success: boolean;
  suggestions?: FieldSuggestion[];
  extracted_text?: string;
  metadata?: {
    ai_provider: string;
    confidence_score: number;
    generatedAt: string;
  };
  error?: string;
}

// --- Helper: call edge function ---

async function callVertexAISuggestion(
  prompt: string,
  companyId: string,
  inlineData?: { mimeType: string; data: string }
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('vertex-ai-suggestion', {
    body: { prompt, companyId, inlineData },
  });

  if (error) throw new Error(error.message || 'Edge function error');
  if (!data?.success) {
    if (data?.error === 'NO_CREDITS') {
      showNoCreditDialog();
      throw new Error('NO_CREDITS');
    }
    throw new Error(data?.error || 'AI returned no content');
  }
  return data.text;
}

export class ProductDefinitionAIService {
  /**
   * Check if Google Vertex AI key is configured for a company
   */
  static async checkGeminiKeyStatus(companyId: string): Promise<{
    hasKey: boolean;
    companyId: string;
    companyName?: string;
    error?: string;
    keyDetails?: {
      encryptedKeyLength: number;
      decryptedKeyLength: number;
      decryptedKeyPrefix: string;
      isValidFormat: boolean;
    };
  }> {
    try {
      if (!companyId) {
        return { hasKey: false, companyId: '', error: 'No company ID provided' };
      }

      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      const { data, error } = await supabase
        .from('company_api_keys')
        .select('id, key_type, encrypted_key')
        .eq('company_id', companyId)
        .eq('key_type', 'google_vertex')
        .maybeSingle();

      if (error) {
        return { hasKey: false, companyId, companyName: companyData?.name, error: error.message };
      }

      if (!data) {
        return { hasKey: false, companyId, companyName: companyData?.name };
      }

      return {
        hasKey: true,
        companyId,
        companyName: companyData?.name,
        keyDetails: {
          encryptedKeyLength: data.encrypted_key?.length || 0,
          decryptedKeyLength: 0,
          decryptedKeyPrefix: '****',
          isValidFormat: true,
        }
      };
    } catch (error) {
      return {
        hasKey: false,
        companyId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert file to base64 string
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract text from different file types
   */
  private static async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;

    if (fileType === 'text/plain') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }

    if (fileType === 'application/pdf') {
      return '';
    }

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (error) {
            reject(new Error('Failed to extract text from DOCX file.'));
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    if (fileType === 'application/msword') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          const cleanText = text
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (cleanText.length < 50) {
            reject(new Error('Legacy DOC files have limited text extraction. Please convert to DOCX or PDF.'));
          } else {
            resolve(cleanText);
          }
        };
        reader.onerror = reject;
        reader.readAsText(file, 'utf-8');
      });
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  }

  /**
   * Extract text from document using Vertex AI
   */
  static async uploadAndExtractDocument(
    request: DocumentUploadRequest
  ): Promise<ProductDefinitionAIResponse> {
    try {
      const fileType = request.file.type;
      let extractedText: string;

      if (fileType === 'application/pdf') {
        const base64Data = await this.fileToBase64(request.file);
        extractedText = await callVertexAISuggestion(
          "Extract and summarize all text content from this PDF document for EUDAMED (European Database on Medical Devices) registration. Focus on medical device information, intended use, functionality, patient population, contraindications, warnings, and clinical benefits that comply with EU MDR 2017/745 or IVDR 2017/746 requirements. Provide a comprehensive summary suitable for EUDAMED product definition analysis.",
          request.companyId,
          { mimeType: 'application/pdf', data: base64Data }
        );
      } else {
        const rawText = await this.extractTextFromFile(request.file);
        if (!rawText || rawText.trim().length === 0) {
          throw new Error('No text content could be extracted from the document');
        }

        extractedText = await callVertexAISuggestion(
          `Analyze this medical device document text for EUDAMED registration and provide a comprehensive summary focusing on:
- Intended use and purpose (EU MDR/IVDR compliant)
- Device functionality and operation
- Target patient population
- Intended users
- Contraindications and warnings
- Clinical benefits and outcomes
- Safety considerations

Document text:
${rawText}

Please provide a detailed summary suitable for EUDAMED product definition analysis and EU regulatory compliance.`,
          request.companyId
        );
      }

      return {
        success: true,
        extracted_text: extractedText,
        metadata: {
          ai_provider: 'google-vertex-ai',
          confidence_score: 0.9,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[ProductDefinitionAI] Service error:', error);
      throw error;
    }
  }

  /**
   * Generate field suggestions using Vertex AI
   */
  static async generateFieldSuggestions(
    request: FieldSuggestionRequest
  ): Promise<ProductDefinitionAIResponse> {
    try {
      const fieldPrompts: Record<string, string> = {
        intended_use: "Based on the document content, provide a clear and concise statement of the intended use of this medical device for EUDAMED registration.",
        intended_function: "Analyze the document and describe the intended function of this medical device for EUDAMED compliance.",
        mode_of_action: "From the document content, describe the mode of action of this medical device for EUDAMED registration.",
        patient_population: "Based on the document, identify and describe the target patient population for this medical device for EUDAMED compliance.",
        intended_user: "Analyze the document to identify who the intended users of this medical device are for EUDAMED registration.",
        contraindications: "From the document content, identify any contraindications for this medical device for EUDAMED compliance.",
        warnings_precautions: "Extract warnings and precautions from the document for EUDAMED registration.",
        clinical_benefits: "Based on the document, describe the clinical benefits of this medical device for EUDAMED compliance."
      };

      const prompt = fieldPrompts[request.fieldType] || "Analyze this document and provide relevant information for the specified field.";
      const fullPrompt = `${prompt}\n\nDocument content:\n${request.documentText}\n\n${request.existingValue ? `Current value: ${request.existingValue}\n\nPlease provide an improved suggestion.` : 'Please provide a suggestion based on the document content.'}\n\nProvide your response in JSON format:\n{\n  "suggestion": "your suggestion here",\n  "confidence": 0.0-1.0,\n  "reasoning": "explanation"\n}`;

      const responseText = await callVertexAISuggestion(fullPrompt, request.companyId);

      let suggestionData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        suggestionData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
      } catch {
        suggestionData = { suggestion: responseText, confidence: 0.7, reasoning: "AI generated response" };
      }

      return {
        success: true,
        suggestions: [{
          fieldType: request.fieldType,
          suggestion: suggestionData.suggestion || responseText,
          confidence: suggestionData.confidence || 0.7,
          reasoning: suggestionData.reasoning || "Generated from document analysis"
        }],
        metadata: { ai_provider: 'google-vertex-ai', confidence_score: suggestionData.confidence || 0.7, generatedAt: new Date().toISOString() }
      };
    } catch (error) {
      console.error('[ProductDefinitionAI] Service error:', error);
      throw error;
    }
  }

  /**
   * Generate AI suggestion with custom system prompt
   */
  static async generateCustomSuggestion(
    systemPrompt: string,
    companyId: string
  ): Promise<ProductDefinitionAIResponse> {
    try {
      const suggestionText = await callVertexAISuggestion(systemPrompt, companyId);

      return {
        success: true,
        suggestions: [{
          fieldType: 'custom',
          suggestion: suggestionText,
          confidence: 0.8,
          reasoning: "Generated from custom system prompt"
        }],
        metadata: { ai_provider: 'google-vertex-ai', confidence_score: 0.8, generatedAt: new Date().toISOString() }
      };
    } catch (error) {
      console.error('[ProductDefinitionAI] Service error:', error);
      throw error;
    }
  }

  /**
   * Generate concise AI suggestion for specific field with context
   */
  static async generateConciseFieldSuggestion(
    productName: string,
    fieldLabel: string,
    fieldDescription: string,
    currentValue: string,
    fieldType: string,
    companyId: string,
    requirements?: string,
    deviceContext?: DeviceContext
  ): Promise<ProductDefinitionAIResponse> {
    try {
      const contextSection = deviceContext ? `
Device Context:
- Category: ${deviceContext.deviceCategory || 'Not specified'}
- Description: ${deviceContext.deviceDescription || 'Not specified'}
- EMDN Classification: ${deviceContext.emdnDescription || deviceContext.emdnCode || 'Not specified'}
- Regulatory Type: ${deviceContext.primaryRegulatoryType || 'Not specified'}
- Device Nature: ${deviceContext.coreDeviceNature || 'Not specified'}
- Key Features: ${Array.isArray(deviceContext.keyFeatures) ? deviceContext.keyFeatures.join(', ') : 'Not specified'}
- Is Active Device: ${deviceContext.isActiveDevice ? 'Yes' : 'No'}
${deviceContext.deviceCharacteristics?.isImplantable ? '- This is an implantable device' : ''}
${deviceContext.deviceCharacteristics?.isSoftwareAsaMedicalDevice ? '- This is a Software as a Medical Device (SaMD)' : ''}
${deviceContext.deviceCharacteristics?.isSoftwareMobileApp ? '- This is Software in a Medical Device (SiMD)' : ''}
${deviceContext.deviceCharacteristics?.isInVitroDiagnostic ? '- This is an In Vitro Diagnostic (IVD) device' : ''}
${deviceContext.deviceCharacteristics?.containsHumanAnimalMaterial ? '- Contains human/animal material' : ''}
${deviceContext.deviceCharacteristics?.incorporatesMedicinalSubstance ? '- Incorporates medicinal substance' : ''}

IMPORTANT: Use the device context above to generate a SPECIFIC suggestion tailored to this device type. Do NOT use generic placeholders.
` : '';

      const systemPrompt = `You are a medical device regulatory expert specializing in EUDAMED compliance. Generate a suggestion for the "${fieldLabel}" field.

Context:
- Product: ${productName}
- Field: ${fieldLabel}
- Description: ${fieldDescription}
- Current value: "${currentValue}"
- Regulatory Context: EUDAMED registration
${contextSection}
Requirements:
${requirements ? requirements : `- Provide ONLY 2-4 lines maximum
- Be professional and regulatory-compliant
- Focus on the core purpose/function
- Use clear, concise medical terminology
- Do not include explanations or reasoning
- ${deviceContext ? 'Make the suggestion SPECIFIC to the device type' : 'Provide a customizable template'}`}

Generate a direct, actionable suggestion suitable for EUDAMED registration.`;

      const suggestionText = await callVertexAISuggestion(systemPrompt, companyId);

      return {
        success: true,
        suggestions: [{
          fieldType,
          suggestion: suggestionText,
          confidence: 0.85,
          reasoning: `Generated concise suggestion for ${fieldLabel} field`
        }],
        metadata: { ai_provider: 'google-vertex-ai', confidence_score: 0.85, generatedAt: new Date().toISOString() }
      };
    } catch (error) {
      console.error('[ProductDefinitionAI] Service error:', error);
      throw error;
    }
  }

  /**
   * Generate suggestions for all fields using Vertex AI
   */
  static async generateAllFieldSuggestions(
    documentText: string,
    companyId: string,
    existingData?: Partial<Record<FieldSuggestionRequest['fieldType'], string>>
  ): Promise<ProductDefinitionAIResponse> {
    try {
      const allFieldsPrompt = `Analyze this medical device document and provide suggestions for all product definition fields suitable for EUDAMED registration.

Document content:
${documentText}

${existingData ? `Current existing data:\n${JSON.stringify(existingData, null, 2)}\n\n` : ''}

Please provide suggestions for each field in JSON format:
{
  "suggestions": [
    { "fieldType": "intended_use", "suggestion": "...", "confidence": 0.0-1.0, "reasoning": "..." },
    { "fieldType": "intended_function", "suggestion": "...", "confidence": 0.0-1.0, "reasoning": "..." },
    { "fieldType": "mode_of_action", "suggestion": "...", "confidence": 0.0-1.0, "reasoning": "..." },
    { "fieldType": "patient_population", "suggestion": "...", "confidence": 0.0-1.0, "reasoning": "..." },
    { "fieldType": "intended_user", "suggestion": "...", "confidence": 0.0-1.0, "reasoning": "..." },
    { "fieldType": "contraindications", "suggestion": "...", "confidence": 0.0-1.0, "reasoning": "..." },
    { "fieldType": "warnings_precautions", "suggestion": "...", "confidence": 0.0-1.0, "reasoning": "..." },
    { "fieldType": "clinical_benefits", "suggestion": "...", "confidence": 0.0-1.0, "reasoning": "..." }
  ]
}`;

      const responseText = await callVertexAISuggestion(allFieldsPrompt, companyId);

      let suggestionsData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        suggestionsData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
      } catch {
        throw new Error('Failed to parse AI response');
      }

      const suggestions: FieldSuggestion[] = suggestionsData.suggestions || [];

      return {
        success: true,
        suggestions,
        metadata: {
          ai_provider: 'google-vertex-ai',
          confidence_score: suggestions.length > 0 ? suggestions.reduce((acc, s) => acc + s.confidence, 0) / suggestions.length : 0,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[ProductDefinitionAI] Service error:', error);
      throw error;
    }
  }
}

export const productDefinitionAIService = ProductDefinitionAIService;
