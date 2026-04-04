import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
  document_id?: string;
  document_name?: string;
  group_id?: string;
  data?: any;
}

export function useNotifications(companyId?: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!companyId) return;

    try {
      const notificationService = new NotificationService();
      const data = await notificationService.getNotifications(companyId, user?.id);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: NotificationItem) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notifications
    if (!companyId || !user?.id) return;

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, user?.id]);

  const markAsRead = async (notificationId: string) => {
    const notificationService = new NotificationService();
    await notificationService.markAsRead(notificationId);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!companyId) return;
    const notificationService = new NotificationService();
    await notificationService.markAllAsRead(companyId, user?.id);
    fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
