import { useState, useRef, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useCompanyApiKeys } from '@/hooks/useCompanyApiKeys';
import { AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, X, Volume2, VolumeX, Users, ClipboardList, Plus, ArrowLeft, Trash2, Minimize2, Maximize2, Mic, MicOff, GripVertical } from 'lucide-react';
import { useVerticalDragPosition } from '@/hooks/useVerticalDragPosition';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import { ADVISORY_AGENTS, type AdvisoryAgent, getAgentById } from '@/data/advisoryAgents';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { showNoCreditDialog } from '@/context/AiCreditContext';
import { useProductDetails } from '@/hooks/useProductDetails';
import { CompanyContextService } from '@/services/companyContext';
import { useAdvisoryThreads, type AdvisoryConversation } from '@/hooks/useAdvisoryThreads';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAdvisoryContext } from '@/hooks/useAdvisoryContext';
import { formatDistanceToNow } from 'date-fns';
import { documentContextStore } from '@/stores/documentContextStore';
import { useRightRail } from '@/context/RightRailContext';


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
let ttsCooldownTimer: ReturnType<typeof setTimeout> | null = null;

function beginTTSPlayback() {
  if (ttsCooldownTimer) {
    clearTimeout(ttsCooldownTimer);
    ttsCooldownTimer = null;
  }
  isTTSPlaying = true;
  ttsCooldown = true;
}

function cancelTTSPlayback() {
  if (ttsCooldownTimer) {
    clearTimeout(ttsCooldownTimer);
    ttsCooldownTimer = null;
  }
  isTTSPlaying = false;
  ttsCooldown = false;
}

function finishTTSPlayback() {
  isTTSPlaying = false;
  if (ttsCooldownTimer) {
    clearTimeout(ttsCooldownTimer);
  }
  ttsCooldownTimer = setTimeout(() => {
    ttsCooldown = false;
    ttsCooldownTimer = null;
    window.dispatchEvent(new Event('tts-ended'));
  }, 1000);
}

function speakBrowser(text: string) {
  const stripped = stripMarkdown(text);
  if (!stripped) {
    cancelTTSPlayback();
    return;
  }
  if (!('speechSynthesis' in window)) {
    cancelTTSPlayback();
    return;
  }

  beginTTSPlayback();
  window.speechSynthesis.cancel();

  if (ttsCancelled) {
    cancelTTSPlayback();
    return;
  }

  // Capture the generation at speak-time so a later hardStopTTS() (e.g.
  // triggered by a new user prompt) can invalidate this utterance even
  // after speechSynthesis has already started speaking.
  const myGen = ttsGeneration;
  const utterance = new SpeechSynthesisUtterance(stripped);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.onend = () => {
    if (myGen !== ttsGeneration) return; // stale — newer prompt took over
    finishTTSPlayback();
  };
  utterance.onerror = () => cancelTTSPlayback();
  // Poll for stale generation; if a newer prompt arrived, hard-cancel.
  const staleCheck = setInterval(() => {
    if (myGen !== ttsGeneration || ttsCancelled) {
      try { window.speechSynthesis.cancel(); } catch {}
      clearInterval(staleCheck);
    }
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
      clearInterval(staleCheck);
    }
  }, 200);
  window.speechSynthesis.speak(utterance);
}

const VOICE_OPTIONS = [
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', desc: 'Clear & professional', gender: 'male' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'Warm & authoritative', gender: 'male' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', desc: 'Calm British', gender: 'male' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', desc: 'Deep & warm', gender: 'male' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Clear American', gender: 'male' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', desc: 'Natural Australian', gender: 'male' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Soft & warm', gender: 'female' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', desc: 'Young & expressive', gender: 'female' },
  { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi', desc: 'Energetic & playful', gender: 'female' },
  { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace', desc: 'Gentle & soothing', gender: 'female' },
] as const;

/** Active audio element for cancellation. */
let activeAudio: HTMLAudioElement | null = null;

/** Flag to cancel TTS that is still being fetched when mute is clicked. */
let ttsCancelled = false;

/** Monotonic generation counter — any in-flight TTS with an older generation is discarded. */
let ttsGeneration = 0;

/** Hard-stop any current or pending TTS playback (audio + speech synthesis). */
function hardStopTTS() {
  ttsCancelled = true;
  ttsGeneration++;
  try { window.speechSynthesis?.cancel(); } catch {}
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = '';
      activeAudio.load();
      activeAudio.remove();
    } catch {}
    activeAudio = null;
  }
  cancelTTSPlayback();
}

/** Flag tracking whether TTS audio is currently playing (prevents mic self-prompting). */
let isTTSPlaying = false;

/** Cooldown flag — true for 1000ms after TTS ends, blocks recognition results. */
let ttsCooldown = false;

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
  // Hard-stop anything currently playing, then claim a new generation.
  hardStopTTS();
  const myGen = ++ttsGeneration;
  ttsCancelled = false;
  beginTTSPlayback();

  try {
    // Replace "Xyreg" with phonetic spelling so TTS pronounces it correctly
    const stripped = stripMarkdown(text).replace(/\bXyreg\b/gi, 'Sireg').slice(0, 4000);
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
        cancelTTSPlayback();
        return;
      }
      if (myGen !== ttsGeneration) {
        console.log('[TTS] Stale generation — discarding fetched audio');
        cancelTTSPlayback();
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
        finishTTSPlayback();
        activeAudio = null;
        audio.remove();
        URL.revokeObjectURL(url);
      });
      audio.addEventListener('error', () => {
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
        if (myGen !== ttsGeneration || ttsCancelled) {
          console.log('[TTS] Cancelled after play() resolved — stopping');
          try { audio.pause(); audio.currentTime = 0; audio.src = ''; audio.load(); audio.remove(); } catch {}
          if (activeAudio === audio) activeAudio = null;
          cancelTTSPlayback();
          return;
        }
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
  // Close bot when no-credit dialog navigates to add-ons
  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener('close-ai-panels', handler);
    return () => window.removeEventListener('close-ai-panels', handler);
  }, []);
  const [selectedAgent, setSelectedAgent] = useState<AdvisoryAgent | null>(getAgentById('professor-xyreg') || ADVISORY_AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICE_OPTIONS[0].id);
  const [voiceGenderTab, setVoiceGenderTab] = useState<'male' | 'female'>('male');
  const [showHistory, setShowHistory] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = localStorage.getItem('xyreg.advisoryBot.pos');
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.x === 'number' && typeof p?.y === 'number') return p;
      }
    } catch { /* ignore */ }
    return null;
  });
  const [isListening, setIsListening] = useState(false);
  const [conversationMode, setConversationMode] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const conversationModeRef = useRef(false);
  /** Accumulated transcript across recognition restarts during a single PTT hold. */
  const pttAccumulatedRef = useRef<string>('');
  const isDragging = useRef(false);
  const pttDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { isRightRailOpen } = useRightRail();
  const { getApiKey, apiKeys: companyApiKeys } = useCompanyApiKeys(companyId);
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
    ctx += `\nYou DO have awareness of what the user is currently looking at via the context below (route, company, product, page data). When the user asks "can you see the screen?" or "what am I looking at?", DO NOT say you cannot see their screen. Instead, describe the current page, section, and any product/company context you have here. Only clarify that you read structured page context (not pixels) if the user explicitly asks how you know.`;
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
    if (companyContext) {
      const encodedName = encodeURIComponent(companyContext.companyName);
      ctx += `\n\n--- NAVIGATION CAPABILITY ---`;
      ctx += `\nIf the user asks you to navigate them to a page, include a navigation tag in your response like: [NAVIGATE:/app/company/${encodedName}/settings]`;
      ctx += `\nYou can also navigate to specific sub-tabs using query parameters: [NAVIGATE:/app/company/${encodedName}/settings?tab=general]`;
      ctx += `\n\nAvailable pages, their tabs, and common aliases:`;
      ctx += `\n- settings — Top-level tabs: lifecycle-phases, compliance-instances, clinical-trials, users, stakeholders, reviewers, general`;
      ctx += `\n  - general has sub-tabs (use &submenu=): profile, system, admin`;
      ctx += `\n  - profile has sections (use &section=) to auto-open and scroll to a specific collapsible:`;
      ctx += `\n    - section=prefixes → Prefixes & Document Numbering`;
      ctx += `\n    - section=currency → Currency & Financial Settings`;
      ctx += `\n    - section=portfolio-structure → Device Portfolio Structure`;
      ctx += `\n    - section=document-due-date → Document Due Date`;
      ctx += `\n    - section=date-format → Date Display Format`;
      ctx += `\n    - section=edm-system → Electronic Document Management System`;
      ctx += `\n    - section=retention-periods → Document Retention Periods`;
      ctx += `\n    - section=document-types → Document Types`;
      ctx += `\n    - section=manufacturer → Manufacturer Information`;
      ctx += `\n    - section=production-site → Production Site`;
      ctx += `\n  - compliance-instances has sub-tabs (use &submenu=): documents, gap-analysis, activities, audits`;
      ctx += `\n  - Aliases: "prefixes" or "sub-prefixes" or "document numbering" or "document categories" → settings?tab=general&submenu=profile&section=prefixes`;
      ctx += `\n  - Aliases: "currency" or "financial settings" → settings?tab=general&submenu=profile&section=currency`;
      ctx += `\n  - Aliases: "portfolio structure" or "device portfolio" → settings?tab=general&submenu=profile&section=portfolio-structure`;
      ctx += `\n  - Aliases: "document due date" → settings?tab=general&submenu=profile&section=document-due-date`;
      ctx += `\n  - Aliases: "date format" → settings?tab=general&submenu=profile&section=date-format`;
      ctx += `\n  - Aliases: "EDM" or "document management system" or "EDMS" → settings?tab=general&submenu=profile&section=edm-system`;
      ctx += `\n  - Aliases: "retention periods" → settings?tab=general&submenu=profile&section=retention-periods`;
      ctx += `\n  - Aliases: "document types" → settings?tab=general&submenu=profile&section=document-types`;
      ctx += `\n  - Aliases: "manufacturer" or "manufacturer info" → settings?tab=general&submenu=profile&section=manufacturer`;
      ctx += `\n  - Aliases: "production site" → settings?tab=general&submenu=profile&section=production-site`;
      ctx += `\n  - Aliases: "system configuration" or "system config" → settings?tab=general&submenu=system`;
      ctx += `\n  - Aliases: "administration" or "admin settings" → settings?tab=general&submenu=admin`;
      ctx += `\n  - Aliases: "users" or "user management" or "departments" → settings?tab=users`;
      ctx += `\n  - Aliases: "phases" or "lifecycle" → settings?tab=lifecycle-phases`;
      ctx += `\n  - Aliases: "reviewers" or "review groups" → settings?tab=reviewers`;
      ctx += `\n  - Aliases: "stakeholders" or "notified bodies" → settings?tab=stakeholders`;
      ctx += `\n  - Aliases: "general settings" or "company info" → settings?tab=general`;
      ctx += `\n  - Aliases: "clinical trials" → settings?tab=clinical-trials`;
      ctx += `\n- quality-manual (aliases: manual, QMS manual)`;
      ctx += `\n- products (aliases: devices, device, product list, my devices)`;
      ctx += `\n- documents (aliases: docs, documentation, files)`;
      ctx += `\n  - documents has tabs: documents, templates — e.g. documents?tab=templates`;
      ctx += `\n- audits (aliases: audit)`;
      ctx += `\n- complaints (aliases: complaint)`;
      ctx += `\n- capa (aliases: corrective actions, CAPA)`;
      ctx += `\n- risk (aliases: risk management, risks)`;
      ctx += `\n- suppliers (aliases: supplier, vendor, vendors)`;
      ctx += `\n- training (aliases: trainings)`;
      ctx += `\n- dashboard (aliases: mission control, home, overview)`;
      ctx += `\n- calibration (aliases: calibrations, instruments)`;
      ctx += `\n- post-market (aliases: PMS, post market, surveillance, vigilance)`;
      ctx += `\n- lifecycle (aliases: lifecycle, phases)`;
      ctx += `\n- nonconformity (aliases: NC, non-conformance)`;
      ctx += `\n- change-control (aliases: change request, CCR)`;
      ctx += `\n- design-review (aliases: design reviews)`;
      ctx += `\n- infrastructure (aliases: equipment, facilities)`;
      ctx += `\n- calibration-schedule (aliases: calibration)`;
      ctx += `\n- management-review (aliases: management reviews)`;
      ctx += `\n- commercial-landing (aliases: commercial)`;
      ctx += `\n- milestones (aliases: timeline, project milestones)`;
      ctx += `\n- activities (aliases: activity)`;
      ctx += `\n- compliance-instances (aliases: compliance)`;
      ctx += `\n- budget-dashboard (aliases: budget)`;
      ctx += `\nIf the user mentions a specific product by name, navigate to: /app/company/${encodedName}/products (the product list page).`;
      ctx += `\nExample: "Sure, I'll take you to Settings now. [NAVIGATE:/app/company/${encodedName}/settings]"`;
      ctx += `\nExample with deep-link: "I'll take you to the document prefixes configuration. [NAVIGATE:/app/company/${encodedName}/settings?tab=general&submenu=profile&section=prefixes]"`;
      ctx += `\nAlways use the most specific deep-link available. For example, if the user asks about prefixes, use section=prefixes, not just tab=general.`;
      ctx += `\nThe tag will be parsed and the user will be navigated automatically. Do NOT show the tag as visible text.`;
      ctx += `\nIf unsure which page the user means, ask for clarification rather than guessing.`;
      ctx += `\n--- END NAVIGATION ---`;
    }
    if (systemContext) ctx += systemContext;
    return ctx;
  }, [currentSection, product, companyContext, systemContext]);

  // Keep ref in sync with state
  useEffect(() => { conversationModeRef.current = conversationMode; }, [conversationMode]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Restart mic when TTS finishes (via custom event from speakElevenLabs)
  useEffect(() => {
    const handleTTSEnded = () => {
      if (conversationModeRef.current && !recognitionRef.current) {
        startRecognition();
      }
    };
    window.addEventListener('tts-ended', handleTTSEnded);
    return () => window.removeEventListener('tts-ended', handleTTSEnded);
  }, []);

  // Re-start mic after assistant finishes responding in conversation mode (non-voice fallback)
  const wasLoadingRef = useRef(false);
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && conversationModeRef.current) {
      if (!isTTSPlaying && !ttsCooldown && !recognitionRef.current) {
        const timer = setTimeout(() => startRecognition(), 500);
        return () => clearTimeout(timer);
      }
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

    // Stop any in-flight TTS (browser SpeechSynthesis or edge-function audio)
    // before starting a new prompt — prevents the previous answer from
    // continuing to play over the new one.
    hardStopTTS();

    // Guard: Google Vertex AI key must be configured for this company.
    // Show an inline error banner in the chat panel with a button to go set it.
    if (!companyApiKeys.isLoading && !getApiKey('google_vertex' as any)) {
      setApiKeyMissing(true);
      return;
    }
    if (apiKeyMissing) setApiKeyMissing(false);

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
      const response = await supabase.functions.invoke('vertex-advisory-chat', {
        body: {
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          systemPrompt,
          agentId: selectedAgent.id,
          companyId,
        }
      });
      // Check for NO_CREDITS in both data and error paths
      if (response.data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        return;
      }
      if (response.error) {
        console.error('[vertex-advisory-chat] edge fn error:', response.error);
        throw response.error;
      }
      const data = response.data;
      if (data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        return;
      }
      if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }
      let content = data?.content || 'I apologize, I was unable to generate a response.';

      // Parse and execute navigation directives
      const navMatch = content.match(/\[NAVIGATE:(\/[^\]]+)\]/);
      if (navMatch) {
        const navPath = navMatch[1];
        content = content.replace(/\[NAVIGATE:\/[^\]]+\]/g, '').trim();
        setTimeout(() => navigate(navPath), 500);
      }

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
  }, [input, isLoading, selectedAgent, messages, voiceEnabled, selectedVoice, toast, pageContext, activeConversationId, createConversation, saveMessage, companyApiKeys.isLoading, getApiKey, navigate, apiKeyMissing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Post-process speech recognition to fix common misrecognitions
  const fixTranscript = useCallback((text: string) => {
    const replacements: [RegExp, string][] = [
      [/\b(cyrus|sirus|syrus|xyrus|cyres|zyreg|cyric|cyrik|sirik|siri[ck]|syreg|sireg|sigh\s*reg|sy\s*reg)\b/gi, 'Xyreg'],
      [/\bprof(?:essor)?\s+(cyrus|sirus|syrus|xyrus|cyres|zyreg|cyric|cyrik|sirik|siri[ck]|syreg|sireg|sigh\s*reg|sy\s*reg)\b/gi, 'Professor Xyreg'],
    ];
    let fixed = text;
    for (const [pattern, replacement] of replacements) {
      fixed = fixed.replace(pattern, replacement);
    }
    return fixed;
  }, []);

  const startRecognition = useCallback(() => {
    if (isTTSPlaying || ttsCooldown) {
      console.log('[STT] Blocked — TTS playing or cooldown active');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    let captured = '';
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    const clearSilenceTimer = () => {
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    };

    const autoSend = () => {
      clearSilenceTimer();
      if (captured.trim() && conversationModeRef.current) {
        const fixed = fixTranscript(captured.trim());
        setInput(fixed);
        setIsListening(false);
        recognition.stop();
        recognitionRef.current = null;
        setTimeout(() => {
          const sendBtn = document.querySelector('[data-speech-auto-send]') as HTMLButtonElement;
          if (sendBtn && !sendBtn.disabled) sendBtn.click();
        }, 300);
      }
    };

    recognition.onresult = (event: any) => {
      if (isTTSPlaying || ttsCooldown) {
        // Voice detected during TTS → interrupt the bot
        if (activeAudio) {
          activeAudio.pause();
          activeAudio.remove();
          activeAudio = null;
        }
        window.speechSynthesis?.cancel();
        cancelTTSPlayback();
        // Discard this result (it's mixed with TTS audio)
        return;
      }
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      captured = finalText;
      const combined = (pttAccumulatedRef.current + ' ' + finalText + ' ' + interimText).trim();
      setInput(fixTranscript(combined));

      // In conversation mode, auto-send after 1.5s of silence
      if (conversationModeRef.current && (finalText || interimText)) {
        clearSilenceTimer();
        silenceTimer = setTimeout(autoSend, 1500);
      }
    };
    recognition.onerror = () => {
      clearSilenceTimer();
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      clearSilenceTimer();
      recognitionRef.current = null;
      // If user is still holding the mic (push-to-talk), restart recognition
      // instead of auto-sending — they haven't released yet.
      if (isPTTActive.current && !conversationModeRef.current) {
        // Persist any captured text so it isn't lost when we restart.
        if (captured.trim()) {
          pttAccumulatedRef.current = (pttAccumulatedRef.current + ' ' + captured.trim()).trim();
        }
        setTimeout(() => {
          if (isPTTActive.current && !recognitionRef.current) {
            try { startRecognition(); } catch {}
          }
        }, 50);
        return;
      }
      // Merge any accumulated text from previous restarts during PTT hold.
      const fullCaptured = (pttAccumulatedRef.current + ' ' + captured).trim();
      pttAccumulatedRef.current = '';
      if (fullCaptured) {
        const fixed = fixTranscript(fullCaptured);
        setInput(fixed);
        setIsListening(false);
        setTimeout(() => {
          const sendBtn = document.querySelector('[data-speech-auto-send]') as HTMLButtonElement;
          if (sendBtn && !sendBtn.disabled) sendBtn.click();
        }, 300);
      } else if (conversationModeRef.current && !isTTSPlaying && !ttsCooldown) {
        setTimeout(() => {
          if (conversationModeRef.current && !recognitionRef.current && !isTTSPlaying && !ttsCooldown) {
            startRecognition();
          }
        }, 200);
      } else {
        setIsListening(false);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [fixTranscript]);

  // Push-to-talk state
  const pttPressTimeRef = useRef<number>(0);
  const pttDoubleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPTTActive = useRef(false);

  const stopAllListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    cancelTTSPlayback();
    setIsListening(false);
    setConversationMode(false);
    isPTTActive.current = false;
  }, []);

  // Mouse/touch down → start push-to-talk (after 300ms to allow double-click detection)
  const handleMicDown = useCallback(() => {
    // Hard-stop any playing or pending TTS immediately (walkie-talkie interrupt)
    hardStopTTS();

    if (conversationMode) {
      // Already in conversation mode — just stop everything
      stopAllListening();
      return;
    }

    // Delay PTT start to allow double-click detection
    if (pttDelayTimer.current) clearTimeout(pttDelayTimer.current);
    pttDelayTimer.current = setTimeout(() => {
      pttPressTimeRef.current = Date.now();
      isPTTActive.current = true;
      pttAccumulatedRef.current = '';
      if (!recognitionRef.current) {
        startRecognition();
      }
    }, 250);
  }, [conversationMode, stopAllListening, startRecognition]);

  // Mouse/touch up → stop recognition (auto-sends via onend handler)
  const handleMicUp = useCallback(() => {
    if (!isPTTActive.current || conversationMode) return;
    isPTTActive.current = false;

    // Stop recognition — the onend handler will auto-send if there's text
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [conversationMode]);

  // Double-click → toggle persistent conversation mode
  const handleMicDoubleClick = useCallback(() => {
    // Cancel any pending PTT start
    if (pttDelayTimer.current) {
      clearTimeout(pttDelayTimer.current);
      pttDelayTimer.current = null;
    }
    isPTTActive.current = false;

    if (conversationMode) {
      stopAllListening();
    } else {
      // Stop any recognition started by first click's PTT
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
      setConversationMode(true);
      startRecognition();
    }
  }, [conversationMode, stopAllListening, startRecognition]);

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
      try { localStorage.setItem('xyreg.advisoryBot.pos', JSON.stringify({ x, y })); } catch { /* ignore */ }
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

  // Always pin to the absolute bottom-right, regardless of any right rail.
  const railRightCss = '24px' as const;
  const posStyle: React.CSSProperties = position
    ? { left: position.x, top: position.y }
    : { right: railRightCss, bottom: 80 };

  const announceLaunchIntent = useCallback(() => {
    window.dispatchEvent(new CustomEvent('prof-xyreg-launch-intent'));
  }, []);

  // Vertical drag for the collapsed FAB. Default 5.5rem (88px) above viewport bottom.
  // Nudge up by 70px if the feedback button is at its default to avoid overlap.
  const fabDrag = useVerticalDragPosition({
    storageKey: 'xyreg.advisoryBot.fabY',
    defaultBottomPx: 88 + 70,
    buttonHeight: 56,
  });

  if (!open) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen(true)}
              onPointerDown={(e) => {
                announceLaunchIntent();
                e.stopPropagation();
              }}
              onMouseDown={(e) => { e.stopPropagation(); fabDrag.onMouseDown(e); }}
              onClickCapture={(e) => { if (fabDrag.wasDragged()) { e.preventDefault(); e.stopPropagation(); } }}
              onContextMenu={(e) => { if (fabDrag.hasCustomY) { e.preventDefault(); fabDrag.reset(); } }}
              style={{ right: 24, ...fabDrag.style }}
              className={`fixed z-[100] h-14 w-14 rounded-full bg-[#D4AF37] text-white shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center group ${fabDrag.dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              aria-label="Professor XyReg — Technical Advisory Board"
              data-prof-xyreg-root
            >
              <GripVertical className="h-3 w-3 absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-70 transition-opacity text-white" />
              <Users className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white animate-pulse" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p>Professor XyReg — Technical Advisory Board</p>
            <p className="text-[10px] opacity-70 mt-0.5">Drag vertically to move • Right-click to reset</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const avatarClass = selectedAgent ? (AVATAR_COLORS[selectedAgent.domainColor] || AVATAR_COLORS.gold) : '';
  const borderClass = selectedAgent ? (BORDER_COLORS[selectedAgent.domainColor] || '') : '';

  return (
    <div
      className={`fixed z-[100] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in ${borderClass ? `border-l-4 ${borderClass}` : ''}`}
      style={{ width: currentWidth, height: currentHeight, ...posStyle }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      data-prof-xyreg-root
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        title="Drag to move"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
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
                <div className="flex border-b border-border mb-1">
                  <button
                    type="button"
                    className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${voiceGenderTab === 'male' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onMouseDown={(e) => { e.preventDefault(); setVoiceGenderTab('male'); }}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${voiceGenderTab === 'female' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onMouseDown={(e) => { e.preventDefault(); setVoiceGenderTab('female'); }}
                  >
                    Female
                  </button>
                </div>
                {VOICE_OPTIONS.filter(v => v.gender === voiceGenderTab).map(v => (
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
            {apiKeyMissing && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Google Vertex AI key required</p>
                    <p className="text-[11px] mt-0.5 text-destructive/90">
                      Add a Google Vertex AI service-account key in Company Settings → General → API Keys to use the advisory chat.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs w-full"
                  onClick={() => {
                    const ctx = CompanyContextService.get();
                    const slug = ctx?.companyName ? encodeURIComponent(ctx.companyName) : null;
                    if (slug) navigate(`/app/company/${slug}/settings?tab=general`);
                  }}
                >
                  Set API key
                </Button>
              </div>
            )}
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
            <div className="flex items-end gap-2">
              <Textarea
                autoSize={false}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${selectedAgent.name}...`}
                className="h-9 min-h-9 max-h-24 resize-none overflow-y-auto text-xs"
                rows={1}
              />
              {speechSupported && (
                <Button
                  onMouseDown={handleMicDown}
                  onMouseUp={handleMicUp}
                  onMouseLeave={handleMicUp}
                  onTouchStart={handleMicDown}
                  onTouchEnd={handleMicUp}
                  onDoubleClick={handleMicDoubleClick}
                  variant={isListening || conversationMode ? "destructive" : "outline"}
                  size="icon"
                  className={`shrink-0 h-9 w-9 select-none ${isListening && !conversationMode ? 'animate-pulse' : ''} ${conversationMode ? 'ring-2 ring-destructive ring-offset-1' : ''}`}
                  title={conversationMode ? 'Conversation mode ON (click to stop)' : 'Hold to talk · Double-click for hands-free'}
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
