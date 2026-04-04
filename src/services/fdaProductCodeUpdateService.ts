import { supabase } from '@/integrations/supabase/client';

export interface FDAProductCodeUpdateRequest {
  productId: string;
  newFdaCode: string;
}

export interface FDAProductCodeUpdateResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export class FDAProductCodeUpdateService {
  async updateProductFDACode(
    productId: string, 
    newFdaCode: string
  ): Promise<FDAProductCodeUpdateResponse> {
    try {
      console.log('[FDAProductCodeUpdateService] Updating FDA product code:', {
        productId,
        newFdaCode
      });

      const { data, error } = await supabase.rpc('update_product_fda_code', {
        product_id_param: productId,
        new_fda_code: newFdaCode
      });

      if (error) {
        console.error('[FDAProductCodeUpdateService] Database error:', error);
        throw error;
      }

      if (!data) {
        console.error('[FDAProductCodeUpdateService] Update failed - no data returned');
        return {
          success: false,
          error: 'Failed to update FDA product code',
          message: 'No data returned from update operation'
        };
      }

      console.log('[FDAProductCodeUpdateService] FDA code updated successfully');
      return {
        success: true,
        message: `FDA product code updated to ${newFdaCode}`
      };
    } catch (error) {
      console.error('[FDAProductCodeUpdateService] Service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update FDA product code'
      };
    }
  }

  async getRecommendedFDACode(emdnCode: string): Promise<string | null> {
    // Map common EMDN codes to FDA product codes
    const mappings: Record<string, string> = {
      'Y062703': 'LMH', // Aesthetic fillers -> Dermal Implant for Aesthetic Use
      'Y062701': 'LMH', // General dermal fillers -> Dermal Implant for Aesthetic Use
      'Y062702': 'LMH', // Injectable fillers -> Dermal Implant for Aesthetic Use
      // Add more mappings as needed
    };

    // Try exact match first
    if (mappings[emdnCode]) {
      return mappings[emdnCode];
    }

    // Check if it's an aesthetic/filler related code
    if (emdnCode.includes('Y0627') || emdnCode.toLowerCase().includes('filler')) {
      return 'LMH'; // Default to aesthetic dermal implant
    }

    return null;
  }
}

export const fdaProductCodeUpdateService = new FDAProductCodeUpdateService();