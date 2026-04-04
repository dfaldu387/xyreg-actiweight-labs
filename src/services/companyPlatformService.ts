import { supabase } from "@/integrations/supabase/client";

export interface CompanyPlatform {
  id?: string;
  name: string;
  productCount: number;
  isStandalone?: boolean;
  description?: string;
}

export interface CreatePlatformData {
  name: string;
  description?: string;
}

export class CompanyPlatformService {
  // Get combined standalone + product-derived platforms
  static async getDistinctPlatforms(companyId: string): Promise<CompanyPlatform[]> {
    // Get standalone platforms
    const { data: standalonePlatforms, error: standaloneError } = await supabase
      .from('company_platforms')
      .select('id, name, description')
      .eq('company_id', companyId);

    if (standaloneError) throw standaloneError;

    // Get product-derived platforms
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('product_platform')
      .eq('company_id', companyId)
      .eq('is_archived', false);

    if (productError) throw productError;

    // Count product-derived platforms
    const productCounts = new Map<string, number>();
    (productData || []).forEach((row: any) => {
      const platform = (row.product_platform || '').trim();
      if (!platform) return;
      productCounts.set(platform, (productCounts.get(platform) || 0) + 1);
    });

    // Combine results
    const result: CompanyPlatform[] = [];
    
    // Add standalone platforms
    (standalonePlatforms || []).forEach(platform => {
      result.push({
        id: platform.id,
        name: platform.name,
        description: platform.description,
        productCount: productCounts.get(platform.name) || 0,
        isStandalone: true
      });
      // Remove from product counts to avoid duplicates
      productCounts.delete(platform.name);
    });

    // Add remaining product-derived platforms
    Array.from(productCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([name, productCount]) => {
        result.push({ name, productCount, isStandalone: false });
      });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Create new standalone platform
  static async createPlatform(companyId: string, data: CreatePlatformData): Promise<string> {
    const { data: result, error } = await supabase
      .from('company_platforms')
      .insert({
        company_id: companyId,
        name: data.name,
        description: data.description
      })
      .select('id')
      .single();

    if (error) throw error;
    return result.id;
  }

  // Update standalone platform
  static async updatePlatform(companyId: string, platformId: string, data: CreatePlatformData): Promise<void> {
    const { error } = await supabase
      .from('company_platforms')
      .update({
        name: data.name,
        description: data.description
      })
      .eq('company_id', companyId)
      .eq('id', platformId);

    if (error) throw error;
  }

  static async renamePlatform(companyId: string, oldName: string, newName: string): Promise<number> {
    const { data, error } = await supabase
      .from('products')
      .update({ product_platform: newName })
      .eq('company_id', companyId)
      .eq('product_platform', oldName)
      .select('id');

    if (error) throw error;
    return (data || []).length;
  }

  static async deletePlatform(companyId: string, platformName: string): Promise<number> {
    // Set to null on products that used this platform
    const { data: productData, error: productError } = await supabase
      .from('products')
      .update({ product_platform: null })
      .eq('company_id', companyId)
      .eq('product_platform', platformName)
      .select('id');

    if (productError) throw productError;

    // Also delete the standalone platform if it exists
    const { error: platformError } = await supabase
      .from('company_platforms')
      .delete()
      .eq('company_id', companyId)
      .eq('name', platformName);

    if (platformError) throw platformError;

    return (productData || []).length;
  }
}