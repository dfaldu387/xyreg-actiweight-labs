import { supabase } from '@/integrations/supabase/client';
import type { ProductBundleGroup, ProductBundleMember, BundleGroupWithMembers, BundleMemberConfig } from '@/types/productBundle';

export class ProductBundleGroupService {
  /**
   * Create a new bundle group with members
   */
  static async createBundleGroup(
    companyId: string,
    bundleName: string,
    members: BundleMemberConfig[],
    description?: string,
    createdByProductId?: string,
    isFeasibilityStudy?: boolean,
    targetMarkets?: string[]
  ): Promise<BundleGroupWithMembers> {
    // Create the bundle group
    const { data: bundle, error: bundleError } = await supabase
      .from('product_bundles')
      .insert({
        company_id: companyId,
        bundle_name: bundleName,
        description,
        created_by_product_id: createdByProductId,
        is_feasibility_study: isFeasibilityStudy || false,
        target_markets: targetMarkets || [],
      })
      .select()
      .single();

    if (bundleError) throw bundleError;

    // Create the bundle members
    const membersToInsert = members.map((member, index) => ({
      bundle_id: bundle.id,
      product_id: member.product_id,
      sibling_group_id: member.sibling_group_id,
      relationship_type: member.relationship_type,
      multiplier: member.multiplier ?? 1,
      quantity: member.quantity,
      is_primary: member.is_primary ?? false,
      position: member.position ?? index,
      attachment_rate: member.attachment_rate ?? 100.00,
      distribution_group_id: member.distribution_group_id,
    }));

    const { data: bundleMembers, error: membersError } = await supabase
      .from('product_bundle_members')
      .insert(membersToInsert)
      .select();

    if (membersError) throw membersError;

    return {
      ...bundle,
      target_markets: Array.isArray(bundle.target_markets) ? bundle.target_markets as string[] : undefined,
      members: (bundleMembers || []) as ProductBundleMember[],
    };
  }

  /**
   * Get all bundles that a product belongs to or was created by
   */
  static async getBundlesForProduct(productId: string): Promise<BundleGroupWithMembers[]> {
    // Get bundles where this product is a direct member
    const { data: members, error: membersError } = await supabase
      .from('product_bundle_members')
      .select(`
        *,
        product_bundles (*)
      `)
      .eq('product_id', productId);

    if (membersError) throw membersError;

    // Get bundles created by this product
    const { data: createdBundles, error: createdError } = await supabase
      .from('product_bundles')
      .select('*')
      .eq('created_by_product_id', productId);

    if (createdError) throw createdError;

    // Get sibling groups this product belongs to
    const { data: siblingAssignments, error: siblingError } = await supabase
      .from('product_sibling_assignments')
      .select('sibling_group_id')
      .eq('product_id', productId);

    if (siblingError) throw siblingError;

    // Get bundles that contain those sibling groups
    let bundlesWithGroups: any[] = [];
    if (siblingAssignments && siblingAssignments.length > 0) {
      const groupIds = siblingAssignments.map(a => a.sibling_group_id);
      const { data: groupMembers, error: groupMembersError } = await supabase
        .from('product_bundle_members')
        .select(`
          *,
          product_bundles (*)
        `)
        .in('sibling_group_id', groupIds);

      if (groupMembersError) throw groupMembersError;
      bundlesWithGroups = groupMembers || [];
    }

    // Group by bundle
    const bundleMap = new Map<string, BundleGroupWithMembers>();
    
    // Add bundles from direct members
    for (const member of members || []) {
      const bundle = member.product_bundles as any;
      if (!bundle) continue;

      if (!bundleMap.has(bundle.id)) {
        bundleMap.set(bundle.id, {
          ...bundle,
          target_markets: Array.isArray(bundle.target_markets) ? bundle.target_markets as string[] : undefined,
          members: [],
        });
      }
    }

    // Add bundles from sibling group members
    for (const member of bundlesWithGroups) {
      const bundle = member.product_bundles as any;
      if (!bundle) continue;

      if (!bundleMap.has(bundle.id)) {
        bundleMap.set(bundle.id, {
          ...bundle,
          target_markets: Array.isArray(bundle.target_markets) ? bundle.target_markets as string[] : undefined,
          members: [],
        });
      }
    }

    // Add bundles created by this product
    for (const bundle of createdBundles || []) {
      if (!bundleMap.has(bundle.id)) {
        bundleMap.set(bundle.id, {
          ...bundle,
          target_markets: Array.isArray(bundle.target_markets) ? bundle.target_markets as string[] : undefined,
          members: [],
        });
      }
    }

    // Fetch all members for each bundle
    for (const [bundleId, bundle] of bundleMap.entries()) {
      const { data: allMembers } = await supabase
        .from('product_bundle_members')
        .select('*')
        .eq('bundle_id', bundleId)
        .order('position');

      if (allMembers) {
        bundle.members = allMembers as ProductBundleMember[];
      }
    }

    return Array.from(bundleMap.values());
  }

  /**
   * Get a specific bundle with all its members (including product and sibling group names)
   */
  static async getBundleDetails(bundleId: string): Promise<BundleGroupWithMembers | null> {
    const { data: bundle, error: bundleError } = await supabase
      .from('product_bundles')
      .select('*')
      .eq('id', bundleId)
      .single();

    if (bundleError) throw bundleError;
    if (!bundle) return null;

    const { data: members, error: membersError } = await supabase
      .from('product_bundle_members')
      .select(`
        *,
        products!product_bundle_members_product_id_fkey (id, name, description, image, images),
        product_sibling_groups!product_bundle_members_sibling_group_id_fkey (id, name, basic_udi_di)
      `)
      .eq('bundle_id', bundleId)
      .order('position');

    if (membersError) throw membersError;

    // Fetch product counts for sibling groups
    const membersWithCounts = await Promise.all(
      (members || []).map(async (member: any) => {
        if (member.sibling_group_id) {
          const { count } = await supabase
            .from('product_sibling_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('sibling_group_id', member.sibling_group_id);
          
          return {
            ...member,
            product_sibling_groups: {
              ...member.product_sibling_groups,
              product_count: count || 0
            }
          };
        }
        return member;
      })
    );

    return {
      ...bundle,
      target_markets: Array.isArray(bundle.target_markets) ? bundle.target_markets as string[] : undefined,
      members: membersWithCounts as any,
    };
  }

  /**
   * Update bundle group name and description
   */
  static async updateBundleGroup(
    bundleId: string,
    updates: { bundle_name?: string; description?: string; is_feasibility_study?: boolean; target_markets?: string[] }
  ): Promise<ProductBundleGroup> {
    const { data, error } = await supabase
      .from('product_bundles')
      .update(updates)
      .eq('id', bundleId)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      target_markets: Array.isArray(data.target_markets) ? data.target_markets as string[] : undefined,
    };
  }

  /**
   * Delete a bundle group (and all its members via cascade)
   */
  static async deleteBundleGroup(bundleId: string): Promise<void> {
    const { error } = await supabase
      .from('product_bundles')
      .delete()
      .eq('id', bundleId);

    if (error) throw error;
  }

  /**
   * Add a member to an existing bundle
   */
  static async addMemberToBundle(
    bundleId: string,
    memberConfig: BundleMemberConfig
  ): Promise<ProductBundleMember> {
    // Get current max position
    const { data: existingMembers } = await supabase
      .from('product_bundle_members')
      .select('position')
      .eq('bundle_id', bundleId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = existingMembers && existingMembers.length > 0 
      ? (existingMembers[0].position || 0) + 1 
      : 0;

    const { data, error } = await supabase
      .from('product_bundle_members')
      .insert({
        bundle_id: bundleId,
        product_id: memberConfig.product_id,
        sibling_group_id: memberConfig.sibling_group_id,
        relationship_type: memberConfig.relationship_type,
        multiplier: memberConfig.multiplier ?? 1,
        quantity: memberConfig.quantity,
        is_primary: memberConfig.is_primary ?? false,
        position: memberConfig.position ?? nextPosition,
        attachment_rate: memberConfig.attachment_rate ?? 100.00,
        distribution_group_id: memberConfig.distribution_group_id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProductBundleMember;
  }

  /**
   * Remove a member from a bundle
   */
  static async removeMemberFromBundle(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('product_bundle_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  /**
   * Update a bundle member's configuration
   */
  static async updateBundleMember(
    memberId: string,
    updates: Partial<BundleMemberConfig>
  ): Promise<ProductBundleMember> {
    const { data, error } = await supabase
      .from('product_bundle_members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data as ProductBundleMember;
  }

  /**
   * Get bundle details with variants for each product member
   */
  static async getBundleDetailsWithVariants(bundleId: string): Promise<any> {
    const bundleDetails = await this.getBundleDetails(bundleId);
    if (!bundleDetails) return null;

    // Fetch variants for each product member
    const membersWithVariants = await Promise.all(
      bundleDetails.members.map(async (member: any) => {
        if (member.product_id) {
          const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', member.product_id)
            .order('name');

          return {
            ...member,
            variants: variants || [],
          };
        }
        return member;
      })
    );

    return {
      ...bundleDetails,
      members: membersWithVariants,
    };
  }

  /**
   * Generate auto-incremented bundle name for a product
   */
  static async generateBundleName(productId: string, companyId: string): Promise<string> {
    // Get the product name
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single();

    if (!product) {
      return 'Bundle 1';
    }

    // Get all bundles created by this product with the product name prefix
    const { data: bundles } = await supabase
      .from('product_bundles')
      .select('bundle_name')
      .eq('company_id', companyId)
      .like('bundle_name', `${product.name} Bundle %`);

    if (!bundles || bundles.length === 0) {
      return `${product.name} Bundle 1`;
    }

    // Extract numbers from bundle names
    const numbers = bundles
      .map(b => {
        const match = b.bundle_name.match(/Bundle (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);

    const maxNumber = Math.max(...numbers, 0);
    return `${product.name} Bundle ${maxNumber + 1}`;
  }
}
