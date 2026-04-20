import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { CommunicationThread, CommunicationMessage, ThreadParticipant } from '@/types/communications';
import { toast } from 'sonner';
import { AppNotificationService } from '@/services/appNotificationService';

interface UseCommunicationThreadsOptions {
  companyId?: string;
  status?: string;
  searchQuery?: string;
}

export function useCommunicationThreads(options: UseCommunicationThreadsOptions = {}) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Dedicated stats query — always fetches ALL threads for accurate counts
  const { data: stats } = useQuery({
    queryKey: ['communication-threads-stats', user?.id, options.companyId],
    queryFn: async () => {
      if (!user) return { unreadCount: 0, activeCount: 0, awaitingResponseCount: 0, myThreadsCount: 0 };

      // Fetch all threads for this company (no status/search filter)
      let query = supabase
        .from('communication_threads')
        .select(`
          id, status, created_by,
          thread_participants!inner(user_id, unread_count, role)
        `)
        .order('last_activity_at', { ascending: false });

      if (options.companyId) {
        query = query.eq('company_id', options.companyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let unreadCount = 0;
      let activeCount = 0;
      let awaitingResponseCount = 0;
      let myThreadsCount = 0;

      (data || []).forEach((thread: any) => {
        const myParticipant = (thread.thread_participants || []).find((p: any) => p.user_id === user.id);
        const myUnread = myParticipant?.unread_count || 0;

        if (myUnread > 0) {
          console.log('[Stats] Thread with unread:', thread.id, 'unread:', myUnread, 'participants:', thread.thread_participants);
        }

        unreadCount += myUnread;
        if (thread.status === 'Active') activeCount++;
        if (thread.status === 'Awaiting Response') awaitingResponseCount++;
        if (thread.created_by === user.id || myParticipant?.role === 'owner') myThreadsCount++;
      });

      console.log('[Stats] Total unread:', unreadCount, 'active:', activeCount, 'myThreads:', myThreadsCount, 'threads count:', (data || []).length);

      return { unreadCount, activeCount, awaitingResponseCount, myThreadsCount };
    },
    enabled: !!user,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });

  // Real-time subscriptions for live stats updates
  useEffect(() => {
    if (!user) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const invalidateAll = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['communication-threads-stats'] });
        queryClient.refetchQueries({ queryKey: ['communication-threads'] });
      }, 500);
    };

    // Delayed refetch — gives time for DB trigger to update unread_count after message insert
    const invalidateDelayed = () => {
      invalidateAll();
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['communication-threads-stats'] });
        queryClient.refetchQueries({ queryKey: ['communication-threads'] });
      }, 2000);
    };

    // Primary realtime channel: app_notifications for this user
    // This is reliable because app_notifications has simple RLS (user_id = auth.uid())
    // and is confirmed working for review notifications.
    const channelId = crypto.randomUUID();
    const notifChannel = supabase
      .channel(`comms-notif-rt-${user.id}-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as any;
          if (notif.category === 'communication') {
            console.log('[RT] Communication notification received:', notif.title);
            invalidateDelayed();
          }
        }
      )
      .subscribe((status) => {
        console.log('[RT] comms-notif channel status:', status);
      });

    // Fallback channel: direct table subscriptions (may be blocked by SECURITY DEFINER RLS)
    const tableChannel = supabase
      .channel(`comms-tables-rt-${user.id}-${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'communication_threads' },
        (payload) => { console.log('[RT] threads change:', payload.eventType); invalidateAll(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'thread_participants' },
        (payload) => { console.log('[RT] participants change:', payload.eventType); invalidateAll(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'communication_messages' },
        (payload) => { console.log('[RT] message insert'); invalidateDelayed(); }
      )
      .subscribe((status) => {
        console.log('[RT] comms-tables channel status:', status);
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(tableChannel);
    };
  }, [user?.id, queryClient]);

  const queryKey = ['communication-threads', user?.id, options.companyId, options.status, options.searchQuery];

  const { data: threads = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<CommunicationThread[]> => {
      if (!user) throw new Error('Not authenticated');

      // Fetch threads where user is a participant
      let query = supabase
        .from('communication_threads')
        .select(`
          *,
          thread_participants!inner(
            id, thread_id, user_id, role, is_internal, joined_at,
            last_read_at, unread_count, external_email, external_name, external_organization
          )
        `)
        .order('last_activity_at', { ascending: false });

      if (options.companyId) {
        query = query.eq('company_id', options.companyId);
      }

      if (options.status && options.status !== 'all') {
        const statusMap: Record<string, string> = {
          'active': 'Active',
          'awaiting-response': 'Awaiting Response',
          'closed': 'Closed',
        };
        const dbStatus = statusMap[options.status] || options.status;
        query = query.eq('status', dbStatus);
      } else {
        // By default, exclude archived threads
        query = query.neq('status', 'Archived');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Now fetch ALL participants for these threads (not just current user)
      const threadIds = (data || []).map((t: any) => t.id);
      let allParticipants: any[] = [];
      if (threadIds.length > 0) {
        const { data: pData } = await supabase
          .from('thread_participants')
          .select(`
            id, thread_id, user_id, role, is_internal, joined_at,
            last_read_at, unread_count, external_email, external_name, external_organization
          `)
          .in('thread_id', threadIds);
        allParticipants = pData || [];
      }

      // Fetch latest message per thread
      let latestMessagesMap: Record<string, any> = {};
      if (threadIds.length > 0) {
        // Fetch latest message for each thread (ordered by created_at desc, limit 1 per thread)
        const { data: allMessages } = await supabase
          .from('communication_messages')
          .select('id, thread_id, sender_user_id, content, message_type, created_at')
          .in('thread_id', threadIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // Group by thread_id — take only the first (latest) per thread
        (allMessages || []).forEach((msg: any) => {
          if (!latestMessagesMap[msg.thread_id]) {
            latestMessagesMap[msg.thread_id] = msg;
          }
        });
      }

      // Collect user_ids to fetch profiles (from participants + latest message senders)
      const latestMsgSenderIds = Object.values(latestMessagesMap)
        .filter((m: any) => m.sender_user_id)
        .map((m: any) => m.sender_user_id);
      const userIds = [...new Set([
        ...allParticipants.filter((p: any) => p.user_id).map((p: any) => p.user_id),
        ...latestMsgSenderIds,
      ])];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name')
          .in('id', userIds);
        (profiles || []).forEach((p: any) => { profilesMap[p.id] = p; });
      }

      // Map threads
      const threads: CommunicationThread[] = (data || []).map((thread: any) => {
        const threadParticipants = allParticipants
          .filter((p: any) => p.thread_id === thread.id)
          .map((p: any) => ({
            ...p,
            unread_count: p.unread_count || 0,
            is_internal: p.is_internal ?? true,
            user_profile: p.user_id ? profilesMap[p.user_id] : undefined,
          }));

        // Find current user's participant record for unread count
        const myParticipant = threadParticipants.find((p: any) => p.user_id === user.id);

        // Attach latest message with sender profile
        const latestMsg = latestMessagesMap[thread.id] || null;
        const latestMessage = latestMsg ? {
          ...latestMsg,
          sender_profile: latestMsg.sender_user_id ? profilesMap[latestMsg.sender_user_id] : undefined,
        } : null;

        return {
          ...thread,
          participants: threadParticipants,
          latest_message: latestMessage,
          my_unread_count: myParticipant?.unread_count || 0,
        };
      });

      // Client-side search filtering
      if (options.searchQuery?.trim()) {
        const q = options.searchQuery.toLowerCase();
        return threads.filter(t => {
          if (t.title.toLowerCase().includes(q)) return true;
          if (t.related_entity_name?.toLowerCase().includes(q)) return true;
          if (t.participants?.some(p => {
            const name = p.user_profile
              ? [p.user_profile.first_name, p.user_profile.last_name].filter(Boolean).join(' ')
              : p.external_name || '';
            return name.toLowerCase().includes(q);
          })) return true;
          return false;
        });
      }

      return threads;
    },
    enabled: !!user,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  });

  // Create thread
  const createThread = useMutation({
    mutationFn: async (params: {
      title: string;
      companyId: string;
      participantUserIds: string[];
      initialMessage?: string;
      threadType?: string;
      relatedEntityId?: string;
      relatedEntityName?: string;
      relatedEntityType?: string;
      productId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const activeSession = sessionData?.session;
      if (sessionError || !activeSession || !session) {
        throw new Error('No active auth session. Please sign in again (or disable DevMode) and retry.');
      }

      if (activeSession.user.id !== user.id) {
        throw new Error('Auth session mismatch. Please reload and sign in again.');
      }

      // 1. Create thread (avoid INSERT ... RETURNING to prevent SELECT policy gate before participants exist)
      const threadId = crypto.randomUUID();
      const { error: threadError } = await supabase
        .from('communication_threads')
        .insert({
          id: threadId,
          title: params.title,
          company_id: params.companyId,
          created_by: user.id,
          status: 'Active',
          thread_type: params.threadType || 'general',
          last_activity_at: new Date().toISOString(),
          related_entity_id: params.relatedEntityId || null,
          related_entity_name: params.relatedEntityName || null,
          related_entity_type: params.relatedEntityType || null,
          product_id: params.productId || null,
        });

      if (threadError) throw threadError;
      const thread = { id: threadId };

      // 2. Add participants (creator + selected)
      const allUserIds = [user.id, ...params.participantUserIds.filter(id => id !== user.id)];
      const participantInserts = allUserIds.map(uid => ({
        thread_id: thread.id,
        user_id: uid,
        role: uid === user.id ? 'owner' : 'participant',
        is_internal: true,
        unread_count: uid === user.id ? 0 : 1,
      }));

      const { error: partError } = await supabase
        .from('thread_participants')
        .insert(participantInserts);

      if (partError) throw partError;

      // 3. Add initial message if provided
      if (params.initialMessage?.trim()) {
        const { error: msgError } = await supabase
          .from('communication_messages')
          .insert({
            thread_id: thread.id,
            sender_user_id: user.id,
            content: params.initialMessage,
            message_type: 'text',
          });
        if (msgError) throw msgError;
      }

      // 4. Create notifications for other participants
      try {
        const notificationService = new AppNotificationService();
        const otherUserIds = params.participantUserIds.filter(id => id !== user.id);
        const senderName = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') || user.email || 'Someone';

        if (otherUserIds.length > 0) {
          const { error: notifError } = await notificationService.createBulkNotifications(
            otherUserIds.map(uid => ({
              user_id: uid,
              actor_id: user.id,
              actor_name: senderName,
              company_id: params.companyId,
              product_id: params.productId,
              category: 'communication',
              action: 'new_thread',
              title: `New Communication: ${params.title}`,
              message: params.initialMessage
                ? `${senderName}: ${params.initialMessage.length > 80 ? params.initialMessage.substring(0, 80) + '...' : params.initialMessage}`
                : `${senderName} added you to: "${params.title}"`,
              entity_type: 'communication_thread',
              entity_id: thread.id,
              entity_name: params.title,
            }))
          );
          if (notifError) {
            console.error('[createThread] Failed to create notifications:', notifError);
          } else {
            console.log('[createThread] Notifications sent to', otherUserIds.length, 'participants');
          }
        }
      } catch (notifError) {
        console.error('[createThread] Failed to create notifications:', notifError);
      }

      return thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
      queryClient.invalidateQueries({ queryKey: ['communication-threads-stats'] });
    },
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (params: { threadId: string; content: string; files?: File[] }) => {
      if (!user) throw new Error('Not authenticated');

      // Insert message — DB trigger handles unread_count increment + last_activity_at update
      const { data: msg, error: msgError } = await supabase
        .from('communication_messages')
        .insert({
          thread_id: params.threadId,
          sender_user_id: user.id,
          content: params.content,
          message_type: params.files && params.files.length > 0 ? 'attachment' : 'text',
        })
        .select('id')
        .single();

      if (msgError) throw msgError;

      // Upload attachments
      if (params.files && params.files.length > 0) {
        await Promise.all(params.files.map(async (file) => {
          const filePath = `${params.threadId}/${msg.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('message-attachments')
            .upload(filePath, file);
          if (uploadError) throw uploadError;

          const { error: insertError } = await supabase
            .from('message_attachments')
            .insert({
              message_id: msg.id,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type || null,
              storage_path: filePath,
              uploaded_by: user.id,
            });
          if (insertError) throw insertError;
        }));
      }

      // Notify other participants in the thread
      try {
        const { data: thread } = await supabase
          .from('communication_threads')
          .select('title, company_id, product_id, thread_participants(user_id)')
          .eq('id', params.threadId)
          .single();

        if (thread?.thread_participants && thread.company_id) {
          const senderName = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') || user.email || 'Someone';
          const notificationService = new AppNotificationService();
          const otherParticipants = thread.thread_participants.filter(
            (p: any) => p.user_id && p.user_id !== user.id
          );

          if (otherParticipants.length > 0) {
            const preview = params.content.length > 80 ? params.content.substring(0, 80) + '...' : params.content;
            const { error: notifError } = await notificationService.createBulkNotifications(
              otherParticipants.map((p: any) => ({
                user_id: p.user_id,
                actor_id: user.id,
                actor_name: senderName,
                company_id: thread.company_id!,
                product_id: thread.product_id || undefined,
                category: 'communication',
                action: 'new_message',
                title: `New message in: ${thread.title}`,
                message: `${senderName}: ${preview}`,
                entity_type: 'communication_thread',
                entity_id: params.threadId,
                entity_name: thread.title,
              }))
            );
            if (notifError) {
              console.error('[sendMessage] Failed to create notifications:', notifError);
            } else {
              console.log('[sendMessage] Notifications sent to', otherParticipants.length, 'participants');
            }
          }
        }
      } catch (notifError) {
        console.error('[sendMessage] Failed to create notifications:', notifError);
      }

      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
      queryClient.invalidateQueries({ queryKey: ['communication-threads-stats'] });
      queryClient.invalidateQueries({ queryKey: ['thread-messages'] });
    },
  });

  // Mark thread as read
  const markThreadRead = useMutation({
    mutationFn: async (threadId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('thread_participants')
        .update({
          last_read_at: new Date().toISOString(),
          unread_count: 0,
        })
        .eq('thread_id', threadId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-threads'] });
      queryClient.invalidateQueries({ queryKey: ['communication-threads-stats'] });
    },
  });

  // Stats from dedicated query (always accurate, not affected by filters)
  const unreadCount = stats?.unreadCount ?? 0;
  const activeCount = stats?.activeCount ?? 0;
  const awaitingResponseCount = stats?.awaitingResponseCount ?? 0;
  const myThreadsCount = stats?.myThreadsCount ?? 0;

  return {
    threads,
    isLoading,
    error,
    refetch,
    createThread,
    sendMessage,
    markThreadRead,
    unreadCount,
    activeCount,
    awaitingResponseCount,
    myThreadsCount,
  };
}

// Hook to fetch messages for a specific thread (with real-time updates)
export function useThreadMessages(threadId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to real-time inserts on communication_messages for this thread
  useEffect(() => {
    if (!threadId || !user) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['thread-messages', threadId] });
    };

    // Direct table subscription (may be blocked by SECURITY DEFINER RLS)
    const messagesChannel = supabase
      .channel(`thread-messages-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communication_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: any) => {
          if (payload.new?.sender_user_id === user?.id) return;
          console.log('[RT] Direct message event for thread:', threadId);
          invalidate();
        }
      )
      .subscribe();

    const attachmentsChannel = supabase
      .channel(`thread-attachments-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_attachments',
        },
        invalidate
      )
      .subscribe();

    // Reliable fallback: listen to app_notifications for new_message in this thread
    const notifChannel = supabase
      .channel(`thread-notif-rt-${user.id}-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as any;
          if (
            notif.category === 'communication' &&
            notif.entity_id === threadId
          ) {
            console.log('[RT] Notification-based message update for thread:', threadId);
            invalidate();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(attachmentsChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [threadId, user?.id, queryClient]);

  return useQuery({
    queryKey: ['thread-messages', threadId],
    queryFn: async (): Promise<CommunicationMessage[]> => {
      if (!threadId) return [];

      const { data, error } = await supabase
        .from('communication_messages')
        .select('*')
        .eq('thread_id', threadId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles and attachments in parallel
      const messageIds = (data || []).map(m => m.id);
      const senderIds = [...new Set((data || []).filter(m => m.sender_user_id).map(m => m.sender_user_id!))];

      const [profilesMap, attachmentsMap] = await Promise.all([
        // Profiles
        (async () => {
          const map: Record<string, any> = {};
          if (senderIds.length > 0) {
            const { data: profiles } = await supabase
              .from('user_profiles')
              .select('id, email, first_name, last_name')
              .in('id', senderIds);
            (profiles || []).forEach(p => { map[p.id] = p; });
          }
          return map;
        })(),
        // Attachments
        (async () => {
          const map: Record<string, any[]> = {};
          if (messageIds.length > 0) {
            const { data: attachments } = await supabase
              .from('message_attachments')
              .select('*')
              .in('message_id', messageIds);
            (attachments || []).forEach(a => {
              const { data: urlData } = supabase.storage
                .from('message-attachments')
                .getPublicUrl(a.storage_path);
              const entry = { ...a, signed_url: urlData.publicUrl };
              if (!map[entry.message_id]) map[entry.message_id] = [];
              map[entry.message_id].push(entry);
            });
          }
          return map;
        })(),
      ]);

      return (data || []).map(msg => ({
        ...msg,
        sender_profile: msg.sender_user_id ? profilesMap[msg.sender_user_id] : undefined,
        attachments: attachmentsMap[msg.id] || [],
      }));
    },
    enabled: !!threadId && !!user,
    staleTime: 10 * 1000,
  });
}

// Hook for ephemeral typing indicators via Supabase Broadcast
export function useTypingIndicator(threadId: string | null) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingMapRef = useRef<Map<string, { userName: string; timestamp: number }>>(new Map());
  const lastSentRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!threadId || !user) return;

    const channel = supabase.channel(`typing-${threadId}`);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'typing' }, (payload: any) => {
      const { userId, userName } = payload.payload || {};
      if (!userId || userId === user.id) return;

      typingMapRef.current.set(userId, { userName, timestamp: Date.now() });
      updateTypingUsers();
    });

    channel.subscribe();

    // Cleanup stale entries every second
    cleanupTimerRef.current = setInterval(() => {
      const now = Date.now();
      let changed = false;
      typingMapRef.current.forEach((value, key) => {
        if (now - value.timestamp > 3000) {
          typingMapRef.current.delete(key);
          changed = true;
        }
      });
      if (changed) updateTypingUsers();
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current);
      typingMapRef.current.clear();
      setTypingUsers([]);
    };
  }, [threadId, user?.id]);

  function updateTypingUsers() {
    const names = Array.from(typingMapRef.current.values()).map(v => v.userName);
    setTypingUsers(names);
  }

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    const now = Date.now();
    // Debounce: send at most every 2 seconds
    if (now - lastSentRef.current < 2000) return;
    lastSentRef.current = now;

    const userName = [user.user_metadata?.first_name, user.user_metadata?.last_name]
      .filter(Boolean).join(' ') || user.email || 'Someone';

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, userName },
    });
  }, [user]);

  return { typingUsers, sendTyping };
}
