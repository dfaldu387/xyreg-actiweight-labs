import { supabase } from '@/integrations/supabase/client';
import { decryptApiKey } from '@/utils/apiKeyUtils';
import * as mammoth from 'mammoth';
import { toast } from 'sonner';

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

  // Check if category is meaningful (not just "New Device" or similar generic terms)
  const genericCategories = ['new device', 'device', 'product', 'new product', 'untitled'];
  const categoryValue = context.deviceCategory?.toLowerCase().trim() || '';
  const hasMeaningfulCategory = !!context.deviceCategory?.trim() &&
    !genericCategories.some(g => categoryValue === g || categoryValue.startsWith(g + ' ('));

  // Check if product name is meaningful (not generic)
  const genericNames = ['new device', 'untitled', 'my device', 'current medical device', 'new product', 'device'];
  const nameValue = context.productName?.toLowerCase().trim() || '';
  const hasMeaningfulName = !!context.productName?.trim() &&
    !genericNames.includes(nameValue) &&
    !/^device\s*\d*$/i.test(nameValue); // "Device 111" etc. are generic

  // We need at least ONE of: meaningful name, description, EMDN, or meaningful category
  const hasAnyMeaningfulContext = hasMeaningfulName || hasDescription || hasEMDN ||
    hasMeaningfulCategory || hasFeatures || hasRegulatoryType || hasCoreNature || hasDeviceChars;

  if (!hasAnyMeaningfulContext) {
    // Provide specific guidance on what fields to fill
    if (!hasMeaningfulName) {
      missingFields.push('Product Name');
    }
    if (!hasMeaningfulCategory && !hasDescription) {
      missingFields.push('Device Category');
      missingFields.push('Description');
    }
    if (!hasEMDN) {
      missingFields.push('EMDN Code');
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields
  };
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

export class ProductDefinitionAIService {
  /**
   * Check if Gemini API key is configured for a company (public method for debugging)
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

      // Get company name for better error messages
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      const { data, error } = await supabase
        .from('company_api_keys')
        .select('id, key_type, encrypted_key')
        .eq('company_id', companyId)
        .eq('key_type', 'gemini')
        .maybeSingle();

      if (error) {
        console.error('[ProductDefinitionAI] Key status check error:', error);
        return {
          hasKey: false,
          companyId,
          companyName: companyData?.name,
          error: error.message
        };
      }

      if (!data) {
        return {
          hasKey: false,
          companyId,
          companyName: companyData?.name
        };
      }

      // Validate the key by decrypting it
      const decryptedKey = decryptApiKey(data.encrypted_key);
      const isValidFormat = decryptedKey.length >= 30 && decryptedKey.startsWith('AIza');

      console.log('[ProductDefinitionAI] Key status check:', {
        companyId,
        companyName: companyData?.name,
        encryptedKeyLength: data.encrypted_key?.length,
        decryptedKeyLength: decryptedKey?.length,
        decryptedKeyPrefix: decryptedKey?.substring(0, 4),
        isValidFormat
      });

      return {
        hasKey: true,
        companyId,
        companyName: companyData?.name,
        keyDetails: {
          encryptedKeyLength: data.encrypted_key?.length || 0,
          decryptedKeyLength: decryptedKey?.length || 0,
          decryptedKeyPrefix: decryptedKey?.substring(0, 4) || '',
          isValidFormat
        }
      };
    } catch (error) {
      console.error('[ProductDefinitionAI] Error checking key status:', error);
      return {
        hasKey: false,
        companyId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get company's Google API key
   */
  private static readonly FALLBACK_GEMINI_KEY = 'AIzaSyCsB2rKFTfACP5lCj95_rlRP8Lp4VEi-6U';

  private static async getGoogleApiKey(companyId: string): Promise<string> {
    try {
      console.log('[ProductDefinitionAI] Fetching Gemini API key for company:', companyId);

      if (!companyId) {
        console.log('[ProductDefinitionAI] No companyId provided, using fallback key');
        return this.FALLBACK_GEMINI_KEY;
      }

      const { data, error } = await supabase
        .from('company_api_keys')
        .select('encrypted_key')
        .eq('company_id', companyId)
        .eq('key_type', 'gemini')
        .single();

      if (error || !data) {
        console.log('[ProductDefinitionAI] No company key found, using fallback key');
        return this.FALLBACK_GEMINI_KEY;
      }

      // Debug: Log raw encrypted key info
      console.log('[ProductDefinitionAI] Raw encrypted key from DB:', {
        companyId,
        encryptedKeyLength: data.encrypted_key?.length,
        encryptedKeyPreview: data.encrypted_key?.substring(0, 20) + '...'
      });

      const decryptedKey = decryptApiKey(data.encrypted_key);

      // Validate decrypted key, fallback if invalid
      if (!decryptedKey || !decryptedKey.startsWith('AIza') || decryptedKey.length < 30) {
        console.log('[ProductDefinitionAI] Decrypted key invalid, using fallback key');
        return this.FALLBACK_GEMINI_KEY;
      }

      // Debug: Log key info (first/last 4 chars only for security)
      console.log('[ProductDefinitionAI] Key retrieved:', {
        companyId,
        decryptedKeyLength: decryptedKey?.length,
        decryptedKeyPrefix: decryptedKey?.substring(0, 4),
        looksLikeGeminiKey: decryptedKey?.startsWith('AIza')
      });

      return decryptedKey;
    } catch (error) {
      console.log('[ProductDefinitionAI] Error fetching key, using fallback:', error);
      return this.FALLBACK_GEMINI_KEY;
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
        // Remove data URL prefix to get just the base64 data
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
      // For text files, read directly
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }

    if (fileType === 'application/pdf') {
      // For PDF files, we'll use Gemini API with base64
      return '';
    }

    // For DOCX files, use mammoth to extract text
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (error) {
            console.error('[ProductDefinitionAI] Error extracting text from DOCX:', error);
            reject(new Error('Failed to extract text from DOCX file. Please ensure the file is not corrupted.'));
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    // For legacy DOC files, attempt to read as text (limited success)
    if (fileType === 'application/msword') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          // DOC files often contain binary data, so we'll try to extract readable text
          // This is a basic approach - for better results, users should convert to DOCX
          const cleanText = text
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

          if (cleanText.length < 50) {
            reject(new Error('Legacy DOC files have limited text extraction support. Please convert to DOCX or PDF format for better results.'));
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
   * Extract text from document using Google Gemini API
   */
  static async uploadAndExtractDocument(
    request: DocumentUploadRequest
  ): Promise<ProductDefinitionAIResponse> {
    try {
      // console.log('[ProductDefinitionAI] Uploading document for text extraction:', {
      //   fileName: request.file.name,
      //   fileSize: request.file.size,
      //   fileType: request.file.type,
      //   companyId: request.companyId
      // });

      const apiKey = await this.getGoogleApiKey(request.companyId);
      const fileType = request.file.type;

      let extractedText: string;

      if (fileType === 'application/pdf') {
        // For PDF files, use Gemini API with base64
        const base64Data = await this.fileToBase64(request.file);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    inline_data: {
                      mime_type: 'application/pdf',
                      data: base64Data
                    }
                  },
                  {
                    text: "Extract and summarize all text content from this PDF document for EUDAMED (European Database on Medical Devices) registration. Focus on medical device information, intended use, functionality, patient population, contraindications, warnings, and clinical benefits that comply with EU MDR 2017/745 or IVDR 2017/746 requirements. Provide a comprehensive summary suitable for EUDAMED product definition analysis."
                  }
                ]
              }]
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error('No text content extracted from PDF document');
        }

        extractedText = data.candidates[0].content.parts[0].text;

      } else {
        // For text files and other formats, extract text first then analyze
        const rawText = await this.extractTextFromFile(request.file);

        if (!rawText || rawText.trim().length === 0) {
          throw new Error('No text content could be extracted from the document');
        }

        // For non-PDF files, analyze the extracted text directly
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Analyze this medical device document text for EUDAMED (European Database on Medical Devices) registration and provide a comprehensive summary focusing on:

- Intended use and purpose (EU MDR/IVDR compliant)
- Device functionality and operation (EU regulatory standards)
- Target patient population (EU market requirements)
- Intended users (healthcare professionals, patients, etc.) (EU user qualifications)
- Contraindications and warnings (EU safety documentation standards)
- Clinical benefits and outcomes (EU clinical evaluation alignment)
- Safety considerations (EU regulatory compliance)

Document text:
${rawText}

Please provide a detailed summary suitable for EUDAMED product definition analysis and EU regulatory compliance.`
                }]
              }]
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error('No analysis generated from document text');
        }

        extractedText = data.candidates[0].content.parts[0].text;
      }

      // console.log('[ProductDefinitionAI] Document extraction successful, text length:', extractedText.length);

      return {
        success: true,
        extracted_text: extractedText,
        metadata: {
          ai_provider: 'google-gemini',
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
   * Generate field suggestions using Google Gemini API
   */
  static async generateFieldSuggestions(
    request: FieldSuggestionRequest
  ): Promise<ProductDefinitionAIResponse> {
    try {
      //  console.log ('[ProductDefinitionAI] Generating field suggestions:', {
      //     fieldType: request.fieldType,
      //     textLength: request.documentText.length,
      //     companyId: request.companyId
      //   });

      const apiKey = await this.getGoogleApiKey(request.companyId);

      const fieldPrompts = {
        intended_use: "Based on the document content, provide a clear and concise statement of the intended use of this medical device for EUDAMED registration. Focus on what the device is designed to do and its primary purpose, ensuring compliance with EU MDR/IVDR requirements.",
        intended_function: "Analyze the document and describe the intended function of this medical device for EUDAMED compliance. Explain how it works and what it accomplishes, using terminology suitable for EU regulatory documentation.",
        mode_of_action: "From the document content, describe the mode of action of this medical device for EUDAMED registration. Explain the mechanism by which it achieves its intended function, ensuring clarity for EU regulatory review.",
        patient_population: "Based on the document, identify and describe the target patient population for this medical device for EUDAMED compliance. Include age groups, medical conditions, and any specific patient characteristics relevant to EU market requirements.",
        intended_user: "Analyze the document to identify who the intended users of this medical device are for EUDAMED registration. This could include healthcare professionals, patients, or other users, ensuring compliance with EU user qualification requirements.",
        contraindications: "From the document content, identify any contraindications for this medical device for EUDAMED compliance. List conditions or situations where the device should not be used, following EU safety documentation standards.",
        warnings_precautions: "Extract warnings and precautions from the document for EUDAMED registration. Include any safety considerations, potential risks, or special handling requirements that meet EU regulatory standards.",
        clinical_benefits: "Based on the document, describe the clinical benefits of this medical device for EUDAMED compliance. Explain how it improves patient outcomes or healthcare delivery, ensuring alignment with EU clinical evaluation requirements."
      };

      const prompt = fieldPrompts[request.fieldType] || "Analyze this document and provide relevant information for the specified field.";

      const fullPrompt = `${prompt}\n\nDocument content:\n${request.documentText}\n\n${request.existingValue ? `Current value: ${request.existingValue}\n\nPlease provide an improved suggestion based on the document content.` : 'Please provide a suggestion based on the document content.'}\n\nProvide your response in the following JSON format:\n{\n  "suggestion": "your suggestion here",\n  "confidence": 0.0-1.0,\n  "reasoning": "explanation of why this suggestion was made"\n}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: fullPrompt
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('No response generated from AI');
      }

      const responseText = data.candidates[0].content.parts[0].text;

      // Try to parse JSON response
      let suggestionData;
      try {
        // Extract JSON from response if it's wrapped in markdown
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : responseText;
        suggestionData = JSON.parse(jsonText);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        suggestionData = {
          suggestion: responseText,
          confidence: 0.7,
          reasoning: "AI generated response based on document analysis"
        };
      }

      const suggestion: FieldSuggestion = {
        fieldType: request.fieldType,
        suggestion: suggestionData.suggestion || responseText,
        confidence: suggestionData.confidence || 0.7,
        reasoning: suggestionData.reasoning || "Generated from document analysis"
      };

      // console.log('[ProductDefinitionAI] Field suggestions generated successfully');

      return {
        success: true,
        suggestions: [suggestion],
        metadata: {
          ai_provider: 'google-gemini',
          confidence_score: suggestion.confidence,
          generatedAt: new Date().toISOString()
        }
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
      // console.log('[ProductDefinitionAI] Generating custom suggestion:', {
      //   promptLength: systemPrompt.length,
      //   companyId
      // });

      const apiKey = await this.getGoogleApiKey(companyId);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: systemPrompt
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('No response generated from AI');
      }

      const suggestionText = data.candidates[0].content.parts[0].text.trim();

      // console.log('[ProductDefinitionAI] Custom suggestion generated successfully');

      return {
        success: true,
        suggestions: [{
          fieldType: 'custom',
          suggestion: suggestionText,
          confidence: 0.8,
          reasoning: "Generated from custom system prompt"
        }],
        metadata: {
          ai_provider: 'google-gemini',
          confidence_score: 0.8,
          generatedAt: new Date().toISOString()
        }
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
      // console.log('[ProductDefinitionAI] Generating concise field suggestion:', {
      //   productName,
      //   fieldLabel,
      //   fieldType,
      //   companyId,
      //   hasDeviceContext: !!deviceContext
      // });

      const apiKey = await this.getGoogleApiKey(companyId);

      // Validate API key format
      if (!apiKey || apiKey.length < 30) {
        console.error('[ProductDefinitionAI] Invalid API key format:', {
          hasKey: !!apiKey,
          keyLength: apiKey?.length
        });
        toast.error('The stored API key appears to be invalid. Please re-enter the Gemini API key in Super Admin.');
        throw new Error('INVALID_API_KEY_FORMAT');
      }

      if (!apiKey.startsWith('AIza')) {
        console.warn('[ProductDefinitionAI] API key does not start with expected prefix "AIza":', {
          keyPrefix: apiKey.substring(0, 4)
        });
      }

      // Build device context section if available
      const contextSection = deviceContext ? `
Device Context (use this to make your suggestion specific and relevant):
- Category: ${deviceContext.deviceCategory || 'Not specified'}
- Description: ${deviceContext.deviceDescription || 'Not specified'}
- EMDN Classification: ${deviceContext.emdnDescription || deviceContext.emdnCode || 'Not specified'}
- Regulatory Type: ${deviceContext.primaryRegulatoryType || 'Not specified'}
- Device Nature: ${deviceContext.coreDeviceNature || 'Not specified'}
- Key Features: ${Array.isArray(deviceContext.keyFeatures) ? deviceContext.keyFeatures.join(', ') : 'Not specified'}
- Is Active Device: ${deviceContext.isActiveDevice ? 'Yes' : 'No'}
${deviceContext.deviceCharacteristics?.isImplantable ? '- This is an implantable device' : ''}
${deviceContext.deviceCharacteristics?.isSoftwareAsaMedicalDevice ? '- This is a Software as a Medical Device (SaMD)' : ''}
${deviceContext.deviceCharacteristics?.isSoftwareMobileApp ? '- This is Software in a Medical Device (SiMD) - the software is a component embedded in hardware' : ''}
${deviceContext.deviceCharacteristics?.isInVitroDiagnostic ? '- This is an In Vitro Diagnostic (IVD) device' : ''}
${deviceContext.deviceCharacteristics?.containsHumanAnimalMaterial ? '- Contains human/animal material' : ''}
${deviceContext.deviceCharacteristics?.incorporatesMedicinalSubstance ? '- Incorporates medicinal substance' : ''}

IMPORTANT: Use the device context above to generate a SPECIFIC suggestion tailored to this device type. Do NOT use generic placeholders like [specific condition] or [defined population]. Based on the device category and characteristics, make reasonable assumptions about the device's purpose.
` : '';

      const systemPrompt = `You are a medical device regulatory expert specializing in EUDAMED (European Database on Medical Devices) compliance. Generate a suggestion for the "${fieldLabel}" field for a medical device.

Context:
- Product: ${productName}
- Field: ${fieldLabel}
- Description: ${fieldDescription}
- Current value: "${currentValue}"
- Regulatory Context: This device will be registered in EUDAMED, the centralized digital platform that collects and disseminates information on medical devices and in vitro diagnostic devices (IVDs) circulating on the EU market
${contextSection}
EUDAMED Requirements:
- Ensure compliance with EU Medical Device Regulation (MDR) 2017/745 or In Vitro Diagnostic Regulation (IVDR) 2017/746
- Use terminology consistent with EUDAMED data fields and requirements
- Focus on EU market-specific regulatory language and standards
- Consider CE marking requirements and conformity assessment procedures
- Align with European Commission guidelines for medical device documentation

Requirements:
${requirements ? requirements : `- Provide ONLY 2-4 lines maximum
- Be professional and regulatory-compliant
- Focus on the core purpose/function
- Use clear, concise medical terminology
- Do not include explanations or reasoning
- ${deviceContext ? 'Make the suggestion SPECIFIC to the device type and category - avoid generic placeholders' : 'If device information is limited, provide a template that can be customized'}`}

Generate a direct, actionable suggestion that can be used immediately in the field and is suitable for EUDAMED registration.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: systemPrompt
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('No response generated from AI');
      }

      const suggestionText = data.candidates[0].content.parts[0].text.trim();

      // console.log('[ProductDefinitionAI] Concise field suggestion generated successfully');

      return {
        success: true,
        suggestions: [{
          fieldType: fieldType,
          suggestion: suggestionText,
          confidence: 0.85,
          reasoning: `Generated concise suggestion for ${fieldLabel} field`
        }],
        metadata: {
          ai_provider: 'google-gemini',
          confidence_score: 0.85,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[ProductDefinitionAI] Service error:', error);
      throw error;
    }
  }

  /**
   * Generate suggestions for all fields using Google Gemini API
   */
  static async generateAllFieldSuggestions(
    documentText: string,
    companyId: string,
    existingData?: Partial<Record<FieldSuggestionRequest['fieldType'], string>>
  ): Promise<ProductDefinitionAIResponse> {
    try {
      // console.log('[ProductDefinitionAI] Generating all field suggestions:', {
      //   textLength: documentText.length,
      //   companyId,
      //   hasExistingData: !!existingData
      // });

      const apiKey = await this.getGoogleApiKey(companyId);

      const allFieldsPrompt = `Analyze this medical device document and provide suggestions for all product definition fields suitable for EUDAMED (European Database on Medical Devices) registration. 

Document content:
${documentText}

${existingData ? `Current existing data:\n${JSON.stringify(existingData, null, 2)}\n\n` : ''}

EUDAMED Context: This device will be registered in EUDAMED, the centralized digital platform for medical devices and IVDs circulating on the EU market. Ensure all suggestions comply with EU MDR 2017/745 or IVDR 2017/746 requirements.

Please provide suggestions for each of the following fields based on the document content:

1. intended_use - Clear statement of what the device is designed to do (EUDAMED compliant)
2. intended_function - How the device works and what it accomplishes (EU regulatory terminology)
3. mode_of_action - The mechanism by which it achieves its function (EU documentation standards)
4. patient_population - Target patients (age, conditions, characteristics) (EU market requirements)
5. intended_user - Who uses the device (healthcare professionals, patients, etc.) (EU user qualifications)
6. contraindications - Conditions where device should not be used (EU safety standards)
7. warnings_precautions - Safety considerations and risks (EU regulatory compliance)
8. clinical_benefits - How it improves patient outcomes (EU clinical evaluation alignment)

Provide your response in the following JSON format:
{
  "suggestions": [
    {
      "fieldType": "intended_use",
      "suggestion": "your suggestion here",
      "confidence": 0.0-1.0,
      "reasoning": "explanation"
    },
    // ... repeat for each field
  ]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: allFieldsPrompt
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('No response generated from AI');
      }

      const responseText = data.candidates[0].content.parts[0].text;

      // Try to parse JSON response
      let suggestionsData;
      try {
        // Extract JSON from response if it's wrapped in markdown
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : responseText;
        suggestionsData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('[ProductDefinitionAI] Failed to parse JSON response:', parseError);
        throw new Error('Failed to parse AI response');
      }

      const suggestions: FieldSuggestion[] = suggestionsData.suggestions || [];

      // console.log('[ProductDefinitionAI] All field suggestions generated successfully');

      return {
        success: true,
        suggestions,
        metadata: {
          ai_provider: 'google-gemini',
          confidence_score: suggestions.reduce((acc, s) => acc + s.confidence, 0) / suggestions.length,
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