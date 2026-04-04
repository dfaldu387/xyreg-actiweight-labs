import { supabase } from "@/integrations/supabase/client";
import { EnhancedPhaseSyncService } from './enhancedPhaseSyncService';

/** Strip trailing parenthesized UDI-DI from EUDAMED device names */
export function cleanDeviceName(deviceName: string | null): string {
  if (!deviceName) return '';
  return deviceName.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export interface EudamedImportResult {
  success: boolean;
  totalEudamedDevices: number;
  existingProducts: number;
  newProductsCreated: number;
  errors: string[];
  details: Array<{
    action: string;
    item: string;
    result: string;
  }>;
}

export interface EudamedDevice {
  udi_di: string;
  organization: string;
  id_srn: string;
  organization_status?: string;
  address?: string;
  postcode?: string;
  country: string | null;
  phone?: string;
  email?: string;
  website?: string;
  prrc_first_name?: string;
  prrc_last_name?: string;
  prrc_email?: string;
  prrc_phone?: string;
  prrc_responsible_for?: string;
  prrc_address?: string;
  prrc_postcode?: string;
  prrc_country?: string;
  ca_name?: string;
  ca_address?: string;
  ca_postcode?: string;
  ca_country?: string;
  ca_email?: string;
  ca_phone?: string;
  applicable_legislation?: string;
  basic_udi_di_code: string | null;
  risk_class: string | null;
  implantable?: boolean;
  measuring?: boolean;
  reusable?: boolean;
  active?: boolean;
  administering_medicine?: boolean;
  device_model: string | null;
  device_name: string | null;
  issuing_agency?: string;
  status?: string;
  nomenclature_codes?: any; // EMDN codes
  trade_names: string | null;
  reference_number?: string;
  direct_marking?: boolean;
  quantity_of_device?: string;
  single_use?: boolean;
  max_reuses?: number;
  sterilization_need?: boolean;
  sterile?: boolean;
  contain_latex?: boolean;
  reprocessed?: boolean;
  placed_on_the_market?: string;
  market_distribution?: string;
}

/**
 * Enhanced EUDAMED Product Import Service
 * Imports missing UDI-DIs from EUDAMED database into products table
 */
export class EudamedProductImportService {
  
  /**
   * Import selected devices from EUDAMED database
   */
  static async importSelectedDevices(
    companyId: string,
    selectedDevices: EudamedDevice[],
    onProgress?: (processed: number, total: number, operation: string) => void
  ): Promise<EudamedImportResult> {
    // console.log('[EudamedImport] Starting import of selected devices');
    
    try {
      if (selectedDevices.length === 0) {
        return {
          success: true,
          totalEudamedDevices: 0,
          existingProducts: 0,
          newProductsCreated: 0,
          errors: [],
          details: [{
            action: 'import_complete',
            item: 'no_devices',
            result: 'No devices selected for import'
          }]
        };
      }

      onProgress?.(0, 100, `Preparing to import ${selectedDevices.length} selected devices...`);

      // Get existing products for this company
      onProgress?.(10, 100, 'Checking existing products...');
      const existingProducts = await this.getExistingProducts(companyId);
      const existingUdiDis = new Set(existingProducts.map(p => p.udi_di).filter(Boolean));

      // Filter out devices that already exist as products
      const devicesToImport = selectedDevices.filter(device => 
        device.udi_di && !existingUdiDis.has(device.udi_di)
      );

      // console.log(`[EudamedImport] Selected devices: ${selectedDevices.length}, already exist: ${selectedDevices.length - devicesToImport.length}, to import: ${devicesToImport.length}`);

      if (devicesToImport.length === 0) {
        return {
          success: true,
          totalEudamedDevices: selectedDevices.length,
          existingProducts: existingProducts.length,
          newProductsCreated: 0,
          errors: [],
          details: [{
            action: 'import_complete',
            item: 'all_devices',
            result: 'All selected devices already exist as products'
          }]
        };
      }

      // Import devices in batches
      const batchSize = 25;
      let created = 0;
      const errors: string[] = [];

      for (let i = 0; i < devicesToImport.length; i += batchSize) {
        const batch = devicesToImport.slice(i, i + batchSize);
        const progress = Math.round(20 + (i / devicesToImport.length) * 70);
        
        onProgress?.(progress, 100, `Importing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(devicesToImport.length/batchSize)}...`);
        
        try {
          const batchResult = await this.importBatch(batch, companyId);
          created += batchResult.created;
          
          if (batchResult.errors.length > 0) {
            errors.push(...batchResult.errors);
          }
          
          // console.log(`[EudamedImport] Batch ${Math.floor(i/batchSize) + 1}: created ${batchResult.created}, errors: ${batchResult.errors.length}`);
          
        } catch (error) {
          console.error(`[EudamedImport] Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
          errors.push(`Batch ${Math.floor(i/batchSize) + 1} failed: ${error}`);
        }
      }

      onProgress?.(100, 100, 'Import complete!');

      return {
        success: errors.length === 0,
        totalEudamedDevices: selectedDevices.length,
        existingProducts: existingProducts.length,
        newProductsCreated: created,
        errors,
        details: [
          {
            action: 'selected_devices',
            item: 'total',
            result: selectedDevices.length.toString()
          },
          {
            action: 'existing_products',
            item: 'current',
            result: existingProducts.length.toString()
          },
          {
            action: 'new_products_created',
            item: 'imported',
            result: created.toString()
          },
          {
            action: 'final_total',
            item: 'products',
            result: (existingProducts.length + created).toString()
          }
        ]
      };
      
    } catch (error) {
      console.error('[EudamedImport] Selected device import failed:', error);
      return {
        success: false,
        totalEudamedDevices: selectedDevices.length,
        existingProducts: 0,
        newProductsCreated: 0,
        errors: [`Import failed: ${error}`],
        details: []
      };
    }
  }

  /**
   * Import all missing products from EUDAMED database for any company (legacy method)
   */
  static async importMissingProducts(
    companyId: string,
    onProgress?: (processed: number, total: number, operation: string) => void
  ): Promise<EudamedImportResult> {
    // console.log('[EudamedImport] Starting import of missing products from EUDAMED');
    
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
      
      // Step 1: Get all devices from EUDAMED for this company
      onProgress?.(0, 100, `Fetching ${company.name} devices from EUDAMED...`);
      
      const eudamedDevices = await this.fetchAllCompanyDevices(company.name);
      const totalDevices = eudamedDevices.length;
      
      // console.log(`[EudamedImport] Found ${totalDevices} devices for ${company.name} in EUDAMED`);
      
      // Step 2: Get existing products for this company
      onProgress?.(10, 100, 'Checking existing products...');
      
      const existingProducts = await this.getExistingProducts(companyId);
      const existingUdiDis = new Set(existingProducts.map(p => p.udi_di).filter(Boolean));
      
      // console.log(`[EudamedImport] Found ${existingProducts.length} existing products`);
      
      // Step 3: Check which products need EUDAMED enrichment
      const productsNeedingEnrichment = existingProducts.filter(p => 
        p.udi_di && !p.eudamed_organization
      );
      
      // Step 4: Filter to only missing devices (devices not in existing products)
      const missingDevices = eudamedDevices.filter(device => 
        device.udi_di && !existingUdiDis.has(device.udi_di)
      );
      
      // console.log(`[EudamedImport] Products needing EUDAMED enrichment: ${productsNeedingEnrichment.length}`);
      // console.log(`[EudamedImport] New devices to import: ${missingDevices.length}`);
      
      // Step 5: Enrich existing products with EUDAMED data
      let enrichedCount = 0;
      const enrichmentErrors: string[] = [];
      
      if (productsNeedingEnrichment.length > 0) {
        onProgress?.(15, 100, `Enriching ${productsNeedingEnrichment.length} existing products...`);
        
        for (const product of productsNeedingEnrichment) {
          const matchingDevice = eudamedDevices.find(device => device.udi_di === product.udi_di);
          if (matchingDevice) {
            try {
              await this.enrichExistingProduct(product.id, matchingDevice);
              enrichedCount++;
            } catch (error) {
              console.error(`[EudamedImport] Failed to enrich product ${product.name}:`, error);
              enrichmentErrors.push(`Failed to enrich ${product.name}: ${error}`);
            }
          }
        }
      }
      
      // console.log(`[EudamedImport] Enriched ${enrichedCount} existing products`);
      // console.log(`[EudamedImport] Need to import ${missingDevices.length} missing devices`);
      
      if (missingDevices.length === 0 && enrichedCount === 0) {
        return {
          success: true,
          totalEudamedDevices: totalDevices,
          existingProducts: existingProducts.length,
          newProductsCreated: 0,
          errors: enrichmentErrors,
          details: [{
            action: 'import_complete',
            item: 'all_devices',
            result: 'All devices already imported and enriched'
          }]
        };
      }
      
      // Step 6: Import missing devices in batches
      const batchSize = 25; // Reduced from 100 to 25 for more granular progress and error handling
      let created = 0;
      const errors: string[] = [];
      
      for (let i = 0; i < missingDevices.length; i += batchSize) {
        const batch = missingDevices.slice(i, i + batchSize);
        const progress = Math.round(20 + (i / missingDevices.length) * 70);
        
        onProgress?.(progress, 100, `Importing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(missingDevices.length/batchSize)}...`);
        
        try {
          const batchResult = await this.importBatch(batch, companyId);
          created += batchResult.created;
          
          if (batchResult.errors.length > 0) {
            errors.push(...batchResult.errors);
          }
          
          // console.log(`[EudamedImport] Batch ${Math.floor(i/batchSize) + 1}: created ${batchResult.created}, errors: ${batchResult.errors.length}`);
          
        } catch (error) {
          console.error(`[EudamedImport] Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
          errors.push(`Batch ${Math.floor(i/batchSize) + 1} failed: ${error}`);
        }
      }
      
      onProgress?.(100, 100, 'Import complete!');
      
      // Combine all errors
      const allErrors = [...errors, ...enrichmentErrors];
      
      return {
        success: allErrors.length === 0,
        totalEudamedDevices: totalDevices,
        existingProducts: existingProducts.length,
        newProductsCreated: created,
        errors: allErrors,
        details: [
          {
            action: 'eudamed_devices_found',
            item: 'total',
            result: totalDevices.toString()
          },
          {
            action: 'existing_products',
            item: 'current',
            result: existingProducts.length.toString()
          },
          {
            action: 'products_enriched',
            item: 'enriched',
            result: enrichedCount.toString()
          },
          {
            action: 'new_products_created',
            item: 'imported',
            result: created.toString()
          },
          {
            action: 'final_total',
            item: 'products',
            result: (existingProducts.length + created).toString()
          }
        ]
      };
      
    } catch (error) {
      console.error('[EudamedImport] Import failed:', error);
      return {
        success: false,
        totalEudamedDevices: 0,
        existingProducts: 0,
        newProductsCreated: 0,
        errors: [`Import failed: ${error}`],
        details: []
      };
    }
  }
  
  /**
   * Fetch all devices from EUDAMED database for a company with optimized batch sizes
   */
  private static async fetchAllCompanyDevices(companyName: string): Promise<EudamedDevice[]> {
    const pageSize = 50; // Reduced from 1000 to 50 to prevent timeouts
    let from = 0;
    let allDevices: EudamedDevice[] = [];
    let retryCount = 0;
    const maxRetries = 3;
    
    while (true) {
      try {
        // console.log(`[EudamedImport] Fetching devices ${from}-${from + pageSize - 1} for ${companyName}`);
        
        const { data, error } = await supabase.rpc('get_eudamed_devices_by_company', {
          company_identifier: companyName,
          limit_count: pageSize,
          offset_count: from
        }) as { data: EudamedDevice[] | null; error: any };
        
        if (error) {
          console.error(`[EudamedImport] Error fetching EUDAMED devices at offset ${from}:`, error);
          
          // Retry on timeout or connection errors
          if (retryCount < maxRetries && (error.message?.includes('timeout') || error.message?.includes('connection'))) {
            retryCount++;
            // console.log(`[EudamedImport] Retrying fetch (attempt ${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            continue;
          }
          
          throw error;
        }
        
        if (!data || data.length === 0) {
          // console.log(`[EudamedImport] No more devices found at offset ${from}`);
          break;
        }
        
        allDevices.push(...data);
        // console.log(`[EudamedImport] Fetched ${data.length} devices, total so far: ${allDevices.length}`);
        
        // Reset retry count on successful fetch
        retryCount = 0;
        
        if (data.length < pageSize) {
          // console.log(`[EudamedImport] Reached end of data (got ${data.length} < ${pageSize})`);
          break;
        }
        
        from += pageSize;
        
        // Add small delay between requests to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          // console.log(`[EudamedImport] Retrying after error (attempt ${retryCount}/${maxRetries}):`, error);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
        
        console.error(`[EudamedImport] Failed to fetch devices after ${maxRetries} retries:`, error);
        throw error;
      }
    }
    
    // console.log(`[EudamedImport] Successfully fetched total of ${allDevices.length} devices for ${companyName}`);
    return allDevices;
  }
  
  /**
   * Get existing products for a company
   */
  private static async getExistingProducts(companyId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, udi_di, eudamed_organization')
      .eq('company_id', companyId)
      .not('udi_di', 'is', null);
    
    if (error) {
      console.error('[EudamedImport] Error fetching existing products:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Enrich an existing product with EUDAMED device data
   */
  private static async enrichExistingProduct(productId: string, device: EudamedDevice) {
    const updateData = {
      // Core UDI fields
      basic_udi_di: device.basic_udi_di_code,
      model_reference: device.device_model,
      class: device.risk_class || 'Unknown',
      
      // All EUDAMED fields
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
      eudamed_device_name: cleanDeviceName(device.device_name) || device.device_name,
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
      eudamed_placed_on_the_market: device.placed_on_the_market ? new Date(device.placed_on_the_market).toISOString().split('T')[0] : null,
      eudamed_market_distribution: device.market_distribution,
      
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);
    
    if (error) {
      console.error('[EudamedImport] Error enriching existing product:', error);
      throw error;
    }
  }
  
   /**
    * Import a batch of devices as products
    */
   private static async importBatch(devices: EudamedDevice[], companyId: string) {
     const productData = devices.map(device => {
     // Use device's actual placed_on_the_market date from EUDAMED, fallback to 2020-01-01
     const launchDateStr = device.placed_on_the_market
       ? new Date(device.placed_on_the_market).toISOString().split('T')[0]
       : '2020-01-01';

     return {
       company_id: companyId,
       name: cleanDeviceName(device.device_name) || `Device ${device.udi_di.slice(-8)}`,
        udi_di: device.udi_di,
        basic_udi_di: device.basic_udi_di_code,
        model_reference: device.device_model,
        status: 'Active',
       class: device.risk_class || 'Unknown',
       product_market: device.country || 'EU',
       project_types: ['Legacy Device'],
       description: `Legacy device imported from EUDAMED registry. UDI-DI: ${device.udi_di}. Device Type: ${device.device_model || 'Unknown'}. Risk Class: ${device.risk_class || 'Unknown'}`,
       // EU market auto-configured from EUDAMED
       markets: [{
         code: 'EU',
         name: 'European Union',
         selected: true,
         riskClass: device.risk_class || undefined,
         regulatoryStatus: 'CE_MARKED',
         marketLaunchStatus: 'launched',
         actualLaunchDate: launchDateStr,
       }],
        actual_launch_date: launchDateStr,
        projected_launch_date: launchDateStr,
        project_start_date: launchDateStr,
       launch_status: 'launched' as const,
       current_lifecycle_phase: 'Post-Market Surveillance',
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
       eudamed_placed_on_the_market: device.placed_on_the_market ? new Date(device.placed_on_the_market).toISOString().split('T')[0] : null,
       eudamed_market_distribution: device.market_distribution,
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
     }; });
    
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select('id');
    
    if (error) {
      console.error('[EudamedImport] Batch insert error:', error);
      return {
        created: 0,
        errors: [error.message]
      };
    }

    // Post-insert: sync phases and set dates/statuses for EUDAMED imports
    // Read each product's actual_launch_date from DB (stored per-device during insert)
    if (data && data.length > 0) {
      for (const product of data) {
        try {
          const { data: productRecord } = await supabase
            .from('products')
            .select('actual_launch_date')
            .eq('id', product.id)
            .single();
          const productLaunchDate = productRecord?.actual_launch_date || '2020-01-01';
          await this.setupEudamedProductPhases(product.id, companyId, productLaunchDate);
        } catch (phaseError) {
          console.error(`[EudamedImport] Phase setup failed for product ${product.id}:`, phaseError);
          // Non-fatal: product was created successfully, phases can be synced later
        }
      }
    }
    
    return {
      created: data?.length || 0,
      errors: []
    };
  }

  /**
   * For EUDAMED imports, reorder phase categories so "Product Realisation Lifecycle" appears
   * before "Post-Market & Lifecycle Management" (swap positions if needed).
   */
  private static async reorderCategoriesForEudamed(companyId: string) {
    try {
      const { data: categories } = await supabase
        .from('phase_categories')
        .select('id, name, position')
        .eq('company_id', companyId)
        .in('name', ['Product Realisation Lifecycle', 'Post-Market & Lifecycle Management']);

      if (!categories || categories.length !== 2) return;

      const prl = categories.find(c => c.name === 'Product Realisation Lifecycle');
      const pmlm = categories.find(c => c.name === 'Post-Market & Lifecycle Management');

      if (!prl || !pmlm) return;

      // Only swap if Product Realisation has a higher position (appears after Post-Market)
      if (prl.position > pmlm.position) {
        await supabase
          .from('phase_categories')
          .update({ position: pmlm.position })
          .eq('id', prl.id);

        await supabase
          .from('phase_categories')
          .update({ position: prl.position })
          .eq('id', pmlm.id);

      }
    } catch (error) {
      console.error('[EudamedImport] Error reordering categories:', error);
    }
  }

  /**
   * Ensure Post-Market Surveillance phase is in company_chosen_phases (active).
   * For EUDAMED imports, PMS must be active since the device is already on market.
   */
  private static async ensurePMSPhaseActive(companyId: string) {
    try {
      // Find the PMS company phase
      const { data: pmsPhases } = await supabase
        .from('company_phases')
        .select('id, name, category_id')
        .eq('company_id', companyId)
        .or('name.ilike.%Post-Market Surveillance%,name.ilike.%post-market%,name.ilike.%pms%');

      if (!pmsPhases || pmsPhases.length === 0) return;

      for (const pmsPhase of pmsPhases) {
        // Check if already in company_chosen_phases
        const { data: existing } = await supabase
          .from('company_chosen_phases')
          .select('id')
          .eq('company_id', companyId)
          .eq('phase_id', pmsPhase.id)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Get highest position
        const { data: maxPos } = await supabase
          .from('company_chosen_phases')
          .select('position')
          .eq('company_id', companyId)
          .order('position', { ascending: false })
          .limit(1);

        const nextPosition = (maxPos?.[0]?.position ?? -1) + 1;

        await supabase
          .from('company_chosen_phases')
          .insert({
            company_id: companyId,
            phase_id: pmsPhase.id,
            position: nextPosition
          });

        console.log(`[EudamedImport] Activated PMS phase "${pmsPhase.name}" for company ${companyId}`);
      }
    } catch (error) {
      console.error('[EudamedImport] Error ensuring PMS phase active:', error);
    }
  }

  /**
   * Set up lifecycle phases for an EUDAMED-imported product:
   * - Sync phases from company settings
   * - Calculate linear dates backwards from launch date
   * - Mark all pre-PMS phases as Completed, PMS as In Progress
   */
  public static async setupEudamedProductPhases(productId: string, companyId: string, launchDateStr: string, onStep?: (step: string) => void) {
    // Step 0a: Ensure PMS phase is active for EUDAMED imports (it's in company_phases but may not be in company_chosen_phases)
    onStep?.('Syncing lifecycle phases');
    await this.ensurePMSPhaseActive(companyId);

    // Step 0b: Reorder categories so Product Realisation Lifecycle appears before Post-Market
    await this.reorderCategoriesForEudamed(companyId);

    // Step 1: Sync phases from company settings
    await EnhancedPhaseSyncService.syncProductPhases(productId, companyId, { skipDefaultDates: true });

    // Step 2: Fetch synced lifecycle phases with their company phase details
    const { data: lifecyclePhases, error: fetchError } = await supabase
      .from('lifecycle_phases')
      .select(`
        id, name, phase_id, position, category_id,
        company_phases:phase_id(duration_days, is_continuous_process, category_id)
      `)
      .eq('product_id', productId)
      .order('position');

    if (fetchError || !lifecyclePhases || lifecyclePhases.length === 0) {
      console.error('[EudamedImport] Failed to fetch lifecycle phases:', fetchError);
      return;
    }

    // Step 2a: Remove "No Phase" placeholder from lifecycle_phases — not needed for EUDAMED products
    const noPhaseEntries = lifecyclePhases.filter(p => p.name === 'No Phase' || p.position === -1);
    for (const noPhase of noPhaseEntries) {
      await supabase
        .from('lifecycle_phases')
        .delete()
        .eq('id', noPhase.id);
    }
    // Remove from local array too
    const filteredLifecyclePhases = lifecyclePhases.filter(p => p.name !== 'No Phase' && p.position !== -1);

    // Step 2b: Fix null category_ids — propagate from company_phases to lifecycle_phases
    for (const phase of filteredLifecyclePhases) {
      const companyPhase = phase.company_phases as any;
      if (!phase.category_id && companyPhase?.category_id) {
        await supabase
          .from('lifecycle_phases')
          .update({ category_id: companyPhase.category_id })
          .eq('id', phase.id);
      }
    }

    const launchDate = new Date(launchDateStr);

    // Separate linear phases from continuous processes
    // Check both the DB flag AND phase name to correctly identify continuous/PMS phases
    const linearPhases: typeof filteredLifecyclePhases = [];
    const continuousPhases: typeof filteredLifecyclePhases = [];

    const isContinuousByName = (name: string) => {
      const lower = name.toLowerCase();
      return lower.includes('risk management') ||
             lower.includes('post-market surveillance') ||
             lower.includes('post-market monitoring') ||
             lower.includes('technical documentation') ||
             lower.includes('supplier management');
    };

    for (const phase of filteredLifecyclePhases) {
      const companyPhase = phase.company_phases as any;

      if (companyPhase?.is_continuous_process || isContinuousByName(phase.name)) {
        continuousPhases.push(phase);
      } else {
        linearPhases.push(phase);
      }
    }

    // Step 3: BACKWARD schedule — dev phases END at launch date
    // For EUDAMED devices already on market, all development was completed BEFORE launch
    onStep?.('Scheduling phase dates');
    const phaseUpdates: Array<{ id: string; start_date: string; end_date: string; status: string; progress: number; is_current_phase: boolean }> = [];

    // First, calculate total dev duration so we know how far back to start
    let totalDevDuration = 0;
    for (const phase of linearPhases) {
      const companyPhase = phase.company_phases as any;
      const durationDays = companyPhase?.duration_days != null ? companyPhase.duration_days : 30;
      totalDevDuration += durationDays;
    }

    // Dev starts totalDevDuration days BEFORE launch date
    const devStartDate = new Date(launchDate);
    devStartDate.setDate(devStartDate.getDate() - totalDevDuration);
    let currentStartDate = new Date(devStartDate);

    // Chain phases forward from devStartDate — they'll end at launchDate
    for (let i = 0; i < linearPhases.length; i++) {
      const phase = linearPhases[i];
      const companyPhase = phase.company_phases as any;
      const durationDays = companyPhase?.duration_days != null ? companyPhase.duration_days : 30;

      const startDate = new Date(currentStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      phaseUpdates.push({
        id: phase.id,
        start_date: startDateStr,
        end_date: endDateStr,
        status: 'Completed',
        progress: 100,
        is_current_phase: false,
      });

      currentStartDate = endDate; // Next phase starts where this one ends
    }

    // Dev ends at launch date (backward scheduled)
    const devEndDateStr = launchDateStr;
    const devStartDateStr = devStartDate.toISOString().split('T')[0];

    // Step 4: Set continuous processes
    // - PMS phases: start from dev end date, ongoing (In Progress)
    // - Other continuous phases (e.g. Risk Management): span the dev timeline (Completed)
    onStep?.('Setting up PMS & Risk Management');
    for (const phase of continuousPhases) {
      const name = phase.name.toLowerCase();
      const isPMS = name.includes('market') ||
                    name.includes('surveillance') ||
                    name.includes('pms');

      if (isPMS) {
        // PMS starts at MIDPOINT of dev timeline (half of totalDevDuration after devStartDate)
        // For EUDAMED devices already on market, PMS has been running since midpoint of development
        const halfDevDuration = Math.round(totalDevDuration / 2);
        const pmsStart = new Date(devStartDate);
        pmsStart.setDate(pmsStart.getDate() + halfDevDuration);
        const pmsStartDateStr = pmsStart.toISOString().split('T')[0];

        // For EUDAMED imports, calculate the first PMS milestone based on device class (MDR Article 86):
        //   Class I:    On-demand (no fixed schedule)
        //   Class IIa:  First PSUR after 1 year from launch, then every 2 years
        //   Class IIb:  Every year
        //   Class III:  Every year
        const { data: productData } = await supabase
          .from('products')
          .select('class, eudamed_risk_class')
          .eq('id', productId)
          .single();

        const riskClass = (productData?.class || productData?.eudamed_risk_class || '').toLowerCase().replace(/[\s-_]/g, '');
        const isClassIIa = riskClass.includes('iia') || riskClass.includes('2a');
        const isClassI = riskClass === 'i' || riskClass === 'classi' || riskClass === '1';

        // First PMS report interval in months
        const firstPmsIntervalMonths = isClassI ? 0 : 12; // All classes: first report at 12 months (Class I: on-demand, skip)
        // Recurring interval
        const recurringPmsIntervalMonths = (isClassIIa || isClassI) ? 24 : 12; // IIa/I: every 2 years, IIb/III: every year

        const today = new Date();

        phaseUpdates.push({
          id: phase.id,
          start_date: pmsStartDateStr,
          end_date: today.toISOString().split('T')[0],
          status: 'In Progress',
          progress: 0,
          is_current_phase: true,
        });

        // Store PMS recurrence metadata on the product for EUDAMED imports
        await supabase
          .from('products')
          .update({
            post_market_surveillance_date: pmsStartDateStr,
          })
          .eq('id', productId);

        console.log(`[EudamedImport] PMS for "${phase.name}": class=${riskClass}, first interval=${firstPmsIntervalMonths}mo, recurring=${recurringPmsIntervalMonths}mo, pmsStart=${pmsStartDateStr}`);
      } else {
        // Other continuous phases (Risk Management, etc.) span the dev timeline and are completed
        // Risk Management: devStartDate → launchDate (covers full dev period)
        phaseUpdates.push({
          id: phase.id,
          start_date: devStartDateStr,
          end_date: launchDateStr,
          status: 'Completed',
          progress: 100,
          is_current_phase: false,
        });
      }
    }

    // Step 5: Apply all updates
    for (const update of phaseUpdates) {
      await supabase
        .from('lifecycle_phases')
        .update({
          start_date: update.start_date,
          end_date: update.end_date,
          status: update.status,
          progress: update.progress,
          is_current_phase: update.is_current_phase,
        })
        .eq('id', update.id);
    }

    // Step 6: Copy company phase dependencies to product_phase_dependencies for Gantt chart links
    onStep?.('Adding dependencies');
    try {
      // Build map: company_phase_id -> lifecycle_phase_id
      const phaseIdMap = new Map<string, string>();
      filteredLifecyclePhases.forEach(lp => {
        phaseIdMap.set(lp.phase_id, lp.id);
      });

      // Fetch company-level dependencies for these phases
      const lifecyclePhaseIds = filteredLifecyclePhases.map(lp => lp.phase_id);
      const { data: companyDeps } = await supabase
        .from('phase_dependencies')
        .select('*')
        .eq('company_id', companyId)
        .or('source_phase_id.in.(' + lifecyclePhaseIds.join(',') + '),target_phase_id.in.(' + lifecyclePhaseIds.join(',') + ')');

      if (companyDeps && companyDeps.length > 0) {
        // Check if product already has dependencies
        const { data: existingDeps } = await supabase
          .from('product_phase_dependencies')
          .select('id')
          .eq('product_id', productId)
          .limit(1);

        if (!existingDeps || existingDeps.length === 0) {
          const productDeps = companyDeps
            .map(dep => {
              const sourceId = phaseIdMap.get(dep.source_phase_id);
              const targetId = phaseIdMap.get(dep.target_phase_id);
              if (!sourceId || !targetId) return null;
              return {
                product_id: productId,
                source_phase_id: sourceId,
                target_phase_id: targetId,
                dependency_type: dep.dependency_type,
                lag_days: dep.lag_days || 0
              };
            })
            .filter(Boolean);

          if (productDeps.length > 0) {
            const { error: depError } = await supabase
              .from('product_phase_dependencies')
              .insert(productDeps);

            if (depError) {
              console.error('[EudamedImport] Error copying dependencies to product:', depError);
            }
          }
        }
      }
    } catch (depError) {
      console.error('[EudamedImport] Error setting up product dependencies:', depError);
    }
  }
  
  /**
   * Get import status for a company
   */
  static async getImportStatus(companyId: string) {
    try {
      // Get total EUDAMED devices for organization matching this company
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      
      if (!company) {
        throw new Error('Company not found');
      }
      
      const { data: eudamedCount } = await supabase.rpc('count_eudamed_company_devices', {
        company_identifier: company.name
      }) as { data: number | null; error: any };
      
      const { data: productCount, count } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId);
      
      return {
        totalEudamedDevices: eudamedCount || 0,
        currentProducts: count || 0,
        missingDevices: Math.max(0, (eudamedCount || 0) - (count || 0))
      };
      
    } catch (error) {
      console.error('[EudamedImport] Error getting import status:', error);
      return {
        totalEudamedDevices: 0,
        currentProducts: 0,
        missingDevices: 0
      };
    }
  }
  
  /**
   * Legacy method - kept for backward compatibility but redirects to generic method
   */
  static async importMissingWidexProducts(
    companyId: string,
    onProgress?: (processed: number, total: number, operation: string) => void
  ): Promise<EudamedImportResult> {
    return this.importMissingProducts(companyId, onProgress);
  }
}