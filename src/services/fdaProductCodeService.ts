import { FDAProductCodeInfo } from '@/types/fdaEnhanced';
import { supabase } from '@/integrations/supabase/client';

export class FDAProductCodeService {
  /**
   * Get product code information dynamically from FDA API with caching
   */
  static async getProductCodeInfo(code: string): Promise<FDAProductCodeInfo | null> {
    try {
      const { data, error } = await supabase.functions.invoke('fda-product-code-lookup', {
        body: { productCodes: [code] }
      });

      if (error) {
        console.error('Error fetching FDA product code:', error);
        return null;
      }

      if (!data.success || !data.data || data.data.length === 0) {
        return null;
      }

      return data.data[0];
    } catch (error) {
      console.error('Error calling FDA product code service:', error);
      return null;
    }
  }

  /**
   * Get multiple product codes information at once
   */
  static async getMultipleProductCodeInfo(codes: string[]): Promise<FDAProductCodeInfo[]> {
    if (!codes || codes.length === 0) return [];
    
    try {
      const { data, error } = await supabase.functions.invoke('fda-product-code-lookup', {
        body: { productCodes: codes }
      });

      if (error) {
        console.error('Error fetching multiple FDA product codes:', error);
        return [];
      }

      if (!data.success || !data.data) {
        return [];
      }

      return data.data.filter((info: FDAProductCodeInfo | null): info is FDAProductCodeInfo => info !== null);
    } catch (error) {
      console.error('Error calling FDA product code service for multiple codes:', error);
      return [];
    }
  }

  /**
   * Get product code information with fallback for unknown codes
   */
  static async getProductCodeInfoWithFallback(code: string): Promise<FDAProductCodeInfo> {
    const info = await this.getProductCodeInfo(code);
    if (info) return info;

    // Return fallback info for unknown codes
    return {
      code: code.toUpperCase(),
      description: 'Unknown FDA product code',
      deviceClass: 'Unknown',
      regulationNumber: 'Unknown',
      medicalSpecialty: 'Unknown',
      fdaUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm?ID=${code.toUpperCase()}`
    };
  }

  /**
   * Search product codes from cached database
   */
  static async searchProductCodes(query: string): Promise<FDAProductCodeInfo[]> {
    try {
      const { data, error } = await supabase
        .from('fda_product_codes')
        .select('*')
        .or(`code.ilike.%${query}%,description.ilike.%${query}%,medical_specialty.ilike.%${query}%`)
        .limit(50);

      if (error) {
        console.error('Error searching FDA product codes:', error);
        return [];
      }

      return data.map((item: any) => ({
        code: item.code,
        description: item.description || 'Unknown device',
        deviceClass: item.device_class || item.deviceClass || 'Unknown',
        regulationNumber: item.regulation_number || item.regulationNumber || 'Unknown',
        medicalSpecialty: item.medical_specialty || item.medicalSpecialty || 'Unknown',
        fdaUrl: item.fdaUrl || `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm?ID=${item.code}`
      }));
    } catch (error) {
      console.error('Error searching FDA product codes:', error);
      return [];
    }
  }

  /**
   * Get device class color for UI (static helper)
   */
  static getDeviceClassColor(deviceClass: string): string {
    switch (deviceClass) {
      case 'I': 
      case '1': 
        return 'text-green-600 bg-green-50';
      case 'II': 
      case '2': 
        return 'text-amber-600 bg-amber-50';
      case 'III': 
      case '3': 
        return 'text-red-600 bg-red-50';
      default: 
        return 'text-gray-600 bg-gray-50';
    }
  }

  /**
   * Get device class description (static helper)
   */
  static getDeviceClassDescription(deviceClass: string): string {
    switch (deviceClass) {
      case 'I': 
      case '1': 
        return 'Class I - Low Risk';
      case 'II': 
      case '2': 
        return 'Class II - Moderate Risk';
      case 'III': 
      case '3': 
        return 'Class III - High Risk';
      default: 
        return 'Unknown Class';
    }
  }

  /**
   * Batch fetch and cache multiple product codes
   */
  static async batchFetchAndCache(codes: string[]): Promise<void> {
    try {
      // Split into chunks to avoid overwhelming the API
      const chunks = [];
      for (let i = 0; i < codes.length; i += 10) {
        chunks.push(codes.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        await this.getMultipleProductCodeInfo(chunk);
        // Add small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error in batch fetch and cache:', error);
    }
  }
}