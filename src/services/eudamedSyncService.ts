import { supabase } from '@/integrations/supabase/client';

export interface EudamedSyncResult {
  success: boolean;
  duplicatesMerged: number;
  newProductsCreated: number;
  existingProductsUpdated: number;
  errors: string[];
}

export interface SyncStatus {
  id: string;
  company_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  sync_type: 'manual' | 'auto' | 'cleanup';
  last_sync_at?: string;
  duplicates_found: number;
  duplicates_merged: number;
  new_products_created: number;
  errors: string[];
  started_at: string;
  completed_at?: string;
}

class EudamedSyncService {
  
  async getCompanySyncStatus(companyId: string): Promise<SyncStatus | null> {
    try {
      // Return a default status for now since table might not be in types yet
      return {
        id: crypto.randomUUID(),
        company_id: companyId,
        status: 'pending',
        sync_type: 'manual',
        duplicates_found: 0,
        duplicates_merged: 0,
        new_products_created: 0,
        errors: [],
        started_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getCompanySyncStatus:', error);
      return null;
    }
  }

  async performFullSync(
    companyId: string,
    progressCallback?: (processed: number, total: number, operation: string) => void
  ): Promise<EudamedSyncResult> {
    const errors: string[] = [];
    let mergedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    try {
      progressCallback?.(10, 100, 'Starting synchronization...');

      // Step 1: Get company information
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name, srn')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        throw new Error('Company not found');
      }

      progressCallback?.(20, 100, 'Fetching EUDAMED devices...');

      // Step 2: Get EUDAMED devices for this company
      const { data: eudamedDevices, error: eudamedError } = await supabase
        .rpc('get_eudamed_devices_by_company', {
          company_identifier: company.name,
          limit_count: 200
        });

      if (eudamedError) {
        errors.push(`Failed to fetch EUDAMED devices: ${eudamedError.message}`);
        throw eudamedError;
      }

      progressCallback?.(40, 100, 'Fetching company products...');

      // Step 3: Get existing products for this company
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, udi_di, eudamed_device_name, eudamed_organization, eudamed_trade_names, eudamed_risk_class, eudamed_status, eudamed_nomenclature_codes, eudamed_issuing_agency, eudamed_reference_number, key_technology_characteristics')
      .eq('company_id', companyId)
      .eq('is_archived', false);

      if (productsError) {
        errors.push(`Failed to fetch company products: ${productsError.message}`);
        throw productsError;
      }

      progressCallback?.(50, 100, 'Updating existing products with EUDAMED data...');

      // Step 4: Update existing products with missing EUDAMED data
      updatedCount = await this.updateExistingProductsWithEudamedData(
        companyId, 
        eudamedDevices || [], 
        existingProducts || []
      );

      progressCallback?.(60, 100, 'Identifying duplicates and missing products...');

      // Step 5: Clean up duplicates
      const duplicateProducts = this.findDuplicateProducts(existingProducts || []);
      
      if (duplicateProducts.length > 0) {
        progressCallback?.(70, 100, `Merging ${duplicateProducts.length} duplicate products...`);
        mergedCount = await this.mergeDuplicateProducts(duplicateProducts);
      }

      progressCallback?.(80, 100, 'Creating missing products...');

      // Step 6: Create missing products from EUDAMED
      const missingDevices = this.findMissingProducts(eudamedDevices || [], existingProducts || []);
      
      if (missingDevices.length > 0) {
        createdCount = await this.createMissingProducts(companyId, missingDevices);
      }

      progressCallback?.(100, 100, 'Synchronization completed');

      return {
        success: true,
        duplicatesMerged: mergedCount,
        newProductsCreated: createdCount,
        existingProductsUpdated: updatedCount,
        errors: errors
      };

    } catch (error) {
      console.error('Sync failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        duplicatesMerged: mergedCount,
        newProductsCreated: createdCount,
        existingProductsUpdated: updatedCount,
        errors: errors
      };
    }
  }

  private findDuplicateProducts(products: any[]): any[][] {
    const udiDiGroups: { [key: string]: any[] } = {};
    
    // Group products by UDI-DI
    products.forEach(product => {
      if (product.udi_di) {
        if (!udiDiGroups[product.udi_di]) {
          udiDiGroups[product.udi_di] = [];
        }
        udiDiGroups[product.udi_di].push(product);
      }
    });

    // Return groups with more than one product (duplicates)
    return Object.values(udiDiGroups).filter(group => group.length > 1);
  }

  private async mergeDuplicateProducts(duplicateGroups: any[][]): Promise<number> {
    let mergedCount = 0;

    for (const group of duplicateGroups) {
      try {
        // Keep the first product, archive the rest
        const [keepProduct, ...duplicates] = group;
        
        for (const duplicate of duplicates) {
          const { error } = await supabase
            .from('products')
            .update({
              is_archived: true,
              archived_at: new Date().toISOString(),
              archived_by: null // System archival
            })
            .eq('id', duplicate.id);

          if (error) {
            console.error(`Failed to archive duplicate product ${duplicate.id}:`, error);
          } else {
            mergedCount++;
          }
        }
      } catch (error) {
        console.error('Error merging duplicate group:', error);
      }
    }

    return mergedCount;
  }

  private async updateExistingProductsWithEudamedData(
    companyId: string, 
    eudamedDevices: any[], 
    existingProducts: any[]
  ): Promise<number> {
    let updatedCount = 0;
    
    console.log(`[EUDAMED Sync] Starting update process for ${eudamedDevices.length} EUDAMED devices and ${existingProducts.length} existing products`);
    
    // Create a map for faster lookups
    const existingProductsMap = new Map(
      existingProducts.map(p => [p.udi_di, p])
    );
    
    for (const device of eudamedDevices) {
      if (!device.udi_di) continue;
      
      const existingProduct = existingProductsMap.get(device.udi_di);
      
      if (existingProduct) {
        const needsUpdate = this.needsEudamedUpdate(existingProduct, device);
        
        if (needsUpdate) {
          try {
            const updateData = this.buildEudamedUpdateData(device, existingProduct);
            
            const { error } = await supabase
              .from('products')
              .update(updateData)
              .eq('id', existingProduct.id)
              .eq('company_id', companyId);
            
            if (error) {
              console.error(`Failed to update product ${existingProduct.id}:`, error);
            } else {
              updatedCount++;
              console.log(`[EUDAMED Sync] Successfully updated product ${existingProduct.id}`);
            }
          } catch (error) {
            console.error(`Error updating product ${existingProduct.id}:`, error);
          }
        }
      } else {
        console.log(`[EUDAMED Sync] No existing product found for UDI: ${device.udi_di}`);
      }
    }
    
    console.log(`[EUDAMED Sync] Update process completed. Updated ${updatedCount} products.`);
    return updatedCount;
  }

  private needsEudamedUpdate(existingProduct: any, eudamedDevice: any): boolean {
    // Check if any critical EUDAMED fields are missing in the product
    const criticalFields = [
      { productField: 'eudamed_device_name', eudamedField: 'device_name' },
      { productField: 'eudamed_organization', eudamedField: 'organization' },
      { productField: 'eudamed_trade_names', eudamedField: 'trade_names' },
      { productField: 'eudamed_risk_class', eudamedField: 'risk_class' },
      { productField: 'eudamed_status', eudamedField: 'status' },
      { productField: 'eudamed_nomenclature_codes', eudamedField: 'nomenclature_codes' },
      { productField: 'eudamed_issuing_agency', eudamedField: 'issuing_agency' },
      { productField: 'eudamed_reference_number', eudamedField: 'reference_number' },
      { productField: 'eudamed_device_model', eudamedField: 'device_model' },
      { productField: 'eudamed_basic_udi_di_code', eudamedField: 'basic_udi_di_code' },
      { productField: 'eudamed_id_srn', eudamedField: 'id_srn' }
    ];
    
    const hasMissingEudamedFields = criticalFields.some(field => 
      !existingProduct[field.productField] && eudamedDevice[field.eudamedField]
    );
    
    // Check if technical characteristics need updating
    const needsTechnicalUpdate = this.needsTechnicalCharacteristicsUpdate(existingProduct, eudamedDevice);
    
    return hasMissingEudamedFields || needsTechnicalUpdate;
  }

  private needsTechnicalCharacteristicsUpdate(existingProduct: any, eudamedDevice: any): boolean {
    // Parse existing technical characteristics
    let existingCharacteristics = {};
    try {
      existingCharacteristics = existingProduct.key_technology_characteristics || {};
    } catch (e) {
      console.log(`[EUDAMED Sync] Error parsing existing characteristics for product ${existingProduct.id}:`, e);
    }
    
    // Map EUDAMED device characteristics to our technical characteristics
    const eudamedCharacteristics = this.mapEudamedToTechnicalCharacteristics(eudamedDevice);
    
    const hasDifferences = Object.entries(eudamedCharacteristics).some(([key, value]) => {
      if (value === undefined || value === null) return false;
      
      const existingValue = existingCharacteristics[key];
      return existingValue !== value;
    });
    
    return hasDifferences;
  }

  private mapEudamedToTechnicalCharacteristics(device: any): any {
    const characteristics: any = {};
 
    if (device.implantable !== undefined && device.implantable !== null) {
      characteristics.isImplantable = this.parseBooleanValue(device.implantable);
    }
    
    if (device.measuring !== undefined && device.measuring !== null) {
      characteristics.hasMeasuringFunction = this.parseBooleanValue(device.measuring);
    }
    
    if (device.reusable !== undefined && device.reusable !== null) {
      characteristics.isReusable = this.parseBooleanValue(device.reusable);
    }
    
    if (device.active !== undefined && device.active !== null) {
      characteristics.isActive = this.parseBooleanValue(device.active);
    }
    
    if (device.administering_medicine !== undefined && device.administering_medicine !== null) {
      characteristics.incorporatesMedicinalSubstance = this.parseBooleanValue(device.administering_medicine);
    }
    
    if (device.single_use !== undefined && device.single_use !== null) {
      characteristics.isSingleUse = this.parseBooleanValue(device.single_use);
    }
    
    if (device.sterile !== undefined && device.sterile !== null) {
      characteristics.isDeliveredSterile = this.parseBooleanValue(device.sterile);
    }
    
    if (device.sterilization_need !== undefined && device.sterilization_need !== null) {
      characteristics.canBeSterilized = this.parseBooleanValue(device.sterilization_need);
    }
    
    if (device.contain_latex !== undefined && device.contain_latex !== null) {
      characteristics.containsLatex = this.parseBooleanValue(device.contain_latex);
    }
    
    if (device.reprocessed !== undefined && device.reprocessed !== null) {
      characteristics.isReprocessed = this.parseBooleanValue(device.reprocessed);
    }
    
    if (device.direct_marking !== undefined && device.direct_marking !== null) {
      characteristics.hasDirectMarking = this.parseBooleanValue(device.direct_marking);
    }
    
    if (device.max_reuses !== undefined && device.max_reuses > 0) {
      characteristics.maxReuses = device.max_reuses;
      if (characteristics.isReusable === undefined) {
        characteristics.isReusable = true;
      }
    }
    
    return characteristics;
  }

  /**
   * Parse EUDAMED boolean values that can be stored as text ('y'/'n', 'true'/'false', '1'/'0')
   */
  private parseBooleanValue(value: any): boolean {
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      const result = lowerValue === 'y' || lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
      return result;
    }
    
    if (typeof value === 'number') {
      const result = value === 1;
      return result;
    }
    
    return false;
  }

  private buildEudamedUpdateData(device: any, existingProduct?: any): any {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Map EUDAMED risk class to standard product class field
    if (device.risk_class) {
      const { mapEudamedRiskClass } = require('@/utils/deviceClassUtils');
      const standardClass = mapEudamedRiskClass(device.risk_class);
      if (standardClass) {
        updateData.class = `class-${standardClass.toLowerCase()}`;
      }
    }
    
    // Auto-set EU market regulatory status to CE_MARKED if not already set
    this.updateEuMarketStatus(updateData, existingProduct);
    
    // Only include fields that have values in EUDAMED
    if (device.device_name) updateData.eudamed_device_name = device.device_name;
    if (device.organization) updateData.eudamed_organization = device.organization;
    if (device.trade_names) updateData.eudamed_trade_names = device.trade_names;
    if (device.risk_class) updateData.eudamed_risk_class = device.risk_class;
    if (device.status) updateData.eudamed_status = device.status;
    if (device.nomenclature_codes) updateData.eudamed_nomenclature_codes = device.nomenclature_codes;
    if (device.issuing_agency) updateData.eudamed_issuing_agency = device.issuing_agency;
    if (device.reference_number) updateData.eudamed_reference_number = device.reference_number;
    
    // Add additional EUDAMED fields that might be available
    if (device.id_srn) updateData.eudamed_id_srn = device.id_srn;
    if (device.organization_status) updateData.eudamed_organization_status = device.organization_status;
    if (device.address) updateData.eudamed_address = device.address;
    if (device.postcode) updateData.eudamed_postcode = device.postcode;
    if (device.country) updateData.eudamed_country = device.country;
    if (device.phone) updateData.eudamed_phone = device.phone;
    if (device.email) updateData.eudamed_email = device.email;
    if (device.website) updateData.eudamed_website = device.website;
    if (device.device_model) updateData.eudamed_device_model = device.device_model;
    if (device.basic_udi_di_code) updateData.eudamed_basic_udi_di_code = device.basic_udi_di_code;
    
    const technicalCharacteristics = this.mapEudamedToTechnicalCharacteristics(device);
    if (Object.keys(technicalCharacteristics).length > 0) {
      let mergedCharacteristics = {};
      if (existingProduct?.key_technology_characteristics) {
        try {
          mergedCharacteristics = { ...existingProduct.key_technology_characteristics };
        } catch (e) {
          console.log(`[EUDAMED Sync] Error parsing existing characteristics:`, e);
        }
      }
      
      // Only update characteristics that are missing or false in existing data
      Object.entries(technicalCharacteristics).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const existingValue = mergedCharacteristics[key];
          mergedCharacteristics[key] = value;
        }
      });
      
      updateData.key_technology_characteristics = mergedCharacteristics;
    }
    
    return updateData;
  }

  private updateEuMarketStatus(updateData: any, existingProduct: any): void {
    try {
      let markets = [];
      
      // Parse existing markets
      if (existingProduct?.markets) {
        if (typeof existingProduct.markets === 'string') {
          markets = JSON.parse(existingProduct.markets);
        } else if (Array.isArray(existingProduct.markets)) {
          markets = existingProduct.markets;
        }
      }
      
      // Find EU market
      const euMarketIndex = markets.findIndex((m: any) => m.code === 'EU');
      
      if (euMarketIndex >= 0) {
        // Update existing EU market with CE_MARKED if not already set
        const euMarket = markets[euMarketIndex];
        if (!euMarket.regulatoryStatus || euMarket.regulatoryStatus === '') {
          euMarket.regulatoryStatus = 'CE_MARKED';
          if (!euMarket.marketLaunchStatus) {
            euMarket.marketLaunchStatus = 'launched';
            euMarket.actualLaunchDate = new Date().toISOString();
          }
          updateData.markets = JSON.stringify(markets);
        }
      } else {
        // Add EU market with CE_MARKED status
        const euMarket = {
          code: 'EU',
          name: 'European Union',
          selected: true,
          riskClass: 'I', // Will be updated from EUDAMED data
          regulatoryStatus: 'CE_MARKED',
          marketLaunchStatus: 'launched',
          actualLaunchDate: new Date().toISOString()
        };
        markets.push(euMarket);
        updateData.markets = JSON.stringify(markets);
      }
    } catch (error) {
      console.error('Error updating EU market status:', error);
    }
  }

  /**
   * Bulk update existing products with EUDAMED data for regulatory status and risk classification
   */
  async bulkUpdateEudamedRegulatoryStatus(companyId: string): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updatedCount = 0;

    try {
      // Get all products with EUDAMED data but missing proper regulatory status
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, markets, eudamed_risk_class, class')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .not('eudamed_risk_class', 'is', null);

      if (fetchError) {
        errors.push(`Failed to fetch products: ${fetchError.message}`);
        return { updated: 0, errors };
      }

      if (!products || products.length === 0) {
        return { updated: 0, errors: ['No products with EUDAMED data found'] };
      }

      for (const product of products) {
        try {
          let needsUpdate = false;
          const updateData: any = {};

          // Update class field from EUDAMED risk class if missing or different
          if (product.eudamed_risk_class) {
            const { mapEudamedRiskClass } = require('@/utils/deviceClassUtils');
            const standardClass = mapEudamedRiskClass(product.eudamed_risk_class);
            const expectedClass = `class-${standardClass.toLowerCase()}`;
            
            if (product.class !== expectedClass) {
              updateData.class = expectedClass;
              needsUpdate = true;
            }
          }

          // Check and update EU market regulatory status
          let markets = [];
          if (product.markets) {
            try {
              markets = typeof product.markets === 'string' 
                ? JSON.parse(product.markets) 
                : product.markets;
            } catch (e) {
              console.error(`Error parsing markets for product ${product.id}:`, e);
              continue;
            }
          }

          const euMarketIndex = markets.findIndex((m: any) => m.code === 'EU');
          if (euMarketIndex >= 0) {
            const euMarket = markets[euMarketIndex];
            
            // Auto-set CE_MARKED if not already set or if launched without proper status
            if (euMarket.marketLaunchStatus === 'launched' && 
                (!euMarket.regulatoryStatus || euMarket.regulatoryStatus === '')) {
              euMarket.regulatoryStatus = 'CE_MARKED';
              updateData.markets = JSON.stringify(markets);
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            updateData.updated_at = new Date().toISOString();
            
            const { error: updateError } = await supabase
              .from('products')
              .update(updateData)
              .eq('id', product.id)
              .eq('company_id', companyId);

            if (updateError) {
              errors.push(`Failed to update product ${product.id}: ${updateError.message}`);
            } else {
              updatedCount++;
            }
          }
        } catch (error) {
          errors.push(`Error processing product ${product.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { updated: updatedCount, errors };
      
    } catch (error) {
      errors.push(`Bulk update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { updated: updatedCount, errors };
    }
  }

  private findMissingProducts(eudamedDevices: any[], existingProducts: any[]): any[] {
    const existingUdiDis = new Set(existingProducts.map(p => p.udi_di).filter(Boolean));
    
    return eudamedDevices.filter(device => 
      device.udi_di && !existingUdiDis.has(device.udi_di)
    );
  }

  private async createMissingProducts(companyId: string, missingDevices: any[]): Promise<number> {
    let createdCount = 0;

    for (const device of missingDevices) {
      try {
        // Map EUDAMED risk class to standard format
        const { mapEudamedRiskClass } = require('@/utils/deviceClassUtils');
        const standardRiskClass = mapEudamedRiskClass(device.risk_class);
        const productClass = standardRiskClass ? `class-${standardRiskClass.toLowerCase()}` : 'class-i';
        
        // Auto-set EU market as launched for EUDAMED imports with CE_MARKED status
        const euMarket = {
          code: 'EU',
          name: 'European Union',
          selected: true,
          riskClass: standardRiskClass || 'I',
          regulatoryStatus: 'CE_MARKED',
          marketLaunchStatus: 'launched',
          actualLaunchDate: device.placed_on_the_market || new Date().toISOString()
        };

        const { error } = await supabase
          .from('products')
           .insert({
            company_id: companyId,
            name: device.device_name || device.trade_names || 'Imported from EUDAMED',
            udi_di: device.udi_di,
            class: productClass,
            eudamed_device_name: device.device_name,
            eudamed_organization: device.organization,
            eudamed_trade_names: device.trade_names,
            device_model: device.device_model,
            status: 'Active',
            launch_status: 'launched',
            device_type: 'Legacy Device',
            project_types: JSON.stringify(['Legacy Device']),
            current_lifecycle_phase: 'Post-Market Surveillance',
            source: 'eudamed_import',
            markets: JSON.stringify([euMarket]),
            market_launch_dates: JSON.stringify({ 'EU': device.placed_on_the_market || new Date().toISOString() }),
            key_technology_characteristics: JSON.stringify(this.mapEudamedToTechnicalCharacteristics(device))
          } as any);

        if (error) {
          console.error(`Failed to create product for UDI-DI ${device.udi_di}:`, error);
        } else {
          createdCount++;
        }
      } catch (error) {
        console.error('Error creating missing product:', error);
      }
    }

    return createdCount;
  }
}

export const eudamedSyncService = new EudamedSyncService();
