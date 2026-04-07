import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, X, ChevronLeft, Volume2, VolumeX, Users, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import { ADVISORY_AGENTS, type AdvisoryAgent, getAgentById } from '@/data/advisoryAgents';
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

const BORDER_COLORS: Record<string, string> = {
  gold: 'border-[#D4AF37]',
  blue: 'border-[#3B82F6]',
  green: 'border-[#10B981]',
  purple: 'border-[#8B5CF6]',
};

/** Strip markdown for spoken output. */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')           // headings
    .replace(/\*\*(.*?)\*\*/g, '$1')    // bold
    .replace(/\*(.*?)\*/g, '$1')        // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // code
    .replace(/[>\-|[\]()]/g, '')        // markdown symbols
    .replace(/\n{2,}/g, '... ')         // paragraph breaks → natural pauses
    .replace(/\n/g, '. ')               // line breaks → sentence pauses
    .replace(/\s{2,}/g, ' ')            // collapse whitespace
    .trim();
}

/** Speak text using browser SpeechSynthesis (fallback). */
function speakBrowser(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const stripped = stripMarkdown(text);
  const utterance = new SpeechSynthesisUtterance(stripped);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

const VOICE_OPTIONS = [
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', desc: 'Clear & professional' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'Warm & authoritative' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', desc: 'Calm British' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', desc: 'Deep & warm' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Clear American' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', desc: 'Natural Australian' },
] as const;

/** Active audio element for cancellation. */
let activeAudio: HTMLAudioElement | null = null;

/** Speak text via ElevenLabs TTS edge function, falling back to browser. */
async function speakElevenLabs(text: string, voiceId?: string) {
  // Cancel any currently playing audio
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  window.speechSynthesis?.cancel();

  try {
    const stripped = stripMarkdown(text).slice(0, 4000);
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advisory-tts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: stripped, companyId: CompanyContextService.get()?.companyId, voiceId }),
      }
    );
    console.log('[TTS] Response status:', response.status);
    console.log('[TTS] Response content-type:', response.headers.get('content-type'));
    if (!response.ok) throw new Error(`TTS failed: ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('audio')) {
      const blob = await response.blob();
      console.log('[TTS] Got ElevenLabs audio, size:', blob.size, 'bytes');
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.preload = 'auto';
      activeAudio = audio;
      audio.addEventListener('ended', () => { activeAudio = null; URL.revokeObjectURL(url); });
      await audio.play();
      console.log('[TTS] Playing ElevenLabs audio');
    } else {
      const data = await response.json();
      console.log('[TTS] FALLBACK to browser TTS, reason:', data?.reason || 'unknown');
      speakBrowser(text);
    }
  } catch (err) {
    console.warn('ElevenLabs TTS failed, falling back to browser:', err);
    speakBrowser(text);
  }
}

export function FloatingAdvisoryBot() {
  const [open, setOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AdvisoryAgent | null>(getAgentById('professor-xyreg') || ADVISORY_AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  // Extract productId from current URL path
  const productId = useMemo(() => {
    const match = location.pathname.match(/\/product\/([a-f0-9-]+)/);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  // Extract current page section from URL
  const currentSection = useMemo(() => {
    const parts = location.pathname.split('/');
    const productIdx = parts.indexOf('product');
    if (productIdx >= 0 && parts.length > productIdx + 2) {
      return parts.slice(productIdx + 2).join('/');
    }
    // Company-level pages
    const companyIdx = parts.indexOf('company');
    if (companyIdx >= 0 && parts.length > companyIdx + 2) {
      return parts.slice(companyIdx + 2).join('/');
    }
    return location.pathname;
  }, [location.pathname]);

  // Fetch product details for context
  const { data: product } = useProductDetails(productId);

  // Get company context
  const companyContext = CompanyContextService.get();

  // Build context string for system prompt
  const pageContext = useMemo(() => {
    let ctx = `\n\n--- CURRENT USER CONTEXT ---`;
    ctx += `\nThe user is currently viewing: ${currentSection || 'dashboard'}`;
    
    if (companyContext) {
      ctx += `\nCompany: ${companyContext.companyName}`;
    }
    
    if (product) {
      ctx += `\nProduct: ${product.name}`;
      if (product.class) ctx += `\nClassification: ${product.class}`;
      if (product.intended_use) ctx += `\nIntended Use: ${product.intended_use}`;
      if (product.description) ctx += `\nDescription: ${product.description}`;
      if (product.device_category) ctx += `\nDevice Category: ${product.device_category}`;
      if (product.markets && Array.isArray(product.markets) && product.markets.length > 0) {
        const marketNames = product.markets.map((m: any) => typeof m === 'string' ? m : m.name || m.market_name).filter(Boolean);
        if (marketNames.length) ctx += `\nTarget Markets: ${marketNames.join(', ')}`;
      }
    }
    
    ctx += `\n\nUse this context to provide relevant, specific guidance about what the user is currently working on. Reference the actual product and page when possible.`;
    return ctx;
  }, [currentSection, product, companyContext]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleBack = () => {
    setMessages([]);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !selectedAgent) return;
    const text = input.trim();
    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = selectedAgent.systemPrompt + pageContext;
      const response = await supabase.functions.invoke('advisory-chat', {
        body: {
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          systemPrompt,
          agentId: selectedAgent.id,
        }
      });
      if (response.error) throw response.error;
      const data = response.data;
      if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }
      const content = data?.content || 'I apologize, I was unable to generate a response.';

      // Fire TTS immediately (don't await) so voice starts while text renders
      if (voiceEnabled) {
        speakElevenLabs(content, selectedVoice);
      }

      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      console.error('Advisory chat error:', err);
      toast({ title: 'Error', description: 'Failed to get a response.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedAgent, messages, voiceEnabled, selectedVoice, toast, pageContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[5.5rem] right-6 z-50 h-14 w-14 rounded-full bg-[#D4AF37] text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
        title="Technical Advisory Board"
      >
        <Users className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white animate-pulse" />
      </button>
    );
  }

  const avatarClass = selectedAgent ? (AVATAR_COLORS[selectedAgent.domainColor] || AVATAR_COLORS.gold) : '';
  const borderClass = selectedAgent ? (BORDER_COLORS[selectedAgent.domainColor] || '') : '';

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in ${borderClass ? `border-l-4 ${borderClass}` : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          {selectedAgent && (
            <>
              <Avatar className={`h-7 w-7 ${avatarClass}`}>
                <AvatarFallback className={`${avatarClass} text-xs`}>{selectedAgent.avatarInitials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{selectedAgent.name}</span>
            </>
          )}
        </div>
        </div>
        <div className="flex items-center gap-1">
          {selectedAgent && voiceEnabled && (
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="h-7 w-[90px] text-[10px] border-none bg-transparent px-1.5 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map(v => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    <span className="font-medium">{v.name}</span>
                    <span className="text-muted-foreground ml-1">· {v.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedAgent && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) { window.speechSynthesis?.cancel(); if (activeAudio) { activeAudio.pause(); activeAudio = null; } } }}
              title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setOpen(false); setMessages([]); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      {selectedAgent && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Context indicator */}
            {(product || companyContext) && (
              <div className="bg-muted/50 rounded-md px-2.5 py-1.5 text-[10px] text-muted-foreground border border-border/50">
                <span className="font-medium">Context:</span>{' '}
                {product ? product.name : companyContext?.companyName}
                {product && currentSection ? ` → ${currentSection}` : ''}
              </div>
            )}
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-xs">Ask {selectedAgent.name} anything about</p>
                <Badge variant="outline" className="mt-1 text-xs">{selectedAgent.specialty}</Badge>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <Avatar className={`h-6 w-6 shrink-0 mt-1 ${avatarClass}`}>
                    <AvatarFallback className={`${avatarClass} text-[10px]`}>{selectedAgent.avatarInitials}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:text-xs [&_li]:text-xs [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <Avatar className={`h-6 w-6 shrink-0 ${avatarClass}`}>
                  <AvatarFallback className={`${avatarClass} text-[10px]`}>{selectedAgent.avatarInitials}</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2.5 shrink-0">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${selectedAgent.name}...`}
                className="min-h-[36px] max-h-[80px] resize-none text-xs"
                rows={1}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="shrink-0 h-9 w-9">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
