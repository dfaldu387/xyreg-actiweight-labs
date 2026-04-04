
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { RealNotifiedBodyImportService } from "@/services/realNotifiedBodyImportService";
import { toast } from "sonner";

export function NotifiedBodyDataImporter() {
  const [isImporting, setIsImporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [importResult, setImportResult] = useState<{success: boolean, imported: number, errors: string[]} | null>(null);
  const [validationResult, setValidationResult] = useState<{valid: boolean, issues: string[]} | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const result = await RealNotifiedBodyImportService.importRealEUNotifiedBodies();
      setImportResult(result);
      
      if (result.success) {
        toast.success(`Successfully imported ${result.imported} real EU Notified Bodies`);
      } else {
        toast.error(`Import completed with ${result.errors.length} errors`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import Notified Bodies');
      setImportResult({
        success: false,
        imported: 0,
        errors: [`Critical error: ${error}`]
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleValidation = async () => {
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const result = await RealNotifiedBodyImportService.validateImportedData();
      setValidationResult(result);
      
      if (result.valid) {
        toast.success("Data validation passed successfully");
      } else {
        toast.warning(`Data validation found ${result.issues.length} issues`);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error('Failed to validate data');
      setValidationResult({
        valid: false,
        issues: [`Validation error: ${error}`]
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Import Real EU Notified Bodies
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Import authentic EU Notified Bodies from the official NANDO database to replace any fake data.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will import real EU Notified Bodies with authentic NB numbers and contact information. 
            The fake data has already been cleaned from the database.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button 
            onClick={handleImport} 
            disabled={isImporting}
            className="flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import Real Data
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleValidation} 
            disabled={isValidating}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Validate Data
              </>
            )}
          </Button>
        </div>

        {importResult && (
          <Alert className={importResult.success ? "border-green-500" : "border-red-500"}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  Import {importResult.success ? 'completed successfully' : 'completed with errors'}. 
                  Imported: {importResult.imported} records.
                </p>
                {importResult.errors.length > 0 && (
                  <div>
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside text-sm">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {validationResult && (
          <Alert className={validationResult.valid ? "border-green-500" : "border-yellow-500"}>
            {validationResult.valid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  Data validation {validationResult.valid ? 'passed' : 'found issues'}.
                </p>
                {validationResult.issues.length > 0 && (
                  <div>
                    <p className="font-medium">Issues:</p>
                    <ul className="list-disc list-inside text-sm">
                      {validationResult.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
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
