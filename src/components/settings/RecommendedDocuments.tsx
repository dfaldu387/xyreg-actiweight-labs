
import React, { useState } from "react";
import { DocumentCard } from "./DocumentCard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface RecommendedDocumentsProps {
  documents: any[];
  onToggle: (documentName: string, currentExcluded: boolean) => Promise<void>;
  onUpdatePhases: (documentName: string, phaseIds: string[]) => Promise<boolean>;
  availablePhases: string[];
  onRefresh?: () => Promise<void>; // Add refresh callback
}

export function RecommendedDocuments({ 
  documents, 
  onToggle, 
  onUpdatePhases, 
  availablePhases,
  onRefresh 
}: RecommendedDocumentsProps) {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [selectedPhases, setSelectedPhases] = useState<Record<string, string[]>>({});
  
  const handleDocumentToggle = async (documentName: string, excluded: boolean) => {
    console.log(`RecommendedDocuments: Toggling document ${documentName}, currently excluded: ${excluded}`);
    setIsLoading((prev) => ({ ...prev, [documentName]: true }));
    try {
      await onToggle(documentName, excluded);
      console.log(`RecommendedDocuments: Toggle completed for ${documentName}`);
      
      // After successful toggle, refresh the documents list
      if (onRefresh) {
        console.log("RecommendedDocuments: Refreshing documents after toggle");
        await onRefresh();
      }
    } catch (error) {
      console.error(`RecommendedDocuments: Error toggling document ${documentName}:`, error);
      toast.error(`Failed to ${excluded ? 'include' : 'exclude'} document`);
    } finally {
      setIsLoading((prev) => ({ ...prev, [documentName]: false }));
    }
  };

  const handlePhaseSelect = (documentName: string, phases: string[]) => {
    setSelectedPhases((prev) => ({ ...prev, [documentName]: phases }));
  };
  
  const handleUpdatePhases = async (documentName: string) => {
    setIsLoading((prev) => ({ ...prev, [documentName]: true }));
    try {
      const phases = selectedPhases[documentName] || [];
      const success = await onUpdatePhases(documentName, phases);
      
      // After updating phases, refresh the documents list
      if (success && onRefresh) {
        console.log("RecommendedDocuments: Refreshing documents after phase update");
        await onRefresh();
      }
      
      return success;
    } catch (error) {
      console.error(`Error updating phases for ${documentName}:`, error);
      toast.error("Failed to update document phases");
      return false;
    } finally {
      setIsLoading((prev) => ({ ...prev, [documentName]: false }));
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
        No recommended documents found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.name}
          document={{
            ...doc,
            phases: selectedPhases[doc.name] || doc.phases || []
          }}
          isExcluded={doc.excluded}
          isLoading={isLoading[doc.name] || false}
          availablePhases={availablePhases}
          onToggle={() => handleDocumentToggle(doc.name, doc.excluded)}
          onPhaseSelect={(phases) => handlePhaseSelect(doc.name, phases)}
          onUpdatePhases={() => handleUpdatePhases(doc.name)}
          showIncludeButton={doc.excluded} // Only show Include button when document is excluded
          showExcludeButton={!doc.excluded} // Only show Exclude button when document is included
        />
      ))}
    </div>
  );
}
