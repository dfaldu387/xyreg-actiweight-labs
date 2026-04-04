import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Edit, Trash2, FileText, GripVertical, Paperclip, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DocumentItem } from '@/types/client';
import { DocumentEditDialog } from './DocumentEditDialog';
import { DocumentDeleteDialog } from './DocumentDeleteDialog';
import { DocumentViewerDialog } from './DocumentViewerDialog';
import { DocumentTemplateFileService } from '@/services/documentTemplateFileService';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { EnhancedDocumentFilters } from '@/components/product/documents/EnhancedDocumentFilters';
import { SortByDateOption } from '@/utils/documentFilterParams';

interface DocumentLibraryPanelProps {
  documents: DocumentItem[];
  onDocumentUpdated: () => void;
  companyId: string;
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export function DocumentLibraryPanel({
  documents,
  onDocumentUpdated,
  companyId,
  searchTerm: externalSearchTerm,
  onSearchChange,
  activeFilter: externalActiveFilter,
  onFilterChange
}: DocumentLibraryPanelProps) {
  const { lang } = useTranslation();
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<DocumentItem | null>(null);
  const [viewingDocument, setViewingDocument] = useState<DocumentItem | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sectionFilter, setSectionFilter] = useState<string[]>([]);
  const [docTypeFilter, setDocTypeFilter] = useState<string[]>([]);
  const [techApplicabilityFilter, setTechApplicabilityFilter] = useState<string[]>([]);
  const [phaseFilter, setPhaseFilter] = useState<string[]>([]);
  const [sortByDate, setSortByDate] = useState<SortByDateOption>('none');

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchTerm(value);
    }
  };

  // Extract available filter values from documents
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    documents.forEach(doc => {
      const docTags = (doc as any).tags;
      if (Array.isArray(docTags)) {
        docTags.forEach((t: string) => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [documents]);

  // Sections filtered by selected phases (if any phase is selected, only show sections from docs in those phases)
  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    documents.forEach(doc => {
      const sub = (doc as any).sub_section;
      if (!sub) return;
      if (phaseFilter.length > 0) {
        // Only include section if doc belongs to a selected phase
        const docPhases = doc.phases || [];
        if (docPhases.some(p => phaseFilter.includes(p))) {
          sections.add(sub);
        }
      } else {
        sections.add(sub);
      }
    });
    return Array.from(sections).sort();
  }, [documents, phaseFilter]);

  const availableDocTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach(doc => {
      if (doc.type) types.add(doc.type);
    });
    return Array.from(types).sort();
  }, [documents]);

  const availableTechApplicabilities = useMemo(() => {
    const techs = new Set<string>();
    documents.forEach(doc => {
      const ta = doc.techApplicability;
      if (ta) techs.add(ta);
    });
    return Array.from(techs).sort();
  }, [documents]);

  const availablePhases = useMemo(() => {
    const phases = new Set<string>();
    documents.forEach(doc => {
      if (doc.phases && Array.isArray(doc.phases)) {
        doc.phases.forEach(p => phases.add(p));
      }
    });
    return Array.from(phases).sort();
  }, [documents]);

  // Toggle helpers
  const handleStatusChange = (status: string) => {
    if (status === '__SHOW_ALL__') { setStatusFilter([]); return; }
    setStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const handleTagChange = (tag: string) => {
    if (tag === '__CLEAR_ALL__') { setTagFilter([]); return; }
    setTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSectionChange = (section: string) => {
    if (section === '__CLEAR_ALL__') { setSectionFilter([]); return; }
    setSectionFilter(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]);
  };

  const handleDocTypeChange = (dt: string) => {
    if (dt === '__CLEAR_ALL__') { setDocTypeFilter([]); return; }
    setDocTypeFilter(prev => prev.includes(dt) ? prev.filter(d => d !== dt) : [...prev, dt]);
  };

  const handleTechApplicabilityChange = (ta: string) => {
    if (ta === '__CLEAR_ALL__') { setTechApplicabilityFilter([]); return; }
    setTechApplicabilityFilter(prev => prev.includes(ta) ? prev.filter(t => t !== ta) : [...prev, ta]);
  };

  const handlePhaseChange = (phase: string) => {
    if (phase === '__CLEAR_ALL__') { setPhaseFilter([]); return; }
    setPhaseFilter(prev => prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase]);
  };

  const handleClearAll = () => {
    setStatusFilter([]);
    setTagFilter([]);
    setSectionFilter([]);
    setDocTypeFilter([]);
    setTechApplicabilityFilter([]);
    setPhaseFilter([]);
    setSortByDate('none');
    handleSearchChange('');
  };

  // Filtered & sorted documents
  const filteredDocuments = useMemo(() => {
    let result = documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter.length === 0 ||
        statusFilter.some(s => s.toLowerCase() === (doc as any).status?.toLowerCase());

      const docTags: string[] = Array.isArray((doc as any).tags) ? (doc as any).tags : [];
      const matchesTags = tagFilter.length === 0 ||
        tagFilter.some(t => docTags.includes(t));

      const matchesSection = sectionFilter.length === 0 ||
        sectionFilter.includes((doc as any).sub_section);

      const matchesDocType = docTypeFilter.length === 0 ||
        docTypeFilter.includes(doc.type);

      const matchesTech = techApplicabilityFilter.length === 0 ||
        techApplicabilityFilter.includes(doc.techApplicability || '');

      const matchesPhase = phaseFilter.length === 0 ||
        (doc.phases && doc.phases.some(p => phaseFilter.includes(p)));

      return matchesSearch && matchesStatus && matchesTags && matchesSection && matchesDocType && matchesTech && matchesPhase;
    });

    // Sort
    switch (sortByDate) {
      case 'updated_newest':
        result.sort((a, b) => new Date(b.lastUpdated || '').getTime() - new Date(a.lastUpdated || '').getTime());
        break;
      case 'updated_oldest':
        result.sort((a, b) => new Date(a.lastUpdated || '').getTime() - new Date(b.lastUpdated || '').getTime());
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'due_newest':
        result.sort((a, b) => new Date(b.dueDate || '').getTime() - new Date(a.dueDate || '').getTime());
        break;
      case 'due_oldest':
        result.sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime());
        break;
      case 'phase_asc':
        result.sort((a, b) => (a.phases?.[0] || '').localeCompare(b.phases?.[0] || ''));
        break;
      case 'phase_desc':
        result.sort((a, b) => (b.phases?.[0] || '').localeCompare(a.phases?.[0] || ''));
        break;
      case 'section_asc':
        result.sort((a, b) => ((a as any).sub_section || '').localeCompare((b as any).sub_section || ''));
        break;
      case 'section_desc':
        result.sort((a, b) => ((b as any).sub_section || '').localeCompare((a as any).sub_section || ''));
        break;
      case 'doctype_asc':
        result.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
        break;
      case 'doctype_desc':
        result.sort((a, b) => (b.type || '').localeCompare(a.type || ''));
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [documents, searchTerm, statusFilter, tagFilter, sectionFilter, docTypeFilter, techApplicabilityFilter, phaseFilter, sortByDate]);

  const assignedCount = documents.filter(doc => doc.phases && doc.phases.length > 0).length;
  const unassignedCount = documents.length - assignedCount;

  return (
    <div className="space-y-4 p-4 h-full flex flex-col">
      {/* Enhanced Filters */}
      <EnhancedDocumentFilters
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusChange}
        searchQuery={searchTerm}
        onSearchChange={handleSearchChange}
        tagFilter={tagFilter}
        onTagFilterChange={handleTagChange}
        availableTags={availableTags}
        sectionFilter={sectionFilter}
        onSectionFilterChange={handleSectionChange}
        availableSections={availableSections}
        docTypeFilter={docTypeFilter}
        onDocTypeFilterChange={handleDocTypeChange}
        availableDocTypes={availableDocTypes}
        techApplicabilityFilter={techApplicabilityFilter}
        onTechApplicabilityFilterChange={handleTechApplicabilityChange}
        availableTechApplicabilities={availableTechApplicabilities}
        phaseFilter={phaseFilter}
        onPhaseFilterChange={handlePhaseChange}
        filterAvailablePhases={availablePhases}
        sortByDate={sortByDate}
        onSortByDateChange={setSortByDate}
        clearAllFilters={handleClearAll}
        availableSortOptions={[
          'none', 'name_asc', 'name_desc',
          'phase_asc', 'phase_desc',
          'section_asc', 'section_desc',
          'doctype_asc', 'doctype_desc',
        ]}
      />

      {/* Statistics */}
      <div className="flex gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-muted text-foreground border-border font-medium">
            Showing {filteredDocuments.length} / {documents.length}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {lang('companySettings.documentLibrary.assigned', { count: assignedCount })}
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            {lang('companySettings.documentLibrary.unassigned', { count: unassignedCount })}
          </Badge>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="h-[350px] pr-4">
          <Droppable droppableId="document-library">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "space-y-2 min-h-[200px] p-2 rounded-lg border-2 border-dashed",
                  snapshot.isDraggingOver ? "border-blue-400 bg-blue-50" : "border-gray-200"
                )}
              >
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{lang('companySettings.documentLibrary.noDocumentsFound')}</p>
                  </div>
                ) : (
                  filteredDocuments.map((document, index) => (
                    <Draggable
                      key={document.name}
                      draggableId={`doc-${document.name}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow min-h-[80px]",
                            snapshot.isDragging && "shadow-lg rotate-2"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div {...provided.dragHandleProps} className="mt-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-primary cursor-grab" />
                              </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm leading-tight break-words">
                                      {document.name}
                                    </p>
                                     {document.phases && document.phases.length > 0 && (
                                       <TooltipProvider delayDuration={200}>
                                         <Tooltip>
                                           <TooltipTrigger asChild>
                                             <div className="flex-shrink-0 cursor-default">
                                               <Info className="h-3.5 w-3.5 text-blue-500" />
                                             </div>
                                           </TooltipTrigger>
                                           <TooltipContent side="top" className="max-w-[300px]">
                                             <p className="text-xs font-medium mb-1">Recommended Phases:</p>
                                             {document.phases.map((phaseName, idx) => (
                                               <p key={idx} className="text-xs">• {phaseName}</p>
                                             ))}
                                             {(document as any).sub_section && (
                                               <>
                                                 <p className="text-xs font-medium mb-1 mt-2">Recommended Section:</p>
                                                 <p className="text-xs">• {(document as any).sub_section}</p>
                                               </>
                                             )}
                                           </TooltipContent>
                                         </Tooltip>
                                       </TooltipProvider>
                                     )}
                                     {DocumentTemplateFileService.hasAttachedFile(document) && (
                                       <div title="Has file attachment">
                                         <Paperclip className="h-3 w-3 text-green-600" />
                                       </div>
                                     )}
                                  </div>
                                   <div className="flex items-center gap-2 mt-1 flex-wrap">
                                     <Badge variant="outline" className="text-xs">
                                       {document.type}
                                     </Badge>
                                     {(document as any).documentSource === 'SaaS' && (
                                       <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200">
                                         Xyreg
                                       </Badge>
                                     )}
                                    {(document as any).tags && (document as any).tags.length > 0 && (
                                      (document as any).tags.map((tag: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                                          {tag}
                                        </Badge>
                                      ))
                                    )}
                                  </div>
                                </div>
                            </div>
                             <div className="flex items-start gap-1 ml-2">
                                {document.file_path && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewingDocument(document)}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                    title="View document file"
                                  >
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                )}
                               <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingDocument(document);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingDocument(document)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </ScrollArea>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>{lang('companySettings.documentLibrary.tip')}:</strong> {lang('companySettings.documentLibrary.tipText')}
        </p>
      </div>

      {/* Edit Dialog */}
      {editingDocument && (
        <DocumentEditDialog
          document={editingDocument}
          open={!!editingDocument}
          onOpenChange={(open) => !open && setEditingDocument(null)}
          onDocumentUpdated={async () => {
            await onDocumentUpdated();
            setEditingDocument(null);
          }}
          companyId={companyId}
        />
      )}

      {/* Delete Dialog */}
      {deletingDocument && (
        <DocumentDeleteDialog
          document={deletingDocument}
          open={!!deletingDocument}
          onOpenChange={(open) => !open && setDeletingDocument(null)}
          onDocumentDeleted={onDocumentUpdated}
          companyId={companyId}
        />
      )}

      {/* Document Viewer Dialog */}
      {viewingDocument && (
        <DocumentViewerDialog
          document={viewingDocument}
          open={!!viewingDocument}
          onOpenChange={(open) => !open && setViewingDocument(null)}
          companyId={companyId}
        />
      )}
    </div>
  );
}
