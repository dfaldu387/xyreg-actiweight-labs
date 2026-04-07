import React, { useEffect, useState } from 'react';
import { FileText, Download, Share, Save, History, Sparkles, StickyNote, Wand2, GitBranch, MoreHorizontal, ArrowUpFromLine } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AIContentBlock } from './AIContentBlock';
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
import { EmptySectionPrompt } from './EmptySectionPrompt';

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
}

export function LiveEditor({ template, className = '', onContentUpdate, companyId, onDocumentSaved, isEditingExistingDocument = false, editingDocumentId = null, onAIGenerate, onAddAutoNote, currentNotes = [], isUploadedDocument = false, uploadedDocumentSaved = false, onUploadedDocumentSaved, disabled = false, selectedScope = 'company', selectedProductId, uploadedFileInfo, onDocumentControlChange, companyLogoUrl, onPushToDeviceFields, onCustomSave, isRecord = false, recordId, nextReviewDate, documentNumber, hideVersioning = false }: LiveEditorProps) {
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
    setSelectedSection({
      title: section.title,
      content: currentContent
    });
    setShowAIModal(true);
  };

  const handleAIContentGenerated = (newContent: string) => {
    if (selectedSection && onContentUpdate) {
      // Update the first content item in the section with the new AI-generated content
      const firstContentItem = template?.sections?.find(s => s.title === selectedSection.title)?.content?.[0];
      if (firstContentItem) {
        onContentUpdate(firstContentItem.id, newContent);
      }
    }
    setShowAIModal(false);
    setSelectedSection(null);
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
      
      await DocumentExportService.exportDocument(template, {
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowAutoFillDialog(true)}
                    className="border-amber-300 text-amber-500 hover:bg-amber-50 h-8 w-8"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI Auto-Fill</TooltipContent>
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
        <div className="bg-white min-h-full p-0">
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
          <div className="px-8 space-y-6">
            {template?.sections && template.sections.length > 0 ? (
              template.sections
                .sort((a, b) => a.order - b.order)
                .map((section, sectionIndex) => (
                <div key={section.id} className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-gray-300 pb-2">
                    <h2 className="text-lg font-bold text-gray-800">
                      {section.title}
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIIconClick(section)}
                      className="h-8 w-8 p-0 hover:bg-amber-50 hover:border-amber-300"
                      title={`Generate AI content for ${section.title}`}
                    >
                      <Wand2 className="w-4 h-4 text-amber-500" />
                    </Button>
                  </div>
                  <div className="space-y-2 pl-4">
                    {(Array.isArray(section.content) ? section.content : []).map((contentItem, contentIndex) => (
                      <div key={contentItem.id} className="space-y-2">
                        {contentItem.type === 'heading' && (
                          <h3 className="text-base font-semibold text-gray-800 mt-4">
                            {contentItem.content}
                          </h3>
                        )}
                        {contentItem.type === 'table' && (
                          <div className="my-4">
                            <table className="w-full border-collapse border border-gray-300 text-sm">
                              <tbody>
                                {contentItem.content.split('\n').filter(row => row.trim()).map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {row.split('|').map((cell, cellIndex) => (
                                        <td key={cellIndex} className="border border-gray-300 px-3 py-2">
                                          <HighlightedContent 
                                            content={cell.trim()}
                                            contentId={`${contentItem.id}-cell-${rowIndex}-${cellIndex}`}
                                            onAIGenerate={(prompt) => {
                                              // Handle AI generation for table cells
                                              // console.log('AI generation requested for table cell:', prompt);
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
                        {contentItem.type !== 'heading' && contentItem.type !== 'table' && (
                          <>
                            {(!contentItem.content || contentItem.content.trim() === '' || contentItem.content === '[AI_PROMPT_NEEDED]') && !contentItem.isAIGenerated ? (
                              <EmptySectionPrompt
                                sectionTitle={section.title}
                                sectionId={section.id}
                                contentId={contentItem.id}
                                companyId={companyId || activeCompanyRole?.companyId}
                                onContentUpdate={handleContentUpdate}
                                onOpenAutoFill={() => setShowAutoFillDialog(true)}
                              />
                            ) : contentItem.isAIGenerated ? (
                              <AIContentBlock
                                content={contentItem}
                                sectionTitle={section.title}
                                onContentUpdate={handleContentUpdate}
                                className="bg-transparent border-none"
                              />
                            ) : (
                              <EditableContent
                                content={contentItem}
                                onContentUpdate={handleContentUpdate}
                                companyId={companyId || activeCompanyRole?.companyId}
                                templateId={template.id}
                                className="bg-transparent"
                                refreshTrigger={refreshTrigger}
                              />
                            )}
                          </>
                        )}
                      </div>
                    ))}
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
        onContentUpdate={handleContentUpdate}
      />
    </div>
  );
}