import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CompanyDeviceCategory,
  CompanyDeviceCategoriesService,
  CreateDeviceCategoryData,
  UpdateDeviceCategoryData,
  CategoryUsageInfo
} from '@/services/companyDeviceCategoriesService';
import { toast } from 'sonner';

export const useCompanyDeviceCategories = (companyId?: string) => {
  const queryClient = useQueryClient();

  // Use React Query for caching — all components sharing the same companyId
  // will reuse the same cached data instead of making duplicate API calls
  const { data: categories = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['company-device-categories', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return await CompanyDeviceCategoriesService.getCompanyDeviceCategories(companyId);
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10 minutes
  });

  const error = queryError?.message || null;

  const loadCategories = useCallback(async (withUsage: boolean = false) => {
    if (!companyId) return;

    if (withUsage) {
      // For usage data, fetch directly and update cache
      try {
        const data = await CompanyDeviceCategoriesService.getCategoriesWithUsage(companyId);
        queryClient.setQueryData(['company-device-categories', companyId], data);
      } catch (err: any) {
        toast.error('Failed to load device categories');
      }
    } else {
      // Just invalidate the cache to trigger a refetch
      await queryClient.invalidateQueries({ queryKey: ['company-device-categories', companyId] });
    }
  }, [companyId, queryClient]);

  const createCategory = async (categoryData: Omit<CreateDeviceCategoryData, 'company_id'>) => {
    console.log('[useCompanyDeviceCategories] createCategory called with companyId:', companyId);
    if (!companyId) return;

    try {
      const newCategory = await CompanyDeviceCategoriesService.createDeviceCategory({
        ...categoryData,
        company_id: companyId
      });
      // Update cache optimistically
      queryClient.setQueryData(
        ['company-device-categories', companyId],
        (prev: CompanyDeviceCategory[] = []) => [...prev, newCategory]
      );
      toast.success('Device category created successfully');
      return newCategory;
    } catch (err: any) {
      toast.error('Failed to create device category');
      throw err;
    }
  };

  const updateCategory = async (categoryId: string, updates: UpdateDeviceCategoryData) => {
    try {
      const updatedCategory = await CompanyDeviceCategoriesService.updateDeviceCategory(categoryId, updates);
      // Update cache optimistically
      queryClient.setQueryData(
        ['company-device-categories', companyId],
        (prev: CompanyDeviceCategory[] = []) => prev.map(cat => cat.id === categoryId ? updatedCategory : cat)
      );
      toast.success('Device category updated successfully');
      return updatedCategory;
    } catch (err: any) {
      toast.error('Failed to update device category');
      throw err;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      await CompanyDeviceCategoriesService.deleteDeviceCategory(categoryId);
      // Update cache optimistically
      queryClient.setQueryData(
        ['company-device-categories', companyId],
        (prev: CompanyDeviceCategory[] = []) => prev.filter(cat => cat.id !== categoryId)
      );
      toast.success('Device category deleted successfully');
    } catch (err: any) {
      toast.error('Failed to delete device category');
      throw err;
    }
  };

  const validateCategoryDeletion = useCallback(async (categoryName: string): Promise<CategoryUsageInfo> => {
    if (!companyId) throw new Error('Company ID required');
    return await CompanyDeviceCategoriesService.validateCategoryDeletion(companyId, categoryName);
  }, [companyId]);

  const bulkUpdateProductCategories = useCallback(async (fromCategory: string, toCategory: string | null): Promise<number> => {
    if (!companyId) throw new Error('Company ID required');
    return await CompanyDeviceCategoriesService.bulkUpdateProductCategories(companyId, fromCategory, toCategory);
  }, [companyId]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    validateCategoryDeletion,
    bulkUpdateProductCategories,
    loadCategories,
    refreshCategories: loadCategories
  };
};
