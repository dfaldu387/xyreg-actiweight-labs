import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlatformChange {
  id: string;
  platform_name: string;
  change_description: string;
  change_type: 'document_update' | 'version_release' | 'architecture_change' | 'risk_update';
  changed_by: string;
  change_date: string;
  version?: string;
  affected_documents?: string[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  product_id: string;
  platform_change_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  impact_assessment_required: boolean;
}

export class PlatformChangeManagementService {
  static async recordPlatformChange(change: Omit<PlatformChange, 'id' | 'change_date'>): Promise<{ success: boolean; changeId?: string; error?: string }> {
    try {
      // Store platform change as an activity with special metadata
      const { data: changeRecord, error } = await supabase
        .from('activities')
        .insert({
          name: `Platform Change: ${change.platform_name}`,
          description: change.change_description,
          type: 'platform_change',
          status: 'completed',
          company_id: '', // Will be set by the calling code
          admin_comments: JSON.stringify({
            platform_name: change.platform_name,
            change_type: change.change_type,
            changed_by: change.changed_by,
            version: change.version,
            affected_documents: change.affected_documents || []
          })
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error recording platform change:', error);
        return { success: false, error: error.message };
      }

      // Automatically generate action items for affected products
      await this.generateActionItemsForPlatformChange(changeRecord.id, change.platform_name, change.change_type);

      return { success: true, changeId: changeRecord.id };
    } catch (error) {
      console.error('Error in recordPlatformChange:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async generateActionItemsForPlatformChange(
    changeId: string,
    platformName: string,
    changeType: string
  ): Promise<void> {
    try {
      // Find all products that use this platform
      const { data: affectedProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, company_id')
        .eq('product_platform', platformName)
        .eq('is_archived', false);

      if (productsError) {
        console.error('Error finding affected products:', productsError);
        return;
      }

      if (!affectedProducts || affectedProducts.length === 0) {
        console.log('No products affected by platform change');
        return;
      }

      // Generate action items for each affected product
      const actionItems = affectedProducts.map(product => ({
        type: 'platform_impact_assessment',
        name: `Platform Change Impact Assessment - ${product.name}`,
        description: `Assess the impact of ${changeType} changes to platform "${platformName}" on product "${product.name}".`,
        status: 'planned',
        product_id: product.id,
        company_id: product.company_id,
        platform_change_id: changeId,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        admin_approved: false
      }));

      const { error: insertError } = await supabase
        .from('activities')
        .insert(actionItems);

      if (insertError) {
        console.error('Error creating action items:', insertError);
      } else {
        console.log(`Created ${actionItems.length} action items for platform change`);
        toast.success(`Generated ${actionItems.length} impact assessment tasks for affected products`);
      }
    } catch (error) {
      console.error('Error generating action items:', error);
    }
  }

  static async getPlatformChanges(platformName: string): Promise<PlatformChange[]> {
    try {
      const { data: changes, error } = await supabase
        .from('activities')
        .select('*')
        .eq('type', 'platform_change')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching platform changes:', error);
        return [];
      }

      // Filter and transform activities to PlatformChange format
      const platformChanges = changes?.filter(activity => {
        try {
          const metadata = JSON.parse(activity.admin_comments || '{}');
          return metadata.platform_name === platformName;
        } catch {
          return false;
        }
      }).map(activity => {
        const metadata = JSON.parse(activity.admin_comments || '{}');
         return {
           id: activity.id,
           platform_name: metadata.platform_name,
           change_description: activity.name || '',
           change_type: metadata.change_type,
           changed_by: metadata.changed_by,
           change_date: activity.created_at,
           version: metadata.version,
           affected_documents: metadata.affected_documents
         } as PlatformChange;
      }) || [];

      return platformChanges;
    } catch (error) {
      console.error('Error in getPlatformChanges:', error);
      return [];
    }
  }

  static async getActionItemsForProduct(productId: string): Promise<ActionItem[]> {
    try {
      const { data: actionItems, error } = await supabase
        .from('activities')
        .select('*')
        .eq('product_id', productId)
        .eq('type', 'platform_impact_assessment')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching action items:', error);
        return [];
      }

       // Transform activities to ActionItem format
       const transformedItems = actionItems?.map(activity => ({
         id: activity.id,
         title: activity.name || '',
         description: activity.admin_comments || '',
         assigned_to: (() => {
           if (!activity.assignee_ids) return '';
           if (Array.isArray(activity.assignee_ids)) return activity.assignee_ids[0]?.toString() || '';
           return activity.assignee_ids.toString();
         })(),
         product_id: activity.product_id || '',
         platform_change_id: activity.id,
         status: activity.status as 'pending' | 'in_progress' | 'completed',
         due_date: activity.due_date || '',
         impact_assessment_required: true
       })) || [];

      return transformedItems;
    } catch (error) {
      console.error('Error in getActionItemsForProduct:', error);
      return [];
    }
  }

  static async markActionItemComplete(actionItemId: string, impactAssessment?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status: 'completed',
        end_date: new Date().toISOString().split('T')[0]
      };

      if (impactAssessment) {
        updateData.admin_comments = impactAssessment;
      }

      const { error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', actionItemId);

      if (error) {
        console.error('Error marking action item complete:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markActionItemComplete:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}