import { supabase } from '@/integrations/supabase/client';
import type {
  UserProductMatrix,
  CreateUserProductMatrixInput,
  UpdateUserProductMatrixInput,
  UserProductMatrixWithDetails
} from '@/types/userProductMatrix';

export class UserProductMatrixService {
  /**
   * Create or update a user-product matrix record
   * Uses upsert based on unique constraint (user_id, company_id)
   */
  static async upsertMatrix(input: CreateUserProductMatrixInput, assignedBy: string | null): Promise<UserProductMatrix> {
    const { data, error } = await supabase
      .from('user_product_matrix')
      .upsert({
        ...input,
        assigned_by: assignedBy || input.assigned_by,
        assigned_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,company_id',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert user-product matrix: ${error.message}`);
    }

    return data as UserProductMatrix;
  }

  /**
   * Get matrix records for a company
   */
  static async getCompanyMatrix(companyId: string): Promise<UserProductMatrixWithDetails[]> {
    const { data, error } = await supabase
      .from('user_product_matrix')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch company matrix: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch user details - try profiles first, fallback to user_profiles
    const userIds = [...new Set(data.map(m => m.user_id))];
    console.log('userIds', userIds);
    // Try profiles table first
    // let { data: users } = await supabase
    //   .from('profiles')
    //   .select('id, email, first_name, last_name')
    //   .in('id', userIds);

    // If no results, try user_profiles (in case profiles doesn't exist)
    // if (!users || users.length === 0) {
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name')
      .in('id', userIds);
    const users = userProfiles as any;
    // }

    // Combine data
    return data.map(matrix => ({
      ...matrix,
      user: users?.find((u: any) => u.id === matrix.user_id) || undefined,
    })) as UserProductMatrixWithDetails[];
  }

  /**
   * Get matrix record for a specific user in a company
   */
  static async getUserMatrix(userId: string, companyId: string): Promise<UserProductMatrix | null> {
    const { data, error } = await supabase
      .from('user_product_matrix')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch user matrix: ${error.message}`);
    }

    return data as UserProductMatrix | null;
  }

  /**
   * Bulk upsert matrix records for multiple users
   */
  static async bulkUpsertMatrix(
    records: CreateUserProductMatrixInput[],
    assignedBy: string | null
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    for (const record of records) {
      try {
        // Check if record exists
        const existing = await this.getUserMatrix(record.user_id, record.company_id);

        const matrixData = {
          ...record,
          assigned_by: assignedBy || record.assigned_by,
          assigned_at: existing ? existing.assigned_at : new Date().toISOString(),
        };

        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('user_product_matrix')
            .update(matrixData)
            .eq('id', existing.id);

          if (updateError) {
            errors.push(`Failed to update matrix for user ${record.user_id}: ${updateError.message}`);
          } else {
            updated++;
          }
        } else {
          // Create new
          const { error: insertError } = await supabase
            .from('user_product_matrix')
            .insert(matrixData);

          if (insertError) {
            errors.push(`Failed to create matrix for user ${record.user_id}: ${insertError.message}`);
          } else {
            created++;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing matrix for user ${record.user_id}: ${errorMessage}`);
      }
    }

    return { created, updated, errors };
  }

  /**
   * Deactivate matrix records (soft delete)
   */
  static async deactivateMatrix(userIds: string[], companyId: string): Promise<number> {
    if (userIds.length === 0) return 0;

    const { data, error } = await supabase
      .from('user_product_matrix')
      .update({ is_active: false })
      .in('user_id', userIds)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .select('id');

    if (error) {
      console.error('Error deactivating matrix:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Get all product IDs that a user has access to
   */
  static async getUserProductIds(userId: string, companyId: string): Promise<string[]> {
    const matrix = await this.getUserMatrix(userId, companyId);
    return matrix?.product_ids || [];
  }

  /**
   * Get all user IDs that have access to a specific product
   */
  static async getProductUserIds(productId: string, companyId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_product_matrix')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .contains('product_ids', [productId]);

    if (error) {
      console.error('Error fetching product user IDs:', error);
      return [];
    }

    return data?.map(m => m.user_id) || [];
  }

  /**
   * Convert matrix format to the old format (for backward compatibility)
   * Returns Record<user_id, Set<product_id>>
   */
  static async getCompanyProductAccess(companyId: string): Promise<Record<string, Set<string>>> {
    const matrixRecords = await this.getCompanyMatrix(companyId);
    const result: Record<string, Set<string>> = {};

    matrixRecords.forEach(matrix => {
      result[matrix.user_id] = new Set(matrix.product_ids);
    });

    return result;
  }
}

