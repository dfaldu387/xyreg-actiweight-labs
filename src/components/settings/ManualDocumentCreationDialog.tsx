import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Plus, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { DocumentTemplateImportDialog } from "./DocumentTemplateImportDialog";
import { DocumentImportDialog } from "./DocumentImportDailog";
import Papa from "papaparse";
interface DocumentRow {
  id: string;
  name: string;
  description: string;
  documentType: string;
  techApplicability: string;
  markets: string[];
  classesByMarket: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
  isNew?: boolean;
  isModified?: boolean;
}

interface ManualDocumentCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onDocumentsCreated?: () => void;
}

type SortColumn = 'name' | 'description' | 'documentType' | 'techApplicability';
type SortDirection = 'asc' | 'desc';

export function ManualDocumentCreationDialog({
  open,
  onOpenChange,
  companyId,
  onDocumentsCreated
}: ManualDocumentCreationDialogProps) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<DocumentRow | null>(null);

  React.useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open, companyId]);

  const loadDocuments = async (showRefreshIndicator = true) => {
    if (showRefreshIndicator) {
      setIsLoading(true);
    }

    try {
      console.log('[ManualDocumentCreationDialog] Loading documents for company:', companyId);

      const { data: documents, error } = await supabase
        .from('company_document_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_user_removed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ManualDocumentCreationDialog] Error loading documents:', error);
        throw error;
      }

      const formattedDocuments: DocumentRow[] = (documents || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        description: doc.description || '',
        documentType: doc.document_type || 'Standard',
        techApplicability: doc.tech_applicability || 'All device types',
        markets: Array.isArray(doc.markets) ? doc.markets.filter(m => typeof m === 'string') as string[] : [],
        classesByMarket: typeof doc.classes_by_market === 'object' && doc.classes_by_market !== null
          ? doc.classes_by_market as Record<string, string[]>
          : {},
        createdAt: doc.created_at || new Date().toISOString(),
        updatedAt: doc.updated_at || new Date().toISOString(),
        isNew: false,
        isModified: false
      }));

      console.log('[ManualDocumentCreationDialog] Loaded documents:', formattedDocuments.length);
      setDocuments(formattedDocuments);
    } catch (error) {
      console.error('[ManualDocumentCreationDialog] Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.techApplicability.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [documents, searchTerm, sortColumn, sortDirection]);

  const updateDocument = (id: string, field: keyof DocumentRow, value: string | string[] | Record<string, string[]>) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          [field]: value,
          isModified: !doc.isNew ? true : doc.isModified
        };
      }
      return doc;
    }));
  };

  const duplicateDocument = (sourceDoc: DocumentRow) => {
    const newDoc: DocumentRow = {
      id: `new-${Date.now()}-${Math.random()}`,
      name: `${sourceDoc.name} (Copy)`,
      description: sourceDoc.description,
      documentType: sourceDoc.documentType,
      techApplicability: sourceDoc.techApplicability,
      markets: [...sourceDoc.markets],
      classesByMarket: { ...sourceDoc.classesByMarket },
      isNew: true,
      isModified: false
    };

    setDocuments(prev => [...prev, newDoc]);
    toast.success('Document duplicated');
  };

  const addNewDocument = () => {
    const newDoc: DocumentRow = {
      id: `new-${Date.now()}-${Math.random()}`,
      name: 'New Document',
      description: '',
      documentType: 'Standard',
      techApplicability: 'All device types',
      markets: [],
      classesByMarket: {},
      isNew: true,
      isModified: false
    };

    setDocuments(prev => [...prev, newDoc]);
  };

  const deleteDocument = async (doc: DocumentRow) => {
    if (doc.isNew) {
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast.success('Document removed');
    } else {
      setDeletingDocument(doc);
    }
  };

  const confirmDelete = async () => {
    if (!deletingDocument) return;

    try {
      const { error } = await supabase
        .from('company_document_templates')
        .update({ is_user_removed: true })
        .eq('id', deletingDocument.id);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== deletingDocument.id));
      toast.success('Document removed');
      loadDocuments();
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Failed to remove document');
    } finally {
      setDeletingDocument(null);
    }
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const newDocuments = documents.filter(doc => doc.isNew);
      const modifiedDocuments = documents.filter(doc => doc.isModified && !doc.isNew);

      // Create new documents
      for (const doc of newDocuments) {
        const { error } = await supabase
          .from('company_document_templates')
          .insert({
            company_id: companyId,
            name: doc.name,
            description: doc.description || null,
            document_type: doc.documentType,
            tech_applicability: doc.techApplicability,
            markets: doc.markets,
            classes_by_market: doc.classesByMarket
          });

        if (error) throw error;
      }

      // Update modified documents
      for (const doc of modifiedDocuments) {
        const { error } = await supabase
          .from('company_document_templates')
          .update({
            name: doc.name,
            description: doc.description || null,
            document_type: doc.documentType,
            tech_applicability: doc.techApplicability,
            markets: doc.markets,
            classes_by_market: doc.classesByMarket
          })
          .eq('id', doc.id);

        if (error) throw error;
      }

      toast.success(`Saved ${newDocuments.length + modifiedDocuments.length} changes`);
      onDocumentsCreated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving documents:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const hasChanges = documents.some(doc => doc.isNew || doc.isModified);

  const documentTypes = [
    'Standard',
    'Regulatory',
    'Technical',
    'Clinical',
    'Quality',
    'Design',
    'Manufacturing',
    'Testing',
    'Labeling',
    'Surveillance'
  ];

  const techApplicabilityOptions = [
    'All device types',
    'Class I devices only',
    'Class II devices only',
    'Class III devices only',
    'Software devices only',
    'Hardware devices only',
    'Active implantable devices',
    'High-risk devices',
    'Sterile devices',
    'Electrical devices',
    'Packaged devices'
  ];

  const availableMarkets = [
    { code: 'US', name: 'United States' },
    { code: 'EU', name: 'European Union' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IN', name: 'India' },
    { code: 'CN', name: 'China' }
  ];

  const deviceClassesByMarket = {
    'US': ['I', 'II', 'III'],
    'EU': ['I', 'IIa', 'IIb', 'III'],
    'CA': ['I', 'II', 'III', 'IV'],
    'AU': ['I', 'IIa', 'IIb', 'III'],
    'JP': ['I', 'II', 'III', 'IV'],
    'UK': ['I', 'IIa', 'IIb', 'III'],
    'BR': ['I', 'II', 'III', 'IV'],
    'IN': ['A', 'B', 'C', 'D'],
    'CN': ['I', 'II', 'III']
  };

  const formatMarkets = (markets: string[]) => {
    if (markets.length === 0) return 'None selected';
    if (markets.length <= 3) return markets.join(', ');
    return `${markets.slice(0, 3).join(', ')} +${markets.length - 3} more`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  const sampleCSVData = [
    {
      "Document Name": "Raw Materials List",
      "Document Type": "Standard",
      "Tech Applicability": "All device types",
      "Description": "Comprehensive list of all raw materials, components, and assemblies required to produce the device",
    },
    {
      "Document Name": "Design Controls List",
      "Document Type": "Standard",
      "Tech Applicability": "All device types",
      "Description": "Comprehensive list of all design controls required to produce the device",
    },
  ];

  const downloadSampleCSV = () => {
    try {
      // Convert sample data to CSV string
      const csvString = Papa.unparse(sampleCSVData);

      // Create blob and download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      // Create download link
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'documents-import-sample.csv');
      link.style.visibility = 'hidden';

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      toast.success("Sample CSV file downloaded successfully!");
    } catch (error) {
      console.error('Error downloading sample CSV:', error);
      toast.error("Failed to download sample CSV file");
    }
  };
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Library Manager</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="secondary" className="text-sm">
                {documents.length} documents
              </Badge>
              <Button onClick={downloadSampleCSV} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>
              <Button onClick={() => setShowImportDialog(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Import Document
              </Button>
              <Button onClick={addNewDocument} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
              {hasChanges && (
                <Button
                  onClick={saveChanges}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 w-48">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('name')}
                            className="h-auto p-0 font-medium flex items-center gap-2"
                          >
                            Document Name
                            {getSortIcon('name')}
                          </Button>
                        </th>
                        <th className="text-left p-3 w-64">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('description')}
                            className="h-auto p-0 font-medium flex items-center gap-2"
                          >
                            Description
                            {getSortIcon('description')}
                          </Button>
                        </th>
                        <th className="text-left p-3 w-32">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('documentType')}
                            className="h-auto p-0 font-medium flex items-center gap-2"
                          >
                            Type
                            {getSortIcon('documentType')}
                          </Button>
                        </th>
                        <th className="text-left p-3 w-40">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('techApplicability')}
                            className="h-auto p-0 font-medium flex items-center gap-2"
                          >
                            Tech Applicability
                            {getSortIcon('techApplicability')}
                          </Button>
                        </th>
                        <th className="text-left p-3 w-32">Markets</th>
                        <th className="text-left p-3 w-24">Created</th>
                        <th className="text-left p-3 w-24">Updated</th>
                        <th className="text-left p-3 w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAndFilteredDocuments.map((doc) => (
                        <tr
                          key={doc.id}
                          className={`border-b ${doc.isNew
                            ? 'bg-blue-50'
                            : doc.isModified
                              ? 'bg-yellow-50'
                              : 'hover:bg-gray-50'
                            }`}
                        >
                          <td className="p-3">
                            <Input
                              value={doc.name}
                              onChange={(e) => updateDocument(doc.id, 'name', e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="p-3">
                            <Textarea
                              value={doc.description}
                              onChange={(e) => updateDocument(doc.id, 'description', e.target.value)}
                              className="w-full min-h-[60px] resize-none"
                              placeholder="Document description..."
                            />
                          </td>
                          <td className="p-3">
                            <Select
                              value={doc.documentType}
                              onValueChange={(value) => updateDocument(doc.id, 'documentType', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {documentTypes.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Select
                              value={doc.techApplicability}
                              onValueChange={(value) => updateDocument(doc.id, 'techApplicability', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {techApplicabilityOptions.map(option => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              {formatMarkets(doc.markets)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs text-muted-foreground">
                              {formatDate(doc.createdAt)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs text-muted-foreground">
                              {formatDate(doc.updatedAt)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => duplicateDocument(doc)}
                                title="Duplicate document"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteDocument(doc)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                title="Delete document"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {sortedAndFilteredDocuments.length === 0 && (
                  <div className="text-center p-8 text-muted-foreground">
                    No documents found matching your search criteria.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <DocumentImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} companyId={companyId} onImportComplete={() => {
        loadDocuments();
        setShowImportDialog(false);
      }} />

      <AlertDialog open={Boolean(deletingDocument)} onOpenChange={() => setDeletingDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the document "{deletingDocument?.name}"?.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
