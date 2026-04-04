import { supabase } from '@/integrations/supabase/client';

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id: string | null;
  actor_name: string | null;
  company_id: string;
  product_id: string | null;
  category: string;
  action: string;
  title: string;
  message: string | null;
  priority: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  action_url: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface CreateAppNotificationParams {
  user_id: string;
  actor_id?: string;
  actor_name?: string;
  company_id: string;
  product_id?: string;
  category: string;
  action: string;
  title: string;
  message?: string;
  priority?: string;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export class AppNotificationService {
  /**
   * Create a single notification
   */
  async createNotification(params: CreateAppNotificationParams): Promise<{ error: any }> {
    const { error } = await supabase.from('app_notifications').insert({
      user_id: params.user_id,
      actor_id: params.actor_id || null,
      actor_name: params.actor_name || null,
      company_id: params.company_id,
      product_id: params.product_id || null,
      category: params.category,
      action: params.action,
      title: params.title,
      message: params.message || null,
      priority: params.priority || 'normal',
      entity_type: params.entity_type || null,
      entity_id: params.entity_id || null,
      entity_name: params.entity_name || null,
      action_url: params.action_url || null,
      metadata: params.metadata || {},
    });

    if (error) {
      console.error('Failed to create app notification:', error);
    }
    return { error };
  }

  /**
   * Bulk create notifications (e.g. notify all members of a reviewer group)
   */
  async createBulkNotifications(notifications: CreateAppNotificationParams[]): Promise<{ error: any }> {
    if (notifications.length === 0) return { error: null };

    const rows = notifications.map((n) => ({
      user_id: n.user_id,
      actor_id: n.actor_id || null,
      actor_name: n.actor_name || null,
      company_id: n.company_id,
      product_id: n.product_id || null,
      category: n.category,
      action: n.action,
      title: n.title,
      message: n.message || null,
      priority: n.priority || 'normal',
      entity_type: n.entity_type || null,
      entity_id: n.entity_id || null,
      entity_name: n.entity_name || null,
      action_url: n.action_url || null,
      metadata: n.metadata || {},
    }));

    const { error } = await supabase.from('app_notifications').insert(rows);

    if (error) {
      console.error('Failed to bulk create app notifications:', error);
    }
    return { error };
  }

  /**
   * Get notifications for a user in a company
   */
  async getNotifications(
    userId: string,
    companyId: string,
    options?: { category?: string; limit?: number; offset?: number }
  ): Promise<AppNotification[]> {
    let query = supabase
      .from('app_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Failed to get app notifications:', error);
      return [];
    }
    return (data || []) as AppNotification[];
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string, companyId: string): Promise<number> {
    const { count, error } = await supabase
      .from('app_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_read', false)
      .eq('is_archived', false);

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
    return count || 0;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('app_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for a user in a company
   */
  async markAllAsRead(userId: string, companyId: string): Promise<void> {
    const { error } = await supabase
      .from('app_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_read', false)
      .eq('is_archived', false);

    if (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  /**
   * Archive a notification (soft delete)
   */
  async archiveNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('app_notifications')
      .update({ is_archived: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to archive notification:', error);
    }
  }
}
