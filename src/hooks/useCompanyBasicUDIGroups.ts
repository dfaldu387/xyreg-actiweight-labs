import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductWithBasicUDI } from './useProductsByBasicUDI';
import { isValidUUID } from '@/utils/uuidValidation';

export interface BasicUDICluster {
  basicUDI: string;
  groupId?: string; // ID from basic_udi_di_groups table
  groupName?: string; // internal_reference from basic_udi_di_groups
  displayAsMerged?: boolean; // Whether to show as single merged card
  products: ProductWithBasicUDI[];
  groupedCount: number;
  ungroupedCount: number;
  totalCount: number;
  groupedProductIds: Set<string>; // IDs of products in sibling groups
  siblingGroups: Array<{
    id: string;
    name: string;
    distribution_pattern: string;
    total_percentage: number;
    product_count: number;
  }>;
}

export function useCompanyBasicUDIGroups(companyId: string | undefined) {
  return useQuery<BasicUDICluster[]>({
    queryKey: ['company-basic-udi-groups', companyId],
    queryFn: async (): Promise<BasicUDICluster[]> => {
      if (!isValidUUID(companyId)) return [];

      // Get basic_udi_di_groups metadata
      const { data: basicUDIGroupsData, error: basicUDIError } = await supabase
        .from('basic_udi_di_groups')
        .select('id, basic_udi_di, internal_reference, company_id, display_as_merged')
        .eq('company_id', companyId);

      if (basicUDIError) throw basicUDIError;

      // Get all products with basic_udi_di (excluding legacy master products)
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, trade_name, udi_di, basic_udi_di, model_reference, device_category, status, sibling_group_id')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .eq('is_master_product', false)  // Exclude legacy master products
        .not('basic_udi_di', 'is', null)
        .order('basic_udi_di', { ascending: true })
        .order('name', { ascending: true });

      if (productsError) throw productsError;

      // Get all sibling groups with assignments
      const { data: siblingGroups, error: groupsError } = await supabase
        .from('product_sibling_groups')
        .select(`
          id,
          basic_udi_di,
          name,
          distribution_pattern,
          total_percentage,
          product_sibling_assignments (
            id,
            product_id,
            percentage,
            position
          )
        `)
        .eq('company_id', companyId)
        .order('position', { ascending: true });

      if (groupsError) throw groupsError;

      // Group products by basic_udi_di
      const clustersMap = new Map<string, BasicUDICluster>();
      
      // Create a map of basic_udi_di to group metadata
      const groupMetadataMap = new Map();
      basicUDIGroupsData?.forEach((group: any) => {
        groupMetadataMap.set(group.basic_udi_di, {
          groupId: group.id,
          groupName: group.internal_reference,
          displayAsMerged: group.display_as_merged || false,
        });
      });

      products?.forEach((product: ProductWithBasicUDI) => {
        if (!product.basic_udi_di) return;

        if (!clustersMap.has(product.basic_udi_di)) {
          const metadata = groupMetadataMap.get(product.basic_udi_di) || {};
          clustersMap.set(product.basic_udi_di, {
            basicUDI: product.basic_udi_di,
            groupId: metadata.groupId,
            groupName: metadata.groupName,
            displayAsMerged: metadata.displayAsMerged || false,
            products: [],
            groupedCount: 0,
            ungroupedCount: 0,
            totalCount: 0,
            groupedProductIds: new Set<string>(),
            siblingGroups: [],
          });
        }

        const cluster = clustersMap.get(product.basic_udi_di)!;
        cluster.products.push(product);
        cluster.totalCount++;
        
        if (product.sibling_group_id) {
          cluster.groupedCount++;
        } else {
          cluster.ungroupedCount++;
        }
      });

      // Build a set of all product IDs that are in any sibling group
      const groupedProductIds = new Set<string>();
      siblingGroups?.forEach((group: any) => {
        group.product_sibling_assignments?.forEach((assignment: any) => {
          groupedProductIds.add(assignment.product_id);
        });
      });

      // Recalculate grouped/ungrouped counts and store grouped IDs in each cluster
      clustersMap.forEach((cluster) => {
        cluster.groupedCount = 0;
        cluster.ungroupedCount = 0;
        cluster.groupedProductIds = new Set<string>();
        
        cluster.products.forEach((product) => {
          if (groupedProductIds.has(product.id)) {
            cluster.groupedCount++;
            cluster.groupedProductIds.add(product.id);
          } else {
            cluster.ungroupedCount++;
          }
        });
      });

      // Add sibling group information to each cluster
      siblingGroups?.forEach((group: any) => {
        const cluster = clustersMap.get(group.basic_udi_di);
        if (cluster) {
          cluster.siblingGroups.push({
            id: group.id,
            name: group.name,
            distribution_pattern: group.distribution_pattern,
            total_percentage: group.total_percentage,
            product_count: group.product_sibling_assignments?.length || 0,
          });
        }
      });

      return Array.from(clustersMap.values()).sort((a, b) => 
        a.basicUDI.localeCompare(b.basicUDI)
      );
    },
    enabled: isValidUUID(companyId),
    staleTime: 30 * 1000, // 30 seconds
  });
}
