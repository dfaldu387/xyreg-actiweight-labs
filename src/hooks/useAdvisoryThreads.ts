import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdvisoryConversation {
  id: string;
  company_id: string;
  user_id: string;
  agent_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AdvisoryMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function useAdvisoryThreads(companyId: string | undefined) {
  const [conversations, setConversations] = useState<AdvisoryConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advisory_conversations')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setConversations((data as AdvisoryConversation[]) || []);
    } catch (err) {
      console.error('[useAdvisoryThreads] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(async (agentId: string, title: string): Promise<AdvisoryConversation | null> => {
    if (!companyId) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('advisory_conversations')
        .insert({ company_id: companyId, user_id: user.id, agent_id: agentId, title })
        .select()
        .single();
      if (error) throw error;
      const conv = data as AdvisoryConversation;
      setConversations(prev => [conv, ...prev]);
      return conv;
    } catch (err) {
      console.error('[useAdvisoryThreads] create error:', err);
      return null;
    }
  }, [companyId]);

  const loadMessages = useCallback(async (conversationId: string): Promise<AdvisoryMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('advisory_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as AdvisoryMessage[]) || [];
    } catch (err) {
      console.error('[useAdvisoryThreads] loadMessages error:', err);
      return [];
    }
  }, []);

  const saveMessage = useCallback(async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    try {
      await supabase
        .from('advisory_messages')
        .insert({ conversation_id: conversationId, role, content });
      // Touch updated_at on conversation
      await supabase
        .from('advisory_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (err) {
      console.error('[useAdvisoryThreads] saveMessage error:', err);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await supabase
        .from('advisory_conversations')
        .delete()
        .eq('id', conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (err) {
      console.error('[useAdvisoryThreads] delete error:', err);
    }
  }, []);

  return { conversations, loading, fetchConversations, createConversation, loadMessages, saveMessage, deleteConversation };
}
