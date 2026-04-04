
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, RefreshCw, Download, Upload, RotateCcw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DocumentHeaderProps {
  countByType: {
    all: number;
    standard: number;
    regulatory: number;
    technical: number;
    clinical: number;
    quality: number;
    design: number;
  };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleAddButtonClick: () => void;
  handleSyncDocumentMatrix: () => void;
  syncingDocuments: boolean;
  availablePhases: string[];
  phaseOrder: string[];
  onDocumentRefresh: () => void;
  onCsvExport: () => void;
  onCsvImport: () => void;
}

export function DocumentHeader({
  countByType,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  handleAddButtonClick,
  handleSyncDocumentMatrix,
  syncingDocuments,
  onDocumentRefresh,
  onCsvExport,
  onCsvImport
}: DocumentHeaderProps) {
  const tabs = [
    { id: "all", label: "All Documents", count: countByType.all },
    { id: "standard", label: "Standard", count: countByType.standard },
    { id: "regulatory", label: "Regulatory", count: countByType.regulatory },
    { id: "technical", label: "Technical", count: countByType.technical },
    { id: "clinical", label: "Clinical", count: countByType.clinical },
    { id: "quality", label: "Quality", count: countByType.quality },
    { id: "design", label: "Design", count: countByType.design },
  ];

  return (
    <div className="space-y-4">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Repository</h2>
          <p className="text-sm text-muted-foreground">
            Manage document templates with numbered phase assignment
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={onDocumentRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={onCsvExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <Button onClick={onCsvImport} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          
          <Button
            onClick={handleSyncDocumentMatrix}
            disabled={syncingDocuments}
            variant="outline"
            size="sm"
          >
            {syncingDocuments ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Sync Templates
          </Button>
          
          <Button onClick={handleAddButtonClick} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Document type filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <span>{tab.label}</span>
            <Badge variant="secondary" className="text-xs">
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
