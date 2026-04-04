
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DocumentItem } from '@/types/client';
import { toast } from 'sonner';
import { Download, Upload, ExternalLink, AlertTriangle } from 'lucide-react';
import { UnifiedCsvImportService } from '@/services/unifiedCsvImportService';
import { Progress } from '@/components/ui/progress';

interface GoogleSheetsIntegrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentItem[];
  onImportComplete: (documents: DocumentItem[]) => Promise<void>;
  mode: 'export' | 'import';
}

export function GoogleSheetsIntegration({
  open,
  onOpenChange,
  documents,
  onImportComplete,
  mode
}: GoogleSheetsIntegrationProps) {
  const [csvData, setCsvData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');

  function generateCSVForExport() {
    const headers = [
      'Document Name',
      'Document Type',
      'Tech Applicability',
      'Description',
      'Phase Name',
      'Phase Description',
      'Category Name',
      'Document Source',
      'Position',
      'ID (DO NOT MODIFY)'
    ];

    const rows = documents.map(doc => [
      `"${doc.name}"`,
      `"${doc.type}"`,
      `"${doc.techApplicability || 'All device types'}"`,
      `"${doc.description || ''}"`,
      `"${(doc as any).phaseName || 'Unassigned'}"`,
      `"${(doc as any).phaseDescription || ''}"`,
      `"${(doc as any).categoryName || 'Uncategorized'}"`,
      `"${(doc as any).documentSource || 'Company Template'}"`,
      `"${(doc as any).position || 0}"`,
      `"${doc.id}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  const handleExport = () => {
    const csvContent = generateCSVForExport();
    
    // Create downloadable CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `document-templates-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Also copy to clipboard for easy pasting into Google Sheets
    navigator.clipboard.writeText(csvContent).then(() => {
      toast.success('CSV data copied to clipboard and downloaded! You can paste it directly into Google Sheets.');
    });

    // Provide instructions for Google Sheets
    toast.info('Open Google Sheets, create a new spreadsheet, and paste the data (Ctrl+V). Then share the link back here for import.');
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error('Please paste the CSV data from Google Sheets');
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);
    setCurrentOperation('Validating CSV data...');
    
    try {
      // Parse and validate CSV data using the enhanced service
      const parsedDocuments = UnifiedCsvImportService.parseCSVData(csvData);
      const validation = UnifiedCsvImportService.validateCSVData(parsedDocuments);
      
      if (!validation.isValid) {
        toast.error(`CSV validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      if (validation.warnings.length > 0) {
        toast.warning(`Validation warnings: ${validation.warnings.join(', ')}`);
      }

      setImportProgress(20);
      setCurrentOperation('Starting enhanced import with authentication management...');
      
      // Get company ID from the current context (you might need to pass this as a prop)
      const companyId = (documents[0] as any)?.companyId || 'current-company-id';
      
      // Use the enhanced import service with progress tracking
      const result = await UnifiedCsvImportService.importDocuments(
        parsedDocuments,
        companyId,
        (processed, total, operation) => {
          const progressPercent = Math.round((processed / total) * 60) + 20; // 20-80% range
          setImportProgress(progressPercent);
          setCurrentOperation(`${operation} (${processed}/${total})`);
        }
      );

      setImportProgress(90);
      setCurrentOperation('Finalizing import...');

      if (result.success) {
        toast.success(`Successfully imported: ${result.documentsCreated} documents created, ${result.documentsSkipped} skipped`);
        
        if (result.authErrors > 0) {
          toast.warning(`${result.authErrors} authentication errors occurred. Some items may need to be retried.`);
        }
        
        // Convert result to DocumentItem format for callback
        const importedDocuments: DocumentItem[] = parsedDocuments.map((doc, index) => ({
          id: `imported-${index}`,
          name: doc.documentName,
          type: doc.documentType,
          techApplicability: doc.techApplicability,
          description: doc.description,
          phases: [],
          markets: [],
          deviceClasses: {},
          version: '1.0',
          lastUpdated: new Date().toISOString(),
          reviewers: [],
          created_at: new Date().toISOString(),
          phaseName: doc.phaseName,
          phaseDescription: doc.phaseDescription,
          categoryName: doc.categoryName,
          documentSource: 'Google Sheets Import',
          position: 0
        } as DocumentItem & {
          phaseName: string;
          phaseDescription: string;
          categoryName: string;
          documentSource: string;
          position: number;
        }));

        await onImportComplete(importedDocuments);
        
        setImportProgress(100);
        setCurrentOperation('Import completed successfully!');
        
        // Auto-close after successful import
        setTimeout(() => {
          onOpenChange(false);
          setCsvData('');
        }, 2000);
        
      } else {
        toast.error(`Import failed: ${result.errors.join(', ')}`);
        
        if (result.authErrors > 0) {
          toast.error('Authentication errors occurred. Please log out and log back in, then try again.');
        }
      }
      
    } catch (error) {
      console.error('Import error:', error);
      
      if (error instanceof Error && error.message.includes('auth')) {
        toast.error('Authentication failed. Please log out and log back in, then try again.');
      } else {
        toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
      if (!isProcessing) {
        setImportProgress(0);
        setCurrentOperation('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'export' ? (
              <>
                <Download className="h-5 w-5" />
                Export to Google Sheets
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Import from Google Sheets (Enhanced)
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isProcessing && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Import Progress</span>
                <span className="text-sm text-blue-700">{Math.round(importProgress)}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
              <p className="text-xs text-blue-700">{currentOperation}</p>
            </div>
          )}

          {mode === 'export' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Export Process:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Click "Generate & Download CSV" below</li>
                  <li>The CSV data will be copied to your clipboard and downloaded</li>
                  <li>Open Google Sheets and create a new spreadsheet</li>
                  <li>Paste the data (Ctrl+V) into the first cell</li>
                  <li>Edit the documents as needed in Google Sheets</li>
                  <li>Copy all data and use "Import from Google Sheets" to bring changes back</li>
                </ol>
                <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
                  <strong>Available fields:</strong> Document Name, Document Type, Tech Applicability, Description, 
                  Phase Name, Phase Description, Category Name, Document Source, Position
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleExport} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Generate & Download CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://sheets.google.com', '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Google Sheets
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Enhanced Import Process (Authentication Fixed):
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                  <li>Open your Google Sheets document with the edited data</li>
                  <li>Select all data (Ctrl+A) and copy it (Ctrl+C)</li>
                  <li>Paste the data in the text area below</li>
                  <li>Click "Enhanced Import" - now with authentication management!</li>
                </ol>
                <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-700">
                  <strong>Fixed:</strong> Authentication issues resolved with batch processing and session management.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csvData">Paste CSV Data from Google Sheets:</Label>
                <Textarea
                  id="csvData"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Paste your CSV data here..."
                  rows={12}
                  className="font-mono text-sm"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleImport} 
                  disabled={!csvData.trim() || isProcessing}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isProcessing ? 'Importing...' : 'Enhanced Import Documents'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCsvData('')}
                  disabled={isProcessing}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
