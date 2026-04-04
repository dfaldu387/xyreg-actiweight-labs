import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Send, MessageCircle, Loader2, Sparkles } from 'lucide-react';
import { DocumentContext, ChatMessage } from '@/hooks/useDocumentAI';

interface DocumentChatTabProps {
  documentId: string;
  documentText: string;
  context?: DocumentContext;
  documentAI: {
    isLoading: boolean;
    chatMessages: ChatMessage[];
    askQuestion: (documentId: string, query: string, text?: string, context?: DocumentContext) => Promise<ChatMessage | null>;
    loadChatHistory: (documentId: string) => Promise<void>;
    clearChat: () => void;
  };
}

export function DocumentChatTab({
  documentId,
  documentText,
  context,
  documentAI
}: DocumentChatTabProps) {
  const [query, setQuery] = useState('');
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const exampleQueries = [
    "What is the main purpose of this document?",
    "What are the key requirements?",
    "Summarize the procedures described",
    "What compliance standards are mentioned?"
  ];

  // Load chat history on mount
  useEffect(() => {
    if (documentId && !hasLoadedHistory) {
      documentAI.loadChatHistory(documentId);
      setHasLoadedHistory(true);
    }
  }, [documentId, hasLoadedHistory]);

  // Reset when document changes
  useEffect(() => {
    setHasLoadedHistory(false);
    documentAI.clearChat();
  }, [documentId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [documentAI.chatMessages]);

  const handleSubmit = async (queryText?: string) => {
    const questionText = queryText || query.trim();
    if (!questionText || documentAI.isLoading) return;

    setQuery('');
    await documentAI.askQuestion(documentId, questionText, documentText, context);
  };

  const handleExampleQuery = (example: string) => {
    setQuery(example);
    handleSubmit(example);
  };

  const { isLoading, chatMessages } = documentAI;

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-50 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {chatMessages.length === 0 && !isLoading && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <h3 className="font-medium mb-1">Ask Questions</h3>
                <p className="text-sm text-muted-foreground">
                  Ask anything about this document
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                {exampleQueries.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left text-xs h-auto py-2 px-3 whitespace-normal justify-start"
                    onClick={() => handleExampleQuery(example)}
                    disabled={isLoading || !documentText}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.isUser ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[85%] text-sm">
                    {message.query}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">AI Response</span>
                      {message.confidence && (
                        <Badge variant="outline" className={`text-xs ${getConfidenceBadge(message.confidence)}`}>
                          {message.confidence} confidence
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.answer}</p>
                  </div>

                  {/* Relevant Excerpts */}
                  {message.relevantExcerpts && message.relevantExcerpts.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground px-1">Sources:</p>
                      {message.relevantExcerpts.slice(0, 2).map((excerpt, index) => (
                        <Card key={index} className="bg-muted/30">
                          <CardContent className="p-2">
                            {excerpt.section && (
                              <p className="text-xs font-medium mb-1">{excerpt.section}</p>
                            )}
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              "{excerpt.text}"
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Questions */}
                  {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground px-1">You might also ask:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.followUpQuestions.slice(0, 2).map((followUp, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={() => handleExampleQuery(followUp)}
                            disabled={isLoading}
                          >
                            {followUp}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
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
            disabled={isLoading || !documentText}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={() => handleSubmit()}
            disabled={!query.trim() || isLoading || !documentText}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
