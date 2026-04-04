import { supabase } from '@/integrations/supabase/client';
import type {
  ProductUserAccess,
  CreateProductUserAccessInput,
  UpdateProductUserAccessInput,
  ProductUserAccessWithDetails,
  ProductUserAccessFilters,
  ProductUserAccessStats
} from '@/types/productUserAccess';

export class ProductUserAccessService {
  /**
   * Create a new product user access record
   */
  static async createAccess(input: CreateProductUserAccessInput): Promise<ProductUserAccess> {
    const { data, error } = await supabase
      .from('product_user_access')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product user access: ${error.message}`);
    }

    return data as ProductUserAccess;
  }

  /**
   * Get all access records for a product with user details
   */
  static async getProductAccess(productId: string): Promise<ProductUserAccessWithDetails[]> {
    // First get the access records
    const { data: accessData, error: accessError } = await supabase
      .from('product_user_access')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (accessError) {
      throw new Error(`Failed to fetch product access: ${accessError.message}`);
    }

    if (!accessData || accessData.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(accessData.map(a => a.user_id))];

    // Fetch user profiles from the correct table (profiles, not user_profiles)
    // because product_user_access has FK to profiles table
    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    // Combine the data
    const result = accessData.map(access => ({
      ...access,
      user: userProfiles?.find(p => p.id === access.user_id) || null
    }));

    return result as unknown as ProductUserAccessWithDetails[];
  }

  /**
   * Bulk upsert product user access records
   * Creates new records or updates existing ones
   */
  static async bulkUpsertAccess(
    accessRecords: CreateProductUserAccessInput[],
    invitedBy: string | null
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    for (const record of accessRecords) {
      try {
        // Check if record already exists (unique constraint on product_id + user_id where is_active = true)
        const { data: existing } = await supabase
          .from('product_user_access')
          .select('id, is_active')
          .eq('product_id', record.product_id)
          .eq('user_id', record.user_id)
          .eq('is_active', true)
          .maybeSingle();

        if (existing) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('product_user_access')
            .update({
              user_type: record.user_type,
              role_id: record.role_id,
              role_name: record.role_name,
              permissions: record.permissions,
              access_level: record.access_level,
              is_active: record.is_active,
              expires_at: record.expires_at,
              notes: record.notes,
              invited_by: invitedBy || record.invited_by,
            })
            .eq('id', existing.id);

          if (updateError) {
            errors.push(`Failed to update access for user ${record.user_id} and product ${record.product_id}: ${updateError.message}`);
          } else {
            updated++;
          }
        } else {
          // Check if there's an inactive record to reactivate
          const { data: inactiveRecord } = await supabase
            .from('product_user_access')
            .select('id')
            .eq('product_id', record.product_id)
            .eq('user_id', record.user_id)
            .eq('is_active', false)
            .maybeSingle();

          if (inactiveRecord) {
            // Reactivate existing inactive record
            const { error: reactivateError } = await supabase
              .from('product_user_access')
              .update({
                user_type: record.user_type,
                role_id: record.role_id,
                role_name: record.role_name,
                permissions: record.permissions,
                access_level: record.access_level,
                is_active: true,
                expires_at: record.expires_at,
                notes: record.notes,
                invited_by: invitedBy || record.invited_by,
              })
              .eq('id', inactiveRecord.id);

            if (reactivateError) {
              errors.push(`Failed to reactivate access for user ${record.user_id} and product ${record.product_id}: ${reactivateError.message}`);
            } else {
              updated++;
            }
          } else {
            // Create new record
            const { error: insertError } = await supabase
              .from('product_user_access')
              .insert({
                ...record,
                invited_by: invitedBy || record.invited_by,
              });

            if (insertError) {
              errors.push(`Failed to create access for user ${record.user_id} and product ${record.product_id}: ${insertError.message}`);
            } else {
              created++;
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing access for user ${record.user_id} and product ${record.product_id}: ${errorMessage}`);
      }
    }

    return { created, updated, errors };
  }

  /**
   * Get all active product-user access for a company's products
   */
  static async getCompanyProductAccess(companyId: string, productIds: string[]): Promise<Record<string, Set<string>>> {
    if (productIds.length === 0) return {};

    const { data, error } = await supabase
      .from('product_user_access')
      .select('product_id, user_id')
      .in('product_id', productIds)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching product user access:', error);
      return {};
    }

    // Group by user_id, collect product_ids
    const result: Record<string, Set<string>> = {};
    data?.forEach(access => {
      if (!result[access.user_id]) {
        result[access.user_id] = new Set();
      }
      result[access.user_id].add(access.product_id);
    });

    return result;
  }

  /**
   * Deactivate product-user access records (soft delete)
   */
  static async deactivateAccess(productIds: string[], userIds: string[]): Promise<number> {
    if (productIds.length === 0 || userIds.length === 0) return 0;

    const { data, error } = await supabase
      .from('product_user_access')
      .update({ is_active: false })
      .in('product_id', productIds)
      .in('user_id', userIds)
      .eq('is_active', true)
      .select('id');

    if (error) {
      console.error('Error deactivating access:', error);
      return 0;
    }

    return data?.length || 0;
  }
}
