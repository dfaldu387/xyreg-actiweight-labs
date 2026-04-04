
import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, AlertTriangle, CheckCircle, XCircle, Building, Users } from "lucide-react";
import { toast } from "sonner";
import { CompanyDocumentTemplateImportService, type DocumentTemplateImportResult } from "@/services/companyDocumentTemplateImportService";

interface DocumentTemplateImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onImportComplete: () => void;
}

export function DocumentTemplateImportDialog({
  open,
  onOpenChange,
  companyId,
  onImportComplete
}: DocumentTemplateImportDialogProps) {
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0, operation: "" });
  const [importResult, setImportResult] = useState<DocumentTemplateImportResult | null>(null);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }

    try {
      const text = await file.text();
      setCsvData(text);
      toast.success("CSV file loaded successfully");
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error("Failed to read the CSV file");
    }
  };

  const handleCsvChange = (value: string) => {
    setCsvData(value);
    setValidationResult(null);
    setImportResult(null);
  };

  const validateData = () => {
    if (!csvData.trim()) {
      toast.error("Please provide CSV data");
      return;
    }

    try {
      const parsedData = CompanyDocumentTemplateImportService.parseCSVData(csvData);
      const validation = CompanyDocumentTemplateImportService.validateCSVData(parsedData);
      setValidationResult(validation);

      if (validation.errors.length > 0) {
        toast.error(`Validation failed: ${validation.errors.length} errors found`);
      } else {
        toast.success(`Validation passed: ${parsedData.length} valid document templates found`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error("Failed to validate CSV data");
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error("Please provide CSV data");
      return;
    }

    try {
      setIsImporting(true);
      setImportResult(null);
      
      const parsedData = CompanyDocumentTemplateImportService.parseCSVData(csvData);
      
      const result = await CompanyDocumentTemplateImportService.importDocumentTemplates(
        parsedData,
        companyId,
        (processed, total, operation) => {
          setImportProgress({ processed, total, operation });
        }
      );

      setImportResult(result);
      
      if (result.success) {
        toast.success(`Import completed successfully! ${result.documentsCreated} documents created.`);
        onImportComplete();
      } else {
        toast.error(`Import completed with errors. ${result.documentsCreated} documents created, ${result.errors.length} errors.`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Import failed: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setCsvData("");
    setValidationResult(null);
    setImportResult(null);
    setImportProgress({ processed: 0, total: 0, operation: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const getProgressPercentage = () => {
    if (importProgress.total === 0) return 0;
    return Math.round((importProgress.processed / importProgress.total) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <DialogTitle>Import Document Templates to Existing Phases</DialogTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Building className="h-3 w-3 mr-1" />
              Company Specific
            </Badge>
          </div>
        </DialogHeader>

        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            This import will only add document templates to <strong>existing active phases</strong> in your company. 
            No new phases will be created. Document templates will be specific to your company.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={isImporting}
                    className="mt-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with columns: Document Name, Document Type, Document Status, Tech Applicability, Description, Phase Name
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">Or</span>
            <Separator className="flex-1" />
          </div>

          {/* Manual CSV Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Paste CSV Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-data">CSV Data</Label>
                  <Textarea
                    id="csv-data"
                    value={csvData}
                    onChange={(e) => handleCsvChange(e.target.value)}
                    placeholder="Document Name,Document Type,Document Status,Tech Applicability,Description,Phase Name&#10;Risk Management File,Standard,Not Started,All device types,Comprehensive risk analysis,Risk Management&#10;Design Controls,Standard,Not Started,All device types,Design control procedures,Design Controls"
                    className="min-h-[200px] font-mono text-sm"
                    disabled={isImporting}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Expected CSV format with header row: Document Name, Document Type, Document Status, Tech Applicability, Description, Phase Name
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  Validation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validationResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Validation Errors:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validationResult.errors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {validationResult.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Warnings:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validationResult.warnings.map((warning, index) => (
                            <li key={index} className="text-sm">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {validationResult.isValid && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      CSV data is valid and ready for import.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Import Progress */}
          {isImporting && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{importProgress.operation}</span>
                    <span>{importProgress.processed} / {importProgress.total}</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Documents Created:</p>
                    <p className="text-2xl font-bold text-green-600">{importResult.documentsCreated}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Documents Skipped:</p>
                    <p className="text-2xl font-bold text-gray-600">{importResult.documentsSkipped}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Matched Phases:</p>
                    {importResult.matchedPhases.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {importResult.matchedPhases.map((phase, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {phase}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No phases matched</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Unmatched Phases:</p>
                    {importResult.unmatchedPhases.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {importResult.unmatchedPhases.map((phase, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <XCircle className="h-3 w-3 text-red-600" />
                            {phase}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">All phases matched</p>
                    )}
                  </div>
                </div>

                {importResult.details.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Phase Details:</p>
                      <div className="space-y-2">
                        {importResult.details.map((detail, index) => (
                          <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                            <span className="font-medium">{detail.phaseName}</span>
                            <div className="flex gap-4">
                              <span className="text-green-600">+{detail.documentsAdded}</span>
                              <span className="text-gray-600">~{detail.documentsSkipped}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {importResult.errors.length > 0 && (
                  <>
                    <Separator />
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="font-medium">Import Errors:</p>
                          <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                            {importResult.errors.map((error, index) => (
                              <li key={index} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={validateData} disabled={isImporting || !csvData.trim()}>
            Validate CSV
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              Close
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={isImporting || !csvData.trim() || (validationResult && !validationResult.isValid)}
            >
              {isImporting ? "Importing..." : "Import Document Templates"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
