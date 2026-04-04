
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, RefreshCw, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { EnhancedCsvImportService, ImportMode, ImportPreview, CsvPhaseRow } from "@/services/enhancedCsvImportService";

interface EnhancedPhaseImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onImportComplete: () => void;
}

export function EnhancedPhaseImportDialog({
  open,
  onOpenChange,
  companyId,
  onImportComplete
}: EnhancedPhaseImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('skip');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview[]>([]);
  const [parsedData, setParsedData] = useState<CsvPhaseRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      setPreview([]);
      setStep('upload');
    }
  };

  const handleGeneratePreview = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const csvContent = await file.text();
      const parseResult = EnhancedCsvImportService.parseCSV(csvContent);
      
      if (!parseResult.isValid) {
        setErrors(parseResult.errors);
        setIsLoading(false);
        return;
      }

      setParsedData(parseResult.data);
      const previewData = await EnhancedCsvImportService.generatePreview(
        companyId,
        parseResult.data,
        importMode
      );
      
      setPreview(previewData);
      setStep('preview');
      setErrors([]);
    } catch (error) {
      console.error('Preview generation failed:', error);
      setErrors(['Failed to generate preview. Please check your CSV format.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!parsedData.length || !preview.length) return;

    setIsLoading(true);
    try {
      const result = await EnhancedCsvImportService.executeImport(
        companyId,
        parsedData,
        importMode,
        preview
      );

      if (result.success) {
        toast.success(
          `Import completed! Created: ${result.created}, Updated: ${result.updated}, ` +
          `Skipped: ${result.skipped}, Renamed: ${result.renamed}`
        );
        setStep('complete');
        onImportComplete();
      } else {
        setErrors(result.errors);
        toast.error('Import completed with errors. Check the details below.');
      }
    } catch (error) {
      console.error('Import execution failed:', error);
      setErrors(['Import failed. Please try again.']);
      toast.error('Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setParsedData([]);
    setErrors([]);
    setStep('upload');
    onOpenChange(false);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4 text-green-600" />;
      case 'update': return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'skip': return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'rename': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  const getActionBadge = (action: string) => {
    const colors = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      skip: 'bg-gray-100 text-gray-800',
      rename: 'bg-orange-100 text-orange-800'
    };
    return (
      <Badge className={colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {action.toUpperCase()}
      </Badge>
    );
  };

  const previewStats = preview.reduce((acc, item) => {
    acc[item.action] = (acc[item.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Phases from CSV</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
              <p className="text-sm text-muted-foreground">
                CSV should have columns: Category Name, Phase Name, Phase Description, Position, Status, Phase Type
              </p>
            </div>

            <div className="space-y-4">
              <Label>Import Mode</Label>
              <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as ImportMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skip" id="skip" />
                  <Label htmlFor="skip">Skip Duplicates</Label>
                  <span className="text-sm text-muted-foreground">- Don't import phases that already exist</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="update" id="update" />
                  <Label htmlFor="update">Update Existing</Label>
                  <span className="text-sm text-muted-foreground">- Update existing phases with new data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rename" id="rename" />
                  <Label htmlFor="rename">Auto-Rename Duplicates</Label>
                  <span className="text-sm text-muted-foreground">- Add "(Imported)" suffix to duplicate names</span>
                </div>
              </RadioGroup>
            </div>

            {errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGeneratePreview} 
                disabled={!file || isLoading}
              >
                {isLoading ? 'Generating Preview...' : 'Generate Preview'}
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Create</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{previewStats.create || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Update</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{previewStats.update || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Skip</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{previewStats.skip || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Rename</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{previewStats.rename || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Phase Name</TableHead>
                    <TableHead>New Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(item.action)}
                          {getActionBadge(item.action)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.phaseName}</TableCell>
                      <TableCell>{item.newName || '-'}</TableCell>
                      <TableCell>{item.newPosition || parsedData[index]?.position || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleExecuteImport} 
                disabled={isLoading}
              >
                {isLoading ? 'Importing...' : 'Execute Import'}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Import Completed Successfully!</h3>
              <p className="text-muted-foreground">Your phases have been imported.</p>
            </div>
            <Button onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
