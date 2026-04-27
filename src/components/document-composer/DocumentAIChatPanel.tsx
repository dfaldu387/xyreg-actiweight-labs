import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { showNoCreditDialog } from '@/context/AiCreditContext';
import { Send, Loader2, Sparkles, X, GripVertical, Settings2, FileInput, Wand2, Check, Replace, XCircle } from 'lucide-react';
import { LoaderFive } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { markdownToHtml } from '@/utils/markdownToHtml';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyApiKeys } from '@/hooks/useCompanyApiKeys';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useAuth } from '@/context/AuthContext';
import { useAdvisoryContext } from '@/hooks/useAdvisoryContext';
import { useDocumentNumberingContext } from '@/hooks/useDocumentNumberingContext';
import { fetchLiveCompanySettings } from '@/services/liveSettingsSnapshot';
import { fetchLiveDeviceSnapshot } from '@/services/liveDeviceSnapshot';
import { fetchLiveSopDocumentSnapshot, slugifyDocName } from '@/services/liveSopDocumentSnapshot';
import { toast } from 'sonner';
import { DocumentTemplate } from '@/types/documentComposer';
import { formatDistanceToNow } from 'date-fns';

type DocSectionStatus = 'pending' | 'accepted' | 'replaced' | 'rejected';

interface AttachedSpan {
  id: string;
  label: string;
  text: string;
  from: number;
  to: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  userName?: string;
  fromHistory?: boolean;
  /** Supabase row id in document_ai_sessions, used to persist section decisions later. */
  sessionId?: string;
  /** Per-section Accept/Replace/Reject decisions keyed by the doc-section name. */
  sectionDecisions?: Record<string, DocSectionStatus>;
  /** Snapshot of spans attached when this message was sent — used to resolve
      <span-rewrite index="N"> tags in the assistant's reply to exact ranges. */
  attachedSpans?: AttachedSpan[];
}

type SpanRewriteStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Renders a string splitting out `@mention` tokens and wrapping them in a
 * subtle chip. `variant` controls the chip styling so it reads well on both
 * the primary-colored user bubble and the white input overlay.
 */
function renderWithMentions(text: string, variant: 'onPrimary' | 'onLight' = 'onLight'): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(@[\w-]+)/g);
  const chipStyle: React.CSSProperties = variant === 'onPrimary'
    ? { background: 'rgba(255,255,255,0.22)', color: 'inherit' }
    : { background: '#EEEDFE', color: '#3F3892' };
  return parts.map((part, i) => {
    if (/^@[\w-]+$/.test(part)) {
      // No padding: any extra width would push subsequent glyphs out of sync
      // with the invisible textarea caret, causing cursor drift in the mirror overlay.
      return (
        <span
          key={i}
          className="rounded font-medium"
          style={chipStyle}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

interface DocumentAIChatPanelProps {
  template: DocumentTemplate;
  companyId?: string;
  productId?: string;
  documentId?: string | null;
  editorInstanceRef?: React.RefObject<any>;
  editorContainerRef?: React.RefObject<HTMLDivElement | null>;
  onApplyContent: (html: string, sectionName?: string, mode?: 'insert' | 'replace') => void;
  onClose?: () => void;
  width?: number;
  onWidthChange?: (width: number) => void;
  /** When true, renders for embedding in a tabbed panel — no own header, resize, or border. */
  embedded?: boolean;
  /** When true, suppresses the company SOP and @device mentions (e.g. for QMS Document Control > Documents tab, where no device is selected). */
  disableSopMentions?: boolean;
}

function getDocumentPlainText(template: DocumentTemplate): string {
  if (!template?.sections) return '';
  return [...template.sections]
    .sort((a, b) => a.order - b.order)
    .map(section => {
      const title = section.customTitle || section.title;
      const content = (Array.isArray(section.content) ? section.content : [])
        .map((item: any) => {
          const text = item.content || '';
          // Strip HTML tags for plain text
          return text.replace(/<[^>]*>/g, '').trim();
        })
        .filter(Boolean)
        .join('\n');
      return `## ${title}\n${content}`;
    })
    .join('\n\n');
}

/** Ordered inventory of this document's sections with "empty"/"filled" state for the AI. */
function buildSectionInventory(template: DocumentTemplate): { inventory: string; emptyTitles: string[] } {
  const sections = Array.isArray(template?.sections) ? [...template.sections] : [];
  sections.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
  const emptyTitles: string[] = [];
  const lines = sections.map((section: any) => {
    const title = section?.customTitle || section?.title || '';
    const body = (Array.isArray(section?.content) ? section.content : [])
      .map((item: any) => String(item?.content || '').replace(/<[^>]*>/g, '').trim())
      .filter(Boolean)
      .join('');
    const empty = body.length === 0;
    if (empty && title) emptyTitles.push(title);
    return `- ${title} [${empty ? 'EMPTY' : 'FILLED'}]`;
  });
  return { inventory: lines.join('\n'), emptyTitles };
}

/** Button + popover that lets the user paste an assistant reply into any document section. */
/** Extracts the AI's suggested target section from a response
 *  (a trailing `<suggest-section>Name</suggest-section>` token). */
function extractSuggestedSection(content: string): { target: string | null; cleaned: string } {
  const m = content.match(/<suggest-section>\s*([^<]+?)\s*<\/suggest-section>/i);
  if (!m) return { target: null, cleaned: content };
  const target = m[1].trim();
  const cleaned = content.replace(m[0], '').trimEnd();
  return { target, cleaned };
}

function PasteIntoSectionButton({
  content,
  suggestedSection,
  onApply,
}: {
  content: string;
  suggestedSection: string | null;
  onApply: (content: string, sectionName?: string) => void;
}) {
  const pastable = content.replace(/<doc-section\s+name="[^"]*">[\s\S]*?<\/doc-section>/g, '').trim();
  if (!pastable || !suggestedSection) return null;
  // Guard against short/question-only replies just in case the model forgot the rule.
  const plain = pastable.replace(/<[^>]*>/g, '').trim();
  if (plain.length < 40) return null;
  if (/[?？]\s*$/.test(plain)) return null;

  return (
    <button
      type="button"
      onClick={() => {
        onApply(pastable, suggestedSection);
        toast.success(`Pasted into "${suggestedSection}"`);
      }}
      className="text-[11px] font-medium flex items-center gap-1 px-2 py-1 rounded-md border transition-colors mt-2"
      style={{ borderColor: '#C7C2EE', color: '#3F3892', background: '#F5F4FD' }}
    >
      <FileInput className="w-3 h-3" />
      Paste into <span className="font-semibold">{suggestedSection}</span>
    </button>
  );
}

const AFFIRMATIVE_RE = /^(?:y|yes|yep|yeah|yup|ok|okay|sure|go ahead|do it|proceed|fill it|paste it|confirm(?:ed)?|please|yes please)\W*$/i;
// Phrases that indicate the user is asking the AI to draft content right away —
// an explicit draft request is itself consent to auto-paste the resulting doc-section.
const DRAFT_INTENT_RE = /\b(?:draft|fill|write|generate|compose|create|author|produce|populate)\b/i;

/** Parse AI response and render <doc-section> + <span-rewrite> blocks as interactive UI */
function RenderAIResponse({
  content,
  onApplyContent,
  editorContainerRef,
  editorInstanceRef,
  autoApply,
  sectionDecisions,
  onSectionDecision,
  attachedSpans,
}: {
  content: string;
  onApplyContent: (content: string, sectionName?: string, mode?: 'insert' | 'replace') => void;
  editorContainerRef?: React.RefObject<HTMLDivElement | null>;
  editorInstanceRef?: React.RefObject<any>;
  autoApply?: boolean;
  sectionDecisions?: Record<string, DocSectionStatus>;
  onSectionDecision?: (sectionName: string, next: DocSectionStatus) => void;
  attachedSpans?: AttachedSpan[];
}) {
  // Combined tokenizer: <doc-section> OR <span-rewrite>. Capture groups:
  //  [1]=docSection name, [2]=docSection body
  //  [3]=span index,      [4]=span body
  const combined = /<doc-section\s+name="([^"]*)">([\s\S]*?)<\/doc-section>|<span-rewrite\s+index="(\d+)">([\s\S]*?)<\/span-rewrite>/g;
  const parts: Array<
    | { type: 'text'; text: string }
    | { type: 'section'; text: string; sectionName: string }
    | { type: 'span'; text: string; spanIndex: number }
  > = [];
  let lastIndex = 0;
  let match;

  while ((match = combined.exec(content)) !== null) {
    // Text before the tag
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) parts.push({ type: 'text', text });
    }
    if (match[1] !== undefined) {
      parts.push({ type: 'section', text: (match[2] || '').trim(), sectionName: match[1] });
    } else if (match[3] !== undefined) {
      parts.push({ type: 'span', text: (match[4] || '').trim(), spanIndex: parseInt(match[3], 10) });
    }
    lastIndex = match.index + match[0].length;
  }
  // Remaining text after last tag — but also catch an UNCLOSED trailing
  // <doc-section …> (e.g. truncated streams) so the raw tag never leaks into
  // the chat bubble. Everything after the opener is treated as the section body.
  if (lastIndex < content.length) {
    const tail = content.slice(lastIndex);
    const unclosed = tail.match(/<doc-section\s+name="([^"]*)">([\s\S]*)$/);
    if (unclosed) {
      const openerIdx = unclosed.index ?? 0;
      const leading = tail.slice(0, openerIdx).trim();
      if (leading) parts.push({ type: 'text', text: leading });
      const body = (unclosed[2] ?? '').trim();
      if (body || unclosed[1]) {
        parts.push({ type: 'section', text: body, sectionName: unclosed[1] });
      }
    } else {
      const text = tail.trim();
      if (text) parts.push({ type: 'text', text });
    }
  }

  // If no doc-section tags found, render as plain markdown
  if (parts.length === 0) {
    parts.push({ type: 'text', text: content });
  }

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return (
            <div key={i} className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-li:my-0.5">
              <ReactMarkdown>{part.text}</ReactMarkdown>
            </div>
          );
        }
        if (part.type === 'span') {
          const span = attachedSpans?.[part.spanIndex];
          return (
            <SpanRewriteBlock
              key={i}
              spanIndex={part.spanIndex}
              originalSpan={span}
              replacement={part.text}
              editorInstanceRef={editorInstanceRef}
            />
          );
        }
        // Interactive doc-section block
        const secName = part.sectionName || 'Section';
        return (
          <DocSectionBlock
            key={i}
            sectionName={secName}
            content={part.text}
            onApply={onApplyContent}
            editorContainerRef={editorContainerRef}
            autoApply={autoApply}
            initialStatus={sectionDecisions?.[secName]}
            onStatusChange={onSectionDecision}
          />
        );
      })}
    </div>
  );
}

/** Read a section's current body text from the live editor DOM, joined by newlines. */
function readCurrentSectionText(
  editorContainer: HTMLDivElement | null | undefined,
  sectionName: string,
): string {
  if (!editorContainer) return '';
  const headings = editorContainer.querySelectorAll('h2');
  for (const h2 of Array.from(headings)) {
    const headingText = h2.textContent?.trim().replace(/^\d+\.\d+\s*/, '') || '';
    if (headingText.toLowerCase() !== sectionName.toLowerCase()) continue;
    const parts: string[] = [];
    let el = h2.nextElementSibling;
    while (el && el.tagName !== 'H2') {
      const text = (el.textContent || '').trim();
      if (text) parts.push(text);
      el = el.nextElementSibling;
    }
    return parts.join('\n');
  }
  return '';
}

/** LCS-based line diff — returns an ordered list of same/add/del entries. */
type DiffLine = { type: 'same' | 'add' | 'del'; text: string };
function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i] });
      i++;
    } else {
      out.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < m) out.push({ type: 'del', text: a[i++] });
  while (j < n) out.push({ type: 'add', text: b[j++] });
  return out;
}

/** Interactive diff card: old (current) vs new (AI-proposed) with Accept / Replace / Reject.
 *
/** Interactive card for a <span-rewrite> block — span-precise editor replacement. */
function SpanRewriteBlock({
  spanIndex,
  originalSpan,
  replacement,
  editorInstanceRef,
}: {
  spanIndex: number;
  originalSpan?: AttachedSpan;
  replacement: string;
  editorInstanceRef?: React.RefObject<any>;
}) {
  const [status, setStatus] = React.useState<SpanRewriteStatus>('pending');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (!originalSpan) {
    return (
      <div className="my-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        AI proposed a rewrite for span #{spanIndex}, but the original selection is no longer available. Re-add the selection to the chat and try again.
      </div>
    );
  }

  const handleAccept = () => {
    const editor = editorInstanceRef?.current;
    if (!editor) {
      setErrorMsg('Editor not available');
      return;
    }
    const { from, to, text } = originalSpan;
    const docSize = editor.state.doc.content.size;
    if (from >= docSize || to > docSize || to <= from) {
      setErrorMsg('The original text position is no longer valid. The document may have changed.');
      return;
    }
    // Guard against document drift — if the text at from/to has changed, don't
    // blindly overwrite. Normalize whitespace for the comparison.
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
    const currentText = editor.state.doc.textBetween(from, to, '\n');
    if (norm(currentText) !== norm(text)) {
      setErrorMsg('The original text has changed. Re-add the selection to the chat and try again.');
      return;
    }
    try {
      editor
        .chain()
        .focus()
        .insertContentAt({ from, to }, markdownToHtml(replacement))
        .run();
      setStatus('accepted');
      toast.success('Applied AI edit');
    } catch (e) {
      console.error('[SpanRewriteBlock] insertContentAt failed:', e);
      setErrorMsg('Could not apply edit');
    }
  };

  const handleReject = () => setStatus('rejected');

  const badge =
    status === 'accepted' ? { text: 'Applied', cls: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40' }
    : status === 'rejected' ? { text: 'Rejected', cls: 'text-slate-600 bg-slate-200 dark:text-slate-300 dark:bg-slate-800' }
    : null;

  return (
    <div className="my-2 rounded-lg border border-indigo-300 overflow-hidden dark:border-indigo-700">
      <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 truncate">
            Inline edit
          </span>
          <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">proposed rewrite</span>
        </div>
        {badge && (
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', badge.cls)}>
            {badge.text}
          </span>
        )}
      </div>

      {status !== 'rejected' && (
        <div className="bg-white dark:bg-slate-950 text-[12px] max-h-[280px] overflow-y-auto">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Original</div>
            <div className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 line-through opacity-70">
              {originalSpan.text}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Proposed</div>
            <div
              className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(replacement) }}
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="px-3 py-2 text-[11px] text-destructive bg-destructive/5 border-t border-destructive/30">
          {errorMsg}
        </div>
      )}

      {status === 'pending' && (
        <div className="flex items-center justify-end gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReject}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <XCircle className="w-3 h-3" />
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Check className="w-3 h-3" />
            Accept
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Fully CONTROLLED: the `status` comes from the parent via `initialStatus`.
 * We deliberately avoid a local useState copy — having two sources of truth
 * caused the Accept/Reject/Replace buttons to stay visible after click in
 * some render sequences (the parent re-render would race the local update).
 */
function DocSectionBlock({
  sectionName,
  content,
  onApply,
  editorContainerRef,
  autoApply,
  initialStatus,
  onStatusChange,
}: {
  sectionName: string;
  content: string;
  onApply: (content: string, sectionName?: string, mode?: 'insert' | 'replace') => void;
  editorContainerRef?: React.RefObject<HTMLDivElement | null>;
  autoApply?: boolean;
  /** Current status, owned by the parent. `undefined` → treat as 'pending'. */
  initialStatus?: DocSectionStatus;
  /** Parent callback that commits the new status to its state. Required for the buttons to hide on click. */
  onStatusChange?: (sectionName: string, next: DocSectionStatus) => void;
}) {
  const status: DocSectionStatus = initialStatus ?? 'pending';

  const currentText = useMemo(
    () => readCurrentSectionText(editorContainerRef?.current, sectionName),
    // Recompute when section or content changes — DOM is read via ref at render time.
    [editorContainerRef, sectionName, content],
  );
  const proposedText = useMemo(() => content.replace(/<[^>]*>/g, '').trim(), [content]);
  const diff = useMemo(() => diffLines(currentText, proposedText), [currentText, proposedText]);
  const hasOld = currentText.trim().length > 0;

  const autoAppliedRef = useRef(false);
  useEffect(() => {
    if (autoApply && status === 'pending' && !autoAppliedRef.current) {
      autoAppliedRef.current = true;
      onApply(content, sectionName, 'insert');
      onStatusChange?.(sectionName, 'accepted');
      toast.success(`Content auto-inserted into "${sectionName}"`);
    }
  }, [autoApply, status, content, sectionName, onApply, onStatusChange]);

  const handleAccept = () => {
    onApply(content, sectionName, 'insert');
    onStatusChange?.(sectionName, 'accepted');
    toast.success(`Content inserted into "${sectionName}"`);
  };
  const handleReplace = () => {
    onApply(content, sectionName, 'replace');
    onStatusChange?.(sectionName, 'replaced');
    toast.success(`"${sectionName}" replaced with new content`);
  };
  const handleReject = () => {
    onStatusChange?.(sectionName, 'rejected');
  };

  const statusLabel =
    status === 'accepted' ? 'Inserted'
    : status === 'replaced' ? 'Replaced'
    : status === 'rejected' ? 'Rejected'
    : null;

  return (
    <div className={cn(
      'rounded-lg border my-2 overflow-hidden',
      status === 'pending' ? 'border-indigo-300 dark:border-indigo-700' : 'border-slate-300 dark:border-slate-700',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 truncate">{sectionName}</span>
          <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70">proposed change</span>
        </div>
        {statusLabel && (
          <span className={cn(
            'text-[10px] font-medium px-2 py-0.5 rounded-full',
            status === 'accepted' && 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40',
            status === 'replaced' && 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40',
            status === 'rejected' && 'text-slate-600 bg-slate-200 dark:text-slate-300 dark:bg-slate-800',
          )}>
            {statusLabel}
          </span>
        )}
      </div>

      {/* Diff body */}
      {status !== 'rejected' && (
        <div className="bg-white dark:bg-slate-950 font-mono text-[12px] leading-[1.5] max-h-[320px] overflow-y-auto">
          {diff.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-slate-500 italic">No changes.</div>
          ) : (
            diff.map((line, idx) => {
              const bg =
                line.type === 'add' ? 'bg-green-50 dark:bg-green-950/40'
                : line.type === 'del' ? 'bg-red-50 dark:bg-red-950/40'
                : '';
              const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' ';
              const prefixColor =
                line.type === 'add' ? 'text-green-700 dark:text-green-400'
                : line.type === 'del' ? 'text-red-700 dark:text-red-400'
                : 'text-slate-400';
              const textColor =
                line.type === 'add' ? 'text-green-900 dark:text-green-200'
                : line.type === 'del' ? 'text-red-900 dark:text-red-200 line-through'
                : 'text-slate-700 dark:text-slate-300';
              return (
                <div key={idx} className={cn('flex items-start gap-2 px-3 py-0.5', bg)}>
                  <span className={cn('w-3 shrink-0 text-center select-none', prefixColor)}>{prefix}</span>
                  <span className={cn('whitespace-pre-wrap break-words', textColor)}>
                    {line.text || '\u00A0'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Actions */}
      {status === 'pending' && (
        <div className="flex items-center justify-end gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReject}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <XCircle className="w-3 h-3" />
            Reject
          </button>
          <button
            type="button"
            onClick={handleReplace}
            disabled={!hasOld}
            title={hasOld ? 'Overwrite the existing section content' : 'Section is empty — use Accept'}
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors',
              hasOld
                ? 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/40'
                : 'border-slate-200 text-slate-400 cursor-not-allowed dark:border-slate-800 dark:text-slate-600',
            )}
          >
            <Replace className="w-3 h-3" />
            Replace
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Check className="w-3 h-3" />
            Accept
          </button>
        </div>
      )}
    </div>
  );
}

export function DocumentAIChatPanel({
  template,
  companyId,
  productId,
  documentId,
  editorInstanceRef,
  editorContainerRef: editorContainerRefProp,
  onApplyContent,
  onClose,
  width,
  onWidthChange,
  embedded = false,
  disableSopMentions = false,
}: DocumentAIChatPanelProps) {
  const { data: advisoryContext } = useAdvisoryContext(companyId, true);
  const numberingContext = useDocumentNumberingContext(documentId, companyId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const [sopMentions, setSopMentions] = useState<Array<{ value: string; label: string; hint: string; id: string; name: string; document_type?: string }>>([]);

  // Load ALL company documents (SOPs, Clinical Evaluation, Technical File, etc.)
  // so any company-level doc can be @mentioned as AI context — not just SOPs.
  useEffect(() => {
    if (!companyId || disableSopMentions) {
      setSopMentions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_reference, status, document_type')
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document')
        .order('name');
      if (cancelled) return;
      if (error || !data) {
        setSopMentions([]);
        return;
      }
      const seen = new Set<string>();
      const items = [] as Array<{ value: string; label: string; hint: string; id: string; name: string; document_type?: string }>;
      for (const r of data as any[]) {
        const slug = slugifyDocName(r.name || '');
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        const docType = r.document_type || 'Document';
        items.push({
          value: slug,
          label: r.name,
          hint: `${docType}${r.document_reference ? ` · ${r.document_reference}` : ''}${r.status ? ` · ${r.status}` : ''}`,
          id: r.id,
          name: r.name,
          document_type: docType,
        });
      }
      setSopMentions(items);
    })();
    return () => { cancelled = true; };
  }, [companyId, disableSopMentions]);

  // Listen for a global "start new chat" event dispatched by RightPanel's New button.
  useEffect(() => {
    const handler = () => {
      setMessages([]);
      setInput('');
    };
    window.addEventListener('xyreg:ai-new-chat', handler);
    return () => window.removeEventListener('xyreg:ai-new-chat', handler);
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Load custom prompt from document metadata
  useEffect(() => {
    if (!documentId) return;
    const load = async () => {
      const { data } = await supabase
        .from('document_studio_templates')
        .select('metadata')
        .eq('id', documentId)
        .maybeSingle();
      const meta = data?.metadata as Record<string, any> | null;
      if (meta?.ai_custom_prompt) {
        setCustomPrompt(meta.ai_custom_prompt);
      }
    };
    load();
  }, [documentId]);

  // Save custom prompt to document metadata
  const saveCustomPrompt = useCallback(async (prompt: string) => {
    if (!documentId) return;
    const { data } = await supabase
      .from('document_studio_templates')
      .select('metadata')
      .eq('id', documentId)
      .maybeSingle();
    const existing = (data?.metadata as Record<string, any>) || {};
    const metadata = { ...existing, ai_custom_prompt: prompt || null };
    await supabase
      .from('document_studio_templates')
      .update({ metadata })
      .eq('id', documentId);
    toast.success('AI settings saved');
  }, [documentId]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isResizingRef = useRef(false);
  const loadedDocIdRef = useRef<string | null>(null);

  // Cursor-style "Add to Chat" context chips. Each chip holds a selection
  // captured from the editor bubble menu — including from/to positions so
  // the applier can do span-precise rewrites via editor.insertContentAt.
  const [attachedContexts, setAttachedContexts] = useState<
    { id: string; label: string; text: string; from: number; to: number }[]
  >([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ text?: string; label?: string; from?: number; to?: number }>).detail;
      const text = (detail?.text || '').trim();
      if (!text) return;
      if (typeof detail?.from !== 'number' || typeof detail?.to !== 'number') return;
      const firstLine = text.split('\n')[0].trim();
      const label = (detail?.label || firstLine).slice(0, 60) + (firstLine.length > 60 ? '…' : '');
      setAttachedContexts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          label,
          text,
          from: detail.from,
          to: detail.to,
        },
      ]);
      setTimeout(() => textareaRef.current?.focus(), 0);
    };
    window.addEventListener('xyreg:ai-chat-quote', handler as EventListener);
    return () => window.removeEventListener('xyreg:ai-chat-quote', handler as EventListener);
  }, []);

  const removeAttachedContext = useCallback((id: string) => {
    setAttachedContexts((prev) => prev.filter((c) => c.id !== id));
  }, []);
  const { activeCompanyRole } = useCompanyRole();
  const { user } = useAuth();
  const { getApiKey, apiKeys: companyApiKeys } = useCompanyApiKeys(companyId);

  const userName = useMemo(() => {
    if (!user) return 'User';
    const first = user.user_metadata?.first_name || '';
    const last = user.user_metadata?.last_name || '';
    const full = [first, last].filter(Boolean).join(' ');
    return full || user.email?.split('@')[0] || 'User';
  }, [user]);

  // Load chat history from document_ai_sessions when document changes
  useEffect(() => {
    if (!documentId || !companyId || !user?.id || loadedDocIdRef.current === documentId) return;
    loadedDocIdRef.current = documentId;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('document_ai_sessions')
          .select('id, query_text, ai_response, created_at, response_metadata')
          .eq('document_id', documentId)
          .eq('session_type', 'chat')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading document chat history:', error);
          return;
        }

        // Only load last 5 sessions to keep chat clean
        const recentData = (data || []).slice(-5);
        const loaded: Message[] = [];
        for (const row of recentData) {
          const meta = row.response_metadata as any;
          const priorDecisions = (meta?.sectionDecisions ?? {}) as Record<string, DocSectionStatus>;
          if (row.query_text) {
            loaded.push({ role: 'user', content: row.query_text, timestamp: row.created_at, userName: meta?.userName || 'User', fromHistory: true });
          }
          try {
            const parsed = JSON.parse(row.ai_response);
            const answer = parsed.answer || parsed.rawResponse || parsed.content || '';
            if (answer) {
              loaded.push({ role: 'assistant', content: answer, timestamp: row.created_at, userName: 'XyReg Assistant', fromHistory: true, sessionId: row.id, sectionDecisions: priorDecisions });
            }
          } catch {
            if (row.ai_response) {
              loaded.push({ role: 'assistant', content: row.ai_response, timestamp: row.created_at, userName: 'XyReg Assistant', fromHistory: true, sessionId: row.id, sectionDecisions: priorDecisions });
            }
          }
        }
        if (loaded.length > 0) {
          setMessages(loaded);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [documentId, companyId, user?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onWidthChange) return;
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = width ?? 800;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(280, Math.min(1000, startWidth + (ev.clientX - startX)));
      onWidthChange?.(newWidth);
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
  }, [width, onWidthChange]);

  const handleSend = useCallback(async (textOverride?: string, displayTextOverride?: string) => {
    const rawEffective = (textOverride ?? input).trim();
    // Allow sending when the user has only attached context chips but no typed
    // text (treat as "tell me about this").
    if (!rawEffective && attachedContexts.length === 0) return;
    if (isLoading) return;
    // When the user has attached specific text spans, instruct the AI to
    // scope any edit proposals to EXACTLY those spans using <span-rewrite>
    // blocks — not <doc-section>. This prevents whole-section overwrites.
    const contextBlock = attachedContexts.length
      ? [
          'The user has attached specific text spans from the document. Each span is numbered starting from 0.',
          'If the user is asking you to edit, rewrite, or modify these spans, respond using ONE <span-rewrite index="N">...</span-rewrite> block PER span you are rewriting, where N matches the span index below. Put ONLY the replacement text (HTML allowed) inside the tag — do not include the original.',
          'Do NOT emit <doc-section> blocks in this case. Do NOT rewrite content outside the attached spans.',
          'If the user is asking a question about the spans (not an edit), respond in plain markdown as usual — no <span-rewrite> tags.',
          '',
          ...attachedContexts.map((c, i) => {
            const quoted = c.text.split('\n').map((l) => `> ${l}`).join('\n');
            return `Span ${i}:\n${quoted}`;
          }),
        ].join('\n')
      : '';
    const effective = [contextBlock, rawEffective].filter(Boolean).join('\n\n')
      || rawEffective;
    // `display` = what the user sees in their own chat bubble. We intentionally
    // DO NOT include the AI-only span-rewrite instructions here; those are
    // wire-only. The attached spans are surfaced separately as pills above
    // the bubble (see msg.attachedSpans in the render).
    const display = (displayTextOverride ?? rawEffective).trim() || rawEffective || '(no message)';

    // Check API key
    if (!companyApiKeys.isLoading && !getApiKey('google_vertex' as any)) {
      const userMsg: Message = { role: 'user', content: display };
      setMessages(prev => [...prev, userMsg, {
        role: 'assistant',
        content: '**Google Vertex AI is not configured.**\n\nTo use the AI Assistant, please add a Google Vertex AI service account key:\n\n1. Go to **Company Settings > API Keys**\n2. Add a key with type **google_vertex**\n3. Paste your Google Cloud service account JSON\n\nOnce configured, come back and try again.'
      }]);
      setInput('');
      setAttachedContexts([]);
      return;
    }

    let text = effective;

    const attachedSpansSnapshot: AttachedSpan[] = attachedContexts.map((c) => ({ ...c }));
    const userMsg: Message = {
      role: 'user',
      content: display,
      timestamp: new Date().toISOString(),
      userName,
      attachedSpans: attachedSpansSnapshot.length ? attachedSpansSnapshot : undefined,
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setAttachedContexts([]);
    setIsLoading(true);

    try {

      // Build document-aware system prompt — read live content from editor if available
      const liveText = editorInstanceRef?.current?.getText?.() || '';
      const docText = (liveText || getDocumentPlainText(template)).slice(0, 15000);
      const { inventory: sectionInventory, emptyTitles } = buildSectionInventory(template);

      // If the user mentioned @settings, fetch a fresh live snapshot for this turn
      let liveSettingsBlock = '';
      if (/\B@settings?\b/i.test(effective) && companyId) {
        liveSettingsBlock = await fetchLiveCompanySettings(companyId);
      }

      // If the user mentioned @device, fetch the currently selected device
      let liveDeviceBlock = '';
      if (/\B@device\b/i.test(effective)) {
        if (productId) {
          liveDeviceBlock = await fetchLiveDeviceSnapshot(productId);
        } else {
          liveDeviceBlock = '--- CURRENT DEVICE CONTEXT ---\nNo device is currently selected for this draft. Tell the user to select a device/product before asking device-specific questions.\n--- END ---';
        }
      }

      // Pick up any @<slug> mentions that match company documents and fetch their details
      let liveSopBlock = '';
      if (companyId && sopMentions.length > 0) {
        const tokens = Array.from(effective.matchAll(/(?:^|\s)@([\w-]+)/g)).map(m => m[1].toLowerCase());
        const matchedIds = sopMentions.filter(s => tokens.includes(s.value)).map(s => s.id);
        if (matchedIds.length > 0) {
          liveSopBlock = await fetchLiveSopDocumentSnapshot(companyId, matchedIds);
        }
      }

      // Auto-inject the draft's source template (the canonical company SOP it
      // was spawned from) so the model has source material to draft against —
      // even when the user doesn't remember to @mention the SOP. Skip when
      // the user already @mentioned it (to avoid duplicate content).
      let sourceTemplateBlock = '';
      if (companyId && template?.id && !disableSopMentions) {
        const alreadyMentioned = sopMentions
          .filter(s => s.id === template.id)
          .some(s => new RegExp(`(?:^|\\s)@${s.value}\\b`, 'i').test(effective));
        if (!alreadyMentioned) {
          try {
            const snapshot = await fetchLiveSopDocumentSnapshot(companyId, [template.id]);
            if (snapshot) {
              sourceTemplateBlock = snapshot
                .replace('--- REFERENCED COMPANY SOP DOCUMENT(S) (LIVE) ---', '--- SOURCE TEMPLATE FOR THIS DRAFT (LIVE) ---')
                .replace('--- END REFERENCED SOP DOCUMENT(S) ---', '--- END SOURCE TEMPLATE ---');
            }
          } catch (e) {
            console.warn('[DocumentAIChatPanel] source template fetch failed', e);
          }
        }
      }
      const systemPrompt = `You are XyReg Assistant. You help users complete their medical device regulatory documents in XyReg's Document Studio.

Document: "${template.name || 'Untitled'}" (${template.type || 'Document'})
Company: "${activeCompanyRole?.companyName || 'Unknown'}"

Document content:
---
${docText}
---

Section inventory (use EXACT titles when emitting doc-section blocks):
${sectionInventory || '(no sections)'}
Empty sections: ${emptyTitles.length > 0 ? emptyTitles.join(', ') : '(none — all sections have content)'}
${advisoryContext ? `\n${advisoryContext}\n` : ''}${numberingContext ? `\n${numberingContext}\n` : ''}${liveSettingsBlock ? `\n${liveSettingsBlock}\nThe user referenced @settings — prioritize this LIVE snapshot over any stale data above.\n` : ''}${liveDeviceBlock ? `\n${liveDeviceBlock}\nThe user referenced @device — ground every device-specific answer in this snapshot only.\n` : ''}${liveSopBlock ? `\n${liveSopBlock}\nThe user referenced specific document(s) by @mention — ground answers about those documents strictly in the snapshot above.\n` : ''}${sourceTemplateBlock ? `\n${sourceTemplateBlock}\nThis is the CANONICAL SOURCE TEMPLATE this draft was spawned from. When the user asks to draft/fill a section, use THIS template's content as the primary source material — preserve its scope, terminology, references, and regulatory framing. Do NOT invent generic boilerplate (e.g. generic "Quality Management Plan" wording) when the source template provides specific content for that section.\n` : ''}
Help the user complete this document one section at a time.

FORMAT RULE: ONLY when generating NEW content that should be inserted into an empty section, wrap it in:
<doc-section name="Section Name">
new content here
</doc-section>

CRITICAL: Every <doc-section> opener MUST have a matching </doc-section> closer. Never end a response mid-section — always close the tag before stopping. If you are drafting multiple sections, emit each <doc-section>…</doc-section> block in full, one after another.

Do NOT use doc-section tags when:
- Reading, summarizing, or explaining existing content
- Answering questions about the document
- Listing section names
- The section already has content

Only use doc-section when the user explicitly asks to fill, write, or generate content for a section.

When the user says "fill the X section", "draft content for X", or any request clearly asking for drafted content:
- If a section matching X exists in the document, produce <doc-section name="<the exact section title>"> with real content IMMEDIATELY. Do not ask which section — use the match.
- If X does NOT match any section title, pick the single closest existing section by semantic meaning and use that in the doc-section tag. Do not dump the full section list back to the user.
- NEVER answer "which section would you like to fill?" — always pick one and draft.
- NEVER ask "Would you like me to fill X?" or any confirmation question — just draft and return the doc-section block. The user already asked; that IS the confirmation. If you misjudge, the user will click a different option.
- NEVER output a question-back as the response when the user asks for content — always produce a doc-section block.

MENTION-DRIVEN AUTO-FILL (highest priority):
When the user references another document with @<slug> AND asks to "generate", "use the context", "apply it", "fill from this", "take context and generate", or any wording that implies authoring content informed by that reference — WITHOUT naming a target section:
- Do NOT ask which section. Infer target sections automatically.
- Treat the referenced SOP as BACKGROUND CONTEXT / SOURCE MATERIAL for the current document. You are NOT copying its sections over 1-for-1; you are drafting content for the CURRENT document's sections, informed by the referenced SOP plus your regulatory domain knowledge.
- Target EVERY section in the Section inventory — both [EMPTY] and [FILLED] ones. For [FILLED] sections, draft an improved/aligned version: the user will see a diff with the existing content and can choose Accept, Replace, or Reject. Do NOT skip a section just because it has existing content; the downstream UI lets the user decide.
- For each section, draft real, section-appropriate content for the CURRENT document's type (not the referenced doc's type). Use the referenced SOP's data (scope, device context, regulatory themes, terminology, references, responsibilities, etc.) as input where it's relevant; otherwise fall back to standard regulatory content for that section.
- Emit ONE <doc-section name="<exact title>"> block per section, in the order they appear in the inventory. Use the EXACT section title (case-sensitive) from the inventory in the name attribute.
- Start with a short one-sentence lead-in naming the sections you drafted, e.g. "Drafted all sections using the Clinical Evaluation SOP as context — review each diff to Accept, Replace, or Reject." No questions, no offers, no confirmations.
- Do NOT skip a section just because the referenced SOP doesn't literally contain matching material — draft sensible content for that section using the reference where it helps and domain knowledge where it doesn't.
- Only skip the whole operation if the Section inventory is empty (which should never happen on a real document).

UPDATE-WITH-REFERENCE (targeted update of ONE section using a mentioned doc):
Triggered when the user names/implies a SINGLE target section AND references @<slug>, e.g. "update scope refer @clinical-evaluation", "rewrite Purpose using @design-and-development", "revise References against @risk-management".
Goal: produce a MATERIALLY DIFFERENT section informed by the referenced document — NOT a paraphrase of the existing content.
- Identify the one target section from the user's wording. Use the EXACT inventory title in the <doc-section name="…"> attribute.
- The output MUST visibly integrate concrete material from the referenced document. This means at least TWO of the following are folded into the drafted section (pulled from the referenced doc's snapshot):
   • Specific scope/applicability language (devices, phases, lifecycle stages, markets, classes) taken from the referenced doc.
   • Standards, regulations, or guidance documents cited in the referenced doc (e.g. ISO 14971, ISO 14155, MDR 2017/745, MEDDEV 2.7/1) — by their exact identifier.
   • Named procedures, inputs, outputs, responsibilities, roles, or records defined in the referenced doc.
   • Terminology, abbreviations, or definitions unique to the referenced doc.
- If the existing section already states a concept, do NOT just reword it — ADD substance from the referenced doc (new clauses, bridging sentences explaining how this section's activity feeds / consumes the referenced doc's outputs).
- Do NOT merely rearrange or lightly paraphrase existing content. A diff consisting mostly of same-meaning rewrites is NOT acceptable — the new version must add or replace with concrete, citable substance.
- If the referenced document's snapshot is empty or clearly thin (no standards, no procedures, no definitions you can use), DO NOT guess or fabricate. Instead, emit a single-sentence reply: "The @<slug> document has no substantive content to integrate — save content in @<slug> first, or ask me to update <section> using domain knowledge." Do not emit a <doc-section> block in that case.
- One <doc-section> block only. No lead-in beyond a brief sentence naming what you integrated, e.g. "Updated Scope to fold in Clinical Evaluation's applicability to clinical evidence phases and MEDDEV 2.7/1 alignment."

SECTION SUGGESTION for pastable summaries/answers:
- When your response is NOT wrapped in doc-section but contains text the user could reasonably paste into an existing document section (e.g. a summary, a draft paragraph, a definitions list), append a SINGLE token on the very last line of your reply:
  <suggest-section>EXACT SECTION TITLE</suggest-section>
- The SECTION TITLE must be one of the document's actual section titles — pick the best semantic match from the list. Never invent a new name.
- Do not add <suggest-section> when the reply is a question, a one-line clarification, a greeting, or otherwise not pastable.
- Output nothing after the <suggest-section> tag.

CONTEXT MENTIONS (@settings / @device / @<sop-name>):
- Mention blocks are injected ONLY when the user types them in the CURRENT message.
- For THIS turn, @settings is ${liveSettingsBlock ? 'PRESENT' : 'NOT present'}, @device is ${liveDeviceBlock ? 'PRESENT' : 'NOT present'}, specific SOP snapshot is ${liveSopBlock ? 'PRESENT' : 'NOT present'}.
- When a mention block IS present: it is a LIVE, just-fetched snapshot from the database. It OVERRIDES any values you may have mentioned in earlier turns. If your prior answer said a field was X and the current snapshot says Y, answer Y — the data was edited. Never prefer chat history over the current snapshot.
- When a mention is NOT present this turn, you MUST NOT recall or restate data from earlier turns' mention blocks — that data may be stale or belong to a different device/company.
- If the user asks device-specific questions (intended purpose, context of use, indications, markets, UDI, technical specs, etc.) and @device is NOT present this turn, reply in ONE sentence: "Please type @device so I can load the current device context." Do not attempt to answer from memory.
- Same rule for @settings and settings/numbering/prefix questions.
- If the user asks about a specific company SOP (content, status, reference, version) and the SOP snapshot is NOT present this turn, reply in ONE sentence: "Please @mention the SOP name (e.g. @design-and-development) so I can load it." Do not attempt to answer from memory.

Rules:
- MAX 2-3 sentences per response (outside doc-section blocks)
- For "hi"/"hello" — greet briefly and ask which section to work on (1 sentence, no section lists)
- When user asks to fill a section — just provide the doc-section block, nothing else
- One section at a time
- No placeholder brackets like [DOC-ID-001] — use real names
- If user says something unclear, ask ONE short question (max 10 words)${customPrompt ? `\n\nAdditional instructions from user:\n${customPrompt}` : ''}`;

      // Only send last 10 messages to AI to avoid old bad responses influencing new ones.
      // Replace the last user bubble's display text with the real prompt (effective) so the
      // AI actually receives the detailed instruction even when we show a short label to the user.
      const recentMessages = updated.slice(-10);
      const aiMessages = recentMessages.map((m, i) =>
        i === recentMessages.length - 1 && m.role === 'user'
          ? { role: m.role, content: effective }
          : { role: m.role, content: m.content }
      );

      const response = await supabase.functions.invoke('vertex-document-chat', {
        body: {
          messages: aiMessages,
          systemPrompt,
          companyId,
          documentName: template.name,
          documentType: template.type,
        }
      });

      if (response.error) throw response.error;

      const data = response.data;
      if (data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        return;
      }
      if (data?.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${data.error}` }]);
        return;
      }

      const content = data?.content || 'I apologize, I was unable to generate a response.';
      const assistantTs = new Date().toISOString();

      // Persist to document_ai_sessions and capture the row id so section
      // decisions made later can be written back to the same row.
      let newSessionId: string | undefined;
      if (documentId && companyId && user?.id) {
        const { data: inserted } = await supabase
          .from('document_ai_sessions')
          .insert({
            document_id: documentId,
            company_id: companyId,
            user_id: user.id,
            session_type: 'chat',
            query_text: text,
            ai_response: JSON.stringify({ answer: content }),
            response_metadata: { userName, timestamp: assistantTs, sectionDecisions: {} },
          })
          .select('id')
          .single();
        newSessionId = inserted?.id;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content,
        timestamp: assistantTs,
        userName: 'XyReg Assistant',
        sessionId: newSessionId,
        sectionDecisions: {},
        attachedSpans: attachedSpansSnapshot.length ? attachedSpansSnapshot : undefined,
      }]);
    } catch (err) {
      console.error('Document AI chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: '**Failed to get a response.**\n\nThis could be due to:\n- Google Vertex AI key not configured\n- Network connectivity issue\n- AI service temporarily unavailable\n\nPlease check your API key configuration in **Company Settings > API Keys** and try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, template, companyId, productId, documentId, activeCompanyRole, companyApiKeys, getApiKey, user?.id, sopMentions, advisoryContext, numberingContext, attachedContexts]);

  // Record a user's Accept/Replace/Reject on a proposed section edit — persist
  // to the assistant message row so the decision is restored on reload instead
  // of the three buttons reappearing as "pending".
  const handleSectionDecision = useCallback((messageIdx: number, sectionName: string, next: DocSectionStatus) => {
    let targetSessionId: string | undefined;
    let mergedDecisions: Record<string, DocSectionStatus> = {};
    setMessages(prev => {
      const copy = [...prev];
      const msg = copy[messageIdx];
      if (!msg || msg.role !== 'assistant') return prev;
      mergedDecisions = { ...(msg.sectionDecisions ?? {}), [sectionName]: next };
      targetSessionId = msg.sessionId;
      copy[messageIdx] = { ...msg, sectionDecisions: mergedDecisions };
      return copy;
    });
    if (targetSessionId) {
      (async () => {
        try {
          const { data } = await supabase
            .from('document_ai_sessions')
            .select('response_metadata')
            .eq('id', targetSessionId)
            .maybeSingle();
          const existing = (data?.response_metadata as Record<string, any>) || {};
          await supabase
            .from('document_ai_sessions')
            .update({ response_metadata: { ...existing, sectionDecisions: mergedDecisions } })
            .eq('id', targetSessionId);
        } catch (err) {
          console.warn('[DocumentAIChatPanel] failed to persist section decision', err);
        }
      })();
    }
  }, []);

  const MENTION_ITEMS = useMemo(() => [
    { value: 'settings', label: 'settings', hint: 'Prefixes, numbering, sub-prefixes', group: 'system' as const },
    ...(disableSopMentions ? [] : [{ value: 'device', label: 'device', hint: 'Currently selected device', group: 'system' as const }]),
    ...sopMentions.map(s => ({ value: s.value, label: s.label, hint: s.hint, group: 'sop' as const })),
  ], [sopMentions, disableSopMentions]);

  const filteredMentions = useMemo(() => {
    const q = mentionQuery.toLowerCase();
    if (!q) return MENTION_ITEMS;
    return MENTION_ITEMS.filter(m =>
      m.value.toLowerCase().includes(q) || m.label.toLowerCase().includes(q),
    );
  }, [MENTION_ITEMS, mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setInput(newVal);
    const caret = e.target.selectionStart ?? newVal.length;
    const upToCaret = newVal.slice(0, caret);
    const m = upToCaret.match(/(?:^|\s)@([\w-]*)$/);
    if (m) {
      setMentionQuery(m[1]);
      setMentionOpen(true);
      setMentionHighlight(0);
    } else {
      setMentionOpen(false);
    }
  };

  const insertMention = (value: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? input.length;
    const before = input.slice(0, caret);
    const after = input.slice(caret);
    // Remove the partially-typed `@query` fragment from the end of `before`,
    // then append the full mention and a trailing space (unless one already follows).
    const beforeStripped = before.replace(/(^|\s)@([\w-]*)$/, '$1');
    const needsSpace = !after.startsWith(' ');
    const replaced = `${beforeStripped}@${value}${needsSpace ? ' ' : ''}`;
    const next = replaced + after;
    setInput(next);
    setMentionOpen(false);
    setMentionQuery('');
    requestAnimationFrame(() => {
      ta.focus();
      const pos = replaced.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionOpen && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionHighlight(h => (h + 1) % filteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionHighlight(h => (h - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMentions[mentionHighlight].value);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  return (
    <div
      className={cn(
        'bg-background flex flex-col shrink-0 relative',
        !embedded && 'border-r'
      )}
      style={embedded ? { width: '100%', height: '100%' } : { width: `${width ?? 800}px` }}
    >
      {/* Header — only when not embedded (RightPanel tabs provide header chrome) */}
      {!embedded && (
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ background: '#EEEDFE' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: '#534AB7' }} />
            <span className="text-sm font-medium" style={{ color: '#3F3892' }}>XyReg Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="h-7 w-7 p-0"
              title="AI Settings"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 w-7 p-0"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Embedded header row: just settings button, aligned right */}
      {embedded && (
        <div className="flex items-center justify-end px-2 py-1 border-b" style={{ background: '#EEEDFE' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="h-6 w-6 p-0"
            title="AI Settings"
          >
            <Settings2 className="w-3.5 h-3.5" style={{ color: '#534AB7' }} />
          </Button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {isLoadingHistory && (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" style={{ color: '#534AB7' }} />
            <p className="text-sm">Loading chat history...</p>
          </div>
        )}

        {messages.length === 0 && !isLoading && !isLoadingHistory && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: '#534AB7', opacity: 0.55 }} />
            <p className="text-sm font-medium">XyReg Assistant</p>
            <p className="text-xs mt-1">Ask questions about your document or request changes</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          // Doc-section blocks always render as a diff card that requires an
          // explicit Accept / Replace / Reject — never auto-apply.
          const autoApplyThis = false;
          return (
          <div key={idx} className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
            {/* Cursor-style reference pills — rendered above the user bubble
                when the message carries attached span context. */}
            {msg.role === 'user' && msg.attachedSpans && msg.attachedSpans.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1 justify-end max-w-[85%]">
                {msg.attachedSpans.map((s) => (
                  <div
                    key={s.id}
                    title={s.text}
                    className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] max-w-[220px]"
                    style={{ borderColor: '#C7C2EE', background: '#F5F4FD', color: '#3F3892' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="truncate font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1"
                  style={{ background: '#534AB7' }}
                >
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-lg px-3 py-2 max-w-[85%] text-sm break-words',
                  // w-fit on user bubbles so short messages hug their content
                  // instead of being sized down by the surrounding flex layout
                  // (which was wrapping "Draft new Scope" onto two lines).
                  msg.role === 'user' ? 'w-fit bg-primary text-primary-foreground' : '',
                )}
                style={msg.role === 'assistant' ? { background: '#EEEDFE', color: '#3F3892' } : undefined}
              >
                {msg.role === 'assistant' ? (
                  (() => {
                    const { target, cleaned } = extractSuggestedSection(msg.content);
                    return (
                      <>
                        <RenderAIResponse
                          content={cleaned}
                          onApplyContent={onApplyContent}
                          editorContainerRef={editorContainerRefProp}
                          editorInstanceRef={editorInstanceRef}
                          autoApply={autoApplyThis}
                          sectionDecisions={msg.sectionDecisions}
                          onSectionDecision={(sectionName, next) => handleSectionDecision(idx, sectionName, next)}
                          attachedSpans={msg.attachedSpans}
                        />
                        <PasteIntoSectionButton
                          content={cleaned}
                          suggestedSection={target}
                          onApply={onApplyContent}
                        />
                      </>
                    );
                  })()
                ) : (
                  <p className="whitespace-pre-wrap break-words">{renderWithMentions(msg.content, 'onPrimary')}</p>
                )}
              </div>
            </div>
            {/* Timestamp and username — outside the bubble, only for user messages */}
            {msg.role === 'user' && (
              <div className="text-[10px] text-muted-foreground mt-0.5 px-1 text-right">
                {msg.timestamp && (() => {
                  const diff = Date.now() - new Date(msg.timestamp).getTime();
                  return diff < 60000 ? 'just now' : formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true });
                })()}
                {msg.userName && <span> &middot; {msg.userName}</span>}
              </div>
            )}
          </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1"
              style={{ background: '#534AB7' }}
            >
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="rounded-lg px-3 py-3" style={{ background: '#EEEDFE' }}>
              <LoaderFive text={customPrompt ? "Applying your instructions..." : "Thinking..."} className="text-sm text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-3">
        {/* Attached context chips from editor bubble menu "Add to Chat".
            Horizontally scrollable so many chips don't wrap the input. */}
        {attachedContexts.length > 0 && (
          <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
            {attachedContexts.map((ctx) => (
              <div
                key={ctx.id}
                className="shrink-0 inline-flex items-center gap-1.5 max-w-[260px] rounded-md border px-2 py-1 text-[11px]"
                style={{ borderColor: '#C7C2EE', background: '#F5F4FD', color: '#3F3892' }}
                title={ctx.text}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="truncate font-medium">{ctx.label}</span>
                <button
                  type="button"
                  onClick={() => removeAttachedContext(ctx.id)}
                  className="shrink-0 inline-flex items-center justify-center rounded-sm hover:bg-black/10 h-3.5 w-3.5"
                  aria-label="Remove context"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Quick suggestion chips — visible only when the user hasn't typed anything */}
        {!input.trim() && !isLoading && attachedContexts.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[
              { label: 'Summarize this document', prompt: 'Summarize this document in 3–5 bullets, highlighting purpose, scope, and key risks.' },
              { label: 'Check for missing sections', prompt: 'Review this document and list any sections that appear incomplete or missing required content.' },
              { label: 'Suggest improvements', prompt: 'Suggest 3 concrete improvements to strengthen this document for regulatory review.' },
              { label: 'Draft the next empty section', prompt: 'Draft content for the next empty section in this document. Return it inside a <doc-section name="…"> block so I can paste it in.' },
              { label: 'Explain regulatory risks', prompt: 'Identify and explain the top regulatory risks implied by this document and how to address them.' },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setInput(s.prompt);
                  textareaRef.current?.focus();
                }}
                className="text-[11px] px-2 py-1 rounded-full border transition-colors"
                style={{ borderColor: '#C7C2EE', color: '#3F3892', background: '#F5F4FD' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#EEEDFE'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F5F4FD'; }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            {/* Mirror layer: renders the same text but with @mentions highlighted.
                Shares typography with the textarea so glyphs line up. */}
            <div
              aria-hidden
              className="absolute inset-0 px-3 py-2 text-sm whitespace-pre-wrap break-words pointer-events-none overflow-hidden rounded-md border border-input"
              style={{ lineHeight: '1.25rem', color: '#0f172a', background: 'hsl(var(--secondary))' }}
            >
              {input ? renderWithMentions(input, 'onLight') : <span className="text-muted-foreground">Ask about your document... (type @ to reference context)</span>}
            </div>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder=""
              className="min-h-[40px] max-h-[120px] resize-none text-sm w-full relative"
              style={{ color: 'transparent', caretColor: '#0f172a', lineHeight: '1.25rem', background: 'transparent' }}
              rows={1}
            />
            {mentionOpen && filteredMentions.length > 0 && (
              <div
                className="absolute left-0 bottom-full mb-1 z-40 w-[300px] rounded-lg border bg-background shadow-xl overflow-hidden"
              >
                <div className="px-3 py-1.5 border-b" style={{ background: '#EEEDFE' }}>
                  <p className="text-[11px] font-semibold" style={{ color: '#3F3892' }}>Reference context</p>
                </div>
                <div className="max-h-[220px] overflow-y-auto">
                  {filteredMentions.map((item, idx) => {
                    const prev = idx > 0 ? filteredMentions[idx - 1] : undefined;
                    const showHeader = item.group && item.group !== prev?.group;
                    return (
                      <React.Fragment key={item.value}>
                        {showHeader && (
                          <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-muted/40">
                            {item.group === 'sop' ? 'Company Documents' : 'System'}
                          </div>
                        )}
                        <button
                          type="button"
                          onMouseDown={(ev) => { ev.preventDefault(); insertMention(item.value); }}
                          onMouseEnter={() => setMentionHighlight(idx)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors',
                            idx === mentionHighlight ? 'bg-muted' : 'hover:bg-muted/60',
                          )}
                        >
                          <span className="text-xs truncate flex-1 min-w-0">
                            {item.label !== item.value ? item.label : `@${item.value}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 truncate max-w-[110px]">
                            {item.hint}
                          </span>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <Button
              size="sm"
              type="button"
              onClick={() => setShowAutoComplete((v) => !v)}
              disabled={isLoading}
              className="h-10 w-10 p-0 shrink-0 text-white"
              style={{ background: '#534AB7' }}
              title="Auto-complete a section"
            >
              <Wand2 className="w-4 h-4" />
            </Button>

            {showAutoComplete && (
              <div
                className="absolute right-0 bottom-12 z-30 w-[260px] max-h-[320px] overflow-y-auto rounded-lg border bg-background shadow-xl"
                onMouseLeave={() => { /* keep open until click */ }}
              >
                <div className="px-3 py-2 border-b" style={{ background: '#EEEDFE' }}>
                  <p className="text-xs font-semibold" style={{ color: '#3F3892' }}>Auto-complete a section</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Pick a section — AI will draft content for it.</p>
                </div>
                <div className="py-1">
                  {(template?.sections ?? []).length === 0 && (
                    <div className="px-3 py-3 text-xs text-muted-foreground text-center">No sections available.</div>
                  )}
                  {[...(template?.sections ?? [])]
                    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                    .map((section: any) => {
                      const name = (section.customTitle || section.title || 'Untitled').toString();
                      const contentArr = Array.isArray(section.content) ? section.content : [];
                      const plain = contentArr
                        .map((c: any) => (c?.content || '').replace(/<[^>]*>/g, '').trim())
                        .join(' ')
                        .trim();
                      const isEmpty = plain.length === 0;
                      return (
                        <button
                          key={section.id || name}
                          type="button"
                          onClick={() => {
                            setShowAutoComplete(false);
                            const prompt = `Draft content for the "${name}" section of this document. Return ONLY the drafted content inside a single block like:\n<doc-section name="${name}">\n...content...\n</doc-section>\nDo not add any commentary outside the block. Keep it concise, regulatory-appropriate, and specific to the document's context.`;
                            handleSend(prompt, `Auto-complete: ${name}`);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                        >
                          <span className="flex-1 truncate">{name}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full border"
                            style={
                              isEmpty
                                ? { borderColor: '#F59E0B', color: '#B45309', background: '#FEF3C7' }
                                : { borderColor: '#D1D5DB', color: '#6B7280', background: '#F9FAFB' }
                            }
                          >
                            {isEmpty ? 'Empty' : 'Has content'}
                          </span>
                        </button>
                      );
                    })}
                </div>
                <div className="px-3 py-2 border-t flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAutoComplete(false);
                      handleSend(
                        'Look at the document and pick the single most impactful empty or incomplete section to draft next. Return the drafted content inside a <doc-section name="EXACT_SECTION_NAME_FROM_DOC"> block — replace EXACT_SECTION_NAME_FROM_DOC with the real section title.',
                        'Auto-complete: next most impactful section'
                      );
                    }}
                    className="text-[11px] font-medium"
                    style={{ color: '#534AB7' }}
                  >
                    Let AI pick →
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAutoComplete(false)}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 p-0 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          AI can make mistakes. Verify important content.
        </p>
      </div>

      {/* Resize handle on right edge — only when not embedded */}
      {!embedded && (
        <div
          className="absolute top-0 -right-[8px] w-4 h-full cursor-col-resize z-10 group flex items-center justify-center"
          onMouseDown={handleMouseDown}
        >
          <div className="flex h-6 w-4 items-center justify-center rounded-sm border bg-border shadow-sm">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>AI Assistant Settings</DialogTitle>
            <DialogDescription>
              Add custom instructions for the AI assistant. These will be applied to every response for this document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="custom-prompt">Custom System Prompt</Label>
            <Textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Always use formal language. Focus on EU MDR compliance. Include specific clause references."
              className="min-h-[120px] text-sm"
              rows={5}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setCustomPrompt(''); saveCustomPrompt(''); }}>
                Clear
              </Button>
              <Button size="sm" onClick={() => { saveCustomPrompt(customPrompt); setShowSettings(false); }}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
