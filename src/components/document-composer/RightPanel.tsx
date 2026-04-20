import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Users, MessageCircle, X, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentAIChatPanel } from './DocumentAIChatPanel';
import { DocumentChatPanel } from './DocumentChatPanel';
import { DocxCommentSidebar } from '@/components/review/DocxCommentSidebar';
import { DocxCommentHighlighter } from '@/components/review/DocxCommentHighlighter';
import { useDocxComments } from '@/hooks/useDocxComments';
import { DocumentTemplate } from '@/types/documentComposer';
import { useRegisterRightRail } from '@/context/RightRailContext';

export type RightPanelTab = 'ai' | 'team' | 'comments';

interface RightPanelProps {
  template: DocumentTemplate;
  companyId?: string;
  productId?: string;
  documentId?: string | null;
  /** Separate CI/source id for DOCX comment extraction (may differ from draft id). */
  docxDocumentId?: string | null;
  documentName?: string;
  editorInstanceRef?: React.RefObject<any>;
  editorContainerRef?: React.RefObject<HTMLDivElement | null>;
  onApplyContent: (html: string, sectionName?: string, mode?: 'insert' | 'replace') => void;
  /** Mobile/tablet: close entire panel (bottom sheet). Desktop: usually omitted. */
  onClose?: () => void;
  className?: string;
  /** When true, the embedded AI chat suppresses SOP @-mention suggestions. */
  disableSopMentions?: boolean;
}

const TAB_META: Record<RightPanelTab, { label: string; accent: string; bg: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  ai: { label: 'AI Assistant', accent: '#534AB7', bg: '#EEEDFE', icon: Sparkles },
  team: { label: 'User Chat', accent: '#0F6E56', bg: '#E1F5EE', icon: Users },
  comments: { label: 'Comments', accent: '#BA7517', bg: '#FFF4E0', icon: MessageCircle },
};

export function RightPanel({
  template,
  companyId,
  productId,
  documentId,
  docxDocumentId,
  documentName,
  editorInstanceRef,
  editorContainerRef,
  onApplyContent,
  onClose,
  className,
  disableSopMentions = false,
}: RightPanelProps) {
  // Shift global floating buttons (Prof. XyReg bot, Report-a-bug) left while this panel is mounted.
  useRegisterRightRail();

  const storageKey = useMemo(() => `xyreg.rightPanel.activeTab.${documentId ?? 'default'}`, [documentId]);
  const [activeTab, setActiveTab] = useState<RightPanelTab>('ai');

  // Resizable width: persisted, clamped to [280, 720].
  const widthStorageKey = 'xyreg.rightPanel.width';
  const [width, setWidth] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(widthStorageKey);
      const n = raw ? parseInt(raw, 10) : NaN;
      return Number.isFinite(n) ? Math.max(280, Math.min(720, n)) : 320;
    } catch { return 320; }
  });
  const isResizingRef = useRef(false);

  useEffect(() => {
    try { localStorage.setItem(widthStorageKey, String(width)); } catch { /* ignore */ }
  }, [width]);

  // Publish current rail width as a CSS var so global floating widgets
  // (Prof. XyReg bot, Report-a-bug) can shift to clear the panel regardless of resize.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--xy-right-rail-width', `${width}px`);
    return () => { root.style.removeProperty('--xy-right-rail-width'); };
  }, [width]);

  // Stronger ::selection color inside the draft editor so clicking a comment
  // draws attention to the quoted passage via a bright yellow selection.
  useEffect(() => {
    const styleId = 'xyreg-draft-selection-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #draft-editor-scroll-container ::selection {
        background-color: #FDE047 !important;
        color: #111827 !important;
      }
      #draft-editor-scroll-container ::-moz-selection {
        background-color: #FDE047 !important;
        color: #111827 !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Fetch DOCX comments for in-document persistent highlighting.
  const normalizedDocxId = (() => {
    const raw = docxDocumentId ?? documentId;
    if (!raw) return undefined;
    return raw.startsWith('template-') ? raw.replace('template-', '') : raw;
  })();
  const { threadedComments } = useDocxComments(normalizedDocxId);
  const flatComments = useMemo(() => {
    const out: any[] = [];
    for (const t of threadedComments) {
      out.push(t);
      if (t.replies) out.push(...t.replies);
    }
    return out;
  }, [threadedComments]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      // Handle is on LEFT edge: dragging left grows the panel.
      const next = Math.max(280, Math.min(720, startWidth - (ev.clientX - startX)));
      setWidth(next);
    };
    const onMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width]);

  // Scroll position persistence per-tab (per-session only)
  const scrollRefs: Record<RightPanelTab, React.RefObject<HTMLDivElement | null>> = {
    ai: useRef<HTMLDivElement | null>(null),
    team: useRef<HTMLDivElement | null>(null),
    comments: useRef<HTMLDivElement | null>(null),
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'ai' || stored === 'team' || stored === 'comments') {
        setActiveTab(stored);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  const handleTabClick = (tab: RightPanelTab) => {
    setActiveTab(tab);
    try { localStorage.setItem(storageKey, tab); } catch { /* ignore */ }
  };

  const activeMeta = TAB_META[activeTab];

  return (
    <div
      className={cn('flex flex-col bg-background border-l shrink-0 h-full relative', className)}
      style={{ width }}
    >
      {/* Left-edge resize handle with 6-dot grip */}
      <div
        className="absolute top-0 -left-[8px] w-4 h-full cursor-col-resize z-20 group flex items-center justify-center"
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize"
      >
        <div className="flex h-6 w-4 items-center justify-center rounded-sm border bg-border shadow-sm">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {/* Sticky tab bar — two tight rows: utility toolbar + underline-style tabs. */}
      <div className="sticky top-0 z-10 bg-background border-b">
        {/* Utility toolbar: active tab label + context actions (New chat, Close) */}
        <div className="flex items-center justify-between px-3 h-9 border-b bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: activeMeta.accent }}
            />
            <span className="text-[11px] font-semibold text-foreground truncate">
              {activeMeta.label}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center"
                title="Close panel"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs: icon + label with a colored underline on active */}
        <div className="flex items-stretch">
          {(Object.keys(TAB_META) as RightPanelTab[]).map((tab) => {
            const meta = TAB_META[tab];
            const Icon = meta.icon;
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 h-10 text-[12px] transition-colors',
                  isActive ? 'font-semibold' : 'font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
                style={{
                  color: isActive ? meta.accent : undefined,
                  borderBottom: isActive ? `2px solid ${meta.accent}` : '2px solid transparent',
                  marginBottom: '-1px',
                }}
                title={meta.label}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: isActive ? meta.accent : undefined }} />
                <span className="truncate">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content — render each container but hide inactive ones to preserve scroll position */}
      <div className="flex-1 min-h-0 relative">
        <div
          ref={scrollRefs.ai}
          className="absolute inset-0 overflow-hidden"
          style={{ display: activeTab === 'ai' ? 'block' : 'none' }}
        >
          <DocumentAIChatPanel
            embedded
            template={template}
            companyId={companyId}
            productId={productId}
            documentId={documentId}
            editorInstanceRef={editorInstanceRef}
            editorContainerRef={editorContainerRef}
            onApplyContent={onApplyContent}
            disableSopMentions={disableSopMentions}
          />
        </div>
        <div
          ref={scrollRefs.team}
          className="absolute inset-0 overflow-hidden"
          style={{ display: activeTab === 'team' ? 'block' : 'none' }}
        >
          <DocumentChatPanel
            embedded
            documentId={documentId}
            companyId={companyId}
            documentName={documentName}
          />
        </div>
        <div
          ref={scrollRefs.comments}
          className="absolute inset-0 overflow-hidden"
          style={{ display: activeTab === 'comments' ? 'block' : 'none' }}
        >
          {(() => {
            const rawId = docxDocumentId ?? documentId;
            if (!rawId) return null;
            const id = rawId.startsWith('template-') ? rawId.replace('template-', '') : rawId;
            return (
              <DocxCommentSidebar
                documentId={id}
                fullWidth
                onCommentClick={(comment) => {
                  const container = editorContainerRef?.current;
                  const quotedRaw = (comment?.quoted_text || '').trim();
                  if (!container || !quotedRaw) return;

                  // Normalize whitespace and search by longest substring that actually fits.
                  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
                  const quoted = normalize(quotedRaw);

                  // Build a flat text index of the editor content.
                  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
                  const textNodes: Text[] = [];
                  const nodeStarts: number[] = [];
                  let fullText = '';
                  let tn: Text | null;
                  while ((tn = walker.nextNode() as Text | null)) {
                    nodeStarts.push(fullText.length);
                    textNodes.push(tn);
                    fullText += tn.nodeValue || '';
                  }

                  const normalizedFull = normalize(fullText);
                  // Map every index in the normalized string back to an original-text index.
                  const normToOrig: number[] = [];
                  for (let i = 0; i < fullText.length; i++) {
                    const ch = fullText[i];
                    if (/\s/.test(ch)) {
                      if (i === 0 || !/\s/.test(fullText[i - 1])) normToOrig.push(i);
                    } else {
                      normToOrig.push(i);
                    }
                  }

                  // Try progressively shorter substrings so long multi-line quotes still match.
                  const tryLens = [quoted.length, 160, 120, 80, 60, 40].filter((n) => n > 0 && n <= quoted.length);
                  let startOrig = -1;
                  let endOrig = -1;
                  for (const len of tryLens) {
                    const needle = quoted.slice(0, len);
                    const idx = normalizedFull.indexOf(needle);
                    if (idx !== -1) {
                      startOrig = normToOrig[idx] ?? idx;
                      const lastNormIdx = idx + needle.length - 1;
                      endOrig = (normToOrig[lastNormIdx] ?? (startOrig + len - 1)) + 1;
                      break;
                    }
                  }
                  if (startOrig === -1 || endOrig === -1) return;

                  // Convert the flat offsets back to (textNode, offset) for Range.
                  let startNode: Text | null = null, startOffset = 0;
                  let endNode: Text | null = null, endOffset = 0;
                  for (let i = 0; i < textNodes.length; i++) {
                    const nStart = nodeStarts[i];
                    const nEnd = nStart + (textNodes[i].nodeValue?.length || 0);
                    if (!startNode && startOrig < nEnd) {
                      startNode = textNodes[i];
                      startOffset = startOrig - nStart;
                    }
                    if (endOrig <= nEnd) {
                      endNode = textNodes[i];
                      endOffset = endOrig - nStart;
                      break;
                    }
                  }
                  if (!startNode || !endNode) return;

                  let range: Range;
                  try {
                    range = document.createRange();
                    range.setStart(startNode, startOffset);
                    range.setEnd(endNode, endOffset);
                  } catch { return; }

                  // Scroll the matched text into view.
                  const scrollParent = document.getElementById('draft-editor-scroll-container');
                  const rect = range.getBoundingClientRect();
                  if (scrollParent && rect.height) {
                    const parentRect = scrollParent.getBoundingClientRect();
                    const offset = rect.top - parentRect.top + scrollParent.scrollTop - 100;
                    scrollParent.scrollTo({ top: offset, behavior: 'smooth' });
                  }

                  // Use the browser's native selection so the highlight is always visible
                  // regardless of TipTap/ProseMirror DOM reconciliation.
                  const sel = window.getSelection();
                  if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(range);
                  }
                }}
              />
            );
          })() || (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mb-2" style={{ color: '#BA7517', opacity: 0.5 }} />
              <p className="text-sm font-medium text-foreground">No document yet</p>
              <p className="text-xs mt-1">Save this draft to load extracted DOCX review comments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Persistent in-document DOCX comment highlights (yellow marks + 💬 badges). */}
      {editorContainerRef && flatComments.length > 0 && (
        <DocxCommentHighlighter
          containerRef={editorContainerRef as React.RefObject<HTMLElement | null>}
          comments={flatComments}
          showBadges={false}
        />
      )}
    </div>
  );
}
