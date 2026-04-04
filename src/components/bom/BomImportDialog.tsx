import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useTranslation } from '@/hooks/useTranslation';

interface BomImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisionId: string;
  productId: string;
}

type Step = 'upload' | 'map' | 'review';

const BOM_FIELDS = [
  { key: 'skip', label: '— Skip —' },
  { key: 'description', label: 'Description *' },
  { key: 'item_number', label: 'Item Number' },
  { key: 'internal_part_number', label: 'Internal Part Number' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit_of_measure', label: 'Unit of Measure' },
  { key: 'unit_cost', label: 'Unit Cost' },
  { key: 'material_name', label: 'Material Name' },
  { key: 'material_specification', label: 'Material Specification' },
  { key: 'supplier_part_number', label: 'Supplier Part Number' },
  { key: 'reference_designator', label: 'Reference Designator' },
  { key: 'notes', label: 'Notes' },
  { key: 'rohs_compliant', label: 'RoHS Compliant' },
  { key: 'reach_compliant', label: 'REACH Compliant' },
  { key: 'drawing_url', label: 'Drawing URL' },
  { key: 'sterilization_compatible', label: 'Sterilization Compatible' },
  { key: 'lead_time_days', label: 'Lead Time (days)' },
  { key: 'shelf_life_days', label: 'Shelf Life (days)' },
  { key: 'biocompatibility_notes', label: 'Biocompatibility Notes' },
  { key: 'category', label: 'Category' },
] as const;

// Auto-mapping dictionary
const AUTO_MAP: Record<string, string> = {
  'part number': 'internal_part_number',
  'part #': 'internal_part_number',
  'part#': 'internal_part_number',
  'p/n': 'internal_part_number',
  'pn': 'internal_part_number',
  'internal part number': 'internal_part_number',
  'description': 'description',
  'desc': 'description',
  'name': 'description',
  'component': 'description',
  'qty': 'quantity',
  'quantity': 'quantity',
  'uom': 'unit_of_measure',
  'unit': 'unit_of_measure',
  'unit of measure': 'unit_of_measure',
  'unit cost': 'unit_cost',
  'price': 'unit_cost',
  'cost': 'unit_cost',
  'supplier': 'supplier_part_number',
  'supplier part': 'supplier_part_number',
  'supplier part number': 'supplier_part_number',
  'material': 'material_name',
  'material name': 'material_name',
  'material spec': 'material_specification',
  'material specification': 'material_specification',
  'specification': 'material_specification',
  'rohs': 'rohs_compliant',
  'reach': 'reach_compliant',
  'item': 'item_number',
  'item number': 'item_number',
  'item #': 'item_number',
  'item no': 'item_number',
  'reference': 'reference_designator',
  'ref des': 'reference_designator',
  'reference designator': 'reference_designator',
  'notes': 'notes',
  'note': 'notes',
  'drawing': 'drawing_url',
  'drawing url': 'drawing_url',
  'cad': 'drawing_url',
  'lead time': 'lead_time_days',
  'leadtime': 'lead_time_days',
  'shelf life': 'shelf_life_days',
  'sterilization': 'sterilization_compatible',
  'category': 'category',
};

function autoMapHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const used = new Set<string>();

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    const match = AUTO_MAP[normalized];
    if (match && !used.has(match)) {
      mapping[header] = match;
      used.add(match);
    } else {
      mapping[header] = 'skip';
    }
  }
  return mapping;
}

function parseBooleanField(val: string | undefined): boolean | null {
  if (!val) return null;
  const v = val.toLowerCase().trim();
  if (['yes', 'true', '1', 'y', 'compliant'].includes(v)) return true;
  if (['no', 'false', '0', 'n', 'non-compliant', 'non compliant'].includes(v)) return false;
  return null;
}

export function BomImportDialog({ open, onOpenChange, revisionId, productId }: BomImportDialogProps) {
  const { lang } = useTranslation();
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const qc = useQueryClient();

  const reset = useCallback(() => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setImporting(false);
    setFileName('');
  }, []);

  const handleClose = useCallback((val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  }, [onOpenChange, reset]);

  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (!result.data?.length) {
            toast.error(lang('bom.noDataFound'));
            return;
          }
          const hdrs = result.meta.fields || [];
          setHeaders(hdrs);
          setRows(result.data as Record<string, string>[]);
          setMapping(autoMapHeaders(hdrs));
          setStep('map');
        },
        error: () => toast.error(lang('bom.failedParseCsv')),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: 'binary' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
          if (!json.length) {
            toast.error(lang('bom.noDataSpreadsheet'));
            return;
          }
          const hdrs = Object.keys(json[0]);
          setHeaders(hdrs);
          setRows(json);
          setMapping(autoMapHeaders(hdrs));
          setStep('map');
        } catch {
          toast.error(lang('bom.failedParseExcel'));
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error(lang('bom.unsupportedFileType'));
    }
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

  const mappedFieldCount = Object.values(mapping).filter(v => v !== 'skip').length;
  const hasDescription = Object.values(mapping).includes('description');

  // Build preview of mapped data
  const previewItems = rows.slice(0, 5).map(row => {
    const item: Record<string, string> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (field !== 'skip') {
        item[field] = row[header] || '';
      }
    }
    return item;
  });

  const handleImport = async () => {
    setImporting(true);
    try {
      // Get current item count for sort_order
      const { data: existingItems } = await supabase
        .from('bom_items')
        .select('id')
        .eq('bom_revision_id', revisionId);
      let sortStart = existingItems?.length || 0;

      const batchItems = rows.map((row, idx) => {
        const item: Record<string, any> = {
          bom_revision_id: revisionId,
          description: 'Imported item',
          sort_order: sortStart + idx,
        };

        for (const [header, field] of Object.entries(mapping)) {
          if (field === 'skip') continue;
          const val = String(row[header] ?? '').trim();
          if (!val) continue;

          switch (field) {
            case 'quantity':
            case 'unit_cost':
            case 'lead_time_days':
            case 'shelf_life_days':
              item[field] = Number(val) || 0;
              break;
            case 'rohs_compliant':
            case 'reach_compliant':
              item[field] = parseBooleanField(val);
              break;
            case 'category': {
              const VALID_CATEGORIES = ['purchased_part', 'manufactured_part', 'raw_material', 'sub_assembly', 'consumable'];
              const lower = val.toLowerCase().replace(/[\s-]+/g, '_');
              if (VALID_CATEGORIES.includes(lower)) {
                item[field] = lower;
              }
              // else: skip invalid category, let DB use default null
              break;
            }
            default:
              item[field] = val;
          }
        }

        // Auto-generate item_number if not mapped
        if (!item.item_number) {
          item.item_number = `${sortStart + idx + 1}.0`;
        }

        return item;
      });

      // Filter out rows with no description
      const validItems = batchItems.filter(i => i.description && i.description !== 'Imported item');
      if (!validItems.length) {
        toast.error(lang('bom.noValidItems'));
        setImporting(false);
        return;
      }

      // Batch insert (Supabase limit is 1000 per call)
      const BATCH_SIZE = 500;
      for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
        const batch = validItems.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('bom_items').insert(batch as any);
        if (error) throw error;
      }

      // Recalculate total cost
      const { data: allItems } = await supabase
        .from('bom_items')
        .select('extended_cost')
        .eq('bom_revision_id', revisionId);
      const total = (allItems || []).reduce((sum, i) => sum + (Number(i.extended_cost) || 0), 0);
      await supabase.from('bom_revisions').update({ total_cost: total }).eq('id', revisionId);

      qc.invalidateQueries({ queryKey: ['bom-items', revisionId] });
      qc.invalidateQueries({ queryKey: ['bom-revisions'] });

      // Auto-link BOM items to device components by matching internal_part_number
      try {
        const { data: components } = await supabase
          .from('device_components')
          .select('id, name, part_number')
          .eq('product_id', productId);
        
        if (components && components.length > 0) {
          const componentMap = new Map<string, string>();
          for (const c of components) {
            if ((c as any).part_number) componentMap.set((c as any).part_number, c.id);
            componentMap.set(c.name.toLowerCase(), c.id);
          }

          // Fetch just-inserted items that have internal_part_number
          const { data: insertedItems } = await supabase
            .from('bom_items')
            .select('id, internal_part_number')
            .eq('bom_revision_id', revisionId)
            .not('internal_part_number', 'is', null);

          let linkedCount = 0;
          if (insertedItems) {
            for (const item of insertedItems) {
              if (!item.internal_part_number) continue;
              const compId = componentMap.get(item.internal_part_number) || componentMap.get(item.internal_part_number.toLowerCase());
              if (compId) {
                await supabase.from('bom_items').update({ component_id: compId } as any).eq('id', item.id);
                linkedCount++;
              }
            }
          }
          if (linkedCount > 0) {
            toast.success(lang('bom.autoLinkedItems', { count: linkedCount }));
          }
        }
      } catch (linkErr) {
        console.warn('Auto-link step failed (non-critical):', linkErr);
      }

      toast.success(lang('bom.importedItems', { count: validItems.length }));
      handleClose(false);
    } catch (err: any) {
      console.error('Import failed:', err);
      toast.error(`${lang('bom.importFailed')}: ${err.message || 'Unknown error'}`);
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
            {lang('bom.importBomItems')}
            {fileName && <Badge variant="outline" className="ml-2 font-normal">{fileName}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 text-sm mb-2">
          <Badge variant={step === 'upload' ? 'default' : 'outline'}>{lang('bom.stepUpload')}</Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant={step === 'map' ? 'default' : 'outline'}>{lang('bom.stepMapColumns')}</Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant={step === 'review' ? 'default' : 'outline'}>{lang('bom.stepReviewImport')}</Badge>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('bom-import-file')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{lang('bom.dragDropFile')}</p>
            <p className="text-sm text-muted-foreground mt-2">{lang('bom.supportsFormats')}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const wb = XLSX.utils.book_new();

                // Template sheet with headers + example rows
                const templateData = [
                  ['Item Number', 'Description', 'Internal Part Number', 'Quantity', 'Unit of Measure', 'Unit Cost', 'Material Name', 'Material Specification', 'Supplier Part Number', 'Category', 'Reference Designator', 'RoHS Compliant', 'REACH Compliant', 'Drawing URL', 'Sterilization Compatible', 'Lead Time (days)', 'Shelf Life (days)', 'Biocompatibility Notes', 'Notes'],
                  [100, 'Housing Assembly', 'DHS-MEC-001', 1, 'EA', 45.00, '316L Stainless Steel', 'ASTM F138', 'SUP-12345', 'manufactured_part', 'H1', 'Yes', 'Yes', 'https://example.com/drawing.pdf', 'EtO', 30, 365, 'ISO 10993 tested', 'Main structural component'],
                  [200, 'Sensor Module', 'DHS-ELC-002', 2, 'EA', 12.50, 'FR-4 PCB', '', 'SUP-67890', 'purchased_part', 'S1', 'Yes', 'Not Assessed', '', 'N/A', 14, '', '', 'Temperature sensor'],
                  [300, 'Biocompatible Seal', 'DHS-RAW-003', 4, 'EA', 3.25, 'Silicone', 'USP Class VI', '', 'raw_material', 'B1', 'Yes', 'Yes', '', 'Autoclave', 60, 180, 'ISO 10993-5 cytotoxicity pass', 'Patient-contacting seal'],
                ];
                const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
                wsTemplate['!cols'] = templateData[0].map((h: string) => ({ wch: Math.max(h.length + 4, 18) }));

                // Instructions sheet
                const instructionsData = [
                  ['Column Name', 'Required', 'Description', 'Valid Values', 'Example'],
                  ['Item Number', 'No', 'Sort order / BOM line number', 'Any number', '100'],
                  ['Description', 'Yes', 'Short name for the BOM item', 'Any text', 'Housing Assembly'],
                  ['Internal Part Number', 'No', 'Your internal part ID', 'Any text', 'DHS-MEC-001'],
                  ['Quantity', 'Yes', 'Number of units needed', 'Any number', '4'],
                  ['Unit of Measure', 'No', 'Measurement unit (defaults to EA)', 'EA, KG, M, L, etc.', 'EA'],
                  ['Unit Cost', 'No', 'Cost per unit in your currency', 'Any number', '45.00'],
                  ['Material Name', 'No', 'Primary material used', 'Any text', '316L Stainless Steel'],
                  ['Material Specification', 'No', 'Material standard or spec', 'Any text', 'ASTM F138'],
                  ['Supplier Part Number', 'No', "Supplier's part ID", 'Any text', 'SUP-12345'],
                  ['Category', 'No', 'Item classification', 'manufactured_part, purchased_part, raw_material, sub_assembly, consumable', 'manufactured_part'],
                  ['Reference Designator', 'No', 'Schematic reference ID', 'Any text', 'H1'],
                  ['RoHS Compliant', 'No', 'RoHS compliance status', 'Yes, No, Not Assessed', 'Yes'],
                  ['REACH Compliant', 'No', 'REACH compliance status', 'Yes, No, Not Assessed', 'Yes'],
                  ['Drawing URL', 'No', 'Link to CAD drawing or spec', 'Any URL', 'https://example.com/drawing.pdf'],
                  ['Sterilization Compatible', 'No', 'Compatible sterilization method', 'EtO, Autoclave, Gamma, N/A', 'EtO'],
                  ['Lead Time (days)', 'No', 'Supplier lead time in days', 'Any number', '30'],
                  ['Shelf Life (days)', 'No', 'Material shelf life in days', 'Any number', '365'],
                  ['Biocompatibility Notes', 'No', 'Biocompatibility testing notes', 'Any text', 'ISO 10993 tested'],
                  ['Notes', 'No', 'General notes or comments', 'Any text', 'Main structural component'],
                ];
                const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
                wsInstructions['!cols'] = [{ wch: 24 }, { wch: 10 }, { wch: 36 }, { wch: 50 }, { wch: 30 }];

                XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template');
                XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
                XLSX.writeFile(wb, 'bom-import-template.xlsx');
              }}
              className="inline-block mt-3 text-sm text-primary underline hover:text-primary/80"
            >
              {lang('bom.downloadTemplate')}
            </button>
            <input
              id="bom-import-file"
              type="file"
              accept=".csv,.xlsx,.xls,.tsv,.txt"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}

        {/* Step 2: Map Columns */}
        {step === 'map' && (
          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {lang('bom.mapColumnsInfo', { count: mappedFieldCount, total: headers.length })}
              </p>
              {!hasDescription && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4" />
                  {lang('bom.descriptionRequired2')}
                </div>
              )}
              <div className="space-y-2">
                {headers.map(header => (
                  <div key={header} className="flex items-center gap-3">
                    <div className="w-1/3 text-sm font-medium truncate" title={header}>{header}</div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Select value={mapping[header] || 'skip'} onValueChange={v => setMapping(prev => ({ ...prev, [header]: v }))}>
                      <SelectTrigger className="w-2/3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOM_FIELDS.map(f => (
                          <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              {previewItems.length > 0 && (
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium mb-2">{lang('bom.previewRows', { count: previewItems.length })}</p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.entries(mapping).filter(([, v]) => v !== 'skip').map(([, field]) => (
                              <TableHead key={field} className="text-xs whitespace-nowrap">{BOM_FIELDS.find(f => f.key === field)?.label || field}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewItems.map((item, i) => (
                            <TableRow key={i}>
                              {Object.entries(mapping).filter(([, v]) => v !== 'skip').map(([, field]) => (
                                <TableCell key={field} className="text-xs">{item[field] || '—'}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold">{rows.length}</div>
                  <p className="text-sm text-muted-foreground">{lang('bom.totalRows')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold">{mappedFieldCount}</div>
                  <p className="text-sm text-muted-foreground">{lang('bom.mappedFields')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {rows.filter(r => {
                      const descHeader = Object.entries(mapping).find(([, v]) => v === 'description')?.[0];
                      return descHeader && r[descHeader]?.trim();
                    }).length}
                  </div>
                  <p className="text-sm text-muted-foreground">{lang('bom.validItems')}</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-sm text-muted-foreground">
              {lang('bom.reviewImportInfo')}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== 'upload' && (
            <Button variant="outline" onClick={() => setStep(step === 'review' ? 'map' : 'upload')} disabled={importing}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {lang('bom.back')}
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>{lang('common.cancel')}</Button>
          {step === 'map' && (
            <Button onClick={() => setStep('review')} disabled={!hasDescription}>
              {lang('bom.review')} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 'review' && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? lang('bom.importing') : (
                <>
                  <Check className="h-4 w-4 mr-1" /> {lang('bom.importItems', { count: rows.length })}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
