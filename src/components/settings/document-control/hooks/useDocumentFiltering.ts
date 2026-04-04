
import { useMemo } from "react";
import { DocumentItem } from "@/types/client";

interface UseDocumentFilteringProps {
  documents: DocumentItem[];
  searchTerm: string;
  selectedTechFilter: string;
}

export function useDocumentFiltering({
  documents,
  searchTerm,
  selectedTechFilter
}: UseDocumentFilteringProps) {
  // Filter and deduplicate documents for the library panel - now includes ALL documents
  const filteredDocuments = useMemo(() => {
    console.log("[useDocumentFiltering] Processing documents for library:", {
      totalDocs: documents.length,
      assigned: documents.filter(d => d.phases && d.phases.length > 0).length,
      unassigned: documents.filter(d => !d.phases || d.phases.length === 0).length
    });

    // First filter by search and tech type - include ALL documents (assigned and unassigned)
    const filtered = documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTech = selectedTechFilter === "all" || 
        (doc.techApplicability && doc.techApplicability.toLowerCase().includes(selectedTechFilter.toLowerCase()));
      
      return matchesSearch && matchesTech;
    });

    // Deduplicate by document name, preserving the most complete record
    const deduplicatedMap = new Map<string, DocumentItem>();
    
    filtered.forEach(doc => {
      const existing = deduplicatedMap.get(doc.name);
      if (!existing) {
        // First occurrence - store it
        deduplicatedMap.set(doc.name, doc);
      } else {
        // Merge phase information from all instances with the same name
        const allPhases = new Set([
          ...(existing.phases || []),
          ...(doc.phases || [])
        ]);
        
        // Update the existing record with combined phase information
        deduplicatedMap.set(doc.name, {
          ...existing,
          phases: Array.from(allPhases)
        });
      }
    });
    
    const result = Array.from(deduplicatedMap.values());
    console.log("[useDocumentFiltering] Library panel will show:", {
      total: result.length,
      assigned: result.filter(d => d.phases && d.phases.length > 0).length,
      unassigned: result.filter(d => !d.phases || d.phases.length === 0).length
    });
    
    return result;
  }, [documents, searchTerm, selectedTechFilter]);

  // Group documents by phase for the left panel (only assigned documents)
  const documentsByPhase = useMemo(() => {
    const grouped: Record<string, DocumentItem[]> = {};
    
    // Initialize all phases with empty arrays
    const phaseOrder = Array.from(new Set(documents.flatMap(doc => doc.phases || [])));
    phaseOrder.forEach(phase => {
      grouped[phase] = [];
    });
    
    // Group documents by their phases (only documents that have phase assignments)
    documents.forEach(doc => {
      if (doc.phases && doc.phases.length > 0) {
        doc.phases.forEach(phase => {
          if (grouped[phase]) {
            grouped[phase].push(doc);
          }
        });
      }
    });
    
    return grouped;
  }, [documents]);

  return {
    filteredDocuments,
    documentsByPhase
  };
}
