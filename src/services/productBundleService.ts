import { supabase } from '@/integrations/supabase/client';
import { ProductBundle, ProductBundleWithVariants, ProductWithVariants, BundleStats, SiblingGroupInBundle } from '@/types/productBundle';

export class ProductBundleService {
  /**
   * Get all products in a bundle (main + accessories + consumables)
   */
  static async getProductBundle(productId: string, companyId: string): Promise<ProductBundle> {
    try {
      // Get relationships where this product is the main product
      const { data: relationships, error } = await supabase
        .from('product_accessory_relationships')
        .select(`
          id,
          relationship_type,
          accessory_product_id,
          initial_multiplier
        `)
        .eq('main_product_id', productId)
        .eq('company_id', companyId);

      if (error) {
        console.error('[ProductBundleService] Error fetching relationships:', error);
        throw error;
      }

      // Get the main product
      const { data: mainProduct } = await supabase
        .from('products')
        .select('id, name, description, company_id, project_types')
        .eq('id', productId)
        .single();

      // Get all accessory products separately
      const accessoryProductIds = relationships?.map(r => r.accessory_product_id) || [];
      let accessoryProducts: any[] = [];
      
      if (accessoryProductIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, description, company_id, project_types')
          .in('id', accessoryProductIds);
        
        accessoryProducts = products || [];
      }

      // Create a map of product ID to product data
      const productMap = new Map(accessoryProducts.map(p => [p.id, p]));

      // Organize by relationship type
      const accessories = relationships
        ?.filter(r => r.relationship_type === 'accessory')
        .map(r => productMap.get(r.accessory_product_id))
        .filter(Boolean) || [];

      const consumables = relationships
        ?.filter(r => r.relationship_type === 'consumable')
        .map(r => productMap.get(r.accessory_product_id))
        .filter(Boolean) || [];

      const bundleItems = relationships
        ?.filter(r => ['component', 'required', 'optional', 'replacement_part'].includes(r.relationship_type))
        .map(r => productMap.get(r.accessory_product_id))
        .filter(Boolean) || [];

      const crossSells: any[] = [];
      const upsells: any[] = [];

      // Get sibling group relationships
      const { data: siblingGroupRels } = await supabase
        .from('product_sibling_group_relationships')
        .select(`
          id,
          relationship_type,
          accessory_sibling_group_id,
          initial_multiplier,
          product_sibling_groups!inner (
            id,
            name,
            basic_udi_di,
            description,
            distribution_pattern
          )
        `)
        .eq('main_product_id', productId)
        .eq('company_id', companyId);

      // Get product counts for each sibling group
      const siblingGroups: SiblingGroupInBundle[] = await Promise.all(
        (siblingGroupRels || []).map(async (rel: any) => {
          const { count } = await supabase
            .from('product_sibling_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('sibling_group_id', rel.product_sibling_groups.id);

          return {
            groupId: rel.product_sibling_groups.id,
            groupName: rel.product_sibling_groups.name,
            basicUdiDi: rel.product_sibling_groups.basic_udi_di,
            description: rel.product_sibling_groups.description,
            productCount: count || 0,
            relationshipType: rel.relationship_type,
            multiplier: rel.initial_multiplier,
            distributionPattern: rel.product_sibling_groups.distribution_pattern,
          };
        })
      );

      return {
        mainProduct: mainProduct as any || null,
        accessories: accessories as any[],
        consumables: consumables as any[],
        bundleItems: bundleItems as any[],
        crossSells: crossSells as any[],
        upsells: upsells as any[],
        siblingGroups: siblingGroups
      };
    } catch (error) {
      console.error('[ProductBundleService] Error in getProductBundle:', error);
      // Return empty bundle instead of throwing
      return {
        mainProduct: null,
        accessories: [],
        consumables: [],
        bundleItems: [],
        crossSells: [],
        upsells: [],
        siblingGroups: []
      };
    }
  }

  /**
   * Get bundle with variants for each product
   */
  static async getProductBundleWithVariants(
    productId: string,
    companyId: string
  ): Promise<ProductBundleWithVariants> {
    const bundle = await this.getProductBundle(productId, companyId);

    // Get relationships again to have multiplier/quantity data
    const { data: relationships } = await supabase
      .from('product_accessory_relationships')
      .select('*')
      .eq('main_product_id', productId);

    const relationshipMap = new Map(
      relationships?.map(r => [r.accessory_product_id, r]) || []
    );

    // Helper to get variants for products
    const getProductsWithVariants = async (
      products: any[],
      relationshipType: 'component' | 'accessory' | 'consumable' | 'required' | 'optional' | 'replacement_part'
    ): Promise<ProductWithVariants[]> => {
      return Promise.all(
        products.map(async (product) => {
          const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', product.id);

          const relationship = relationshipMap.get(product.id);

          return {
            product,
            variants: variants || [],
            relationshipType,
            multiplier: relationship?.initial_multiplier,
            quantity: 1
          };
        })
      );
    };

    const [accessoriesWithVariants, consumablesWithVariants, bundleItemsWithVariants] = await Promise.all([
      getProductsWithVariants(bundle.accessories, 'accessory'),
      getProductsWithVariants(bundle.consumables, 'consumable'),
      getProductsWithVariants(bundle.bundleItems, 'component')
    ]);

    return {
      ...bundle,
      accessoriesWithVariants,
      consumablesWithVariants,
      bundleItemsWithVariants
    };
  }

  /**
   * Check if product is part of any bundle
   */
  static async isProductInBundle(productId: string): Promise<boolean> {
    const { count } = await supabase
      .from('product_accessory_relationships')
      .select('*', { count: 'exact', head: true })
      .or(`main_product_id.eq.${productId},accessory_product_id.eq.${productId}`);

    return (count || 0) > 0;
  }

  /**
   * Get bundle statistics
   */
  static async getBundleStats(productId: string): Promise<BundleStats> {
    const { data: relationships } = await supabase
      .from('product_accessory_relationships')
      .select('relationship_type, accessory_product_id')
      .eq('main_product_id', productId);

    const productIds = relationships?.map(r => r.accessory_product_id) || [];
    
    let totalVariants = 0;
    if (productIds.length > 0) {
      const { count } = await supabase
        .from('product_variants')
        .select('*', { count: 'exact', head: true })
        .in('product_id', productIds);
      totalVariants = count || 0;
    }

    const hasAccessories = relationships?.some(r => r.relationship_type === 'accessory') || false;
    const hasConsumables = relationships?.some(r => r.relationship_type === 'consumable') || false;
    const hasBundleItems = relationships?.some(r => ['component', 'required', 'optional', 'replacement_part'].includes(r.relationship_type)) || false;

    // Get sibling group relationships
    const { data: siblingGroupRels } = await supabase
      .from('product_sibling_group_relationships')
      .select('accessory_sibling_group_id')
      .eq('main_product_id', productId);

    const hasSiblingGroups = (siblingGroupRels?.length || 0) > 0;
    const totalSiblingGroups = siblingGroupRels?.length || 0;

    // Total products includes both regular products and sibling groups
    const totalProducts = productIds.length + totalSiblingGroups;

    return {
      totalProducts,
      totalVariants,
      hasAccessories,
      hasConsumables,
      hasBundleItems,
      hasSiblingGroups,
      totalSiblingGroups
    };
  }
}
