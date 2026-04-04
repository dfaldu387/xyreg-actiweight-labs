import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { UserNeedsService } from '@/services/userNeedsService';
import { CATEGORY_PREFIX_MAP } from './types';
import * as XLSX from 'xlsx';

interface UserNeedsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

type Step = 'upload' | 'preview' | 'import';

interface ParsedRow {
  description: string;
  category: string;
  status: 'Met' | 'Not Met';
}

const VALID_CATEGORIES = Object.keys(CATEGORY_PREFIX_MAP);

function normalizeCategory(val: string): string {
  const v = (val || '').trim().toLowerCase();
  const match = VALID_CATEGORIES.find(c => c.toLowerCase() === v);
  return match || 'General';
}

function normalizeStatus(val: string): 'Met' | 'Not Met' {
  const v = (val || '').trim().toLowerCase();
  if (v === 'met') return 'Met';
  return 'Not Met';
}

export function UserNeedsImportDialog({ open, onOpenChange, productId, companyId }: UserNeedsImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const qc = useQueryClient();

  const reset = useCallback(() => {
    setStep('upload');
    setRows([]);
    setImporting(false);
    setFileName('');
  }, []);

  const handleClose = useCallback((val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  }, [onOpenChange, reset]);

  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
        if (!json.length) { toast.error('No data found in spreadsheet'); return; }

        const parsed: ParsedRow[] = json.map(row => ({
          description: (row['Description'] || row['description'] || '').trim(),
          category: normalizeCategory(row['Category'] || row['category'] || ''),
          status: normalizeStatus(row['Status'] || row['status'] || ''),
        })).filter(r => r.description);

        if (!parsed.length) { toast.error('No valid rows found (Description column required)'); return; }
        setRows(parsed);
        setStep('preview');
      } catch {
        toast.error('Failed to parse file');
      }
    };
    reader.readAsBinaryString(file);
  }, []);

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
      ['Description', 'Category', 'Status'],
      ['Device shall be safe for patient contact', 'Safety', 'Not Met'],
      ['Device shall provide accurate measurements', 'Performance', 'Not Met'],
      ['Device shall be intuitive for clinical staff', 'Usability', 'Not Met'],
      ['Device shall comply with IEC 60601-1', 'Regulatory', 'Not Met'],
      ['Device shall integrate with hospital EMR systems', 'Interface', 'Not Met'],
    ];
    const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
    wsTemplate['!cols'] = [{ wch: 50 }, { wch: 18 }, { wch: 12 }];

    const instructionsData = [
      ['Column Name', 'Required', 'Description', 'Valid Values'],
      ['Description', 'Yes', 'The user need statement', 'Any text'],
      ['Category', 'No', 'Category for ID generation (defaults to General)', VALID_CATEGORIES.join(', ')],
      ['Status', 'No', 'Whether the need is met (defaults to Not Met)', 'Met, Not Met'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 50 }, { wch: 60 }];

    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    XLSX.writeFile(wb, 'user-needs-import-template.xlsx');
  };

  const handleImport = async () => {
    setImporting(true);
    let succeeded = 0;
    try {
      for (const row of rows) {
        await UserNeedsService.createUserNeed({
          product_id: productId,
          company_id: companyId,
          description: row.description,
          status: row.status,
          category: row.category,
        });
        succeeded++;
      }

      qc.invalidateQueries({ queryKey: ['user-needs', productId] });
      toast.success(`Imported ${succeeded} user needs`);
      handleClose(false);
    } catch (err: any) {
      console.error('User needs import failed:', err);
      toast.error(`Import failed after ${succeeded} rows: ${err.message || 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import User Needs
            {fileName && <Badge variant="outline" className="ml-2 font-normal">{fileName}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm mb-2">
          <Badge variant={step === 'upload' ? 'default' : 'outline'}>1. Upload</Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant={step === 'preview' ? 'default' : 'outline'}>2. Preview</Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant={step === 'import' ? 'default' : 'outline'}>3. Import</Badge>
        </div>

        {step === 'upload' && (
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('un-import-file')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Drag & drop your Excel file here</p>
            <p className="text-sm text-muted-foreground mt-2">Supports .xlsx, .xls, .csv files</p>
            <button type="button" onClick={downloadTemplate} className="inline-block mt-3 text-sm text-primary underline hover:text-primary/80">
              Download template (.xlsx)
            </button>
            <input id="un-import-file" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
          </div>
        )}

        {step === 'preview' && (
          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Found {rows.length} user needs.</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium max-w-[350px] truncate">{row.description}</TableCell>
                      <TableCell className="text-xs">{row.category}</TableCell>
                      <TableCell className="text-xs">{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}

        {step === 'import' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold">{rows.length}</div><p className="text-sm text-muted-foreground">Total user needs</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-primary">{new Set(rows.map(r => r.category)).size}</div><p className="text-sm text-muted-foreground">Categories</p></CardContent></Card>
            </div>
            <p className="text-sm text-muted-foreground">
              Each user need will receive an auto-generated UN-XX-NN ID based on its category. Needs are inserted sequentially to ensure unique IDs.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== 'upload' && (
            <Button variant="outline" onClick={() => setStep(step === 'import' ? 'preview' : 'upload')} disabled={importing}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>Cancel</Button>
          {step === 'preview' && (
            <Button onClick={() => setStep('import')}>
              Review <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 'import' && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importing...' : (
                <><Check className="h-4 w-4 mr-1" /> Import {rows.length} User Needs</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
