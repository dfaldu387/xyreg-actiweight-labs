import { supabase } from "@/integrations/supabase/client";
import type { EudamedDevice } from './eudamedProductImportService';
import { cleanDeviceName } from './eudamedProductImportService';

export interface EudamedEnrichmentResult {
  success: boolean;
  enrichedProducts: number;
  errors: string[];
  details: Array<{
    productId: string;
    productName: string;
    action: string;
    result: string;
  }>;
}

export interface EudamedNameUpdateResult {
  success: boolean;
  updatedProducts: number;
  errors: string[];
  details: Array<{
    productId: string;
    oldName: string;
    newName: string;
    action: string;
    result: string;
  }>;
}

export interface EudamedCompleteReinstallResult {
  success: boolean;
  processedProducts: number;
  errors: string[];
  details: Array<{
    productId: string;
    productName: string;
    action: string;
    result: string;
    changes: {
      tradeName?: { old: string; new: string };
      emdnCode?: { old: string; new: string };
      issuingAgency?: { old: string; new: string };
      deviceName?: { old: string; new: string };
      udiDi?: { old: string; new: string };
    };
  }>;
}

export interface ProductMatch {
  productId: string;
  productName: string;
  currentUdiDi: string | null;
  potentialMatches: Array<{
    eudamedDevice: EudamedDevice;
    matchType: 'exact_udi' | 'name_similarity' | 'basic_udi_match';
    confidence: number;
  }>;
}

/**
 * EUDAMED Enrichment Service
 * Enriches existing products with EUDAMED data by matching UDI-DI or names
 */
export class EudamedEnrichmentService {
  
  /**
   * Enrich existing products with EUDAMED data
   */
  static async enrichExistingProducts(
    companyId: string,
    onProgress?: (processed: number, total: number, operation: string) => void
  ): Promise<EudamedEnrichmentResult> {
    // console.log('[EudamedEnrichment] Starting enrichment of existing products');
    
    try {
      // Get company name for searching EUDAMED
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      
      if (!company) {
        throw new Error('Company not found');
      }
      
      onProgress?.(0, 100, `Getting existing products for ${company.name}...`);
      
      // Get existing products that need enrichment
      const existingProducts = await this.getProductsNeedingEnrichment(companyId);
      
      if (existingProducts.length === 0) {
        return {
          success: true,
          enrichedProducts: 0,
          errors: [],
          details: [{
            productId: '',
            productName: 'All products',
            action: 'enrichment_complete',
            result: 'All products already have EUDAMED data'
          }]
        };
      }
      
      onProgress?.(10, 100, `Fetching ${company.name} devices from EUDAMED...`);
      
      // Get all EUDAMED devices for this company
      const eudamedDevices = await this.fetchAllCompanyDevices(company.name);
      
      if (eudamedDevices.length === 0) {
        return {
          success: false,
          enrichedProducts: 0,
          errors: ['No EUDAMED devices found for this company'],
          details: []
        };
      }
      
      onProgress?.(30, 100, 'Matching products with EUDAMED devices...');
      
      // Find matches for each product
      const productMatches = await this.findProductMatches(existingProducts, eudamedDevices);
      const autoEnrichableMatches = productMatches.filter(match => 
        match.potentialMatches.some(m => m.matchType === 'exact_udi' && m.confidence >= 0.9)
      );
      

      
      if (autoEnrichableMatches.length === 0) {
        return {
          success: true,
          enrichedProducts: 0,
          errors: [],
          details: [{
            productId: '',
            productName: 'All products',
            action: 'no_matches',
            result: 'No high-confidence matches found. Manual review may be needed.'
          }]
        };
      }
      
      // Enrich products with high-confidence matches
      let enriched = 0;
      const errors: string[] = [];
      const details: Array<{ productId: string; productName: string; action: string; result: string; }> = [];
      
      for (let i = 0; i < autoEnrichableMatches.length; i++) {
        const match = autoEnrichableMatches[i];
        const progress = Math.round(40 + (i / autoEnrichableMatches.length) * 50);
        
        onProgress?.(progress, 100, `Enriching ${match.productName}...`);
        
        try {
          // Get the best match (highest confidence exact UDI match)
          const bestMatch = match.potentialMatches
            .filter(m => m.matchType === 'exact_udi')
            .sort((a, b) => b.confidence - a.confidence)[0];
          
          if (bestMatch) {
            await this.enrichProduct(match.productId, bestMatch.eudamedDevice);
            enriched++;
            
            details.push({
              productId: match.productId,
              productName: match.productName,
              action: 'enriched',
              result: `Matched with UDI-DI: ${bestMatch.eudamedDevice.udi_di}`
            });
            
          }
          
        } catch (error) {
          console.error(`[EudamedEnrichment] Failed to enrich ${match.productName}:`, error);
          errors.push(`Failed to enrich ${match.productName}: ${error}`);
          
          details.push({
            productId: match.productId,
            productName: match.productName,
            action: 'error',
            result: `Failed: ${error}`
          });
        }
      }
      
      onProgress?.(100, 100, 'Enrichment complete!');
      
      return {
        success: errors.length === 0,
        enrichedProducts: enriched,
        errors,
        details
      };
      
    } catch (error) {
      console.error('[EudamedEnrichment] Enrichment failed:', error);
      return {
        success: false,
        enrichedProducts: 0,
        errors: [`Enrichment failed: ${error}`],
        details: []
      };
    }
  }
  
  /**
   * Enrich a single product with specific EUDAMED device data
   */
  static async enrichSingleProduct(
    productId: string,
    eudamedDevice: EudamedDevice
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.enrichProduct(productId, eudamedDevice);
      return { success: true };
    } catch (error) {
      console.error('[EudamedEnrichment] Failed to enrich single product:', error);
      return { success: false, error: String(error) };
    }
  }
  
  /**
   * Complete reinstallation of all EUDAMED data for products
   */
  static async completeReinstallFromEudamed(
    companyId: string,
    onProgress?: (processed: number, total: number, operation: string) => void
  ): Promise<EudamedCompleteReinstallResult> {
    // console.log('[EudamedEnrichment] Starting complete reinstallation from EUDAMED');
    
    try {
      // Get company name for searching EUDAMED
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      
      if (!company) {
        throw new Error('Company not found');
      }
      
      onProgress?.(0, 100, `Getting all products for ${company.name}...`);
      
      // Get ALL products for this company (not just ones needing enrichment)
      const allProducts = await this.getAllCompanyProducts(companyId);
      // console.log(`[EudamedEnrichment] Found ${allProducts.length} products for complete reinstallation`);
      
      if (allProducts.length === 0) {
        return {
          success: true,
          processedProducts: 0,
          errors: [],
          details: [{
            productId: '',
            productName: 'No products',
            action: 'complete_reinstall',
            result: 'No products found to reinstall',
            changes: {}
          }]
        };
      }
      
      onProgress?.(10, 100, `Fetching ${company.name} devices from EUDAMED...`);
      
      // Get all EUDAMED devices for this company
      const eudamedDevices = await this.fetchAllCompanyDevices(company.name);
      // console.log(`[EudamedEnrichment] Found ${eudamedDevices.length} EUDAMED devices`);
      
      if (eudamedDevices.length === 0) {
        return {
          success: false,
          processedProducts: 0,
          errors: ['No EUDAMED devices found for this company'],
          details: []
        };
      }
      
      onProgress?.(30, 100, 'Reinstalling data for all products...');
      
      // Process each product for complete data update
      let processed = 0;
      const errors: string[] = [];
      const details: EudamedCompleteReinstallResult['details'] = [];
      
      for (let i = 0; i < allProducts.length; i++) {
        const product = allProducts[i];
        const progress = Math.round(40 + (i / allProducts.length) * 50);
        
        onProgress?.(progress, 100, `Reinstalling data for ${product.name}...`);
        
        try {
          // Find best match for this product
          const bestMatch = await this.findBestEudamedMatch(product, eudamedDevices);
          
          if (bestMatch) {
            const changes = await this.performCompleteReinstall(product, bestMatch);
            processed++;
            
            details.push({
              productId: product.id,
              productName: product.name,
              action: 'reinstalled',
              result: `Complete data reinstallation from EUDAMED device: ${bestMatch.device_name}`,
              changes
            });
            
            // console.log(`[EudamedEnrichment] Completely reinstalled data for ${product.name}`);
          } else {
            details.push({
              productId: product.id,
              productName: product.name,
              action: 'no_match',
              result: 'No suitable EUDAMED device found for reinstallation',
              changes: {}
            });
          }
          
        } catch (error) {
          console.error(`[EudamedEnrichment] Failed to reinstall ${product.name}:`, error);
          errors.push(`Failed to reinstall ${product.name}: ${error}`);
          
          details.push({
            productId: product.id,
            productName: product.name,
            action: 'error',
            result: `Failed: ${error}`,
            changes: {}
          });
        }
      }
      
      onProgress?.(100, 100, 'Complete reinstallation finished!');
      
      return {
        success: errors.length === 0,
        processedProducts: processed,
        errors,
        details
      };
      
    } catch (error) {
      console.error('[EudamedEnrichment] Complete reinstallation failed:', error);
      return {
        success: false,
        processedProducts: 0,
        errors: [`Complete reinstallation failed: ${error}`],
        details: []
      };
    }
  }

  /**
   * Update existing product names from EUDAMED data
   */
  static async updateProductNamesFromEudamed(
    companyId: string,
    onProgress?: (processed: number, total: number, operation: string) => void
  ): Promise<EudamedNameUpdateResult> {
    // console.log('[EudamedEnrichment] Starting name update from EUDAMED data');
    
    try {
      // Get company name for searching EUDAMED
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      
      if (!company) {
        throw new Error('Company not found');
      }
      
      onProgress?.(0, 100, `Getting products with EUDAMED data for ${company.name}...`);
      
      // Get existing products that have EUDAMED data but potentially incorrect names
      const productsWithEudamed = await this.getProductsWithEudamed(companyId);
      // console.log(`[EudamedEnrichment] Found ${productsWithEudamed.length} products with EUDAMED data`);
      
      if (productsWithEudamed.length === 0) {
        return {
          success: true,
          updatedProducts: 0,
          errors: [],
          details: [{
            productId: '',
            oldName: 'No products',
            newName: 'No products',
            action: 'name_update_complete',
            result: 'No products with EUDAMED data found'
          }]
        };
      }
      
      onProgress?.(20, 100, `Fetching ${company.name} devices from EUDAMED for name correction...`);
      
      // Get all EUDAMED devices for this company
      const eudamedDevices = await this.fetchAllCompanyDevices(company.name);
      // console.log(`[EudamedEnrichment] Found ${eudamedDevices.length} EUDAMED devices`);
      
      if (eudamedDevices.length === 0) {
        return {
          success: false,
          updatedProducts: 0,
          errors: ['No EUDAMED devices found for this company'],
          details: []
        };
      }
      
      onProgress?.(40, 100, 'Matching products with EUDAMED devices for name updates...');
      
      // Find exact UDI matches for name correction
      const nameUpdateCandidates = this.findNameUpdateCandidates(productsWithEudamed, eudamedDevices);
      
      // console.log(`[EudamedEnrichment] Found ${nameUpdateCandidates.length} products that can have names updated`);
      
      if (nameUpdateCandidates.length === 0) {
        return {
          success: true,
          updatedProducts: 0,
          errors: [],
          details: [{
            productId: '',
            oldName: 'All products',
            newName: 'All products',
            action: 'no_updates_needed',
            result: 'All product names are already using correct EUDAMED device names'
          }]
        };
      }
      
      // Update product names
      let updated = 0;
      const errors: string[] = [];
      const details: Array<{ productId: string; oldName: string; newName: string; action: string; result: string; }> = [];
      
      for (let i = 0; i < nameUpdateCandidates.length; i++) {
        const candidate = nameUpdateCandidates[i];
        const progress = Math.round(50 + (i / nameUpdateCandidates.length) * 40);
        
        onProgress?.(progress, 100, `Updating name for ${candidate.oldName}...`);
        
        try {
          await this.updateProductName(candidate.productId, candidate.newName);
          updated++;
          
          details.push({
            productId: candidate.productId,
            oldName: candidate.oldName,
            newName: candidate.newName,
            action: 'name_updated',
            result: `Name updated from "${candidate.oldName}" to "${candidate.newName}"`
          });
          
          // console.log(`[EudamedEnrichment] Updated name for product ${candidate.productId}: "${candidate.oldName}" → "${candidate.newName}"`);
          
        } catch (error) {
          console.error(`[EudamedEnrichment] Failed to update name for ${candidate.oldName}:`, error);
          errors.push(`Failed to update ${candidate.oldName}: ${error}`);
          
          details.push({
            productId: candidate.productId,
            oldName: candidate.oldName,
            newName: candidate.newName,
            action: 'error',
            result: `Failed: ${error}`
          });
        }
      }
      
      onProgress?.(100, 100, 'Name update complete!');
      
      return {
        success: errors.length === 0,
        updatedProducts: updated,
        errors,
        details
      };
      
    } catch (error) {
      console.error('[EudamedEnrichment] Name update failed:', error);
      return {
        success: false,
        updatedProducts: 0,
        errors: [`Name update failed: ${error}`],
        details: []
      };
    }
  }
  
  /**
   * Get potential matches for manual review
   */
  static async getProductMatches(
    companyId: string
  ): Promise<ProductMatch[]> {
    try {
      // Get company name
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      
      if (!company) {
        throw new Error('Company not found');
      }
      
      // Get products that need enrichment
      const existingProducts = await this.getProductsNeedingEnrichment(companyId);
      
      // Get EUDAMED devices
      const eudamedDevices = await this.fetchAllCompanyDevices(company.name);
      
      // Find matches
      return await this.findProductMatches(existingProducts, eudamedDevices);
      
    } catch (error) {
      console.error('[EudamedEnrichment] Failed to get product matches:', error);
      return [];
    }
  }
  
  /**
   * Get existing products that have EUDAMED data (for name correction)
   */
  private static async getProductsWithEudamed(companyId: string) {
    // console.log(`🔍 [EudamedEnrichment] Looking for products with EUDAMED data for company: ${companyId}`);
    
    const { data, error } = await supabase
      .from('products')
      .select('id, name, udi_di, eudamed_device_name, eudamed_trade_names, key_features, eudamed_organization')
      .eq('company_id', companyId)
      .eq('is_archived', false);
    
    if (error) {
      console.error('[EudamedEnrichment] Error fetching products with EUDAMED data:', error);
      throw error;
    }
    
    // Filter for products that have EUDAMED data
    const productsWithEudamed = (data || []).filter(product => {
      const hasEudamedOrg = product.eudamed_organization && product.eudamed_organization.trim() !== '';
      const hasEudamedInKeyFeatures = product.key_features && 
        typeof product.key_features === 'object' && 
        (product.key_features as any)?.eudamed_data;
      const hasEudamedDeviceName = product.eudamed_device_name && product.eudamed_device_name.trim() !== '';
      const hasEudamedTradeNames = product.eudamed_trade_names && product.eudamed_trade_names.trim() !== '';
      
      const hasEudamedData = hasEudamedOrg || hasEudamedInKeyFeatures || hasEudamedDeviceName || hasEudamedTradeNames;
      

      
      return hasEudamedData;
    });
    
    // console.log(`🔍 [EudamedEnrichment] Found ${productsWithEudamed.length} products with EUDAMED data out of ${data?.length || 0} total products`);
    
    return productsWithEudamed;
  }
  
  /**
   * Find products that need name updates based on EUDAMED device_name
   */
  private static findNameUpdateCandidates(
    products: any[],
    eudamedDevices: EudamedDevice[]
  ): Array<{ productId: string; oldName: string; newName: string; }> {
    const candidates: Array<{ productId: string; oldName: string; newName: string; }> = [];
    
    for (const product of products) {
      if (!product.udi_di) continue;
      
      // Find exact UDI match in EUDAMED
      const matchingDevice = eudamedDevices.find(device => device.udi_di === product.udi_di);
      if (!matchingDevice) continue;
      
      // Get the correct name - ONLY use device_name, never trade_names for product naming
      const correctName = cleanDeviceName(matchingDevice.device_name);
      if (!correctName || correctName.trim() === '') continue;
      
      // Enhanced check: also detect if current name contains trade names
      const currentName = product.name;
      const correctNameTrimmed = correctName.trim();
      const tradeName = matchingDevice.trade_names;
      
      // Determine if update is needed
      let needsUpdate = false;
      
      if (currentName !== correctNameTrimmed) {
        // Check if current name contains trade name (indicating it's using wrong name)
        if (tradeName && currentName.includes(tradeName)) {
          needsUpdate = true;
          // console.log(`[EudamedEnrichment] Product ${product.id} contains trade name "${tradeName}"`);
        } else if (!currentName.includes(correctNameTrimmed)) {
          needsUpdate = true;
          // console.log(`[EudamedEnrichment] Product ${product.id} doesn't match device name`);
        }
      }
      
      if (needsUpdate) {
        // console.log(`[EudamedEnrichment] Name update needed for product ${product.id}:`);
        // console.log(`  Current: "${currentName}"`);
        // console.log(`  Correct: "${correctNameTrimmed}"`);
        // console.log(`  Trade Name: "${tradeName}"`);
        
        candidates.push({
          productId: product.id,
          oldName: currentName,
          newName: correctNameTrimmed
        });
      }
    }
    
    return candidates;
  }
  
  /**
   * Update a product's name
   */
  private static async updateProductName(productId: string, newName: string) {
    const { error } = await supabase
      .from('products')
      .update({ 
        name: newName,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);
    
    if (error) {
      console.error('[EudamedEnrichment] Error updating product name:', error);
      throw error;
    }
  }
  
  /**
   * Get ALL products for a company (for complete reinstallation)
   */
  private static async getAllCompanyProducts(companyId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, udi_di, basic_udi_di, model_reference, trade_name, eudamed_nomenclature_codes, eudamed_issuing_agency, eudamed_device_name, eudamed_trade_names')
      .eq('company_id', companyId)
      .eq('is_archived', false);
    
    if (error) {
      console.error('[EudamedEnrichment] Error fetching all company products:', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * Find the best EUDAMED match for a product
   */
  private static async findBestEudamedMatch(product: any, eudamedDevices: EudamedDevice[]): Promise<EudamedDevice | null> {
    // console.log(`🔍 [EudamedMatching] Finding best match for product "${product.name}"`);
    // console.log(`🔍 [EudamedMatching] Product UDI-DI: "${product.udi_di}"`);
    // console.log(`🔍 [EudamedMatching] Product Basic UDI-DI: "${product.basic_udi_di}"`);
    // console.log(`🔍 [EudamedMatching] Available EUDAMED devices: ${eudamedDevices.length}`);
    
    // Priority 1: Exact UDI-DI match
    if (product.udi_di) {
      // console.log(`🔍 [EudamedMatching] Searching for exact UDI-DI match: "${product.udi_di}"`);
      const exactMatch = eudamedDevices.find(device => device.udi_di === product.udi_di);
      if (exactMatch) {
        // console.log(`✅ [EudamedMatching] Found exact UDI-DI match: "${exactMatch.device_name}"`);
        return exactMatch;
      }
      // console.log(`❌ [EudamedMatching] No exact UDI-DI match found`);
    }
    
    // Priority 2: Basic UDI-DI match
    if (product.basic_udi_di) {
      // console.log(`🔍 [EudamedMatching] Searching for basic UDI-DI match: "${product.basic_udi_di}"`);
      const basicMatch = eudamedDevices.find(device => device.basic_udi_di_code === product.basic_udi_di);
      if (basicMatch) {
        // console.log(`✅ [EudamedMatching] Found basic UDI-DI match: "${basicMatch.device_name}"`);
        return basicMatch;
      }
      // console.log(`❌ [EudamedMatching] No basic UDI-DI match found`);
    }
    
    // Priority 3: Partial UDI-DI match (flexible)
    if (product.udi_di) {
      // console.log(`🔍 [EudamedMatching] Searching for partial UDI-DI matches`);
      const partialMatch = eudamedDevices.find(device => {
        if (!device.udi_di) return false;
        // Check if either UDI contains the other or if they share significant prefix
        return device.udi_di.includes(product.udi_di) || 
               product.udi_di.includes(device.udi_di) ||
               (device.udi_di.length >= 10 && product.udi_di.length >= 10 && 
                device.udi_di.substring(0, 10) === product.udi_di.substring(0, 10));
      });
      if (partialMatch) {
        // console.log(`✅ [EudamedMatching] Found partial UDI-DI match: "${partialMatch.device_name}" (UDI: ${partialMatch.udi_di})`);
        return partialMatch;
      }
      // console.log(`❌ [EudamedMatching] No partial UDI-DI match found`);
    }
    
    // Priority 4: Model reference match
    if (product.model_reference) {
      // console.log(`🔍 [EudamedMatching] Searching for model reference match: "${product.model_reference}"`);
      const modelMatch = eudamedDevices.find(device => 
        device.device_model && device.device_model.toLowerCase().includes(product.model_reference.toLowerCase())
      );
      if (modelMatch) {
        // console.log(`✅ [EudamedMatching] Found model reference match: "${modelMatch.device_name}"`);
        return modelMatch;
      }
      // console.log(`❌ [EudamedMatching] No model reference match found`);
    }
    
    // Priority 5: Enhanced name similarity match (lowered threshold)
    // console.log(`🔍 [EudamedMatching] Searching for name similarity matches (threshold: 0.4)`);
    const nameMatches = eudamedDevices
      .map(device => {
        const deviceName = device.device_name || device.trade_names || '';
        const similarity = this.calculateNameSimilarity(product.name, deviceName);
        return { device, similarity, deviceName };
      })
      .filter(match => match.similarity >= 0.4) // Lowered from 0.7 to 0.4
      .sort((a, b) => b.similarity - a.similarity);
    
    if (nameMatches.length > 0) {
      const bestMatch = nameMatches[0];
      
      return bestMatch.device;
    }
    
    // Priority 6: Trade name fallback
    // console.log(`🔍 [EudamedMatching] Searching for trade name matches`);
    const tradeNameMatch = eudamedDevices.find(device => {
      if (!device.trade_names) return false;
      const tradeName = device.trade_names.toLowerCase();
      const productName = product.name.toLowerCase();
      return tradeName.includes(productName) || productName.includes(tradeName) ||
             this.calculateNameSimilarity(product.name, device.trade_names) >= 0.4;
    });
    
    if (tradeNameMatch) {
      // console.log(`✅ [EudamedMatching] Found trade name match: "${tradeNameMatch.trade_names}"`);
      return tradeNameMatch;
    }
    
    // console.log(`❌ [EudamedMatching] No suitable match found for product "${product.name}"`);
    return null;
  }

  /**
   * Perform complete reinstallation of data from EUDAMED
   */
  private static async performCompleteReinstall(product: any, eudamedDevice: EudamedDevice) {
    // console.log(`🔄 [EudamedReinstall] Starting complete reinstall for "${product.name}"`);
    // console.log(`🔄 [EudamedReinstall] Matched EUDAMED device: "${eudamedDevice.device_name}" (Trade: "${eudamedDevice.trade_names}")`);
    
    const changes: any = {};
    
    // CRITICAL FIX: Use device_name for product name, trade_names for trade name
    if (product.name !== cleanDeviceName(eudamedDevice.device_name) && eudamedDevice.device_name) {
      changes.productName = { old: product.name || '', new: cleanDeviceName(eudamedDevice.device_name) || '' };
      // console.log(`🔄 [EudamedReinstall] Product name change: "${changes.productName.old}" → "${changes.productName.new}"`);
    }
    
    if (product.trade_name !== eudamedDevice.trade_names) {
      changes.tradeName = { old: product.trade_name || '', new: eudamedDevice.trade_names || '' };
      // console.log(`🔄 [EudamedReinstall] Trade name change: "${changes.tradeName.old}" → "${changes.tradeName.new}"`);
    }
    
    if (product.eudamed_device_name !== eudamedDevice.device_name) {
      changes.deviceName = { old: product.eudamed_device_name || '', new: eudamedDevice.device_name || '' };
      // console.log(`🔄 [EudamedReinstall] Device name change: "${changes.deviceName.old}" → "${changes.deviceName.new}"`);
    }
    
    if (product.udi_di !== eudamedDevice.udi_di) {
      changes.udiDi = { old: product.udi_di || '', new: eudamedDevice.udi_di || '' };
      // console.log(`🔄 [EudamedReinstall] UDI-DI change: "${changes.udiDi.old}" → "${changes.udiDi.new}"`);
    }
    
    if (product.eudamed_issuing_agency !== eudamedDevice.issuing_agency) {
      changes.issuingAgency = { old: product.eudamed_issuing_agency || '', new: eudamedDevice.issuing_agency || '' };
      // console.log(`🔄 [EudamedReinstall] Issuing agency change: "${changes.issuingAgency.old}" → "${changes.issuingAgency.new}"`);
    }
    
    // Check EMDN code changes
    const currentEmdnCodes = Array.isArray(product.eudamed_nomenclature_codes) 
      ? product.eudamed_nomenclature_codes 
      : [];
    const newEmdnCodes = Array.isArray(eudamedDevice.nomenclature_codes) 
      ? eudamedDevice.nomenclature_codes 
      : (eudamedDevice.nomenclature_codes ? [eudamedDevice.nomenclature_codes] : []);
    
    if (JSON.stringify(currentEmdnCodes) !== JSON.stringify(newEmdnCodes)) {
      changes.emdnCode = { 
        old: currentEmdnCodes.join(', ') || '', 
        new: newEmdnCodes.join(', ') || '' 
      };
      // console.log(`🔄 [EudamedReinstall] EMDN code change: "${changes.emdnCode.old}" → "${changes.emdnCode.new}"`);
    }
    
    // console.log(`🔄 [EudamedReinstall] Performing complete enrichment...`);
    
    // Perform the complete enrichment
    await this.enrichProduct(product.id, eudamedDevice);
    
    // CRITICAL FIX: Update product name to device_name and trade_name to trade_names
    // console.log(`🔄 [EudamedReinstall] Updating product name to device name: "${eudamedDevice.device_name}"`);
    // console.log(`🔄 [EudamedReinstall] Updating trade_name field to trade names: "${eudamedDevice.trade_names}"`);
    
    const updateData: any = {
      trade_name: eudamedDevice.trade_names,
      updated_at: new Date().toISOString()
    };
    
    // Only update product name if we have a valid device_name and it's different
    if (eudamedDevice.device_name && eudamedDevice.device_name.trim() && 
        eudamedDevice.device_name !== eudamedDevice.trade_names) {
      updateData.name = cleanDeviceName(eudamedDevice.device_name);
      // console.log(`🔄 [EudamedReinstall] Setting product name to official device name: "${updateData.name}"`);
    }
    
    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', product.id);
    
    if (error) {
      console.error('[EudamedEnrichment] Error updating product names:', error);
      throw error;
    }
    
    // console.log(`✅ [EudamedReinstall] Complete reinstall finished for "${product.name}"`);
    // console.log(`✅ [EudamedReinstall] Changes made:`, Object.keys(changes));
    
    return changes;
  }

  /**
   * Get existing products that need EUDAMED enrichment
   */
  private static async getProductsNeedingEnrichment(companyId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, udi_di, basic_udi_di, eudamed_organization')
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .or('eudamed_organization.is.null,eudamed_organization.eq.'); // Products without EUDAMED data
    
    if (error) {
      console.error('[EudamedEnrichment] Error fetching products needing enrichment:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Fetch all EUDAMED devices for a company with optimized batch sizes
   */
  private static async fetchAllCompanyDevices(companyName: string): Promise<EudamedDevice[]> {
    const pageSize = 50; // Reduced from 1000 to 50 to prevent timeouts
    let from = 0;
    let allDevices: EudamedDevice[] = [];
    let retryCount = 0;
    const maxRetries = 3;
    
    while (true) {
      try {
        // console.log(`[EudamedEnrichment] Fetching devices ${from}-${from + pageSize - 1} for ${companyName}`);
        
        const { data, error } = await supabase.rpc('get_eudamed_devices_by_company', {
          company_identifier: companyName,
          limit_count: pageSize,
          offset_count: from
        }) as { data: EudamedDevice[] | null; error: any };
        
        if (error) {
          console.error(`[EudamedEnrichment] Error fetching EUDAMED devices at offset ${from}:`, error);
          
          // Retry on timeout or connection errors
          if (retryCount < maxRetries && (error.message?.includes('timeout') || error.message?.includes('connection'))) {
            retryCount++;
            // console.log(`[EudamedEnrichment] Retrying fetch (attempt ${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            continue;
          }
          
          throw error;
        }
        
        if (!data || data.length === 0) {
          // console.log(`[EudamedEnrichment] No more devices found at offset ${from}`);
          break;
        }
        
        allDevices.push(...data);
        // console.log(`[EudamedEnrichment] Fetched ${data.length} devices, total so far: ${allDevices.length}`);
        
        // Reset retry count on successful fetch
        retryCount = 0;
        
        if (data.length < pageSize) {
          // console.log(`[EudamedEnrichment] Reached end of data (got ${data.length} < ${pageSize})`);
          break;
        }
        
        from += pageSize;
        
        // Add small delay between requests to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          // console.log(`[EudamedEnrichment] Retrying after error (attempt ${retryCount}/${maxRetries}):`, error);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
        
        console.error(`[EudamedEnrichment] Failed to fetch devices after ${maxRetries} retries:`, error);
        throw error;
      }
    }
    
    // console.log(`[EudamedEnrichment] Successfully fetched total of ${allDevices.length} devices for ${companyName}`);
    return allDevices;
  }
  
  /**
   * Find matches between products and EUDAMED devices
   */
  private static async findProductMatches(
    products: any[],
    eudamedDevices: EudamedDevice[]
  ): Promise<ProductMatch[]> {
    const matches: ProductMatch[] = [];
    
    for (const product of products) {
      const potentialMatches: ProductMatch['potentialMatches'] = [];
      
      for (const device of eudamedDevices) {
        // Exact UDI-DI match
        if (product.udi_di && device.udi_di && product.udi_di === device.udi_di) {
          potentialMatches.push({
            eudamedDevice: device,
            matchType: 'exact_udi',
            confidence: 1.0
          });
          continue;
        }
        
        // Basic UDI-DI match
        if (product.basic_udi_di && device.basic_udi_di_code && 
            product.basic_udi_di === device.basic_udi_di_code) {
          potentialMatches.push({
            eudamedDevice: device,
            matchType: 'basic_udi_match',
            confidence: 0.9
          });
          continue;
        }
        
        // Name similarity match - only compare against device_name
        const deviceName = device.device_name;
        if (!deviceName) continue; // Skip if no proper device name
        
        const nameSimilarity = this.calculateNameSimilarity(
          product.name,
          deviceName
        );
        
        if (nameSimilarity >= 0.7) {
          potentialMatches.push({
            eudamedDevice: device,
            matchType: 'name_similarity',
            confidence: nameSimilarity
          });
        }
      }
      
      // Sort matches by confidence
      potentialMatches.sort((a, b) => b.confidence - a.confidence);
      
      matches.push({
        productId: product.id,
        productName: product.name,
        currentUdiDi: product.udi_di,
        potentialMatches: potentialMatches.slice(0, 5) // Top 5 matches
      });
    }
    
    return matches;
  }
  
  /**
   * Calculate name similarity between two strings (enhanced algorithm)
   */
  private static calculateNameSimilarity(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;
    
    const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1.0;
    
    // Enhanced similarity calculation
    const words1 = n1.split(/\s+/).filter(w => w.length > 2); // Filter out short words
    const words2 = n2.split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) {
      // Fallback to simple string inclusion for short names
      return n1.includes(n2) || n2.includes(n1) ? 0.6 : 0;
    }
    
    // Calculate word overlap with partial matching
    let matchScore = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          matchScore += 1.0; // Exact word match
        } else if (word1.includes(word2) || word2.includes(word1)) {
          matchScore += 0.7; // Partial word match
        } else if (this.levenshteinDistance(word1, word2) <= 2 && Math.min(word1.length, word2.length) >= 4) {
          matchScore += 0.5; // Similar words (typos, variations)
        }
      }
    }
    
    // Normalize by the average number of words
    const avgWordCount = (words1.length + words2.length) / 2;
    return Math.min(1.0, matchScore / avgWordCount);
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator   // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Enrich a product with EUDAMED device data
   */
  private static async enrichProduct(productId: string, device: EudamedDevice) {
    const updateData = {
      // Core UDI fields
      udi_di: device.udi_di,
      basic_udi_di: device.basic_udi_di_code,
      device_model: device.device_model,
      class: device.risk_class || 'Unknown',
      
      // All 49 EUDAMED fields
      eudamed_organization: device.organization,
      eudamed_id_srn: device.id_srn,
      eudamed_organization_status: device.organization_status,
      eudamed_address: device.address,
      eudamed_postcode: device.postcode,
      eudamed_country: device.country,
      eudamed_phone: device.phone,
      eudamed_email: device.email,
      eudamed_website: device.website,
      eudamed_prrc_first_name: device.prrc_first_name,
      eudamed_prrc_last_name: device.prrc_last_name,
      eudamed_prrc_email: device.prrc_email,
      eudamed_prrc_phone: device.prrc_phone,
      eudamed_prrc_responsible_for: device.prrc_responsible_for,
      eudamed_prrc_address: device.prrc_address,
      eudamed_prrc_postcode: device.prrc_postcode,
      eudamed_prrc_country: device.prrc_country,
      eudamed_ca_name: device.ca_name,
      eudamed_ca_address: device.ca_address,
      eudamed_ca_postcode: device.ca_postcode,
      eudamed_ca_country: device.ca_country,
      eudamed_ca_email: device.ca_email,
      eudamed_ca_phone: device.ca_phone,
      eudamed_applicable_legislation: device.applicable_legislation,
      eudamed_basic_udi_di_code: device.basic_udi_di_code,
      eudamed_risk_class: device.risk_class,
      eudamed_implantable: device.implantable,
      eudamed_measuring: device.measuring,
      eudamed_reusable: device.reusable,
      eudamed_active: device.active,
      eudamed_administering_medicine: device.administering_medicine,
      eudamed_device_model: device.device_model,
      eudamed_device_name: device.device_name,
      eudamed_issuing_agency: device.issuing_agency,
      eudamed_status: device.status,
      eudamed_nomenclature_codes: device.nomenclature_codes || [],
      eudamed_trade_names: device.trade_names,
      eudamed_reference_number: device.reference_number,
      eudamed_direct_marking: device.direct_marking,
      eudamed_quantity_of_device: device.quantity_of_device,
      eudamed_single_use: device.single_use,
      eudamed_max_reuses: device.max_reuses,
      eudamed_sterilization_need: device.sterilization_need,
      eudamed_sterile: device.sterile,
      eudamed_contain_latex: device.contain_latex,
      eudamed_reprocessed: device.reprocessed,
      eudamed_placed_on_the_market: device.placed_on_the_market ? this.parseEudamedDate(device.placed_on_the_market) : null,
      eudamed_market_distribution: device.market_distribution,
      
      // Update key features with EUDAMED data
      key_features: {
        eudamed_data: {
          trade_names: device.trade_names,
          eudamed_status: device.status,
          issuing_agency: device.issuing_agency || 'eudamed',
          reference_number: device.reference_number,
          nomenclature_codes: device.nomenclature_codes
        }
      },
      
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('products')
      .update(updateData as any)
      .eq('id', productId);
    
    if (error) {
      console.error('[EudamedEnrichment] Error updating product:', error);
      throw error;
    }
  }
  
  /**
   * Safely parse EUDAMED date values
   */
  private static parseEudamedDate(dateValue: any): string | null {
    if (!dateValue) return null;
    
    try {
      // Handle various date formats from EUDAMED
      let date: Date;
      
      if (typeof dateValue === 'string') {
        // Common EUDAMED date formats
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateValue + 'T00:00:00Z');
        } else if (dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const [day, month, year] = dateValue.split('/');
          date = new Date(`${year}-${month}-${day}T00:00:00Z`);
        } else {
          date = new Date(dateValue);
        }
      } else {
        date = new Date(dateValue);
      }
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn(`[EudamedEnrichment] Invalid date value: "${dateValue}"`);
        return null;
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn(`[EudamedEnrichment] Error parsing date "${dateValue}":`, error);
      return null;
    }
  }
}