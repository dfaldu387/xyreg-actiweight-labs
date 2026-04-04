import { supabase } from '@/integrations/supabase/client';

export interface EmdnCompetitiveStats {
  manufacturers: number;
  totalProducts: number;
  totalDevices: number;
  isLoading?: boolean;
}

export class EmdnCompetitiveStatsService {
  private static cache = new Map<string, EmdnCompetitiveStats>();
  private static pendingRequests = new Map<string, Promise<EmdnCompetitiveStats>>();

  static async getCompetitiveStats(emdnCode: string): Promise<EmdnCompetitiveStats> {
    if (!emdnCode) {
      return { manufacturers: 0, totalProducts: 0, totalDevices: 0 };
    }

    // Check cache first
    const cached = this.cache.get(emdnCode);
    if (cached) {
      return cached;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(emdnCode);
    if (pending) {
      return pending;
    }

    // Create new request
    const request = this.fetchStats(emdnCode);
    this.pendingRequests.set(emdnCode, request);

    try {
      const result = await request;
      this.cache.set(emdnCode, result);
      return result;
    } finally {
      this.pendingRequests.delete(emdnCode);
    }
  }

  private static async fetchStats(emdnCode: string): Promise<EmdnCompetitiveStats> {
    try {
      // Extract only the code part before any colon for matching
      const cleanEmdnCode = emdnCode.split(':')[0].trim();
      console.log('[EmdnCompetitiveStats] Fetching stats for EMDN code:', cleanEmdnCode);

      // Query EUDAMED database for devices with the same EMDN code
      const { data: devices, error } = await supabase.rpc('get_eudamed_devices_by_emdn', {
        emdn_code: cleanEmdnCode,
        limit_count: 1000 // Get enough to count unique organizations
      });

      if (error) {
        console.error('[EmdnCompetitiveStats] Error querying EUDAMED data:', error);
        return { manufacturers: 0, totalProducts: 0, totalDevices: 0 };
      }

      if (!devices || !Array.isArray(devices) || devices.length === 0) {
        console.log('[EmdnCompetitiveStats] No devices found for EMDN code:', cleanEmdnCode);
        return { manufacturers: 0, totalProducts: 0, totalDevices: 0 };
      }

      // Count unique organizations (manufacturers)
      const uniqueOrganizations = new Set();
      // Count unique products (by device name or brand/trade name)
      const uniqueProducts = new Set();
      
      devices.forEach((device: any) => {
        if (device.organization && device.organization.trim()) {
          uniqueOrganizations.add(device.organization.trim());
        }
        
        // Count unique products by combining brand/trade name and device name
        const productIdentifier = [
          device.brand_name,
          device.trade_name,
          device.device_name
        ].filter(Boolean).join(' - ').trim();
        
        if (productIdentifier) {
          uniqueProducts.add(productIdentifier);
        }
      });

      const manufacturers = uniqueOrganizations.size;
      const totalProducts = uniqueProducts.size;
      const totalDevices = devices.length;

      console.log('[EmdnCompetitiveStats] Stats for', cleanEmdnCode, ':', {
        manufacturers,
        totalProducts,
        totalDevices
      });

      return {
        manufacturers,
        totalProducts,
        totalDevices
      };
    } catch (error) {
      console.error('[EmdnCompetitiveStats] Error fetching competitive stats:', error);
      return { manufacturers: 0, totalProducts: 0, totalDevices: 0 };
    }
  }

  // Clear cache for testing or when data might be stale
  static clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

export const emdnCompetitiveStatsService = EmdnCompetitiveStatsService;