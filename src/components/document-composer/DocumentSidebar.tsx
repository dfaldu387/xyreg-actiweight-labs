import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Calendar,
  User,
  List,
  Grid3X3,
  Folder,
  Users,
  Clock,
  Download,
  Star,
  Check,
  File,
  FileSpreadsheet,
  Video,
  Archive,
  Search,
  Info,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { DocumentStudioPersistenceService, DocumentStudioData } from '@/services/documentStudioPersistenceService';
import { useCompanyDocumentTemplates } from '@/hooks/useCompanyDocumentTemplates';
import { useDefaultDocumentTemplates } from '@/hooks/useDefaultDocumentTemplates';
import { toast } from 'sonner';
import { ControlPanel } from './ControlPanel';
import { NotesPanel } from './NotesPanel';

interface DocumentSidebarProps {
  productContext?: any;
  documentType?: string;
  className?: string;
  isLocked?: boolean;
  onSelectionChange?: (selection: {
    scope: 'company' | 'product';
    productId?: string;
    templateId?: string;
  }) => void;
  onGenerateDocument?: () => void;
  isGenerating?: boolean;
  template?: any;
  smartData?: {
    populatedFields: string[];
    missingDataIndicators: any[];
    suggestions: string[];
    completionPercentage: number;
  };
  onRoleMappingsUpdated?: (mappings: any[]) => void;
  onContentEnhancement?: (suggestion: any) => void;
  onDocumentSelect?: (document: DocumentStudioData) => void;
  onShowDocumentList?: () => void;
  onShowCreateTemplate?: () => void;
  onSidebarExpansion?: (isExpanded: boolean) => void;
}

export function DocumentSidebar({
  productContext,
  documentType,
  className = '',
  isLocked = false,
  onSelectionChange,
  onGenerateDocument,
  isGenerating = false,
  template,
  smartData,
  onRoleMappingsUpdated,
  onContentEnhancement,
  onDocumentSelect,
  onShowDocumentList,
  onShowCreateTemplate,
  onSidebarExpansion
}: DocumentSidebarProps) {
  const { activeCompanyRole } = useCompanyRole();
  const [showMyDocuments, setShowMyDocuments] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [documents, setDocuments] = useState<DocumentStudioData[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedDocument, setSelectedDocument] = useState<DocumentStudioData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  // Fetch company document templates and default templates
  const {
    phases: companyPhases,
    documentsByPhase,
    isLoading: templatesLoading
  } = useCompanyDocumentTemplates(activeCompanyRole?.companyId);

  const {
    templates: defaultTemplates,
    isLoading: defaultTemplatesLoading
  } = useDefaultDocumentTemplates();

  // Load documents when component mounts or company changes
  useEffect(() => {
    if (activeCompanyRole?.companyId) {
      loadDocuments();
    }
  }, [activeCompanyRole?.companyId]);

  const loadDocuments = async () => {
    if (!activeCompanyRole?.companyId) return;

    setLoading(true);
    try {
      const result = await DocumentStudioPersistenceService.getCompanyTemplates(activeCompanyRole.companyId);
      if (result.success && result.data) {
        setDocuments(result.data);
      } else {
        console.error('Failed to load documents:', result.error);
        toast.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (document: DocumentStudioData) => {
    setSelectedDocument(document);
    onDocumentSelect?.(document);
    setShowMyDocuments(false);
  };

  const handleCreateNew = () => {
    setShowCreateNew(true);
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    if (!activeCompanyRole?.companyId) return;
    setDeleteTarget({ id: documentId, name: documentName });
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !activeCompanyRole?.companyId) return;

    try {
      const success = await DocumentStudioPersistenceService.deleteTemplate(deleteTarget.id, activeCompanyRole.companyId);
      if (success) {
        toast.success('Document deleted successfully');
        loadDocuments();
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleDuplicateDocument = async (document: DocumentStudioData) => {
    if (!activeCompanyRole?.companyId) return;

    try {
      const duplicatedDocument = {
        ...document,
        id: undefined, // Remove ID to create new document
        name: `${document.name} (Copy)`,
        created_by: undefined,
        last_edited_by: undefined,
        created_at: undefined,
        updated_at: undefined
      };

      const result = await DocumentStudioPersistenceService.saveTemplate(duplicatedDocument);
      if (result.success) {
        toast.success('Document duplicated successfully');
        loadDocuments(); // Reload the list
      } else {
        toast.error('Failed to duplicate document');
      }
    } catch (error) {
      console.error('Error duplicating document:', error);
      toast.error('Failed to duplicate document');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFileIcon = (type: string, name: string) => {
    const lowerName = name.toLowerCase();
    const lowerType = type.toLowerCase();

    // Check for specific file types based on name
    if (lowerName.includes('.xlsx') || lowerName.includes('excel') || lowerName.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
    }
    if (lowerName.includes('.zip') || lowerName.includes('archive')) {
      return <Archive className="w-4 h-4 text-gray-600" />;
    }
    if (lowerName.includes('.mp4') || lowerName.includes('video')) {
      return <Video className="w-4 h-4 text-red-600" />;
    }
    if (lowerName.includes('.apk') || lowerName.includes('app')) {
      return <File className="w-4 h-4 text-gray-600" />;
    }

    // Check document types
    switch (lowerType) {
      case 'sop':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'policy':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'procedure':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSharingIndicator = (isShared: boolean = false) => {
    if (isShared) {
      return <Users className="w-3 h-3 text-blue-600" />;
    }
    return null;
  };

  const getSuggestionReason = (doc: DocumentStudioData) => {
    const now = new Date();
    const docDate = doc.updated_at ? new Date(doc.updated_at) : new Date();
    const diffHours = (now.getTime() - docDate.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) {
      return `You opened • ${docDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffHours < 24) {
      return `You opened • ${Math.floor(diffHours)} hours ago`;
    } else if (diffHours < 168) { // 7 days
      return `You opened • ${Math.floor(diffHours / 24)} days ago`;
    } else {
      return "You've opened frequently";
    }
  };
  const getDocumentSections = () => {
    const currentTemplate = template;
    if (!currentTemplate?.sections) return [];
    
    return currentTemplate.sections.map((section: any, index: number) => ({
      id: `section-${index}`,
      title: section.title || `Section ${index + 1}`
    }));
  };

  return (
    <div className={`w-80 max-w-80 min-w-80 border-r bg-muted/30 overflow-hidden flex flex-col ${className}`}>
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <FileText className="w-4 h-4" />
          Document Studio
        </div>
        {/* Add Document Note Section  */}
        {/* <div>
          <NotesPanel
            documentSections={getDocumentSections()}
            notes={notes}
            onNotesUpdate={(notes) => setNotes(notes)}
            onNoteCreated={(note) => {
              setNotes([note]);
              toast.success('Note added');
            }}
          />
        </div> */}
        {/* My Documents Section */}
        <Card>
          <CardHeader
            className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => {
              onShowDocumentList?.();
            }}
          >
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                My Documents
              </div>
              <ChevronRight className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
        </Card>

      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Do you really want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
