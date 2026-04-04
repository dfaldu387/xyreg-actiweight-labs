
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Plus, Search, Download, Upload } from "lucide-react";

interface DocumentHeaderProps {
  countByType: {
    all: number;
    standard: number;
    regulatory: number;
    technical: number;
    clinical: number;
    quality: number;
    design: number;
    sop: number;
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
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onCsvExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
          <Button onClick={onCsvImport} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload CSV
          </Button>
          <Button onClick={handleAddButtonClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
          <Button
            onClick={handleSyncDocumentMatrix}
            variant="outline"
            disabled={syncingDocuments}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncingDocuments ? 'animate-spin' : ''}`} />
            {syncingDocuments ? 'Syncing...' : 'Sync'}
          </Button>
        </div>
      </div>
      
      <TabsList className="grid w-full grid-cols-8">
        <TabsTrigger 
          value="all" 
          onClick={() => setActiveTab("all")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          All ({countByType.all})
        </TabsTrigger>
        <TabsTrigger 
          value="standard" 
          onClick={() => setActiveTab("standard")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Standard ({countByType.standard})
        </TabsTrigger>
        <TabsTrigger 
          value="regulatory" 
          onClick={() => setActiveTab("regulatory")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Regulatory ({countByType.regulatory})
        </TabsTrigger>
        <TabsTrigger 
          value="technical" 
          onClick={() => setActiveTab("technical")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Technical ({countByType.technical})
        </TabsTrigger>
        <TabsTrigger 
          value="clinical" 
          onClick={() => setActiveTab("clinical")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Clinical ({countByType.clinical})
        </TabsTrigger>
        <TabsTrigger 
          value="quality" 
          onClick={() => setActiveTab("quality")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Quality ({countByType.quality})
        </TabsTrigger>
        <TabsTrigger 
          value="design" 
          onClick={() => setActiveTab("design")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Design ({countByType.design})
        </TabsTrigger>
        <TabsTrigger 
          value="sop" 
          onClick={() => setActiveTab("sop")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          SOP ({countByType.sop})
        </TabsTrigger>
      </TabsList>
    </div>
  );
}
