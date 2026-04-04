
import { createContext, useContext, useState, useEffect } from "react";
import { DocumentItem } from "@/types/client";
import { 
  DocumentStateContextType, 
  DocumentStateProviderProps 
} from "./types/documentStateTypes";
import { useDocumentFiltering } from "./hooks/useDocumentFiltering";

const DocumentStateContext = createContext<DocumentStateContextType | undefined>(undefined);

/**
 * Provider component that manages document state and filtering
 */
export function DocumentStateProvider({
  children,
  initialDocuments = [],
  availablePhases = [],
  loading = false
}: DocumentStateProviderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Update documents when initialDocuments changes
  useEffect(() => {
    console.log("[DocumentState] Initial documents updated:", initialDocuments.length);
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  // Use the document filtering hook with correct object parameter
  const { filteredDocuments } = useDocumentFiltering({
    documents,
    searchTerm,
    selectedTechFilter: activeTab
  });

  // Debug log to track document filtering
  useEffect(() => {
    console.log("[DocumentState] Document filtering updated:", {
      documentsCount: documents.length,
      filteredCount: filteredDocuments.length,
      activeTab,
      searchTerm
    });
  }, [documents.length, filteredDocuments.length, activeTab, searchTerm]);

  const value: DocumentStateContextType = {
    searchTerm,
    setSearchTerm,
    documents,
    setDocuments,
    showAddForm,
    setShowAddForm,
    selectedDocument,
    setSelectedDocument,
    activeTab,
    setActiveTab,
    loading,
    availablePhases,
    filteredDocuments
  };

  return (
    <DocumentStateContext.Provider value={value}>
      {children}
    </DocumentStateContext.Provider>
  );
}

/**
 * Hook to use document state context
 * @throws Error if used outside of DocumentStateProvider
 */
export function useDocumentState() {
  const context = useContext(DocumentStateContext);
  if (context === undefined) {
    throw new Error("useDocumentState must be used within a DocumentStateProvider");
  }
  return context;
}
