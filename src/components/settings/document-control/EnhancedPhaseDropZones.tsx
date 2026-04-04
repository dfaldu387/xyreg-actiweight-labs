
import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, X, FileText, Layers } from 'lucide-react';
import { DocumentItem } from '@/types/client';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, useRef } from 'react';

interface ComplianceSection {
  id: string;
  name: string;
}

interface EnhancedPhaseDropZonesProps {
  documentsByPhase: Record<string, DocumentItem[]>;
  phases: { id?: string, name: string, is_continuous_process: boolean, compliance_section_ids?: string[] }[];
  onRemoveDocument: (document: DocumentItem, phaseName: string) => void;
  isDragging?: boolean;
  phaseToKeepOpen?: string | null; // Phase name that should stay open after refresh
  complianceSections?: ComplianceSection[];
}

export function EnhancedPhaseDropZones({
  documentsByPhase,
  phases,
  onRemoveDocument,
  isDragging = false,
  phaseToKeepOpen = null,
  complianceSections = []
}: EnhancedPhaseDropZonesProps) {
  // Start with all phases collapsed by default, but preserve user's open/close choices
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(() => new Set(phases.map(phase => phase.name)));
  // Track expanded sections within phases (key: "phaseName::sectionName") — default all collapsed
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  // Track which phase is being dragged over using ref to avoid stale closures
  const draggedOverPhaseRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track open phases when drag starts to preserve them
  const openPhasesOnDragStartRef = useRef<Set<string> | null>(null);
  // Track phases that should stay open (e.g., after document assignment)
  const phasesToKeepOpenRef = useRef<Set<string>>(new Set());
  
  // console.log('phases EnhancedPhaseDropZones', phases);
  // Handle new phases being added while preserving user choices for existing phases
  useEffect(() => {
    // Don't update collapsed state during drag operations to preserve open phases
    if (isDragging && openPhasesOnDragStartRef.current) {
      return;
    }
    
    setCollapsedPhases(prev => {
      const newCollapsed = new Set(prev);

      // Add any new phases as collapsed (default state) - but don't change existing phases
      phases.forEach(phase => {
        if (!prev.has(phase.name) && !newCollapsed.has(phase.name)) {
          // New phase - add as collapsed by default UNLESS it should be kept open
          if (!phasesToKeepOpenRef.current.has(phase.name)) {
            newCollapsed.add(phase.name);
          }
        }
        // For existing phases:
        // - Only force open if it's in keep-open ref AND currently open (not manually closed)
        // - If user manually closed it (it's in prev collapsed set), respect that choice
        const isCurrentlyClosed = prev.has(phase.name);
        const shouldKeepOpen = phasesToKeepOpenRef.current.has(phase.name);
        
        if (shouldKeepOpen && !isCurrentlyClosed) {
          // Phase should be kept open and is currently open - ensure it stays open
          newCollapsed.delete(phase.name);
        }
        // If phase is manually closed (isCurrentlyClosed), don't force it open
        // even if it's in the keep-open ref (user's manual choice takes precedence)
      });

      // Remove phases that no longer exist
      Array.from(prev).forEach(phaseName => {
        if (!phases.some(phase => phase.name === phaseName)) {
          newCollapsed.delete(phaseName);
        }
      });

      return newCollapsed;
    });
  }, [phases, isDragging]);

  // Preserve open phases when drag starts
  useEffect(() => {
    if (isDragging && !openPhasesOnDragStartRef.current) {
      // Store currently open phases when drag starts
      const openPhases = new Set<string>();
      phases.forEach(phase => {
        if (!collapsedPhases.has(phase.name)) {
          openPhases.add(phase.name);
        }
      });
      openPhasesOnDragStartRef.current = openPhases;
    } else if (!isDragging && openPhasesOnDragStartRef.current) {
      // Clear the stored open phases when drag ends
      openPhasesOnDragStartRef.current = null;
    }
  }, [isDragging, phases, collapsedPhases]);

  // Function to handle phase being dragged over
  const handlePhaseDragOver = useCallback((phaseName: string, isDraggingOver: boolean) => {
    if (isDraggingOver) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // If this is a new phase being dragged over, open it immediately and keep it open
      if (draggedOverPhaseRef.current !== phaseName) {
        draggedOverPhaseRef.current = phaseName;
        setCollapsedPhases(prev => {
          const newCollapsed = new Set(prev);
          // Open the phase immediately when dragging over it
          newCollapsed.delete(phaseName);
          // Also add to keep-open ref so it stays open after drop
          phasesToKeepOpenRef.current.add(phaseName);
          return newCollapsed;
        });
      }
    } else if (draggedOverPhaseRef.current === phaseName) {
      // Clear the dragged over phase after a delay
      // Don't auto-close - let user manually close if they want
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        draggedOverPhaseRef.current = null;
        // Phase stays open - user can manually close it
      }, 100);
    }
  }, []);

  // Ensure open phases stay open during drag
  useEffect(() => {
    if (isDragging && openPhasesOnDragStartRef.current) {
      setCollapsedPhases(prev => {
        const newCollapsed = new Set(prev);
        // Keep all phases that were open when drag started
        openPhasesOnDragStartRef.current?.forEach(phaseName => {
          newCollapsed.delete(phaseName);
        });
        return newCollapsed;
      });
    }
  }, [isDragging]);

  // Keep specific phase open after document assignment
  useEffect(() => {
    if (phaseToKeepOpen) {
      setCollapsedPhases(prev => {
        const isCurrentlyClosed = prev.has(phaseToKeepOpen);
        
        // If user has manually closed it, respect their choice - don't force it open
        if (isCurrentlyClosed) {
          // User closed it manually - remove from keep-open ref and don't open it
          phasesToKeepOpenRef.current.delete(phaseToKeepOpen);
          return prev; // Keep it closed
        } else {
          // Phase is open or was just assigned - keep it open
          phasesToKeepOpenRef.current.add(phaseToKeepOpen);
          // Ensure it's not in collapsed set
          const newCollapsed = new Set(prev);
          newCollapsed.delete(phaseToKeepOpen);
          return newCollapsed;
        }
      });
    }
  }, [phaseToKeepOpen]);

  const togglePhase = useCallback((phaseName: string) => {
    // Don't allow toggling during drag operations
    if (isDragging) return;
    
    setCollapsedPhases(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(phaseName)) {
        // Opening the phase - user manually opened it
        newCollapsed.delete(phaseName);
        // Don't add to keep-open ref - let user control it
      } else {
        // Closing the phase - user manually closed it
        // Remove from keep-open ref so it doesn't auto-open again
        phasesToKeepOpenRef.current.delete(phaseName);
        newCollapsed.add(phaseName);
      }
      return newCollapsed;
    });
  }, [isDragging]);

  return (
    <div>
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {phases.map((phase, phaseIndex) => {
            const phaseDocuments = documentsByPhase[phase.name] || [];
            const isCollapsed = collapsedPhases.has(phase.name);
            // Determine if phase should be open
            // Priority: 1) Dragging over it, 2) Was open when drag started, 3) User's manual choice
            const isDraggedOver = draggedOverPhaseRef.current === phase.name;
            const wasOpenOnDragStart = openPhasesOnDragStartRef.current?.has(phase.name);
            const shouldBeOpen = isDraggedOver || (isDragging && wasOpenOnDragStart) || !isCollapsed;

            return (
              <Collapsible 
                key={phase.name} 
                open={shouldBeOpen}
                onOpenChange={(open) => {
                  // Sync state when user manually toggles
                  if (!isDragging) {
                    setCollapsedPhases(prev => {
                      const newCollapsed = new Set(prev);
                      const currentlyCollapsed = prev.has(phase.name);
                      
                      if (open && currentlyCollapsed) {
                        // User opened it - remove from collapsed
                        newCollapsed.delete(phase.name);
                      } else if (!open && !currentlyCollapsed) {
                        // User closed it - add to collapsed
                        newCollapsed.add(phase.name);
                      }
                      
                      return newCollapsed;
                    });
                  }
                }}
              >
                <div className="border rounded-lg bg-gray-50">
                  {/* Make the header also detect drag-over when phase is closed */}
                  <Droppable droppableId={`phase-header-${phase.name}`} isDropDisabled={true}>
                    {(provided, snapshot) => {
                      // If dragging over the header and phase is closed, open it immediately
                      if (snapshot.isDraggingOver && isCollapsed && isDragging) {
                        handlePhaseDragOver(phase.name, true);
                      }
                      
                      return (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.droppableProps}
                          className={snapshot.isDraggingOver && isCollapsed ? 'bg-blue-50' : ''}
                        >
                          <CollapsibleTrigger
                            disabled={isDragging}
                            className="w-full"
                          >
                    <div className={`flex items-center justify-between p-3 rounded-t-lg transition-colors ${
                      isDragging ? 'cursor-default' : 'hover:bg-gray-100 cursor-pointer'
                    }`}>
                      <div className="flex items-center gap-3">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 transition-transform" />
                        ) : (
                          <ChevronDown className="h-4 w-4 transition-transform" />
                        )}
                        <span className="font-medium text-sm">
                          {phase.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {phaseDocuments.length} docs
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  {provided.placeholder}
                        </div>
                      );
                    }}
                  </Droppable>

                  <CollapsibleContent>
                    {(() => {
                      // Get sections that belong to this phase (via phase_id)
                      const phaseSections = phase.id
                        ? complianceSections.filter(s => (s as any).phase_id === phase.id)
                        : [];
                      const allPhaseSectionIds = new Set(phaseSections.map(s => s.id));

                      // Group documents by section ID
                      const sectionGroups: Record<string, { name: string; docs: DocumentItem[] }> = {};
                      const ungrouped: DocumentItem[] = [];

                      // Initialize section groups from phase sections
                      allPhaseSectionIds.forEach(sectionId => {
                        const section = complianceSections.find(s => s.id === sectionId);
                        if (section) {
                          sectionGroups[sectionId] = { name: section.name, docs: [] };
                        }
                      });

                      phaseDocuments.forEach(doc => {
                        const docSectionIds: string[] = (doc as any).section_ids || [];
                        // Find first matching section ID from the phase's sections
                        const matchedSectionId = docSectionIds.find(id => sectionGroups[id] !== undefined);
                        if (matchedSectionId) {
                          sectionGroups[matchedSectionId].docs.push(doc);
                        } else {
                          ungrouped.push(doc);
                        }
                      });
                      const sectionEntries = Object.entries(sectionGroups);
                      const hasSections = sectionEntries.length > 0;

                      return (
                        <div className="border-t border-dashed border-gray-200 p-3 space-y-2">
                          {/* Section droppable zones */}
                          {sectionEntries.map(([sectionId, sectionData]) => {
                            const sectionName = sectionData.name;
                            const docs = sectionData.docs;
                            const sectionKey = `${phase.name}::${sectionId}`;
                            const isSectionExpanded = expandedSections.has(sectionKey);
                            return (
                              <Droppable key={sectionId} droppableId={`phase-${phase.name}__sectionid-${sectionId}`}>
                                {(provided, snapshot) => {
                                  if (snapshot.isDraggingOver) {
                                    handlePhaseDragOver(phase.name, true);
                                  }
                                  return (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.droppableProps}
                                      className={cn(
                                        "border rounded-md overflow-hidden transition-colors",
                                        snapshot.isDraggingOver
                                          ? "border-blue-400 bg-blue-50"
                                          : "border-slate-200"
                                      )}
                                    >
                                      <div
                                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
                                        onClick={() => setExpandedSections(prev => {
                                          const next = new Set(prev);
                                          if (next.has(sectionKey)) next.delete(sectionKey);
                                          else next.add(sectionKey);
                                          return next;
                                        })}
                                      >
                                        {!isSectionExpanded ? (
                                          <ChevronRight className="h-3 w-3 text-slate-500" />
                                        ) : (
                                          <ChevronDown className="h-3 w-3 text-slate-500" />
                                        )}
                                        <Layers className="h-3 w-3 text-slate-600" />
                                        <span className="text-xs font-medium text-slate-700">{sectionName}</span>
                                        <Badge variant="outline" className="text-xs ml-auto bg-slate-50 text-slate-600 border-slate-300">
                                          {docs.length}
                                        </Badge>
                                      </div>
                                      {isSectionExpanded && (
                                        <div className="space-y-1 p-2 bg-slate-50/50">
                                          {docs.map((document) => (
                                            <div
                                              key={`${phase.name}-${document.id}`}
                                              className="flex items-start justify-between p-3 bg-white border rounded-md hover:shadow-sm transition-shadow min-h-[60px]"
                                            >
                                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                                <FileText className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                  <span className="text-xs font-medium leading-tight break-words block">
                                                    {document.name}
                                                  </span>
                                                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                    <Badge variant="outline" className="text-xs">
                                                      {document.type}
                                                    </Badge>
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
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRemoveDocument(document, phase.name)}
                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {provided.placeholder}
                                    </div>
                                  );
                                }}
                              </Droppable>
                            );
                          })}

                          {/* Phase-level droppable for ungrouped docs */}
                          <Droppable droppableId={`phase-${phase.name}`}>
                            {(provided, snapshot) => {
                              if (snapshot.isDraggingOver) {
                                handlePhaseDragOver(phase.name, true);
                              } else if (!sectionEntries.some(([s]) => false)) {
                                handlePhaseDragOver(phase.name, false);
                              }
                              return (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={cn(
                                    "min-h-[40px] rounded-md transition-colors",
                                    snapshot.isDraggingOver
                                      ? "bg-blue-50 border border-blue-300 border-dashed p-2"
                                      : ungrouped.length === 0 && !hasSections
                                        ? "min-h-[100px] flex items-center justify-center"
                                        : ""
                                  )}
                                >
                                  {ungrouped.length === 0 && !hasSections ? (
                                    <div className="text-center py-6 text-muted-foreground">
                                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-xs">Drop documents here</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {ungrouped.map((document) => (
                                        <div
                                          key={`${phase.name}-${document.id}`}
                                          className="flex items-start justify-between p-3 bg-white border rounded-md hover:shadow-sm transition-shadow min-h-[60px]"
                                        >
                                          <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <FileText className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <span className="text-xs font-medium leading-tight break-words block">
                                                {document.name}
                                              </span>
                                               <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                 <Badge variant="outline" className="text-xs">
                                                   {document.type}
                                                 </Badge>
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
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemoveDocument(document, phase.name)}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {provided.placeholder}
                                </div>
                              );
                            }}
                          </Droppable>
                        </div>
                      );
                    })()}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
