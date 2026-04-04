import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { EudamedImportService, type EudamedImportResult } from '@/services/eudamedImportService';
import { Database, Check, AlertTriangle, Info, Upload, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasAdminPrivileges } from '@/utils/roleUtils';
import { useTranslation } from '@/hooks/useTranslation';

interface EudamedDataImporterProps {
  companyId?: string;
}

export function EudamedDataImporter({ companyId }: EudamedDataImporterProps) {
  const { lang } = useTranslation();
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<EudamedImportResult | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const { toast } = useToast();
  const { userRole } = useAuth();

  // Check if user has admin privileges
  const isAdmin = hasAdminPrivileges(userRole);

  const handleValidation = async () => {
    if (!csvData.trim()) {
      toast({
        title: lang('eudamed.importer.toast.noData'),
        description: lang('eudamed.importer.toast.pasteToValidate'),
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = EudamedImportService.validateCSVData(csvData);
      setValidationResult(result);

      if (result.isValid) {
        toast({
          title: lang('eudamed.importer.toast.validationSuccessful'),
          description: lang('eudamed.importer.toast.validAndReady'),
        });
      } else {
        toast({
          title: lang('eudamed.importer.toast.validationFailed'),
          description: lang('eudamed.importer.toast.fixErrors'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: lang('eudamed.importer.toast.validationError'),
        description: error instanceof Error ? error.message : lang('eudamed.importer.toast.unknownValidationError'),
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: lang('eudamed.importer.toast.noData'),
        description: lang('eudamed.importer.toast.pasteToImport'),
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    setImportProgress(0);

    try {
      const result = await EudamedImportService.importEudamedData(
        csvData,
        (processed, total, operation) => {
          const progress = Math.round((processed / total) * 100);
          setImportProgress(progress);
        }
      );
      setImportResult(result);

      if (result.success) {
        toast({
          title: lang('eudamed.importer.toast.importSuccessful'),
          description: lang('eudamed.importer.toast.importedRecords', { count: result.imported }),
        });
      } else {
        toast({
          title: lang('eudamed.importer.toast.importFailed'),
          description: lang('eudamed.importer.toast.someErrors'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: lang('eudamed.importer.toast.importError'),
        description: error instanceof Error ? error.message : lang('eudamed.importer.toast.unknownImportError'),
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const previewData = React.useMemo(() => {
    if (!csvData.trim()) return null;
    
    try {
      const rows = EudamedImportService.parseCSVData(csvData);
      return rows.slice(0, 5); // Show first 5 rows
    } catch {
      return null;
    }
  }, [csvData]);

  // Show access denied message for non-admin users
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {lang('eudamed.importer.title')}
          </CardTitle>
          <CardDescription>
            {lang('eudamed.importer.restrictedToAdmins')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>{lang('eudamed.importer.accessDenied')}</strong> {lang('eudamed.importer.accessDeniedDescription')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {lang('eudamed.importer.title')}
          <Badge variant="destructive" className="ml-2">{lang('eudamed.importer.adminOnly')}</Badge>
        </CardTitle>
        <CardDescription>
          {lang('eudamed.importer.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>{lang('eudamed.importer.schemaFixed')}</strong> {lang('eudamed.importer.schemaFixedDescription')}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label htmlFor="csv-data" className="text-sm font-medium">
            {lang('eudamed.importer.csvData')}
          </label>
          <Textarea
            id="csv-data"
            placeholder={lang('eudamed.importer.csvPlaceholder')}
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="text-xs text-muted-foreground">
            {csvData.trim() ? lang('eudamed.importer.linesCount', { count: csvData.split('\n').length }) : lang('eudamed.importer.noData')}
          </div>
        </div>

        {previewData && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{lang('eudamed.importer.dataPreview')}</h4>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left min-w-[120px]">{lang('eudamed.importer.columns.udiDi')}</th>
                    <th className="p-2 text-left min-w-[150px]">{lang('eudamed.importer.columns.deviceName')}</th>
                    <th className="p-2 text-left min-w-[120px]">{lang('eudamed.importer.columns.riskClass')}</th>
                    <th className="p-2 text-left min-w-[120px]">{lang('eudamed.importer.columns.status')}</th>
                    <th className="p-2 text-left min-w-[120px]">{lang('eudamed.importer.columns.organization')}</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-mono text-xs">{row.udi_di}</td>
                      <td className="p-2">{row.device_name || '-'}</td>
                      <td className="p-2">{row.risk_class || '-'}</td>
                       <td className="p-2">{row.status || '-'}</td>
                       <td className="p-2">{row.organization || '-'}</td>
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
            {isValidating ? lang('eudamed.importer.validating') : lang('eudamed.importer.validateData')}
          </Button>

          <Button
            onClick={handleImport}
            disabled={!csvData.trim() || isImporting || (validationResult && !validationResult.isValid)}
          >
            {isImporting ? lang('eudamed.importer.importing') : lang('eudamed.importer.importData')}
          </Button>
        </div>

        {isImporting && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Progress value={importProgress} className="flex-1" />
              <span className="text-sm text-muted-foreground">{importProgress}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {lang('eudamed.importer.importingMessage')}
            </p>
          </div>
        )}

        {validationResult && (
          <Alert variant={validationResult.isValid ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                    {validationResult.isValid ? lang('eudamed.importer.valid') : lang('eudamed.importer.invalid')}
                  </Badge>
                  <span>
                    {validationResult.isValid
                      ? lang('eudamed.importer.toast.validAndReady')
                      : lang('eudamed.importer.toast.fixErrors')
                    }
                  </span>
                </div>

                {validationResult.errors.length > 0 && (
                  <div>
                    <strong>{lang('eudamed.importer.errors')}</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult.warnings.length > 0 && (
                  <div>
                    <strong>{lang('eudamed.importer.warnings')}</strong>
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
                    {importResult.success ? lang('eudamed.importer.success') : lang('eudamed.importer.partialSuccess')}
                  </Badge>
                  <span>
                    {importResult.success
                      ? lang('eudamed.importer.toast.importedRecords', { count: importResult.imported })
                      : lang('eudamed.importer.importCompleted', { imported: importResult.imported, total: importResult.totalRows })
                    }
                  </span>
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <strong>{lang('eudamed.importer.errors')}</strong>
                    <ul className="list-disc list-inside mt-1 max-h-32 overflow-y-auto">
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