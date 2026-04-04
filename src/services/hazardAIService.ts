import { supabase } from '@/integrations/supabase/client';

export interface HazardSuggestion {
  description: string;
  hazardous_situation: string;
  potential_harm: string;
  foreseeable_sequence_events: string;
  rationale: string;
  confidence: number;
  category: 'mechanical_energy' | 'thermal_energy' | 'electrical_energy' | 'radiation' | 
           'acoustic_energy' | 'chemical_hazards' | 'biocompatibility' |
           'materials_patient_contact' | 'combination_other_products' | 'human_factors' | 
           'training_requirements' | 'cleaning_maintenance' | 'negative_air_pressure' | 
           'sterility_requirements' | 'critical_data_storage' | 
           'software_use' | 'disposal' | 'manufacturing_residues' | 'transport_storage' | 
           'shelf_life' | 'product_realization' | 'customer_requirements' | 'purchasing' | 
           'service_provision' | 'monitoring_devices';
}

export interface HazardAIRequest {
  companyId: string;
  categoryFilter?: string;
  productData: {
    clinical_purpose?: string;
    indications_for_use?: string;
    target_population?: string;
    use_environment?: string;
    duration_of_use?: string;
    device_class?: string;
    product_name?: string;
  };
  requirementSpecifications: Array<{
    id: string;
    requirement_id: string;
    description: string;
    category: string;
    linked_risks: string;
  }>;
  existingItems?: string[];
}

export interface HazardAIResponse {
  success: boolean;
  suggestions?: HazardSuggestion[];
  metadata?: {
    generatedAt: string;
    productName?: string;
    totalSuggestions: number;
  };
  error?: string;
  errorType?: string;
}

export class HazardAIService {
  static async generateHazardSuggestions(
    request: HazardAIRequest
  ): Promise<HazardAIResponse> {
    try {
      console.log('[HazardAIService] Generating hazard suggestions:', {
        companyId: request.companyId,
        productName: request.productData.product_name
      });

      const { data, error } = await supabase.functions.invoke('ai-hazard-generator', {
        body: request
      });

      if (error) {
        console.error('[HazardAIService] Error calling edge function:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('[HazardAIService] AI generation failed:', data?.error);
        throw new Error(data?.error || 'AI hazard generation failed');
      }

      console.log('[HazardAIService] Generated', data.suggestions?.length || 0, 'suggestions');
      return data as HazardAIResponse;
    } catch (error) {
      console.error('[HazardAIService] Service error:', error);
      throw error;
    }
  }
}

export const hazardAIService = new HazardAIService();