import { supabase } from '@/integrations/supabase/client';
import { CreateUserNeedRequest, UpdateUserNeedRequest, UserNeed, CATEGORY_PREFIX_MAP } from '@/components/product/design-risk-controls/user-needs/types';

export class UserNeedsService {
  /**
   * Generate the next user need ID with domain prefix, e.g. UN-DR-01, UN-C-02.
   */
  private static async generateUserNeedId(productId: string, category: string, basePrefix?: string): Promise<string> {
    // Build the domain suffix from CATEGORY_PREFIX_MAP, but replace the default "UN-" base with the company prefix
    const defaultMapping = CATEGORY_PREFIX_MAP[category] || 'UN-C';
    const effectiveBase = basePrefix || 'UN-';
    
    // Replace the default "UN-" prefix with the company's custom base prefix
    // e.g., if defaultMapping is "UN-DR" and basePrefix is "UNR-", result is "UNR-DR"
    const prefix = defaultMapping.replace(/^UN-/, effectiveBase);

    // Find the highest existing ID with this prefix for this product
    const { data: existingNeeds } = await supabase
      .from('user_needs')
      .select('user_need_id')
      .eq('product_id', productId)
      .ilike('user_need_id', `${prefix}-%`)
      .order('user_need_id', { ascending: false })
      .limit(1);

    if (!existingNeeds || existingNeeds.length === 0) {
      return `${prefix}-01`;
    }

    // Extract number from the last segment (e.g., "UN-DR-05" -> 5)
    const lastId = existingNeeds[0].user_need_id;
    const segments = lastId.split('-');
    const lastNumber = parseInt(segments[segments.length - 1], 10);
    const nextNumber = lastNumber + 1;

    return `${prefix}-${nextNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Get all user needs for a product
   */
  static async getUserNeeds(productId: string): Promise<UserNeed[]> {
    const { data, error } = await supabase
      .from('user_needs')
      .select('*')
      .eq('product_id', productId)
      .order('user_need_id', { ascending: true });

    if (error) {
      console.error('Error fetching user needs:', error);
      throw new Error(`Failed to fetch user needs: ${error.message}`);
    }

    return (data || []) as UserNeed[];
  }

  /**
   * Create a new user need
   */
  static async createUserNeed(request: CreateUserNeedRequest & { basePrefix?: string }): Promise<UserNeed> {
    const userNeedId = await this.generateUserNeedId(request.product_id, request.category || 'General', request.basePrefix);

    const { data, error } = await supabase
      .from('user_needs')
      .insert({
        product_id: request.product_id,
        company_id: request.company_id,
        user_need_id: userNeedId,
        description: request.description,
        linked_requirements: request.linked_requirements || '',
        status: request.status,
        category: request.category || 'General',
        created_by: (await supabase.auth.getUser()).data.user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user need:', error);
      throw new Error(`Failed to create user need: ${error.message}`);
    }

    return data as UserNeed;
  }

  /**
   * Update an existing user need
   */
  static async updateUserNeed(id: string, request: UpdateUserNeedRequest): Promise<UserNeed> {
    const { isObjectBaselined } = await import('./baselineLockService');
    const lockStatus = await isObjectBaselined(id, 'user_need');
    if (lockStatus.locked) {
      throw new Error(`BASELINE_LOCKED: This object was baselined in "${lockStatus.reviewTitle}" on ${lockStatus.baselineDate}. Submit a Change Control Request to modify it.`);
    }

    const { data, error } = await supabase
      .from('user_needs')
      .update(request)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user need:', error);
      throw new Error(`Failed to update user need: ${error.message}`);
    }

    return data as UserNeed;
  }

  /**
   * Delete a user need
   */
  static async deleteUserNeed(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_needs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user need:', error);
      throw new Error(`Failed to delete user need: ${error.message}`);
    }
  }
}