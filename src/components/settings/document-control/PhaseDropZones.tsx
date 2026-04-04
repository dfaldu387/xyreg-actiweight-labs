import React, { useState, useEffect } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { DocumentItem } from "@/types/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, X, FileText, Target } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getPhaseDisplayName } from "@/utils/phaseNumbering";
import { toast } from "sonner";
import { EnhancedDocumentOperations } from "./utils/enhancedDocumentOperations";

interface PhaseDropZonesProps {
  documentsByPhase: Record<string, DocumentItem[]>;
  phases: string[];
  onRemoveDocument: (document: DocumentItem, phaseName: string) => void;
  onDeleteDocument?: (document: DocumentItem) => Promise<void>;
  isRightPanelOpen: boolean;
}

// Helper function to get phase ID from phase name
const getPhaseIdFromName = async (phaseName: string, companyId: string): Promise<string | null> => {
  return await EnhancedDocumentOperations.getPhaseIdFromName(phaseName, companyId);
};

export function PhaseDropZones({
  documentsByPhase,
  phases,
  onRemoveDocument,
  onDeleteDocument,
  isRightPanelOpen
}: PhaseDropZonesProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [removingDocument, setRemovingDocument] = useState<string | null>(null);

  // Initialize with collapsed phases only once on mount
  useEffect(() => {
    setExpandedPhases(new Set());
  }, []); // No dependencies - only run once on mount

  const togglePhase = (phaseIdentifier: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseIdentifier)) {
      newExpanded.delete(phaseIdentifier);
    } else {
      newExpanded.add(phaseIdentifier);
    }
    setExpandedPhases(newExpanded);
  };

  // Enhanced document removal using phase ID
  const handleRemoveDocument = async (document: DocumentItem, phaseName: string) => {
    console.log(`[PhaseDropZones] Attempting to remove document "${document.name}" from phase "${phaseName}"`);
    console.log('[PhaseDropZones] Document object:', document);
    
    const documentKey = `${document.id}-${phaseName}`;
    setRemovingDocument(documentKey);
    
    try {
      // Validate document and phase
      if (!document.id) {
        throw new Error('Document ID is missing');
      }
      
      if (!phaseName) {
        throw new Error('Phase name is missing');
      }

      // Get company identifier from URL
      const companyIdentifier = EnhancedDocumentOperations.getCurrentCompanyIdentifier();
      if (!companyIdentifier) {
        throw new Error('Company context not found in URL');
      }

      console.log('[PhaseDropZones] Using phase ID-based removal with company:', companyIdentifier);

      // First resolve company ID
      const companyId = await EnhancedDocumentOperations['resolveCompanyId'](companyIdentifier);
      
      // Get phase ID from phase name
      const phaseId = await getPhaseIdFromName(phaseName, companyId);
      if (!phaseId) {
        throw new Error(`Could not find phase ID for "${phaseName}"`);
      }

      console.log('[PhaseDropZones] Phase ID resolved:', phaseId);

      // Use enhanced document operations with phase ID
      const success = await EnhancedDocumentOperations.removeDocumentFromPhaseById(
        document.name,
        phaseId,
        companyIdentifier
      );

      if (success) {
        // Call the original callback to update UI state
        onRemoveDocument(document, phaseName);
        console.log(`[PhaseDropZones] Successfully removed document "${document.name}" from phase "${phaseName}"`);
      }
      
    } catch (error) {
      console.error(`[PhaseDropZones] Failed to remove document "${document.name}" from phase "${phaseName}":`, error);
      
      // Enhanced operations already handle toast messages, but add fallback
      if (error instanceof Error && !error.message.includes('Authentication') && 
          !error.message.includes('Company') && !error.message.includes('Phase') && 
          !error.message.includes('Document') && !error.message.includes('Permission')) {
        toast.error(`Unexpected error: ${error.message}`);
      }
    } finally {
      setRemovingDocument(null);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "Standard": "bg-blue-100 text-blue-800",
      "Regulatory": "bg-green-100 text-green-800", 
      "Technical": "bg-purple-100 text-purple-800",
      "Clinical": "bg-orange-100 text-orange-800",
      "Quality": "bg-yellow-100 text-yellow-800",
      "Design": "bg-pink-100 text-pink-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const renderDocumentCard = (document: DocumentItem, index: number, phaseName: string) => {
    const isExpanded = !isRightPanelOpen;
    const documentKey = `${document.id}-${phaseName}`;
    const isRemoving = removingDocument === documentKey;

    return (
      <div
        key={`${phaseName}-${document.id || document.name}-${index}`}
        className={`
          flex items-center justify-between p-2 bg-white border rounded shadow-sm
          ${isExpanded ? 'flex-col gap-2' : 'flex-row'}
          ${isRemoving ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className={`${isExpanded ? 'w-full' : 'flex-1 min-w-0'}`}>
          <div className={`flex items-center justify-between ${isExpanded ? 'mb-2' : ''}`}>
            <div className={`font-medium truncate ${isExpanded ? 'text-base' : 'text-sm'}`} title={document.name}>
              {document.name}
            </div>
            <div className="flex items-center gap-1 ml-2 flex-wrap">
              <Badge className={`text-xs ${getTypeColor(document.type || 'Standard')}`}>
                {document.type || 'Standard'}
              </Badge>
              {document.techApplicability && document.techApplicability !== "All device types" && (
                <Badge variant="outline" className="text-xs">
                  {document.techApplicability}
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
          
          {isExpanded && document.description && (
            <div className="text-sm text-gray-600 mb-2 leading-relaxed">
              {document.description}
            </div>
          )}

          {isExpanded && (
            <div className="space-y-1 text-sm text-gray-500">
              {document.status && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant="secondary" className="text-xs">
                    {document.status}
                  </Badge>
                </div>
              )}
              {document.phases && document.phases.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Also assigned to:</span>
                  <div className="flex flex-wrap gap-1">
                    {document.phases
                      .filter(phase => phase !== phaseName)
                      .slice(0, 3)
                      .map(phase => (
                        <Badge key={phase} variant="outline" className="text-xs">
                          {phase}
                        </Badge>
                      ))}
                    {document.phases.filter(phase => phase !== phaseName).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{document.phases.filter(phase => phase !== phaseName).length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                ID: {document.id} | Phase: {phaseName}
              </div>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveDocument(document, phaseName)}
          disabled={isRemoving}
          className={`${isExpanded ? 'self-end' : 'ml-2'} h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0`}
          title={`Remove from ${phaseName}`}
        >
          {isRemoving ? (
            <div className="h-3 w-3 animate-spin border border-red-500 border-t-transparent rounded-full" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  };

  const renderPhaseSection = (phaseIdentifier: string, documents: DocumentItem[], index: number) => {
    const isExpanded = expandedPhases.has(phaseIdentifier);
    
    // Create droppable ID that exactly matches the phase name
    const droppableId = `phase-${phaseIdentifier}`;
    
    // Format phase name with consistent (X) numbering
    const formattedPhaseName = getPhaseDisplayName(phaseIdentifier);
    
    console.log(`[PhaseDropZones] Creating droppable for phase "${phaseIdentifier}" with ID: "${droppableId}", formatted as: "${formattedPhaseName}"`);

    return (
      <div key={phaseIdentifier} className="border-b">
        <Collapsible open={isExpanded} onOpenChange={() => togglePhase(phaseIdentifier)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">{formattedPhaseName}</span>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {documents.length}
                </Badge>
              </div>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <Droppable 
              droppableId={droppableId}
              type="document"
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    min-h-[120px] p-4 transition-all duration-200
                    ${snapshot.isDraggingOver 
                      ? 'bg-blue-50 border-blue-300 border-2 border-dashed shadow-inner' 
                      : documents.length === 0 
                        ? 'bg-gray-50 border-2 border-dashed border-gray-300' 
                        : 'bg-gray-50'
                    }
                  `}
                >
                  {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <div className={`transition-all duration-200 ${snapshot.isDraggingOver ? 'scale-110' : ''}`}>
                        {snapshot.isDraggingOver ? (
                          <Target className="h-8 w-8 mb-2 text-blue-500" />
                        ) : (
                          <FileText className="h-8 w-8 mb-2" />
                        )}
                      </div>
                      <p className={`text-sm font-medium transition-colors ${snapshot.isDraggingOver ? 'text-blue-700' : ''}`}>
                        {snapshot.isDraggingOver 
                          ? `Drop document here to assign to ${formattedPhaseName}` 
                          : "No documents assigned"
                        }
                      </p>
                      {!snapshot.isDraggingOver && (
                        <p className="text-xs mt-1">Drag documents from the right panel</p>
                      )}
                    </div>
                  ) : (
                    <div className={`${isRightPanelOpen ? 'space-y-2' : 'space-y-3'}`}>
                      {documents.map((document, docIndex) => 
                        renderDocumentCard(document, docIndex, phaseIdentifier)
                      )}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="space-y-0">
      {/* Header with instructions */}
      {isRightPanelOpen && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Target className="h-4 w-4" />
            <span className="font-medium">Drop zones ready</span>
            <span className="text-blue-600">• Drag documents from the library to assign them to phases</span>
          </div>
        </div>
      )}
      
      {/* Enhanced debugging info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 bg-gray-50 border-b text-xs text-gray-500">
          Debug: {phases.length} phases, {Object.keys(documentsByPhase).length} phase groups, 
          {Object.values(documentsByPhase).reduce((sum, docs) => sum + docs.length, 0)} total documents
        </div>
      )}
      
      {/* Render ordered phases with consistent numbering */}
      {phases.map((phaseIdentifier, index) => 
        renderPhaseSection(phaseIdentifier, documentsByPhase[phaseIdentifier] || [], index)
      )}
    </div>
  );
}
