
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Upload, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DeterministicCsvImportService, type CsvRow, type ImportResult, type ImportMode } from "@/services/deterministicCsvImportService";
import { supabase } from "@/integrations/supabase/client";

interface DeterministicImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName?: string;
  onImportComplete: () => void;
}

export function DeterministicImportDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  onImportComplete
}: DeterministicImportDialogProps) {
  const [csvData, setCsvData] = useState("");
  const [parsedData, setParsedData] = useState<CsvRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("append");
  const [importProgress, setImportProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState("");
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [validationResult, setValidationResult] = useState<{isValid: boolean; errors: string[]; warnings: string[]} | null>(null);

  const handlePreview = async () => {
    try {
      setCurrentOperation("Parsing CSV data...");
      const parsed = DeterministicCsvImportService.parseCSVData(csvData);
      setParsedData(parsed);
      
      if (parsed.length === 0) {
        toast.error('No valid data found in CSV');
        setPreviewMode(false);
        return;
      }

      // Validate the parsed data
      const validation = DeterministicCsvImportService.validateCSVData(parsed);
      setValidationResult(validation);
      
      if (!validation.isValid) {
        toast.error(`CSV validation failed: ${validation.errors.join(', ')}`);
        setPreviewMode(false);
        return;
      }

      if (validation.warnings.length > 0) {
        toast.warning(`Validation warnings: ${validation.warnings.join(', ')}`);
      }

      setPreviewMode(true);
      toast.success(`Parsed ${parsed.length} rows successfully`);
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV data');
      setPreviewMode(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('No data to import');
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);
    setCurrentOperation("Starting deterministic import...");
    setImportResults(null);
    
    try {
      console.log(`[DeterministicImport] Starting ${importMode} import for company:`, companyId);
      
      setImportProgress(20);
      setCurrentOperation("Processing structure via Edge Function...");
      
      // Call the Edge Function
      const { data: results, error } = await supabase.functions.invoke('create-structure-from-csv', {
        body: {
          companyId,
          csvData: parsedData,
          mode: importMode
        }
      });

      if (error) {
        throw error;
      }
      
      setImportProgress(80);
      setCurrentOperation("Refreshing UI data...");
      
      setImportResults(results);
      
      // Refresh the parent component
      onImportComplete();
      
      setImportProgress(100);
      setCurrentOperation("Import completed!");
      
      if (results.success) {
        toast.success(`Import completed: ${results.phasesCreated} phases, ${results.documentsCreated} documents created`);
        
        // Auto-close after successful import with no errors
        if (results.errors.length === 0) {
          setTimeout(() => {
            handleClose();
          }, 3000);
        }
      } else {
        toast.error(`Import failed: ${results.errors.join(', ')}`);
      }

    } catch (error) {
      console.error('[DeterministicImport] Import failed:', error);
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCsvData("");
    setParsedData([]);
    setPreviewMode(false);
    setIsProcessing(false);
    setImportProgress(0);
    setCurrentOperation("");
    setImportResults(null);
    setValidationResult(null);
    onOpenChange(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
        setPreviewMode(false);
        setImportResults(null);
        setValidationResult(null);
      };
      reader.readAsText(file);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Document Name,Document Type,Status,Tech Applicability,Description,Phase Name,Phase Description,Category Name
"Business Case","Standard","Not Started","All device types","Initial business case document","(01) Concept & Feasibility","Initial concept development","Design Control"
"Market Analysis","Standard","Not Started","All device types","Market research and analysis","(01) Concept & Feasibility","Initial concept development","Design Control"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'phase_structure_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template downloaded successfully');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Deterministic Structure Import
          </DialogTitle>
          <DialogDescription>
            Import lifecycle structure from CSV using exact matching. No fuzzy logic - predictable results every time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 p-1">
          {isProcessing && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Import Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(importProgress)}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">{currentOperation}</p>
            </div>
          )}

          {validationResult && !validationResult.isValid && (
            <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="font-medium text-red-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Validation Errors
              </div>
              <div className="text-sm text-red-700 space-y-1">
                {validationResult.errors.map((error, index) => (
                  <div key={index}>✗ {error}</div>
                ))}
              </div>
            </div>
          )}

          {importResults && (
            <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="font-medium text-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Import Results
              </div>
              <div className="text-sm text-green-700 space-y-1 grid grid-cols-2 gap-x-4">
                <div>✓ Categories: {importResults.categoriesCreated}</div>
                <div>✓ Phases: {importResults.phasesCreated}</div>
                <div>✓ Documents: {importResults.documentsCreated}</div>
                {importResults.errors.length > 0 && (
                  <div className="text-red-600 col-span-2">
                    ✗ Errors: {importResults.errors.length}
                  </div>
                )}
              </div>
              
              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mt-3 max-h-24 overflow-auto">
                  <div className="text-xs font-medium text-red-800 mb-1">Errors:</div>
                  {importResults.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-xs text-red-600">{error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-data">Or Paste CSV Data</Label>
            <Textarea
              id="csv-data"
              placeholder={`Document Name,Document Type,Status,Tech Applicability,Description,Phase Name,Phase Description,Category Name
"Business Case","Standard","Not Started","All device types","Initial business case document","(01) Concept & Feasibility","Initial concept development","Design Control"`}
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              disabled={isProcessing}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="space-y-3">
            <Label>Import Mode</Label>
            <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as ImportMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="append" id="append" />
                <Label htmlFor="append" className="font-normal">
                  <strong>Append</strong> - Add to existing structure
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="font-normal">
                  <strong>Replace</strong> - Clear existing and import (destructive)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!csvData.trim() || isProcessing}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Parse & Validate
            </Button>
          </div>

          {previewMode && parsedData.length > 0 && validationResult?.isValid && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 font-medium">
                Structure Preview ({parsedData.length} rows) - Ready for {importMode} import
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Category</th>
                      <th className="p-3 text-left font-medium">Phase</th>
                      <th className="p-3 text-left font-medium">Document</th>
                      <th className="p-3 text-left font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 20).map((row, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="p-3">{row.categoryName}</td>
                        <td className="p-3 font-medium">{row.phaseName}</td>
                        <td className="p-3">{row.documentName}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {row.documentType}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 20 && (
                  <div className="p-3 text-center text-muted-foreground bg-muted/20 text-xs">
                    ...and {parsedData.length - 20} more rows
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {isProcessing ? 'Please wait...' : 'Cancel'}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!previewMode || parsedData.length === 0 || isProcessing || !validationResult?.isValid}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {importMode === 'replace' ? 'Replace' : 'Append'} ({parsedData.length} items)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
