import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Save, CheckCircle, Link2, Sparkles, Loader2, FileText, Check, X } from 'lucide-react';
import { IEC_60601_FORM_FIELDS, type ClauseField, type ClauseFieldOption, type ClauseTable, type ClauseStep } from '@/config/gapIEC60601FormFields';
import { IEC_60601_SSOT_FIELD_MAP, IEC_60601_DERIVED_SSOT_FIELDS } from '@/config/gapIEC60601SsotMapping';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ClauseEvidencePanel } from './ClauseEvidencePanel';
import { RichTextField } from '@/components/shared/RichTextField';
import { LinkedHazardsPicker } from './LinkedHazardsPicker';
import { InlineDocReference, type DocReferenceValue } from './InlineDocReference';
import { CollateralAIAssessButton } from './CollateralAIAssessButton';
import { StepAIAssessButton } from './StepAIAssessButton';

/** SSOT tech specs prop: value + onChange for each mapped field */
export type SsotTechSpecs = Record<string, { value: string; onChange: (v: string) => void }>;

/** Derived SSOT fields (from product columns, not key_technology_characteristics) */
export type DerivedSsotFields = Record<string, { value: string; sourceLabel: string; readOnly?: boolean; onChange?: (v: string) => void }>;

interface IEC60601ClauseFormProps {
  itemId: string;
  section: string;
  initialResponses?: Record<string, any>;
  currentStepIndex?: number;
  onStepChange?: (index: number) => void;
  onStepsInfo?: (steps: { id: string; label: string; complete: boolean }[]) => void;
  productId?: string;
  companyId?: string;
  /** Optional: pass a different framework's form fields map (defaults to IEC 60601) */
  formFields?: Record<string, import('@/config/gapIEC60601FormFields').ClauseFormConfig>;
  /** SSOT: intended_use_category from product intended_purpose_data */
  ssotIntendedUseCategory?: string;
  onSsotIntendedUseCategoryChange?: (value: string) => void;
  /** SSOT: energy transfer direction (kept for backward compat, also in ssotTechSpecs) */
  ssotEnergyTransfer?: string;
  onSsotEnergyTransferChange?: (value: string) => void;
  ssotEnergyType?: string;
  onSsotEnergyTypeChange?: (value: string) => void;
  /** Device components for applied parts SSOT */
  deviceComponents?: { id: string; name: string }[];
  /** All SSOT tech specs mapped fields */
  ssotTechSpecs?: SsotTechSpecs;
  /** Derived SSOT fields (IVD exclusion, ME rationale, etc.) */
  derivedSsotFields?: DerivedSsotFields;
  /** Essential Performance features from intended_purpose_data (SSOT) */
  ssotEssentialPerformance?: string[];
  /** If true, all form fields are read-only (e.g. inherited items) */
  formReadOnly?: boolean;
  /** Framework identifier for AI context (e.g. 'IEC 60601-1', 'MDR Annex II') */
  frameworkId?: string;
}

function isFieldFilled(val: any): boolean {
  if (val === null || val === undefined) return false;
  // doc_reference fields store { documents: [], urls: [], comment: '', documentStatuses: {} }
  // A doc_reference is only "filled" when an actual document or URL is linked,
  // AND all linked documents must have approved/completed status.
  if (typeof val === 'object' && !Array.isArray(val)) {
    const hasDocuments = Array.isArray(val.documents) && val.documents.length > 0;
    const hasUrls = Array.isArray(val.urls) && val.urls.length > 0;
    if (!hasDocuments && !hasUrls) return false;
    // If documents are linked, verify all are approved
    if (hasDocuments && val.documentStatuses) {
      const allApproved = val.documents.every((docId: string) => {
        const status = (val.documentStatuses?.[docId] || '').toLowerCase();
        return status === 'approved' || status === 'completed';
      });
      if (!allApproved) return false;
    }
    return true;
  }
  return String(val).trim().length > 0;
}

export function isStepComplete(step: ClauseStep, responses: Record<string, any>): boolean {
  // If step has fields, ALL non-optional fields must have data
  if (step.fields && step.fields.length > 0) {
    const requiredFields = step.fields.filter(f => f.required !== false);
    const allRequiredFilled = requiredFields.length === 0 || requiredFields.every(f => {
      return isFieldFilled(responses[f.id]);
    });
    if (!allRequiredFilled) return false;
  }

  // If step has tables, at least one table must have rows
  if (step.tables && step.tables.length > 0) {
    const hasTableData = step.tables.some(t => {
      const rows = responses[t.id];
      return Array.isArray(rows) && rows.length > 0;
    });
    if (!hasTableData) return false;
  }

  // Step must have at least some content
  const hasAnyContent = (step.fields?.some(f => {
    return isFieldFilled(responses[f.id]);
  }) || step.tables?.some(t => {
    const rows = responses[t.id];
    return Array.isArray(rows) && rows.length > 0;
  }));

  return !!hasAnyContent;
}

export function IEC60601ClauseForm({
  itemId,
  section,
  initialResponses,
  currentStepIndex: controlledStepIndex,
  onStepChange,
  onStepsInfo,
  productId,
  companyId,
  formFields,
  ssotIntendedUseCategory,
  onSsotIntendedUseCategoryChange,
  ssotEnergyTransfer,
  onSsotEnergyTransferChange,
  ssotEnergyType,
  onSsotEnergyTypeChange,
  deviceComponents,
  ssotTechSpecs,
  derivedSsotFields,
  ssotEssentialPerformance,
  formReadOnly = false,
  frameworkId,
}: IEC60601ClauseFormProps) {
  const queryClient = useQueryClient();
  const config = (formFields || IEC_60601_FORM_FIELDS)[section];
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses || {});
  const [internalStepIndex, setInternalStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debouncedResponses = useDebounce(responses, 1500);
  const initialLoad = useRef(true);
  const initialResponsesSynced = useRef(true);
  const responsesRef = useRef(responses);
  const hasPendingChanges = useRef(false);
  const skipNextInitialSyncForItemId = useRef<string | null>(null);

  // Keep ref in sync so unmount can access latest
  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  const currentStepIndex = controlledStepIndex ?? internalStepIndex;
  const setCurrentStepIndex = (idx: number | ((prev: number) => number)) => {
    const newIdx = typeof idx === 'function' ? idx(currentStepIndex) : idx;
    if (onStepChange) {
      onStepChange(newIdx);
    } else {
      setInternalStepIndex(newIdx);
    }
  };

  // Helper: resolve SSOT value/onChange for a field
  const getSsotForField = useCallback((fieldId: string): { value: string; onChange: (v: string) => void; sourceLabel?: string; readOnly?: boolean } | null => {
    // Derived SSOT fields (ivd_exclusion, me_rationale)
    if (derivedSsotFields?.[fieldId]) {
      const d = derivedSsotFields[fieldId];
      return { value: d.value, onChange: d.onChange || (() => {}), sourceLabel: d.sourceLabel, readOnly: d.readOnly };
    }
    // Legacy direct props
    if (fieldId === 'intended_use_category' && onSsotIntendedUseCategoryChange) {
      return { value: ssotIntendedUseCategory || '', onChange: onSsotIntendedUseCategoryChange };
    }
    if (fieldId === 'energy_transfer' && onSsotEnergyTransferChange) {
      return { value: ssotEnergyTransfer || '', onChange: onSsotEnergyTransferChange };
    }
    if (fieldId === 'energy_type' && onSsotEnergyTypeChange) {
      return { value: ssotEnergyType || '', onChange: onSsotEnergyTypeChange };
    }
    // New generic SSOT map
    const ssotKey = IEC_60601_SSOT_FIELD_MAP[fieldId];
    if (ssotKey && ssotTechSpecs?.[ssotKey]) {
      return ssotTechSpecs[ssotKey];
    }
    return null;
  }, [ssotIntendedUseCategory, onSsotIntendedUseCategoryChange, ssotEnergyTransfer, onSsotEnergyTransferChange, ssotEnergyType, onSsotEnergyTypeChange, ssotTechSpecs, derivedSsotFields]);

  // Sync SSOT values into local responses for completion tracking
  useEffect(() => {
    setResponses(prev => {
      const updates: Record<string, any> = {};
      // Check all SSOT fields
      const allFieldIds = config?.steps.flatMap(s => s.fields?.map(f => f.id) || []) || [];
      for (const fieldId of allFieldIds) {
        const ssot = getSsotForField(fieldId);
        if (ssot && ssot.value && prev[fieldId] !== ssot.value) {
          updates[fieldId] = ssot.value;
        }
      }
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
  }, [getSsotForField, config]);

  // Sync initialResponses prop changes into local state (after initial mount)
  // Skip only for the same item immediately after a successful save
  useEffect(() => {
    if (initialResponsesSynced.current) {
      initialResponsesSynced.current = false;
      return;
    }

    if (skipNextInitialSyncForItemId.current === itemId) {
      skipNextInitialSyncForItemId.current = null;
      return;
    }

    setResponses(initialResponses || {});
    hasPendingChanges.current = false;
  }, [initialResponses, itemId]);

  // Save on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (formReadOnly || !hasPendingChanges.current) {
        return;
      }

      const data = responsesRef.current;
      const allComplete = config?.steps.every(s => isStepComplete(s, data)) || false;
      const newStatus = allComplete ? 'compliant' : 'non_compliant';

      // Fire-and-forget save on unmount
      supabase
        .from('gap_analysis_items')
        .update({ form_responses: data as any, status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .then(({ error }) => {
          if (error) console.error('Save on unmount failed:', error);
          else queryClient.invalidateQueries({ queryKey: ['gap-analysis-item', itemId] });
        });
    };
  }, [itemId, config, queryClient, formReadOnly]);

  // Report step info to parent
  useEffect(() => {
    if (!config || !onStepsInfo) return;
    const stepsInfo = config.steps.map(s => ({
      id: s.id,
      label: s.stepLabel,
      complete: isStepComplete(s, responses),
    }));
    onStepsInfo(stepsInfo);
  }, [responses, config, onStepsInfo]);

  const saveResponses = useCallback(async (data: Record<string, any>) => {
    if (formReadOnly) return;
    setSaving(true);
    try {
      // Check if all steps are complete
      const allComplete = config?.steps.every(s => isStepComplete(s, data)) || false;
      const newStatus = allComplete ? 'compliant' : 'non_compliant';

      const { error } = await supabase
        .from('gap_analysis_items')
        .update({ form_responses: data as any, status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', itemId);
      if (error) throw error;

      // Skip one prop->state sync only for this same item (prevents stale refetch overwrite)
      skipNextInitialSyncForItemId.current = itemId;

      // Invalidate cache so navigation back shows fresh data
      await queryClient.invalidateQueries({ queryKey: ['gap-analysis-item', itemId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [itemId, config, formReadOnly, queryClient]);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    if (!hasPendingChanges.current) {
      return;
    }

    hasPendingChanges.current = false;
    saveResponses(debouncedResponses);
  }, [debouncedResponses, saveResponses]);

  const updateField = (fieldId: string, value: any) => {
    hasPendingChanges.current = true;
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const updateTableRow = (tableId: string, rowIndex: number, colIndex: number, value: string) => {
    hasPendingChanges.current = true;
    setResponses(prev => {
      const tableData = [...(prev[tableId] || [])];
      if (!tableData[rowIndex]) tableData[rowIndex] = {};
      tableData[rowIndex] = { ...tableData[rowIndex], [colIndex]: value };
      return { ...prev, [tableId]: tableData };
    });
  };

  const addTableRow = (tableId: string) => {
    hasPendingChanges.current = true;
    setResponses(prev => {
      const tableData = [...(prev[tableId] || [])];
      tableData.push({});
      return { ...prev, [tableId]: tableData };
    });
  };

  const removeTableRow = (tableId: string, rowIndex: number) => {
    hasPendingChanges.current = true;
    setResponses(prev => {
      const tableData = [...(prev[tableId] || [])];
      tableData.splice(rowIndex, 1);
      return { ...prev, [tableId]: tableData };
    });
  };

  if (!config) {
    return (
      <div className="text-sm text-muted-foreground italic p-4">
        No structured form template available for section {section}.
      </div>
    );
  }

  const steps = config.steps;
  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Clause Title */}
      <h2 className="text-lg font-semibold text-foreground mb-1">{config.clauseTitle}</h2>
      <p className="text-xs text-muted-foreground mb-6">
        Step {currentStepIndex + 1} of {steps.length} — {currentStep.stepLabel}
      </p>

      {/* Requirement Text */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 mb-6">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Requirement
        </h4>
        <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
          {currentStep.requirementText}
        </div>
      </div>

      {/* Supplementary Info */}
      {currentStep.supplementaryInfo && (
        <div className="rounded-lg border border-border bg-accent/20 p-4 mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Guidance
          </h4>
          <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {currentStep.supplementaryInfo}
          </div>
        </div>
      )}

      {/* Input Fields */}
      {currentStep.fields && currentStep.fields.length > 0 && (
        <div className="rounded-lg border border-border p-4 space-y-4 mb-6">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your Response
            </h4>
            <div className="flex items-center gap-2">
              {productId && (
              <StepAIAssessButton
                  productId={productId}
                  stepId={currentStep.id}
                  stepLabel={currentStep.stepLabel}
                  requirementText={currentStep.requirementText}
                  fields={currentStep.fields || []}
                  responses={responses}
                  onApply={(updates) => {
                    setResponses(prev => ({ ...prev, ...updates }));
                  }}
                  frameworkId={frameworkId}
                />
              )}
              {currentStep.id === '1.3_collateral' && productId && (
                <CollateralAIAssessButton
                  productId={productId}
                  onApply={(updates) => {
                    setResponses(prev => ({ ...prev, ...updates }));
                  }}
                />
              )}
            </div>
          </div>
          {currentStep.fields.map(field => {
            // SSOT Essential Performance display (read-only list from Device Definition)
            if ((field.type as string) === 'ssot_ep_display') {
              const epList = ssotEssentialPerformance || [];
              return (
                <div key={field.id} className="space-y-2">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      Synced with Device Definition → Purpose
                    </div>
                    {epList.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No essential performance features defined yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {epList.map((ep, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{ep}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="pt-1">
                      <a
                        href={`/products/${productId}/device-definition?tab=purpose&returnTo=gap-analysis`}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Link2 className="h-3 w-3" />
                        Edit in Device Definition →
                      </a>
                    </div>
                  </div>
                </div>
              );
            }

            // Hazard linker field type — renders LinkedHazardsPicker
            if (field.type === 'hazard_linker' && productId) {
              const linkedIds = Array.isArray(responses[field.id]) ? responses[field.id] : [];
              const notesKey = `${field.id}_notes`;
              return (
                <LinkedHazardsPicker
                  key={field.id}
                  productId={productId}
                  fieldId={field.id}
                  label={field.label}
                  value={linkedIds}
                  onChange={(ids) => updateField(field.id, ids as any)}
                  notesValue={responses[notesKey] || ''}
                  onNotesChange={(val) => updateField(notesKey, val)}
                  placeholder={field.placeholder}
                />
              );
            }

            // Doc reference field type — renders InlineDocReference
            if (field.type === 'doc_reference') {
              const refValue: DocReferenceValue = typeof responses[field.id] === 'object' && responses[field.id] !== null
                ? responses[field.id]
                : { documents: [], urls: [], comment: typeof responses[field.id] === 'string' ? responses[field.id] : '' };
              return (
                <InlineDocReference
                  key={field.id}
                  label={field.label}
                  value={refValue}
                  onChange={(val) => updateField(field.id, val as any)}
                  productId={productId}
                  companyId={companyId}
                  gapContext={config ? { section, framework: 'IEC_60601', clauseTitle: config.clauseTitle } : undefined}
                  required={field.required}
                />
              );
            }

            const ssot = getSsotForField(field.id);
            const isSsotField = !!ssot;
            const fieldValue = ssot ? ssot.value : (responses[field.id] || '');
            const fieldOnChange = ssot ? ssot.onChange : (val: string) => updateField(field.id, val);

            // Special renderer for applied_parts_list with device components
            if (field.id === 'applied_parts_list' && deviceComponents && deviceComponents.length > 0) {
              return (
                <AppliedPartsField
                  key={field.id}
                  field={field}
                  value={responses[field.id] || ''}
                  otherValue={responses['applied_parts_other'] || ''}
                  deviceComponents={deviceComponents}
                  onChange={(val) => updateField(field.id, val)}
                  onOtherChange={(val) => updateField('applied_parts_other', val)}
                />
              );
            }

            // Determine SSOT source label
            const ssotLabel = ssot?.sourceLabel 
              || (field.id === 'intended_use_category' ? 'Purpose'
              : IEC_60601_SSOT_FIELD_MAP[field.id] ? 'Technical Specs'
              : 'Technical Specs');
            const isReadOnly = !!(ssot as any)?.readOnly;

            return (
              <div key={field.id}>
                {/* Imported value highlight */}
                {responses[`${field.id}__imported`] !== undefined && (
                  <div className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-r-md p-3 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        <FileText className="h-3 w-3" />
                        Imported
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            const importedVal = responses[`${field.id}__imported`];
                            const updated = { ...responses };
                            updated[field.id] = importedVal;
                            delete updated[`${field.id}__imported`];
                            hasPendingChanges.current = true;
                            setResponses(updated);
                          }}
                          title="Accept imported value"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            const updated = { ...responses };
                            delete updated[`${field.id}__imported`];
                            hasPendingChanges.current = true;
                            setResponses(updated);
                          }}
                          title="Reject imported value"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-3">
                      "{responses[`${field.id}__imported`]}"
                    </p>
                  </div>
                )}
                {isSsotField && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 mb-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    Synced with Device Definition → {ssotLabel}
                    {isReadOnly && <span className="ml-1 text-muted-foreground">(read-only)</span>}
                  </div>
                )}
                <FieldRenderer
                  field={field}
                  value={fieldValue}
                  onChange={fieldOnChange}
                  productId={productId}
                  section={section}
                  requirementText={currentStep.requirementText}
                  readOnly={isReadOnly || formReadOnly}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Tables */}
      {currentStep.tables?.map(table => (
        <DynamicTable
          key={table.id}
          table={table}
          rows={responses[table.id] || []}
          onUpdateRow={(rowIdx, colIdx, val) => updateTableRow(table.id, rowIdx, colIdx, val)}
          onAddRow={() => addTableRow(table.id)}
          onRemoveRow={(rowIdx) => removeTableRow(table.id, rowIdx)}
        />
      ))}

      {/* Evidence & References */}
      {(productId || companyId) && (
        <ClauseEvidencePanel
          itemId={itemId}
          productId={productId}
          companyId={companyId}
          gapContext={config ? { section, framework: 'IEC_60601', clauseTitle: config.clauseTitle } : undefined}
          evidenceRequired={config?.evidenceRequired ?? true}
        />
      )}

      {/* Save indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4 pb-20">
        {saving && (
          <>
            <Save className="h-3 w-3 animate-pulse" />
            <span>Saving...</span>
          </>
        )}
        {saved && !saving && (
          <>
            <CheckCircle className="h-3 w-3 text-primary" />
            <span className="text-primary">Saved</span>
          </>
        )}
        {!saving && !saved && (
          <span>Auto-saves as you type</span>
        )}
      </div>
    </div>
  );
}

function AppliedPartsField({
  field,
  value,
  otherValue,
  deviceComponents,
  onChange,
  onOtherChange,
}: {
  field: ClauseField;
  value: string;
  otherValue: string;
  deviceComponents: { id: string; name: string }[];
  onChange: (val: string) => void;
  onOtherChange: (val: string) => void;
}) {
  const selectedNames = useMemo(() => {
    if (!value) return new Set<string>();
    return new Set(value.split(',').map(s => s.trim()).filter(Boolean));
  }, [value]);

  const toggleComponent = (name: string) => {
    const next = new Set(selectedNames);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    onChange(Array.from(next).join(', '));
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 mb-1 flex items-center gap-1">
        <Link2 className="h-3 w-3 text-primary" />
        Synced with Device Definition → Components
      </div>
      <Label className="text-sm font-medium">{field.label}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border border-border p-3">
        {deviceComponents.map(comp => (
          <label key={comp.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded px-2 py-1.5">
            <Checkbox
              checked={selectedNames.has(comp.name)}
              onCheckedChange={() => toggleComponent(comp.name)}
            />
            <span>{comp.name}</span>
          </label>
        ))}
      </div>
      <div className="mt-2">
        <Label className="text-xs text-muted-foreground">Other applied parts (not in component list)</Label>
        <RichTextField
          value={otherValue}
          onChange={onOtherChange}
          placeholder="Any additional applied parts not listed above..."
          minHeight="40px"
        />
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  productId,
  section,
  requirementText,
  readOnly,
}: {
  field: ClauseField;
  value: string;
  onChange: (val: string) => void;
  productId?: string;
  section?: string;
  requirementText?: string;
  readOnly?: boolean;
}) {
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiSuggest = async () => {
    if (!productId) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-gap-field-assist', {
        body: {
          productId,
          fieldLabel: field.label,
          fieldType: field.type,
          section,
          requirementText: requirementText?.substring(0, 500),
          currentValue: value,
        },
      });
      if (error) throw error;
      if (data?.suggestion) {
        onChange(data.suggestion);
      }
    } catch (e: any) {
      console.error('AI suggestion failed:', e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">{field.label}</Label>
        {productId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-amber-600"
            onClick={handleAiSuggest}
            disabled={aiLoading}
            title="AI Suggest"
          >
            {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          </Button>
        )}
      </div>
      {field.helpText && (
        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded px-2.5 py-1.5 border border-border/50">
          {field.helpText}
        </p>
      )}
      {field.type === 'text' && (
        readOnly ? (
          <div className="text-sm px-3 py-2 rounded-md border border-border bg-muted/50 text-foreground">
            {value || <span className="text-muted-foreground italic">Not set</span>}
          </div>
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'Enter value or N/A'}
            className="text-sm"
          />
        )
      )}
      {field.type === 'textarea' && (
        readOnly ? (
          <div className="text-sm px-3 py-2 rounded-md border border-border bg-muted/50 text-foreground whitespace-pre-line">
            {value || <span className="text-muted-foreground italic">Not set</span>}
          </div>
        ) : (
          <RichTextField
            value={value}
            onChange={onChange}
            placeholder={field.placeholder || 'Enter value or N/A'}
            minHeight="60px"
          />
        )
      )}
      {field.type === 'richtext' && (
        readOnly ? (
          <div className="text-sm px-3 py-2 rounded-md border border-border bg-muted/50 text-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value || '<em class="text-muted-foreground">Not set</em>' }} />
        ) : (
          <RichTextField
            value={value}
            onChange={onChange}
            placeholder={field.placeholder || 'Enter value or N/A'}
            minHeight="60px"
          />
        )
      )}
      {field.type === 'select' && (
        <Select value={value} onValueChange={onChange} disabled={readOnly}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {(field.options || ['Yes', 'No', 'N/A']).map(opt => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              return <SelectItem key={optValue} value={optValue}>{optLabel}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function DynamicTable({
  table,
  rows,
  onUpdateRow,
  onAddRow,
  onRemoveRow,
}: {
  table: ClauseTable;
  rows: Record<number, string>[];
  onUpdateRow: (rowIdx: number, colIdx: number, val: string) => void;
  onAddRow: () => void;
  onRemoveRow: (rowIdx: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{table.title}</h4>
        <Button variant="outline" size="sm" onClick={onAddRow} className="gap-1.5">
          <Plus className="h-3 w-3" />
          Add Row
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">
          No entries yet. Click "Add Row" to begin.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {table.columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="text-left text-xs font-medium text-muted-foreground p-2 border-b border-border min-w-[140px]"
                  >
                    {col}
                  </th>
                ))}
                <th className="w-10 border-b border-border" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-border/50 last:border-0">
                  {table.columns.map((col, colIdx) => (
                    <td key={colIdx} className="p-1.5">
                      {col.toLowerCase().includes('(yes/no)') ? (
                        <Select
                          value={row[colIdx] || ''}
                          onValueChange={(val) => onUpdateRow(rowIdx, colIdx, val)}
                        >
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={row[colIdx] || ''}
                          onChange={(e) => onUpdateRow(rowIdx, colIdx, e.target.value)}
                          className="text-xs h-8"
                          placeholder="..."
                        />
                      )}
                    </td>
                  ))}
                  <td className="p-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveRow(rowIdx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
