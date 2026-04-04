import React, { useState, useCallback } from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DocumentItem } from '@/types/client';
import { DocumentTechApplicability } from '@/types/documentTypes';
import { Check, X, Edit2, Trash2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedEditableTableProps {
  documents: DocumentItem[];
  onDocumentUpdate: (document: DocumentItem) => Promise<void>;
  onDocumentDelete: (documentId: string) => Promise<void>;
  onBulkUpdate: (updates: Partial<DocumentItem>, selectedIds: string[]) => Promise<void>;
  onGoogleSheetsExport: () => Promise<void>;
  onGoogleSheetsImport: (data: any[]) => Promise<void>;
  onGoogleSheetsImportTrigger?: () => void;
  availablePhases: string[];
  companyId: string;
}

interface EditingState {
  documentId: string;
  field: string;
  value: any;
}

const documentTypes = ['Standard', 'Regulatory', 'Technical', 'Clinical', 'Quality', 'Design', 'SOP'];
const techOptions: DocumentTechApplicability[] = ['All device types', 'Software devices', 'Hardware devices', 'Combination devices', 'Implantable devices'];

export function EnhancedEditableTable({
  documents,
  onDocumentUpdate,
  onDocumentDelete,
  onBulkUpdate,
  onGoogleSheetsExport,
  onGoogleSheetsImport,
  onGoogleSheetsImportTrigger,
  availablePhases,
  companyId
}: EnhancedEditableTableProps) {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdateField, setBulkUpdateField] = useState<string>('');
  const [bulkUpdateValue, setBulkUpdateValue] = useState<string>('');

  const startEdit = useCallback((documentId: string, field: string, currentValue: any) => {
    setEditing({ documentId, field, value: currentValue });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editing) return;

    const document = documents.find(doc => doc.id === editing.documentId);
    if (!document) return;

    const updatedDocument = {
      ...document,
      [editing.field]: editing.value
    };

    try {
      await onDocumentUpdate(updatedDocument);
      setEditing(null);
      toast.success('Document updated successfully');
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    }
  }, [editing, documents, onDocumentUpdate]);

  const handleBulkUpdate = useCallback(async () => {
    if (selectedIds.size === 0 || !bulkUpdateField || !bulkUpdateValue) {
      toast.error('Please select documents and specify update details');
      return;
    }

    try {
      await onBulkUpdate({ [bulkUpdateField]: bulkUpdateValue }, Array.from(selectedIds));
      setSelectedIds(new Set());
      setBulkUpdateField('');
      setBulkUpdateValue('');
      toast.success(`Updated ${selectedIds.size} documents`);
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast.error('Failed to update documents');
    }
  }, [selectedIds, bulkUpdateField, bulkUpdateValue, onBulkUpdate]);

  const toggleSelection = useCallback((documentId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedIds(newSelected);
  }, [selectedIds]);

  const selectAll = useCallback(() => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(doc => doc.id)));
    }
  }, [selectedIds.size, documents]);

  const handleGoogleSheetsImportClick = () => {
    if (onGoogleSheetsImportTrigger) {
      onGoogleSheetsImportTrigger();
    } else {
      // Fallback - try to call the import function directly
      onGoogleSheetsImport([]);
    }
  };

  const renderEditableCell = useCallback((document: DocumentItem, field: string, value: any) => {
    const isEditing = editing?.documentId === document.id && editing?.field === field;

    if (isEditing) {
      if (field === 'type') {
        return (
          <div className="flex items-center gap-2">
            <Select value={editing.value} onValueChange={(val) => setEditing(prev => prev ? { ...prev, value: val } : null)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
          </div>
        );
      }

      if (field === 'techApplicability') {
        return (
          <div className="flex items-center gap-2">
            <Select value={editing.value} onValueChange={(val) => setEditing(prev => prev ? { ...prev, value: val } : null)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {techOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
          </div>
        );
      }

      if (field === 'description') {
        return (
          <div className="flex items-center gap-2">
            <Textarea
              value={editing.value || ''}
              onChange={(e) => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
              className="w-48 h-20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
            />
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        );
      }

      if (field === 'position') {
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={editing.value || 0}
              onChange={(e) => setEditing(prev => prev ? { ...prev, value: parseInt(e.target.value) || 0 } : null)}
              className="w-24"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
            />
            <Button size="sm" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <Input
            value={editing.value || ''}
            onChange={(e) => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
            className="w-40"
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            autoFocus
          />
          <Button size="sm" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
        </div>
      );
    }

    // Display mode
    const handleClick = () => startEdit(document.id, field, value);
    
    if (field === 'type') {
      return (
        <div className="cursor-pointer hover:bg-gray-50 p-1 rounded flex items-center gap-2" onClick={handleClick}>
          <Badge className="bg-blue-100 text-blue-800">{value}</Badge>
          <Edit2 className="h-3 w-3 opacity-50" />
        </div>
      );
    }

    if (field === 'phases') {
      return (
        <div className="flex flex-wrap gap-1">
          {(value || []).map((phase: string) => (
            <Badge key={phase} variant="outline" className="text-xs">{phase}</Badge>
          ))}
        </div>
      );
    }

    if (field === 'description') {
      return (
        <div className="cursor-pointer hover:bg-gray-50 p-1 rounded flex items-center gap-2" onClick={handleClick}>
          <span className="text-sm max-w-48 truncate">{value || 'Click to add description'}</span>
          <Edit2 className="h-3 w-3 opacity-50" />
        </div>
      );
    }

    if (field === 'documentSource') {
      return (
        <Badge variant="outline" className="text-xs">
          {value || 'Company Template'}
        </Badge>
      );
    }

    return (
      <div className="cursor-pointer hover:bg-gray-50 p-1 rounded flex items-center gap-2" onClick={handleClick}>
        <span className="text-sm">{value || 'Click to edit'}</span>
        <Edit2 className="h-3 w-3 opacity-50" />
      </div>
    );
  }, [editing, startEdit, saveEdit, cancelEdit]);

  return (
    <div className="space-y-4">
      {/* Bulk Operations Bar */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === documents.length && documents.length > 0}
            onCheckedChange={selectAll}
          />
          <span className="text-sm">Select All ({selectedIds.size} selected)</span>
        </div>

        {selectedIds.size > 0 && (
          <>
            <Select value={bulkUpdateField} onValueChange={setBulkUpdateField}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Field to update" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="type">Document Type</SelectItem>
                <SelectItem value="techApplicability">Tech Applicability</SelectItem>
                <SelectItem value="description">Description</SelectItem>
                <SelectItem value="position">Position</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="New value"
              value={bulkUpdateValue}
              onChange={(e) => setBulkUpdateValue(e.target.value)}
              className="w-40"
            />

            <Button onClick={handleBulkUpdate} size="sm">
              Update Selected
            </Button>
          </>
        )}

        <div className="flex gap-2 ml-auto">
          <Button onClick={onGoogleSheetsExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export to Google Sheets
          </Button>
          <Button onClick={handleGoogleSheetsImportClick} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import from Google Sheets
          </Button>
        </div>
      </div>

      {/* Enhanced Table with horizontal scroll */}
      <div className="overflow-x-auto">
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === documents.length && documents.length > 0}
                  onCheckedChange={selectAll}
                />
              </TableHead>
              <TableHead className="w-48">Document Name</TableHead>
              <TableHead className="w-32">Document Type</TableHead>
              <TableHead className="w-40">Tech Applicability</TableHead>
              <TableHead className="w-60">Description</TableHead>
              <TableHead className="w-40">Phase Name</TableHead>
              <TableHead className="w-60">Phase Description</TableHead>
              <TableHead className="w-40">Category Name</TableHead>
              <TableHead className="w-36">Document Source</TableHead>
              <TableHead className="w-24">Position</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id} className={selectedIds.has(document.id) ? 'bg-blue-50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(document.id)}
                    onCheckedChange={() => toggleSelection(document.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {renderEditableCell(document, 'name', document.name)}
                </TableCell>
                <TableCell>
                  {renderEditableCell(document, 'type', document.type)}
                </TableCell>
                <TableCell>
                  {renderEditableCell(document, 'techApplicability', document.techApplicability)}
                </TableCell>
                <TableCell>
                  {renderEditableCell(document, 'description', document.description)}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{(document as any).phaseName || 'Unassigned'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{(document as any).phaseDescription || 'N/A'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{(document as any).categoryName || 'Uncategorized'}</span>
                </TableCell>
                <TableCell>
                  {renderEditableCell(document, 'documentSource', (document as any).documentSource)}
                </TableCell>
                <TableCell>
                  {renderEditableCell(document, 'position', (document as any).position || 0)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDocumentDelete(document.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {documents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No documents found. Click "Create Manually" to add documents.
        </div>
      )}
    </div>
  );
}
