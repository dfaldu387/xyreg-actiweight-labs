
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductPhase } from "@/types/client";
import { Device3DModel } from "@/types/device3d";
import { sanitizeImageArray, parseImagesFromStorage } from "@/utils/imageDataUtils";

// Type guard functions for safe casting
function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isValidStatus(status: string | null): status is "On Track" | "At Risk" | "Needs Attention" {
  return status === "On Track" || status === "At Risk" || status === "Needs Attention";
}

function safeArrayCast(value: any): string[] {
  if (!value) return [];
  if (isStringArray(value)) return value;
  if (Array.isArray(value)) return value.map(item => String(item));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(item => String(item)) : [value];
    } catch {
      return [value];
    }
  }
  return [];
}

function safeComponentsArrayCast(value: any): Array<{ name: string; description: string }> {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object' && item !== null && 'name' in item && 'description' in item) {
        return { name: String(item.name), description: String(item.description) };
      }
      return { name: String(item), description: '' };
    });
  }
  return [];
}

function safeMarketLaunchDatesCast(value: any): Record<string, string> {
  if (!value) return {};
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // Convert all values to strings to ensure Record<string, string> type
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = String(val);
    }
    return result;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const result: Record<string, string> = {};
        for (const [key, val] of Object.entries(parsed)) {
          result[key] = String(val);
        }
        return result;
      }
    } catch {
      // If parsing fails, return empty object
    }
  }
  return {};
}

// Safe casting for models_3d field to Device3DModel[]
function safeModels3DCast(value: any): Device3DModel[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    // Validate each item is a proper Device3DModel
    return value.filter(item => 
      item && typeof item === 'object' && 
      (item.url || item.file_path || item.name)
    ).map(item => ({
      url: item.url || '',
      name: item.name || 'Unnamed Model',
      format: item.format || item.file_type || 'unknown'
    }));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(item => 
        item && typeof item === 'object' && 
        (item.url || item.file_path || item.name)
      ).map(item => ({
        url: item.url || '',
        name: item.name || 'Unnamed Model',
        format: item.format || item.file_type || 'unknown'
      })) : [];
    } catch {
      return [];
    }
  }
  if (typeof value === 'object' && value !== null) {
    // Handle single object, convert to array
    if (value.url || value.file_path || value.name) {
      return [{
        url: value.url || '',
        name: value.name || 'Unnamed Model',
        format: value.format || value.file_type || 'unknown'
      }];
    }
  }
  return [];
}

export async function fetchCompanyProducts(companyId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        base_product:parent_product_id(name),
        lifecyclePhases:lifecycle_phases(
          id,
          name,
          description,
          status,
          progress,
          is_current_phase,
          deadline,
          phase_id
        ),
        companies(name)
      `)
      .eq("company_id", companyId)
      .eq("is_archived", false)
      .order("name");

    if (error) {
      console.error("[productService] Error fetching products:", error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Process the products to ensure proper typing
    const processedProducts: Product[] = data.map(product => ({
      ...product,
      // Extract company name from joined data
      company: product.companies?.name || undefined,
      // Safe status casting
      status: isValidStatus(product.status) ? product.status : "On Track",
      // CRITICAL: Fix image handling to use proper JSON parsing with repair functionality
      image: parseImagesFromStorage(product.image),
      videos: parseImagesFromStorage(product.videos),
      // Ensure arrays are properly typed
      markets: safeArrayCast(product.markets) as any,
      key_features: safeArrayCast(product.key_features),
      clinical_benefits: safeArrayCast(product.clinical_benefits),
      intended_users: safeArrayCast(product.intended_users),
      iso_certifications: safeArrayCast(product.iso_certifications),
      device_compliance: safeArrayCast(product.device_compliance),
      device_components: safeComponentsArrayCast(product.device_components),
      contraindications: safeArrayCast(product.contraindications),
      // Safe casting for project_types field from Json to string[]
      project_types: safeArrayCast(product.project_types),
      // Safe casting for models_3d field to Device3DModel[]
      models_3d: safeModels3DCast(product.models_3d),
      // Handle lifecycle phases - map to match ProductPhase interface exactly
      lifecyclePhases: Array.isArray(product.lifecyclePhases) 
        ? product.lifecyclePhases.map(lp => ({
            id: lp.id,
            product_id: product.id, // Add required product_id
            phase_id: lp.phase_id || '', // Add required phase_id
            is_current_phase: lp.is_current_phase || false, // Add required is_current_phase
            name: lp.name,
            description: lp.description || '',
            status: lp.status as "Completed" | "In Progress" | "Not Started",
            deadline: lp.deadline ? new Date(lp.deadline) : undefined,
            isCurrentPhase: lp.is_current_phase || false, // Keep backward compatibility
            position: 0, // Default position since not available from query
            company_id: companyId, // Use the company ID from the query
            progress: lp.progress || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        : [],
      // Handle market_launch_dates specifically
      market_launch_dates: safeMarketLaunchDatesCast(product.market_launch_dates),
      // Handle JSON fields
      user_instructions: product.user_instructions && typeof product.user_instructions === 'object' 
        ? product.user_instructions as any : {},
      intended_purpose_data: product.intended_purpose_data && typeof product.intended_purpose_data === 'object'
        ? product.intended_purpose_data as any : {}
    }));

    return processedProducts;
  } catch (error) {
    console.error("[productService] Error in fetchCompanyProducts:", error);
    throw error;
  }
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        base_product:parent_product_id(name),
        lifecyclePhases:lifecycle_phases(
          id,
          name,
          description,
          status,
          progress,
          is_current_phase,
          deadline,
          phase_id
        ),
        companies(name)
      `)
      .eq("id", productId)
      .eq("is_archived", false)
      .single();

    if (error) {
      console.error("[productService] Error fetching product:", error);
      throw error;
    }

    if (!data) {
      return null;
    }

    // Process the product with the same logic as above
    const processedProduct: Product = {
      ...data,
      // Extract company name from joined data
      company: data.companies?.name || undefined,  
      // Safe status casting
      status: isValidStatus(data.status) ? data.status : "On Track",
      // CRITICAL: Fix image handling to use proper JSON parsing with repair functionality
      image: parseImagesFromStorage(data.image),
      videos: parseImagesFromStorage(data.videos),
      markets: safeArrayCast(data.markets) as any,
      key_features: safeArrayCast(data.key_features),
      clinical_benefits: safeArrayCast(data.clinical_benefits),
      intended_users: safeArrayCast(data.intended_users),
      iso_certifications: safeArrayCast(data.iso_certifications),
      device_compliance: safeArrayCast(data.device_compliance),
      device_components: safeComponentsArrayCast(data.device_components),
      contraindications: safeArrayCast(data.contraindications),
      // Safe casting for project_types field from Json to string[]
      project_types: safeArrayCast(data.project_types),
      // Safe casting for models_3d field to Device3DModel[]
      models_3d: safeModels3DCast(data.models_3d),
      // Handle lifecycle phases - map to match ProductPhase interface exactly
      lifecyclePhases: Array.isArray(data.lifecyclePhases) 
        ? data.lifecyclePhases.map(lp => ({
            id: lp.id,
            product_id: data.id, // Add required product_id
            phase_id: lp.phase_id || '', // Add required phase_id
            is_current_phase: lp.is_current_phase || false, // Add required is_current_phase
            name: lp.name,
            description: lp.description || '',
            status: lp.status as "Completed" | "In Progress" | "Not Started",
            deadline: lp.deadline ? new Date(lp.deadline) : undefined,
            isCurrentPhase: lp.is_current_phase || false, // Keep backward compatibility
            position: 0, // Default position since not available from query
            company_id: data.company_id || '', // Use the company ID from the product
            progress: lp.progress || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        : [],
      // Handle market_launch_dates specifically
      market_launch_dates: safeMarketLaunchDatesCast(data.market_launch_dates),
      user_instructions: data.user_instructions && typeof data.user_instructions === 'object' 
        ? data.user_instructions as any : {},
      intended_purpose_data: data.intended_purpose_data && typeof data.intended_purpose_data === 'object'
        ? data.intended_purpose_data as any : {}
    };

    return processedProduct;
  } catch (error) {
    console.error("[productService] Error in fetchProductById:", error);
    throw error;
  }
}
