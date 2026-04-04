import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sparkles,
  FileText,
  Loader2,
  Copy,
  Check,
  X,
  Send,
  Plus,
  Image,
  FileSpreadsheet,
  Settings,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { PromptSettingsDrawer } from './PromptSettingsDrawer';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';
import { LoaderFive } from '@/components/ui/loader';

interface DocumentForSummary {
  id: string;
  name: string;
  file_path?: string;
  file_name?: string;
  document_type?: string;
  phase_name?: string;
  status?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  attachedDocs?: { id: string; name: string }[];
  tokenUsage?: { input: number; output: number; total: number };
  contentCoverage?: Array<{ docName: string; coverage: number }>;
}

interface BulkDocumentSummarySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentForSummary[];
  companyId: string;
  selectedDocIds: Set<string>;
  onToggleDocSelection: (docId: string) => void;
}

export function BulkDocumentSummarySidebar({
  open,
  onOpenChange,
  documents,
  companyId,
  selectedDocIds,
  onToggleDocSelection,
}: BulkDocumentSummarySidebarProps) {
  const navigate = useNavigate();
  const { data: companyInfo } = useCompanyInfo(companyId);

  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [embeddingStatus, setEmbeddingStatus] = useState<Map<string, { hasEmbeddings: boolean; chunkCount: number }>>(new Map());
  const [isEmbedding, setIsEmbedding] = useState<Set<string>>(new Set());
  const [embeddingErrors, setEmbeddingErrors] = useState<Map<string, string>>(new Map());
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isVertexConfigured, setIsVertexConfigured] = useState<boolean | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [promptSettingsOpen, setPromptSettingsOpen] = useState(false);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const documentsWithFiles = documents.filter(doc => doc.file_path);

  // Helper to strip "template-" prefix from document IDs for backend API calls
  const cleanDocId = (id: string) => id.replace(/^template-/, '');

  // Documents available for selection (only those with files)
  const allAvailableDocs = documentsWithFiles;


  useEffect(() => {
    if (open && companyId) {
      fetchEmbeddingStatuses();
      checkVertexConfiguration();
      fetchActivePromptId();
    }
  }, [open, companyId]);

  // Fetch active prompt ID on load
  const fetchActivePromptId = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: { id: string; additional_instructions: string } }>(
        `/ai/prompts/${companyId}/active?prompt_type=rag_summary`
      );
      if (response.data.success && response.data.data && response.data.data.id !== 'default') {
        setActivePromptId(response.data.data.id);
      }
    } catch (error) {
      console.error('Failed to fetch active prompt:', error);
    }
  };

  const checkVertexConfiguration = async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data?: { providers: Record<string, boolean> };
      }>(`/documents/summarize/providers/${companyId}`);
      
      if (response.data.success && response.data.data?.providers) {
        const hasVertex = response.data.data.providers.google_vertex === true;
        setIsVertexConfigured(hasVertex);
      } else {
        setIsVertexConfigured(false);
      }
    } catch (error) {
      console.error('Failed to check Vertex AI configuration:', error);
      setIsVertexConfigured(false);
    }
  };

  useEffect(() => {
    if (open) {
      setChatMessages([]);
      setInputValue('');
      setShowSourcePicker(false);
    }
  }, [open]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Trigger embedding only for SELECTED documents that don't have embeddings
  useEffect(() => {
    if (!open || selectedDocIds.size === 0) return;

    // Find selected docs that need embedding (not already embedded and not currently embedding)
    const selectedDocsNeedingEmbedding = Array.from(selectedDocIds).filter(docId => {
      const status = embeddingStatus.get(docId);
      const needsEmbedding = !status?.hasEmbeddings;
      const notAlreadyEmbedding = !isEmbedding.has(docId);
      return needsEmbedding && notAlreadyEmbedding;
    });

    if (selectedDocsNeedingEmbedding.length > 0) {
      triggerBackgroundEmbedding(selectedDocsNeedingEmbedding);
    }
  }, [selectedDocIds, embeddingStatus, open]);

  const fetchEmbeddingStatuses = async () => {
    if (documentsWithFiles.length === 0) return;
    try {
      // Map original IDs to clean IDs for API call
      const idMapping = new Map<string, string>();
      documentsWithFiles.forEach(doc => {
        idMapping.set(cleanDocId(doc.id), doc.id);
      });

      const response = await apiClient.post<{
        success: boolean;
        data?: { statuses: Record<string, { hasEmbeddings: boolean; chunkCount: number }> };
      }>('/documents/summarize/embedding-status/batch', {
        document_ids: documentsWithFiles.map(doc => cleanDocId(doc.id))
      });

      if (response.data.success && response.data.data?.statuses) {
        const statuses = new Map<string, { hasEmbeddings: boolean; chunkCount: number }>();

        Object.entries(response.data.data.statuses).forEach(([cleanId, status]) => {
          // Map back to original ID (with template- prefix if it had one)
          const originalId = idMapping.get(cleanId) || cleanId;
          statuses.set(originalId, status);
        });
        setEmbeddingStatus(statuses);
        // NOTE: Don't auto-embed all docs - only embed SELECTED docs (handled in useEffect below)
      }
    } catch (error) {
      console.error('Failed to fetch embedding statuses:', error);
    }
  };

  // Trigger embedding for multiple docs in background
  const triggerBackgroundEmbedding = async (docIds: string[]) => {
    // Mark all as embedding
    setIsEmbedding(prev => new Set([...prev, ...docIds]));

    // Process docs in parallel (max 3 at a time to avoid overwhelming)
    const batchSize = 3;
    for (let i = 0; i < docIds.length; i += batchSize) {
      const batch = docIds.slice(i, i + batchSize);

      await Promise.all(batch.map(async (docId) => {
        try {
          const cleanId = cleanDocId(docId);

          const response = await apiClient.post<{
            success: boolean;
            data?: { document_id: string; stats: any };
            error?: string;
          }>('/documents/summarize/embed', {
            company_id: companyId,
            document_id: cleanId
          });

          if (response.data.success) {
            // Update embedding status
            setEmbeddingStatus(prev => {
              const newStatus = new Map(prev);
              newStatus.set(docId, {
                hasEmbeddings: true,
                chunkCount: response.data.data?.stats?.chunks_created || 1
              });
              return newStatus;
            });
            // Clear any previous error for this doc
            setEmbeddingErrors(prev => {
              const newErrors = new Map(prev);
              newErrors.delete(docId);
              return newErrors;
            });
          } else {
            console.warn(`[PRE-EMBED] Failed to embed doc ${cleanId}:`, response.data.error);
            // Track the error for this document
            const errorMsg = response.data.error || 'Document failed';
            setEmbeddingErrors(prev => {
              const newErrors = new Map(prev);
              newErrors.set(docId, errorMsg);
              return newErrors;
            });
            // Show toast notification for embedding failure
            const doc = documentsWithFiles.find(d => d.id === docId);
            toast.error(`Failed to process "${doc?.name || 'document'}"`);
          }
        } catch (error: any) {
          console.error(`[PRE-EMBED] Error embedding doc ${docId}:`, error);
          // Track the network/unexpected error
          const errorMsg = error?.message || 'Network error';
          setEmbeddingErrors(prev => {
            const newErrors = new Map(prev);
            newErrors.set(docId, errorMsg);
            return newErrors;
          });
          const doc = documentsWithFiles.find(d => d.id === docId);
          toast.error(`Failed to process "${doc?.name || 'document'}"`);
        } finally {
          // Remove from embedding set
          setIsEmbedding(prev => {
            const newSet = new Set(prev);
            newSet.delete(docId);
            return newSet;
          });
        }
      }));
    }
  };

  const handleSubmit = async (message?: string) => {
    const query = message || inputValue.trim();
    if (!query || isLoading) return;

    // Get attached docs info for this message (if any selected)
    const attachedDocs = selectedDocIds.size > 0
      ? Array.from(selectedDocIds).map(id => {
          const doc = allAvailableDocs.find(d => d.id === id);
          return { id, name: doc?.name || 'Document' };
        })
      : [];

    // Capture selected doc IDs before clearing (for API call)
    const currentSelectedIds = Array.from(selectedDocIds);
    const cleanSelectedIds = currentSelectedIds.map(cleanDocId);

    // Show user message with attached docs and loading state
    setInputValue('');
    setCurrentStatus(null); // Reset status
    setChatMessages(prev => [...prev, { role: 'user', content: query, attachedDocs: attachedDocs.length > 0 ? attachedDocs : undefined }]);
    setChatMessages(prev => [...prev, { role: 'assistant', content: '', isLoading: true }]);
    setIsLoading(true);

    // Clear selected documents after message is sent (user can select new ones for next question)
    if (currentSelectedIds.length > 0) {
      currentSelectedIds.forEach(docId => {
        onToggleDocSelection(docId);
      });
    }

    try {
      let response: Response;

      if (currentSelectedIds.length > 0) {
        // WITH docs selected → FAST chunk-based streaming (2-5s target)
        response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api'}/documents/summarize/multi-fast/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            document_ids: cleanSelectedIds,
            query,
            conversation_history: chatMessages.filter(m => !m.isLoading).map(m => ({
              role: m.role,
              content: m.content
            })),
            options: {
              max_chunks_per_doc: 4,
              temperature: 0.2,
              max_tokens: 2500
            },
          }),
        });
      } else {
        // WITHOUT docs → Use RAG with embeddings + conversation history
        // Build conversation history for context
        const conversationHistory = chatMessages
          .filter(m => !m.isLoading)
          .map(m => ({
            role: m.role,
            content: m.content,
            docs: m.attachedDocs?.map(d => d.name) || []
          }));

        response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api'}/documents/summarize/rag/embeddings/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            query,
            conversation_history: conversationHistory,
            ai_provider: 'google_vertex',
            prompt_id: activePromptId, // Custom prompt (null = use default)
            options: {
              threshold: 0.35,
              context_chunks: 6,
              temperature: 0.2,
              max_tokens: 2500
            },
          }),
        });
      }

      // Check if response is JSON (error) or SSE (streaming)
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        // Non-streaming response (error or no results)
        const data = await response.json();
        if (data.success && data.data) {
          setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: data.data.answer || 'No response generated',
              isLoading: false,
            };
            return newMessages;
          });
        } else {
          throw new Error(data.message || 'Failed to get response');
        }
      } else {
        // Streaming SSE response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        if (!reader) {
          throw new Error('No response body');
        }

        const processLine = (line: string) => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              // Stream complete - final update, preserve metadata
              setCurrentStatus(null); // Clear status
              setChatMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                newMessages[newMessages.length - 1] = {
                  ...lastMsg, // Preserve tokenUsage, contentCoverage
                  content: fullContent || 'No response generated',
                  isLoading: false,
                };
                return newMessages;
              });
              return;
            }

            try {
              const parsed = JSON.parse(data);

              // Handle status messages (live updates like ChatGPT/Gemini)
              if (parsed.type === 'status' && parsed.status) {
                setCurrentStatus(parsed.status);
                return;
              }

              // Handle metadata - store in message
              if (parsed.type === 'metadata') {
                // Show prompt status
                if (parsed.prompt_used) {
                  const promptStatus = parsed.prompt_used.has_additional_instructions
                    ? 'Aligning your instructions...'
                    : 'Generating...';
                  setCurrentStatus(promptStatus);
                }

                if (parsed.content_coverage || parsed.estimated_tokens) {
                  setChatMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    newMessages[newMessages.length - 1] = {
                      ...lastMsg,
                      contentCoverage: parsed.content_coverage?.map((c: any) => ({
                        docName: c.docName,
                        coverage: c.coverage
                      })),
                      tokenUsage: parsed.estimated_tokens
                        ? { input: parsed.estimated_tokens, output: 0, total: parsed.estimated_tokens }
                        : lastMsg.tokenUsage
                    };
                    return newMessages;
                  });
                }
                return;
              }

              // Handle actual token usage (sent at end of stream) - update message
              if (parsed.type === 'usage' && parsed.usage) {
                setChatMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  newMessages[newMessages.length - 1] = {
                    ...lastMsg,
                    tokenUsage: {
                      input: parsed.usage.input_tokens || 0,
                      output: parsed.usage.output_tokens || 0,
                      total: parsed.usage.total_tokens || 0
                    }
                  };
                  return newMessages;
                });
                return;
              }

              if (parsed.content) {
                // Clear status once content starts streaming
                setCurrentStatus(null);
                fullContent += parsed.content;
                // Update message in real-time - preserve existing metadata
                setChatMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  newMessages[newMessages.length - 1] = {
                    ...lastMsg, // Preserve tokenUsage, contentCoverage, etc.
                    content: fullContent,
                    isLoading: true,
                  };
                  return newMessages;
                });
              } else if (parsed.error) {
                setCurrentStatus(null);
                setChatMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  newMessages[newMessages.length - 1] = {
                    ...lastMsg, // Preserve metadata
                    content: parsed.error,
                    isLoading: false,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              processLine(buffer);
            }
            // Mark as complete if not already - preserve metadata
            setChatMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.isLoading) {
                newMessages[newMessages.length - 1] = {
                  ...lastMsg, // Preserve tokenUsage, contentCoverage
                  content: fullContent || 'No response generated',
                  isLoading: false,
                };
              }
              return newMessages;
            });
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              processLine(line);
            }
          }
        }
      }
    } catch (error: any) {
      setCurrentStatus(null);
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: error.message || 'Sorry, I encountered an error. Please try again.',
          isLoading: false,
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setCurrentStatus(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Image;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return FileSpreadsheet;
    return FileText;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed top-10 right-0 w-[480px] h-[calc(100vh-64px)] bg-[#f8f9fa] border-l border-gray-200 flex flex-col z-[50] shadow-lg"
    >

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <div className="flex flex-col">
          <span className="font-medium text-[15px] text-gray-800">AI Summary</span>
          <span className="font-medium text-[12px] text-gray-500">Uploaded documents will not be used for AI training.</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPromptSettingsOpen(true)}
                  className="h-8 w-8 rounded-full hover:bg-gray-100 relative"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {/* New feature indicator */}
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Customize Prompt</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Vertex AI Not Configured Warning */}
          {isVertexConfigured === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-800 mb-1">Vertex AI Not Configured</h3>
                  <p className="text-xs text-amber-700 mb-3">
                    Please configure Google Vertex AI in your company settings to use AI Summary.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => {
                      const companyName = companyInfo?.name || '';
                      navigate(`/app/company/${encodeURIComponent(companyName)}/settings?tab=general&submenu=system`);
                    }}
                  >
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Go to Settings
                  </Button>
                </div>
              </div>
            </div>
          )}

          {chatMessages.length === 0 ? (
            /* Welcome State */
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-5 shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-lg font-medium text-gray-800 mb-2">Summarize your docs with AI</h2>
              <p className="text-sm text-gray-500 text-center mb-6 max-w-[280px]">
                {selectedDocIds.size > 0
                  ? `${selectedDocIds.size} document${selectedDocIds.size > 1 ? 's' : ''} selected. Ready to analyze.`
                  : 'Select documents using checkboxes to get AI-powered summaries and insights.'}
              </p>

              {selectedDocIds.size === 0 ? (
                /* No documents selected hint */
                <div className="w-full mb-6 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 text-center">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-1">
                    No documents selected
                  </p>
                  <p className="text-xs text-gray-400">
                    Use checkboxes on document cards or click <span className="text-blue-600 font-medium">+</span> below to select
                  </p>
                </div>
              ) : (
                /* Documents Selected - Show AI Summary Button */
                <div className="w-full space-y-4">
                  {/* Selected Documents List */}
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 font-medium">SELECTED DOCUMENTS</p>
                    </div>
                    <div className="max-h-[160px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1">
                      {Array.from(selectedDocIds).map(docId => {
                        const doc = allAvailableDocs.find(d => d.id === docId);
                        if (!doc) return null;
                        const isCurrentlyEmbedding = isEmbedding.has(doc.id);
                        const docEmbeddingStatus = embeddingStatus.get(doc.id);
                        const isIndexed = docEmbeddingStatus?.hasEmbeddings === true;
                        const embeddingError = embeddingErrors.get(doc.id);
                        return (
                          <div key={docId} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700 truncate max-w-[250px]">{doc.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isCurrentlyEmbedding ? (
                                <span className="text-xs text-blue-500 flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                </span>
                              ) : embeddingError ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[200px]">
                                      <p className="text-xs">{embeddingError}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : isIndexed ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                              )}
                              <button
                                onClick={() => onToggleDocSelection(docId)}
                                className="p-1 hover:bg-gray-200 rounded-full"
                              >
                                <X className="h-3 w-3 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Summary Button */}
                  {(() => {
                    // Check if any selected docs have embedding errors
                    const selectedDocsWithErrors = Array.from(selectedDocIds).filter(id => embeddingErrors.has(id));
                    const hasEmbeddingErrors = selectedDocsWithErrors.length > 0;

                    // Check if all selected docs have embeddings completed
                    const allDocsReady = Array.from(selectedDocIds).every(id => {
                      const status = embeddingStatus.get(id);
                      return status?.hasEmbeddings === true;
                    });

                    // Check if any selected docs are currently being embedded
                    const hasDocsEmbedding = Array.from(selectedDocIds).some(id => isEmbedding.has(id));

                    // Button is disabled until ALL selected docs have embeddings
                    const isDisabled = isLoading || hasDocsEmbedding || isVertexConfigured === false || hasEmbeddingErrors || !allDocsReady;

                    let buttonText = 'AI Summary';
                    if (hasDocsEmbedding) {
                      buttonText = 'Uploading...';
                    } else if (hasEmbeddingErrors) {
                      buttonText = `${selectedDocsWithErrors.length} doc(s) failed`;
                    } else if (!allDocsReady) {
                      buttonText = 'Preparing docs...';
                    }

                    return (
                      <Button
                        onClick={() => handleSubmit('Summarize these documents')}
                        disabled={isDisabled}
                        className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading || hasDocsEmbedding ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : hasEmbeddingErrors ? (
                          <AlertCircle className="h-5 w-5 mr-2" />
                        ) : (
                          <Sparkles className="h-5 w-5 mr-2" />
                        )}
                        {buttonText}
                      </Button>
                    );
                  })()}

                  {/* Status hint - shows error guidance when embedding fails */}
                  {embeddingErrors.size > 0 && Array.from(selectedDocIds).some(id => embeddingErrors.has(id)) ? (
                    <div className="text-xs text-red-500 text-center bg-red-50 p-2 rounded-lg">
                      Some documents failed to process. Try removing them or check if the files are valid PDFs/DOCs.
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center">
                      Select more documents using checkboxes or click + to add
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Chat Messages */
            <div className="space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-[#e3f2fd] text-gray-800 rounded-br-md'
                          : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {msg.isLoading && !msg.content ? (
                        <div className="flex flex-col gap-2">
                          {currentStatus && (
                            <div className="flex items-center gap-2">
                              <LoaderFive text={currentStatus} className="text-sm" />
                            </div>
                          )}
                          {!currentStatus && (
                             <div className="flex items-center gap-2">
                             <LoaderFive text="Generating..." className="text-sm" />
                           </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="text-[14px] leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-gray-800">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                            {msg.isLoading && (
                              <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                            )}
                          </div>
                          {/* Attached docs inside user message */}
                          {msg.role === 'user' && msg.attachedDocs && msg.attachedDocs.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {msg.attachedDocs.map(doc => (
                                <div
                                  key={doc.id}
                                  className="flex items-center gap-1.5 px-2 py-1 bg-white/60 rounded-md border border-blue-200"
                                >
                                  <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                  <span className="text-xs text-gray-700 max-w-[80px] truncate">{doc.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {msg.role === 'assistant' && !msg.isLoading && msg.content && (
                      <div className={`flex items-center mt-1.5 ml-1 ${(msg.tokenUsage || msg.contentCoverage) ? 'justify-between' : ''}`}>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(msg.content)}
                                  className="h-7 w-7 rounded-full hover:bg-gray-100"
                                >
                                  {copiedText === msg.content ? (
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-gray-400" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="z-[9999]">Copy</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {/* Token Usage & Content Coverage - show for each message with data */}
                        {(msg.tokenUsage || msg.contentCoverage) && (
                          <div className="flex items-center gap-3">
                            {/* Token Usage with detailed breakdown */}
                            {msg.tokenUsage && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5 cursor-help">
                                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                                        {/* Input tokens (blue) */}
                                        <div
                                          className="h-full bg-blue-500 transition-all"
                                          style={{ width: `${Math.min((msg.tokenUsage.input / 10000) * 100, 70)}%` }}
                                        />
                                        {/* Output tokens (green) */}
                                        <div
                                          className="h-full bg-green-500 transition-all"
                                          style={{ width: `${Math.min((msg.tokenUsage.output / 10000) * 100, 30)}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-400">
                                        {msg.tokenUsage.total > 1000 ? `${(msg.tokenUsage.total / 1000).toFixed(1)}k` : msg.tokenUsage.total} tokens
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="z-[9999]">
                                    <div className="text-xs space-y-1">
                                      <p className="font-medium mb-1">Token Usage</p>
                                      <div className="flex justify-between gap-4">
                                        <span className="flex items-center gap-1">
                                          <span className="w-2 h-2 bg-blue-500 rounded-sm"></span>
                                          Input
                                        </span>
                                        <span className="font-medium">{msg.tokenUsage.input.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="flex items-center gap-1">
                                          <span className="w-2 h-2 bg-green-500 rounded-sm"></span>
                                          Output
                                        </span>
                                        <span className="font-medium">{msg.tokenUsage.output.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between gap-4 pt-1 border-t border-gray-600">
                                        <span>Total</span>
                                        <span className="font-medium">{msg.tokenUsage.total.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {/* Content Coverage % */}
                            {msg.contentCoverage && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-gray-400 cursor-help">
                                      {Math.round(msg.contentCoverage.reduce((sum, c) => sum + c.coverage, 0) / msg.contentCoverage.length)}% content used
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs z-[9999]">
                                    <div className="text-xs space-y-1">
                                      <p className="font-medium mb-1">Content per doc:</p>
                                      {msg.contentCoverage.map((c, i) => (
                                        <div key={i} className="flex justify-between gap-4">
                                          <span className="truncate">{c.docName}</span>
                                          <span className="font-medium">{c.coverage}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Source Picker Dropdown */}
      {showSourcePicker && (
        <div className="border-t border-gray-200 bg-white max-h-[300px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Select sources</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSourcePicker(false)}
              className="h-7 text-xs"
            >
              Done
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {allAvailableDocs.map(doc => {
                const isCurrentlyEmbedding = isEmbedding.has(doc.id);
                const FileIcon = getFileIcon(doc.name);

                return (
                  <div
                    key={doc.id}
                    onClick={() => onToggleDocSelection(doc.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      selectedDocIds.has(doc.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedDocIds.has(doc.id)}
                      className={selectedDocIds.has(doc.id) ? 'border-blue-500 data-[state=checked]:bg-blue-500' : ''}
                    />
                    <FileIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{doc.name}</p>
                    </div>
                    {isCurrentlyEmbedding && (
                      <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-200">
        {/* Attached Documents - Show selected docs for next message */}
        {selectedDocIds.size > 0 && chatMessages.length > 0 && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {Array.from(selectedDocIds).map(docId => {
              const doc = allAvailableDocs.find(d => d.id === docId);
              if (!doc) return null;
              return (
                <div
                  key={docId}
                  className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-200 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600 max-w-[80px] truncate">{doc.name}</span>
                  <button
                    onClick={() => onToggleDocSelection(docId)}
                    className="p-0.5 hover:bg-gray-300 rounded-full"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Input Box */}
        <div className="relative bg-[#f1f3f4] rounded-3xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <div className="flex items-end gap-2 p-2">
            {/* Add Sources Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSourcePicker(!showSourcePicker)}
                    className={`h-9 w-9 rounded-full flex-shrink-0 ${showSourcePicker ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add sources</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Text Input */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chatMessages.length > 0 ? "Ask a follow-up question..." : "Ask about your documents..."}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-800 placeholder-gray-500 py-2 max-h-32"
              style={{ minHeight: '36px' }}
            />

            {/* Send Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSubmit()}
              disabled={!inputValue.trim() || isLoading}
              className={`h-9 w-9 rounded-full flex-shrink-0 transition-colors ${
                inputValue.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'text-gray-400 hover:bg-gray-200'
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          AI can make mistakes, so double-check it
        </p>
      </div>

      {/* Prompt Settings Drawer */}
      <PromptSettingsDrawer
        open={promptSettingsOpen}
        onOpenChange={setPromptSettingsOpen}
        companyId={companyId}
        activePromptId={activePromptId}
        onPromptChange={setActivePromptId}
      />
    </div>
  );
}
