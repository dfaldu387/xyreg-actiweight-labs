import { supabase } from "@/integrations/supabase/client";

export interface CompanyDeviceCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  markets?: any; // JSONB field for market data
  created_at: string;
  updated_at: string;
}

export interface CreateDeviceCategoryData {
  company_id: string;
  name: string;
  description?: string;
}

export interface UpdateDeviceCategoryData {
  name?: string;
  description?: string;
}

export interface CategoryUsageInfo {
  categoryId: string;
  categoryName: string;
  productCount: number;
  products: { id: string; name: string }[];
}

export class CompanyDeviceCategoriesService {
  static async getCompanyDeviceCategories(companyId: string): Promise<CompanyDeviceCategory[]> {
    const { data, error } = await supabase
      .from('company_device_categories')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) {
      throw error;
    }

    return data || [];
  }

  static async getCategoryUsage(companyId: string, categoryName: string): Promise<CategoryUsageInfo> {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('device_category', categoryName)
      .eq('is_archived', false);

    if (error) {
      throw error;
    }

    return {
      categoryId: '',
      categoryName,
      productCount: products?.length || 0,
      products: products || []
    };
  }

  static async getCategoriesWithUsage(companyId: string): Promise<(CompanyDeviceCategory & { productCount: number })[]> {
    const categories = await this.getCompanyDeviceCategories(companyId);
    
    const categoriesWithUsage = await Promise.all(
      categories.map(async (category) => {
        const usage = await this.getCategoryUsage(companyId, category.name);
        return {
          ...category,
          productCount: usage.productCount
        };
      })
    );

    return categoriesWithUsage;
  }

  static async bulkUpdateProductCategories(
    companyId: string, 
    fromCategory: string, 
    toCategory: string | null
  ): Promise<number> {
    const { data, error } = await supabase
      .from('products')
      .update({ device_category: toCategory })
      .eq('company_id', companyId)
      .eq('device_category', fromCategory)
      .eq('is_archived', false)
      .select('id');

    if (error) {
      throw error;
    }

    return data?.length || 0;
  }

  static async createDeviceCategory(categoryData: CreateDeviceCategoryData): Promise<CompanyDeviceCategory> {
    const { data, error } = await supabase
      .from('company_device_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  static async updateDeviceCategory(
    categoryId: string, 
    updates: UpdateDeviceCategoryData
  ): Promise<CompanyDeviceCategory> {
    const { data, error } = await supabase
      .from('company_device_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  static async deleteDeviceCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('company_device_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      throw error;
    }
  }

  static async validateCategoryDeletion(companyId: string, categoryName: string): Promise<CategoryUsageInfo> {
    return this.getCategoryUsage(companyId, categoryName);
  }
}