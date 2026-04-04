import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertTriangle, Cpu } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { requirementSpecificationsService } from '@/services/requirementSpecificationsService';
import { useDeviceComponents } from '@/hooks/useDeviceComponents';
import { REQUIREMENT_CATEGORIES } from '@/components/product/design-risk-controls/requirement-specifications/types';
import * as XLSX from 'xlsx';

interface HardwareRequirementsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

type Step = 'upload' | 'preview' | 'import';

interface ParsedRow {
  description: string;
  category: string;
  tracesTo: string;
  linkedRisks: string;
  verificationStatus: 'Not Started' | 'In Progress' | 'Passed' | 'Failed';
  linkedComponentPartNumber: string;
  resolvedComponentId: string | null;
  resolvedComponentName: string | null;
}

const VALID_STATUSES = ['Not Started', 'In Progress', 'Passed', 'Failed'] as const;

function normalizeStatus(val: string): 'Not Started' | 'In Progress' | 'Passed' | 'Failed' {
  const v = (val || '').trim().toLowerCase();
  if (v === 'passed') return 'Passed';
  if (v === 'failed') return 'Failed';
  if (v === 'in progress' || v === 'in_progress') return 'In Progress';
  return 'Not Started';
}

function normalizeCategory(val: string): string {
  const v = (val || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const match = REQUIREMENT_CATEGORIES.find(c => c.id === v || c.label.toLowerCase() === val.trim().toLowerCase());
  return match ? match.label : val.trim();
}

export function HardwareRequirementsImportDialog({ open, onOpenChange, productId, companyId }: HardwareRequirementsImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const qc = useQueryClient();
  const { data: components = [] } = useDeviceComponents(productId);

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

  const resolveComponent = useCallback((partNumber: string) => {
    if (!partNumber) return { id: null, name: null };
    const match = components.find(
      c => (c.part_number && c.part_number.toLowerCase() === partNumber.toLowerCase()) ||
           c.name.toLowerCase() === partNumber.toLowerCase()
    );
    return match ? { id: match.id, name: match.part_number ? `${match.part_number} — ${match.name}` : match.name } : { id: null, name: null };
  }, [components]);

  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
        if (!json.length) { toast.error('No data found in spreadsheet'); return; }

        const parsed: ParsedRow[] = json.map(row => {
          const partNum = (row['Linked Component Part Number'] || row['Component'] || row['Part Number'] || '').trim();
          const resolved = resolveComponent(partNum);
          return {
            description: (row['Description'] || row['description'] || '').trim(),
            category: normalizeCategory(row['Category'] || row['category'] || ''),
            tracesTo: (row['Traces To'] || row['Derived From'] || row['traces_to'] || '').trim(),
            linkedRisks: (row['Linked Risks'] || row['linked_risks'] || '').trim(),
            verificationStatus: normalizeStatus(row['Verification Status'] || row['Status'] || ''),
            linkedComponentPartNumber: partNum,
            resolvedComponentId: resolved.id,
            resolvedComponentName: resolved.name,
          };
        }).filter(r => r.description);

        if (!parsed.length) { toast.error('No valid rows found (Description column required)'); return; }
        setRows(parsed);
        setStep('preview');
      } catch {
        toast.error('Failed to parse file');
      }
    };
    reader.readAsBinaryString(file);
  }, [resolveComponent]);

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
      ['Description', 'Category', 'Traces To', 'Linked Risks', 'Verification Status', 'Linked Component Part Number'],
      ['Sensor accuracy of ±0.5mm across 0-300mm range', 'Mechanical', 'SYSR-001', 'HAZ-001', 'Not Started', 'DHS-SEN-G660'],
      ['Sampling frequency minimum 50Hz', 'Electronics', 'SYSR-001, SYSR-002', '', 'Not Started', 'DHS-SEN-G660'],
      ['IP54 ingress protection rating', 'Environmental', 'SYSR-003', 'HAZ-002, HAZ-005', 'Not Started', ''],
      ['Maximum power draw 150mA at 5V DC', 'Electronics', '', '', 'Not Started', 'DHS-ELC-010'],
      ['CRC data integrity check on transmission', 'Software', 'SYSR-004', 'HAZ-003', 'Not Started', ''],
      ['Calibration maintained for 1,000,000 cycles', 'Lifetime', '', '', 'Not Started', 'DHS-SEN-G660'],
    ];
    const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
    wsTemplate['!cols'] = templateData[0].map((h: string) => ({ wch: Math.max(h.length + 4, 22) }));

    const validCategories = REQUIREMENT_CATEGORIES.map(c => c.label).join(', ');
    const instructionsData = [
      ['Column Name', 'Required', 'Description', 'Valid Values'],
      ['Description', 'Yes', 'The functional requirement statement', 'Any text'],
      ['Category', 'No', 'Requirement category for grouping', validCategories],
      ['Traces To', 'No', 'System requirement IDs this derives from (comma-separated)', 'e.g. SYSR-001, SYSR-002'],
      ['Linked Risks', 'No', 'Hazard IDs mitigated by this requirement (comma-separated)', 'e.g. HAZ-001, HAZ-003'],
      ['Verification Status', 'No', 'Current verification state (defaults to Not Started)', 'Not Started, In Progress, Passed, Failed'],
      ['Linked Component Part Number', 'No', 'Part number or name of linked device component', 'e.g. DHS-SEN-G660'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 32 }, { wch: 10 }, { wch: 55 }, { wch: 50 }];

    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    XLSX.writeFile(wb, 'hardware-requirements-import-template.xlsx');
  };

  const handleImport = async () => {
    setImporting(true);
    let succeeded = 0;
    let linked = 0;
    try {
      for (const row of rows) {
        await requirementSpecificationsService.create(
          productId,
          companyId,
          {
            description: row.description,
            category: row.category,
            traces_to: row.tracesTo,
            linked_risks: row.linkedRisks,
            verification_status: row.verificationStatus,
            component_id: row.resolvedComponentId || null,
          },
          'hardware'
        );
        succeeded++;
        if (row.resolvedComponentId) linked++;
      }

      qc.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'hardware'] });
      toast.success(`Imported ${succeeded} requirements${linked > 0 ? `, ${linked} linked to components` : ''}`);
      handleClose(false);
    } catch (err: any) {
      console.error('HWR import failed:', err);
      toast.error(`Import failed after ${succeeded} rows: ${err.message || 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  const linkedCount = rows.filter(r => r.resolvedComponentId).length;
  const unmatchedCount = rows.filter(r => r.linkedComponentPartNumber && !r.resolvedComponentId).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Hardware Requirements
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
            onClick={() => document.getElementById('hwr-import-file')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Drag & drop your Excel file here</p>
            <p className="text-sm text-muted-foreground mt-2">Supports .xlsx, .xls, .csv files</p>
            <button type="button" onClick={downloadTemplate} className="inline-block mt-3 text-sm text-primary underline hover:text-primary/80">
              Download template (.xlsx)
            </button>
            <input id="hwr-import-file" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Found {rows.length} requirements.</span>
                {linkedCount > 0 && (
                  <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent text-xs">
                    <Cpu className="h-3 w-3 mr-1" /> {linkedCount} linked to components
                  </Badge>
                )}
                {unmatchedCount > 0 && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" /> {unmatchedCount} unmatched part numbers
                  </Badge>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Traces To</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Component</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium max-w-[280px] truncate">{row.description}</TableCell>
                      <TableCell className="text-xs">{row.category || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.tracesTo || '—'}</TableCell>
                      <TableCell className="text-xs">{row.verificationStatus}</TableCell>
                      <TableCell className="text-xs">
                        {row.resolvedComponentName ? (
                          <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent text-xs">
                            <Cpu className="h-3 w-3 mr-1" /> {row.resolvedComponentName}
                          </Badge>
                        ) : row.linkedComponentPartNumber ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" /> {row.linkedComponentPartNumber}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
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
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold">{rows.length}</div><p className="text-sm text-muted-foreground">Total requirements</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-primary">{linkedCount}</div><p className="text-sm text-muted-foreground">Linked to components</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold text-orange-600">{unmatchedCount}</div><p className="text-sm text-muted-foreground">Unmatched part #s</p></CardContent></Card>
            </div>
            {unmatchedCount > 0 && (
              <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-md p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{unmatchedCount} rows reference component part numbers not found in the device architecture. These will be imported without a component link. You can assign them later via Edit.</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Each requirement will receive an auto-generated HWR-XXX ID. Requirements are inserted sequentially to ensure unique IDs.
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
                <><Check className="h-4 w-4 mr-1" /> Import {rows.length} Requirements</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
