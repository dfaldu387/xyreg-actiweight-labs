
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertTriangle, CheckCircle, File } from 'lucide-react';
import { UnifiedCsvImportService, CsvDocumentRow } from '@/services/unifiedCsvImportService';
import { toast } from 'sonner';

interface PhaseData {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    name: string;
    document_type: string;
    status: string;
    tech_applicability?: string; // Make optional to match DocumentAssignmentPhase
    created_at?: string; // Make optional to match DocumentAssignmentPhase
  }>;
}

interface SmartAppendCsvImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  existingPhases: PhaseData[];
  onImportComplete: () => void;
}

export function SmartAppendCsvImport({
  open,
  onOpenChange,
  companyId,
  existingPhases,
  onImportComplete
}: SmartAppendCsvImportProps) {
  const [csvData, setCsvData] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CsvDocumentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setSelectedFile(file);

    // Read the file
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      setCsvData(csvContent);
      toast.success(`File "${file.name}" loaded successfully`);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setSelectedFile(null);
    };
    reader.readAsText(file);
  };

  const handleParsePreview = () => {
    if (!csvData.trim()) {
      toast.error('Please upload a CSV file or paste CSV data first');
      return;
    }

    try {
      const parsed = UnifiedCsvImportService.parseCSVData(csvData);
      const validation = UnifiedCsvImportService.validateCSVData(parsed);
      
      if (!validation.isValid) {
        toast.error(`CSV validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      if (validation.warnings.length > 0) {
        toast.warning(`Validation warnings: ${validation.warnings.join(', ')}`);
      }

      setParsedData(parsed);
      setPreviewMode(true);
      toast.success(`Successfully parsed ${parsed.length} rows`);
      
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Failed to parse CSV data');
    }
  };

  const handleSmartImport = async () => {
    if (!parsedData.length) {
      toast.error('No data to import');
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);
    setCurrentOperation('Starting smart append import...');

    try {
      const result = await UnifiedCsvImportService.importDocuments(
        parsedData,
        companyId,
        (processed, total, operation) => {
          const progressPercent = Math.round((processed / total) * 80) + 10; // 10-90% range
          setImportProgress(progressPercent);
          setCurrentOperation(`${operation} (${processed}/${total})`);
        }
      );

      setImportProgress(95);
      setCurrentOperation('Finalizing import...');

      if (result.success) {
        // Use the correct property names from UnifiedImportResult
        toast.success(`Import completed! Created: ${result.documentsCreated}, Skipped: ${result.documentsSkipped} documents`);
        
        if (result.authErrors > 0) {
          toast.warning(`${result.authErrors} authentication errors occurred. Some items may need to be retried.`);
        }

        setImportProgress(100);
        setCurrentOperation('Import completed successfully!');
        
        // Trigger refresh of parent component
        onImportComplete();
        
        // Auto-close after successful import
        setTimeout(() => {
          handleClose();
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

  const handleClose = () => {
    setCsvData('');
    setSelectedFile(null);
    setParsedData([]);
    setPreviewMode(false);
    setIsProcessing(false);
    setImportProgress(0);
    setCurrentOperation('');
    onOpenChange(false);
    
    // Clear file input
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Analyze what would be new vs existing
  const analyzeImportImpact = () => {
    if (!parsedData.length) return { newPhases: [], newDocuments: 0, existingPhases: [] };

    const existingPhaseNames = new Set(existingPhases.map(p => p.name));
    const newPhases = [...new Set(parsedData.map(row => row.phaseName))]
      .filter(phaseName => !existingPhaseNames.has(phaseName));
    
    const existingPhasesInImport = [...new Set(parsedData.map(row => row.phaseName))]
      .filter(phaseName => existingPhaseNames.has(phaseName));

    return {
      newPhases,
      newDocuments: parsedData.filter(row => row.documentName).length,
      existingPhases: existingPhasesInImport
    };
  };

  const impact = analyzeImportImpact();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Smart CSV Import & Append
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
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

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Smart Import:</strong> This will intelligently append new documents and phases 
              to your existing setup without duplicating content. Authentication management included.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file-input">Upload CSV File:</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="flex-1"
                />
                {selectedFile && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <File className="h-3 w-3" />
                    {selectedFile.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csvData">Paste CSV Data (Document Name, Type, Status, Tech Applicability, Description, Phase Name, Phase Description, Category Name):</Label>
              <Textarea
                id="csvData"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder={`Document Name,Document Type,Status,Tech Applicability,Description,Phase Name,Phase Description,Category Name
"Risk Management Plan","Standard","Not Started","All device types","Comprehensive risk assessment","Design Controls","Design verification and validation","Quality"`}
                rows={8}
                className="font-mono text-sm"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleParsePreview}
              disabled={!csvData.trim() || isProcessing}
              variant="outline"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Parse & Preview
            </Button>
          </div>

          {previewMode && parsedData.length > 0 && (
            <>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-3 border-b">
                  <h3 className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Import Preview ({parsedData.length} rows parsed)
                  </h3>
                </div>
                
                <div className="p-3 space-y-3">
                  <div className="flex gap-4">
                    <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                      {impact.newPhases.length} New Phases
                    </Badge>
                    <Badge variant="secondary" className="text-green-700 bg-green-100">
                      {impact.newDocuments} Documents
                    </Badge>
                    <Badge variant="outline">
                      {impact.existingPhases.length} Existing Phases
                    </Badge>
                  </div>

                  {impact.newPhases.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-blue-900 mb-1">New Phases to Create:</h4>
                      <div className="flex flex-wrap gap-1">
                        {impact.newPhases.map((phase, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {phase}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {impact.existingPhases.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-green-900 mb-1">Will Append to Existing Phases:</h4>
                      <div className="flex flex-wrap gap-1">
                        {impact.existingPhases.map((phase, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {phase}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-2 font-medium text-sm">
                  Document Preview (showing first 5 rows)
                </div>
                <div className="max-h-40 overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Phase</th>
                        <th className="p-2 text-left">Document</th>
                        <th className="p-2 text-left">Type</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{row.phaseName}</td>
                          <td className="p-2">{row.documentName}</td>
                          <td className="p-2">{row.documentType}</td>
                          <td className="p-2">{row.documentStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 5 && (
                    <div className="p-2 text-center text-muted-foreground text-xs">
                      ...and {parsedData.length - 5} more rows
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSmartImport}
            disabled={!previewMode || parsedData.length === 0 || isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Smart Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Smart Import {parsedData.length} Items
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
