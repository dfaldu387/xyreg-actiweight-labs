
import { useState, useCallback, useMemo } from "react";
import { DocumentItem } from "@/types/client";
import { useDocumentFetch } from "./useDocumentFetch";
import { useParams } from "react-router-dom";
import { resolveCompanyIdentifier } from "@/utils/companyUtils";
import React from "react";

export function useDocumentControlState() {
  const params = useParams<{ companyName: string }>();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Resolve company ID from params
  React.useEffect(() => {
    const resolveCompany = async () => {
      if (params.companyName) {
        const result = await resolveCompanyIdentifier(params.companyName);
        if (result.companyId) {
          setCompanyId(result.companyId);
        }
      }
    };
    
    resolveCompany();
  }, [params.companyName]);

  // Use templates-only mode for company settings (true)
  const {
    documents,
    setDocuments,
    availablePhases,
    availablePhaseNames,
    loading,
    phaseOrder,
    phaseOrderNames,
    fetchAllDocuments: handleRefreshDocuments
  } = useDocumentFetch(companyId || undefined, true); // Enable templates-only mode

  // Document filtering and counting functions
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = activeTab === "all" || 
        (activeTab === "core" && (doc.type === "Core" || doc.type === "core")) ||
        (activeTab === "standard" && doc.type === "Standard") ||
        (activeTab === "regulatory" && doc.type === "Regulatory") ||
        (activeTab === "technical" && doc.type === "Technical") ||
        (activeTab === "clinical" && doc.type === "Clinical") ||
        (activeTab === "quality" && doc.type === "Quality") ||
        (activeTab === "design" && doc.type === "Design");
      
      return matchesSearch && matchesType;
    });
  }, [documents, searchTerm, activeTab]);

  const countByType = useCallback((type: string) => {
    if (type === "all") return documents.length;
    if (type === "Core") return documents.filter(doc => doc.type === "Core" || doc.type === "core").length;
    return documents.filter(doc => doc.type.toLowerCase() === type.toLowerCase()).length;
  }, [documents]);

  return {
    documents,
    setDocuments,
    availablePhases,
    availablePhaseNames,
    loading,
    phaseOrder,
    phaseOrderNames,
    showAddForm,
    setShowAddForm,
    selectedDocument,
    setSelectedDocument,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    handleRefreshDocuments,
    countByType,
    filteredDocuments,
    companyId
  };
}
