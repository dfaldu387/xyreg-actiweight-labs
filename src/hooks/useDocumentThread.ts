import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface DocumentChatMessage {
  id: string;
  document_id: string;
  company_id: string;
  sender_user_id: string | null;
  sender_name: string | null;
  content: string;
  created_at: string;
}

export function useDocumentThread(params: {
  documentId?: string | null;
  companyId?: string;
  documentName?: string;
  enabled?: boolean;
}) {
  const { documentId, companyId, enabled = true } = params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<DocumentChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<any>(null);
  const ownerIdFetchedRef = useRef(false);
  const ownerIdRef = useRef<string | null>(null);

  // Ready when we have document + company + user
  const ready = !!(enabled && documentId && companyId && user?.id);

  // Load messages + subscribe to realtime
  useEffect(() => {
    if (!ready) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      console.log('[useDocumentThread] Loading messages for document:', documentId);
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('document_user_chat_messages')
          .select('*')
          .eq('document_id', documentId!)
          .eq('company_id', companyId!)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('[useDocumentThread] Failed to load messages:', error);
          return;
        }
        console.log('[useDocumentThread] Loaded', data?.length || 0, 'messages');
        setMessages((data || []) as DocumentChatMessage[]);
      } catch (err) {
        console.error('[useDocumentThread] Exception loading messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`doc-chat-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_user_chat_messages',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          console.log('[useDocumentThread] Realtime new message:', payload.new);
          const newMsg = payload.new as DocumentChatMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        console.log('[useDocumentThread] Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [ready, documentId, companyId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!ready || !content.trim() || !user) return;
    setIsSending(true);
    try {
      const senderName = [user.user_metadata?.first_name, user.user_metadata?.last_name]
        .filter(Boolean).join(' ') || user.email?.split('@')[0] || 'User';

      // Keep member_ids consistent and always include company owner.
      // - If chat has stored member_ids, carry them forward.
      // - If missing or incomplete, seed/repair with current user + company owner.
      let memberIdsToWrite: string[] = [];

      const { data: latest, error: latestErr } = await supabase
        .from('document_user_chat_messages')
        .select('member_ids')
        .eq('document_id', documentId!)
        .eq('company_id', companyId!)
        .not('member_ids', 'eq', '{}')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestErr) {
        memberIdsToWrite = (latest?.member_ids as string[] | null | undefined) || [];
      }

      // Always include the sender.
      if (!memberIdsToWrite || memberIdsToWrite.length === 0) {
        memberIdsToWrite = [user.id];
      } else if (!memberIdsToWrite.includes(user.id)) {
        memberIdsToWrite = [...memberIdsToWrite, user.id];
      }

      // Fetch company owner once per hook instance, then union it in.
      if (!ownerIdFetchedRef.current) {
        ownerIdFetchedRef.current = true;
        try {
          const { data: owners } = await supabase
            .from('user_company_access')
            .select('user_id, is_invite_user')
            .eq('company_id', companyId!)
            .eq('is_primary', true)
            .limit(25);
          const ownerRow = (owners || []).find((r: any) => r?.is_invite_user !== true);
          ownerIdRef.current = ownerRow?.user_id ? (ownerRow.user_id as string) : null;
        } catch (e) {
          ownerIdRef.current = null;
        }
      }

      if (ownerIdRef.current && !memberIdsToWrite.includes(ownerIdRef.current)) {
        memberIdsToWrite = [...memberIdsToWrite, ownerIdRef.current];
      }

      memberIdsToWrite = Array.from(new Set(memberIdsToWrite));

      const { error } = await supabase.from('document_user_chat_messages').insert({
        document_id: documentId!,
        company_id: companyId!,
        sender_user_id: user.id,
        sender_name: senderName,
        content: content.trim(),
        member_ids: memberIdsToWrite,
      });
      if (error) {
        console.error('[useDocumentThread] Send failed:', error);
        toast.error('Failed to send message');
        throw error;
      }
    } catch (err) {
      console.error('[useDocumentThread] Exception sending:', err);
    } finally {
      setIsSending(false);
    }
  }, [ready, documentId, companyId, user]);

  return {
    threadId: ready ? documentId : null, // treat document_id as thread id for the UI
    messages,
    isLoading,
    isSending,
    sendMessage,
  };
}
