import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { extractTextFromChecklistFile } from '@/utils/gapChecklistTextExtractor';
import { IEC_60601_FORM_FIELDS } from '@/config/gapIEC60601FormFields';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { GapAnalysisItem } from '@/types/client';

interface ImportChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  items: GapAnalysisItem[];
  onImportComplete: () => void;
}

interface MappingResult {
  section: string;
  fieldId: string;
  suggestedValue: string;
  confidence: number;
  fieldLabel?: string;
  stepLabel?: string;
  selected: boolean;
}

type Stage = 'upload' | 'processing' | 'review' | 'applying' | 'done';

export function ImportChecklistDialog({
  open,
  onOpenChange,
  productId,
  items,
  onImportComplete,
}: ImportChecklistDialogProps) {
  const [stage, setStage] = useState<Stage>('upload');
  const [mappings, setMappings] = useState<MappingResult[]>([]);
  const [fileName, setFileName] = useState('');

  const resetState = () => {
    setStage('upload');
    setMappings([]);
    setFileName('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  // Build flat list of all clause fields for the AI
  const clauseFields = useMemo(() => {
    const fields: any[] = [];
    for (const [section, config] of Object.entries(IEC_60601_FORM_FIELDS)) {
      for (const step of config.steps) {
        for (const field of step.fields || []) {
          const options = field.options?.map(o => typeof o === 'string' ? o : o.value).join(', ');
          fields.push({
            section,
            stepLabel: step.stepLabel,
            fieldId: field.id,
            fieldLabel: field.label,
            fieldType: field.type,
            options: options || undefined,
          });
        }
      }
    }
    return fields;
  }, []);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setStage('processing');

    try {
      // Step 1: Extract text
      const text = await extractTextFromChecklistFile(file);
      if (!text || text.trim().length < 20) {
        throw new Error('Could not extract meaningful text from the document.');
      }

      // Step 2: Call AI edge function
      const { data, error } = await supabase.functions.invoke('ai-gap-checklist-import', {
        body: { extractedText: text, clauseFields },
      });

      if (error) throw error;
      if (!data?.mappings?.length) {
        toast.error('No matching fields found in the document.');
        setStage('upload');
        return;
      }

      // Enrich mappings with labels
      const enriched: MappingResult[] = data.mappings.map((m: any) => {
        const config = IEC_60601_FORM_FIELDS[m.section];
        let fieldLabel = m.fieldId;
        let stepLabel = '';
        if (config) {
          for (const step of config.steps) {
            const f = step.fields?.find(f => f.id === m.fieldId);
            if (f) {
              fieldLabel = f.label;
              stepLabel = step.stepLabel;
              break;
            }
          }
        }
        return {
          ...m,
          fieldLabel,
          stepLabel,
          selected: m.confidence >= 0.5,
        };
      });

      setMappings(enriched);
      setStage('review');
    } catch (e: any) {
      console.error('Import failed:', e);
      toast.error(e.message || 'Import failed');
      setStage('upload');
    }
  };

  const handleApply = async () => {
    const selected = mappings.filter(m => m.selected);
    if (!selected.length) return;

    setStage('applying');
    try {
      // Group by section
      const bySection = new Map<string, MappingResult[]>();
      for (const m of selected) {
        const arr = bySection.get(m.section) || [];
        arr.push(m);
        bySection.set(m.section, arr);
      }

      // For each section, find the gap_analysis_item and write __imported keys
      for (const [section, sectionMappings] of bySection) {
        const item = items.find((i: any) => i.section === section);
        if (!item) continue;

        const currentResponses = (item as any).form_responses || {};
        const updates: Record<string, any> = {};
        for (const m of sectionMappings) {
          updates[`${m.fieldId}__imported`] = m.suggestedValue;
        }

        await supabase
          .from('gap_analysis_items')
          .update({ form_responses: { ...currentResponses, ...updates } as any })
          .eq('id', item.id);
      }

      toast.success(`Imported ${selected.length} field(s). Review them in each clause form.`);
      setStage('done');
      onImportComplete();
      setTimeout(() => handleOpenChange(false), 1500);
    } catch (e: any) {
      console.error('Apply failed:', e);
      toast.error('Failed to apply imported values');
      setStage('review');
    }
  };

  const toggleMapping = (idx: number) => {
    setMappings(prev => prev.map((m, i) => i === idx ? { ...m, selected: !m.selected } : m));
  };

  const toggleAll = (checked: boolean) => {
    setMappings(prev => prev.map(m => ({ ...m, selected: checked })));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && handleFile(files[0]),
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
    disabled: stage !== 'upload',
  });

  const selectedCount = mappings.filter(m => m.selected).length;

  // Group mappings by section for display
  const groupedMappings = useMemo(() => {
    const groups = new Map<string, MappingResult[]>();
    mappings.forEach((m, idx) => {
      const key = `§${m.section}`;
      const arr = groups.get(key) || [];
      arr.push({ ...m, selected: mappings[idx].selected });
      groups.set(key, arr);
    });
    return groups;
  }, [mappings]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Import from Document
          </DialogTitle>
          <DialogDescription>
            Upload a filled IEC 60601-1 checklist. AI will extract answers and map them to the gap analysis fields.
          </DialogDescription>
        </DialogHeader>

        {/* Upload Stage */}
        {stage === 'upload' && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Drop your checklist here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, DOCX, XLSX, TXT · Max 20MB
            </p>
          </div>
        )}

        {/* Processing Stage */}
        {stage === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Analyzing "{fileName}"...</p>
              <p className="text-xs text-muted-foreground mt-1">Extracting text and mapping to IEC 60601-1 fields</p>
            </div>
          </div>
        )}

        {/* Review Stage */}
        {stage === 'review' && (
          <>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCount === mappings.length}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                />
                <span className="text-sm font-medium">{selectedCount}/{mappings.length} selected</span>
              </div>
              <span className="text-xs text-muted-foreground">{fileName}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              {Array.from(groupedMappings.entries()).map(([sectionKey, sectionMappings]) => (
                <div key={sectionKey}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {sectionKey}
                  </h4>
                  <div className="space-y-1.5">
                    {sectionMappings.map((m) => {
                      const globalIdx = mappings.findIndex(
                        gm => gm.section === m.section && gm.fieldId === m.fieldId
                      );
                      return (
                        <label
                          key={m.fieldId}
                          className={cn(
                            "flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-colors",
                            mappings[globalIdx]?.selected
                              ? "border-primary/30 bg-primary/5"
                              : "border-border hover:bg-muted/30"
                          )}
                        >
                          <Checkbox
                            checked={mappings[globalIdx]?.selected}
                            onCheckedChange={() => toggleMapping(globalIdx)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{m.fieldLabel}</span>
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                m.confidence >= 0.8 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : m.confidence >= 0.5 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}>
                                {Math.round(m.confidence * 100)}%
                              </span>
                            </div>
                            {m.stepLabel && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">{m.stepLabel}</p>
                            )}
                            <p className="text-xs mt-1 text-foreground/80 line-clamp-2">
                              "{m.suggestedValue}"
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={selectedCount === 0}>
                <Check className="h-4 w-4 mr-1.5" />
                Apply {selectedCount} Field{selectedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}

        {/* Applying Stage */}
        {stage === 'applying' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
            <p className="text-sm font-medium">Applying imported values...</p>
          </div>
        )}

        {/* Done Stage */}
        {stage === 'done' && (
          <div className="py-12 text-center space-y-4">
            <Check className="h-10 w-10 mx-auto text-emerald-500" />
            <p className="text-sm font-medium">Import complete!</p>
            <p className="text-xs text-muted-foreground">
              Review imported fields in each clause — they'll have a yellow highlight.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
