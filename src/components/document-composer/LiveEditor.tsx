import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Share, History, Sparkles, StickyNote, Wand2, GitBranch, MoreHorizontal, ArrowUpFromLine, Eye, EyeOff, Pencil, ShieldCheck, Bold, Italic, Strikethrough, Link2, List, ListOrdered, Type, ImagePlus, Undo, Redo, Heading1, Heading2, Heading3, Quote, AlignJustify, MessageSquare, MessageSquarePlus, ZoomIn, ZoomOut, PanelRight, Loader2, CheckCircle2, AlertCircle, Minus, Table as TableIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AIInlineEditBar } from './AIInlineEditBar';
import { HighlightedContent } from './HighlightedContent';
import { EditableContent } from './EditableContent';
import { EmptySectionPrompt } from './EmptySectionPrompt';
import { SOPDocumentHeader } from './SOPDocumentHeader';
import { SOPDocumentFooter } from './SOPDocumentFooter';
import { DocumentTemplate } from '@/types/documentComposer';
import { DocumentVersionModal } from './DocumentVersionModal';
import { AIContentGenerationModal } from './AIContentGenerationModal';
import { SaveVersionDialog } from './SaveVersionDialog';
import { DocumentVersionService } from '@/services/documentVersionService';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AIContentRecommendationService } from '@/services/aiContentRecommendationService';
import { AISuggestionService } from '@/services/aiSuggestionService';
import { DocumentStudioPersistenceService } from '@/services/documentStudioPersistenceService';
import { AIAutoFillDialog } from './AIAutoFillDialog';
import { useCustomerFeatureFlag } from '@/hooks/useCustomerFeatureFlag';
import { AIDocumentValidationDialog } from './AIDocumentValidationDialog';
import { DraftEmptyStateModal } from './DraftEmptyStateModal';
import { SOPPickerModal } from './SOPPickerModal';
import { InlineAIEditPopover } from './InlineAIEditPopover';
import { sopContentToSections, SOPFullContent } from '@/data/sopFullContent';
import { markdownToHtml, restructureInlineAIProse } from '@/utils/markdownToHtml';
import { documentContextStore } from '@/stores/documentContextStore';
import { DocumentOutlinePanel } from './DocumentOutlinePanel';
import { LeftRailTabs } from './LeftRailTabs';
import { RightPanel } from './RightPanel';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { TextSelection, Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension, Mark, Node, mergeAttributes } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TableKit } from '@tiptap/extension-table';
import { Trash2 } from 'lucide-react';
import { useCompanyDocumentMentions } from '@/hooks/useCompanyDocumentMentions';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { EditorMentionPopup, MentionItem, MentionSection } from './EditorMentionPopup';
import { DocMentionHoverCard, DocMentionHoverData } from './DocMentionHoverCard';
import { PersonMentionHoverCard, PersonMentionHoverData } from './PersonMentionHoverCard';
import { LinkHoverCard, LinkHoverData } from './LinkHoverCard';
import { CreateReferenceDocDialog } from './CreateReferenceDocDialog';
import { REFERENCE_PREFIXES } from '@/services/createReferenceDocument';

/**
 * Strip redundant leading headings from content that duplicate the section title.
 * E.g. if sectionTitle is "Purpose", removes leading "1.0 Purpose", "# 1.0 Purpose", "**1.0 Purpose**", etc.
 */
function stripRedundantSectionHeading(content: string, sectionTitle: string): string {
  if (!content || !sectionTitle) return content;
  const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let cleaned = content;

  // HTML patterns: <h1>1.0 Purpose</h1>, <p><strong>1.0 Purpose</strong></p>
  const htmlHeadingPattern = new RegExp(
    `^\\s*<(h[1-6]|p)>\\s*(?:<strong>)?\\s*(?:\\d+(?:\\.\\d+)*\\.?\\s+)?${escapedTitle}\\s*(?:</strong>)?\\s*</(h[1-6]|p)>\\s*`,
    'i'
  );
  cleaned = cleaned.replace(htmlHeadingPattern, '');

  // Standalone <strong>1.0 Purpose</strong> at start
  const htmlBoldPattern = new RegExp(
    `^\\s*<strong>\\s*(?:\\d+(?:\\.\\d+)*\\.?\\s+)?${escapedTitle}\\s*</strong>\\s*`,
    'i'
  );
  cleaned = cleaned.replace(htmlBoldPattern, '');

  // Markdown patterns: "# 1.0 Purpose", "**1.0 Purpose**", "1.0 Purpose"
  const mdPattern = new RegExp(
    `^\\s*(?:#{1,6}\\s+)?(?:\\*{1,2})?(?:\\d+(?:\\.\\d+)*\\.?\\s+)?${escapedTitle}(?:\\*{1,2})?\\s*\\n+`,
    'i'
  );
  cleaned = cleaned.replace(mdPattern, '');

  return cleaned;
}

/**
 * Strip leading number prefixes (e.g. "1.1 ", "2.3.1 ") from all h1-h6 headings
 * inside HTML content, so the system's chapter numbering is the sole source of truth.
 */
function stripContentHeadingNumbers(content: string): string {
  if (!content) return content;
  return content.replace(
    /(<h[1-6][^>]*>)\s*\d+(?:\.\d+)+\.?\s+/gi,
    '$1'
  );
}

function replaceCompanyPlaceholders(content: string, companyName: string): string {
  if (!content || !companyName) return content;
  return content
    .replace(/\[Your Company Name\]/gi, companyName)
    .replace(/\[Company Name\]/gi, companyName)
    .replace(/\[company name\]/gi, companyName);
}

// Custom Image node view with delete button overlay on hover
function ImageNodeView({ node, deleteNode, selected }: NodeViewProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <NodeViewWrapper className="relative inline-block">
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          title={node.attrs.title || ''}
          className={`max-w-full h-auto rounded ${selected ? 'ring-2 ring-primary' : ''}`}
          draggable={false}
        />
        {(hovered || selected) && (
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={deleteNode}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
              title="Delete image"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// Extend Image extension with delete button overlay
const ImageWithDelete = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

/**
 * Resolve a DOM anchor element to a prosemirror position that's *inside* the
 * link mark. Uses posAtCoords from the center of the anchor's bounding rect —
 * more reliable than posAtDOM, which can land on the boundary where the mark
 * is not active. Returns null if the lookup fails.
 */
function posInsideLink(editor: any, el: HTMLElement): number | null {
  try {
    const rect = el.getBoundingClientRect();
    const hit = editor.view.posAtCoords({
      left: rect.left + Math.max(2, rect.width / 2),
      top: rect.top + rect.height / 2,
    });
    if (hit && typeof hit.pos === 'number') return hit.pos;
  } catch {
    /* fall through */
  }
  try {
    const base = editor.view.posAtDOM(el.firstChild || el, 0);
    return base + 1;
  } catch {
    return null;
  }
}

// Mark applied to the inserted document name when the user picks a suggestion
// from the `@` popup. Using a mark (rather than an atomic node) keeps the text
// insertion path trivial and lets prosemirror render the styled span via the
// standard mark rendering path.
const MentionMark = Mark.create({
  name: 'docMention',
  inclusive: false,
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-id'),
        renderHTML: (attrs) => (attrs.id ? { 'data-id': attrs.id } : {}),
      },
      slug: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-slug'),
        renderHTML: (attrs) => (attrs.slug ? { 'data-slug': attrs.slug } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-doc-mention]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-doc-mention': '',
        class: 'xyreg-doc-mention',
      }),
      0,
    ];
  },
});

// Mark applied to the inserted person name when the user picks a teammate
// from the `@` popup. Renders as a subtle green pill to visually distinguish
// people references from document references.
const PersonMentionMark = Mark.create({
  name: 'personMention',
  inclusive: false,
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-id'),
        renderHTML: (attrs) => (attrs.id ? { 'data-id': attrs.id } : {}),
      },
      email: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-email'),
        renderHTML: (attrs) => (attrs.email ? { 'data-email': attrs.email } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-person-mention]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-person-mention': '',
        class: 'xyreg-person-mention',
      }),
      0,
    ];
  },
});

// Mark applied to smart-chip text (Date, Dropdown, Placeholder) inserted from
// the `@` popup. Renders as a subtle gray pill similar to Google Docs chips.
const SmartChipMark = Mark.create({
  name: 'smartChip',
  inclusive: false,
  addAttributes() {
    return {
      chipType: {
        default: 'placeholder',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-chip-type'),
        renderHTML: (attrs) => (attrs.chipType ? { 'data-chip-type': attrs.chipType } : {}),
      },
      variable: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-variable'),
        renderHTML: (attrs) => (attrs.variable ? { 'data-variable': attrs.variable } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-smart-chip]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-smart-chip': '',
        class: 'xyreg-smart-chip',
      }),
      0,
    ];
  },
});

// Atomic inline node for auto-detected document references like "SOP-008" or
// "TEMP-005 Design Plan Template". Two visual states:
//   - data-state="linked"  → blue solid chip; click opens existing doc.
//   - data-state="missing" → amber dashed chip with pencil-plus affordance;
//                            click opens CreateReferenceDocDialog.
// Implemented as an atom Node (not a Mark) so the chip behaves as a single
// unit — backspace deletes the whole chip, the cursor jumps over it, and the
// CSS ::after pencil affordance renders reliably. A Mark would be silently
// stripped inside list items by ProseMirror's schema in some contexts.
const DocReferenceNode = Node.create({
  name: 'docReference',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      state: {
        default: 'missing',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-state') || 'missing',
        renderHTML: (attrs) => (attrs.state ? { 'data-state': attrs.state } : {}),
      },
      refCode: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-ref-code'),
        renderHTML: (attrs) => (attrs.refCode ? { 'data-ref-code': attrs.refCode } : {}),
      },
      refTitle: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-ref-title'),
        renderHTML: (attrs) => (attrs.refTitle ? { 'data-ref-title': attrs.refTitle } : {}),
      },
      id: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-id'),
        renderHTML: (attrs) => (attrs.id ? { 'data-id': attrs.id } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-doc-ref]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const refCode = (node.attrs.refCode as string) || '';
    const refTitle = (node.attrs.refTitle as string) || '';
    const display = refTitle ? `${refCode} ${refTitle}` : refCode;
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-doc-ref': '',
        class: 'xyreg-doc-ref',
        contenteditable: 'false',
      }),
      display,
    ];
  },
});

// FontSize extension for inline text sizing (reused from EditableContent)
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
          renderHTML: attributes => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

// Persistent selection highlight used by the Inline AI Edit popover. We can't
// rely on the browser's native selection because it dims when focus moves to
// the popover's textarea — this decoration stays bright until explicitly
// cleared.
const aiEditHighlightKey = new PluginKey<{ from: number | null; to: number | null }>(
  'xyregAiEditHighlight',
);

const AIEditHighlightExtension = Extension.create({
  name: 'xyregAiEditHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: aiEditHighlightKey,
        state: {
          init() {
            return { from: null as number | null, to: null as number | null };
          },
          apply(tr, prev) {
            const meta = tr.getMeta(aiEditHighlightKey);
            if (meta !== undefined) return meta;
            return prev;
          },
        },
        props: {
          decorations(state) {
            const s = aiEditHighlightKey.getState(state);
            if (!s || s.from == null || s.to == null || s.from >= s.to) return null;
            return DecorationSet.create(state.doc, [
              Decoration.inline(s.from, s.to, {
                class: 'xyreg-ai-edit-highlight',
              }),
            ]);
          },
        },
      }),
    ];
  },
});

function setAIEditHighlight(
  editor: any,
  range: { from: number; to: number } | null,
) {
  if (!editor?.view) return;
  editor.view.dispatch(
    editor.state.tr.setMeta(aiEditHighlightKey, range ?? { from: null, to: null }),
  );
}

const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '14px' },
  { label: 'Medium', value: '16px' },
  { label: 'Large', value: '20px' },
  { label: 'X-Large', value: '24px' },
  { label: 'XX-Large', value: '32px' },
];

/**
 * Merge template sections into a single HTML string for the unified editor.
 * Each section becomes an <h2> heading followed by its content.
 */
/**
 * Re-number H3 sub-headings inside HTML content.
 * Replaces leading number prefixes like "1.1 ", "5.2 " with the correct section-relative number.
 * E.g. for sectionNum=2: "1.1 Applicability" -> "2.1 Applicability"
 */
function renumberSubHeadings(html: string, sectionNum: number): string {
  let subCounter = 0;
  return html.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/gi, (match, attrs, inner) => {
    subCounter++;
    // Strip any existing leading number prefix (e.g. "1.1 ", "5.2 ")
    const stripped = inner.replace(/^\s*\d+\.\d+\.?\s*/, '').trim();
    return `<h3${attrs}>${sectionNum}.${subCounter} ${stripped}</h3>`;
  });
}

/**
 * Promote subsection lines like "6.1 Document Creation" into real <h3>
 * blocks. Templates often store these as plain paragraph text or as <h2>
 * elements, both of which break the heading hierarchy and the outline.
 *
 * Rules:
 *  - <h2>X.Y[.Z] Title</h2>            → <h3>X.Y[.Z] Title</h3>
 *  - <p>X.Y Title<br>body…</p>         → <h3>X.Y Title</h3><p>body…</p>
 *  - <p>X.Y Title</p>                  → <h3>X.Y Title</h3>
 *  - First line of a multi-line <p> that matches "X.Y Title" → split into
 *    an <h3> followed by a <p> with the remaining body.
 *
 * Top-level "X.0 …" lines are NOT promoted — those are reserved for the
 * section H2 emitted by `mergeSectionsToHtml`.
 */
function promoteSubsectionHeadings(html: string): string {
  if (!html) return html;
  const subsectionRe = /^\s*\d+\.\d+(?:\.\d+)*\s+\S/;
  // Skip "X.0 …" — those are top-level section titles.
  const isSubsection = (text: string) =>
    subsectionRe.test(text) && !/^\s*\d+\.0\s/.test(text);

  // 1) <h2>X.Y …</h2> → <h3>X.Y …</h3>
  let out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs, inner) => {
    const stripped = String(inner).replace(/<[^>]+>/g, '').trim();
    return isSubsection(stripped) ? `<h3${attrs}>${inner}</h3>` : m;
  });

  // 2) Split <p>…</p> blocks where the first line is a subsection title.
  out = out.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs, inner: string) => {
    // Normalise <br> variants into a single newline so we can split on lines.
    const lines = inner
      .replace(/<br\s*\/?>(\s*)/gi, '\n')
      .split('\n');
    const result: string[] = [];
    let buffer: string[] = [];
    const flushParagraph = () => {
      const body = buffer.join('<br>').trim();
      if (body) result.push(`<p${attrs}>${body}</p>`);
      buffer = [];
    };
    for (const rawLine of lines) {
      const line = rawLine.trim();
      const plain = line.replace(/<[^>]+>/g, '').trim();
      if (isSubsection(plain)) {
        flushParagraph();
        result.push(`<h3>${line}</h3>`);
      } else {
        buffer.push(rawLine);
      }
    }
    flushParagraph();
    // If nothing was promoted, return the original block untouched.
    return result.length === 0 ? full : result.join('');
  });

  return out;
}

function mergeSectionsToHtml(sections: any[], companyName: string, numbered: boolean = false): string {
  // helper hoisted via function declaration below
  if (!sections || sections.length === 0) return '<p></p>';

  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, sectionIndex) => {
      const sectionNum = sectionIndex + 1;
      const title = section.customTitle || section.title;
      const prefix = numbered ? `${sectionNum}.0 ` : '';
      const sectionHeading = `<h2 id="section-${section.id}">${prefix}${title}</h2>`;

      // Revision History recovery: if this section was previously saved with
      // table HTML stripped (e.g. by an editor build that lacked TipTap table
      // support), the content collapses into a single line like
      // "VersionDateDescriptionAuthor1.0[Effective Date]Initial release...".
      // Detect that case and rebuild the canonical 4-column table so the
      // section becomes editable again.
      const isRevisionHistory =
        section.id === 'revision-history' ||
        /revision\s*history/i.test(String(title || ''));
      if (isRevisionHistory) {
        const joined = (Array.isArray(section.content) ? section.content : [])
          .map((it: any) => String(it?.content || ''))
          .join('')
          .trim();
        const looksHealthy =
          joined.startsWith('<table') ||
          /\|\s*Version\s*\|/i.test(joined) ||
          looksLikePipeTable(joined);
        if (!looksHealthy) {
          const fallbackTable = pipeTableToHtml(
            '| Version | Date | Description | Author |\n' +
            '|---------|------|-------------|--------|\n' +
            '| 1.0 | [Effective Date] | Initial release | Quality Manager |',
          );
          return sectionHeading + fallbackTable;
        }
      }

      const contentItems = (Array.isArray(section.content) ? section.content : [])
        .map((item: any) => {
          if (item.type === 'heading') return `<h3>${item.content}</h3>`;
          if (item.type === 'table') {
            const raw = (item.content || '').trim();
            if (!raw) return '';
            // Pre-rendered HTML tables pass through untouched.
            if (raw.startsWith('<table')) return raw;
            // If there are no pipes, fall through to paragraph handling so we
            // don't break free-text content that was mis-tagged as 'table'.
            if (raw.includes('|')) return pipeTableToHtml(raw);
          }
          // Auto-detect pipe-style markdown tables even when the seed didn't
          // tag the item as 'table' (e.g. the "8.0 Revision History" sections
          // shipped as plain content with leading "| Version | Date | …").
          {
            const raw = (item.content || '').trim();
            if (
              raw &&
              !raw.startsWith('<table') &&
              looksLikePipeTable(raw)
            ) {
              return pipeTableToHtml(raw);
            }
          }
          let processed = item.content || '';
          // Skip empty/placeholder content
          if (!processed.trim() || processed === '[AI_PROMPT_NEEDED]') return '';
          // Normalize markdown (**, __, - bullets, 1. numbered) to HTML. This
          // is a no-op when the content already looks like HTML, so it's safe
          // to apply unconditionally and fixes AI-generated content that was
          // persisted as raw markdown before this conversion existed.
          processed = markdownToHtml(processed);
          processed = stripRedundantSectionHeading(processed, title);
          processed = replaceCompanyPlaceholders(processed, companyName);
          // If content looks like plain text, wrap in paragraph tags
          if (processed && !processed.trim().startsWith('<')) {
            processed = `<p>${processed}</p>`;
          }
          // Finally, restructure any paragraphs the AI packed with multiple
          // bolded sub-headings + inline dash-items into proper headings +
          // bullet lists. Conservative heuristic — no effect on normal prose.
          processed = restructureInlineAIProse(processed);
          return processed;
        })
        .filter(Boolean)
        .join('');

      // Always add an empty paragraph after heading so user can click and type
      let contentHtml = contentItems || '<p></p>';

      // Promote any "6.1 …" lines stored as plain paragraph text or <h2>
      // into real <h3> blocks so the editor and outline see them as headings.
      contentHtml = promoteSubsectionHeadings(contentHtml);

      // Re-number H3 sub-headings when section numbering is enabled
      if (numbered) {
        contentHtml = renumberSubHeadings(contentHtml, sectionNum);
      }

      return sectionHeading + contentHtml;
    })
    .join('');
}

/**
 * Wrap reference codes like "SOP-008", "TEMP-005 Design Plan Template" with a
 * smart chip span. If a matching company document exists in `knownRefs`, the
 * chip is rendered as a regular doc-mention (blue underline, click-to-open).
 * Otherwise it gets the amber "missing" state with a pencil-plus affordance
 * that triggers the CreateReferenceDocDialog.
 *
 * The pass deliberately skips matches that already live inside an anchor,
 * mention chip, or attribute value, so it is safe to run on already-styled
 * content and on round-trips back from the editor.
 */
export function annotateDocumentReferences(
  html: string,
  knownRefs: Map<string, { id?: string; name: string; ambiguous?: boolean }>,
): string {
  if (!html) return html;
  const prefixGroup = REFERENCE_PREFIXES.join('|');
  // Match REF-CODE in either two-part legacy form (SOP-002) or three-part
  // functional sub-prefix form (SOP-QA-002), optionally followed by a short
  // readable title (stops at punctuation or tag boundary so we don't swallow
  // whole sentences). Sub-prefix is constrained to 2–4 uppercase letters to
  // avoid greedy matches against neighbouring words.
  const re = new RegExp(
    // Title capture is greedy across normal title chars (Word characters,
    // spaces, ampersands, slashes, hyphens) and stops at punctuation/tag
    // boundaries so the WHOLE title becomes part of the chip — not just the
    // first word. Capped at 80 chars to avoid runaway matches.
    `\\b(${prefixGroup})(?:-([A-Z]{2,4}))?-(\\d{2,4})(?:\\s*[:\\-]?\\s*([A-Z][\\w][\\w &/\\-]{0,78}))?(?=$|[<\\n,;.)\\]])`,
    'g',
  );
  const renderReferenceChip = (refCode: string, title: string) => {
    const legacyCode = refCode.replace(/^([A-Z]{2,5})-[A-Z]{2,4}-(\d{2,4})$/i, '$1-$2');
    const display = title ? `${refCode} ${title}` : refCode;
    const known =
      knownRefs.get(refCode.toLowerCase()) ||
      (legacyCode !== refCode ? knownRefs.get(legacyCode.toLowerCase()) : undefined) ||
      (title ? knownRefs.get(`${refCode} ${title}`.toLowerCase()) : undefined);
    const titleAttr = title.replace(/"/g, '&quot;');
    if (known) {
      return `<span data-doc-ref data-state="linked" data-id="${known.id}" data-ref-code="${refCode}" data-ref-title="${titleAttr}" class="xyreg-doc-ref" contenteditable="false">${display}</span>`;
    }
    return `<span data-doc-ref data-state="missing" data-ref-code="${refCode}" data-ref-title="${titleAttr}" class="xyreg-doc-ref" contenteditable="false">${display}</span>`;
  };

  // Re-resolve already-rendered chips too. Without this, a reference that was
  // once saved as `data-state="missing"` stays stuck forever because the text
  // pass below intentionally skips content inside tags.
  html = html.replace(/<span\b([^>]*\bdata-doc-ref\b[^>]*)>([^<]*)<\/span>/gi, (_match, attrs, text) => {
    const attr = (name: string) => attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1] || '';
    const refCode = attr('data-ref-code').trim();
    const refTitle = attr('data-ref-title').replace(/&quot;/g, '"').trim();
    const chipText = String(text || '').replace(/&quot;/g, '"').trim();
    if (refCode) return renderReferenceChip(refCode, refTitle);

    const parsed = chipText.match(new RegExp(`^(${prefixGroup})(?:-([A-Z]{2,4}))?-(\\d{2,4})(?:\\s+(.+))?$`, 'i'));
    if (!parsed) return _match;
    const [, prefix, sub, num, tail] = parsed;
    return renderReferenceChip(sub ? `${prefix}-${sub}-${num}` : `${prefix}-${num}`, (tail || '').trim());
  });

  // Skip text inside tags (between < and >) and inside known chip/anchor wrappers.
  // Simple state machine: walk the string, keep depth of opened tags, and only
  // run the regex on text segments outside of tags.
  let out = '';
  let i = 0;
  const len = html.length;
  // Range expander: turn `SOP-DE-005 through SOP-DE-011` (or `– / — / to / -`)
  // into the explicit comma-separated list before the chip regex runs, so each
  // document becomes an individually clickable chip. Only expands when both
  // ends share the same prefix (incl. functional sub-prefix) and the range is
  // sane (≤ 50 entries, end ≥ start).
  const rangeRe = new RegExp(
    `\\b(${prefixGroup})(?:-([A-Z]{2,4}))?-(\\d{2,4})\\s*(?:through|thru|to|–|—|-)\\s*(${prefixGroup})(?:-([A-Z]{2,4}))?-(\\d{2,4})\\b`,
    'gi',
  );
  const expandRanges = (chunk: string) =>
    chunk.replace(rangeRe, (match, p1, s1, n1, p2, s2, n2) => {
      if (p1.toUpperCase() !== p2.toUpperCase()) return match;
      if ((s1 || '').toUpperCase() !== (s2 || '').toUpperCase()) return match;
      const startNum = parseInt(n1, 10);
      const endNum = parseInt(n2, 10);
      if (!Number.isFinite(startNum) || !Number.isFinite(endNum)) return match;
      if (endNum <= startNum || endNum - startNum > 49) return match;
      const pad = Math.max(n1.length, n2.length);
      const codes: string[] = [];
      for (let k = startNum; k <= endNum; k++) {
        const numStr = String(k).padStart(pad, '0');
        codes.push(s1 ? `${p1}-${s1}-${numStr}` : `${p1}-${numStr}`);
      }
      return codes.join(', ');
    });
  while (i < len) {
    const lt = html.indexOf('<', i);
    const rawChunk = lt === -1 ? html.slice(i) : html.slice(i, lt);
    const textChunk = expandRanges(rawChunk);
    // Substitute references in this text segment.
    out += textChunk.replace(re, (_m, prefix, sub, num, tail) => {
      const refCode = sub
        ? `${prefix}-${sub}-${num}`
        : `${prefix}-${num}`;
      const title = (tail || '').trim();
      return renderReferenceChip(refCode, title);
    });
    if (lt === -1) break;
    // Copy the tag verbatim until matching '>'.
    const gt = html.indexOf('>', lt);
    if (gt === -1) {
      out += html.slice(lt);
      break;
    }
    out += html.slice(lt, gt + 1);
    i = gt + 1;
  }
  return out;
}

/**
 * Convert a pipe-delimited table (markdown-style, no separator row required)
 * into a clean HTML <table> with <thead>/<tbody>. Used to render seeded
 * "Revision History" content (and similar) as actual editable tables.
 */
function looksLikePipeTable(raw: string): boolean {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  // First two non-empty lines must look like table rows (contain a '|') and
  // the second one must be the markdown separator (---|--- pattern).
  const isRow = (l: string) => l.includes('|');
  const isSeparator = (l: string) =>
    /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(l);
  return isRow(lines[0]) && isSeparator(lines[1]);
}

/**
 * Apply a heading (H1/H2/H3) to the current Tiptap selection.
 *
 * Tiptap's `toggleHeading` is block-level — it converts the entire paragraph
 * the selection sits in. When the user highlights only part of a paragraph
 * (e.g. just "6.1 Clinical Evaluation Plan" inside a multi-line block),
 * we want the heading to apply ONLY to the highlighted run, leaving the
 * surrounding text untouched as a normal paragraph.
 *
 * Strategy:
 *  - Empty selection → behave like vanilla `toggleHeading` on the current block.
 *  - Non-empty selection that already covers a full block → vanilla toggle
 *    (so toggling off a heading still works).
 *  - Otherwise → delete the selected run and insert a fresh heading node
 *    containing exactly that text. The remaining paragraph text stays put.
 */
function applyHeadingToSelection(editor: any, level: 1 | 2 | 3): void {
  if (!editor) return;
  const { state } = editor;
  const { from, to, empty, $from, $to } = state.selection;

  // Empty caret: toggle the current block (preserves toggle-off behavior).
  if (empty) {
    editor.chain().focus().toggleHeading({ level }).run();
    return;
  }

  // Selection spans a full block (or multiple full blocks): use plain toggle
  // so re-clicking H3 on a full heading flips it back to a paragraph.
  const atBlockStart = $from.parentOffset === 0;
  const atBlockEnd = $to.parentOffset === $to.parent.content.size;
  if (atBlockStart && atBlockEnd) {
    editor.chain().focus().toggleHeading({ level }).run();
    return;
  }

  // Partial selection inside a block: extract the selected text into its
  // own heading node, leaving surrounding text in the original paragraph.
  const selectedText = state.doc.textBetween(from, to, '\n', '\n').trim();
  if (!selectedText) {
    editor.chain().focus().toggleHeading({ level }).run();
    return;
  }

  // Selection must live inside a single text block for the surgical replace.
  // If it spans block boundaries, fall back to plain toggle.
  if (!$from.sameParent($to)) {
    editor.chain().focus().toggleHeading({ level }).run();
    return;
  }

  // Split the parent block into [before | selected | after] text runs and
  // emit only the non-empty pieces. This avoids any leftover empty paragraph
  // (which `splitBlock` would otherwise create when the selection sits at
  // the very start or end of the block).
  const parent = $from.parent;
  const blockStart = $from.before();
  const blockEnd = $from.after();
  const beforeText = parent.textBetween(0, $from.parentOffset, '\n', '\n');
  const afterText = parent.textBetween($to.parentOffset, parent.content.size, '\n', '\n');

  const nodes: any[] = [];
  if (beforeText.trim().length > 0) {
    nodes.push({
      type: 'paragraph',
      content: [{ type: 'text', text: beforeText }],
    });
  }
  nodes.push({
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text: selectedText }],
  });
  if (afterText.trim().length > 0) {
    nodes.push({
      type: 'paragraph',
      content: [{ type: 'text', text: afterText }],
    });
  }

  editor
    .chain()
    .focus()
    .insertContentAt({ from: blockStart, to: blockEnd }, nodes)
    .run();
}

function pipeTableToHtml(raw: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const isSeparatorRow = (cells: string[]) =>
    cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));

  const splitRow = (line: string): string[] => {
    // Trim leading/trailing pipes so "| a | b |" => ["a", "b"].
    const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return trimmed.split('|').map((c) => c.trim());
  };

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return '';

  const rows = lines.map(splitRow).filter((r) => !isSeparatorRow(r));
  if (rows.length === 0) return '';

  const colCount = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) =>
    r.length < colCount ? [...r, ...Array(colCount - r.length).fill('')] : r;

  const [headerCells, ...bodyRows] = rows.map(pad);
  const thead = `<thead><tr>${headerCells
    .map((c) => `<th>${escape(c) || '&nbsp;'}</th>`)
    .join('')}</tr></thead>`;
  const tbody =
    bodyRows.length > 0
      ? `<tbody>${bodyRows
          .map(
            (row) =>
              `<tr>${row.map((c) => `<td>${escape(c) || '&nbsp;'}</td>`).join('')}</tr>`,
          )
          .join('')}</tbody>`
      : '';

  return `<table>${thead}${tbody}</table>`;
}

/**
 * Parse unified editor HTML back into template sections.
 * Splits on <h2> headings and maps content back to section structure.
 */
function parseHtmlToSections(html: string, originalSections: any[]): any[] {
  if (!html) return originalSections;

  // Create a temporary DOM to parse
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild;
  if (!container) return originalSections;

  const sections: any[] = [];
  let currentSection: { id: string; title: string; contentHtml: string } | null = null;

  // Walk through child nodes
  for (let i = 0; i < container.children.length; i++) {
    const child = container.children[i];
    const tagName = child.tagName.toLowerCase();

    if (tagName === 'h2') {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start new section
      const sectionId = child.id?.replace('section-', '') || `section-${Date.now()}-${i}`;
      currentSection = {
        id: sectionId,
        title: child.textContent?.trim() || 'Untitled Section',
        contentHtml: '',
      };
    } else {
      // Append to current section content
      if (currentSection) {
        currentSection.contentHtml += child.outerHTML;
      } else {
        // Content before first heading — create implicit section
        currentSection = {
          id: `section-intro-${Date.now()}`,
          title: 'Introduction',
          contentHtml: child.outerHTML,
        };
      }
    }
  }

  // Save last section
  if (currentSection) {
    sections.push(currentSection);
  }

  // Map back to original section structure, preserving metadata
  return sections.map((parsed, index) => {
    const original = originalSections.find((s) => s.id === parsed.id);
    return {
      id: parsed.id,
      title: parsed.title,
      customTitle: parsed.title !== (original?.title || '') ? parsed.title : original?.customTitle,
      content: [
        {
          id: original?.content?.[0]?.id || `content-${parsed.id}-0`,
          type: 'paragraph' as const,
          content: parsed.contentHtml,
          isAIGenerated: false,
        },
      ],
      order: index,
      showHeader: true,
    };
  });
}

interface LiveEditorProps {
  template: DocumentTemplate;
  className?: string;
  onContentUpdate?: (contentId: string, newContent: string) => void;
  companyId?: string;
  onDocumentSaved?: () => void;
  isEditingExistingDocument?: boolean;
  editingDocumentId?: string | null;
  /** CI/source document id used for DOCX comment extraction (may differ from draft id). */
  docxSourceDocumentId?: string | null;
  onAIGenerate?: () => void;
  onAddAutoNote?: (note: any) => void;
  currentNotes?: any[];
  isUploadedDocument?: boolean;
  uploadedDocumentSaved?: boolean;
  onUploadedDocumentSaved?: () => void;
  disabled?: boolean;
  selectedScope?: 'company' | 'product';
  selectedProductId?: string;
  uploadedFileInfo?: { filePath: string; fileName: string; fileSize?: number } | null;
  onDocumentControlChange?: (field: string, value: string) => void;
  companyLogoUrl?: string;
  onPushToDeviceFields?: () => void;
  onCustomSave?: () => void;
  isRecord?: boolean;
  recordId?: string;
  nextReviewDate?: string;
  documentNumber?: string;
  changeControlRef?: string;
  hideVersioning?: boolean;
  isEditing?: boolean;
  showSectionNumbers?: boolean;
  onShowSectionNumbersChange?: (show: boolean) => void;
  /** Notify parent when classification toggles in the Configure panel, so SOPDocumentHeader re-renders. */
  onIsRecordChange?: (isRecord: boolean) => void;
  disableSopMentions?: boolean;
  /** Document workflow phase. When not 'draft', AI proposed-change actions
   * (Accept/Reject/Replace) are hidden — content is locked for review/approval. */
  documentPhase?: 'draft' | 'review' | 'completed';
  /** Optional: when provided, LiveEditor registers its header action handlers
   * with the parent (e.g. DocumentDraftDrawer) so the parent can render the
   * action icons in its own top header instead of LiveEditor's own row.
   * Pass `null` later to clear. */
  onRegisterHeaderActions?: (actions: {
    aiAutoFillEnabled: boolean;
    onOpenAutoFill: () => void;
    onValidate: () => void;
    onDownload: () => void;
    onPushToDeviceFields?: () => void;
    onShare: () => void;
    onSaveVersion: () => void;
    onShowVersions: () => void;
    hideVersioning: boolean;
  } | null) => void;
}

export function LiveEditor({ template, className = '', onContentUpdate, companyId, onDocumentSaved, isEditingExistingDocument = false, editingDocumentId = null, docxSourceDocumentId = null, onAIGenerate, onAddAutoNote, currentNotes = [], isUploadedDocument = false, uploadedDocumentSaved = false, onUploadedDocumentSaved, disabled = false, selectedScope = 'company', selectedProductId, uploadedFileInfo, onDocumentControlChange, companyLogoUrl, onPushToDeviceFields, onCustomSave, isRecord = false, recordId, nextReviewDate, documentNumber, changeControlRef, hideVersioning = false, isEditing: isEditingProp, showSectionNumbers = false, onShowSectionNumbersChange, onIsRecordChange , disableSopMentions = false, documentPhase = 'draft', onRegisterHeaderActions }: LiveEditorProps) {
  const { activeCompanyRole } = useCompanyRole();
  const aiAutoFillEnabled = useCustomerFeatureFlag('ai-auto-fill');
  const aiInlineSuggestionsEnabled = useCustomerFeatureFlag('ai-inline-suggestions');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showSaveVersionDialog, setShowSaveVersionDialog] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(template?.name || '');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Autosave status indicator (Google-docs style: "Saving…" → "Saved").
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const savedFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{title: string, content: string} | null>(null);
  const [showAutoFillDialog, setShowAutoFillDialog] = useState(false);
  const [showEmptyStateModal, setShowEmptyStateModal] = useState(false);
  const [showSopPickerModal, setShowSopPickerModal] = useState(false);
  // Inline "Edit with AI" popover — captured snapshot of the selection.
  const [inlineAIEdit, setInlineAIEdit] = useState<{
    text: string;
    html: string;
    from: number;
    to: number;
    anchorRect: { top: number; left: number; bottom: number; right: number };
  } | null>(null);
  // Tracks which template id we already auto-opened the empty-state modal
  // for, so dismissing it doesn't re-trigger on the next re-render.
  const emptyStateOpenedForTemplateRef = useRef<string | null>(null);

  // Hyperlink dialog state.
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkDialogUrl, setLinkDialogUrl] = useState('');
  const [linkDialogText, setLinkDialogText] = useState('');
  const [linkDialogMode, setLinkDialogMode] = useState<'create' | 'edit'>('create');
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showDocumentAIBar, setShowDocumentAIBar] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [leftPanel, setLeftPanel] = useState<'outline' | 'chat' | null>(null);
  const [chatPanelWidth, setChatPanelWidth] = useState(800);
  const [showDocumentChat, setShowDocumentChat] = useState(false);
  const [docChatWidth, setDocChatWidth] = useState(600);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editedSectionTitle, setEditedSectionTitle] = useState('');
  const [inlineEditSectionId, setInlineEditSectionId] = useState<string | null>(null);
  const [aiTargetContentId, setAiTargetContentId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  // Table-picker dropdown state. `hover` is the current hovered cell (1-indexed)
  // used to preview how many rows/cols will be inserted, Google-Docs-style.
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tablePickerHover, setTablePickerHover] = useState<{ rows: number; cols: number }>({ rows: 0, cols: 0 });
  // Snapshot of the editor selection at the moment the picker opened — opening
  // the popover blurs the editor, so we restore this before inserting so the
  // table lands at the caret instead of falling through to the document end.
  const tablePickerSelectionRef = useRef<{ from: number; to: number } | null>(null);
  // Snapshot of whether the caret was inside a table when the popover opened.
  // Reading editor.isActive('table') during render is racy because the editor
  // can blur after the popover opens — freezing the mode at open time keeps
  // the menu stable while it's visible.
  const [tablePickerMode, setTablePickerMode] = useState<'insert' | 'edit'>('insert');
  const [isNarrow, setIsNarrow] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 900 : false
  );
  const [narrowRightOpen, setNarrowRightOpen] = useState(false);
  // Document Outline open/closed state persists across sessions so users
  // returning to a document see the same layout they left.
  const [outlineCollapsed, setOutlineCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('xyreg.outline.collapsed') !== '0'; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('xyreg.outline.collapsed', outlineCollapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [outlineCollapsed]);
  const [narrowOutlineOpen, setNarrowOutlineOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('xyreg.rightPanel.open') !== '0'; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('xyreg.rightPanel.open', rightPanelOpen ? '1' : '0'); } catch { /* ignore */ }
  }, [rightPanelOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 899px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsNarrow(e.matches);
    handler(mq);
    mq.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 10));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 10));
  const handleZoomReset = () => setZoom(100);
  const autoFillPendingRef = useRef(false);
  const autoFillOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (autoFillOpenTimeoutRef.current) {
        clearTimeout(autoFillOpenTimeoutRef.current);
      }
    };
  }, []);

  // Merge all sections into a single HTML string for the unified editor
  const companyName = activeCompanyRole?.companyName || '';
  // We need the company-document mention list to resolve "SOP-008"-style refs
  // to existing rows. This MUST stay enabled regardless of `disableSopMentions`,
  // which only controls the @mention suggestion popup and the AI chat — not
  // the reference-chip linking. Coupling the two caused existing references
  // (e.g. "SOP-MF-020 Labeling") to be rendered as "missing" and trigger the
  // create-reference dialog even when the document already exists.
  const refDocItems = useCompanyDocumentMentions(
    companyId || activeCompanyRole?.companyId,
    true,
  );
  const knownRefs = useMemo(() => {
    const m = new Map<string, { id?: string; name: string; ambiguous?: boolean }>();
    // Capture both legacy two-part (SOP-019) and three-part functional
    // sub-prefix (SOP-DE-019) formats. The optional middle group must be
    // 2–4 uppercase letters to mirror the chip-side regex above.
    const refRe = /\b([A-Z]{2,5}(?:-[A-Z]{2,4})?-\d{2,4})\b/;
    const addKey = (raw: string | undefined, id: string, name: string) => {
      if (!raw) return;
      const code = raw.trim().toUpperCase();
      const key = code.toLowerCase();
      const existing = m.get(key);
      if (!existing) {
        m.set(key, { id, name, ambiguous: false });
      } else if (existing.id && existing.id !== id) {
        m.set(key, { name: existing.name, ambiguous: true });
      }
      // Also index the two-part legacy fallback (SOP-DE-019 → SOP-019) so
      // older references in existing content still resolve.
      const parts = code.split('-');
      if (parts.length === 3) {
        const legacyKey = `${parts[0]}-${parts[2]}`.toLowerCase();
        const existingLegacy = m.get(legacyKey);
        if (!existingLegacy) {
          m.set(legacyKey, { id, name, ambiguous: false });
        } else if (existingLegacy.id && existingLegacy.id !== id) {
          m.set(legacyKey, { name: existingLegacy.name, ambiguous: true });
        }
      }
    };
    for (const it of refDocItems) {
      // Prefer the SSOT regulatory id when available, then fall back to
      // regex-extracting from hint/label.
      const fromMeta = (it as any).document_number || (it as any).document_reference;
      const fromHint = (it as any).hint?.match?.(refRe)?.[1];
      const fromLabel = it.label?.match?.(refRe)?.[1];
      addKey(fromMeta, it.id, it.name);
      addKey(fromHint, it.id, it.name);
      addKey(fromLabel, it.id, it.name);
      if (it.label && !m.has(it.label.toLowerCase())) {
        m.set(it.label.toLowerCase(), { id: it.id, name: it.name, ambiguous: false });
      }
    }
    return m;
  }, [refDocItems]);
  const mergedHtml = useMemo(
    () => annotateDocumentReferences(
      mergeSectionsToHtml(template?.sections || [], companyName, showSectionNumbers),
      knownRefs,
    ),
    [template?.sections, companyName, showSectionNumbers, knownRefs]
  );

  // State for the "create reference document" mini-dialog.
  const [createRefDialog, setCreateRefDialog] = useState<{
    open: boolean;
    refCode: string;
    title: string;
  }>({ open: false, refCode: '', title: '' });

  // Ref to access the editor from callbacks defined before useEditor
  const editorInstanceRef = useRef<any>(null);

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `editor-images/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('document-templates')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('document-templates')
        .getPublicUrl(filePath);
      const editor = editorInstanceRef.current;
      if (editor) {
        // Insert at current cursor position; if no selection, append at end
        if (editor.state.selection) {
          editor.chain().focus().setImage({ src: publicUrl }).run();
        } else {
          editor.chain().focus('end').setImage({ src: publicUrl }).run();
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  }, []);

  // Unified TipTap editor for the entire document
  const unifiedEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        hardBreak: {
          HTMLAttributes: { class: 'xyreg-line-break' },
        },
      }),
      TextStyle,
      FontSize,
      AIEditHighlightExtension,
      ImageWithDelete.configure({ inline: false, allowBase64: true }),
      // TableKit bundles Table + TableRow + TableHeader + TableCell.
      // resizable: true gives Google-Docs-style drag-to-resize columns.
      TableKit.configure({
        table: { resizable: true, HTMLAttributes: { class: 'xyreg-doc-table' } },
      }),
      MentionMark,
      PersonMentionMark,
      SmartChipMark,
      DocReferenceNode,
      Link.configure({
        // openOnClick is false because we handle clicks ourselves (new-tab on
        // plain click, like Google Docs). autolink wires URLs as the user types.
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        protocols: ['http', 'https', 'mailto', 'tel'],
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
          class: 'xyreg-link',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your document...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: mergedHtml || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] p-6 prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-800 prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-border prose-h1:pb-2 prose-h1:mt-8 prose-h1:mb-4 prose-h2:text-xl prose-h2:font-bold prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) handleImageUpload(file);
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: () => {
      // Refresh the outline panel on every edit.
      setRefreshTrigger(prev => prev + 1);
      // Skip autosave for updates caused by our own setContent calls (initial
      // load, AI auto-fill) and while the editor has not finished hydrating.
      if (programmaticUpdateRef.current || !editorInitializedRef.current) return;
      // Debounce: save 1.5s after the user stops typing. Bail if a save is
      // already in flight — the next edit will reschedule.
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        if (isSavingRef.current) return;
        // Re-run reference detection on the freshly edited HTML so that
        // newly typed tokens like "SOP-019 Calibration" flip into chips.
        // We diff before re-injecting to avoid a setContent → onUpdate loop.
        try {
          const ed = editorInstanceRef.current;
          if (ed) {
            const currentHtml = ed.getHTML();
            const annotated = annotateDocumentReferences(currentHtml, knownRefs);
            if (annotated !== currentHtml) {
              programmaticUpdateRef.current = true;
              const { from, to } = ed.state.selection;
              ed.commands.setContent(annotated);
              // Restore caret position best-effort.
              try { ed.commands.setTextSelection({ from, to }); } catch { /* noop */ }
              programmaticUpdateRef.current = false;
            }
          }
        } catch (err) {
          console.warn('[LiveEditor] live ref-annotation failed', err);
        }
        handleSaveRef.current?.(true);
      }, 1500);
    },
  });

  // Keep ref in sync so callbacks can access the editor
  editorInstanceRef.current = unifiedEditor;

  // ---------- @mention popup: Google Docs-style categorized picker ----------
  const docMentionItems = useCompanyDocumentMentions(
    companyId || activeCompanyRole?.companyId,
    !disableSopMentions,
  );
  const { users: companyUsers } = useCompanyUsers(companyId || activeCompanyRole?.companyId);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const [mentionCoords, setMentionCoords] = useState<{ left: number; top: number } | null>(null);
  // Submenu view: 'dropdown' shows preset dropdowns; 'placeholder' shows
  // document variables. null = main menu.
  const [mentionSubmenu, setMentionSubmenu] = useState<null | 'dropdown' | 'placeholder'>(null);
  // Range (in prosemirror positions) of the `@query` fragment to replace.
  const mentionRangeRef = useRef<{ from: number; to: number } | null>(null);

  // Values used to resolve placeholder variables at insertion time.
  const todayFormatted = useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    [],
  );
  const placeholderVariables = useMemo(
    () => [
      { key: 'var:company', variable: 'companyName', label: 'Company name', value: companyName || 'Company' },
      { key: 'var:document', variable: 'documentName', label: 'Document name', value: template?.name || 'Document' },
      { key: 'var:docref', variable: 'documentReference', label: 'Document reference', value: template?.documentControl?.sopNumber || 'SOP-000' },
      { key: 'var:version', variable: 'version', label: 'Version', value: template?.documentControl?.version || '1.0' },
      { key: 'var:today', variable: 'today', label: "Today's date", value: todayFormatted },
      { key: 'var:owner', variable: 'owner', label: 'Document owner', value: companyUsers.find((u) => u.is_owner)?.name || 'Owner' },
    ],
    [companyName, template?.name, template?.documentControl?.sopNumber, template?.documentControl?.version, todayFormatted, companyUsers],
  );

  const dropdownPresets = useMemo(
    () => [
      { key: 'preset:project-status', label: 'Project status', options: ['Not started', 'In progress', 'Complete'] },
      { key: 'preset:review-status', label: 'Review status', options: ['Draft', 'Under review', 'Approved'] },
      { key: 'preset:priority', label: 'Priority', options: ['Low', 'Medium', 'High'] },
    ],
    [],
  );

  const mentionSections = useMemo<MentionSection[]>(() => {
    const q = mentionQuery.trim().toLowerCase();
    const matches = (text: string) => !q || text.toLowerCase().includes(q);

    // --- Submenu: dropdown presets ---
    if (mentionSubmenu === 'dropdown') {
      const docDropdowns: MentionItem[] = [
        { key: 'dd:new', type: 'smart-chip', label: '+ New dropdown', icon: 'placeholder', disabled: true, payload: { action: 'new-dropdown' } },
      ];
      const presetItems: MentionItem[] = dropdownPresets
        .filter((p) => matches(p.label))
        .map((p) => ({
          key: p.key,
          type: 'smart-chip',
          label: p.label,
          hint: p.options.join(' · '),
          icon: 'dropdown',
          payload: { chipType: 'dropdown', value: p.options[0], options: p.options, presetName: p.label },
        }));
      const out: MentionSection[] = [];
      out.push({ id: 'smart-chips', title: '← Document dropdowns', items: docDropdowns });
      if (presetItems.length) out.push({ id: 'smart-chips', title: 'Preset dropdowns', items: presetItems });
      return out;
    }

    // --- Submenu: placeholder variables ---
    if (mentionSubmenu === 'placeholder') {
      const vars: MentionItem[] = placeholderVariables
        .filter((v) => matches(v.label))
        .map((v) => ({
          key: v.key,
          type: 'smart-chip',
          label: v.label,
          hint: v.value,
          icon: 'placeholder',
          payload: { chipType: 'placeholder', variable: v.variable, value: v.value },
        }));
      const customItems: MentionItem[] = [
        {
          key: 'var:custom',
          type: 'smart-chip',
          label: 'Custom text…',
          hint: "You'll be prompted for a value",
          icon: 'placeholder',
          payload: { chipType: 'placeholder', variable: 'custom' },
        },
      ];
      const out: MentionSection[] = [];
      if (vars.length) out.push({ id: 'smart-chips', title: '← Document variables', items: vars });
      out.push({ id: 'building-blocks', title: 'Other', items: customItems });
      return out;
    }

    // --- Main menu ---
    const peopleItems: MentionItem[] = companyUsers
      .filter((u) => matches(u.name) || matches(u.email))
      .slice(0, 8)
      .map((u) => ({
        key: `person:${u.id}`,
        type: 'person',
        label: u.name || u.email,
        hint: u.email,
        avatarUrl: u.avatar,
        avatarInitials: (u.name || u.email)
          .split(/\s+/)
          .map((s) => s[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        payload: { id: u.id, email: u.email, name: u.name || u.email },
      }));

    const docItems: MentionItem[] = docMentionItems
      .filter((d) => matches(d.label) || matches(d.value))
      .slice(0, 8)
      .map((d) => ({
        key: `doc:${d.id}`,
        type: 'document',
        label: d.label,
        hint: d.hint,
        payload: { id: d.id, slug: d.value, label: d.label },
      }));

    const smartChipItems: MentionItem[] = ([
      { key: 'chip:date', type: 'smart-chip' as const, label: 'Date', hint: "Insert today's date", icon: 'date' as const, payload: { chipType: 'date' } },
    ] satisfies MentionItem[]).filter((item) => matches(item.label));

    const sections: MentionSection[] = [];
    if (docItems.length) sections.push({ id: 'documents', title: 'Documents', items: docItems });
    if (peopleItems.length) sections.push({ id: 'people', title: 'People', items: peopleItems });
    if (smartChipItems.length) sections.push({ id: 'smart-chips', title: 'Smart chips', items: smartChipItems });
    return sections;
  }, [docMentionItems, companyUsers, mentionQuery, mentionSubmenu, dropdownPresets, placeholderVariables]);

  const selectableItems = useMemo(
    () => mentionSections.flatMap((s) => s.items).filter((i) => !i.disabled),
    [mentionSections],
  );

  useEffect(() => {
    if (mentionHighlight >= selectableItems.length) setMentionHighlight(0);
  }, [selectableItems.length, mentionHighlight]);

  const closeMention = useCallback(() => {
    setMentionOpen(false);
    setMentionQuery('');
    setMentionHighlight(0);
    setMentionCoords(null);
    setMentionSubmenu(null);
    mentionRangeRef.current = null;
  }, []);

  // ---------- Hover preview cards for doc/person mentions and hyperlinks ----------
  const [docHover, setDocHover] = useState<DocMentionHoverData | null>(null);
  const [personHover, setPersonHover] = useState<PersonMentionHoverData | null>(null);
  const [linkHover, setLinkHover] = useState<LinkHoverData | null>(null);
  const hoverCloseTimer = useRef<number | null>(null);
  // DOM node of the link currently being hovered — needed so Edit/Remove can
  // resolve the prosemirror position even though the caret hasn't moved there.
  const linkHoverElementRef = useRef<HTMLAnchorElement | null>(null);
  const navigate = useNavigate();

  const buildDocUrl = useCallback(
    (docName: string, docId?: string) => {
      const cName = companyName || activeCompanyRole?.companyName;
      if (!cName) return null;
      const qs = docId
        ? `n=${encodeURIComponent(docId)}`
        : `q=${encodeURIComponent(docName)}`;
      return `/app/company/${encodeURIComponent(cName)}/documents?${qs}`;
    },
    [companyName, activeCompanyRole?.companyName],
  );

  const navigateToDoc = useCallback(
    (docName: string, docId?: string) => {
      // If a draft drawer is currently mounted on the page, prefer opening
      // the referenced doc as a NEW TAB inside that drawer rather than
      // mutating the URL (which gets swallowed once the drawer is open and
      // can make 3rd+ tabs feel like "nothing happened"). The manager
      // listens for this event and calls its own `openDraft` directly.
      try {
        if (typeof window !== 'undefined') {
          const evt = new CustomEvent('xyreg:openDocumentDraft', {
            detail: { docId, docName },
            cancelable: true,
          });
          // dispatchEvent returns false only if a listener called
          // preventDefault — we treat that as "handled, don't navigate".
          const handled = !window.dispatchEvent(evt);
          if (handled) return;
        }
      } catch { /* fall through to URL navigation */ }
      const url = buildDocUrl(docName, docId);
      if (!url) return;
      navigate(url);
    },
    [buildDocUrl, navigate],
  );

  const parseInternalDocumentLink = useCallback((href: string) => {
    try {
      const parsed = new URL(href, window.location.origin);
      if (!/\/app\/company\/[^/]+\/documents/i.test(parsed.pathname)) return null;
      return {
        docId: parsed.searchParams.get('n') || parsed.searchParams.get('docId') || undefined,
        filter: parsed.searchParams.get('q') || parsed.searchParams.get('filter') || undefined,
      };
    } catch {
      return null;
    }
  }, []);

  // ---------- Hyperlink insert / edit flow ----------
  const openLinkDialog = useCallback(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    const isActive = editor.isActive('link');
    if (isActive) {
      // Cursor is inside an existing link — open in edit mode with prefilled values.
      const existing = editor.getAttributes('link')?.href || '';
      setLinkDialogUrl(existing);
      setLinkDialogText('');
      setLinkDialogMode('edit');
    } else {
      const { from, to } = editor.state.selection;
      const selected = editor.state.doc.textBetween(from, to, ' ');
      setLinkDialogUrl('');
      setLinkDialogText(selected);
      setLinkDialogMode('create');
    }
    setLinkDialogOpen(true);
  }, []);

  const normalizeUrl = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // Block dangerous protocols.
    if (/^\s*javascript:/i.test(trimmed) || /^\s*data:/i.test(trimmed)) return null;
    // Default to https:// if no protocol/scheme is present.
    if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
    if (/^[\w-]+@[\w-]+\.[\w.-]+$/.test(trimmed)) return `mailto:${trimmed}`;
    return `https://${trimmed}`;
  };

  const applyLinkFromDialog = useCallback(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    const href = normalizeUrl(linkDialogUrl);
    if (!href) {
      setLinkDialogOpen(false);
      return;
    }
    if (linkDialogMode === 'edit') {
      // Replace the existing link's href without changing the display text.
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    } else {
      const { from, to } = editor.state.selection;
      if (from === to) {
        // Nothing selected — insert the href text and mark it as a link.
        const displayText = (linkDialogText || href).trim() || href;
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: displayText,
            marks: [{ type: 'link', attrs: { href } }],
          })
          .run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
      }
    }
    setLinkDialogOpen(false);
    setLinkDialogUrl('');
    setLinkDialogText('');
  }, [linkDialogUrl, linkDialogText, linkDialogMode]);

  const removeLink = useCallback(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkDialogOpen(false);
  }, []);

  // Ctrl/Cmd+K opens the link dialog.
  useEffect(() => {
    const editor = unifiedEditor;
    if (!editor) return;
    const dom = editor.view.dom;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        openLinkDialog();
      }
    };
    dom.addEventListener('keydown', handler);
    return () => dom.removeEventListener('keydown', handler);
  }, [unifiedEditor, openLinkDialog]);

  // External links open in a new tab. Internal document links stay inside the
  // authenticated SPA so they don't bounce the user to the sandbox login page.
  useEffect(() => {
    const editorEl = editorContainerRef.current;
    if (!editorEl) return;
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a.xyreg-link, a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      // Ignore doc-mention spans that happen to be wrapped elsewhere.
      if (anchor.closest('[data-doc-mention]')) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      const internal = parseInternalDocumentLink(href);
      e.preventDefault();
      e.stopPropagation();
      if (internal) {
        navigateToDoc(internal.filter || (anchor.textContent || '').trim(), internal.docId || undefined);
        return;
      }
      // Before treating the href as an external URL, try to resolve a doc
      // reference code from the visible text (e.g. "SOP-QA-001 Quality
      // Management System"). AI-generated content often emits hrefs like
      // `#sop-qa-001` or even raw text that browsers can't navigate to —
      // resolving from the displayed code keeps these links working.
      const text = (anchor.textContent || '').trim();
      const refMatch = text.match(/\b([A-Z]{2,5}(?:-[A-Z]{2,4})?-\d{2,4})\b/);
      const refCode = refMatch?.[1] || '';
      if (refCode) {
        const known =
          knownRefs.get(refCode.toLowerCase()) ||
          knownRefs.get(refCode.replace(/^([A-Z]{2,5})-[A-Z]{2,4}-(\d{2,4})$/i, '$1-$2').toLowerCase());
        if (known) {
          navigateToDoc(refCode, known.ambiguous ? undefined : known.id);
          return;
        }
        // Reference code present but no matching doc — search for it.
        navigateToDoc(refCode);
        return;
      }
      // Genuine external URL — open in a new tab.
      if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    };
    editorEl.addEventListener('click', handler);
    return () => editorEl.removeEventListener('click', handler);
  }, [navigateToDoc, parseInternalDocumentLink, knownRefs]);

  // Map docId → owner name. `useCompanyUsers` already fetched company teammates.
  const companyOwnerName = useMemo(() => {
    const owner = companyUsers.find((u) => u.is_owner);
    return owner?.name || owner?.email || undefined;
  }, [companyUsers]);

  // Resolve user metadata for a person-mention chip by id/email lookup into
  // the already-fetched company users list.
  const resolvePersonFromChip = useCallback(
    (chip: HTMLElement): PersonMentionHoverData | null => {
      const id = chip.getAttribute('data-id');
      const emailAttr = chip.getAttribute('data-email');
      const name = (chip.textContent || '').trim();
      const match = companyUsers.find(
        (u) => (id && u.id === id) || (emailAttr && u.email === emailAttr) || u.name === name,
      );
      const rect = chip.getBoundingClientRect();
      return {
        userId: id,
        name: match?.name || name || 'User',
        email: match?.email || emailAttr || undefined,
        role: match?.role,
        department: match?.department,
        avatarUrl: match?.avatar,
        coords: { left: rect.left, top: rect.bottom + 6 },
      };
    },
    [companyUsers],
  );

  useEffect(() => {
    const editorEl = editorContainerRef.current;
    if (!editorEl) return;

    const clearTimer = () => {
      if (hoverCloseTimer.current) {
        window.clearTimeout(hoverCloseTimer.current);
        hoverCloseTimer.current = null;
      }
    };

    const handleOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const doc = el.closest?.('[data-doc-mention]') as HTMLElement | null;
      const person = el.closest?.('[data-person-mention]') as HTMLElement | null;
      const link = el.closest?.('a.xyreg-link, a[href]') as HTMLAnchorElement | null;

      if (doc) {
        clearTimer();
        const rect = doc.getBoundingClientRect();
        setDocHover({
          docId: doc.getAttribute('data-id'),
          docName: doc.textContent || 'Document',
          ownerName: companyOwnerName,
          coords: { left: rect.left, top: rect.bottom + 6 },
        });
        setPersonHover(null);
        setLinkHover(null);
        return;
      }
      if (person) {
        clearTimer();
        setPersonHover(resolvePersonFromChip(person));
        setDocHover(null);
        setLinkHover(null);
        return;
      }
      if (link && !link.closest('[data-doc-mention]')) {
        clearTimer();
        const rect = link.getBoundingClientRect();
        const href = link.getAttribute('href') || '';
        if (href) {
          linkHoverElementRef.current = link;
          setLinkHover({ href, coords: { left: rect.left, top: rect.bottom + 6 } });
          setDocHover(null);
          setPersonHover(null);
        }
      }
    };

    const handleOut = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const over =
        el.closest?.('[data-doc-mention]') ||
        el.closest?.('[data-person-mention]') ||
        el.closest?.('a.xyreg-link, a[href]');
      if (!over) return;
      clearTimer();
      // Small delay so the user can move the cursor onto the card itself.
      hoverCloseTimer.current = window.setTimeout(() => {
        setDocHover(null);
        setPersonHover(null);
        setLinkHover(null);
      }, 150);
    };

    const handleClick = (e: MouseEvent) => {
      // Missing reference chip → open create dialog (intercept before doc-mention).
      const missing = (e.target as HTMLElement | null)?.closest?.(
        '[data-doc-ref][data-state="missing"]',
      ) as HTMLElement | null;
      if (missing) {
        e.preventDefault();
        e.stopPropagation();
        const refCode = missing.getAttribute('data-ref-code') || '';
        const fullText = (missing.textContent || '').trim();
        const title = fullText.replace(refCode, '').replace(/^[\s:\-]+/, '').trim();
        setCreateRefDialog({ open: true, refCode, title });
        return;
      }
      // Linked reference chip → open the existing document.
      const linked = (e.target as HTMLElement | null)?.closest?.(
        '[data-doc-ref][data-state="linked"]',
      ) as HTMLElement | null;
      if (linked) {
        e.preventDefault();
        e.stopPropagation();
        // Prefer the resolved doc id captured at chip-render time so we open
        // the exact row that satisfied the reference, not a name-match guess.
        const id = linked.getAttribute('data-id') || '';
        const refCode = linked.getAttribute('data-ref-code') || '';
        navigateToDoc(refCode || linked.textContent || '', id || undefined);
        return;
      }
      // Plain <a> anchors that round-tripped without becoming chips. The
      // browser ignores anchor clicks inside contenteditable, so we manually
      // route them. Two cases:
      //   1. href points at our own /documents route → re-route through
      //      navigateToDoc so it opens in a new tab with the right param.
      //   2. href is empty / "#" but the visible text matches a known
      //      reference code → resolve via knownRefs and open that doc.
      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute('href') || '';
        const text = (anchor.textContent || '').trim();
        // Try to match a reference code in the visible text (e.g. "SOP-QA-021 Complaints").
        const refMatch = text.match(/\b([A-Z]{2,5}(?:-[A-Z]{2,4})?-\d{2,4})\b/);
        const refCode = refMatch?.[1] || '';
        const known = refCode
          ? knownRefs.get(refCode.toLowerCase()) ||
            knownRefs.get(refCode.replace(/^([A-Z]{2,5})-[A-Z]{2,4}-(\d{2,4})$/i, '$1-$2').toLowerCase())
          : undefined;
        const internal = parseInternalDocumentLink(href);
        if (known || internal) {
          e.preventDefault();
          e.stopPropagation();
          // Stop the sibling bubble-phase anchor handler (line ~1614) from
          // also processing this click and double-navigating.
          e.stopImmediatePropagation();
          navigateToDoc(
            refCode || internal?.filter || text,
            known?.ambiguous ? undefined : known?.id || internal?.docId || undefined,
          );
          return;
        }
        // External link → let LinkHoverCard handle it; nothing to do here.
      }
      const target = (e.target as HTMLElement | null)?.closest?.('[data-doc-mention]') as HTMLElement | null;
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      const docName = target.textContent || '';
      navigateToDoc(docName);
    };

    // Suppress ProseMirror's selection / bubble-menu when the click lands on a
    // doc-reference chip or an internal-doc anchor. Without this, a click on
    // `SOP-DE-011` only opens the floating Edit toolbar — the chip's own
    // click handler never wins because PM has already preventDefault'd.
    const handleMouseDownCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const chip = target.closest('[data-doc-ref]');
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (chip) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (anchor) {
        const href = anchor.getAttribute('href') || '';
        const text = (anchor.textContent || '').trim();
        const looksLikeRef = /\b[A-Z]{2,5}(?:-[A-Z]{2,4})?-\d{2,4}\b/.test(text);
        if (looksLikeRef || parseInternalDocumentLink(href)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    editorEl.addEventListener('mouseover', handleOver);
    editorEl.addEventListener('mouseout', handleOut);
    editorEl.addEventListener('mousedown', handleMouseDownCapture, true);
    editorEl.addEventListener('click', handleClick, true);
    return () => {
      editorEl.removeEventListener('mouseover', handleOver);
      editorEl.removeEventListener('mouseout', handleOut);
      editorEl.removeEventListener('mousedown', handleMouseDownCapture, true);
      editorEl.removeEventListener('click', handleClick, true);
      clearTimer();
    };
  }, [companyOwnerName, navigateToDoc, parseInternalDocumentLink, resolvePersonFromChip, knownRefs]);

  const cancelHoverClose = useCallback(() => {
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  }, []);
  const scheduleHoverClose = useCallback(() => {
    if (hoverCloseTimer.current) window.clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = window.setTimeout(() => {
      setDocHover(null);
      setPersonHover(null);
      setLinkHover(null);
    }, 150);
  }, []);

  const insertMentionAtRange = useCallback(
    (item: MentionItem) => {
      if (item.disabled) return;

      // Intercept submenu-navigation items before inserting anything.
      if (item.payload?.action === 'open-dropdown-submenu') {
        setMentionSubmenu('dropdown');
        setMentionQuery('');
        setMentionHighlight(0);
        return;
      }
      if (item.payload?.action === 'open-placeholder-submenu') {
        setMentionSubmenu('placeholder');
        setMentionQuery('');
        setMentionHighlight(0);
        return;
      }

      const editor = editorInstanceRef.current;
      const range = mentionRangeRef.current;
      if (!editor || !range) return;
      const docSize = editor.state.doc.content.size;
      const safeRange = {
        from: Math.max(0, Math.min(range.from, docSize)),
        to: Math.max(0, Math.min(range.to, docSize)),
      };

      // Figure out the text to insert and which mark to attach.
      let text: string;
      let markName: 'docMention' | 'personMention' | 'smartChip';
      let markAttrs: Record<string, any> = {};

      if (item.type === 'document') {
        text = item.label;
        markName = 'docMention';
        markAttrs = { id: item.payload?.id ?? null, slug: item.payload?.slug ?? null };
      } else if (item.type === 'person') {
        text = item.label;
        markName = 'personMention';
        markAttrs = { id: item.payload?.id ?? null, email: item.payload?.email ?? null };
      } else if (item.type === 'smart-chip') {
        const chipType = item.payload?.chipType || 'placeholder';
        if (chipType === 'date') {
          text = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          markAttrs = { chipType };
        } else if (chipType === 'dropdown') {
          // Dropdown preset: text = default value, options stored on the mark.
          text = `${item.payload?.value || 'Select option'} ▾`;
          markAttrs = { chipType };
        } else {
          // Placeholder: if bound to a variable, resolve it now; if 'custom',
          // prompt for text. Text shows bracketed so it reads as a fillable.
          const varName: string | undefined = item.payload?.variable;
          if (varName === 'custom') {
            // eslint-disable-next-line no-alert
            const custom = window.prompt('Placeholder text:', '');
            if (custom === null) return; // cancelled
            text = `{${custom || 'Placeholder'}}`;
            markAttrs = { chipType, variable: 'custom' };
          } else {
            const resolved = item.payload?.value || 'Placeholder';
            text = `{${resolved}}`;
            markAttrs = { chipType, variable: varName ?? null };
          }
        }
        markName = 'smartChip';
      } else {
        return;
      }

      // Use a prosemirror transaction directly — the chain()+setMark approach
      // occasionally loses the mark when the insertion sits next to another
      // mention. Building the text node with the mark attached guarantees it
      // lands on the document.
      const schema = editor.schema;
      const markType = schema.marks[markName];
      if (!markType) return;

      const mark = markType.create(markAttrs);
      const textNode = schema.text(text, [mark]);
      const tr = editor.state.tr;
      tr.replaceRangeWith(safeRange.from, safeRange.to, textNode);
      const afterText = safeRange.from + text.length;
      // Trailing plain space (no mark) so the caret lands outside the chip.
      tr.insertText(' ', afterText);
      // Move caret after the space.
      tr.setSelection(TextSelection.create(tr.doc, afterText + 1));
      editor.view.dispatch(tr);
      editor.view.focus();
      closeMention();
    },
    [closeMention],
  );

  // Watch the editor for a `@` token at the caret and position the popup.
  useEffect(() => {
    const editor = unifiedEditor;
    if (!editor) return;

    const update = () => {
      const { state, view } = editor;
      const { selection } = state;
      if (!selection.empty) {
        closeMention();
        return;
      }
      const from = selection.from;
      const $from = state.doc.resolve(from);
      const textBefore = $from.parent.textBetween(
        Math.max(0, $from.parentOffset - 50),
        $from.parentOffset,
        undefined,
        '\ufffc',
      );
      const match = textBefore.match(/(?:^|\s)@([\w-]*)$/);
      if (!match) {
        closeMention();
        return;
      }
      const query = match[1];
      const tokenStart = from - (match[0].length - (match[0].startsWith('@') ? 0 : 1));
      mentionRangeRef.current = { from: tokenStart, to: from };
      setMentionQuery(query);
      setMentionOpen(true);
      try {
        const coords = view.coordsAtPos(tokenStart);
        setMentionCoords({ left: coords.left, top: coords.bottom + 4 });
      } catch {
        setMentionCoords(null);
      }
    };

    editor.on('selectionUpdate', update);
    editor.on('update', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('update', update);
    };
  }, [unifiedEditor, closeMention]);

  // Arrow keys / Enter / Escape navigation on the popup. Uses the editor view's
  // DOM so keys pressed while focus is inside the editor still reach us.
  useEffect(() => {
    if (!mentionOpen) return;
    const dom = unifiedEditor?.view.dom;
    if (!dom) return;
    const handler = (e: KeyboardEvent) => {
      if (!selectableItems.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionHighlight((h) => (h + 1) % selectableItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionHighlight((h) => (h - 1 + selectableItems.length) % selectableItems.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMentionAtRange(selectableItems[mentionHighlight]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // In a submenu, Escape returns to the main menu instead of closing.
        if (mentionSubmenu) {
          setMentionSubmenu(null);
          setMentionQuery('');
          setMentionHighlight(0);
        } else {
          closeMention();
        }
      }
    };
    dom.addEventListener('keydown', handler, true);
    return () => dom.removeEventListener('keydown', handler, true);
  }, [mentionOpen, selectableItems, mentionHighlight, unifiedEditor, insertMentionAtRange, closeMention, mentionSubmenu]);

  // Handler for AI-generated content being pasted into the editor.
  // mode='replace' deletes the existing section body (between the matching h2
  // and the next h2) before inserting; 'insert' (default) appends to the first
  // empty paragraph in the section, matching the pre-diff behavior.
  const handleApplyAIContent = useCallback((content: string, sectionName?: string, mode: 'insert' | 'replace' = 'insert') => {
    if (!unifiedEditor) return;
    // Use the shared markdown→HTML converter, which wraps each block in <p>.
    // Without paragraph wrapping, plain text inserted at a position adjacent
    // to a section H2 inherits the heading's block type and renders the body
    // text as bold/H2 heading text.
    let html = markdownToHtml(content);
    if (html && !/^\s*<(p|ul|ol|h[1-6]|table|blockquote|pre|div)\b/i.test(html)) {
      html = `<p>${html}</p>`;
    }

    const editorEl = editorContainerRef.current;
    if (editorEl && sectionName && mode === 'replace') {
      const headings = editorEl.querySelectorAll('h2');
      for (const h2 of Array.from(headings)) {
        const headingText = h2.textContent?.trim().replace(/^\d+\.\d+\s*/, '') || '';
        if (headingText.toLowerCase() !== sectionName.toLowerCase()) continue;

        // Walk siblings until the next h2 to find the replacement range.
        let last: Element = h2;
        let el = h2.nextElementSibling;
        while (el && el.tagName !== 'H2') {
          last = el;
          el = el.nextElementSibling;
        }
        try {
          const from = unifiedEditor.view.posAtDOM(h2.nextElementSibling || last, 0);
          const afterLast = unifiedEditor.view.posAtDOM(last, 0) + (last.textContent?.length || 0) + 1;
          const to = Math.max(from, afterLast);
          unifiedEditor.chain().focus().deleteRange({ from, to }).insertContentAt(from, html).run();
          return;
        } catch { /* fall through to insert-at-end */ }
      }
    }

    if (editorEl) {
      const headings = editorEl.querySelectorAll('h2');
      if (sectionName) {
        for (const h2 of Array.from(headings)) {
          const headingText = h2.textContent?.trim().replace(/^\d+\.\d+\s*/, '') || '';
          if (headingText.toLowerCase() === sectionName.toLowerCase()) {
            const next = h2.nextElementSibling;
            if (next) {
              try {
                const pos = unifiedEditor.view.posAtDOM(next, 0);
                unifiedEditor.chain().focus().setTextSelection(pos).insertContent(html).run();
                return;
              } catch { /* fall through */ }
            }
          }
        }
      }
      for (const h2 of Array.from(headings)) {
        const next = h2.nextElementSibling;
        if (next && next.tagName === 'P' && (!next.textContent?.trim())) {
          try {
            const pos = unifiedEditor.view.posAtDOM(next, 0);
            unifiedEditor.chain().focus().setTextSelection(pos).insertContent(html).run();
            return;
          } catch { /* fall through */ }
        }
      }
    }
    unifiedEditor.chain().focus('end').insertContent(html).run();
  }, [unifiedEditor]);

  // Track the template ID and sections content to detect external changes
  const lastTemplateIdRef = useRef(template?.id);
  const lastSectionsJsonRef = useRef<string>('');
  const lastNumberingRef = useRef(showSectionNumbers);
  const editorInitializedRef = useRef(false);

  // Autosave plumbing: debounced save on user edits. `programmaticUpdateRef`
  // suppresses the save when we ourselves set content (e.g. initial hydration,
  // AI auto-fill). `handleSaveRef` lets `onUpdate` — defined before handleSave —
  // call the latest handleSave without stale closures.
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmaticUpdateRef = useRef(false);
  const handleSaveRef = useRef<(silent?: boolean) => Promise<void> | void>(() => {});
  const isSavingRef = useRef(false);

  // Set editor content when editor becomes ready, when switching documents,
  // or when sections are updated externally (e.g. AI Auto-Fill)
  useEffect(() => {
    if (!unifiedEditor) return;

    const rawHtml = mergeSectionsToHtml(template?.sections || [], companyName, showSectionNumbers);
    const newHtml = annotateDocumentReferences(rawHtml, knownRefs);
    // Build a lightweight fingerprint of sections content to detect external changes
    const sectionsJson = JSON.stringify(
      (template?.sections || []).map((s: any) => ({
        id: s.id,
        title: s.customTitle || s.title,
        content: (Array.isArray(s.content) ? s.content : []).map((c: any) => c.content).join(''),
      }))
    );

    const isNewDocument = template?.id !== lastTemplateIdRef.current;
    const isSectionsChanged = sectionsJson !== lastSectionsJsonRef.current;
    const isNumberingChanged = lastNumberingRef.current !== showSectionNumbers;
    const shouldSetContent =
      !editorInitializedRef.current || isNewDocument || isNumberingChanged || (isSectionsChanged && !unifiedEditor.isFocused);

    if (shouldSetContent) {
      editorInitializedRef.current = true;
      lastTemplateIdRef.current = template?.id;
      lastSectionsJsonRef.current = sectionsJson;
      lastNumberingRef.current = showSectionNumbers;
      // Mark this update as programmatic so onUpdate does not schedule an
      // autosave for a content replacement we initiated ourselves.
      programmaticUpdateRef.current = true;
      unifiedEditor.commands.setContent(newHtml);
      // setContent fires onUpdate synchronously; clear on next tick so real
      // user keystrokes that land after are treated as edits.
      setTimeout(() => { programmaticUpdateRef.current = false; }, 0);
      setRefreshTrigger(prev => prev + 1);
    }
  }, [template?.id, template?.sections, companyName, unifiedEditor, showSectionNumbers, knownRefs]);

  // Re-annotation pass: if a draft was saved before reference chips existed,
  // its stored HTML is plain text. Re-run when `knownRefs` changes so chips
  // that were initially marked missing can upgrade to linked once lookup data
  // arrives.
  useEffect(() => {
    if (!unifiedEditor) return;
    if (!editorInitializedRef.current) return;
    try {
      const currentHtml = unifiedEditor.getHTML();
      const annotated = annotateDocumentReferences(currentHtml, knownRefs);
      if (annotated !== currentHtml) {
        programmaticUpdateRef.current = true;
        unifiedEditor.commands.setContent(annotated);
        setTimeout(() => { programmaticUpdateRef.current = false; }, 0);
      }
    } catch (err) {
      console.warn('[LiveEditor] ref-annotation failed', err);
    }
  }, [unifiedEditor, knownRefs, refreshTrigger]);

  // Auto-open the draft empty-state modal (Generate Manually / Auto-fill by AI
  // / Copy from SOP) when the draft has no filled sections. Fires once per
  // template id per mount — the guard ref is set unconditionally on first
  // eligible run so that parent re-renders (which often pass a new `sections`
  // array reference with the same contents) don't re-fire this.
  useEffect(() => {
    const templateId = template?.id;
    const sections = template?.sections || [];
    if (!templateId || sections.length === 0) return;
    if (emptyStateOpenedForTemplateRef.current === templateId) return;
    emptyStateOpenedForTemplateRef.current = templateId;

    const allEmpty = sections.every((s: any) => {
      const items = Array.isArray(s.content) ? s.content : [];
      // Ignore scaffolding-only content types — a draft isn't "filled" until
      // there's real body text somewhere.
      const bodyItems = items.filter(
        (it: any) => it && it.type !== 'heading' && it.type !== 'table',
      );
      if (bodyItems.length === 0) return true;
      return bodyItems.every((it: any) => {
        const raw = (it.content || '').trim();
        if (!raw || raw === '[AI_PROMPT_NEEDED]') return true;
        // Strip HTML tags and &nbsp;'s — a seeded `<p></p>` or `<p>&nbsp;</p>`
        // should still count as empty.
        const textOnly = raw.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        return textOnly === '';
      });
    });

    if (allEmpty) {
      setShowEmptyStateModal(true);
    }
  }, [template?.id, template?.sections?.length]);

  const handleEmptyStateAutoFill = useCallback(() => {
    setShowEmptyStateModal(false);
    setShowAutoFillDialog(true);
  }, []);

  const handleEmptyStateCopyFromSOP = useCallback(() => {
    setShowEmptyStateModal(false);
    setShowSopPickerModal(true);
  }, []);

  // Keep the ProseMirror highlight decoration in sync with the popover state.
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    if (inlineAIEdit) {
      setAIEditHighlight(editor, { from: inlineAIEdit.from, to: inlineAIEdit.to });
    } else {
      setAIEditHighlight(editor, null);
    }
    return () => setAIEditHighlight(editor, null);
  }, [inlineAIEdit]);

  const handleSOPSelected = useCallback((sop: SOPFullContent) => {
    const sections = sopContentToSections(sop);
    onContentUpdate?.('full-document-content', JSON.stringify(sections));
    toast.success(`Copied content from ${sop.sopNumber}`);
  }, [onContentUpdate]);

  // Bubble-menu action: push the current selection into the AI chat panel
  // as a context chip with from/to positions so the applier can replace the
  // exact span when the AI proposes a span-rewrite.
  const handleAddSelectionToChat = useCallback(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, '\n').trim();
    if (!text) return;
    setRightPanelOpen(true);
    setNarrowRightOpen(true);
    // Defer so a newly-mounted RightPanel / DocumentAIChatPanel has time to
    // attach their window-event listeners before we dispatch.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('xyreg:open-ai-panel'));
      window.dispatchEvent(
        new CustomEvent('xyreg:ai-chat-quote', { detail: { text, from, to } }),
      );
    }, 30);
  }, []);

  // Bubble-menu action: capture selection snapshot and open the inline AI
  // edit popover. Uses the click target's bounding rect as anchor — rock-solid
  // even if the DOM selection was collapsed by the button click. Falls back
  // to coordsAtPos when the button rect isn't provided.
  const handleOpenInlineAIEdit = useCallback((buttonRect?: DOMRect) => {
    if (!aiInlineSuggestionsEnabled) return;
    const editor = editorInstanceRef.current;
    if (!editor) {
      toast.error('Editor not ready');
      return;
    }
    const { from, to } = editor.state.selection;
    if (from === to) {
      toast.error('Please select some text first');
      return;
    }
    const text = editor.state.doc.textBetween(from, to, '\n');
    let rect: { top: number; bottom: number; left: number; right: number };
    if (buttonRect) {
      rect = {
        top: buttonRect.top,
        bottom: buttonRect.bottom,
        left: buttonRect.left,
        right: buttonRect.right,
      };
    } else {
      try {
        const sc = editor.view.coordsAtPos(from);
        const ec = editor.view.coordsAtPos(to);
        rect = {
          top: Math.min(sc.top, ec.top),
          bottom: Math.max(sc.bottom, ec.bottom),
          left: Math.min(sc.left, ec.left),
          right: Math.max(sc.right, ec.right),
        };
      } catch {
        rect = { top: 100, bottom: 120, left: 100, right: 500 };
      }
    }
    setInlineAIEdit({
      text,
      html: text,
      from,
      to,
      anchorRect: rect,
    });
  }, [aiInlineSuggestionsEnabled]);

  // Check for existing document ID when template changes
  useEffect(() => {
    const checkExistingDocument = async () => {
      if (!template?.id || !activeCompanyRole?.companyId) return;

      try {
        const { data: existingDocs } = await supabase
          .from('document_studio_templates')
          .select('id')
          .eq('company_id', activeCompanyRole.companyId)
          .eq('template_id', template.id)
          .limit(1);

        if (existingDocs && existingDocs.length > 0) {
          setCurrentDocumentId(existingDocs[0].id);
        }
      } catch (error) {
        console.error('Error checking existing document:', error);
      }
    };

    checkExistingDocument();
    const cleanName = (template?.name || '').replace(/^[A-Z]{2,6}-\d{3}\s+/, '');
    setEditedTitle(cleanName);
  }, [template?.id, template?.name, activeCompanyRole?.companyId, documentNumber]);

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== template?.name) {
      onContentUpdate?.('document-title', editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    const cleanName = (template?.name || '').replace(/^[A-Z]{2,6}-\d{3}\s+/, '');
    setEditedTitle(cleanName);
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };
  
  const handleSaveVersion = () => {
    if (!currentDocumentId && !editingDocumentId) {
      toast.error('No document selected. Please save a draft first.');
      return;
    }
    setTimeout(() => setShowSaveVersionDialog(true), 0);
  };

  const handleVersionSaved = () => {
    // Refresh version modal if it's open
    if (showVersionModal) {
      setRefreshTrigger(prev => prev + 1);
    }
    // Trigger parent refresh
    onDocumentSaved?.();
  };

  const handleShowVersions = () => {
    if (!currentDocumentId) {
      toast.error('No document selected. Please save a draft first.');
      return;
    }
    setTimeout(() => setShowVersionModal(true), 0);
  };

  const handleVersionRestore = () => {
    // Notify parent to reload the document after version restore
    // This will trigger document list refresh and template reload
    onDocumentSaved?.();
  };

  const handleContentUpdate = (contentId: string, newContent: string) => {
    onContentUpdate?.(contentId, newContent);
  };

  const handleAIIconClick = (section: any) => {
    // Get current content from the section
    const currentContent = (Array.isArray(section.content) ? section.content : []).map((item: any) => item.content).join('\n') || '';
    // Push context to store so Professor Xyreg can see it
    documentContextStore.set({ sectionTitle: section.title, content: currentContent });

    // Track the exact content block to update
    const targetItem = (Array.isArray(section.content) ? section.content : []).find((c: any) => c.type !== 'heading') || section.content?.[0];
    setAiTargetContentId(targetItem?.id || null);

    // If section has meaningful content, show inline edit bar instead of full modal
    const hasContent = currentContent.trim().length > 0 && currentContent !== '[AI_PROMPT_NEEDED]';
    if (hasContent) {
      setShowDocumentAIBar(false); // Close document-level bar
      setSelectedSection({ title: section.title, content: currentContent });
      setInlineEditSectionId(section.id);
    } else {
      setSelectedSection({ title: section.title, content: currentContent });
      setShowAIModal(true);
    }
  };


  const openAutoFillSafely = () => {
    if (!aiAutoFillEnabled) return;
    setShowDocumentAIBar(false);

    if (autoFillOpenTimeoutRef.current) {
      clearTimeout(autoFillOpenTimeoutRef.current);
    }

    autoFillOpenTimeoutRef.current = setTimeout(() => {
      setShowAutoFillDialog(true);
      autoFillOpenTimeoutRef.current = null;
    }, 0);
  };

  const handleAIContentGenerated = (newContent: string) => {
    // Insert AI-generated content into the unified editor at cursor position
    if (unifiedEditor) {
      unifiedEditor.chain().focus().insertContent(newContent).run();
    }
    setShowAIModal(false);
    setSelectedSection(null);
  };

  // Sync editor content back to parent (called before save and on blur)
  const syncEditorToParent = useCallback(() => {
    if (!unifiedEditor || !onContentUpdate) return;
    const html = unifiedEditor.getHTML();
    const updatedSections = parseHtmlToSections(html, template?.sections || []);
    onContentUpdate('full-document-content', JSON.stringify(updatedSections));
    return updatedSections;
  }, [unifiedEditor, onContentUpdate, template?.sections]);

  const handleSave = async (silent: boolean = false) => {
    // If parent wants to handle save (e.g. CI-first flow), delegate entirely
    if (onCustomSave) {
      // Sync editor content first so parent has latest data
      syncEditorToParent();
      onCustomSave();
      return;
    }

    try {
      if (!activeCompanyRole?.companyId) {
        if (!silent) toast.error('Company information not available');
        return;
      }

      // For uploaded documents, prevent duplicate saves
      if (isUploadedDocument && uploadedDocumentSaved) {
        if (!silent) {
          toast.info('This uploaded document has already been saved', {
            description: 'You can edit it from the My Documents list'
          });
        }
        return;
      }
      isSavingRef.current = true;
      if (silent) {
        if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
        setSaveStatus('saving');
      }

      // Sync editor content to get latest sections
      const latestSections = unifiedEditor
        ? parseHtmlToSections(unifiedEditor.getHTML(), template?.sections || [])
        : template.sections;

      // Also sync to parent so state is consistent
      if (onContentUpdate && unifiedEditor) {
        onContentUpdate('full-document-content', JSON.stringify(latestSections));
      }

      // Use the editing document ID only when an actual studio draft row exists;
      // otherwise `editingDocumentId` may carry an unrelated CI UUID and force a
      // 0-row UPDATE (PGRST116). `currentDocumentId` is populated after the first
      // successful INSERT and safely round-trips on subsequent saves.
      const existingDocumentId = isEditingExistingDocument
        ? (editingDocumentId || currentDocumentId)
        : currentDocumentId;
      const isUpdate = !!existingDocumentId;

      // Add automatic note to document
      const noteMessage = isUpdate ? 'This document is updated' : 'This document is saved';
      const autoNote = {
        id: `auto-note-${Date.now()}`,
        content: noteMessage,
        timestamp: new Date(),
        type: 'note' as const
      };

      // Add note to current notes list
      const updatedNotes = [autoNote, ...currentNotes];

      // Convert template to DocumentStudioData format (now including notes)
      const documentData = {
        id: existingDocumentId || undefined, // Include document ID if editing
        company_id: activeCompanyRole.companyId,
        product_id: selectedScope === 'product' ? selectedProductId : undefined,
        template_id: template.id,
        name: template.name,
        type: template.type,
        sections: latestSections,
        product_context: template.productContext,
        document_control: template.documentControl,
        revision_history: template.revisionHistory || [],
        associated_documents: template.associatedDocuments || [],
        metadata: template.metadata || {},
        notes: updatedNotes // Include the updated notes with the auto-note
      };

      const result = await DocumentStudioPersistenceService.saveTemplate(documentData);

      if (result.success) {
        // Store the document ID for version tracking
        setCurrentDocumentId(result.id || null);

        // Mark uploaded document as saved. Skip during silent autosaves because
        // the parent often transitions UI state (closes modal, redirects to the
        // saved record) on this callback — not what we want mid-edit.
        if (isUploadedDocument && !uploadedDocumentSaved && !silent) {
          onUploadedDocumentSaved?.();
        }

        if (!silent) {
          const scopeLabel = selectedScope === 'product' ? 'Device Documents' : 'Company Documents';
          const successMessage = existingDocumentId ? 'Document updated successfully!' : 'Draft saved successfully!';
          toast.success(successMessage, {
            description: `Your document is now available in My Documents and ${scopeLabel}`
          });
        }

        // Add note through parent handler to update UI immediately
        // (skip the auto-note spam during silent autosaves).
        if (onAddAutoNote && !silent) {
          onAddAutoNote(autoNote);
        }

        // Silent autosaves must not fire parent callbacks that might close the
        // editing modal or re-navigate. Only manual saves propagate.
        if (!silent) {
          onDocumentSaved?.();
        }

        if (silent) {
          setSaveStatus('saved');
          if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
          savedFadeTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } else {
        throw new Error(result.error || 'Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      if (!silent) {
        toast.error('Failed to save draft', {
          description: 'Please try again or check your connection'
        });
      } else {
        setSaveStatus('error');
        if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
        savedFadeTimerRef.current = setTimeout(() => setSaveStatus('idle'), 4000);
      }
    } finally {
      isSavingRef.current = false;
    }
  };

  // Keep the ref in sync so the TipTap onUpdate closure always calls the
  // latest handleSave (closures in useEditor would otherwise go stale).
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  // Clean up any pending autosave / fade timers when the editor unmounts so we
  // don't fire a save against a stale document or flip state after navigation.
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
    };
  }, []);

  const handleDownload = async () => {
    try {
      const { DocumentExportService } = await import('@/services/documentExportService');
      
      const cleanName = (template.name || '').replace(/^[A-Z]{2,6}-\d{3}\s+/, '');
      const composedName = documentNumber ? `${documentNumber} ${cleanName}` : cleanName;
      const filename = `${composedName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      
      const exportTemplate = {
        ...template,
        documentControl: {
          ...template.documentControl,
          sopNumber: documentNumber || template.documentControl?.sopNumber || '',
        }
      };
      await DocumentExportService.exportDocument(exportTemplate, {
        format: 'docx',
        includeHighlighting: true,
        filename,
        companyLogoUrl,
        companyName: activeCompanyRole?.companyName || '',
      });
      
      toast.success(`Document exported as Word (.docx) file!`, {
        description: `Check your Downloads folder for ${filename}`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error exporting document:', error);
      toast.error('Failed to export document', {
        description: 'Please try again or check console for details.'
      });
    }
  };

  const handleShare = async () => {
    try {
      const { DocumentExportService } = await import('@/services/documentExportService');
      const shareUrl = await DocumentExportService.shareDocument(template, 'link');
      toast.success('Share link created!');
    } catch (error) {
      console.error('Error sharing document:', error);
      toast.error('Failed to create share link');
    }
  };

  // Register header action handlers with the parent (DocumentDraftDrawer)
  // so the action icons can render in the drawer's top header instead of
  // a redundant secondary header row inside LiveEditor.
  useEffect(() => {
    if (!onRegisterHeaderActions) return;
    onRegisterHeaderActions({
      aiAutoFillEnabled: !!aiAutoFillEnabled,
      onOpenAutoFill: () => openAutoFillSafely(),
      onValidate: () => setShowValidationDialog(true),
      onDownload: () => { handleDownload(); },
      onPushToDeviceFields: onPushToDeviceFields,
      onShare: () => { handleShare(); },
      onSaveVersion: () => handleSaveVersion(),
      onShowVersions: () => handleShowVersions(),
      hideVersioning,
    });
    return () => onRegisterHeaderActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiAutoFillEnabled, hideVersioning, onPushToDeviceFields, onRegisterHeaderActions]);

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Formatting Toolbar */}
      {unifiedEditor && (
        <div className="border-b bg-background px-4 py-1.5 flex items-center gap-1 flex-wrap sticky top-0 z-10">
          <Button
            variant={unifiedEditor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => unifiedEditor.chain().focus().toggleBold().run()}
            className="h-7 w-7 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={unifiedEditor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => unifiedEditor.chain().focus().toggleItalic().run()}
            className="h-7 w-7 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={unifiedEditor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => unifiedEditor.chain().focus().toggleStrike().run()}
            className="h-7 w-7 p-0"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={unifiedEditor.isActive('link') ? 'default' : 'ghost'}
            size="sm"
            onClick={openLinkDialog}
            className="h-7 w-7 p-0"
            title="Insert link (Ctrl+K)"
          >
            <Link2 className="w-3.5 h-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button
            variant={unifiedEditor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => applyHeadingToSelection(unifiedEditor, 1)}
            className="h-7 w-7 p-0"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={unifiedEditor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => applyHeadingToSelection(unifiedEditor, 2)}
            className="h-7 w-7 p-0"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={unifiedEditor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => applyHeadingToSelection(unifiedEditor, 3)}
            className="h-7 w-7 p-0"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button
            variant={unifiedEditor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => unifiedEditor.chain().focus().toggleBulletList().run()}
            className="h-7 w-7 p-0"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={unifiedEditor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => unifiedEditor.chain().focus().toggleOrderedList().run()}
            className="h-7 w-7 p-0"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={unifiedEditor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => unifiedEditor.chain().focus().toggleBlockquote().run()}
            className="h-7 w-7 p-0"
            title="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" title="Font Size">
                <Type className="w-3.5 h-3.5" />
                <span className="text-xs">Size</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {FONT_SIZES.map((size) => (
                <DropdownMenuItem
                  key={size.value}
                  onClick={() => (unifiedEditor.commands as any).setFontSize(size.value)}
                >
                  <span style={{ fontSize: size.value }}>{size.label}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => (unifiedEditor.commands as any).unsetFontSize()}>
                Reset Size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 px-2 gap-1"
            title="Insert Image"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span className="text-xs">Image</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(file);
                e.target.value = '';
              }
            }}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => unifiedEditor.chain().focus().setHorizontalRule().run()}
            className="h-7 w-7 p-0"
            title="Horizontal line"
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>

          <Popover
            open={tablePickerOpen}
            onOpenChange={(open) => {
              if (open && unifiedEditor) {
                const { from, to } = unifiedEditor.state.selection;
                tablePickerSelectionRef.current = { from, to };
                setTablePickerMode(unifiedEditor.isActive('table') ? 'edit' : 'insert');
              }
              setTablePickerOpen(open);
              if (!open) {
                setTablePickerHover({ rows: 0, cols: 0 });
                tablePickerSelectionRef.current = null;
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant={unifiedEditor.isActive('table') ? 'default' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                title={unifiedEditor.isActive('table') ? 'Table options' : 'Insert table'}
                // Prevent the editor from blurring on click so editor.state.selection
                // stays put — table commands (deleteRow, etc.) depend on the caret
                // still being inside the originally-clicked cell.
                onMouseDown={(e) => e.preventDefault()}
              >
                <TableIcon className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-2">
              {tablePickerMode === 'edit' ? (
                (() => {
                  const runTableCommand = (cmd: (chain: any) => any) => {
                    const saved = tablePickerSelectionRef.current;
                    const chain = unifiedEditor.chain().focus();
                    if (saved) chain.setTextSelection(saved);
                    cmd(chain).run();
                    setTablePickerOpen(false);
                    tablePickerSelectionRef.current = null;
                  };
                  const stopBlur = (e: React.MouseEvent) => e.preventDefault();
                  return (
                    <div className="flex flex-col min-w-[180px]">
                      <button
                        type="button"
                        onMouseDown={stopBlur}
                        onClick={() => runTableCommand((c) => c.addRowBefore())}
                        className="text-left px-2 py-1.5 text-sm rounded-sm hover:bg-muted"
                      >
                        Insert row above
                      </button>
                      <button
                        type="button"
                        onMouseDown={stopBlur}
                        onClick={() => runTableCommand((c) => c.addRowAfter())}
                        className="text-left px-2 py-1.5 text-sm rounded-sm hover:bg-muted"
                      >
                        Insert row below
                      </button>
                      <button
                        type="button"
                        onMouseDown={stopBlur}
                        onClick={() => runTableCommand((c) => c.addColumnBefore())}
                        className="text-left px-2 py-1.5 text-sm rounded-sm hover:bg-muted"
                      >
                        Insert column left
                      </button>
                      <button
                        type="button"
                        onMouseDown={stopBlur}
                        onClick={() => runTableCommand((c) => c.addColumnAfter())}
                        className="text-left px-2 py-1.5 text-sm rounded-sm hover:bg-muted"
                      >
                        Insert column right
                      </button>
                      <Separator className="my-1" />
                      <button
                        type="button"
                        onMouseDown={stopBlur}
                        onClick={() => runTableCommand((c) => c.deleteRow())}
                        className="text-left px-2 py-1.5 text-sm rounded-sm hover:bg-muted"
                      >
                        Delete row
                      </button>
                      <button
                        type="button"
                        onMouseDown={stopBlur}
                        onClick={() => runTableCommand((c) => c.deleteColumn())}
                        className="text-left px-2 py-1.5 text-sm rounded-sm hover:bg-muted"
                      >
                        Delete column
                      </button>
                      <Separator className="my-1" />
                      <button
                        type="button"
                        onMouseDown={stopBlur}
                        onClick={() => runTableCommand((c) => c.deleteTable())}
                        className="flex items-center gap-2 text-left px-2 py-1.5 text-sm rounded-sm text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete table
                      </button>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const MAX_ROWS = 8;
                  const MAX_COLS = 10;
                  const { rows: hoverRows, cols: hoverCols } = tablePickerHover;
                  return (
                    <div className="flex flex-col gap-1.5">
                      <div
                        className="grid gap-0.5"
                        style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 16px)` }}
                        onMouseLeave={() => setTablePickerHover({ rows: 0, cols: 0 })}
                      >
                        {Array.from({ length: MAX_ROWS * MAX_COLS }).map((_, i) => {
                          const r = Math.floor(i / MAX_COLS) + 1;
                          const c = (i % MAX_COLS) + 1;
                          const active = r <= hoverRows && c <= hoverCols;
                          return (
                            <button
                              key={i}
                              type="button"
                              onMouseEnter={() => setTablePickerHover({ rows: r, cols: c })}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const saved = tablePickerSelectionRef.current;
                                const chain = unifiedEditor.chain().focus();
                                if (saved) chain.setTextSelection(saved);
                                chain
                                  .insertTable({ rows: r, cols: c, withHeaderRow: true })
                                  .run();
                                setTablePickerOpen(false);
                                setTablePickerHover({ rows: 0, cols: 0 });
                                tablePickerSelectionRef.current = null;
                              }}
                              className={cn(
                                'w-4 h-4 border rounded-[2px] transition-colors',
                                active
                                  ? 'bg-primary/20 border-primary'
                                  : 'bg-background border-border hover:border-primary/50'
                              )}
                            />
                          );
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground text-center tabular-nums">
                        {hoverRows > 0 ? `${hoverCols} × ${hoverRows}` : 'Select size'}
                      </div>
                    </div>
                  );
                })()
              )}
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => unifiedEditor.chain().focus().undo().run()}
            disabled={!unifiedEditor.can().undo()}
            className="h-7 w-7 p-0"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => unifiedEditor.chain().focus().redo().run()}
            disabled={!unifiedEditor.can().redo()}
            className="h-7 w-7 p-0"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="h-7 w-7 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomReset}
            className="h-7 px-2 text-xs font-medium min-w-[48px]"
            title="Reset Zoom"
          >
            {zoom}%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="h-7 w-7 p-0"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

        </div>
      )}

      {/* Document Content with Outline + Editor + RightPanel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Persistent left rail (icon strip + optional panel). Always visible. */}
        {!isNarrow && (
          <LeftRailTabs
            editorContainerRef={editorContainerRef}
            refreshTrigger={refreshTrigger}
            externalCollapsed={outlineCollapsed}
            onCollapsedChange={setOutlineCollapsed}
            documentId={docxSourceDocumentId || editingDocumentId || currentDocumentId}
            companyId={companyId || activeCompanyRole?.companyId}
            productId={selectedProductId}
            showSectionNumbers={showSectionNumbers}
            onShowSectionNumbersChange={onShowSectionNumbersChange}
            configDisabled={disabled}
            onIsRecordChange={onIsRecordChange}
            template={template}
          />
        )}

        {/* Narrow: outline behind hamburger drawer */}
        {isNarrow && narrowOutlineOpen && (
          <div
            className="absolute inset-0 z-30 flex"
            onClick={() => setNarrowOutlineOpen(false)}
          >
            <div className="bg-background h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <LeftRailTabs
                editorContainerRef={editorContainerRef}
                refreshTrigger={refreshTrigger}
                documentId={docxSourceDocumentId || editingDocumentId || currentDocumentId}
                companyId={companyId || activeCompanyRole?.companyId}
                productId={selectedProductId}
                showSectionNumbers={showSectionNumbers}
                onShowSectionNumbersChange={onShowSectionNumbersChange}
                configDisabled={disabled}
                onIsRecordChange={onIsRecordChange}
                template={template}
              />
            </div>
            <div className="flex-1 bg-black/30" />
          </div>
        )}

        {/* Center: Document Editor */}
        <div id="draft-editor-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30 relative">
          <div
            className="max-w-[210mm] mx-auto my-8 bg-background shadow-md rounded-sm min-h-[297mm] p-0"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Professional SOP Header */}
            <SOPDocumentHeader
              documentControl={template?.documentControl}
              companyName={activeCompanyRole?.companyName}
              companyId={companyId}
              companyLogoUrl={companyLogoUrl}
              onFieldChange={onDocumentControlChange}
              isRecord={isRecord}
              recordId={recordId}
              nextReviewDate={nextReviewDate}
              documentNumber={documentNumber}
              changeControlRef={changeControlRef}
              className="mx-8 mt-8"
            />

            {/* Document-level AI review bar */}
            {showDocumentAIBar && selectedSection && (
              <AIInlineEditBar
                sectionTitle={selectedSection.title}
                currentContent={selectedSection.content}
                companyId={companyId}
                documentId={editingDocumentId || currentDocumentId}
                onContentGenerated={() => {}}
                onClose={() => {
                  setShowDocumentAIBar(false);
                  setSelectedSection(null);
                }}
                mode="review"
              />
            )}
            {/* Unified Single Editor */}
            <div ref={editorContainerRef} className="px-8 pb-8">
              {unifiedEditor ? (
                <>
                  <EditorContent editor={unifiedEditor} />
                  <BubbleMenu
                    editor={unifiedEditor}
                    shouldShow={({ editor, from, to }) => {
                      // Only show when there is a non-empty text selection and
                      // the editor is focused/editable.
                      if (!editor.isEditable) return false;
                      if (from === to) return false;
                      return true;
                    }}
                    options={{ placement: 'top', offset: 8 }}
                    className="flex items-center gap-0.5 rounded-md border bg-background shadow-lg p-1"
                  >
                    <Button
                      variant={unifiedEditor.isActive('bold') ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => unifiedEditor.chain().focus().toggleBold().run()}
                      className="h-7 w-7 p-0"
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant={unifiedEditor.isActive('italic') ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => unifiedEditor.chain().focus().toggleItalic().run()}
                      className="h-7 w-7 p-0"
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant={unifiedEditor.isActive('strike') ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => unifiedEditor.chain().focus().toggleStrike().run()}
                      className="h-7 w-7 p-0"
                      title="Strikethrough"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant={unifiedEditor.isActive('link') ? 'default' : 'ghost'}
                      size="sm"
                      onClick={openLinkDialog}
                      className="h-7 w-7 p-0"
                      title="Insert link (Ctrl+K)"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </Button>
                    <Separator orientation="vertical" className="h-5 mx-1" />
                    <Button
                      variant={unifiedEditor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => applyHeadingToSelection(unifiedEditor, 1)}
                      className="h-7 w-7 p-0"
                      title="Heading 1"
                    >
                      <Heading1 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant={unifiedEditor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => applyHeadingToSelection(unifiedEditor, 2)}
                      className="h-7 w-7 p-0"
                      title="Heading 2"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant={unifiedEditor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => applyHeadingToSelection(unifiedEditor, 3)}
                      className="h-7 w-7 p-0"
                      title="Heading 3"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </Button>
                    {aiInlineSuggestionsEnabled && (
                      <>
                        <Separator orientation="vertical" className="h-5 mx-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            handleOpenInlineAIEdit(rect);
                          }}
                          className="h-7 px-2 gap-1 text-primary hover:bg-primary/10"
                          title="Edit with AI"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Edit</span>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onMouseDown={(e) => { e.preventDefault(); handleAddSelectionToChat(); }}
                      className="h-7 px-2 gap-1"
                      title="Add to AI chat"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Add to Chat</span>
                    </Button>
                  </BubbleMenu>
                </>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-500" />
                  <h3 className="text-lg font-medium mb-2 text-gray-500">No Content Available</h3>
                  <p className="text-sm text-gray-400">
                    This document doesn't have any content to display.
                  </p>
                </div>
              )}
              {mentionOpen && (
                <EditorMentionPopup
                  sections={mentionSections}
                  selectableItems={selectableItems}
                  query={mentionQuery}
                  highlight={mentionHighlight}
                  coords={mentionCoords}
                  onHover={setMentionHighlight}
                  onSelect={insertMentionAtRange}
                />
              )}
              <DocMentionHoverCard
                data={docHover}
                onMouseEnter={cancelHoverClose}
                onMouseLeave={scheduleHoverClose}
                onOpen={navigateToDoc}
              />
              <CreateReferenceDocDialog
                open={createRefDialog.open}
                companyId={companyId || activeCompanyRole?.companyId}
                companyName={companyName || activeCompanyRole?.companyName}
                initialRefCode={createRefDialog.refCode}
                initialTitle={createRefDialog.title}
                onClose={() => setCreateRefDialog({ open: false, refCode: '', title: '' })}
              />
              <PersonMentionHoverCard
                data={personHover}
                onMouseEnter={cancelHoverClose}
                onMouseLeave={scheduleHoverClose}
              />
              <LinkHoverCard
                data={linkHover}
                onMouseEnter={cancelHoverClose}
                onMouseLeave={scheduleHoverClose}
                onEdit={(href) => {
                  const editor = editorInstanceRef.current;
                  const el = linkHoverElementRef.current;
                  if (editor && el) {
                    const pos = posInsideLink(editor, el);
                    if (pos !== null) {
                      editor.chain().focus().setTextSelection(pos).extendMarkRange('link').run();
                    }
                  }
                  setLinkHover(null);
                  setLinkDialogUrl(href);
                  setLinkDialogText('');
                  setLinkDialogMode('edit');
                  setLinkDialogOpen(true);
                }}
                onRemove={() => {
                  const editor = editorInstanceRef.current;
                  const el = linkHoverElementRef.current;
                  setLinkHover(null);
                  if (!editor || !el) return;
                  const pos = posInsideLink(editor, el);
                  if (pos === null) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(pos)
                    .extendMarkRange('link')
                    .unsetLink()
                    .run();
                }}
              />
            </div>

            {/* Professional SOP Footer */}
            <SOPDocumentFooter
              revisionHistory={template?.revisionHistory}
              associatedDocuments={template?.associatedDocuments}
              sopNumber={template?.documentControl?.sopNumber}
              version={template?.documentControl?.version}
              className="mx-8 mb-8"
            />
          </div>
        </div>

        {/* Right: Tabbed panel (AI Assistant / User Chat / Comments) */}
        {!isNarrow && rightPanelOpen && (
          <RightPanel
            template={template}
            companyId={companyId || activeCompanyRole?.companyId}
            productId={selectedProductId}
            documentId={editingDocumentId || currentDocumentId}
            docxDocumentId={docxSourceDocumentId || editingDocumentId || currentDocumentId}
            documentName={template?.name || 'Document'}
            editorInstanceRef={editorInstanceRef}
            editorContainerRef={editorContainerRef}
            onApplyContent={handleApplyAIContent}
            onClose={() => setRightPanelOpen(false)}
            disableSopMentions={disableSopMentions}
            documentPhase={documentPhase}
          />
        )}

        {/* Desktop: re-open button anchored to the top-right of the editor area.
            Uses a distinct panel icon (not sparkles) to avoid confusion with the
            separate yellow AI-menu sparkle button in the toolbar above. */}
        {!isNarrow && !rightPanelOpen && (
          <button
            type="button"
            onClick={() => setRightPanelOpen(true)}
            className="absolute top-3 right-5 z-20 p-1.5 rounded-md border bg-background shadow-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Show side panel (AI Assistant, User Chat, Comments)"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}

        {/* Narrow viewport: right panel as bottom sheet via FAB */}
        {isNarrow && (
          <>
            {!narrowRightOpen && (
              <button
                type="button"
                onClick={() => setNarrowRightOpen(true)}
                className="absolute bottom-4 right-4 z-30 p-3 rounded-full shadow-lg border text-white"
                style={{ background: '#534AB7' }}
                title="Open panels"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            )}
            {narrowRightOpen && (
              <div
                className="absolute inset-x-0 bottom-0 z-30 bg-background border-t shadow-xl flex flex-col"
                style={{ height: '60vh' }}
              >
                <div
                  className="flex items-center justify-center py-1 border-b cursor-pointer"
                  onClick={() => setNarrowRightOpen(false)}
                  title="Drag to close"
                >
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/40" />
                </div>
                <div className="flex-1 min-h-0">
                  <RightPanel
                    template={template}
                    companyId={companyId || activeCompanyRole?.companyId}
                    productId={selectedProductId}
                    documentId={editingDocumentId || currentDocumentId}
                    documentName={template?.name || 'Document'}
                    editorInstanceRef={editorInstanceRef}
                    editorContainerRef={editorContainerRef}
                    onApplyContent={handleApplyAIContent}
                    onClose={() => setNarrowRightOpen(false)}
                    className="w-full border-l-0"
                    disableSopMentions={disableSopMentions}
                    documentPhase={documentPhase}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Document Version Modal */}
      <DocumentVersionModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        documentId={currentDocumentId || ''}
        currentDocumentName={template?.name || 'Untitled Document'}
        onVersionRestore={handleVersionRestore}
      />

      {/* Save Version Dialog */}
      <SaveVersionDialog
        open={showSaveVersionDialog}
        onOpenChange={setShowSaveVersionDialog}
        documentId={currentDocumentId || editingDocumentId}
        template={template}
        onVersionSaved={handleVersionSaved}
      />

      {/* AI Content Generation Modal */}
      <AIContentGenerationModal
        isOpen={showAIModal}
        setShowAIModal={setShowAIModal}
        onClose={() => setShowAIModal(false)}
        sectionTitle={selectedSection?.title || ''}
        currentContent={selectedSection?.content || ''}
        onContentGenerated={handleAIContentGenerated}
        companyId={companyId}
        documentId={editingDocumentId || currentDocumentId}
      />

      {/* AI Auto-Fill All Sections Dialog */}
      <AIAutoFillDialog
        open={showAutoFillDialog}
        onOpenChange={setShowAutoFillDialog}
        template={template}
        companyId={companyId}
        productId={selectedProductId}
        onContentUpdate={onContentUpdate}
        onBack={() => setShowEmptyStateModal(true)}
      />

      {/* Empty-state chooser shown when opening a draft with no content */}
      <DraftEmptyStateModal
        open={showEmptyStateModal}
        onOpenChange={setShowEmptyStateModal}
        onGenerateManually={() => setShowEmptyStateModal(false)}
        onAutoFillByAI={handleEmptyStateAutoFill}
        onCopyFromSOP={handleEmptyStateCopyFromSOP}
      />

      {/* SOP picker for Copy-from-SOP flow */}
      <SOPPickerModal
        open={showSopPickerModal}
        onOpenChange={setShowSopPickerModal}
        onSelect={handleSOPSelected}
        onBack={() => {
          setShowSopPickerModal(false);
          setShowEmptyStateModal(true);
        }}
      />

      {/* Inline "Edit with AI" popover anchored to the current selection */}
      {inlineAIEdit && unifiedEditor && (
        <InlineAIEditPopover
          editor={unifiedEditor}
          selectedText={inlineAIEdit.text}
          selectedHTML={inlineAIEdit.html}
          selectionFrom={inlineAIEdit.from}
          selectionTo={inlineAIEdit.to}
          anchorRect={inlineAIEdit.anchorRect}
          sectionTitle={template?.name}
          companyId={companyId || activeCompanyRole?.companyId}
          scope={selectedScope}
          productId={selectedProductId}
          onClose={() => setInlineAIEdit(null)}
        />
      )}

      {/* AI Document Validation Dialog */}
      <AIDocumentValidationDialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
        template={template}
        companyId={companyId}
        companyName={activeCompanyRole?.companyName}
        onContentUpdate={onContentUpdate}
      />

      {/* Insert / edit hyperlink */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{linkDialogMode === 'edit' ? 'Edit link' : 'Insert link'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {linkDialogMode === 'create' && !linkDialogText && (
              <div className="space-y-1">
                <Label htmlFor="link-text" className="text-xs text-muted-foreground">Display text (optional)</Label>
                <Input
                  id="link-text"
                  placeholder="Text to show"
                  value={linkDialogText}
                  onChange={(e) => setLinkDialogText(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="link-url" className="text-xs text-muted-foreground">URL</Label>
              <Input
                id="link-url"
                autoFocus
                placeholder="https://example.com"
                value={linkDialogUrl}
                onChange={(e) => setLinkDialogUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyLinkFromDialog();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {linkDialogMode === 'edit' && (
              <Button variant="ghost" onClick={removeLink} className="text-destructive mr-auto">
                Remove link
              </Button>
            )}
            <Button variant="ghost" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={applyLinkFromDialog} disabled={!linkDialogUrl.trim()}>
              {linkDialogMode === 'edit' ? 'Save' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}