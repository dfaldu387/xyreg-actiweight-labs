import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { showNoCreditDialog } from '@/context/AiCreditContext';

export interface DocumentSummary {
  summary: string;
  quickSummary: string;
  sections: Array<{
    title: string;
    summary: string;
  }>;
  documentType: string;
  wordCount: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface KeyPoint {
  point: string;
  section?: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
}

export interface KeyPointsResult {
  keyPoints: KeyPoint[];
  totalPoints: number;
  categories: Record<string, number>;
  topThemes: string[];
}

export interface ChatMessage {
  id: string;
  query: string;
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  relevantExcerpts: Array<{
    text: string;
    section?: string;
  }>;
  followUpQuestions: string[];
  timestamp: string;
  isUser?: boolean;
}

export interface HelpWriteResult {
  content: string;
  contentPlain: string;
  suggestions: string[];
  wordCount: number;
}

export interface DocumentContext {
  documentName: string;
  documentType: string;
  phaseName: string;
}

interface UseDocumentAIReturn {
  // States
  isLoading: boolean;
  error: string | null;
  summary: DocumentSummary | null;
  keyPoints: KeyPointsResult | null;
  chatMessages: ChatMessage[];

  // Actions
  generateSummary: (documentId: string, text: string, context?: DocumentContext) => Promise<DocumentSummary | null>;
  extractKeyPoints: (documentId: string, text: string, context?: DocumentContext) => Promise<KeyPointsResult | null>;
  askQuestion: (documentId: string, query: string, text?: string, context?: DocumentContext) => Promise<ChatMessage | null>;
  helpMeWrite: (documentId: string, prompt: string, context?: DocumentContext, text?: string) => Promise<HelpWriteResult | null>;
  loadCachedSummary: (documentId: string) => Promise<DocumentSummary | null>;
  loadCachedKeyPoints: (documentId: string) => Promise<KeyPointsResult | null>;
  loadChatHistory: (documentId: string) => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
}

export function useDocumentAI(companyId: string): UseDocumentAIReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [keyPoints, setKeyPoints] = useState<KeyPointsResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const clearError = useCallback(() => setError(null), []);
  const clearChat = useCallback(() => setChatMessages([]), []);

  // Load cached summary from database
  const loadCachedSummary = useCallback(async (documentId: string): Promise<DocumentSummary | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('document_ai_sessions')
        .select('ai_response, created_at')
        .eq('document_id', documentId)
        .eq('session_type', 'summary')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      const parsed = JSON.parse(data.ai_response);
      setSummary(parsed);
      return parsed;
    } catch {
      return null;
    }
  }, [user?.id, companyId]);

  // Load cached key points from database
  const loadCachedKeyPoints = useCallback(async (documentId: string): Promise<KeyPointsResult | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('document_ai_sessions')
        .select('ai_response, created_at')
        .eq('document_id', documentId)
        .eq('session_type', 'key_points')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      const parsed = JSON.parse(data.ai_response);
      setKeyPoints(parsed);
      return parsed;
    } catch {
      return null;
    }
  }, [user?.id, companyId]);

  // Load chat history from database
  const loadChatHistory = useCallback(async (documentId: string): Promise<void> => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('document_ai_sessions')
        .select('id, query_text, ai_response, created_at')
        .eq('document_id', documentId)
        .eq('session_type', 'chat')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      const messages: ChatMessage[] = (data || []).flatMap(session => {
        const parsed = JSON.parse(session.ai_response);
        return [
          {
            id: `user-${session.id}`,
            query: session.query_text || '',
            answer: '',
            confidence: 'high' as const,
            relevantExcerpts: [],
            followUpQuestions: [],
            timestamp: session.created_at,
            isUser: true
          },
          {
            id: `ai-${session.id}`,
            query: session.query_text || '',
            answer: parsed.answer || parsed.rawResponse || '',
            confidence: parsed.confidence || 'medium',
            relevantExcerpts: parsed.relevantExcerpts || [],
            followUpQuestions: parsed.followUpQuestions || [],
            timestamp: session.created_at,
            isUser: false
          }
        ];
      });

      setChatMessages(messages);
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  }, [user?.id, companyId]);

  // Generate document summary
  const generateSummary = useCallback(async (
    documentId: string,
    text: string,
    context?: DocumentContext
  ): Promise<DocumentSummary | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-document-summary', {
        body: {
          action: 'generate_summary',
          documentId,
          companyId,
          userId: user.id,
          text,
          context
        }
      });

      if (error) throw error;

      if (data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        return null;
      }
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      const summaryData: DocumentSummary = {
        summary: data.summary || '',
        quickSummary: data.quickSummary || '',
        sections: data.sections || [],
        documentType: data.documentType || 'Unknown',
        wordCount: data.wordCount || 0,
        complexity: data.complexity || 'medium'
      };

      setSummary(summaryData);
      return summaryData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, companyId]);

  // Extract key points
  const extractKeyPoints = useCallback(async (
    documentId: string,
    text: string,
    context?: DocumentContext
  ): Promise<KeyPointsResult | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-document-summary', {
        body: {
          action: 'extract_key_points',
          documentId,
          companyId,
          userId: user.id,
          text,
          context
        }
      });

      if (error) throw error;

      if (data?.error === 'NO_CREDITS') { showNoCreditDialog(); return null; }
      if (!data.success) {
        throw new Error(data.error || 'Failed to extract key points');
      }

      const keyPointsData: KeyPointsResult = {
        keyPoints: data.keyPoints || [],
        totalPoints: data.totalPoints || 0,
        categories: data.categories || {},
        topThemes: data.topThemes || []
      };

      setKeyPoints(keyPointsData);
      return keyPointsData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract key points';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, companyId]);

  // Ask question about document
  const askQuestion = useCallback(async (
    documentId: string,
    query: string,
    text?: string,
    context?: DocumentContext
  ): Promise<ChatMessage | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      query,
      answer: '',
      confidence: 'high',
      relevantExcerpts: [],
      followUpQuestions: [],
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setChatMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-document-summary', {
        body: {
          action: 'chat',
          documentId,
          companyId,
          userId: user.id,
          query,
          text,
          context
        }
      });

      if (error) throw error;

      if (data?.error === 'NO_CREDITS') { showNoCreditDialog(); return null; }
      if (!data.success) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        query,
        answer: data.answer || '',
        confidence: data.confidence || 'medium',
        relevantExcerpts: data.relevantExcerpts || [],
        followUpQuestions: data.followUpQuestions || [],
        timestamp: new Date().toISOString(),
        isUser: false
      };

      setChatMessages(prev => [...prev, aiMessage]);
      return aiMessage;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get answer';
      setError(message);
      toast.error(message);
      // Remove user message on error
      setChatMessages(prev => prev.filter(m => m.id !== userMessage.id));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, companyId]);

  // Help me write
  const helpMeWrite = useCallback(async (
    documentId: string,
    prompt: string,
    context?: DocumentContext,
    text?: string
  ): Promise<HelpWriteResult | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-document-summary', {
        body: {
          action: 'help_write',
          documentId,
          companyId,
          userId: user.id,
          query: prompt,
          text,
          context
        }
      });

      if (error) throw error;

      if (data?.error === 'NO_CREDITS') { showNoCreditDialog(); return null; }
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate content');
      }

      const result: HelpWriteResult = {
        content: data.content || '',
        contentPlain: data.contentPlain || '',
        suggestions: data.suggestions || [],
        wordCount: data.wordCount || 0
      };

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate content';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, companyId]);

  return {
    isLoading,
    error,
    summary,
    keyPoints,
    chatMessages,
    generateSummary,
    extractKeyPoints,
    askQuestion,
    helpMeWrite,
    loadCachedSummary,
    loadCachedKeyPoints,
    loadChatHistory,
    clearChat,
    clearError
  };
}
