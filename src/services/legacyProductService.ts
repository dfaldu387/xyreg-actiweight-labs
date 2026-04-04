import { supabase } from '@/integrations/supabase/client';
import { EudamedDevice } from '@/hooks/useEudamedRegistry';
import { EudamedProductImportService } from '@/services/eudamedProductImportService';
import { generateUniqueProductName } from '@/services/duplicateNameValidation';

// Function to look up EMDN code details
async function lookupEmdnCodeDetails(emdnCode: string): Promise<{
  id: string | null;
  description: string | null;
}> {
  if (!emdnCode) {
    return { id: null, description: null };
  }

  try {
    const firstLetter = emdnCode.charAt(0).toUpperCase();
    const { data, error } = await supabase.rpc('get_eudamed_emdn_codes_by_prefix', {
      prefix_letter: firstLetter
    });

    if (error) {
      console.warn(`[LegacyProductService] Error looking up EMDN code ${emdnCode}:`, error);
      return { id: null, description: null };
    }

    const exactMatch = data?.find((item: any) => item.code === emdnCode);
    if (exactMatch) {
      return {
        id: exactMatch.code,
        description: exactMatch.description
      };
    }

    return { id: null, description: null };
  } catch (error) {
    console.warn(`[LegacyProductService] Error looking up EMDN code ${emdnCode}:`, error);
    return { id: null, description: null };
  }
}

// Function to extract EMDN code from EUDAMED device data
function extractEmdnCode(device: EudamedDevice): string | null {
  if (device.emdn_code) {
    return device.emdn_code;
  }

  if (device.nomenclature_codes) {
    const codes = device.nomenclature_codes.split(',').map(code => code.trim());
    if (codes.length > 0 && codes[0]) {
      return codes[0];
    }
  }

  return null;
}

export interface LegacyProductCreationData {
  companyId: string;
  devices: EudamedDevice[];
  onProgress?: (progress: {
    processed: number;
    total: number;
    currentDevice: string;
    errors: string[];
  }) => void;
}

export async function createLegacyProducts(data: LegacyProductCreationData): Promise<{
  success: boolean;
  createdProducts: string[];
  errors: string[];
}> {
  const { companyId, devices, onProgress } = data;
  const createdProducts: string[] = [];
  const errors: string[] = [];

  // Validate companyId is a valid UUID
  if (!companyId || companyId.trim() === '') {
    const errorMsg = 'Company ID is required for legacy product creation';
    errors.push(errorMsg);
    return { success: false, createdProducts, errors };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(companyId)) {
    const errorMsg = `Invalid company ID format: ${companyId}`;
    errors.push(errorMsg);
    return { success: false, createdProducts, errors };
  }

  if (!devices || devices.length === 0) {
    return { success: true, createdProducts, errors };
  }

  // Check for existing products with same names
  const existingProducts = await supabase
    .from('products')
    .select('name, udi_di')
    .eq('company_id', companyId)
    .eq('is_archived', false);

  for (let i = 0; i < devices.length; i++) {
    const device = devices[i];

    // Use device's actual placed_on_the_market date from EUDAMED, fallback to 2020-01-01
    const launchDateStr = device.placed_on_the_market
      ? new Date(device.placed_on_the_market).toISOString().split('T')[0]
      : '2020-01-01';

    try {
      const deviceName = formatLegacyProductName(device);

      // Step 1: Register device (classification lookup + name + DB insert)
      onProgress?.({ processed: i, total: devices.length, currentDevice: `Registering device`, errors: [...errors] });

      // Extract and lookup EMDN code
      const emdnCode = extractEmdnCode(device);
      let emdnDetails = { id: null, description: null };

      if (emdnCode) {
        emdnDetails = await lookupEmdnCodeDetails(emdnCode);
      }

      // Generate unique product name - use clean base name (no UDI-DI appended)
      const baseProductName = deviceName;

      // Use the database-backed unique name generator to prevent duplicates
      const uniqueNameResult = await generateUniqueProductName(companyId, baseProductName);
      if (uniqueNameResult.error) {
        errors.push(`Failed to generate unique name for ${device.device_name}: ${uniqueNameResult.error}`);
        continue;
      }
      
      const productName = uniqueNameResult.uniqueName;

      // Create product with EUDAMED data including EMDN fields
      const productData = {
        name: productName,
        description: `Legacy device imported from EUDAMED registry. UDI-DI: ${device.udi_di}. Device Type: ${device.device_model || 'N/A'}. Risk Class: ${device.risk_class || 'N/A'}`,
        company_id: companyId,
        class: device.risk_class || null,
        project_types: ['Legacy Device'],
        status: 'Active',
        is_archived: false,
        version: '1.0',
        is_line_extension: false,
        parent_product_id: null,
        basic_udi_di: device.basic_udi_di_code,
        udi_di: device.udi_di,
        eudamed_registration_number: device.reference_number,
        device_type: device.device_model || 'Legacy Device',
        model_reference: device.device_model,
        // Launch date set to 3 years ago for legacy/EUDAMED products
        actual_launch_date: launchDateStr,
        projected_launch_date: launchDateStr,
        project_start_date: launchDateStr,
        launch_status: 'launched',
        current_lifecycle_phase: 'Post-Market Surveillance',
        // EU market with CE Marked status
        markets: [
          {
            country: 'EU',
            status: 'CE Marked',
            launch_status: 'launched',
            planned_date: launchDateStr,
            regulatory_status: 'CE Marked'
          }
        ],
        // Populate EMDN fields from EUDAMED data
        emdn_code: emdnCode,
        emdn_category_id: emdnDetails.id,
        emdn_description: emdnDetails.description,
        // Populate dedicated eudamed_* columns for EudamedConsolidatedSection display
        eudamed_id_srn: device.id_srn || null,
        eudamed_organization: device.organization || null,
        eudamed_implantable: device.implantable ?? null,
        eudamed_measuring: device.measuring ?? null,
        eudamed_active: device.active ?? null,
        eudamed_reusable: device.reusable ?? null,
        eudamed_single_use: device.single_use ?? null,
        eudamed_sterile: device.sterile ?? null,
        eudamed_sterilization_need: device.sterilization_need ?? null,
        eudamed_contain_latex: device.contain_latex ?? null,
        eudamed_reprocessed: device.reprocessed ?? null,
        eudamed_direct_marking: device.direct_marking ?? null,
        eudamed_administering_medicine: device.administering_medicine ?? null,
        eudamed_max_reuses: device.max_reuses ?? null,
        eudamed_quantity_of_device: device.quantity_of_device ?? null,
        eudamed_device_name: device.device_name || null,
        eudamed_trade_names: device.trade_names || null,
        eudamed_device_model: device.device_model || null,
        eudamed_risk_class: device.risk_class || null,
        eudamed_status: device.status || null,
        eudamed_applicable_legislation: device.applicable_legislation || null,
        eudamed_nomenclature_codes: device.nomenclature_codes || null,
        eudamed_issuing_agency: device.issuing_agency || null,
        // Store additional EUDAMED data in key_features for reference
        key_features: {
          eudamed_data: {
            trade_names: device.trade_names,
            nomenclature_codes: device.nomenclature_codes,
            direct_marking: device.direct_marking,
            quantity_of_device: device.quantity_of_device,
            single_use: device.single_use,
            max_reuses: device.max_reuses,
            sterilization_need: device.sterilization_need,
            sterile: device.sterile,
            contain_latex: device.contain_latex,
            reprocessed: device.reprocessed,
            placed_on_the_market: device.placed_on_the_market,
            market_distribution: device.market_distribution,
            implantable: device.implantable,
            measuring: device.measuring,
            reusable: device.reusable,
            active_device: device.active,
            administering_medicine: device.administering_medicine,
            issuing_agency: device.issuing_agency,
            reference_number: device.reference_number,
            eudamed_status: device.status,
            applicable_legislation: device.applicable_legislation
          }
        }
      };

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(productData as any)
        .select('id')
        .single();

      if (productError) {
        console.error(`[LegacyProductService] Error creating product for device ${device.device_name}:`, productError);
        
        let errorMessage = `Failed to create product for ${device.device_name || device.udi_di}: ${productError.message}`;
        
        if (productError.code === '23505') {
          errorMessage = `Product name "${productData.name}" already exists for this company.`;
        } else if (productError.code === '23503') {
          errorMessage = `Invalid company ID or foreign key constraint violation for ${device.device_name}`;
        } else if (productError.code === '23502') {
          errorMessage = `Required field missing for product ${device.device_name}: ${productError.message}`;
        }
        
        errors.push(errorMessage);
        
        onProgress?.({
          processed: i + 1,
          total: devices.length,
          currentDevice: formatLegacyProductName(device),
          errors: [...errors]
        });
        continue;
      }

      if (!newProduct?.id) {
        errors.push(`No product ID returned for ${device.device_name}`);
        continue;
      }

      createdProducts.push(newProduct.id);

      // Setup all lifecycle phases with step-by-step progress
      await EudamedProductImportService.setupEudamedProductPhases(newProduct.id, companyId, launchDateStr, (step) => {
        onProgress?.({
          processed: i,
          total: devices.length,
          currentDevice: step,
          errors: [...errors]
        });
      });

      // Report completion of this device AFTER all setup finishes
      onProgress?.({
        processed: i + 1,
        total: devices.length,
        currentDevice: `Done: ${deviceName}`,
        errors: [...errors]
      });

    } catch (error) {
      console.error(`[LegacyProductService] Unexpected error creating product for device ${device.device_name}:`, error);
      errors.push(`Unexpected error for ${device.device_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const success = createdProducts.length > 0;

  return {
    success,
    createdProducts,
    errors
  };
}

export function formatLegacyProductName(device: EudamedDevice): string {
  if (device.device_name && device.device_name.trim()) {
    return device.device_name.trim();
  }
  
  if (device.trade_names && device.trade_names.trim()) {
    return device.trade_names.trim();
  }
  
  if (device.device_model && device.device_model.trim()) {
    return `${device.device_model.trim()} Device`;
  }
  
  return 'Legacy Device';
}

export function extractDeviceDescription(device: EudamedDevice): string {
  const parts = [];
  
  if (device.device_name) {
    parts.push(`Device: ${device.device_name}`);
  }
  
  if (device.device_model) {
    parts.push(`Model: ${device.device_model}`);
  }
  
  if (device.risk_class) {
    parts.push(`Risk Class: ${device.risk_class}`);
  }
  
  if (device.udi_di) {
    parts.push(`UDI-DI: ${device.udi_di}`);
  }
  
  parts.push('Imported from EUDAMED registry');
  
  return parts.join(' | ');
}
