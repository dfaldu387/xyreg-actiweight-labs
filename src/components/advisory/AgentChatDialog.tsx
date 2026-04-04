import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import type { AdvisoryAgent } from '@/data/advisoryAgents';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProductDetails } from '@/hooks/useProductDetails';
import { CompanyContextService } from '@/services/companyContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AVATAR_COLORS: Record<string, string> = {
  gold: 'bg-[#D4AF37] text-white',
  blue: 'bg-[#3B82F6] text-white',
  green: 'bg-[#10B981] text-white',
  purple: 'bg-[#8B5CF6] text-white',
};

interface AgentChatDialogProps {
  agent: AdvisoryAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentChatDialog({ agent, open, onOpenChange }: AgentChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  // Extract productId from URL
  const productId = useMemo(() => {
    const match = location.pathname.match(/\/product\/([a-f0-9-]+)/);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  const currentSection = useMemo(() => {
    const parts = location.pathname.split('/');
    const productIdx = parts.indexOf('product');
    if (productIdx >= 0 && parts.length > productIdx + 2) return parts.slice(productIdx + 2).join('/');
    const companyIdx = parts.indexOf('company');
    if (companyIdx >= 0 && parts.length > companyIdx + 2) return parts.slice(companyIdx + 2).join('/');
    return location.pathname;
  }, [location.pathname]);

  const { data: product } = useProductDetails(productId);
  const companyContext = CompanyContextService.get();

  // Reset messages when agent changes
  useEffect(() => {
    if (agent) setMessages([]);
  }, [agent?.id]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (!agent) return null;

  const avatarClass = AVATAR_COLORS[agent.domainColor] || AVATAR_COLORS.blue;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      let contextInfo = `\n\n--- CURRENT USER CONTEXT ---`;
      contextInfo += `\nViewing: ${currentSection || 'dashboard'}`;
      if (companyContext) contextInfo += `\nCompany: ${companyContext.companyName}`;
      if (product) {
        contextInfo += `\nProduct: ${product.name}`;
        if (product.class) contextInfo += `\nClassification: ${product.class}`;
        if (product.intended_use) contextInfo += `\nIntended Use: ${product.intended_use}`;
        if (product.description) contextInfo += `\nDescription: ${product.description}`;
      }
      contextInfo += `\n\nUse this context to provide relevant, specific guidance.`;

      const systemPrompt = agent.systemPrompt + contextInfo;

      const response = await supabase.functions.invoke('advisory-chat', {
        body: {
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt,
          agentId: agent.id,
        }
      });

      if (response.error) throw response.error;

      const data = response.data;
      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast({ title: 'Rate limited', description: 'Please wait a moment and try again.', variant: 'destructive' });
        } else if (data.error.includes('Payment required')) {
          toast({ title: 'Credits exhausted', description: 'Please add funds in Settings → Workspace → Usage.', variant: 'destructive' });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      const assistantContent = data?.content || data?.choices?.[0]?.message?.content || 'I apologize, I was unable to generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (err) {
      console.error('Advisory chat error:', err);
      toast({ title: 'Error', description: 'Failed to get a response. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className={`h-10 w-10 ${avatarClass}`}>
              <AvatarFallback className={`${avatarClass} font-semibold text-sm`}>
                {agent.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{agent.name}</DialogTitle>
              <Badge variant="outline" className="text-xs mt-1">{agent.title}</Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-sm">Ask {agent.name} anything about <strong>{agent.specialty}</strong>.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <Avatar className={`h-8 w-8 shrink-0 ${avatarClass}`}>
                  <AvatarFallback className={`${avatarClass} text-xs`}>{agent.avatarInitials}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className={`h-8 w-8 shrink-0 ${avatarClass}`}>
                <AvatarFallback className={`${avatarClass} text-xs`}>{agent.avatarInitials}</AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t px-6 py-4 shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${agent.name}...`}
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
