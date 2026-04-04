
import { DocumentItem } from "@/types/client";
import { ReactNode } from "react";

export interface DocumentStateContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  documents: DocumentItem[];
  setDocuments: (documents: DocumentItem[]) => void;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  selectedDocument: DocumentItem | null;
  setSelectedDocument: (document: DocumentItem | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading: boolean;
  availablePhases: string[];
  filteredDocuments: DocumentItem[];
}

export interface DocumentStateProviderProps {
  children: ReactNode;
  initialDocuments?: DocumentItem[];
  availablePhases?: string[];
  loading?: boolean;
}
