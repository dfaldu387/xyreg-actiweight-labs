import React, { useEffect, useRef, useState } from 'react';
import { FileText, Download, Share, Save, History, Sparkles, StickyNote, Wand2, GitBranch, MoreHorizontal, ArrowUpFromLine, Eye, EyeOff, Pencil, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AIContentBlock } from './AIContentBlock';
import { AIInlineEditBar } from './AIInlineEditBar';
import { HighlightedContent } from './HighlightedContent';
import { EditableContent } from './EditableContent';
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
import { EmptySectionPrompt } from './EmptySectionPrompt';
import { documentContextStore } from '@/stores/documentContextStore';

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

interface LiveEditorProps {
  template: DocumentTemplate;
  className?: string;
  onContentUpdate?: (contentId: string, newContent: string) => void;
  companyId?: string;
  onDocumentSaved?: () => void;
  isEditingExistingDocument?: boolean;
  editingDocumentId?: string | null;
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
}

export function LiveEditor({ template, className = '', onContentUpdate, companyId, onDocumentSaved, isEditingExistingDocument = false, editingDocumentId = null, onAIGenerate, onAddAutoNote, currentNotes = [], isUploadedDocument = false, uploadedDocumentSaved = false, onUploadedDocumentSaved, disabled = false, selectedScope = 'company', selectedProductId, uploadedFileInfo, onDocumentControlChange, companyLogoUrl, onPushToDeviceFields, onCustomSave, isRecord = false, recordId, nextReviewDate, documentNumber, hideVersioning = false, isEditing: isEditingProp }: LiveEditorProps) {
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
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editedSectionTitle, setEditedSectionTitle] = useState('');
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [inlineEditSectionId, setInlineEditSectionId] = useState<string | null>(null);
  const [aiTargetContentId, setAiTargetContentId] = useState<string | null>(null);
  const [showDocumentAIBar, setShowDocumentAIBar] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const autoFillPendingRef = useRef(false);
  const autoFillOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoFillOpenTimeoutRef.current) {
        clearTimeout(autoFillOpenTimeoutRef.current);
      }
    };
  }, []);

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
  
  const handleContentUpdate = (contentId: string, newContent: string) => {
    // Call the parent's content update handler
    onContentUpdate?.(contentId, newContent);
  };


  const handleSectionAIGenerate = async (section: any) => {
    
    if (!activeCompanyRole?.companyId) {
      toast.error('Company information not available');
      return;
    }

    try {
      // Get company context
      const { data: company } = await supabase
        .from('companies')
        .select('name, country, industry')
        .eq('id', activeCompanyRole.companyId)
        .single();

      // Generate AI content for this specific section
      const aiContent = await AIContentRecommendationService.generateContentForRecommendation(
        {
          id: `section-${section.id}`,
          title: `Generate content for ${section.title}`,
          description: `Generate comprehensive content for the ${section.title} section`,
          sectionTitle: section.title,
          priority: 'important' as const,
          recommendationType: 'missing_content' as const,
          bracketSuggestion: `[AI_PROMPT: Generate content for ${section.title}]`
        },
        company || {},
        activeCompanyRole.companyId
      );

      if (aiContent) {
        // Create suggestions for each content item in this section
        section.content?.forEach((contentItem: any) => {
          if (contentItem.type !== 'heading') {
            AISuggestionService.createSuggestion(
              contentItem.id,
              contentItem.content,
              aiContent
            );
          }
        });

        // Force component re-render to show AI suggestions
        setRefreshTrigger(prev => prev + 1);
        
        toast.success(`AI content generated for ${section.title}. Check the document for inline suggestions.`);
      } else {
        toast.error(`Failed to generate AI content for ${section.title}`);
      }
    } catch (error) {
      console.error(`Error generating AI content for ${section.title}:`, error);
      toast.error(`Failed to generate AI content for ${section.title}`);
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
      setInlineEditSectionId(section.id);
    } else {
      setSelectedSection({ title: section.title, content: currentContent });
      setShowAIModal(true);
    }
  };

  const handleOpenFullModalFromInline = () => {
    setInlineEditSectionId(null);
    setShowAIModal(true);
  };

  const openAutoFillSafely = () => {
    setInlineEditSectionId(null);
    setShowDocumentAIBar(false);
    setAiTargetContentId(null);

    if (autoFillOpenTimeoutRef.current) {
      clearTimeout(autoFillOpenTimeoutRef.current);
    }

    autoFillOpenTimeoutRef.current = setTimeout(() => {
      setShowAutoFillDialog(true);
      autoFillOpenTimeoutRef.current = null;
    }, 0);
  };

  const handleAIContentGenerated = (newContent: string) => {
    if (onContentUpdate && aiTargetContentId) {
      onContentUpdate(aiTargetContentId, newContent);
    }
    setShowAIModal(false);
    setInlineEditSectionId(null);
    setSelectedSection(null);
    setAiTargetContentId(null);
  };

  const handleSave = async () => {
    // If parent wants to handle save (e.g. CI-first flow), delegate entirely
    if (onCustomSave) {
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

      // Use the editing document ID if available (from edit flow)
      const existingDocumentId = editingDocumentId || currentDocumentId;
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
        sections: template.sections,
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
                    className="border-amber-300 text-amber-500 hover:bg-amber-50 h-8 w-8"
                  >
                    <Sparkles className="w-4 h-4" />
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
                    if (showDocumentAIBar) return; // Already open
                    // Close section-level AI bar if open
                    setInlineEditSectionId(null);
                    // Gather all document content for review, capped at 8000 chars
                    const allContent = (template?.sections || [])
                      .sort((a, b) => a.order - b.order)
                      .map(s => {
                        const sContent = (Array.isArray(s.content) ? s.content : [])
                          .filter((c: any) => c.type !== 'heading')
                          .map((c: any) => c.content)
                          .join('\n');
                        return `## ${s.title}\n${sContent}`;
                      })
                      .join('\n\n')
                      .slice(0, 8000);
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
                    className="border-blue-300 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 h-8 w-8"
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
                      className="border-green-300 text-green-600 hover:bg-green-50 h-8 w-8"
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

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30">
        <div className="max-w-[210mm] mx-auto my-8 bg-background shadow-md rounded-sm min-h-[297mm] p-0">
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

          {/* Document Content */}
          <div className="px-8 space-y-4">
            {/* Document-level AI review bar */}
            {showDocumentAIBar && selectedSection && (
              <AIInlineEditBar
                sectionTitle={selectedSection.title}
                currentContent={selectedSection.content}
                companyId={companyId}
                onContentGenerated={() => {}}
                onClose={() => {
                  setShowDocumentAIBar(false);
                  setSelectedSection(null);
                }}
                onOpenFullModal={() => {
                  setShowDocumentAIBar(false);
                  setShowAIModal(true);
                }}
                mode="review"
              />
            )}
            {template?.sections && template.sections.length > 0 ? (
              template.sections
                .sort((a, b) => a.order - b.order)
                .map((section, sectionIndex) => (
                <div key={section.id} className="space-y-3">
                  {section.showHeader !== false && (
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    {editingSectionId === section.id ? (
                      <Input
                        value={editedSectionTitle}
                        onChange={(e) => setEditedSectionTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onContentUpdate?.(`section-title-${section.id}`, editedSectionTitle.trim());
                            setEditingSectionId(null);
                          } else if (e.key === 'Escape') {
                            setEditingSectionId(null);
                          }
                        }}
                        onBlur={() => {
                          if (editedSectionTitle.trim()) {
                            onContentUpdate?.(`section-title-${section.id}`, editedSectionTitle.trim());
                          }
                          setEditingSectionId(null);
                        }}
                        className="text-lg font-bold h-8 max-w-[70%]"
                        autoFocus
                      />
                    ) : (
                      <h2
                        className="text-lg font-bold text-foreground cursor-pointer hover:bg-muted/50 px-1 rounded"
                        onClick={() => {
                          setEditingSectionId(section.id);
                          setEditedSectionTitle(section.customTitle || section.title);
                        }}
                        title="Click to rename"
                      >
                        {template?.formatOptions?.showSectionNumbers && `${sectionIndex + 1}.0 `}
                        {section.customTitle || section.title}
                      </h2>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIIconClick(section)}
                        className="h-8 w-8 p-0 hover:bg-amber-50 hover:border-amber-300"
                        title={`Generate AI content for ${section.title}`}
                      >
                        <Wand2 className="w-4 h-4 text-amber-500" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingSectionId(section.id);
                            setEditedSectionTitle(section.customTitle || section.title);
                          }}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename Section
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            onContentUpdate?.(`section-visibility-${section.id}`, 'hide');
                          }}>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide Header
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  )}
                  {section.showHeader === false && (
                    <div className="flex items-center gap-2 py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground h-6 px-2"
                        onClick={() => {
                          onContentUpdate?.(`section-visibility-${section.id}`, 'show');
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Show "{section.customTitle || section.title}" header
                      </Button>
                    </div>
                  )}
                  {/* Inline AI Edit Bar */}
                  {inlineEditSectionId === section.id && selectedSection && (
                    <AIInlineEditBar
                      sectionTitle={selectedSection.title}
                      currentContent={selectedSection.content}
                      companyId={companyId || activeCompanyRole?.companyId}
                      onContentGenerated={handleAIContentGenerated}
                      onClose={() => {
                        setInlineEditSectionId(null);
                        setSelectedSection(null);
                      }}
                      onOpenFullModal={handleOpenFullModalFromInline}
                    />
                  )}
                  <div className="space-y-1 pl-4">
                    {(Array.isArray(section.content) ? section.content : []).map((contentItem, contentIndex) => {
                      const sectionTitle = section.customTitle || section.title;
                      const companyName = activeCompanyRole?.companyName || '';
                      let processedContent = stripRedundantSectionHeading(contentItem.content, sectionTitle);
                      if (template?.formatOptions?.showSectionNumbers) {
                        processedContent = stripContentHeadingNumbers(processedContent);
                      }
                      processedContent = replaceCompanyPlaceholders(processedContent, companyName);
                      const cleanedItem = processedContent !== contentItem.content ? { ...contentItem, content: processedContent } : contentItem;
                      return (
                      <div key={contentItem.id} className="space-y-1">
                        {cleanedItem.type === 'heading' && (
                          <h3 className="text-base font-semibold text-foreground mt-3">
                            {cleanedItem.content}
                          </h3>
                        )}
                        {cleanedItem.type === 'table' && (
                          <div className="my-3">
                            <table className="w-full border-collapse border border-border text-sm">
                              <tbody>
                                {cleanedItem.content.split('\n').filter(row => row.trim()).map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {row.split('|').map((cell, cellIndex) => (
                                        <td key={cellIndex} className="border border-border px-3 py-2">
                                          <HighlightedContent 
                                            content={cell.trim()}
                                            contentId={`${cleanedItem.id}-cell-${rowIndex}-${cellIndex}`}
                                            onAIGenerate={(prompt) => {
                                              // Handle AI generation for table cells
                                            }}
                                          />
                                        </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {cleanedItem.type !== 'heading' && cleanedItem.type !== 'table' && (
                          <>
                            {(!cleanedItem.content || cleanedItem.content.trim() === '' || cleanedItem.content === '[AI_PROMPT_NEEDED]') && !cleanedItem.isAIGenerated ? (
                              <EmptySectionPrompt
                                sectionTitle={section.title}
                                sectionId={section.id}
                                contentId={cleanedItem.id}
                                companyId={companyId || activeCompanyRole?.companyId}
                                onContentUpdate={handleContentUpdate}
                                onOpenAutoFill={openAutoFillSafely}
                              />
                            ) : (
                              <EditableContent
                                content={cleanedItem}
                                onContentUpdate={handleContentUpdate}
                                companyId={companyId || activeCompanyRole?.companyId}
                                templateId={template.id}
                                className="bg-transparent"
                                refreshTrigger={refreshTrigger}
                                isEditing={isEditingProp}
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Content Available</h3>
                  <p className="text-sm">
                    This document doesn't have any sections to display.
                  </p>
                  <div className="mt-4 text-xs text-gray-400">
                    <p>Template ID: {template?.id}</p>
                    <p>Template Name: {template?.name}</p>
                    <p>Sections Count: {template?.sections?.length || 0}</p>
                  </div>
                </div>
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
      />

      {/* AI Auto-Fill All Sections Dialog */}
      <AIAutoFillDialog
        open={showAutoFillDialog}
        onOpenChange={setShowAutoFillDialog}
        template={template}
        companyId={companyId}
        productId={selectedProductId}
        onContentUpdate={handleContentUpdate}
      />

      {/* AI Document Validation Dialog */}
      <AIDocumentValidationDialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
        template={template}
        companyId={companyId}
        companyName={activeCompanyRole?.companyName}
        onContentUpdate={handleContentUpdate}
      />
    </div>
  );
}