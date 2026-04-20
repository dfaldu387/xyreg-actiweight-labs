import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { FileText, Download, Share, Save, History, Sparkles, StickyNote, Wand2, GitBranch, MoreHorizontal, ArrowUpFromLine, Eye, EyeOff, Pencil, ShieldCheck, Bold, Italic, Strikethrough, List, ListOrdered, Type, ImagePlus, Undo, Redo, Heading1, Heading2, Heading3, Quote, AlignJustify, MessageSquare, ZoomIn, ZoomOut, PanelRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { AIDocumentValidationDialog } from './AIDocumentValidationDialog';
import { documentContextStore } from '@/stores/documentContextStore';
import { DocumentOutlinePanel } from './DocumentOutlinePanel';
import { RightPanel } from './RightPanel';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { Trash2 } from 'lucide-react';

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

function mergeSectionsToHtml(sections: any[], companyName: string, numbered: boolean = false): string {
  if (!sections || sections.length === 0) return '<p></p>';

  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, sectionIndex) => {
      const sectionNum = sectionIndex + 1;
      const title = section.customTitle || section.title;
      const prefix = numbered ? `${sectionNum}.0 ` : '';
      const sectionHeading = `<h2 id="section-${section.id}">${prefix}${title}</h2>`;

      const contentItems = (Array.isArray(section.content) ? section.content : [])
        .map((item: any) => {
          if (item.type === 'heading') return `<h3>${item.content}</h3>`;
          let processed = item.content || '';
          // Skip empty/placeholder content
          if (!processed.trim() || processed === '[AI_PROMPT_NEEDED]') return '';
          processed = stripRedundantSectionHeading(processed, title);
          processed = replaceCompanyPlaceholders(processed, companyName);
          // If content looks like plain text, wrap in paragraph tags
          if (processed && !processed.trim().startsWith('<')) {
            processed = `<p>${processed}</p>`;
          }
          return processed;
        })
        .filter(Boolean)
        .join('');

      // Always add an empty paragraph after heading so user can click and type
      let contentHtml = contentItems || '<p></p>';

      // Re-number H3 sub-headings when section numbering is enabled
      if (numbered) {
        contentHtml = renumberSubHeadings(contentHtml, sectionNum);
      }

      return sectionHeading + contentHtml;
    })
    .join('');
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
  hideVersioning?: boolean;
  isEditing?: boolean;
  showSectionNumbers?: boolean;
  onShowSectionNumbersChange?: (show: boolean) => void;
  /** When true, disables SOP @-mention suggestions in the embedded AI chat. */
  disableSopMentions?: boolean;
}

export function LiveEditor({ template, className = '', onContentUpdate, companyId, onDocumentSaved, isEditingExistingDocument = false, editingDocumentId = null, docxSourceDocumentId = null, onAIGenerate, onAddAutoNote, currentNotes = [], isUploadedDocument = false, uploadedDocumentSaved = false, onUploadedDocumentSaved, disabled = false, selectedScope = 'company', selectedProductId, uploadedFileInfo, onDocumentControlChange, companyLogoUrl, onPushToDeviceFields, onCustomSave, isRecord = false, recordId, nextReviewDate, documentNumber, hideVersioning = false, isEditing: isEditingProp, showSectionNumbers = false, onShowSectionNumbersChange, disableSopMentions = false }: LiveEditorProps) {
  const { activeCompanyRole } = useCompanyRole();
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showSaveVersionDialog, setShowSaveVersionDialog] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(template?.name || '');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{title: string, content: string} | null>(null);
  const [showAutoFillDialog, setShowAutoFillDialog] = useState(false);
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
  const [isNarrow, setIsNarrow] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 900 : false
  );
  const [narrowOutlineOpen, setNarrowOutlineOpen] = useState(false);
  const [narrowRightOpen, setNarrowRightOpen] = useState(false);
  const [outlineCollapsed, setOutlineCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('xyreg.outline.collapsed') === '1'; } catch { return false; }
  });
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
  const mergedHtml = useMemo(
    () => mergeSectionsToHtml(template?.sections || [], companyName, showSectionNumbers),
    [template?.sections, companyName, showSectionNumbers]
  );

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
      StarterKit,
      TextStyle,
      FontSize,
      ImageWithDelete.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({
        placeholder: 'Start typing your document...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: mergedHtml || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] p-6 prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-800 prose-h2:text-xl prose-h2:font-bold prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1',
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
      // Don't sync to parent on every keystroke — content is synced on explicit save.
      // Just refresh the outline panel.
      setRefreshTrigger(prev => prev + 1);
    },
  });

  // Keep ref in sync so callbacks can access the editor
  editorInstanceRef.current = unifiedEditor;

  // Handler for AI-generated content being pasted into the editor.
  // mode='replace' deletes the existing section body (between the matching h2
  // and the next h2) before inserting; 'insert' (default) appends to the first
  // empty paragraph in the section, matching the pre-diff behavior.
  const handleApplyAIContent = useCallback((content: string, sectionName?: string, mode: 'insert' | 'replace' = 'insert') => {
    if (!unifiedEditor) return;
    const html = content
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>');

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

  // Set editor content when editor becomes ready, when switching documents,
  // or when sections are updated externally (e.g. AI Auto-Fill)
  useEffect(() => {
    if (!unifiedEditor) return;

    const newHtml = mergeSectionsToHtml(template?.sections || [], companyName, showSectionNumbers);
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
      unifiedEditor.commands.setContent(newHtml);
      setRefreshTrigger(prev => prev + 1);
    }
  }, [template?.id, template?.sections, companyName, unifiedEditor, showSectionNumbers]);

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

  const handleSave = async () => {
    // If parent wants to handle save (e.g. CI-first flow), delegate entirely
    if (onCustomSave) {
      // Sync editor content first so parent has latest data
      syncEditorToParent();
      onCustomSave();
      return;
    }

    try {
      if (!activeCompanyRole?.companyId) {
        toast.error('Company information not available');
        return;
      }

      // For uploaded documents, prevent duplicate saves
      if (isUploadedDocument && uploadedDocumentSaved) {
        toast.info('This uploaded document has already been saved', {
          description: 'You can edit it from the My Documents list'
        });
        return;
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

        // Mark uploaded document as saved
        if (isUploadedDocument && !uploadedDocumentSaved) {
          onUploadedDocumentSaved?.();
        }

        const scopeLabel = selectedScope === 'product' ? 'Device Documents' : 'Company Documents';
        const successMessage = existingDocumentId ? 'Document updated successfully!' : 'Draft saved successfully!';
        toast.success(successMessage, {
          description: `Your document is now available in My Documents and ${scopeLabel}`
        });

        // Add note through parent handler to update UI immediately
        if (onAddAutoNote) {
          onAddAutoNote(autoNote);
        }

        // Trigger refresh of document list
        onDocumentSaved?.();
      } else {
        throw new Error(result.error || 'Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save draft', {
        description: 'Please try again or check your connection'
      });
    }
  };

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

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Editor Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyPress}
                    onBlur={handleTitleSave}
                    className="text-lg font-semibold"
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={handleTitleSave}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleTitleCancel}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <h1 
                  className="text-lg font-semibold text-foreground cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                  onClick={() => setIsEditingTitle(true)}
                  title="Click to edit title"
                >
                  {(() => {
                    const cleanName = (template?.name || '').replace(/^[A-Z]{2,6}-\d{3}\s+/, '');
                    return cleanName || 'Untitled Document';
                  })()}
                </h1>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>For {template?.productContext?.name || (selectedScope === 'product' ? 'Product' : 'Company')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <DropdownMenu open={aiMenuOpen} onOpenChange={setAiMenuOpen} modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-amber-300 text-amber-400 hover:bg-amber-50 hover:text-amber-500 h-8 w-8"
                  >
                    <Sparkles className="w-4 h-4 " />
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onCloseAutoFocus={(e) => {
                    if (autoFillPendingRef.current) {
                      e.preventDefault();
                      autoFillPendingRef.current = false;
                    }
                  }}>
                  <DropdownMenuItem onSelect={() => {
                    autoFillPendingRef.current = true;
                    setAiMenuOpen(false);
                    openAutoFillSafely();
                  }}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Auto-Fill Sections
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    if (showDocumentAIBar) return;
                    const allContent = unifiedEditor?.getText()?.slice(0, 8000) || '';
                    setSelectedSection({ title: template?.name || 'Document', content: allContent });
                    setShowDocumentAIBar(true);
                  }}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Review Document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowValidationDialog(true)}
                    className="border-blue-300 text-blue-400 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-950 h-8 w-8"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI Validate</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" onClick={handleSave} className="h-8 w-8">
                    <Save className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Draft</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleDownload} className="h-8 w-8">
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!!onPushToDeviceFields && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onPushToDeviceFields}
                      className="border-green-300 text-green-400 hover:text-green-500 hover:bg-green-50 h-8 w-8"
                    >
                      <ArrowUpFromLine className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Push to Device Fields</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {hideVersioning && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleShare} className="h-8 w-8">
                      <Share className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!hideVersioning && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSaveVersion}>
                    <GitBranch className="w-4 h-4 mr-2" />
                    Save Version
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShowVersions}>
                    <History className="w-4 h-4 mr-2" />
                    View Versions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Formatting Toolbar */}
      {unifiedEditor && (
        <div className="border-b bg-background px-4 py-1.5 flex items-center gap-1 flex-wrap sticky top-[72px] z-10">
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

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button
            variant={unifiedEditor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => unifiedEditor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="h-7 w-7 p-0"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={unifiedEditor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => unifiedEditor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="h-7 w-7 p-0"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={unifiedEditor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => unifiedEditor.chain().focus().toggleHeading({ level: 3 }).run()}
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
        {/* Outline: rendered on desktop when not collapsed; overlay on narrow */}
        {!isNarrow && (
          <DocumentOutlinePanel
            editorContainerRef={editorContainerRef}
            refreshTrigger={refreshTrigger}
            externalCollapsed={outlineCollapsed}
            onCollapsedChange={setOutlineCollapsed}
          />
        )}

        {/* Narrow: outline behind hamburger drawer */}
        {isNarrow && narrowOutlineOpen && (
          <div
            className="absolute inset-0 z-30 flex"
            onClick={() => setNarrowOutlineOpen(false)}
          >
            <div className="bg-background h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <DocumentOutlinePanel
                editorContainerRef={editorContainerRef}
                refreshTrigger={refreshTrigger}
              />
            </div>
            <div className="flex-1 bg-black/30" />
          </div>
        )}

        {/* Center: Document Editor */}
        <div id="draft-editor-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30 relative">
          {/* Hamburger to reveal the outline — desktop (when collapsed) or narrow */}
          {((isNarrow) || (!isNarrow && outlineCollapsed)) && (
            <button
              className="sticky top-3 left-3 z-20 p-2 rounded-lg bg-background/90 shadow-sm border hover:bg-muted transition-colors"
              onClick={() => {
                if (isNarrow) setNarrowOutlineOpen(true);
                else setOutlineCollapsed(false);
              }}
              title="Show document outline"
              style={{ position: 'sticky', float: 'left', marginLeft: '12px', marginTop: '12px' }}
            >
              <AlignJustify className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
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
                <EditorContent editor={unifiedEditor} />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-500" />
                  <h3 className="text-lg font-medium mb-2 text-gray-500">No Content Available</h3>
                  <p className="text-sm text-gray-400">
                    This document doesn't have any content to display.
                  </p>
                </div>
              )}
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
          />
        )}

        {/* Desktop: re-open button anchored to the top-right of the editor area.
            Uses a distinct panel icon (not sparkles) to avoid confusion with the
            separate yellow AI-menu sparkle button in the toolbar above. */}
        {!isNarrow && !rightPanelOpen && (
          <button
            type="button"
            onClick={() => setRightPanelOpen(true)}
            className="absolute top-3 right-5 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-background shadow-sm hover:bg-muted transition-colors"
            title="Show side panel (AI Assistant, User Chat, Comments)"
          >
            <PanelRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Show panel</span>
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
      />

      {/* AI Document Validation Dialog */}
      <AIDocumentValidationDialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
        template={template}
        companyId={companyId}
        companyName={activeCompanyRole?.companyName}
        onContentUpdate={onContentUpdate}
      />
    </div>
  );
}