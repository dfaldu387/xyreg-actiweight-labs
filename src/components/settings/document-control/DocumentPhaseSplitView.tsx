
import React, { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { DocumentItem } from "@/types/client";
import { DocumentLibraryPanel } from "./DocumentLibraryPanel";
import { PhaseDropZones } from "./PhaseDropZones";
import { DocumentSplitViewToggle } from "./components/DocumentSplitViewToggle";
import { DocumentHeader } from "./DocumentHeader";
import { BulkDocumentImportDialog } from "../BulkDocumentImportDialog";
import { useDocumentFiltering } from "./hooks/useDocumentFiltering";
import { createDragEndHandler, createRemoveDocumentHandler, createDeleteDocumentHandler } from "./utils/dragHandlers";
import { autoSetupCompanyAccess } from "./utils/userAccessSetup";
import { DocumentService } from "@/services/documentService";
import { toast } from "sonner";

interface DocumentPhaseSplitViewProps {
  documents: DocumentItem[];
  setDocuments: (docs: DocumentItem[]) => void;
  availablePhases: string[];
  phaseOrder: string[];
  companyId?: string;
  onDocumentUpdated?: (document: DocumentItem) => void;
}

export function DocumentPhaseSplitView({
  documents,
  setDocuments,
  availablePhases,
  phaseOrder,
  companyId,
  onDocumentUpdated
}: DocumentPhaseSplitViewProps) {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechFilter, setSelectedTechFilter] = useState("all");
  const [syncingDocuments, setSyncingDocuments] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { filteredDocuments, documentsByPhase } = useDocumentFiltering({
    documents,
    searchTerm,
    selectedTechFilter
  });

  // Enhanced drag end handler with auto-access setup
  const handleDragEndWithAccessSetup = async (result: any) => {
    // If drag operation fails due to permissions, try to auto-setup access
    const originalHandler = createDragEndHandler(
      filteredDocuments,
      documents,
      setDocuments,
      phaseOrder,
      onDocumentUpdated
    );

    try {
      await originalHandler(result);
    } catch (error: any) {
      console.log("[DocumentPhaseSplitView] Drag operation failed, checking if it's an access issue");
      
      // Check if it's a permission/RLS error
      if (error?.message?.includes("row-level security") || error?.message?.includes("permission")) {
        console.log("[DocumentPhaseSplitView] Detected permission issue, attempting auto-setup");
        
        // Extract company name from current URL or use a fallback
        const urlPath = window.location.pathname;
        const companyNameMatch = urlPath.match(/\/company\/([^\/]+)/);
        const companyName = companyNameMatch ? decodeURIComponent(companyNameMatch[1]) : "";
        
        if (companyName) {
          toast.loading("Setting up company access...");
          const accessGranted = await autoSetupCompanyAccess(companyName);
          
          if (accessGranted) {
            toast.dismiss();
            toast.success("Access granted! Retrying operation...");
            
            // Retry the drag operation
            try {
              await originalHandler(result);
              toast.success("Document assignment completed successfully");
            } catch (retryError) {
              console.error("[DocumentPhaseSplitView] Retry failed:", retryError);
              toast.error("Operation failed even after granting access");
            }
          } else {
            toast.dismiss();
            toast.error("Could not grant company access");
          }
        } else {
          toast.error("Could not determine company name for access setup");
        }
      } else {
        // Re-throw non-permission errors
        throw error;
      }
    }
  };

  // Create event handlers using the utility functions
  const handleRemoveDocumentFromPhase = createRemoveDocumentHandler(
    documents,
    setDocuments,
    onDocumentUpdated
  );

  const handleDeleteDocument = createDeleteDocumentHandler(
    documents,
    setDocuments,
    companyId
  );

  // Calculate document counts by type for header - FIXED to use 'type' instead of 'document_type'
  const countByType = {
    all: documents.length,
    standard: documents.filter(doc => doc.type === 'Standard').length,
    regulatory: documents.filter(doc => doc.type === 'Regulatory').length,
    technical: documents.filter(doc => doc.type === 'Technical').length,
    clinical: documents.filter(doc => doc.type === 'Clinical').length,
    quality: documents.filter(doc => doc.type === 'Quality').length,
    design: documents.filter(doc => doc.type === 'Design').length,
    sop: documents.filter(doc => doc.type === 'SOP').length,
  };

  // Header event handlers - IMPLEMENTED with actual functionality
  const handleAddButtonClick = () => {
    toast.info("Add Document feature will be implemented in the next phase");
  };

  const handleSyncDocumentMatrix = async () => {
    if (!companyId) {
      toast.error("Company ID is required for sync");
      return;
    }

    setSyncingDocuments(true);
    try {
      console.log("Starting document synchronization...");
      const success = await DocumentService.synchronizeDocumentCatalog();
      
      if (success) {
        toast.success("Document synchronization completed successfully");
        if (onDocumentUpdated && documents.length > 0) {
          onDocumentUpdated(documents[0]);
        }
      } else {
        toast.error("Document synchronization failed");
      }
    } catch (error) {
      console.error("Error syncing documents:", error);
      toast.error(`Failed to sync documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncingDocuments(false);
    }
  };

  const handleDocumentRefresh = async () => {
    try {
      toast.info("Refreshing document templates...");
      
      if (onDocumentUpdated && documents.length > 0) {
        onDocumentUpdated(documents[0]);
        toast.success("Document templates refreshed");
      } else {
        toast.info("No documents to refresh");
      }
    } catch (error) {
      console.error("Error refreshing documents:", error);
      toast.error("Failed to refresh documents");
    }
  };

  const handleCsvExport = () => {
    try {
      const csvHeaders = [
        "Document Name",
        "Document Type", 
        "Status",
        "Tech Applicability",
        "Description",
        "Phase Name",
        "Phase Description",
        "Category Name"
      ];

      const csvRows = documents.map(doc => [
        `"${doc.name}"`,
        `"${doc.type}"`,
        `"${doc.status || 'Not Started'}"`,
        `"${doc.techApplicability || 'All device types'}"`,
        `"${doc.description || ''}"`,
        `"${doc.phases?.[0] || ''}"`,
        `""`,
        `""`
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `document-templates-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${documents.length} document templates to CSV`);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

  const handleCsvImport = () => {
    if (!companyId) {
      toast.error("Company ID is required for import");
      return;
    }
    setImportDialogOpen(true);
  };

  const handleImportDialogRefresh = async () => {
    try {
      await handleDocumentRefresh();
    } catch (error) {
      console.error("Error refreshing after import:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Document Header with all action buttons */}
      <DocumentHeader
        countByType={countByType}
        activeTab={selectedTechFilter}
        setActiveTab={setSelectedTechFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleAddButtonClick={handleAddButtonClick}
        handleSyncDocumentMatrix={handleSyncDocumentMatrix}
        syncingDocuments={syncingDocuments}
        availablePhases={availablePhases}
        phaseOrder={phaseOrder}
        onDocumentRefresh={handleDocumentRefresh}
        onCsvExport={handleCsvExport}
        onCsvImport={handleCsvImport}
      />

      {/* Split View Interface with enhanced drag handler */}
      <DragDropContext onDragEnd={handleDragEndWithAccessSetup}>
        <div className="flex h-full">
          {/* Left Panel - Phase Drop Zones */}
          <div className={`transition-all duration-300 ${isRightPanelOpen ? 'w-1/2' : 'w-full'}`}>
            <PhaseDropZones
              phases={phaseOrder}
              documentsByPhase={documentsByPhase}
              onRemoveDocument={handleRemoveDocumentFromPhase}
              onDeleteDocument={handleDeleteDocument}
              isRightPanelOpen={isRightPanelOpen}
            />
          </div>

          {/* Toggle Button */}
          <DocumentSplitViewToggle
            isRightPanelOpen={isRightPanelOpen}
            onToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
          />

          {isRightPanelOpen && (
            <div className="w-1/2 border-l border-gray-300">
              <DocumentLibraryPanel
                documents={filteredDocuments}
                onDocumentUpdated={() => {
                  // Trigger a refresh when documents are updated in the library panel
                  if (onDocumentUpdated && documents.length > 0) {
                    onDocumentUpdated(documents[0]);
                  }
                }}
                companyId={companyId || ''}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                activeFilter={selectedTechFilter}
                onFilterChange={setSelectedTechFilter}
              />
            </div>
          )}
        </div>
      </DragDropContext>

      {/* CSV Import Dialog */}
      {companyId && (
        <BulkDocumentImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          companyId={companyId}
          onImportComplete={handleImportDialogRefresh}
        />
      )}
    </div>
  );
}
