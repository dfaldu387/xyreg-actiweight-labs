
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Search, Download, Upload, Plus, RefreshCw, ChevronLeft } from 'lucide-react';
import { useCompanyDocumentTemplates } from '@/hooks/useCompanyDocumentTemplates';

interface EnhancedDocumentMatrixProps {
  companyId: string;
}

const documentTypes = [
  { id: 'all', name: 'All', color: 'default' },
  { id: 'standard', name: 'Standard', color: 'blue' },
  { id: 'regulatory', name: 'Regulatory', color: 'green' },
  { id: 'technical', name: 'Technical', color: 'purple' },
  { id: 'clinical', name: 'Clinical', color: 'orange' },
  { id: 'quality', name: 'Quality', color: 'red' },
  { id: 'design', name: 'Design', color: 'yellow' },
  { id: 'sop', name: 'SOP', color: 'indigo' }
];

export function EnhancedDocumentMatrix({ companyId }: EnhancedDocumentMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [techFilter, setTechFilter] = useState('all');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [libraryVisible, setLibraryVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    isLoading: dataLoading, 
    phases, 
    documentsByPhase, 
    getDocumentsForPhase,
    addDocumentToPhase 
  } = useCompanyDocumentTemplates(companyId);

  // Get document counts by type
  const getDocumentCounts = () => {
    const counts: Record<string, number> = {};
    let totalCount = 0;

    phases.forEach(phase => {
      const docs = documentsByPhase[phase.id] || [];
      docs.forEach(doc => {
        const docType = doc.document_type?.toLowerCase() || 'standard';
        counts[docType] = (counts[docType] || 0) + 1;
        totalCount++;
      });
    });

    counts.all = totalCount;
    return counts;
  };

  const documentCounts = getDocumentCounts();

  // Filter documents based on active tab and search
  const getFilteredDocuments = (phaseId: string) => {
    const docs = documentsByPhase[phaseId] || [];
    return docs.filter(doc => {
      const typeMatch = activeTab === 'all' || 
        (doc.document_type?.toLowerCase() || 'standard') === activeTab;
      const searchMatch = !searchTerm || 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const techMatch = techFilter === 'all' || 
        (doc.tech_applicability || 'All device types') === techFilter;
      return typeMatch && searchMatch && techMatch;
    });
  };

  // Get all documents for the library view
  const getAllFilteredDocuments = () => {
    const allDocs: any[] = [];
    phases.forEach(phase => {
      const docs = getFilteredDocuments(phase.id);
      docs.forEach(doc => {
        allDocs.push({
          ...doc,
          phaseName: phase.name
        });
      });
    });
    return allDocs;
  };

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const handleSync = () => {
    setIsLoading(true);
    // Simulate sync operation
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage document repository and define which phases documents belong to
        </p>
        
        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>

        {/* Document Type Filter Tabs */}
        <div className="grid grid-cols-7 gap-2 pt-4">
          {documentTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setActiveTab(type.id)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === type.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {type.name} ({documentCounts[type.id] || 0})
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Split Panel Main Content */}
        <div className="flex relative">
          {/* Left Panel - Phases & Documents */}
          <div className={`transition-all duration-300 ${
            libraryVisible ? 'w-3/5' : 'w-full'
          } bg-gray-50 border-r`}>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">Phases & Documents</h3>
                <p className="text-sm text-muted-foreground">
                  {libraryVisible 
                    ? "Organize documents by lifecycle phases. Drag documents from the library to assign them."
                    : "Document library is hidden - click the toggle on the right to show it"
                  }
                </p>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {phases.map(phase => {
                    const filteredDocs = getFilteredDocuments(phase.id);
                    const isExpanded = expandedPhases.has(phase.id);
                    
                    return (
                      <div key={phase.id} className="border rounded-lg bg-white">
                        <Collapsible>
                          <CollapsibleTrigger 
                            onClick={() => togglePhaseExpansion(phase.id)}
                            className="w-full"
                          >
                            <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="font-medium text-left">{phase.name}</span>
                              </div>
                              <Badge variant="outline">
                                {filteredDocs.length}
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 border-t bg-gray-50/50">
                              {filteredDocs.length > 0 ? (
                                <div className="mt-3 space-y-2">
                                  {filteredDocs.map(doc => (
                                    <div 
                                      key={doc.id}
                                      className="p-3 bg-white border rounded-md"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{doc.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {doc.document_type || 'Standard'}
                                        </Badge>
                                      </div>
                                      {doc.tech_applicability && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {doc.tech_applicability}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground mt-3 text-center py-4">
                                  No documents in this phase
                                </p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setLibraryVisible(!libraryVisible)}
            className="absolute top-1/2 -translate-y-1/2 right-0 z-10 w-6 h-12 bg-border hover:bg-border/80 transition-colors flex items-center justify-center border-y border-r rounded-r-md"
            style={{ right: libraryVisible ? '40%' : '0' }}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${
              libraryVisible ? '' : 'rotate-180'
            }`} />
          </button>

          {/* Right Panel - Document Library */}
          {libraryVisible && (
            <div className="w-2/5 bg-white">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">Document Library</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse and search available documents
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search library..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={techFilter} onValueChange={setTechFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Tech Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tech Types</SelectItem>
                      <SelectItem value="All device types">All device types</SelectItem>
                      <SelectItem value="Software devices">Software devices</SelectItem>
                      <SelectItem value="Hardware devices">Hardware devices</SelectItem>
                      <SelectItem value="Combination devices">Combination devices</SelectItem>
                      <SelectItem value="Implantable devices">Implantable devices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {getAllFilteredDocuments().map((doc, index) => (
                      <div 
                        key={`${doc.id}-${index}`}
                        className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{doc.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {doc.document_type || 'Standard'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Phase: {doc.phaseName}</span>
                          {doc.tech_applicability && (
                            <>
                              <span>•</span>
                              <span>{doc.tech_applicability}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-2">
                          <Badge 
                            variant={doc.status === 'Completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {doc.status || 'Not Started'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {getAllFilteredDocuments().length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No documents match your filters
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
