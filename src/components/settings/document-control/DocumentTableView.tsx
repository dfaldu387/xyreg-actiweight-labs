import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, Table, Download, Upload } from 'lucide-react';
import { EnhancedEditableTable } from './EnhancedEditableTable';
import { GoogleSheetsIntegration } from './GoogleSheetsIntegration';
import { DocumentItem } from '@/types/client';
import { DocumentTechApplicability } from '@/types/documentTypes';
import { toast } from 'sonner';

interface DocumentTableViewProps {
  companyId: string;
  documents: DocumentItem[];
  onDocumentUpdated: () => void;
  onAddDocument?: () => void;
  title?: string;
  subtitle?: string;
}

export function DocumentTableView({
  companyId,
  documents,
  onDocumentUpdated,
  onAddDocument,
  title = "Document Table View",
  subtitle = "View and edit documents in a table format"
}: DocumentTableViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [techFilter, setTechFilter] = useState('all');
  const [googleSheetsOpen, setGoogleSheetsOpen] = useState(false);
  const [googleSheetsMode, setGoogleSheetsMode] = useState<'export' | 'import'>('export');

  const documentTypes = ['all', 'Standard', 'Regulatory', 'Technical', 'Clinical', 'Quality', 'Design', 'SOP'];
  const techOptions = ['all', 'All device types', 'Software devices', 'Hardware devices', 'Combination devices', 'Implantable devices'];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesTech = techFilter === 'all' || doc.techApplicability === techFilter;
    
    return matchesSearch && matchesType && matchesTech;
  });

  const handleDocumentUpdate = async (document: DocumentItem) => {
    try {
      // TODO: Implement actual document update API call
      console.log('Updating document:', document);
      onDocumentUpdated();
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      // TODO: Implement actual document delete API call
      console.log('Deleting document:', documentId);
      onDocumentUpdated();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  const handleBulkUpdate = async (updates: Partial<DocumentItem>, selectedIds: string[]) => {
    try {
      // TODO: Implement actual bulk update API call
      console.log('Bulk updating documents:', updates, selectedIds);
      onDocumentUpdated();
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  };

  const handleGoogleSheetsExport = async () => {
    setGoogleSheetsMode('export');
    setGoogleSheetsOpen(true);
  };

  const handleGoogleSheetsImportTrigger = () => {
    setGoogleSheetsMode('import');
    setGoogleSheetsOpen(true);
  };

  const handleGoogleSheetsImport = async (importedDocuments: DocumentItem[]) => {
    try {
      // TODO: Implement actual import API call
      console.log('Importing documents from Google Sheets:', importedDocuments);
      onDocumentUpdated();
    } catch (error) {
      console.error('Error importing from Google Sheets:', error);
      throw error;
    }
  };

  const getCountByType = (type: string) => {
    if (type === 'all') return documents.length;
    return documents.filter(doc => doc.type === type).length;
  };

  const getCountByTech = (tech: string) => {
    if (tech === 'all') return documents.length;
    return documents.filter(doc => doc.techApplicability === tech).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                {title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {subtitle} - Click on any cell to edit inline, use bulk operations for multiple documents, or integrate with Google Sheets for collaborative editing.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGoogleSheetsExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Google Sheets
              </Button>
              {onAddDocument && (
                <Button onClick={onAddDocument} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Manually
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type} ({getCountByType(type)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tech Applicability Filter */}
            <Select value={techFilter} onValueChange={setTechFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by technology" />
              </SelectTrigger>
              <SelectContent>
                {techOptions.map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech === 'all' ? 'All Technologies' : tech} ({getCountByTech(tech)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 mt-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {documents.length} Total Documents
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {documents.filter(doc => doc.phases && doc.phases.length > 0).length} Assigned
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {documents.filter(doc => !doc.phases || doc.phases.length === 0).length} Unassigned
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Editable Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          <p className="text-sm text-muted-foreground">
            All fields are editable inline. Click on any cell to edit. Use horizontal scroll to see all columns.
          </p>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents found matching your criteria</p>
            </div>
          ) : (
            <EnhancedEditableTable
              documents={filteredDocuments}
              onDocumentUpdate={handleDocumentUpdate}
              onDocumentDelete={handleDocumentDelete}
              onBulkUpdate={handleBulkUpdate}
              onGoogleSheetsExport={handleGoogleSheetsExport}
              onGoogleSheetsImport={handleGoogleSheetsImport}
              onGoogleSheetsImportTrigger={handleGoogleSheetsImportTrigger}
              availablePhases={[]} // Will be populated based on company phases
              companyId={companyId}
            />
          )}
        </CardContent>
      </Card>

      {/* Google Sheets Integration Dialog */}
      <GoogleSheetsIntegration
        open={googleSheetsOpen}
        onOpenChange={setGoogleSheetsOpen}
        documents={filteredDocuments}
        onImportComplete={handleGoogleSheetsImport}
        mode={googleSheetsMode}
      />
    </div>
  );
}
