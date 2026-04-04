import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Send, MessageCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  query: string;
  answer: string;
  sources: ResponseSource[];
  timestamp: string;
  isUser?: boolean;
}

interface ResponseSource {
  chunk_id: string;
  page_number: number;
  section_title: string;
  chunk_text: string;
  confidence: number;
}

interface MarketReport {
  id: string;
  title: string;
  source: string;
}

interface ReportChatSidebarProps {
  report: MarketReport;
  companyId: string;
  onJumpToPage: (pageNumber: number) => void;
  onHighlightText: (pageNumber: number, searchText: string) => void;
}

export function ReportChatSidebar({ 
  report, 
  companyId, 
  onJumpToPage, 
  onHighlightText 
}: ReportChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Example queries for this document type
  const exampleQueries = [
    "What are the key market trends?",
    "What is the market size?",
    "Who are the main competitors?",
    "What are the growth forecasts?"
  ];

  // Load existing chat history
  useEffect(() => {
    loadChatHistory();
  }, [report.id]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const loadChatHistory = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('report_chat_sessions')
        .select('*')
        .eq('report_id', report.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        return;
      }

      const historyMessages: ChatMessage[] = data.map(session => ({
        id: session.id,
        query: session.query_text,
        answer: session.ai_response,
        sources: (session.response_sources as ResponseSource[]) || [],
        timestamp: session.created_at,
        isUser: false
      }));

      setChatHistory(historyMessages);
      setMessages(historyMessages);
    } catch (error) {
      // Error loading chat history
    }
  };

  const handleSubmit = async (queryText?: string) => {
    const questionText = queryText || query.trim();
    if (!questionText || isLoading || !user?.id) return;

    setIsLoading(true);
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      query: questionText,
      answer: '',
      sources: [],
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');

    try {
      const { data, error } = await supabase.functions.invoke('ask-single-report', {
        body: {
          query: questionText,
          reportId: report.id,
          companyId: companyId,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        query: questionText,
        answer: data.answer,
        sources: data.sources || [],
        timestamp: new Date().toISOString(),
        isUser: false
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      toast.error('Failed to get answer. Please try again.');
      
      // Remove the user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceClick = (source: ResponseSource) => {
    // Jump to the page and try to highlight the relevant text
    onJumpToPage(source.page_number);
    
    // Extract a short phrase for highlighting (first few words)
    const highlightText = source.chunk_text.split(' ').slice(0, 8).join(' ');
    setTimeout(() => {
      onHighlightText(source.page_number, highlightText);
    }, 500);
  };

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
    handleSubmit(exampleQuery);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm mb-2">Ask This Document</h3>
        <p className="text-xs text-muted-foreground">
          Ask questions about {report.title}
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                Try asking one of these questions:
              </p>
              {exampleQueries.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left text-xs h-auto p-2 whitespace-normal"
                  onClick={() => handleExampleQuery(example)}
                  disabled={isLoading}
                >
                  {example}
                </Button>
              ))}
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.isUser ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%] text-sm">
                    {message.query}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <div className="whitespace-pre-wrap">{message.answer}</div>
                  </div>
                  
                  {message.sources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                      {message.sources.map((source, index) => (
                        <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardContent 
                            className="p-3"
                            onClick={() => handleSourceClick(source)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-xs font-medium">
                                {source.section_title}
                              </span>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  Page {source.page_number}
                                </Badge>
                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {source.chunk_text}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing document...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question about this document..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            disabled={isLoading}
            className="text-sm"
          />
          <Button 
            size="sm"
            onClick={() => handleSubmit()}
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}