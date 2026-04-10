import { useState, useRef, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, X, Volume2, VolumeX, Users, ClipboardList, Plus, ArrowLeft, Trash2, Minimize2, Maximize2, Mic, MicOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import { ADVISORY_AGENTS, type AdvisoryAgent, getAgentById } from '@/data/advisoryAgents';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProductDetails } from '@/hooks/useProductDetails';
import { CompanyContextService } from '@/services/companyContext';
import { useAdvisoryThreads, type AdvisoryConversation } from '@/hooks/useAdvisoryThreads';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAdvisoryContext } from '@/hooks/useAdvisoryContext';
import { formatDistanceToNow } from 'date-fns';
import { documentContextStore } from '@/stores/documentContextStore';

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
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/[>\-|[\]()]/g, '')
    .replace(/\n{2,}/g, '... ')
    .replace(/\n/g, '. ')
    .replace(/\s{2,}/g, ' ')
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

/** Flag to cancel TTS that is still being fetched when mute is clicked. */
let ttsCancelled = false;

/** Pre-warmed audio element to satisfy autoplay policy (created on user gesture). */
let prewarmedAudio: HTMLAudioElement | null = null;

/** Call on user gesture (click/keypress) to unlock audio playback in Chrome. */
function prewarmAudio() {
  const a = new Audio();
  a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  a.volume = 0;
  a.play().then(() => { a.pause(); prewarmedAudio = a; }).catch(() => {});
}

/** Speak text via ElevenLabs TTS edge function, falling back to browser. */
async function speakElevenLabs(text: string, voiceId?: string) {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.remove();
    activeAudio = null;
  }
  window.speechSynthesis?.cancel();
  ttsCancelled = false;

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
    if (!response.ok) throw new Error(`TTS failed: ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('audio')) {
      const blob = await response.blob();
      console.log('[TTS] Got ElevenLabs audio, size:', blob.size, 'bytes');
      console.log('[TTS] Blob type:', blob.type);

      // Check if mute was clicked while we were fetching
      if (ttsCancelled) {
        console.log('[TTS] Cancelled — mute was clicked during fetch');
        return;
      }

      const url = URL.createObjectURL(blob);

      // Use DOM-attached audio element for better browser compatibility
      const audio = document.createElement('audio');
      audio.src = url;
      audio.preload = 'auto';
      audio.volume = 1.0;
      document.body.appendChild(audio);
      activeAudio = audio;

      audio.addEventListener('ended', () => {
        console.log('[TTS] Audio ended naturally');
        activeAudio = null;
        audio.remove();
        URL.revokeObjectURL(url);
      });
      audio.addEventListener('error', (e) => {
        console.warn('[TTS] Audio playback error:', audio.error?.code, audio.error?.message);
        activeAudio = null;
        audio.remove();
        URL.revokeObjectURL(url);
        speakBrowser(text);
      });
      audio.addEventListener('playing', () => {
        console.log('[TTS] Audio ACTUALLY playing — duration:', audio.duration, 'volume:', audio.volume, 'muted:', audio.muted);
      });
      audio.addEventListener('canplay', () => {
        console.log('[TTS] Audio canplay — readyState:', audio.readyState, 'duration:', audio.duration);
      });

      try {
        await audio.play();
        console.log('[TTS] Playing ElevenLabs audio — paused:', audio.paused, 'currentTime:', audio.currentTime, 'networkState:', audio.networkState);
      } catch (playErr) {
        console.warn('[TTS] audio.play() rejected:', playErr);
        activeAudio = null;
        audio.remove();
        URL.revokeObjectURL(url);
        speakBrowser(text);
      }
    } else {
      speakBrowser(text);
    }
  } catch (err) {
    console.warn('ElevenLabs TTS failed, falling back to browser:', err);
    speakBrowser(text);
  }
}

export function FloatingAdvisoryBot() {
  const documentContext = useSyncExternalStore(documentContextStore.subscribe, documentContextStore.get);
  const [open, setOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AdvisoryAgent | null>(getAgentById('professor-xyreg') || ADVISORY_AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICE_OPTIONS[0].id);
  const [showHistory, setShowHistory] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [conversationMode, setConversationMode] = useState(false);
  const recognitionRef = useRef<any>(null);
  const conversationModeRef = useRef(false);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();
  const companyId = useCompanyId();
  const { data: systemContext } = useAdvisoryContext(companyId, open);

  const { conversations, loading: threadsLoading, fetchConversations, createConversation, loadMessages, saveMessage, deleteConversation } = useAdvisoryThreads(companyId);

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
    const companyIdx = parts.indexOf('company');
    if (companyIdx >= 0 && parts.length > companyIdx + 2) {
      return parts.slice(companyIdx + 2).join('/');
    }
    return location.pathname;
  }, [location.pathname]);

  const { data: product } = useProductDetails(productId);
  const companyContext = CompanyContextService.get();

  const pageContext = useMemo(() => {
    let ctx = `\n\n--- CURRENT USER CONTEXT ---`;
    ctx += `\nThe user is currently viewing: ${currentSection || 'dashboard'}`;
    if (companyContext) ctx += `\nCompany: ${companyContext.companyName}`;
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
    if (systemContext) ctx += systemContext;
    return ctx;
  }, [currentSection, product, companyContext, systemContext]);

  // Keep ref in sync with state
  useEffect(() => { conversationModeRef.current = conversationMode; }, [conversationMode]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Re-start mic after assistant finishes responding in conversation mode
  const wasLoadingRef = useRef(false);
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && conversationModeRef.current) {
      // Assistant just finished — restart listening after a short delay
      const timer = setTimeout(() => {
        if (conversationModeRef.current && !recognitionRef.current) {
          startRecognition();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  const handleOpenThread = useCallback(async (conv: AdvisoryConversation) => {
    const msgs = await loadMessages(conv.id);
    setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
    setActiveConversationId(conv.id);
    // Set the agent
    const agent = getAgentById(conv.agent_id);
    if (agent) setSelectedAgent(agent);
    setShowHistory(false);
  }, [loadMessages]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
    setShowHistory(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !selectedAgent) return;
    // Prewarm audio on user gesture to satisfy Chrome autoplay policy
    if (voiceEnabled) prewarmAudio();
    const text = input.trim();
    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    let convId = activeConversationId;

    try {
      // Auto-create conversation on first message
      if (!convId) {
        const title = text.slice(0, 60);
        const conv = await createConversation(selectedAgent.id, title);
        if (conv) {
          convId = conv.id;
          setActiveConversationId(conv.id);
        }
      }

      // Persist user message
      if (convId) {
        await saveMessage(convId, 'user', text);
      }

      let systemPrompt = selectedAgent.systemPrompt + pageContext;
      if (documentContext) {
        const snippet = documentContext.content.slice(0, 2000);
        systemPrompt += `\n\n--- DOCUMENT CONTEXT ---\nThe user is currently editing the "${documentContext.sectionTitle}" section in Document Studio.\nSection content (first 2000 chars):\n${snippet}\n--- END DOCUMENT CONTEXT ---\nUse this to answer questions about their document content. You can suggest improvements but do NOT directly edit the document.`;
      }
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

      if (voiceEnabled) {
        speakElevenLabs(content, selectedVoice);
      }

      setMessages(prev => [...prev, { role: 'assistant', content }]);

      // Persist assistant message
      if (convId) {
        await saveMessage(convId, 'assistant', content);
      }
    } catch (err) {
      console.error('Advisory chat error:', err);
      toast({ title: 'Error', description: 'Failed to get a response.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedAgent, messages, voiceEnabled, selectedVoice, toast, pageContext, activeConversationId, createConversation, saveMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    let captured = '';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      captured = transcript;
      setInput(prev => (prev ? prev + ' ' : '') + transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (captured.trim()) {
        // Auto-send, then mic will restart via the isLoading useEffect
        setIsListening(false);
        setTimeout(() => {
          const sendBtn = document.querySelector('[data-speech-auto-send]') as HTMLButtonElement;
          if (sendBtn && !sendBtn.disabled) sendBtn.click();
        }, 300);
      } else if (conversationModeRef.current) {
        // No speech captured but conversation mode active — keep listening
        setTimeout(() => {
          if (conversationModeRef.current) startRecognition();
        }, 200);
      } else {
        setIsListening(false);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening || conversationMode) {
      // Stop everything
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      setConversationMode(false);
      return;
    }
    // Start conversation mode
    setConversationMode(true);
    startRecognition();
  }, [isListening, conversationMode, startRecognition]);

  const handleDeleteThread = useCallback(async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    await deleteConversation(convId);
    if (activeConversationId === convId) {
      setMessages([]);
      setActiveConversationId(null);
    }
  }, [deleteConversation, activeConversationId]);

  const currentWidth = isCompact ? 320 : 380;
  const currentHeight = isCompact ? 360 : 520;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Don't drag if clicking a button
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging.current = true;
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const x = Math.max(0, Math.min(window.innerWidth - currentWidth, ev.clientX - dragOffset.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - currentHeight, ev.clientY - dragOffset.current.y));
      setPosition({ x, y });
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentWidth, currentHeight]);

  const posStyle = position
    ? { left: position.x, top: position.y }
    : { right: 24, bottom: 80 };

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
    <div
      className={`fixed z-50 bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in ${borderClass ? `border-l-4 ${borderClass}` : ''}`}
      style={{ width: currentWidth, height: currentHeight, ...posStyle }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          {showHistory && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHistory(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            {selectedAgent && !showHistory && (
              <>
                <Avatar className={`h-7 w-7 ${avatarClass}`}>
                  <AvatarFallback className={`${avatarClass} text-xs`}>{selectedAgent.avatarInitials}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{selectedAgent.name}</span>
              </>
            )}
            {showHistory && <span className="font-medium text-sm">Conversations</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {selectedAgent && !showHistory && voiceEnabled && (
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
          {selectedAgent && !showHistory && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                const wasEnabled = voiceEnabled;
                setVoiceEnabled(!wasEnabled);
                if (wasEnabled) {
                  ttsCancelled = true;
                  window.speechSynthesis?.cancel();
                  if (activeAudio) {
                    activeAudio.pause();
                    activeAudio.currentTime = 0;
                    activeAudio.remove();
                    activeAudio = null;
                  }
                  console.log('[TTS] Muted — stopped all audio + cancelled pending');
                }
              }}
              title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>
          )}
          {/* History button */}
          {!showHistory && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { setShowHistory(true); fetchConversations(); }}
              title="Conversation history"
            >
              <ClipboardList className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsCompact(c => !c)} title={isCompact ? 'Expand' : 'Compact'}>
            {isCompact ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { ttsCancelled = true; window.speechSynthesis?.cancel(); if (activeAudio) { activeAudio.pause(); activeAudio.remove(); activeAudio = null; } setOpen(false); setMessages([]); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* History view */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {threadsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-xs">
              No conversations yet
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleOpenThread(conv)}
                className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors group flex items-start justify-between gap-2 ${activeConversationId === conv.id ? 'bg-muted' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{conv.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => handleDeleteThread(e, conv.id)}
                  title="Delete conversation"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </button>
            ))
          )}
          <div className="pt-2 pb-1">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={handleNewChat}>
              <Plus className="h-3.5 w-3.5" /> New Chat
            </Button>
          </div>
        </div>
      ) : selectedAgent && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
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
              {speechSupported && (
                <Button
                  onClick={toggleListening}
                  variant={isListening || conversationMode ? "destructive" : "outline"}
                  size="icon"
                  className={`shrink-0 h-9 w-9 ${isListening ? 'animate-pulse' : conversationMode ? 'ring-2 ring-destructive/50' : ''}`}
                  title={conversationMode ? 'Stop conversation mode' : 'Start conversation mode'}
                >
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </Button>
              )}
              <Button data-speech-auto-send onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="shrink-0 h-9 w-9">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
