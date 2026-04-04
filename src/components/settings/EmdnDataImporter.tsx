import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { EmdnImportService, type EmdnImportResult } from '@/services/emdnImportService';
import { Upload, Check, AlertTriangle, Info } from 'lucide-react';

export function EmdnDataImporter() {
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [importResult, setImportResult] = useState<EmdnImportResult | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  
  const { toast } = useToast();

  const handleValidation = async () => {
    if (!csvData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste CSV data to validate",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = EmdnImportService.validateCSVData(csvData);
      setValidationResult(result);
      
      if (result.isValid) {
        toast({
          title: "Validation Successful",
          description: "CSV data is valid and ready for import",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: "Please fix the errors before importing",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Unknown validation error",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste CSV data to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await EmdnImportService.importEmdnData(csvData);
      setImportResult(result);
      
      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.imported} EMDN codes`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: "Some errors occurred during import. Check the results below.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Unknown import error",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const previewData = React.useMemo(() => {
    if (!csvData.trim()) return null;
    
    try {
      const rows = EmdnImportService.parseCSVData(csvData);
      return rows.slice(0, 5); // Show first 5 rows
    } catch {
      return null;
    }
  }, [csvData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          EMDN Data Importer
        </CardTitle>
        <CardDescription>
          Import EMDN codes from CSV data. Expected columns: EMDN CODE, CATEGORY DESCRIPTION, LEVEL.
          Paste your CSV data below to validate and import.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This will replace all existing EMDN codes. Expected format:
            EMDN CODE, CATEGORY DESCRIPTION, LEVEL. The import will automatically calculate parent-child 
            relationships based on the hierarchical code structure.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label htmlFor="csv-data" className="text-sm font-medium">
            CSV Data
          </label>
          <Textarea
            id="csv-data"
            placeholder="Paste your CSV data here (headers: EMDN CODE, CATEGORY DESCRIPTION, LEVEL)..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="text-xs text-muted-foreground">
            {csvData.trim() ? `${csvData.split('\n').length} lines` : 'No data'}
          </div>
        </div>

        {previewData && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Data Preview (First 5 rows)</h4>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">EMDN Code</th>
                    <th className="p-2 text-left">Category Description</th>
                    <th className="p-2 text-left">Level</th>
                    <th className="p-2 text-left">Risk Class</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-mono">{row.emdnCode}</td>
                      <td className="p-2">{row.categoryDescription}</td>
                      <td className="p-2">{row.level}</td>
                      <td className="p-2">{row.riskClass || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleValidation}
            disabled={!csvData.trim() || isValidating}
            variant="outline"
          >
            {isValidating ? "Validating..." : "Validate Data"}
          </Button>
          
          <Button
            onClick={handleImport}
            disabled={!csvData.trim() || isImporting || (validationResult && !validationResult.isValid)}
          >
            {isImporting ? "Importing..." : "Import EMDN Data"}
          </Button>
        </div>

        {isImporting && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Progress value={50} className="flex-1" />
              <span className="text-sm text-muted-foreground">Importing...</span>
            </div>
          </div>
        )}

        {validationResult && (
          <Alert variant={validationResult.isValid ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                    {validationResult.isValid ? "Valid" : "Invalid"}
                  </Badge>
                  <span>
                    {validationResult.isValid 
                      ? "CSV data is valid and ready for import" 
                      : "Please fix the errors before importing"
                    }
                  </span>
                </div>
                
                {validationResult.errors.length > 0 && (
                  <div>
                    <strong>Errors:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validationResult.warnings.length > 0 && (
                  <div>
                    <strong>Warnings:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {importResult && (
          <Alert variant={importResult.success ? "default" : "destructive"}>
            <Check className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={importResult.success ? "default" : "destructive"}>
                    {importResult.success ? "Success" : "Failed"}
                  </Badge>
                  <span>
                    {importResult.success 
                      ? `Successfully imported ${importResult.imported} EMDN codes`
                      : `Import failed: ${importResult.imported}/${importResult.totalRows} imported`
                    }
                  </span>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div>
                    <strong>Errors:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}