// Test utility for manual EUDAMED import debugging
import { EudamedProductImportService } from '@/services/eudamedProductImportService';
import { supabase } from '@/integrations/supabase/client';

export async function testEudamedImport(companyId: string) {
  console.log('[Test] Starting EUDAMED import test for company:', companyId);
  
  try {
    const result = await EudamedProductImportService.importMissingProducts(
      companyId,
      (processed, total, operation) => {
        console.log(`[Test] Progress: ${processed}/${total} - ${operation}`);
      }
    );
    
    console.log('[Test] Import result:', result);
    return result;
  } catch (error) {
    console.error('[Test] Import failed:', error);
    throw error;
  }
}

export async function testImportStatus(companyId: string) {
  console.log('[Test] Getting import status for company:', companyId);
  
  try {
    const status = await EudamedProductImportService.getImportStatus(companyId);
    console.log('[Test] Import status:', status);
    return status;
  } catch (error) {
    console.error('[Test] Failed to get status:', error);
    throw error;
  }
}

export async function diagnosticProductNames(companyId: string) {
  console.log('[Diagnostic] Starting product name diagnostic for company:', companyId);
  
  try {
    // Get products with EUDAMED data
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, udi_di, eudamed_device_name, eudamed_trade_names, eudamed_organization')
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .not('eudamed_organization', 'is', null);
    
    if (productsError) {
      throw productsError;
    }
    
    if (!products || products.length === 0) {
      console.log('[Diagnostic] No products with EUDAMED data found');
      return { products: [], issues: [], summary: 'No products with EUDAMED data found' };
    }
    
    console.log(`[Diagnostic] Found ${products.length} products with EUDAMED data`);
    
    // Get company name for EUDAMED lookup
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Get EUDAMED devices for cross-reference
    const { data: eudamedDevices, error: eudamedError } = await supabase
      .from('eudamed_medical_devices')
      .select('udi_di, device_name, trade_names')
      .ilike('organization', `%${company.name}%`);
    
    if (eudamedError) {
      throw eudamedError;
    }
    
    const issues: Array<{
      productId: string;
      productName: string;
      currentName: string;
      eudamedDeviceName: string | null;
      eudamedTradeNames: string | null;
      correctName: string | null;
      issue: string;
      severity: 'high' | 'medium' | 'low';
    }> = [];
    
    // Analyze each product
    for (const product of products) {
      const analysis = {
        productId: product.id,
        productName: product.name,
        currentName: product.name,
        eudamedDeviceName: product.eudamed_device_name,
        eudamedTradeNames: product.eudamed_trade_names,
        correctName: null as string | null,
        issue: '',
        severity: 'low' as 'high' | 'medium' | 'low'
      };
      
      // Find matching EUDAMED device
      const matchingDevice = eudamedDevices?.find(device => device.udi_di === product.udi_di);
      
      if (matchingDevice) {
        // Determine what the correct name should be (device_name priority)
        const correctName = matchingDevice.device_name || matchingDevice.trade_names;
        analysis.correctName = correctName;
        
        // Check if product is using trade name when device name is available
        if (matchingDevice.device_name && matchingDevice.trade_names) {
          if (product.name === matchingDevice.trade_names && product.name !== matchingDevice.device_name) {
            analysis.issue = 'Using trade name instead of device name';
            analysis.severity = 'high';
            issues.push(analysis);
          } else if (product.name === matchingDevice.device_name) {
            analysis.issue = 'Correctly using device name';
            analysis.severity = 'low';
          } else if (product.name !== matchingDevice.device_name && product.name !== matchingDevice.trade_names) {
            analysis.issue = 'Using custom name, neither device name nor trade name';
            analysis.severity = 'medium';
            issues.push(analysis);
          }
        } else if (matchingDevice.device_name && product.name !== matchingDevice.device_name) {
          analysis.issue = 'Not using available device name';
          analysis.severity = 'medium';
          issues.push(analysis);
        } else if (!matchingDevice.device_name && matchingDevice.trade_names && product.name !== matchingDevice.trade_names) {
          analysis.issue = 'Not using available trade name (no device name available)';
          analysis.severity = 'low';
          issues.push(analysis);
        }
      } else {
        analysis.issue = 'No matching EUDAMED device found for UDI-DI';
        analysis.severity = 'high';
        issues.push(analysis);
      }
    }
    
    const summary = {
      totalProducts: products.length,
      highSeverityIssues: issues.filter(i => i.severity === 'high').length,
      mediumSeverityIssues: issues.filter(i => i.severity === 'medium').length,
      lowSeverityIssues: issues.filter(i => i.severity === 'low').length,
      usingCorrectNames: products.length - issues.filter(i => i.severity !== 'low').length
    };
    
    console.log('[Diagnostic] Product name analysis complete:', summary);
    console.log('[Diagnostic] Issues found:', issues);
    
    return { 
      products, 
      issues, 
      summary: `${summary.totalProducts} products analyzed. ${summary.highSeverityIssues} high priority, ${summary.mediumSeverityIssues} medium priority issues found.`
    };
    
  } catch (error) {
    console.error('[Diagnostic] Product name diagnostic failed:', error);
    throw error;
  }
}

export async function diagnosticSpecificProduct(productId: string) {
  console.log('[Diagnostic] Analyzing specific product:', productId);
  
  try {
    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError) {
      throw productError;
    }
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Get matching EUDAMED device if UDI-DI exists
    let eudamedDevice = null;
    if (product.udi_di) {
      const { data: devices } = await supabase
        .from('eudamed_medical_devices')
        .select('*')
        .eq('udi_di', product.udi_di)
        .limit(1);
      
      eudamedDevice = devices?.[0] || null;
    }
    
    const analysis = {
      product,
      eudamedDevice,
      nameAnalysis: {
        currentName: product.name,
        eudamedDeviceName: eudamedDevice?.device_name || null,
        eudamedTradeNames: eudamedDevice?.trade_names || null,
        storedEudamedDeviceName: product.eudamed_device_name,
        storedEudamedTradeNames: product.eudamed_trade_names,
        recommendation: ''
      }
    };
    
    // Determine recommendation
    if (eudamedDevice) {
      if (eudamedDevice.device_name) {
        if (product.name === eudamedDevice.device_name) {
          analysis.nameAnalysis.recommendation = 'CORRECT: Using EUDAMED device name';
        } else {
          analysis.nameAnalysis.recommendation = `SHOULD UPDATE: Change from "${product.name}" to "${eudamedDevice.device_name}" (device name)`;
        }
      } else if (eudamedDevice.trade_names) {
        if (product.name === eudamedDevice.trade_names) {
          analysis.nameAnalysis.recommendation = 'ACCEPTABLE: Using trade name (no device name available)';
        } else {
          analysis.nameAnalysis.recommendation = `CONSIDER UPDATE: Change from "${product.name}" to "${eudamedDevice.trade_names}" (trade name)`;
        }
      } else {
        analysis.nameAnalysis.recommendation = 'NO EUDAMED NAMES: No device name or trade names available in EUDAMED';
      }
    } else {
      analysis.nameAnalysis.recommendation = 'NO EUDAMED MATCH: No EUDAMED device found for this UDI-DI';
    }
    
    console.log('[Diagnostic] Product analysis complete:', analysis);
    return analysis;
    
  } catch (error) {
    console.error('[Diagnostic] Product diagnostic failed:', error);
    throw error;
  }
}

// Add to window for testing
if (typeof window !== 'undefined') {
  (window as any).testEudamedImport = testEudamedImport;
  (window as any).testImportStatus = testImportStatus;
  (window as any).diagnosticProductNames = diagnosticProductNames;
  (window as any).diagnosticSpecificProduct = diagnosticSpecificProduct;
}