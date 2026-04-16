import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { AppNotificationService, AppNotification } from '@/services/appNotificationService';

const service = new AppNotificationService();

export function useAppNotifications(companyId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!companyId || !user?.id) return;

    try {
      const data = await service.getNotifications(user.id, companyId, { limit: 50 });
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching app notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription — filtered by user_id for efficiency
  useEffect(() => {
    if (!companyId || !user?.id) return;

    const channelId = crypto.randomUUID();
    const channel = supabase
      .channel(`app-notifications-${user.id}-${companyId}-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          console.log('[AppNotifications] Realtime INSERT received:', newNotification.title, 'category:', newNotification.category);
          // Only add if it belongs to the current company
          if (newNotification.company_id === companyId) {
            setNotifications((prev) => {
              // Avoid duplicates (in case of reconnection)
              if (prev.some((n) => n.id === newNotification.id)) return prev;
              return [newNotification, ...prev];
            });
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as AppNotification;
          if (updated.company_id === companyId) {
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
            // Recalculate unread count
            setNotifications((prev) => {
              setUnreadCount(prev.filter((n) => !n.is_read).length);
              return prev;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[AppNotifications] Realtime channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await service.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!companyId || !user?.id) return;
    await service.markAllAsRead(user.id, companyId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    setUnreadCount(0);
  }, [companyId, user?.id]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
