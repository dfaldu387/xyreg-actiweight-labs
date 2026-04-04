
import { TabsContent } from "@/components/ui/tabs";
import { DocumentItem } from "@/types/client";
import { DocumentAddDialog } from "./DocumentAddDialog";
import { DocumentEditDialog } from "./DocumentEditDialog";
import { DocumentPhaseSplitView } from "./DocumentPhaseSplitView";
import { useDocumentActions } from "./DocumentActions";
import { Phase } from "./services/phaseService";

interface DocumentContentProps {
  phaseOrder: Phase[];
  filteredDocuments: DocumentItem[];
  documents: DocumentItem[];
  setDocuments: (docs: DocumentItem[]) => void;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  selectedDocument: DocumentItem | null;
  setSelectedDocument: (doc: DocumentItem | null) => void;
  availablePhases: Phase[];
  activeTab: string;
  searchTerm: string;
  loading: boolean;
  companyId?: string;
}

export function DocumentContent({
  phaseOrder,
  filteredDocuments,
  documents,
  setDocuments,
  showAddForm,
  setShowAddForm,
  selectedDocument,
  setSelectedDocument,
  availablePhases,
  activeTab,
  searchTerm,
  loading,
  companyId
}: DocumentContentProps) {
  
  const {
    handleDeleteDocument,
    handleEditDocument,
    handleAddDocument,
    handleUpdateReviewers,
    handleAddButtonClick,
    isSubmitting
  } = useDocumentActions(
    documents,
    setDocuments,
    setSelectedDocument,
    setShowAddForm,
    companyId
  );

  // Handle document update callback for DocumentPhaseSplitView
  const handleDocumentUpdated = async (updatedDocument: DocumentItem) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === updatedDocument.id ? updatedDocument : doc
    );
    setDocuments(updatedDocuments);
  };

  // Handle successful document addition
  const handleDocumentAdded = (newDocument: DocumentItem) => {
    console.log("DocumentContent: Adding new document to list", newDocument);
    setDocuments([...documents, newDocument]);
    setShowAddForm(false);
  };

  // Convert phase names for backward compatibility where needed
  const availablePhaseNames = availablePhases.map(phase => phase.name);
  const phaseOrderNames = phaseOrder.map(phase => phase.name);

  return (
    <>
      {/* Always use the Document Library split view for all filters */}
      <TabsContent value={activeTab} className="space-y-4">
        <DocumentPhaseSplitView
          documents={activeTab === "all" ? documents : filteredDocuments}
          setDocuments={setDocuments}
          availablePhases={availablePhaseNames}
          phaseOrder={phaseOrderNames}
          companyId={companyId}
          onDocumentUpdated={handleDocumentUpdated}
        />
      </TabsContent>

      <DocumentAddDialog
        open={showAddForm}
        onOpenChange={setShowAddForm}
        phases={availablePhases} // Pass the actual phase objects with IDs
        availablePhases={availablePhaseNames}
        phaseOrder={phaseOrderNames}
        onDocumentAdded={handleDocumentAdded}
        companyId={companyId}
      />

      <DocumentEditDialog
        open={!!selectedDocument}
        onOpenChange={(open) => {
          if (!open) setSelectedDocument(null);
        }}
        document={selectedDocument}
        onDocumentUpdated={() => {
          // Trigger a refresh of the documents list
          if (selectedDocument) {
            handleDocumentUpdated(selectedDocument);
          }
        }}
        companyId={companyId || ''}
      />
    </>
  );
}
