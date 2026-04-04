import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { KeyFeature } from '@/utils/keyFeaturesNormalizer';

interface FeatureImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingFeatures: KeyFeature[];
  onImport: (features: KeyFeature[]) => void;
}

type Step = 'upload' | 'preview' | 'import';

interface ParsedFeatureRow {
  name: string;
  description: string;
  isNovel: boolean;
  explanation: string;
  isDuplicate: boolean;
}

function parseBool(val: string): boolean {
  return ['yes', 'true', '1', 'y'].includes((val || '').toLowerCase().trim());
}

export function FeatureImportDialog({ open, onOpenChange, existingFeatures, onImport }: FeatureImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<ParsedFeatureRow[]>([]);
  const [fileName, setFileName] = useState('');

  const reset = useCallback(() => {
    setStep('upload');
    setRows([]);
    setFileName('');
  }, []);

  const handleClose = useCallback((val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  }, [onOpenChange, reset]);

  const existingNames = new Set(existingFeatures.map(f => f.name.toLowerCase()));

  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
        if (!json.length) {
          toast.error('No data found in spreadsheet');
          return;
        }
        const parsed: ParsedFeatureRow[] = json.map(row => {
          const name = (row['Name'] || row['name'] || row['Feature'] || row['feature'] || '').trim();
          return {
            name,
            description: (row['Description'] || row['description'] || '').trim(),
            isNovel: parseBool(row['Novel'] || row['novel'] || row['Is Novel'] || row['Novelty'] || ''),
            explanation: (row['Explanation'] || row['explanation'] || row['Novelty Explanation'] || '').trim(),
            isDuplicate: existingNames.has(name.toLowerCase()),
          };
        }).filter(r => r.name);

        if (!parsed.length) {
          toast.error('No valid rows found (Name column required)');
          return;
        }
        setRows(parsed);
        setStep('preview');
      } catch {
        toast.error('Failed to parse file');
      }
    };
    reader.readAsBinaryString(file);
  }, [existingNames]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const downloadTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wb = XLSX.utils.book_new();

    const templateData = [
      ['Name', 'Description', 'Novel', 'Explanation'],
      ['Continuous Glucose Monitoring', 'Real-time blood glucose tracking via subcutaneous sensor', 'Yes', 'Novel integration of CGM with insulin delivery'],
      ['Smartphone Integration', 'Bluetooth connectivity for mobile app data sync', 'No', ''],
      ['Cloud-Based Analytics', 'Remote data processing and trend analysis', 'Yes', 'AI-powered predictive analytics for glucose patterns'],
    ];
    const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
    wsTemplate['!cols'] = templateData[0].map((h: string) => ({ wch: Math.max(h.length + 8, 25) }));

    const instructionsData = [
      ['Column Name', 'Required', 'Description'],
      ['Name', 'Yes', 'Feature name (must be unique)'],
      ['Description', 'No', 'MDR Annex II 1.1.f description of the feature'],
      ['Novel', 'No', 'Whether this feature is novel (Yes/No)'],
      ['Explanation', 'No', 'MDR Annex II 1.1.g novelty explanation'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 55 }];

    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    XLSX.writeFile(wb, 'feature-import-template.xlsx');
  };

  const handleImport = () => {
    const newFeatures = rows.filter(r => !r.isDuplicate).map(r => ({
      name: r.name,
      description: r.description,
      isNovel: r.isNovel,
      explanation: r.explanation,
      linkedClinicalBenefits: [],
      linkedUserNeedIds: [],
      linkedComponentNames: [],
    }));

    onImport([...existingFeatures, ...newFeatures]);
    toast.success(`Imported ${newFeatures.length} features`);
    handleClose(false);
  };

  const newCount = rows.filter(r => !r.isDuplicate).length;
  const dupeCount = rows.filter(r => r.isDuplicate).length;
  const novelCount = rows.filter(r => !r.isDuplicate && r.isNovel).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Key Features
            {fileName && <Badge variant="outline" className="ml-2 font-normal">{fileName}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 text-sm mb-2">
          <Badge variant={step === 'upload' ? 'default' : 'outline'}>1. Upload</Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant={step === 'preview' ? 'default' : 'outline'}>2. Preview</Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant={step === 'import' ? 'default' : 'outline'}>3. Import</Badge>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('feature-import-file')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Drag & drop your Excel file here</p>
            <p className="text-sm text-muted-foreground mt-2">Supports .xlsx, .xls, .csv files</p>
            <button type="button" onClick={downloadTemplate} className="inline-block mt-3 text-sm text-primary underline hover:text-primary/80">
              Download template (.xlsx)
            </button>
            <input id="feature-import-file" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {rows.length} features. {dupeCount > 0 && <span className="text-amber-600">{dupeCount} duplicate(s) will be skipped.</span>}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Novel</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className={row.isDuplicate ? 'opacity-50' : ''}>
                      <TableCell className="text-xs font-medium">{row.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{row.description || '—'}</TableCell>
                      <TableCell className="text-xs">{row.isNovel ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        {row.isDuplicate ? (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Duplicate</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">New</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}

        {/* Step 3: Import confirmation */}
        {step === 'import' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold">{newCount}</div><p className="text-sm text-muted-foreground">New features</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold">{novelCount}</div><p className="text-sm text-muted-foreground">Marked novel</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-amber-600">{dupeCount}</div><p className="text-sm text-muted-foreground">Skipped (duplicate)</p></CardContent></Card>
            </div>
            <p className="text-sm text-muted-foreground">
              Features will be added to your product's key features list. You can link clinical benefits, user needs, and components after import.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== 'upload' && (
            <Button variant="outline" onClick={() => setStep(step === 'import' ? 'preview' : 'upload')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          {step === 'preview' && (
            <Button onClick={() => setStep('import')} disabled={newCount === 0}>
              Review <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 'import' && (
            <Button onClick={handleImport} disabled={newCount === 0}>
              <Check className="h-4 w-4 mr-1" /> Import {newCount} Features
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
