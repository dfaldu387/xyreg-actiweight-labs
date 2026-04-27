import React, { useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertTriangle, FileEdit, StickyNote, MessageSquare, FileText, Plus, Upload, Search, ArrowLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { DocumentSidebar } from './DocumentSidebar';
import { DocumentEditorSidebar } from './DocumentEditorSidebar';
import { DocumentPreview } from './DocumentPreview';
import { LiveEditor } from './LiveEditor';
import { NotesPanel } from './NotesPanel';
import { ContentGenerationModal } from './ContentGenerationModal';
import { useDocumentTemplate } from '@/hooks/useDocumentTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stepper } from '@/components/ui/stepper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { TemplateBrowserModal } from './TemplateBrowserModal';
import { DocFileUpload } from './DocFileUpload';
import { SOPDocumentContentService } from '@/services/sopDocumentContentService';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { buildCompanyBreadcrumbs } from '@/utils/breadcrumbUtils';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { DocumentGenerationService } from '@/services/documentGenerationService';
import { DocumentRoleFillingService } from '@/services/DocumentRoleFillingService';
import { AIContentRecommendationService } from '@/services/aiContentRecommendationService';
import { DocumentTemplatePersistenceService } from '@/services/documentTemplatePersistenceService';
import { DocumentStudioPersistenceService, DocumentStudioData } from '@/services/documentStudioPersistenceService';
import { DocumentVersionService } from '@/services/documentVersionService';
import { DocumentVersionModal } from './DocumentVersionModal';
import { SendForReviewStep } from './SendForReviewStep';
import { supabase } from '@/integrations/supabase/client';
import { RestrictedPreviewBanner } from '../subscription/RestrictedPreviewBanner';
import { toast } from 'sonner';
import { AISuggestionService } from '@/services/aiSuggestionService';
import { getDefaultSectionsForType } from '@/utils/documentTemplateUtils';
import { getSOPContentByName, sopContentToSections } from '@/data/sopFullContent';
import { extractFieldsFromSections } from '@/utils/documentToFieldExtractor';
import { useProductFieldSuggestions } from '@/hooks/useProductFieldSuggestions';

interface DocumentComposerProps {
  disabled?: boolean;
}

export function DocumentComposer({ disabled = false }: DocumentComposerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { companyName: urlCompanyName } = useParams<{ companyName: string }>();
  const { activeCompanyRole, switchCompanyRole } = useCompanyRole();
  const { lang } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedScope, setSelectedScope] = useState<'company' | 'product'>('company');
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ filePath: string; fileName: string; fileSize?: number } | null>(null);
  const [smartData, setSmartData] = useState<any>(null);
  const [roleMappings, setRoleMappings] = useState<any[]>([]);
  // activeTab removed — single editor mode, no more tab switching
  const [notes, setNotes] = useState<any[]>([]);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentStudioData | null>(null);
  const [showDocumentList, setShowDocumentList] = useState(false);
  const [documents, setDocuments] = useState<DocumentStudioData[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditingExistingDocument, setIsEditingExistingDocument] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [isUploadedDocument, setIsUploadedDocument] = useState(false);
  const [uploadedDocumentSaved, setUploadedDocumentSaved] = useState(false);
  const [documentControlData, setDocumentControlData] = useState<any>(null);
  const [isRecord, setIsRecord] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [nextReviewDate, setNextReviewDate] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState<string | null>(null);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [showCIDocumentSearch, setShowCIDocumentSearch] = useState(false);
  const [ciDocuments, setCIDocuments] = useState<any[]>([]);
  const [ciSearchQuery, setCISearchQuery] = useState('');
  const [isLoadingCIDocuments, setIsLoadingCIDocuments] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentStudioData | null>(null);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [viewingRefDoc, setViewingRefDoc] = useState<{ url: string; fileName: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | undefined>(undefined);
  const [contentModal, setContentModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    sectionTitle?: string;
    sources?: string[];
  }>({
    isOpen: false,
    title: '',
    content: ''
  });
  const productId = searchParams.get('productId');
  const templateId = searchParams.get('templateId');
  const createNew = searchParams.get('createNew') === 'true';
  const docName = searchParams.get('docName');
  const docType = searchParams.get('docType');

  // Product field suggestions hook
  const { createSuggestions } = useProductFieldSuggestions(
    productId || selectedProductId || undefined,
    activeCompanyRole?.companyId
  );

  const handlePushToDeviceFields = () => {
    const currentTemplate = generatedTemplate || template;
    if (!currentTemplate?.sections) {
      toast.error('No document content to push');
      return;
    }
    const effectiveProductId = productId || selectedProductId;
    if (!effectiveProductId) {
      toast.error('No product selected. Push to Device Fields requires a product-scoped document.');
      return;
    }
    const extractions = extractFieldsFromSections(currentTemplate.sections);
    if (extractions.length === 0) {
      toast.info('No field values found in the document to push');
      return;
    }
    createSuggestions.mutate(
      extractions.map(e => ({
        field_key: e.fieldKey,
        field_label: e.fieldLabel,
        suggested_value: e.suggestedValue,
      }))
    );
  };

  const decodedCompanyName = urlCompanyName ? decodeURIComponent(urlCompanyName) : null;
  const displayCompanyName = decodedCompanyName || activeCompanyRole?.companyName || 'Company';

  // Effect to sync company context when URL company differs from active context
  React.useEffect(() => {
    if (decodedCompanyName && activeCompanyRole?.companyName !== decodedCompanyName) {
      // Find the company role that matches the URL company name
    }
  }, [decodedCompanyName, activeCompanyRole?.companyName]);

  // Fetch company logo
  React.useEffect(() => {
    const fetchLogo = async () => {
      if (!activeCompanyRole?.companyId) return;
      try {
        const { data } = await supabase
          .from('companies')
          .select('logo_url')
          .eq('id', activeCompanyRole.companyId)
          .single();
        setCompanyLogoUrl(data?.logo_url || undefined);
      } catch (e) {
        console.error('Failed to fetch company logo:', e);
      }
    };
    fetchLogo();
  }, [activeCompanyRole?.companyId]);

  const { template, isLoading, error } = useDocumentTemplate(
    templateId || selectedTemplateId,
    productId || selectedProductId,
    docName || undefined
  );

  // Dynamic mode - no URL parameters means we show the selection interface
  const isLocked = !!templateId;

  // Navigation functions
  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    if (displayCompanyName) {
      navigate(`/app/company/${encodeURIComponent(displayCompanyName)}`);
    }
  };

  // Build breadcrumbs early so they're available for loading states
  const breadcrumbs = buildCompanyBreadcrumbs(
    displayCompanyName,
    "Document Studio",
    handleNavigateToClients,
    handleNavigateToCompany
  );

  // Load saved template from Supabase and localStorage on mount
  React.useEffect(() => {
    const loadSavedTemplate = async () => {
      if (template?.id && activeCompanyRole?.companyId) {
        // First try loading from Supabase
        const result = await DocumentStudioPersistenceService.loadTemplate(
          activeCompanyRole.companyId,
          template.id,
          productId || selectedProductId || undefined
        );

        if (result.success && result.data) {
          const defaultDocControl = {
            sopNumber: (result.data as any).document_number || result.data.name?.match(/^[A-Z]{2,6}-\d{3}/)?.[0] || '',
            documentTitle: (result.data.name || '').replace(/^[A-Z]{2,6}-\d{3}\s+/, ''),
            version: 'v1.0',
            effectiveDate: new Date(),
            documentOwner: '',
            preparedBy: { name: '', title: '', date: new Date() },
            reviewedBy: { name: '', title: '', date: new Date() },
            approvedBy: { name: '', title: '', date: new Date() },
          };
          setGeneratedTemplate({
            id: result.data.template_id,
            name: result.data.name,
            type: result.data.type,
            sections: result.data.sections,
            productContext: result.data?.product_context,
            documentControl: result.data.document_control || defaultDocControl,
            revisionHistory: result.data.revision_history,
            associatedDocuments: result.data.associated_documents,
            metadata: result.data.metadata
          });
          setSmartData(result.data.smart_data);
          setRoleMappings(result.data.role_mappings || []);
          setNotes(result.data.notes || []);
          return;
        }

        // Fallback to localStorage
        const savedTemplate = DocumentTemplatePersistenceService.loadTemplateFromLocalStorage(template.id);
        if (savedTemplate) {
          setGeneratedTemplate(savedTemplate);
          return;
        }

        // Final fallback: use the template from the hook if available
        if (template) {
          setGeneratedTemplate(template);
          return;
        }
      }
    };

    loadSavedTemplate().finally(() => setHasAttemptedLoad(true));
  }, [template?.id, activeCompanyRole?.companyId, productId, selectedProductId]);

  // Show "My Documents" by default when no URL parameters are present
  React.useEffect(() => {
    // Only run this on initial mount when not in locked mode (no templateId/productId in URL)
    if (!isLocked && hasAttemptedLoad && activeCompanyRole?.companyId) {
      const initializeView = async () => {
        setShowDocumentList(true);
        setShowCreateTemplate(false);
        await loadDocuments();
      };

      initializeView();
    }
  }, [isLocked, hasAttemptedLoad, activeCompanyRole?.companyId]);

  // When in locked mode (URL has templateId/productId), show the stepper/editor UI
  React.useEffect(() => {
    // Only apply this effect if we have URL parameters AND we're not already in create mode
    // This prevents overriding the state when user clicks "Add Document"
    if (isLocked && !isLoading && template && hasAttemptedLoad && !showCreateTemplate) {
      setShowCreateTemplate(true);
      setShowDocumentList(false);
      setIsEditingExistingDocument(true);
      // Look up actual UUID from document_studio_templates so saves target the correct row
      if (templateId && !editingDocumentId) {
        const lookupId = async () => {
          const { data } = await supabase
            .from('document_studio_templates')
            .select('id')
            .eq('template_id', templateId)
            .maybeSingle();
          setEditingDocumentId(data?.id || null);
        };
        lookupId();
      }
    }
  }, [isLocked, isLoading, template, hasAttemptedLoad, showCreateTemplate, templateId, editingDocumentId]);

  // Handle createNew param from CI card flow - start new document with pre-filled name
  React.useEffect(() => {
    if (createNew && hasAttemptedLoad && activeCompanyRole?.companyId) {
      // Start create flow with pre-filled document name
      setShowCreateTemplate(true);
      setShowDocumentList(false);
      setIsEditingExistingDocument(false);
      setEditingDocumentId(null);
      setCurrentStep(1);

      // Create a basic template with the CI name pre-filled
      if (docName) {
        const resolvedType = docType || 'Standard';
        // Try to load rich SOP content if available
        const sopContent = getSOPContentByName(docName);
        const sections = sopContent
          ? sopContentToSections(sopContent)
          : getDefaultSectionsForType(resolvedType);
        const newTemplate = {
          id: `new-${Date.now()}`,
          name: docName,
          type: resolvedType,
          sections,
        documentControl: {
            sopNumber: docName?.match(/^[A-Z]{2,6}-\d{3}/)?.[0] || '',
            documentTitle: (docName || '').replace(/^[A-Z]{2,6}-\d{3}\s+/, ''),
            version: 'v1.0',
            status: 'Draft',
            effectiveDate: new Date(),
            documentOwner: '',
            preparedBy: { name: '', title: '', date: new Date() },
            reviewedBy: { name: '', title: '', date: new Date() },
            approvedBy: { name: '', title: '', date: new Date() },
          }
        };
        setGeneratedTemplate(newTemplate);
        if (productId) {
          setSelectedProductId(productId);
          setSelectedScope('product');
        }
      }
    }
  }, [createNew, hasAttemptedLoad, activeCompanyRole?.companyId, docName, docType, productId]);

  // Note: Removed auto-trigger to prevent automatic saving to database when template is selected
  // Documents should only be saved when user explicitly clicks "Save Draft"

  // Sync documentNumber changes into generatedTemplate.documentControl reactively
  React.useEffect(() => {
    if (!documentNumber || !generatedTemplate?.documentControl) return;
    const dc = generatedTemplate.documentControl;
    if (dc.sopNumber !== documentNumber) {
      const cleanTitle = (dc.documentTitle || '').replace(/^[A-Z]{2,6}-\d{3}\s+/, '');
      setGeneratedTemplate(prev => prev ? {
        ...prev,
        documentControl: {
          ...prev.documentControl!,
          sopNumber: documentNumber,
          documentTitle: cleanTitle,
        }
      } : prev);
    }
  }, [documentNumber]);

  // Only show loading if we're in locked mode and actually loading
  if (isLocked && isLoading) {
    return (
      <>
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={lang('draftStudio.title')}
          subtitle={lang('draftStudio.subtitle')}
          actions={
            <div className="text-sm font-medium text-company-brand">
              {displayCompanyName}
            </div>
          }
        />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{lang('draftStudio.preparingDocument')}</h3>
              <p className="text-muted-foreground">
                {lang('draftStudio.settingUpComposer')}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Only show error if we're in locked mode and there's an actual error
  if (isLocked && (error || (!isLoading && !template))) {
    return (
      <>
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={lang('draftStudio.title')}
          subtitle={lang('draftStudio.subtitle')}
          actions={
            <div className="text-sm font-medium text-company-brand">
              {displayCompanyName}
            </div>
          }
        />
        <div className="flex items-center justify-center flex-1">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{lang('draftStudio.errorLoadingTemplate')}</h3>
              <p className="text-muted-foreground mb-4">
                {error || lang('draftStudio.failedToLoadTemplate')}
              </p>
              <Button onClick={() => window.location.reload()}>
                {lang('common.tryAgain')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const handleSelectionChange = (selection: {
    scope: 'company' | 'product';
    productId?: string;
    templateId?: string;
  }) => {
    // Update local state to trigger template loading
    setSelectedTemplateId(selection.templateId || '');
    setSelectedProductId(selection.productId || '');
    setSelectedScope(selection.scope);

    // Clear any previously generated template when selection changes
    setGeneratedTemplate(null);
    setSmartData(null);
    setSelectedDocument(null);

    // Reset uploaded document flags when switching templates
    setIsUploadedDocument(false);
    setUploadedDocumentSaved(false);
  };

  const handleDocumentSelect = (document: DocumentStudioData) => {
    // Clicking a document title opens it in edit mode directly
    handleEditDocument(document);
  };

  const handleShowDocumentList = async () => {
    setShowDocumentList(true);
    setSelectedDocument(null);
    setShowCreateTemplate(false);

    // Load documents when showing the list
    await loadDocuments();
  };

  const loadDocuments = async () => {
    if (activeCompanyRole?.companyId) {
      try {
        setIsLoadingDocuments(true);
        const result = await DocumentStudioPersistenceService.getCompanyTemplates(activeCompanyRole.companyId);
        if (result.success && result.data) {
          setDocuments(result.data);
        } else {
          setDocuments([]);
        }
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setIsLoadingDocuments(false);
      }
    }
  };

  const handleDocumentSaved = async () => {
    // Refresh the document list when a document is saved
    await loadDocuments();

    // Also reload the current template content if we're editing a document
    if (editingDocumentId) {
      try {
        const { data: restoredDocument, error } = await supabase
          .from('document_studio_templates')
          .select('*')
          .eq('id', editingDocumentId)
          .single();

        if (error) {
          console.error('Error reloading document after save:', error);
          return;
        }

        if (restoredDocument && restoredDocument.sections) {
          // Update the generated template with the reloaded content
          setGeneratedTemplate(prev => prev ? {
            ...prev,
            sections: restoredDocument.sections,
            name: restoredDocument.name
          } : null);
        }
      } catch (error) {
        console.error('Error in handleDocumentSaved:', error);
      }
    }
  };

  const handleShowCreateTemplate = () => {
    // Clear URL parameters when creating a new document
    navigate(`/app/company/${encodeURIComponent(displayCompanyName)}/document-studio`, { replace: true });

    setShowCreateTemplate(true);
    setShowDocumentList(false);
    setSelectedDocument(null);
    setCurrentStep(1);
    setIsEditingExistingDocument(false); // Mark as creating new document
    setEditingDocumentId(null); // Clear editing document ID

    // Clear any loaded template data
    setGeneratedTemplate(null);
    setSmartData(null);
    setRoleMappings([]);
    setNotes([]);
  };

  const handleSidebarExpansion = (isExpanded: boolean) => {
    if (isExpanded) {
      setShowCreateTemplate(true);
      setShowDocumentList(false);
      setSelectedDocument(null);
      setCurrentStep(1);
      setIsEditingExistingDocument(false);
      setEditingDocumentId(null);
    } else {
      setShowCreateTemplate(false);
    }
  };

  // --- Add Document Dialog handlers ---
  const handleOpenAddDocumentDialog = () => {
    setShowAddDocumentDialog(true);
  };

  const handleBlankDocument = () => {
    setShowAddDocumentDialog(false);
    // Use handleShowCreateTemplate but with a blank template pre-built
    navigate(`/app/company/${encodeURIComponent(displayCompanyName)}/document-studio`, { replace: true });
    setShowCreateTemplate(true);
    setShowDocumentList(false);
    setSelectedDocument(null);
    setCurrentStep(1);
    setIsEditingExistingDocument(false);
    setEditingDocumentId(null);

    const blankTemplate = {
      id: `new-${Date.now()}`,
      name: 'Untitled Document',
      type: 'Standard',
      sections: getDefaultSectionsForType('Standard'),
      documentControl: {
        sopNumber: '',
        documentTitle: 'Untitled Document',
        version: 'v1.0',
        status: 'Draft',
        effectiveDate: new Date(),
        documentOwner: '',
        preparedBy: { name: '', title: '', date: new Date() },
        reviewedBy: { name: '', title: '', date: new Date() },
        approvedBy: { name: '', title: '', date: new Date() },
      }
    };
    setGeneratedTemplate(blankTemplate);
    setSmartData(null);
    setRoleMappings([]);
    setNotes([]);

    // Default to product scope when productId is present
    if (productId) {
      setSelectedProductId(productId);
      setSelectedScope('product');
    }
  };

  const handleBrowseTemplates = () => {
    setShowAddDocumentDialog(false);
    setShowTemplateBrowser(true);
  };

  const handleUploadOwn = () => {
    setShowAddDocumentDialog(false);
    setShowUploadDialog(true);
  };

  const handleOpenCIDocumentSearch = async () => {
    setShowCIDocumentSearch(true);
    setCISearchQuery('');
    setIsLoadingCIDocuments(true);
    try {
      let query = supabase
        .from('phase_assigned_document_template')
        .select('id, name, status, document_type, product_id, phase_id, company_id')
        .eq('company_id', activeCompanyRole?.companyId || '');
      if (productId) {
        query = query.eq('product_id', productId);
      }
      const { data, error } = await query.order('name');
      if (!error && data) {
        setCIDocuments(data);
      }
    } catch (err) {
      console.error('Error loading CI documents:', err);
    } finally {
      setIsLoadingCIDocuments(false);
    }
  };

  const handleSelectCIDocument = (doc: any) => {
    setShowAddDocumentDialog(false);
    setShowCIDocumentSearch(false);
    navigate(`/app/company/${encodeURIComponent(displayCompanyName)}/document-studio?templateId=${doc.id}&productId=${doc.product_id}`);
  };

  const handleTemplateBrowserSelect = async (document: any) => {
    // Load SOP content if applicable
    if (document.document_type === 'SOP' && document.id) {
      try {
        if (document.file_path || document.public_url) {
          setUploadedFileInfo({
            filePath: document.file_path || document.public_url,
            fileName: document.file_name || document.name,
            fileSize: document.file_size
          });
        }
        const sopContent = await SOPDocumentContentService.extractContentFromSOP(document.id);
        if (sopContent) {
          const tmpl = SOPDocumentContentService.convertSOPToTemplate(sopContent);
          handleGenerateDocument(tmpl);
          setShowTemplateBrowser(false);
          // Enter create mode
          setShowCreateTemplate(true);
          setShowDocumentList(false);
          setIsEditingExistingDocument(false);
          setEditingDocumentId(null);
          setCurrentStep(1);
          if (productId) {
            setSelectedProductId(productId);
            setSelectedScope('product');
          }
          return;
        }
      } catch (error) {
        console.error('Error loading SOP content:', error);
      }
    }
    setShowTemplateBrowser(false);
    // Fallback: enter create mode with template selection
    handleShowCreateTemplate();
  };

  const handleUploadComplete = (file: File | null, filePath?: string) => {
    if (file && filePath) {
      setUploadedFileInfo({ filePath, fileName: file.name, fileSize: file.size });
      setShowUploadDialog(false);
      // Enter create mode
      setShowCreateTemplate(true);
      setShowDocumentList(false);
      setIsEditingExistingDocument(false);
      setEditingDocumentId(null);
      setCurrentStep(1);
      if (productId) {
        setSelectedProductId(productId);
        setSelectedScope('product');
      }
    }
  };

  const handleEditDocument = (document: DocumentStudioData) => {
    // Convert to template format and load in stepper
    const defaultDocControl = {
      sopNumber: (document as any).document_number || document.name?.match(/^[A-Z]{2,6}-\d{3}/)?.[0] || '',
      documentTitle: (document.name || '').replace(/^[A-Z]{2,6}-\d{3}\s+/, ''),
      version: 'v1.0',
      effectiveDate: new Date(),
      documentOwner: '',
      preparedBy: { name: '', title: '', date: new Date() },
      reviewedBy: { name: '', title: '', date: new Date() },
      approvedBy: { name: '', title: '', date: new Date() },
    };
    const documentTemplate = {
      id: document.template_id,
      name: document.name,
      type: document.type,
      sections: document.sections,
      productContext: document?.product_context,
      documentControl: document.document_control || defaultDocControl,
      revisionHistory: document.revision_history,
      associatedDocuments: document.associated_documents,
      metadata: document.metadata
    };

    setGeneratedTemplate(documentTemplate);
    setSmartData(document.smart_data);
    setRoleMappings(document.role_mappings || []);
    setNotes(document.notes || []);

    // Store the document ID for updating
    setEditingDocumentId(document.id || null);

    // Reset uploaded document flags when editing an existing document
    setIsUploadedDocument(false);
    setUploadedDocumentSaved(false);

    // Only update URL parameters for system templates, not temporary/uploaded documents
    // Temporary IDs like "new-..." or "uploaded-..." don't exist in the template library
    const isTemporaryTemplate = document.template_id?.startsWith('uploaded-') || document.template_id?.startsWith('new-');

    if (!isTemporaryTemplate) {
      // Update URL parameters to reflect the selected system template
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('templateId', document.template_id);
      if (document.product_id) {
        newSearchParams.set('productId', document.product_id);
      }
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    } else {
      // For temporary/uploaded documents, clear URL parameters since we're loading from database directly
      navigate(`/app/company/${encodeURIComponent(displayCompanyName)}/document-studio`, { replace: true });
    }

    // Show the stepper/editor instead of document list
    setShowCreateTemplate(true);
    setShowDocumentList(false);
    setSelectedDocument(null);    // We don't need to show document preview when editing
    setCurrentStep(1);            // Start from the first step
    // Single editor mode — no tab switching needed
    setIsEditingExistingDocument(true); // Mark as editing existing document
  };

  const handleDeleteDocument = async (document: DocumentStudioData) => {
    if (!activeCompanyRole?.companyId) {
      toast.error('Company information not available');
      return;
    }
    setTimeout(() => setDocumentToDelete(document), 0);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete || !activeCompanyRole?.companyId) return;

    const docToDelete = documentToDelete;
    setDocumentToDelete(null); // Close dialog immediately

    // CI-backed documents cannot be deleted from Studio alone
    if (docToDelete.linkedCiId) {
      toast.error('This document is managed in Doc CI and cannot be deleted from Document Studio. Remove it from the Technical File or Doc CI registry instead.');
      return;
    }

    try {
      const success = await DocumentStudioPersistenceService.deleteTemplate(docToDelete.id!, activeCompanyRole.companyId);
      if (success) {
        // If the deleted document was selected, clear all document state
        if (selectedDocument?.id === docToDelete.id) {
          setSelectedDocument(null);
          setGeneratedTemplate(null);
          setSmartData(null);
          setRoleMappings([]);
          setIsEditingExistingDocument(false);
          setEditingDocumentId(null);
        }
        // Refresh the document list
        await loadDocuments();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleGenerateDocument = async (sopTemplate?: any) => {
    if (!activeCompanyRole?.companyId) {
      toast.error('Company information not available');
      return;
    }

    // If a SOP template is provided, run it through auto-population to inject company data
    if (sopTemplate) {
      // Check if this is from Upload Own Document (has temporary ID starting with 'uploaded-')
      const isFromUpload = sopTemplate.id?.startsWith('uploaded-');
      setIsUploadedDocument(isFromUpload);
      setUploadedDocumentSaved(false); // Reset save status

      // Route through auto-population to inject company name, personnel, dates, etc.
      try {
        const { AutomatedTemplatePopulationService } = await import('@/services/automatedTemplatePopulationService');
        const result = await AutomatedTemplatePopulationService.autoPopulateTemplate(
          sopTemplate,
          activeCompanyRole.companyId,
          selectedProductId || productId || undefined
        );
        if (result.template) {
          setGeneratedTemplate(result.template);
          setSmartData({
            populatedFields: result.populatedFields,
            missingDataIndicators: result.missingDataIndicators,
            suggestions: result.suggestions,
            completionPercentage: result.completionPercentage,
          });
        } else {
          setGeneratedTemplate(sopTemplate);
        }
      } catch (err) {
        console.error('[DocumentComposer] Auto-population failed for SOP template, using raw template:', err);
        setGeneratedTemplate(sopTemplate);
      }

      toast.success('SOP document loaded successfully!');
      return;
    }

    const templateId = selectedTemplateId || template?.id;
    if (!templateId) {
      toast.error('Please select a template first');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await DocumentGenerationService.generateSmartDocumentWithSuggestions(
        templateId,
        activeCompanyRole.companyId,
        selectedProductId || productId || undefined
      );

      if (result.success && result.updatedTemplate) {
        setGeneratedTemplate(result.updatedTemplate);
        setSmartData(result.smartData);

        // Show inline suggestions for AI-generated content
        const aiGeneratedCount = result.aiGeneratedSuggestions?.length || 0;

        if (aiGeneratedCount > 0) {
          toast.success(`Document generated with ${aiGeneratedCount} AI suggestions. Review and accept/reject each suggestion.`, {
            description: 'AI-generated content is shown inline with accept/reject options'
          });
        } else {
          toast.success('Document generated successfully!');
        }
      } else {
        toast.error(result.error || 'Failed to generate document');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('An unexpected error occurred while generating the document');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRoleMappingsUpdated = (mappings: any[]) => {
    setRoleMappings(mappings);

    // Apply role mappings to the current template
    if (generatedTemplate || template) {
      const templateToUpdate = generatedTemplate || template;
      const filledTemplate = DocumentRoleFillingService.fillDocumentRoles(templateToUpdate, mappings);
      setGeneratedTemplate(filledTemplate);

      const stats = DocumentRoleFillingService.getRoleFillStats(filledTemplate, mappings);
      toast.success(`Document updated! ${stats.filledRoles} of ${stats.totalRoles} roles filled (${stats.completionPercentage}% complete)`);
    }
  };

  const handleContentUpdate = async (contentId: string, newContent: string) => {
    // Update the generated template or template with new content
    const currentTemplate = generatedTemplate || template;
    if (!currentTemplate) {
      console.warn('Template not available for content update');
      return;
    }

    // Special case: Handle full document content update from unified editor
    if (contentId === 'full-document-content') {
      try {
        const updatedSections = JSON.parse(newContent);
        const updatedTemplate = {
          ...currentTemplate,
          sections: updatedSections,
        };
        setGeneratedTemplate(updatedTemplate);
        const templateId = currentTemplate.id || 'temp-template';
        DocumentTemplatePersistenceService.saveTemplateToLocalStorage(templateId, updatedTemplate);
      } catch (e) {
        console.error('Failed to parse full document content:', e);
      }
      return;
    }

    // Special case: Handle document title update
    if (contentId === 'document-title') {
      const updatedTemplate = {
        ...currentTemplate,
        name: newContent
      };

      setGeneratedTemplate(updatedTemplate);

      // Save to localStorage
      const templateId = currentTemplate.id || 'temp-template';
      DocumentTemplatePersistenceService.saveTemplateToLocalStorage(
        templateId,
        updatedTemplate
      );
      return;
    }

    // Special case: Handle section title rename
    if (contentId.startsWith('section-title-')) {
      const sectionId = contentId.replace('section-title-', '');
      const updatedTemplate = {
        ...currentTemplate,
        sections: currentTemplate.sections.map(section =>
          section.id === sectionId
            ? { ...section, customTitle: newContent }
            : section
        )
      };
      setGeneratedTemplate(updatedTemplate);
      const templateId = currentTemplate.id || 'temp-template';
      DocumentTemplatePersistenceService.saveTemplateToLocalStorage(templateId, updatedTemplate);
      return;
    }

    // Special case: Handle section header visibility toggle
    if (contentId.startsWith('section-visibility-')) {
      const sectionId = contentId.replace('section-visibility-', '');
      const updatedTemplate = {
        ...currentTemplate,
        sections: currentTemplate.sections.map(section =>
          section.id === sectionId
            ? { ...section, showHeader: newContent === 'show' }
            : section
        )
      };
      setGeneratedTemplate(updatedTemplate);
      const templateId = currentTemplate.id || 'temp-template';
      DocumentTemplatePersistenceService.saveTemplateToLocalStorage(templateId, updatedTemplate);
      return;
    }

    // Find and update the content item in sections
    const updatedTemplate = {
      ...currentTemplate,
      sections: currentTemplate.sections.map(section => ({
        ...section,
        content: section.content.map(contentItem =>
          contentItem.id === contentId
            ? { ...contentItem, content: newContent }
            : contentItem
        )
      }))
    };

    // Only update the local state - do not automatically save to database
    setGeneratedTemplate(updatedTemplate);

    // Save to localStorage only as temporary storage
    const templateId = currentTemplate.id || 'temp-template';
    DocumentTemplatePersistenceService.saveTemplateToLocalStorage(
      templateId,
      updatedTemplate
    );
  };

  const handleDocumentControlChange = (field: string, value: string) => {
    const currentTemplate = generatedTemplate;
    if (!currentTemplate) return;

    const dc: any = { ...(currentTemplate.documentControl || {}) };

    if (field === 'documentOwner') {
      dc.documentOwner = value || undefined;
    } else if (field === 'documentTitle') {
      dc.documentTitle = value;
    } else if (field === 'sopNumber') {
      dc.sopNumber = value;
    } else if (field === 'version') {
      dc.version = value;
    } else if (field === 'effectiveDate') {
      dc.effectiveDate = value ? new Date(value) : undefined;
    } else if (field === 'nextReviewDate') {
      dc.nextReviewDate = value ? new Date(value) : undefined;
    } else if (field.startsWith('preparedBy.')) {
      dc.preparedBy = { ...(dc.preparedBy || {}), name: value || '' };
    } else if (field.startsWith('reviewedBy.')) {
      dc.reviewedBy = { ...(dc.reviewedBy || {}), name: value || '' };
    } else if (field.startsWith('approvedBy.')) {
      dc.approvedBy = { ...(dc.approvedBy || {}), name: value || '' };
    }

    const updatedTemplate = { ...currentTemplate, documentControl: dc };
    setGeneratedTemplate(updatedTemplate);
  };

  const handleAIGenerate = async () => {
    if (!activeCompanyRole?.companyId) {
      toast.error('Company information not available');
      return;
    }

    if (!generatedTemplate) {
      toast.error('No document template available');
      return;
    }

    try {
      toast.info('Generating AI content for SOP document...');

      // Use the existing DocumentGenerationService to generate AI content
      const result = await DocumentGenerationService.generateSmartDocumentWithSuggestions(
        generatedTemplate.id,
        activeCompanyRole.companyId,
        selectedProductId || productId || undefined
      );

      if (result.success && result.updatedTemplate) {
        // Update the template with the original content (not AI-generated) so suggestions can be displayed
        setGeneratedTemplate(result.updatedTemplate);
        setSmartData(result.smartData);

        // Process AI suggestions and add them to the suggestion service
        const aiGeneratedCount = result.aiGeneratedSuggestions?.length || 0;

        if (aiGeneratedCount > 0) {
          // Clear any existing suggestions first
          AISuggestionService.clearSuggestions();

          // Add each suggestion to the service
          result.aiGeneratedSuggestions.forEach(suggestion => {
            AISuggestionService.createSuggestion(
              suggestion.contentId,
              suggestion.originalContent,
              suggestion.suggestedContent
            );
          });

          toast.success(`AI content generated with ${aiGeneratedCount} suggestions. Review and accept/reject each suggestion.`, {
            description: 'AI-generated content is shown inline with accept/reject options'
          });
        } else {
          toast.success('AI content generation completed!');
        }
      } else {
        toast.error(result.error || 'Failed to generate AI content');
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast.error('Failed to generate AI content');
    }
  };

  const handleContentEnhancement = async (suggestion: any) => {
    const companyId = activeCompanyRole?.companyId;
    if (!companyId) {
      toast.error('Company information not available');
      return;
    }

    try {
      // Get company context for content generation
      const { data: company } = await supabase
        .from('companies')
        .select('name, country, industry')
        .eq('id', companyId)
        .single();

      const content = await AIContentRecommendationService.generateContentForRecommendation(
        suggestion.action.data,
        company || {},
        companyId
      );

      // Find the matching section for the suggestion
      const sections = getDocumentSections();
      const sectionTitle = suggestion.action.data.sectionTitle || suggestion.title;

      // More robust section matching with keyword mapping
      const matchingSection = sections.find(section => {
        const sectionTitleLower = section.title.toLowerCase();
        const suggestionTitleLower = sectionTitle.toLowerCase();

        // Direct matches
        if (sectionTitleLower.includes(suggestionTitleLower) ||
          suggestionTitleLower.includes(sectionTitleLower)) {
          return true;
        }

        // Keyword-based matching for common terms
        const keywords = {
          'risk': ['risk', 'management', 'assessment'],
          'training': ['training', 'education', 'competency'],
          'quality': ['quality', 'management', 'system'],
          'compliance': ['compliance', 'regulatory', 'requirements'],
          'planning': ['planning', 'development', 'implementation']
        };

        for (const [key, terms] of Object.entries(keywords)) {
          if (suggestionTitleLower.includes(key) &&
            terms.some(term => sectionTitleLower.includes(term))) {
            return true;
          }
        }

        return section.id === suggestion.action.data.sectionId;
      });

      // Create note automatically with the generated content
      const newNote = {
        id: `note-${Date.now()}`,
        content: content || 'Content generated successfully',
        sectionReference: matchingSection?.id,
        sectionTitle: matchingSection?.title || sectionTitle, // Fallback to suggestion title
        timestamp: new Date(),
        type: 'generated-content' as const
      };

      setNotes(prev => [newNote, ...prev]);

      // Notes are shown in a modal now — no tab to switch to

      toast.success(`Generated content added to notes${matchingSection ? ` for ${matchingSection.title}` : ''}`);

      // Still show modal for immediate viewing if needed
      setContentModal({
        isOpen: true,
        title: suggestion.title,
        content: content || 'Content generated successfully',
        sectionTitle: suggestion.action.data.sectionTitle,
        sources: suggestion.sources
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    }
  };

  const handleExport = (format: 'docx' | 'pdf') => {
    toast.success(`Exporting document as ${format.toUpperCase()}...`);
    // Export functionality would be implemented here
  };

  const getDocumentSections = () => {
    const currentTemplate = generatedTemplate || template;
    if (!currentTemplate?.sections) return [];

    return currentTemplate.sections.map((section: any, index: number) => ({
      id: `section-${index}`,
      title: section.title || `Section ${index + 1}`
    }));
  };


  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={lang('draftStudio.title')}
        subtitle={lang('draftStudio.subtitle')}
        actions={
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                navigate(`/app/company/${encodeURIComponent(activeCompanyRole?.companyName || '')}/document-studio`)
                setShowDocumentList(true);
                setShowCreateTemplate(false);
                await loadDocuments();
              }}
              className="flex items-center gap-2"
              disabled={disabled}
            >
              <FileText className="w-4 h-4" />
              {lang('draftStudio.myDocuments')}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenAddDocumentDialog}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={disabled}
            >
              <Plus className="w-4 h-4" />
              {lang('draftStudio.addDocument')}
            </Button>
          </div>
        }
      />

      {disabled && <RestrictedPreviewBanner className="mt-2 !mb-0" />}
      {/* Document Studio Stepper */}
      {/* <div className="mx-4 mb-4"> */}
        {/* <Card>
          <CardContent className="py-6">
            <Stepper 
              steps={['Prepare', 'Finalize', 'Send for Review']}
              currentStep={1}
              className="mx-auto"
            />
          </CardContent>
        </Card> */}
      {/* </div> */}

      <div className="flex flex-1 min-h-0 overflow-hidden bg-background border pt-2 rounded-lg mb-4">
        {showDocumentList ? (
          <DocumentPreview
            document={null}
            showDocumentList={true}
            documents={documents}
            isLoading={isLoadingDocuments}
            onDocumentSelect={handleDocumentSelect}
            onEdit={handleEditDocument}
            onDuplicate={() => { }}
            onDelete={handleDeleteDocument}
            onDownload={() => { }}
            onShare={() => { }}
            onAddDocument={handleOpenAddDocumentDialog}
            disabled={disabled}
            companyId={activeCompanyRole?.companyId}
          />
        ) : (
          <>
            <DocumentEditorSidebar
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
              ciDocumentId={templateId}
              ciCompanyId={activeCompanyRole?.companyId}
              productId={productId || undefined}
              showCIProperties={false}
              onIsRecordChange={setIsRecord}
              onRecordIdChange={setRecordId}
              onNextReviewDateChange={setNextReviewDate}
              onDocumentNumberChange={setDocumentNumber}
              showSectionNumbers={(generatedTemplate || template)?.formatOptions?.showSectionNumbers}
              onShowSectionNumbersChange={(show) => {
                const currentTemplate = generatedTemplate || template;
                if (!currentTemplate) return;
                const updatedTemplate = {
                  ...currentTemplate,
                  formatOptions: { ...currentTemplate.formatOptions, showSectionNumbers: show }
                };
                setGeneratedTemplate(updatedTemplate);
                const templateId = currentTemplate.id || 'temp-template';
                DocumentTemplatePersistenceService.saveTemplateToLocalStorage(templateId, updatedTemplate);
              }}
              controlPanelProps={{
                productContext: template?.productContext,
                documentType: template?.type,
                isLocked,
                initialScope: productId ? 'product' : undefined,
                initialProductId: productId || undefined,
                createNew,
                docName,
                onSelectionChange: handleSelectionChange,
                onGenerateDocument: handleGenerateDocument,
                onFileUploaded: setUploadedFileInfo,
                isGenerating,
                template: generatedTemplate || template,
                smartData,
                onRoleMappingsUpdated: handleRoleMappingsUpdated,
                onContentEnhancement: handleContentEnhancement,
                disabled,
                
                onViewReferenceDocument: (url, fileName) => setViewingRefDoc({ url, fileName }),
              }}
            />

            {/* Main content - scrolls independently */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
              {viewingRefDoc ? (
                <div className="flex-1 flex flex-col h-full">
                  <div className="p-3 border-b bg-muted/30 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingRefDoc(null)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Return to Draft
                    </Button>
                    <span className="text-sm font-medium truncate">{viewingRefDoc.fileName}</span>
                  </div>
                  <iframe
                    src={viewingRefDoc.url}
                    className="flex-1 w-full border-0"
                    title={viewingRefDoc.fileName}
                  />
                </div>
              ) : showCreateTemplate ? (
                <div className="flex-1 flex flex-col bg-white h-full">
                  {/* Document Configuration Header */}
                  <div className="p-4 border-b bg-white">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-foreground">{lang('draftStudio.documentConfiguration')}</h2>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowNotesModal(true)}
                          title={lang('draftStudio.notes')}
                          className="h-8 w-8"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>





                  {/* Editor Area */}
                  <div className="flex-1 overflow-auto">
                    {currentStep === 3 ? (
                      <SendForReviewStep
                        documentTitle={generatedTemplate?.name || docName || 'Untitled'}
                        onBack={() => setCurrentStep(2)}
                        onSendForReview={async (message) => {
                          toast.success('Document sent for review');
                        }}
                      />
                    ) : generatedTemplate ? (
                      <LiveEditor
                        template={generatedTemplate}
                        onContentUpdate={handleContentUpdate}
                        companyId={activeCompanyRole?.companyId}
                        onDocumentSaved={handleDocumentSaved}
                        isEditingExistingDocument={!!editingDocumentId}
                        editingDocumentId={editingDocumentId}
                        onAIGenerate={() => {}}
                        onAddAutoNote={(note) => setNotes(prev => [note, ...prev])}
                        currentNotes={notes}
                        selectedScope={selectedScope}
                        selectedProductId={selectedProductId}
                        onDocumentControlChange={handleDocumentControlChange}
                        companyLogoUrl={companyLogoUrl}
                        onPushToDeviceFields={handlePushToDeviceFields}
                        isRecord={isRecord}
                        recordId={recordId || undefined}
                        nextReviewDate={nextReviewDate || undefined}
                        documentNumber={documentNumber || undefined}
                        onIsRecordChange={setIsRecord}
                        showSectionNumbers={(generatedTemplate || template)?.formatOptions?.showSectionNumbers}
                        onShowSectionNumbersChange={(show) => {
                          const currentTemplate = generatedTemplate || template;
                          if (!currentTemplate) return;
                          const updatedTemplate = {
                            ...currentTemplate,
                            formatOptions: { ...currentTemplate.formatOptions, showSectionNumbers: show }
                          };
                          setGeneratedTemplate(updatedTemplate);
                          const tid = currentTemplate.id || 'temp-template';
                          DocumentTemplatePersistenceService.saveTemplateToLocalStorage(tid, updatedTemplate);
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center space-y-2">
                          <FileText className="w-12 h-12 mx-auto opacity-50" />
                          <p>{lang('draftStudio.selectTemplateToBegin')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground/50" />
                    <div>
                      <h3 className="text-lg font-medium text-foreground">{lang('draftStudio.noDocumentSelected')}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{lang('draftStudio.selectOrCreateDocument')}</p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          setShowDocumentList(true);
                          setShowCreateTemplate(false);
                          await loadDocuments();
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {lang('draftStudio.myDocuments')}
                      </Button>
                      <Button
                        onClick={handleOpenAddDocumentDialog}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {lang('draftStudio.addDocument')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <ContentGenerationModal
        isOpen={contentModal.isOpen}
        onClose={() => setContentModal(prev => ({ ...prev, isOpen: false }))}
        title={contentModal.title}
        content={contentModal.content}
        sectionTitle={contentModal.sectionTitle}
        sources={contentModal.sources}
      />

      {/* Document Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {lang('draftStudio.documentNotes')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <NotesPanel
              documentSections={getDocumentSections()}
              notes={notes}
              onNotesUpdate={setNotes}
              onNoteCreated={(note) => {
                setNotes(prev => [note, ...prev]);
                toast.success('Note added');
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={showAddDocumentDialog} onOpenChange={(open) => {
        setShowAddDocumentDialog(open);
        if (!open) setShowCIDocumentSearch(false);
      }}>
        <DialogContent className={showCIDocumentSearch ? "max-w-2xl" : "max-w-xl"}>
          <DialogHeader>
            <DialogTitle>
              {showCIDocumentSearch ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowCIDocumentSearch(false)} className="p-1 rounded hover:bg-accent">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  CI Documents
                </div>
              ) : 'Create New Document'}
            </DialogTitle>
            <DialogDescription>
              {showCIDocumentSearch
                ? 'Search and select a CI document to open or edit.'
                : productId ? 'Create a new document for this product.' : 'Choose how to start your document.'}
            </DialogDescription>
          </DialogHeader>

          {showCIDocumentSearch ? (
            <div className="space-y-3">
              <Input
                placeholder="Search CI documents..."
                value={ciSearchQuery}
                onChange={(e) => setCISearchQuery(e.target.value)}
                className="w-full"
              />
              <ScrollArea className="h-[300px]">
                {isLoadingCIDocuments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {ciDocuments
                      .filter(doc => doc.name?.toLowerCase().includes(ciSearchQuery.toLowerCase()))
                      .map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => handleSelectCIDocument(doc)}
                          className="w-full flex items-center justify-between gap-3 p-3 rounded-md hover:bg-accent transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {doc.document_type && (
                              <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                            )}
                            <Badge variant={doc.status === 'Approved' ? 'default' : 'secondary'} className="text-xs">
                              {doc.status || 'Not Started'}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    {ciDocuments.filter(doc => doc.name?.toLowerCase().includes(ciSearchQuery.toLowerCase())).length === 0 && !isLoadingCIDocuments && (
                      <div className="text-center py-8 text-sm text-muted-foreground">No CI documents found.</div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 py-4">
              {/* Blank Document */}
              <button
                onClick={handleBlankDocument}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-accent transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm text-foreground">Blank Document</div>
                  <div className="text-xs text-muted-foreground mt-1">Start from scratch</div>
                </div>
              </button>

              {/* Browse Templates */}
              <button
                onClick={handleBrowseTemplates}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-accent transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm text-foreground">Browse Templates</div>
                  <div className="text-xs text-muted-foreground mt-1">Use a company template</div>
                </div>
              </button>

              {/* Upload Own */}
              <button
                onClick={handleUploadOwn}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-accent transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm text-foreground">Upload Document</div>
                  <div className="text-xs text-muted-foreground mt-1">Upload your own file</div>
                </div>
              </button>

              {/* CI Document */}
              <button
                onClick={handleOpenCIDocumentSearch}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-accent transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm text-foreground">CI Document</div>
                  <div className="text-xs text-muted-foreground mt-1">Create or edit CI doc</div>
                </div>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Browser Modal */}
      <TemplateBrowserModal
        open={showTemplateBrowser}
        onOpenChange={setShowTemplateBrowser}
        onSelectDocument={handleTemplateBrowserSelect}
      />

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Your Document</DialogTitle>
          </DialogHeader>
          <DocFileUpload
            onFileChange={handleUploadComplete}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {documentToDelete?.linkedCiId ? 'Cannot Delete Document' : 'Delete Draft'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {documentToDelete?.linkedCiId
                ? `"${documentToDelete?.name}" is linked to a Doc CI compliance record and cannot be deleted from Document Studio. To remove it, use the Technical File or Doc CI registry.`
                : `Do you really want to delete the draft "${documentToDelete?.name}"? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{documentToDelete?.linkedCiId ? 'Close' : 'Cancel'}</AlertDialogCancel>
            {!documentToDelete?.linkedCiId && (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  confirmDeleteDocument();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Draft
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}