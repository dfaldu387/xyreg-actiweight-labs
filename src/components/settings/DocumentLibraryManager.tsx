
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRefactoredPhases, usePhaseDocuments } from '@/hooks/useRefactoredPhases';
import { RefactoredPhaseService, type PhaseDocumentTemplate } from '@/services/refactoredPhaseService';
import { DocumentTemplateFormDialog } from './DocumentTemplateFormDialog';

interface DocumentLibraryManagerProps {
  companyId: string;
  selectedPhaseId?: string;
}

export function DocumentLibraryManager({ companyId, selectedPhaseId }: DocumentLibraryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<PhaseDocumentTemplate | null>(null);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);

  const { phases } = useRefactoredPhases(companyId);
  const { 
    documents, 
    loading: documentsLoading, 
    addDocument, 
    refreshDocuments 
  } = usePhaseDocuments(selectedPhaseId);

  const filteredDocuments = React.useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tech_applicability.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchTerm, typeFilter, statusFilter]);

  const handleCreateDocument = async (data: Partial<PhaseDocumentTemplate>) => {
    if (!selectedPhaseId) return false;
    const success = await addDocument(data);
    return success;
  };

  const handleEditDocument = async (data: Partial<PhaseDocumentTemplate>) => {
    if (!editingDocument) return false;
    const success = await RefactoredPhaseService.updateDocumentTemplate(editingDocument.id, data);
    if (success) {
      setEditingDocument(null);
      refreshDocuments();
    }
    return success;
  };

  const handleDeleteDocument = async (documentId: string) => {
    setIsDeletingDocument(true);
    try {
      const success = await RefactoredPhaseService.deleteDocumentTemplate(documentId);
      if (success) {
        refreshDocuments();
      }
    } finally {
      setIsDeletingDocument(false);
    }
  };

  const selectedPhase = phases.find(p => p.id === selectedPhaseId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>
            {selectedPhase 
              ? `Manage document templates for "${selectedPhase.name}"`
              : 'Select a phase to view and manage its document templates'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedPhase ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Please select a phase from the lifecycle structure to view its document templates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-1 gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Regulatory">Regulatory</SelectItem>
                      <SelectItem value="Clinical">Clinical</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Quality">Quality</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Not Required">Not Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setShowDocumentDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>

              {/* Document List */}
              {documentsLoading ? (
                <div className="text-center py-4">Loading documents...</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                      ? 'No documents match your filters.'
                      : 'No document templates found for this phase.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredDocuments.map((document) => (
                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{document.name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{document.document_type}</Badge>
                              <Badge 
                                variant={
                                  document.status === 'Completed' ? 'default' :
                                  document.status === 'In Progress' ? 'secondary' :
                                  document.status === 'Not Required' ? 'destructive' :
                                  'outline'
                                }
                              >
                                {document.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {document.tech_applicability}
                              </span>
                            </div>
                            {document.markets.length > 0 && (
                              <div className="mt-2">
                                <span className="text-sm text-muted-foreground">Markets: </span>
                                {document.markets.map((market) => (
                                  <Badge key={market} variant="secondary" className="mr-1">
                                    {market}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingDocument(document);
                                setShowDocumentDialog(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Document Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{document.name}"? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteDocument(document.id)}
                                    disabled={isDeletingDocument}
                                  >
                                    {isDeletingDocument ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Form Dialog */}
      <DocumentTemplateFormDialog
        open={showDocumentDialog}
        onOpenChange={(open) => {
          setShowDocumentDialog(open);
          if (!open) setEditingDocument(null);
        }}
        onSubmit={editingDocument ? handleEditDocument : handleCreateDocument}
        title={editingDocument ? "Edit Document Template" : "Create Document Template"}
        defaultValues={editingDocument}
      />
    </div>
  );
}
