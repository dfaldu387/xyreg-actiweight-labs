import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Share,
  Star,
  MoreHorizontal,
  Calendar,
  User,
  Folder,
  Clock,
  Edit,
  Copy,
  Trash2,
  List,
  Grid3X3,
  Users,
  Check,
  File,
  FileSpreadsheet,
  Video,
  Eye,
  Archive,
  Loader2,
  Plus,
  ChevronRight,
  ChevronDown,
  History
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentStudioData } from '@/services/documentStudioPersistenceService';
import { DocumentVersionService, DocumentVersion } from '@/services/documentVersionService';
import { useTranslation } from '@/hooks/useTranslation';
import { useDocumentStudioFilters } from '@/hooks/useDocumentStudioFilters';
import { EnhancedDocumentFilters } from '@/components/product/documents/EnhancedDocumentFilters';
import { ReferenceDocumentsTab } from './ReferenceDocumentsTab';
import { TemplatesSettings } from '@/components/settings/TemplatesSettings';

interface DocumentPreviewProps {
  document: DocumentStudioData | null;
  onEdit?: (document: DocumentStudioData) => void;
  onDuplicate?: (document: DocumentStudioData) => void;
  onDelete?: (document: DocumentStudioData) => void;
  onDownload?: (document: DocumentStudioData) => void;
  onShare?: (document: DocumentStudioData) => void;
  showDocumentList?: boolean;
  documents?: DocumentStudioData[];
  isLoading?: boolean;
  onDocumentSelect?: (document: DocumentStudioData) => void;
  onAddDocument?: () => void;
  disabled?: boolean;
  companyId?: string;
}

export function DocumentPreview({
  document,
  onEdit,
  onDuplicate,
  onDelete,
  onDownload,
  onShare,
  showDocumentList = false,
  documents = [],
  isLoading = false,
  onDocumentSelect,
  onAddDocument,
  disabled = false,
  companyId
}: DocumentPreviewProps) {
  const [activeListTab, setActiveListTab] = useState('my-documents');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, DocumentVersion[]>>({});
  const [loadingVersions, setLoadingVersions] = useState<string | null>(null);
  const { lang } = useTranslation();

  const {
    docTypeFilter,
    scopeFilter,
    sortByDate,
    searchQuery,
    hasActiveFilters: hasFilters,
    toggleDocType,
    toggleScope,
    setSortByDate,
    setSearchQuery,
    clearAllFilters,
  } = useDocumentStudioFilters();

  const availableDocTypes = useMemo(
    () => [...new Set(documents.map((d) => d.type))].sort(),
    [documents]
  );

  const availableScopes = useMemo(() => {
    const scopes = new Set<string>();
    documents.forEach((doc) => {
      scopes.add(doc.product_id ? 'Product-specific' : 'Company-wide');
    });
    return [...scopes].sort();
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    if (docTypeFilter.length > 0) {
      filtered = filtered.filter((doc) => docTypeFilter.includes(doc.type));
    }

    if (scopeFilter.length > 0) {
      filtered = filtered.filter((doc) => {
        const scope = doc.product_id ? 'Product-specific' : 'Company-wide';
        return scopeFilter.includes(scope);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((doc) => doc.name.toLowerCase().includes(q));
    }

    if (sortByDate === 'updated_newest') {
      filtered.sort(
        (a, b) =>
          new Date(b.updated_at || 0).getTime() -
          new Date(a.updated_at || 0).getTime()
      );
    } else if (sortByDate === 'updated_oldest') {
      filtered.sort(
        (a, b) =>
          new Date(a.updated_at || 0).getTime() -
          new Date(b.updated_at || 0).getTime()
      );
    }

    return filtered;
  }, [documents, docTypeFilter, scopeFilter, searchQuery, sortByDate]);

  const handleToggleVersions = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (expandedDocId === docId) {
      setExpandedDocId(null);
      return;
    }
    setExpandedDocId(docId);
    if (!versions[docId]) {
      setLoadingVersions(docId);
      const result = await DocumentVersionService.getDocumentVersions(docId);
      if (result.success && result.data) {
        setVersions(prev => ({ ...prev, [docId]: result.data! }));
      }
      setLoadingVersions(null);
    }
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

  if (showDocumentList) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        {/* Tabs Header */}
        <div className="p-4 border-b bg-background">
          <Tabs value={activeListTab} onValueChange={setActiveListTab}>
            <TabsList>
              <TabsTrigger value="my-documents">{lang('draftStudio.myDocuments')}</TabsTrigger>
              <TabsTrigger value="reference-documents">Reference Documents</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeListTab === 'my-documents' ? (
          <>
            {/* Filter Bar */}
            {documents.length > 0 && !isLoading && (
              <div className="px-4 py-2 border-b bg-background">
                <EnhancedDocumentFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  docTypeFilter={docTypeFilter}
                  onDocTypeFilterChange={toggleDocType}
                  availableDocTypes={availableDocTypes}
                  scopeFilter={scopeFilter}
                  onScopeFilterChange={toggleScope}
                  availableScopes={availableScopes}
                  sortByDate={sortByDate}
                  onSortByDateChange={setSortByDate}
                  availableSortOptions={['updated_newest', 'updated_oldest']}
                  clearAllFilters={clearAllFilters}
                />
                {hasFilters && (
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    Showing {filteredDocuments.length} of {documents.length} documents
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">{lang('draftStudio.loadingDocuments')}</p>
                </div>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4 p-12">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{lang('draftStudio.noDocumentsFound')}</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {lang('draftStudio.noDocumentsDescription')}
                    </p>
                  </div>
                  {onAddDocument && (
                    <Button onClick={onAddDocument} className="mt-4" disabled={disabled}>
                      <Plus className="w-4 h-4 mr-2" />
                      {lang('draftStudio.addDocument')}
                    </Button>
                  )}
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4 p-12">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No matching documents</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      No documents match your current filters. Try adjusting or clearing your filters.
                    </p>
                  </div>
                  <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                    Clear all filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-0">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/50 sticky top-0">
                    <div className="col-span-4">{lang('draftStudio.tableHeaders.name')}</div>
                    <div className="col-span-3">{lang('draftStudio.tableHeaders.lastModified')}</div>
                    <div className="col-span-2">{lang('draftStudio.tableHeaders.type')}</div>
                    <div className="col-span-2">{lang('draftStudio.tableHeaders.scope')}</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {/* Table Rows */}
                  <div className="space-y-0">
                    {filteredDocuments.map((doc) => (
                    <React.Fragment key={doc.id}>
                    <div
                      className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b"
                      onClick={() => onDocumentSelect?.(doc)}
                    >
                      {/* Name Column */}
                      <div className="col-span-4 flex items-center gap-2 min-w-0">
                        <button
                          className="flex-shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                          onClick={(e) => handleToggleVersions(e, doc.id!)}
                          title="View versions"
                        >
                          {expandedDocId === doc.id ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.type, doc.name)}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">
                          {(() => {
                            const docNumber = (doc as any).document_number || (doc as any).document_control?.sopNumber;
                            const cleanName = doc.name?.replace(/^[A-Z]{2,6}-\d{3}\s+/, '') || doc.name;
                            return docNumber ? `${docNumber} ${cleanName}` : cleanName;
                          })()}
                        </span>
                        {expandedDocId === doc.id && (versions[doc.id!] || []).length > 0 && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-600 hover:bg-green-600 flex-shrink-0">Current Version</Badge>
                        )}
                        {getSharingIndicator(true)}
                      </div>

                      {/* Last Modified Column */}
                      <div className="col-span-3 flex items-center min-w-0">
                        <span className="text-xs text-muted-foreground truncate">
                          {doc.updated_at ? new Date(doc.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Unknown'}
                        </span>
                      </div>

                      {/* Type Column */}
                      <div className="col-span-2 flex items-center gap-1 min-w-0">
                        <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                          {doc.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>

                      {/* Scope Column */}
                      <div className="col-span-2 flex items-center min-w-0">
                        <span className="text-xs text-muted-foreground truncate">
                          {doc.product_context?.name || (doc.product_id ? 'Product-specific' : 'Company-wide')}
                        </span>
                      </div>

                      {/* Actions Column */}
                      <div className="col-span-1 flex items-center justify-end">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild disabled={disabled}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                              disabled={disabled}
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(doc); }} disabled={disabled}>
                              <Eye className="w-3 h-3 mr-2" />
                              {lang('draftStudio.actions.open')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(doc); }} disabled={disabled}>
                              <Edit className="w-3 h-3 mr-2" />
                              {lang('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); onDelete?.(doc); }}
                              className="text-destructive"
                              disabled={disabled}
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              {lang('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Expanded Version History */}
                    {expandedDocId === doc.id && (
                      <div className="bg-muted/30 border-b">
                        {loadingVersions === doc.id ? (
                          <div className="flex items-center gap-2 px-8 py-3">
                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Loading versions...</span>
                          </div>
                        ) : (versions[doc.id!] || []).length === 0 ? (
                          <div className="flex items-center gap-2 px-8 py-3">
                            <History className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">No previous versions — this is the first version</span>
                          </div>
                        ) : (
                          <div className="relative">
                            {/* Vertical connecting line - aligned under the chevron arrow */}
                            {(versions[doc.id!] || []).length > 0 && (
                              <div className="absolute left-[1.55rem] top-0 w-[2.5px] bg-gray-400 dark:bg-gray-500" style={{ height: `calc(100% - 50% / ${(versions[doc.id!] || []).length})` }} />
                            )}

                            {/* Previous versions */}
                            {(versions[doc.id!] || []).map((version, idx) => {
                              const isLast = idx === (versions[doc.id!] || []).length - 1;
                              return (
                              <div key={version.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors group relative">
                                {/* Vertical line per row - full for non-last, half for last */}
                                <div className="absolute left-[1.55rem] top-0 w-[2px] bg-gray-400 dark:bg-gray-500" style={{ height: isLast ? '50%' : '100%' }} />
                                <div className="col-span-4 flex items-center gap-3 min-w-0 pl-6">
                                  {/* Horizontal branch line */}
                                  <div className="absolute left-[1.55rem] top-1/2 w-5 h-[2.5px] bg-gray-400 dark:bg-gray-500" />
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0 ml-5 border-primary/50 text-primary">v{version.version_number}</Badge>
                                  <span className="text-xs text-foreground">{version.version_name || `Version ${version.version_number}`}</span>
                                </div>
                                <div className="col-span-3 flex items-center">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(version.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="col-span-4 flex items-center">
                                  <span className="text-xs text-muted-foreground">{version.change_summary || ''}</span>
                                </div>
                                <div className="col-span-1 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const confirmed = window.confirm(`Restore "${version.version_name || `Version ${version.version_number}`}"? This will replace the current document content.`);
                                      if (!confirmed) return;
                                      const result = await DocumentVersionService.restoreVersion(doc.id!, version.id);
                                      if (result.success) {
                                        // Refresh versions
                                        const vResult = await DocumentVersionService.getDocumentVersions(doc.id!);
                                        if (vResult.success && vResult.data) {
                                          setVersions(prev => ({ ...prev, [doc.id!]: vResult.data! }));
                                        }
                                        onEdit?.(doc);
                                      }
                                    }}
                                    disabled={disabled}
                                  >
                                    Restore
                                  </Button>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : activeListTab === 'reference-documents' ? (
          <ReferenceDocumentsTab companyId={companyId} disabled={disabled} />
        ) : (
          <div className="p-4 overflow-y-auto flex-1">
            <TemplatesSettings companyId={companyId!} />
          </div>
        )}
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-muted-foreground">{lang('draftStudio.noDocumentSelected')}</h3>
            <p className="text-sm text-muted-foreground">
              {lang('draftStudio.selectDocumentPrompt')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{lang('draftStudio.suggestedFiles')}</h2>
          <div className="flex items-center gap-1">
            <Button variant="default" size="sm" className="h-8 w-8 p-0">
              <Check className="w-4 h-4" />
              <List className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-gray-50 sticky top-0">
            <div className="col-span-4">{lang('draftStudio.tableHeaders.name')}</div>
            <div className="col-span-3">{lang('draftStudio.tableHeaders.reasonSuggested')}</div>
            <div className="col-span-2">{lang('draftStudio.tableHeaders.owner')}</div>
            <div className="col-span-2">{lang('draftStudio.tableHeaders.type')}</div>
            <div className="col-span-1"></div>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-0">
            {/* Selected Document Row */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 border-b border-gray-200">
              {/* Name Column */}
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <div className="flex-shrink-0">
                  {getFileIcon(document.type, document.name)}
                </div>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {document.name}
                </span>
                {getSharingIndicator(true)}
              </div>
              
              {/* Reason Suggested Column */}
              <div className="col-span-3 flex items-center min-w-0">
                <span className="text-xs text-gray-600 truncate">
                  {lang('draftStudio.youOpened')} • {document.updated_at ? new Date(document.updated_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : lang('common.unknown')}
                </span>
              </div>

              {/* Owner Column */}
              <div className="col-span-2 flex items-center gap-1 min-w-0">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">M</span>
                </div>
                <span className="text-xs text-gray-600 truncate">{lang('draftStudio.me')}</span>
              </div>
              
              {/* Type Column */}
              <div className="col-span-2 flex items-center gap-1 min-w-0">
                <FileText className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-600 truncate">
                  {document.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              
              {/* Actions Column */}
              <div className="col-span-1 flex items-center justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:bg-gray-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(document)}>
                      <Edit className="w-3 h-3 mr-2" />
                      {lang('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate?.(document)}>
                      <Copy className="w-3 h-3 mr-2" />
                      {lang('draftStudio.actions.duplicate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDelete?.(document); }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      {lang('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
