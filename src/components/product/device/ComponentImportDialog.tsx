import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ComponentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

type Step = 'upload' | 'preview' | 'import';

interface ParsedRow {
  name: string;
  type: 'hardware' | 'software' | 'sub_assembly';
  parentName: string;
  description: string;
  partNumber: string;
}

function parseType(val: string): 'hardware' | 'software' | 'sub_assembly' {
  const v = (val || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (v === 'software') return 'software';
  if (v === 'sub_assembly') return 'sub_assembly';
  return 'hardware';
}


export function ComponentImportDialog({ open, onOpenChange, productId, companyId }: ComponentImportDialogProps) {
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
        if (!json.length) {
          toast.error('No data found in spreadsheet');
          return;
        }
        const parsed: ParsedRow[] = json.map(row => ({
          name: (row['Name'] || row['name'] || '').trim(),
          type: parseType(row['Type'] || row['type'] || row['Component Type'] || ''),
          parentName: (() => {
            const raw = (row['Parent Name'] || row['Parent'] || row['parent_name'] || '').trim();
            return /^\(?root\)?$/i.test(raw) ? '' : raw;
          })(),
          description: (row['Description'] || row['description'] || '').trim(),
          partNumber: (row['BOM Part Number'] || row['Part Number'] || row['part_number'] || '').trim(),
          
        })).filter(r => r.name);

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
      ['Component ID', 'Name', 'Type', 'Parent Name', 'Description', 'BOM Part Number'],
      ['COMP-001', 'E-Link Control Center', 'sub_assembly', '', 'Central electronics hub', ''],
      ['COMP-002', '10" Touchscreen Terminal', 'hardware', 'E-Link Control Center', 'User interface display', 'DHS-ELC-010'],
      ['COMP-003', 'RFID Module', 'hardware', 'E-Link Control Center', 'Member identification', 'DHS-ELC-020'],
      ['COMP-004', 'Structural Chassis', 'sub_assembly', '', 'Main frame assembly', ''],
      ['COMP-005', 'Main Frame', 'hardware', 'Structural Chassis', 'Primary structural frame', 'DHS-STR-G660'],
    ];
    const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
    wsTemplate['!cols'] = templateData[0].map((h: string) => ({ wch: Math.max(h.length + 8, 20) }));

    const instructionsData = [
      ['Column Name', 'Required', 'Description', 'Valid Values'],
      ['Component ID', 'No', 'Auto-generated identifier (COMP-XXX). For reference only — ignored during import.', 'e.g. COMP-001'],
      ['Name', 'Yes', 'Component name', 'Any text'],
      ['Type', 'No', 'Component type (defaults to hardware)', 'hardware, software, sub_assembly'],
      ['Parent Name', 'No', 'Name of parent component for hierarchy', 'Must match another row\'s Name'],
      ['Description', 'No', 'Component description', 'Any text'],
      ['BOM Part Number', 'No', 'Links to BOM items via internal part number', 'e.g. DHS-ELC-010'],
      
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 50 }, { wch: 40 }];

    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    XLSX.writeFile(wb, 'component-import-template.xlsx');
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      // Build name-to-row map for parent resolution
      const nameMap = new Map<string, string>(); // name -> inserted id

      // Separate roots and children
      const roots = rows.filter(r => !r.parentName);
      const children = rows.filter(r => r.parentName);

      // Insert roots first
      for (const row of roots) {
        const { data, error } = await supabase
          .from('device_components')
          .insert({
            product_id: productId,
            company_id: companyId,
            name: row.name,
            description: row.description,
            component_type: row.type,
            parent_id: null,
            sort_order: 0,
            part_number: row.partNumber || null,
          } as any)
          .select('id')
          .single();
        if (error) throw error;
        nameMap.set(row.name, data.id);
      }

      // Insert children (resolve parent by name), iterate until all resolved or stuck
      let remaining = [...children];
      let maxIterations = 10;
      while (remaining.length > 0 && maxIterations > 0) {
        const nextRemaining: ParsedRow[] = [];
        for (const row of remaining) {
          const parentId = nameMap.get(row.parentName);
          if (parentId) {
            const { data, error } = await supabase
              .from('device_components')
              .insert({
                product_id: productId,
                company_id: companyId,
                name: row.name,
                description: row.description,
                component_type: row.type,
                parent_id: null,
                sort_order: 0,
                part_number: row.partNumber || null,
                
              } as any)
              .select('id')
              .single();
            if (error) throw error;
            nameMap.set(row.name, data.id);
            // Create hierarchy link
            await supabase.from('device_component_hierarchy').insert({
              parent_id: parentId,
              child_id: data.id,
            } as any);
          } else {
            nextRemaining.push(row);
          }
        }
        remaining = nextRemaining;
        maxIterations--;
      }

      if (remaining.length > 0) {
        toast.warning(`${remaining.length} components skipped (unresolved parent names)`);
      }

      qc.invalidateQueries({ queryKey: ['device-components', productId] });
      toast.success(`Imported ${rows.length - remaining.length} components`);
      handleClose(false);
    } catch (err: any) {
      console.error('Component import failed:', err);
      toast.error(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  const rootCount = rows.filter(r => !r.parentName).length;
  const childCount = rows.filter(r => r.parentName).length;
  

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Device Components
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
            onClick={() => document.getElementById('component-import-file')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Drag & drop your Excel file here</p>
            <p className="text-sm text-muted-foreground mt-2">Supports .xlsx, .xls, .csv files</p>
            <button type="button" onClick={downloadTemplate} className="inline-block mt-3 text-sm text-primary underline hover:text-primary/80">
              Download template (.xlsx)
            </button>
            <input id="component-import-file" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {rows.length} components ({rootCount} root, {childCount} children).
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Parent</TableHead>
                    <TableHead className="text-xs">Part #</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium">{row.name}</TableCell>
                      <TableCell className="text-xs">{row.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.parentName || '—'}</TableCell>
                      <TableCell className="text-xs">{row.partNumber || '—'}</TableCell>
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
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold">{rows.length}</div><p className="text-sm text-muted-foreground">Total components</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold">{rootCount}</div><p className="text-sm text-muted-foreground">Root components</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><div className="text-3xl font-bold">{childCount}</div><p className="text-sm text-muted-foreground">Child components</p></CardContent></Card>
            </div>
            <p className="text-sm text-muted-foreground">
              Components will be inserted with hierarchy resolved by parent name matching. Root components are inserted first, then children in dependency order.
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
                <><Check className="h-4 w-4 mr-1" /> Import {rows.length} Components</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
