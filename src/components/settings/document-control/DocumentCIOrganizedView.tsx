import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Building2,
  Package,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Download,
  Eye,
  Edit3,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  FolderOpen
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCompanyWideDocuments } from '@/hooks/useCompanyWideDocuments';
import { useProductDocuments } from '@/hooks/useProductDocuments';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { EnhancedDocumentFilters } from '@/components/product/documents/EnhancedDocumentFilters';
import { SortByDateOption } from '@/utils/documentFilterParams';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';

interface DocumentCIOrganizedViewProps {
  companyId: string;
  productId?: string;
  onDocumentUpdated: () => void;
  viewerMode?: boolean;
}

interface DocumentCI {
  id: string;
  name: string;
  status: string;
  document_type: string;
  tech_applicability?: string;
  created_at?: string;
  updated_at?: string;
  file_path?: string;
  file_name?: string;
  phase_name?: string;
  product_id?: string;
  phase_id?: string;
  tags?: string[];
  sub_section?: string;
  authors_ids?: string[];
  due_date?: string;
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    case 'in_progress':
    case 'under_review':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'blocked':
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadgeStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'in_progress':
    case 'under_review':
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
    case 'blocked':
    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
    default:
      return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
  }
};

const DocumentCICard = ({ document, onEdit, showEdit = true, viewMode = 'grid' }: {
  document: DocumentCI;
  onEdit?: (doc: DocumentCI) => void;
  showEdit?: boolean;
  viewMode?: 'grid' | 'list';
}) => {
  const handleView = () => {
    console.log('View document:', document.name);
  };

  if (viewMode === 'list') {
    return (
      <div className="group border border-border/50 hover:border-primary/30 hover:bg-muted/20 rounded-lg p-4 transition-all duration-200">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {document.name}
              </h4>
              <Badge
                variant="outline"
                className={cn("text-xs font-medium transition-all", getStatusBadgeStyle(document.status))}
              >
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(document.status)}
                  <span className="capitalize">{document.status.replace('_', ' ')}</span>
                </div>
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-medium">{document.document_type}</span>
              {document.tech_applicability && (
                <>
                  <span>•</span>
                  <span>{document.tech_applicability}</span>
                </>
              )}
              {document.phase_name && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {document.phase_name}
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
            {document.file_name && (
              <div className="flex items-center gap-1.5">
                <Download className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{document.file_name}</span>
              </div>
            )}
            {document.updated_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>Updated {new Date(document.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleView}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {showEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(document)}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="group border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors leading-tight">
                {document.name}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {document.document_type}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn("text-xs font-semibold transition-all flex-shrink-0", getStatusBadgeStyle(document.status))}
          >
            <div className="flex items-center gap-1.5">
              {getStatusIcon(document.status)}
              <span className="capitalize">{document.status.replace('_', ' ')}</span>
            </div>
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {document.tech_applicability && (
            <Badge variant="secondary" className="text-xs bg-secondary/60 hover:bg-secondary/80 transition-colors font-medium">
              {document.tech_applicability}
            </Badge>
          )}

          {document.phase_name && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-colors font-medium">
              {document.phase_name}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {document.file_name && (
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-muted/50 rounded">
                  <Download className="h-3 w-3" />
                </div>
                <span className="truncate max-w-[140px]">{document.file_name}</span>
              </div>
            )}
            {document.updated_at && (
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-muted/50 rounded">
                  <Calendar className="h-3 w-3" />
                </div>
                <span>Updated {new Date(document.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleView}
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10 hover:text-primary h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {showEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(document)}
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10 hover:text-primary h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function DocumentCIOrganizedView({ companyId, productId, onDocumentUpdated, viewerMode = false }: DocumentCIOrganizedViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sectionFilter, setSectionFilter] = useState<string[]>([]);
  const [authorFilter, setAuthorFilter] = useState<string[]>([]);
  const [sortByDate, setSortByDate] = useState<SortByDateOption>('none');
  const [companyWideOpen, setCompanyWideOpen] = useState(true);
  const [productNoPhaseOpen, setProductNoPhaseOpen] = useState(true);
  const [productWithPhasesOpen, setProductWithPhasesOpen] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load company-wide documents
  const { documents: companyWideDocuments, loading: companyWideLoading, error: companyWideError } = useCompanyWideDocuments(companyId);
  
  // Load product documents if productId is provided
  const { organizedDocuments, isLoading: productLoading, error: productError } = useProductDocuments(productId);

  // Load company users for author filter
  const { users: companyUsers = [] } = useCompanyUsers(companyId);

  const isLoading = companyWideLoading || productLoading;
  const error = companyWideError || productError;

  // Transform company-wide documents to DocumentCI format
  const transformedCompanyWide = useMemo(() => {
    return companyWideDocuments.map(doc => ({
      id: doc.id,
      name: doc.name,
      status: doc.status || 'Not Started',
      document_type: doc.document_type || 'Standard',
      tech_applicability: doc.tech_applicability,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      file_path: doc.file_path,
      file_name: doc.file_name,
      tags: doc.tags,
      sub_section: doc.sub_section,
      authors_ids: doc.authors_ids,
      due_date: doc.due_date,
    }));
  }, [companyWideDocuments]);

  // Extract available filter values from company-wide documents
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    companyWideDocuments.forEach(doc => {
      doc.tags?.forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [companyWideDocuments]);

  const availableSections = useMemo(() => {
    const sectionSet = new Set<string>();
    companyWideDocuments.forEach(doc => {
      if (doc.sub_section) sectionSet.add(doc.sub_section);
    });
    return Array.from(sectionSet).sort();
  }, [companyWideDocuments]);

  const availableAuthors = useMemo(() => {
    const authorIdSet = new Set<string>();
    companyWideDocuments.forEach(doc => {
      doc.authors_ids?.forEach(id => authorIdSet.add(id));
    });
    return Array.from(authorIdSet)
      .map(id => {
        const user = companyUsers.find((u: any) => u.id === id);
        return { id, name: user?.name || id };
      });
  }, [companyWideDocuments, companyUsers]);

  // Transform product documents to DocumentCI format
  const transformedProductDocuments = useMemo(() => {
    const transform = (docs: any[]) => docs.map(doc => ({
      id: doc.id,
      name: doc.name,
      status: doc.status || 'Not Started',
      document_type: doc.document_type || doc.documentType || 'Standard',
      tech_applicability: doc.tech_applicability,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      file_path: doc.file_path,
      file_name: doc.file_name,
      phase_name: doc.phaseName,
      phase_id: doc.phase_id,
      product_id: doc.product_id
    }));

    return {
      noPhase: transform(organizedDocuments.noPhase),
      withPhases: organizedDocuments.withPhases.map(group => ({
        phase_id: group.phase_id,
        phase_name: group.phase_name,
        documents: transform(group.documents)
      }))
    };
  }, [organizedDocuments]);

  // Filter documents based on search term and filters
  const filteredDocuments = useMemo(() => {
    const filterDocs = (docs: DocumentCI[]) => {
      let result = docs;

      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(doc =>
          doc.name.toLowerCase().includes(searchLower) ||
          doc.document_type.toLowerCase().includes(searchLower) ||
          doc.tech_applicability?.toLowerCase().includes(searchLower)
        );
      }

      // Status filter
      if (statusFilter.length > 0) {
        result = result.filter(doc => statusFilter.includes(doc.status));
      }

      // Tag filter
      if (tagFilter.length > 0) {
        result = result.filter(doc =>
          doc.tags && tagFilter.some(t => doc.tags!.includes(t))
        );
      }

      // Section filter
      if (sectionFilter.length > 0) {
        result = result.filter(doc =>
          doc.sub_section && sectionFilter.includes(doc.sub_section)
        );
      }

      // Author filter
      if (authorFilter.length > 0) {
        result = result.filter(doc =>
          doc.authors_ids && authorFilter.some(a => doc.authors_ids!.includes(a))
        );
      }

      // Sort by date
      if (sortByDate !== 'none') {
        result = [...result].sort((a, b) => {
          let dateA: string | undefined, dateB: string | undefined;
          if (sortByDate === 'updated_newest' || sortByDate === 'updated_oldest') {
            dateA = a.updated_at; dateB = b.updated_at;
          } else if (sortByDate === 'due_newest' || sortByDate === 'due_oldest') {
            dateA = a.due_date; dateB = b.due_date;
          }
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          const diff = new Date(dateA).getTime() - new Date(dateB).getTime();
          return sortByDate.includes('newest') ? -diff : diff;
        });
      }

      return result;
    };

    return {
      companyWide: filterDocs(transformedCompanyWide),
      productNoPhase: filterDocs(transformedProductDocuments.noPhase),
      productWithPhases: transformedProductDocuments.withPhases.map(group => ({
        ...group,
        documents: filterDocs(group.documents)
      })).filter(group => group.documents.length > 0)
    };
  }, [transformedCompanyWide, transformedProductDocuments, searchTerm, statusFilter, tagFilter, sectionFilter, authorFilter, sortByDate]);

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const totalDocuments = filteredDocuments.companyWide.length +
    filteredDocuments.productNoPhase.length +
    filteredDocuments.productWithPhases.reduce((acc, group) => acc + group.documents.length, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner className="h-8 w-8 mb-4" />
          <p className="text-muted-foreground">Loading document CIs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          Error loading document CIs: {error?.toString() || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-background to-muted/30 rounded-xl p-6 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Document CIs
            </h2>
            <p className="text-muted-foreground mt-2">
              {viewerMode
                ? 'View compliance intelligence documents organized by scope'
                : 'Manage compliance intelligence documents organized by scope'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{totalDocuments} documents</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{filteredDocuments.companyWide.length} company-wide</span>
          </div>
          {productId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{filteredDocuments.productNoPhase.length + filteredDocuments.productWithPhases.reduce((acc, group) => acc + group.documents.length, 0)} product-specific</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Search and Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <EnhancedDocumentFilters
            statusFilter={statusFilter}
            onStatusFilterChange={(status) => {
              if (status === '__SHOW_ALL__') {
                setStatusFilter([]);
              } else {
                setStatusFilter(prev =>
                  prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                );
              }
            }}
            searchQuery={searchTerm}
            onSearchChange={setSearchTerm}
            tagFilter={tagFilter}
            onTagFilterChange={(tag) => {
              if (tag === '__CLEAR_ALL__') {
                setTagFilter([]);
              } else {
                setTagFilter(prev =>
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                );
              }
            }}
            availableTags={availableTags}
            sectionFilter={sectionFilter}
            onSectionFilterChange={(section) => {
              if (section === '__CLEAR_ALL__') {
                setSectionFilter([]);
              } else {
                setSectionFilter(prev =>
                  prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
                );
              }
            }}
            availableSections={availableSections}
            authorFilter={authorFilter}
            onAuthorFilterChange={(authorId) => {
              setAuthorFilter(prev =>
                prev.includes(authorId) ? prev.filter(a => a !== authorId) : [...prev, authorId]
              );
            }}
            availableAuthors={availableAuthors}
            sortByDate={sortByDate}
            onSortByDateChange={setSortByDate}
            clearAllFilters={() => {
              setStatusFilter([]);
              setTagFilter([]);
              setSectionFilter([]);
              setAuthorFilter([]);
              setSortByDate('none');
              setSearchTerm('');
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-11 px-4"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-11 px-4"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Container 1: Company Wide Documents */}
      <div className="space-y-6">
        <Collapsible open={companyWideOpen} onOpenChange={setCompanyWideOpen}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer hover:bg-blue-50/50 border border-blue-200 bg-blue-50/30 transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-blue-900">Company Wide Documents</CardTitle>
                      <p className="text-sm text-blue-700 mt-1">
                        Documents that apply across the entire company ({filteredDocuments.companyWide.length})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                      {filteredDocuments.companyWide.length} docs
                    </Badge>
                    {companyWideOpen ? (
                      <ChevronDown className="h-5 w-5 text-blue-600 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-blue-600 transition-transform duration-200" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            {filteredDocuments.companyWide.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No company-wide documents found</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredDocuments.companyWide.map((document) => (
                  <DocumentCICard
                    key={document.id}
                    document={document}
                    showEdit={!viewerMode}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Container 2: Product Specific Documents (Only show if productId is provided) */}
        {productId && (
          <>
            {/* Sub-container 2A: Product Documents (No Phase Connection) */}
            <Collapsible open={productNoPhaseOpen} onOpenChange={setProductNoPhaseOpen}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-gray-50/50 border border-gray-200 bg-gray-50/30 transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900">Product Documents (No Phase Connection)</CardTitle>
                          <p className="text-sm text-gray-700 mt-1">
                            Product-specific documents not tied to development phases ({filteredDocuments.productNoPhase.length})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                          {filteredDocuments.productNoPhase.length} docs
                        </Badge>
                        {productNoPhaseOpen ? (
                          <ChevronDown className="h-5 w-5 text-gray-600 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-600 transition-transform duration-200" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                {filteredDocuments.productNoPhase.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No product documents without phases found</p>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "space-y-4"
                  }>
                    {filteredDocuments.productNoPhase.map((document) => (
                      <DocumentCICard
                        key={document.id}
                        document={document}
                        showEdit={!viewerMode}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Sub-container 2B: Product Documents (Connected to Phases) */}
            <Collapsible open={productWithPhasesOpen} onOpenChange={setProductWithPhasesOpen}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-purple-50/50 border border-purple-200 bg-purple-50/30 transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Package className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-purple-900">Product Documents (Connected to Phases)</CardTitle>
                          <p className="text-sm text-purple-700 mt-1">
                            Product-specific documents tied to development phases ({filteredDocuments.productWithPhases.reduce((acc, group) => acc + group.documents.length, 0)})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                          {filteredDocuments.productWithPhases.reduce((acc, group) => acc + group.documents.length, 0)} docs
                        </Badge>
                        {productWithPhasesOpen ? (
                          <ChevronDown className="h-5 w-5 text-purple-600 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-purple-600 transition-transform duration-200" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6">
                {filteredDocuments.productWithPhases.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No product documents with phases found</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredDocuments.productWithPhases.map((phaseGroup) => (
                      <Collapsible 
                        key={phaseGroup.phase_id}
                        open={expandedPhases.has(phaseGroup.phase_id)}
                        onOpenChange={() => togglePhaseExpansion(phaseGroup.phase_id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Card className="cursor-pointer hover:bg-purple-50/30 border border-purple-100 transition-all duration-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 bg-purple-100 rounded-lg">
                                    <Package className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-purple-900">{phaseGroup.phase_name}</h4>
                                    <p className="text-xs text-purple-700">
                                      {phaseGroup.documents.length} documents in this phase
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                    {phaseGroup.documents.length}
                                  </Badge>
                                  {expandedPhases.has(phaseGroup.phase_id) ? (
                                    <ChevronDown className="h-4 w-4 text-purple-600 transition-transform duration-200" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-purple-600 transition-transform duration-200" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 mt-4">
                          <div className={viewMode === 'grid' 
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-8" 
                            : "space-y-4 ml-8"
                          }>
                            {phaseGroup.documents.map((document) => (
                              <DocumentCICard
                                key={document.id}
                                document={document}
                                showEdit={!viewerMode}
                                viewMode={viewMode}
                              />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
    </div>
  );
}