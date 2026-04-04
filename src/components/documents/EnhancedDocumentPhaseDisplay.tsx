
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Filter, ChevronDown, ChevronRight, Upload, Calendar } from "lucide-react";
import { convertToCleanPhases, type CleanPhase } from "@/utils/phaseNumbering";
import { formatDate } from "@/lib/date";

interface Document {
  id: string;
  name: string;
  status: string;
  document_type: string;
  phase_id?: string;
  phase_name?: string;
  uploaded_at?: string;
  file_name?: string;
  company_name?: string;
  product_name?: string;
}

interface Phase {
  id: string;
  name: string;
  position: number;
}

interface EnhancedDocumentPhaseDisplayProps {
  documents: Document[];
  phases: Phase[];
  companyName?: string;
  onDocumentClick?: (document: Document) => void;
  onUploadClick?: (phaseId: string) => void;
  showCompanyInfo?: boolean;
}

export function EnhancedDocumentPhaseDisplay({
  documents,
  phases,
  companyName,
  onDocumentClick,
  onUploadClick,
  showCompanyInfo = false
}: EnhancedDocumentPhaseDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'phase-grouped' | 'flat-list'>('phase-grouped');

  // Convert phases to clean phases
  const cleanPhases = useMemo(() => {
    return convertToCleanPhases(phases);
  }, [phases]);

  // Group documents by phase
  const documentsByPhase = useMemo(() => {
    const grouped = new Map<string, Document[]>();
    const unassigned: Document[] = [];

    documents.forEach(doc => {
      if (doc.phase_id) {
        if (!grouped.has(doc.phase_id)) {
          grouped.set(doc.phase_id, []);
        }
        grouped.get(doc.phase_id)!.push(doc);
      } else {
        unassigned.push(doc);
      }
    });

    return { grouped, unassigned };
  }, [documents]);

  // Filter documents based on search and status
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = searchTerm === '' || 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.phase_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchTerm, statusFilter]);

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const handleViewModeChange = (value: string) => {
    if (value === 'phase-grouped' || value === 'flat-list') {
      setViewMode(value);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not started': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'not required': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'clinical': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'regulatory': return 'bg-red-100 text-red-800 border-red-200';
      case 'technical': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'quality': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalDocuments = documents.length;
  const uploadedDocuments = documents.filter(doc => doc.uploaded_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Enhanced Document Display
            {companyName && (
              <Badge variant="outline" className="ml-2">
                {companyName}
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalDocuments} total documents • {uploadedDocuments} uploaded • {cleanPhases.length} phases
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents, phases, or files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="Not Required">Not Required</SelectItem>
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={handleViewModeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phase-grouped">By Phase</SelectItem>
                <SelectItem value="flat-list">Flat List</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Document Display */}
      <Tabs value={viewMode} onValueChange={handleViewModeChange}>
        <TabsContent value="phase-grouped">
          <div className="space-y-4">
            {cleanPhases.map((phase) => {
              const phaseDocuments = documentsByPhase.grouped.get(phase.id) || [];
              const filteredPhaseDocuments = phaseDocuments.filter(doc => 
                filteredDocuments.includes(doc)
              );
              const isExpanded = expandedPhases.has(phase.id);

              return (
                <Card key={phase.id} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => togglePhaseExpansion(phase.id)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-semibold text-lg">
                            {phase.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {filteredPhaseDocuments.length} documents
                        </Badge>
                        {onUploadClick && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUploadClick(phase.id);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Upload
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      {filteredPhaseDocuments.length > 0 ? (
                        <div className="space-y-2">
                          {filteredPhaseDocuments.map((doc) => (
                            <div 
                              key={doc.id}
                              className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                onDocumentClick ? 'hover:shadow-sm' : ''
                              }`}
                              onClick={() => onDocumentClick?.(doc)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium">{doc.name}</h5>
                                  {doc.file_name && doc.file_name !== doc.name && (
                                    <p className="text-sm text-muted-foreground">
                                      File: {doc.file_name}
                                    </p>
                                  )}
                                  {doc.uploaded_at && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <Calendar className="h-3 w-3" />
                                      Uploaded {formatDate(new Date(doc.uploaded_at))}
                                    </div>
                                  )}
                                  {showCompanyInfo && doc.company_name && (
                                    <p className="text-xs text-muted-foreground">
                                      Company: {doc.company_name}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getDocumentTypeColor(doc.document_type)}>
                                    {doc.document_type}
                                  </Badge>
                                  <Badge className={getStatusColor(doc.status)}>
                                    {doc.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No documents found for this phase</p>
                          {searchTerm && (
                            <p className="text-sm">Try adjusting your search terms</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {/* Unassigned Documents */}
            {documentsByPhase.unassigned.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Unassigned Documents
                    </div>
                    <Badge variant="outline">
                      {documentsByPhase.unassigned.length} documents
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {documentsByPhase.unassigned
                      .filter(doc => filteredDocuments.includes(doc))
                      .map((doc) => (
                        <div 
                          key={doc.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => onDocumentClick?.(doc)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{doc.name}</h5>
                              {doc.file_name && (
                                <p className="text-sm text-muted-foreground">
                                  File: {doc.file_name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getDocumentTypeColor(doc.document_type)}>
                                {doc.document_type}
                              </Badge>
                              <Badge className={getStatusColor(doc.status)}>
                                {doc.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="flat-list">
          <Card>
            <CardContent className="p-0">
              {filteredDocuments.length > 0 ? (
                <div className="divide-y">
                  {filteredDocuments.map((doc) => {
                    const phase = cleanPhases.find(p => p.id === doc.phase_id);
                    
                    return (
                      <div 
                        key={doc.id}
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => onDocumentClick?.(doc)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{doc.name}</h5>
                            {phase && (
                              <p className="text-sm text-muted-foreground">
                                Phase: {phase.name}
                              </p>
                            )}
                            {doc.file_name && doc.file_name !== doc.name && (
                              <p className="text-sm text-muted-foreground">
                                File: {doc.file_name}
                              </p>
                            )}
                            {doc.uploaded_at && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                Uploaded {formatDate(new Date(doc.uploaded_at))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getDocumentTypeColor(doc.document_type)}>
                              {doc.document_type}
                            </Badge>
                            <Badge className={getStatusColor(doc.status)}>
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents found</p>
                  {searchTerm && (
                    <p className="text-sm">Try adjusting your search terms</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
