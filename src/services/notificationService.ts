import { supabase } from '@/integrations/supabase/client';

export interface Notification {
    title: string;
    message: string;
    type: 'group_create' | 'group_updated' | 'group_delete' | 'group_member_added' | 'group_member_removed' | 'document_assigned' | 'communication';
    group_id?: string;
    company_id: string;
    user_id?: string;
    is_read?: boolean;
    created_at?: string;
    data?: any;
    time?: string;
    id?: string;
    is_remove?: boolean;
    document_id?: string;
    document_name?: string;
}

export class NotificationService {
    async addNotification(notification: Notification): Promise<{ error: any }> {
        const { title, message, type, group_id, company_id, user_id, is_read = false, created_at = new Date().toISOString(), data = null } = notification;
        const { error } = await supabase.from('notifications').insert({
            title,
            message,
            type,
            group_id,
            company_id,
            user_id: user_id || null,
            is_read,
            data,
            is_remove: false,
        });
        if (error) {
            console.error('Failed to send notification:', error);
        }
        return { error };
    }
    async getNotifications(companyId: string, userId?: string) {
        let query = supabase.from('notifications').select('*').eq('company_id', companyId).eq('is_remove', false);
        if (userId) {
            // Show notifications targeted to user OR broadcast (null user_id)
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            console.error('Failed to get notifications:', error);
        }
        return data;
    }
    async markAsRead(notificationId: string) {
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
        if (error) {
            console.error('Failed to mark notification as read:', error);
        }
        return error;
    }
    async markAllAsRead(companyId: string, userId?: string) {
        let query = supabase.from('notifications').update({ is_read: true }).eq('company_id', companyId).eq('is_remove', false);
        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }
        const { error } = await query;
        if (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
        return error;
    }
    async removeNotification(notificationId: string) {
        const { error } = await supabase.from('notifications').update({ is_remove: true }).eq('id', notificationId);
        if (error) {
            console.error('Failed to remove notification:', error);
        }
        return error;
    }
}
