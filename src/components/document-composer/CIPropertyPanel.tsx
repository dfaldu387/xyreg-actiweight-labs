import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { DocumentStatusDropdown } from '@/components/ui/document-status-dropdown';
import { PhaseRestrictedDatePicker } from '@/components/ui/phase-restricted-date-picker';
import { MultiAuthorSelector } from '@/components/common/MultiAuthorSelector';
import { SectionSelector } from '@/components/common/SectionSelector';
import { ReferenceDocumentPicker } from '@/components/common/ReferenceDocumentPicker';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { useDocumentCategoryConfigs } from '@/hooks/useDocumentCategoryConfigs';
import { useSubPrefixes } from '@/hooks/useSubPrefixes';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { useCompanyActivePhases } from '@/hooks/useCompanyActivePhases';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { useExistingTags } from '@/hooks/useExistingTags';
import { Settings2, Check, Loader2, BookOpen, X } from 'lucide-react';
import { toast } from 'sonner';

interface CIPropertyPanelProps {
  documentId: string;
  companyId: string;
  productId?: string;
  phaseId?: string;
  // Current field values
  name: string;
  status: string;
  dueDate?: string;
  documentType?: string;
  section?: string;
  sectionId?: string;
  authorsIds: string[];
  assignedTo?: string;
  referenceDocumentIds: string[];
  // New fields
  version?: string;
  tags?: string[];
  isRecord?: boolean;
  date?: string;
  isCurrentEffectiveVersion?: boolean;
  needTemplateUpdate?: boolean;
  reviewerGroupIds?: string[];
  recordId?: string;
  nextReviewDate?: string;
  documentNumber?: string;
  showSectionNumbers?: boolean;
  // Callback to persist changes
  onFieldChange: (field: string, value: any) => Promise<void>;
  disabled?: boolean;
}

type FieldSaveState = 'idle' | 'saving' | 'saved';

export function CIPropertyPanel({
  documentId,
  companyId,
  productId,
  phaseId,
  name,
  status,
  dueDate,
  documentType,
  section,
  sectionId,
  authorsIds,
  assignedTo,
  referenceDocumentIds,
  version,
  tags = [],
  isRecord,
  date,
  isCurrentEffectiveVersion,
  needTemplateUpdate,
  reviewerGroupIds = [],
  recordId,
  nextReviewDate,
  documentNumber,
  showSectionNumbers,
  onFieldChange,
  disabled = false,
}: CIPropertyPanelProps) {
  const { documentTypes } = useDocumentTypes(companyId);
  const { configs: categoryConfigs, isLoading: isCategoryConfigsLoading, getNextDocumentNumber, getUsedNumbers } = useDocumentCategoryConfigs(companyId);
  const { subPrefixes } = useSubPrefixes(companyId);
  const [selectedSubPrefix, setSelectedSubPrefix] = useState<string>('');
  const [usedNumbersSet, setUsedNumbersSet] = useState<Set<string>>(new Set());
  const [isLoadingUsedNumbers, setIsLoadingUsedNumbers] = useState(false);
  const { documents: refDocuments } = useReferenceDocuments(companyId);
  const { activePhases } = useCompanyActivePhases(companyId);
  const { reviewerGroups = [] } = useReviewerGroups(companyId);
  const { data: existingTags = [] } = useExistingTags(companyId);
  const [isRefDocPickerOpen, setIsRefDocPickerOpen] = useState(false);

  // Local state for text inputs (debounced)
  const [localName, setLocalName] = useState(name);
  const [localVersion, setLocalVersion] = useState(version || '');
  const [tagInput, setTagInput] = useState('');
  const [fieldStates, setFieldStates] = useState<Record<string, FieldSaveState>>({});
  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isEditingNameRef = useRef(false);
  const isEditingVersionRef = useRef(false);

  // Sync local state when props change externally
  useEffect(() => {
    if (!isEditingNameRef.current) {
      setLocalName(name);
    }
  }, [name]);

  useEffect(() => {
    if (!isEditingVersionRef.current) {
      setLocalVersion(version || '');
    }
  }, [version]);

  // Strip prefix from name on load/change
  useEffect(() => {
    if (!isEditingNameRef.current && documentNumber && localName) {
      const stripped = localName.replace(/^[A-Z]+-\d{3}\s+/, '');
      if (stripped !== localName) {
        setLocalName(stripped);
        onFieldChange('name', stripped);
      }
    }
  }, [documentNumber]);

  // Parse sub-prefix from existing document number on mount
  useEffect(() => {
    if (!documentNumber || !documentType || subPrefixes.length === 0) return;
    const withoutPrefix = documentNumber.replace(`${documentType}-`, '');
    const subMatch = subPrefixes.find(sp => withoutPrefix.startsWith(`${sp.code}-`));
    if (subMatch && selectedSubPrefix !== subMatch.code) {
      setSelectedSubPrefix(subMatch.code);
    }
  }, [documentNumber, documentType, subPrefixes]);

  // Fetch used numbers when category prefix changes
  useEffect(() => {
    if (!documentType) return;
    setIsLoadingUsedNumbers(true);
    getUsedNumbers(documentType, companyId).then(used => {
      if (documentNumber) {
        const ownMatch = documentNumber.match(new RegExp(`^${documentType}-(?:[A-Z]+-)?([\\d]+)`));
        if (ownMatch) used.delete(ownMatch[1]);
      }
      setUsedNumbersSet(used);
      setIsLoadingUsedNumbers(false);
    });
  }, [documentType, getUsedNumbers, documentNumber]);

  const showSaveIndicator = useCallback((field: string) => {
    setFieldStates(prev => ({ ...prev, [field]: 'saved' }));
    setTimeout(() => {
      setFieldStates(prev => ({ ...prev, [field]: 'idle' }));
    }, 2000);
  }, []);

  const handleFieldSave = useCallback(async (field: string, value: any) => {
    setFieldStates(prev => ({ ...prev, [field]: 'saving' }));
    try {
      await onFieldChange(field, value);
      showSaveIndicator(field);
    } catch {
      setFieldStates(prev => ({ ...prev, [field]: 'idle' }));
      toast.error(`Failed to save ${field}`);
    }
  }, [onFieldChange, showSaveIndicator]);

  const handleDebouncedFieldSave = useCallback((field: string, value: any, delay = 800) => {
    if (debounceRef.current[field]) {
      clearTimeout(debounceRef.current[field]);
    }
    debounceRef.current[field] = setTimeout(() => {
      handleFieldSave(field, value);
    }, delay);
  }, [handleFieldSave]);

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      Object.values(debounceRef.current).forEach(clearTimeout);
    };
  }, []);

  const renderSaveIndicator = (field: string) => {
    const state = fieldStates[field];
    if (state === 'saving') return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
    if (state === 'saved') return <Check className="w-3 h-3 text-emerald-500" />;
    return null;
  };

  const parsedDueDate = dueDate ? new Date(dueDate) : undefined;
  const parsedDate = date ? new Date(date) : undefined;
  const parsedNextReviewDate = nextReviewDate ? new Date(nextReviewDate) : undefined;

  // Safety net: auto-generate record_id if is_record is true but record_id is missing
  useEffect(() => {
    if (isRecord && !recordId && !disabled) {
      const generatedId = name
        ? `${name.replace(/\s+/g, '-').substring(0, 20).toUpperCase()}-REC-001`
        : `REC-${documentId.slice(-8).toUpperCase()}-001`;
      handleFieldSave('record_id', generatedId);
    }
  }, [isRecord, recordId, disabled, name, documentId]);

  // Auto-detect document category and number from document name for existing docs
  useEffect(() => {
    if (disabled || !name || documentNumber || categoryConfigs.length === 0) return;
    const knownPrefixes = categoryConfigs.map(c => c.prefix);
    if (knownPrefixes.length === 0) return;
    const prefixPattern = new RegExp(`^(${knownPrefixes.join('|')})-(\\d[\\d.-]*)`, 'i');
    const match = name.match(prefixPattern);
    if (match) {
      const matchedPrefix = match[1].toUpperCase();
      const fullId = `${matchedPrefix}-${match[2]}`;
      const config = categoryConfigs.find(c => c.prefix.toUpperCase() === matchedPrefix);
      if (config) {
        handleFieldSave('document_number', fullId);
        if (!documentType) {
          handleFieldSave('document_type', config.prefix);
        }
      }
    }
  }, [name, documentNumber, categoryConfigs, disabled, documentType]);

  // Get reference doc names for display
  const selectedRefDocNames = refDocuments
    .filter(d => referenceDocumentIds.includes(d.id))
    .map(d => d.file_name);

  // Tag handling
  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      handleFieldSave('tags', newTags);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    handleFieldSave('tags', newTags);
  };

  const filteredTagSuggestions = existingTags.filter(
    (t: string) => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)
  );

  return (
    <Card className="border-0 rounded-none border-t">
      <CardHeader className="pb-3 px-6 pt-4">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
          <Settings2 className="w-4 h-4" />
          Document Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-4 space-y-4">
        {/* Document / Report Toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Type</Label>
            {renderSaveIndicator('is_record')}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${!isRecord ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>Document</span>
            <Switch
              checked={isRecord ?? false}
              onCheckedChange={async (checked) => {
                await handleFieldSave('is_record', checked);
                // Auto-generate record_id when toggling to Record mode
                if (checked && !recordId) {
                  const sopNum = (document.querySelector?.('[data-sop-number]') as HTMLElement)?.dataset?.sopNumber;
                  const generatedId = name
                    ? `${name.replace(/\s+/g, '-').substring(0, 20).toUpperCase()}-REC-001`
                    : `REC-${documentId.slice(-8).toUpperCase()}-001`;
                  await handleFieldSave('record_id', generatedId);
                }
              }}
              disabled={disabled}
            />
            <span className={`text-sm ${isRecord ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>Record</span>
          </div>
        </div>

        {/* Document Category + Number - side by side */}
        <div className="space-y-1.5" data-field="document-category">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Document Category</Label>
            {renderSaveIndicator('document_type')}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={documentType || undefined}
              onValueChange={async (val) => {
                await handleFieldSave('document_type', val);
                if (documentNumber) {
                  const currentPrefix = documentNumber.split('-')[0];
                  if (currentPrefix !== val) {
                    await handleFieldSave('document_number', '');
                  }
                }
                const config = categoryConfigs.find(c => c.prefix === val);
                if (config && !version) {
                  await handleFieldSave('version', config.versionFormat);
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder={isCategoryConfigsLoading ? "Loading..." : "Category"} />
              </SelectTrigger>
              <SelectContent>
                {isCategoryConfigsLoading ? (
                  <SelectItem value="__loading__" disabled>
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading...
                    </span>
                  </SelectItem>
                ) : categoryConfigs.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    No categories configured
                  </SelectItem>
                ) : (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value="NONE">
                          <span className="text-muted-foreground italic">None</span>
                        </SelectItem>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>No prefix — number only</p>
                      </TooltipContent>
                    </Tooltip>
                    {categoryConfigs.map(config => (
                      <Tooltip key={config.categoryKey}>
                        <TooltipTrigger asChild>
                          <SelectItem value={config.prefix}>
                            <span className="font-mono font-medium">{config.prefix}</span>
                          </SelectItem>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{config.categoryName}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                )}
              </SelectContent>
            </Select>

            {documentType && documentType !== 'NONE' && <span className="text-muted-foreground text-sm">-</span>}

            {/* Sub-prefix dropdown */}
            {documentType && documentType !== 'NONE' && subPrefixes.length > 0 && (
              <>
                <Select
                  value={selectedSubPrefix || 'NONE'}
                  onValueChange={async (val) => {
                    const newSub = val === 'NONE' ? '' : val;
                    setSelectedSubPrefix(newSub);
                    // Rebuild document number if one exists
                    if (documentNumber) {
                      // Extract just the numeric part
                      const parts = documentNumber.split('-');
                      const numPart = parts[parts.length - 1];
                      const fullId = newSub ? `${documentType}-${newSub}-${numPart}` : `${documentType}-${numPart}`;
                      await handleFieldSave('document_number', fullId);
                    }
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm font-mono w-16">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SelectItem value="NONE">
                            <span className="text-muted-foreground italic">—</span>
                          </SelectItem>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>No sub-prefix</p>
                        </TooltipContent>
                      </Tooltip>
                      {subPrefixes.map(sp => (
                        <Tooltip key={sp.key}>
                          <TooltipTrigger asChild>
                            <SelectItem value={sp.code}>
                              <span className="font-mono font-medium">{sp.code}</span>
                            </SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{sp.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground text-sm">-</span>
              </>
            )}

            <Select
              value={documentNumber ? (() => {
                if (documentType === 'NONE') return documentNumber;
                let stripped = documentNumber.replace(`${documentType}-`, '');
                if (selectedSubPrefix) stripped = stripped.replace(`${selectedSubPrefix}-`, '');
                return stripped;
              })() : undefined}
              onValueChange={async (num) => {
                let fullId: string;
                if (documentType === 'NONE') {
                  fullId = num;
                } else if (selectedSubPrefix) {
                  fullId = `${documentType}-${selectedSubPrefix}-${num}`;
                } else {
                  fullId = `${documentType}-${num}`;
                }
                await handleFieldSave('document_number', fullId);
              }}
              disabled={disabled || isLoadingUsedNumbers || !documentType}
            >
              <SelectTrigger className="h-8 text-sm font-mono w-24">
                <SelectValue placeholder={isLoadingUsedNumbers ? "..." : "###"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 50 }, (_, i) => {
                  const num = String(i + 1).padStart(3, '0');
                  const isUsed = usedNumbersSet.has(num);
                  return (
                    <SelectItem key={num} value={num} disabled={isUsed}>
                      <span className={isUsed ? 'text-muted-foreground line-through' : ''}>
                        {num}
                      </span>
                      {isUsed && <span className="ml-2 text-xs text-muted-foreground">(in use)</span>}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {documentNumber && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              Document ID: <span className="font-mono font-medium text-foreground">{documentNumber}</span>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Name</Label>
            {renderSaveIndicator('name')}
          </div>
          <Input
            value={localName}
            onChange={(e) => {
              setLocalName(e.target.value);
              handleDebouncedFieldSave('name', e.target.value);
            }}
            onFocus={() => { isEditingNameRef.current = true; }}
            onBlur={() => { isEditingNameRef.current = false; }}
            disabled={disabled}
            className="h-8 text-sm"
            placeholder="Document name"
          />
        </div>

        {/* Chapter Numbering Toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Formatting</Label>
            {renderSaveIndicator('showSectionNumbers')}
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={showSectionNumbers ?? false}
              onCheckedChange={async (checked) => {
                await handleFieldSave('showSectionNumbers', checked);
              }}
              disabled={disabled}
              id="chapter-numbering"
            />
            <Label htmlFor="chapter-numbering" className="text-sm text-foreground cursor-pointer">
              Chapter numbering (1.0, 2.0…)
            </Label>
          </div>
        </div>


        <Separator />

        {/* Phase */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Phase</Label>
            {renderSaveIndicator('phase_id')}
          </div>
          <Select
            value={phaseId || undefined}
            onValueChange={(val) => handleFieldSave('phase_id', val)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select phase" />
            </SelectTrigger>
            <SelectContent>
              {activePhases.map(phase => (
                <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        {/* Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Section</Label>
            {renderSaveIndicator('section')}
          </div>
          <SectionSelector
            value={section || ''}
            onChange={(val, secId) => {
              handleFieldSave('sub_section', val);
              if (secId) handleFieldSave('section_ids', [secId]);
            }}
            companyId={companyId}
            disabled={disabled}
            label=""
            phaseId={phaseId}
          />
        </div>

        <Separator />

        {/* Date */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Date</Label>
            {renderSaveIndicator('date')}
          </div>
          <PhaseRestrictedDatePicker
            date={parsedDate}
            setDate={(d) => {
              const formatted = d
                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                : null;
              handleFieldSave('date', formatted);
            }}
            disabled={disabled}
          />
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Due Date</Label>
            {renderSaveIndicator('due_date')}
          </div>
          <PhaseRestrictedDatePicker
            date={parsedDueDate}
            setDate={(d) => {
              const formatted = d
                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                : null;
              handleFieldSave('due_date', formatted);
            }}
            disabled={disabled}
          />
        </div>

        {/* Next Review Date - Document mode only */}
        {!isRecord && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Next Review Date</Label>
              {renderSaveIndicator('next_review_date')}
            </div>
            <PhaseRestrictedDatePicker
              date={parsedNextReviewDate}
              setDate={(d) => {
                const formatted = d
                  ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                  : null;
                handleFieldSave('next_review_date', formatted);
              }}
              disabled={disabled}
            />
          </div>
        )}

        <Separator />

        {/* Tags */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            {renderSaveIndicator('tags')}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1">
                  {tag}
                  {!disabled && (
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  )}
                </Badge>
              ))}
            </div>
          )}
          <div className="relative">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
              disabled={disabled}
              className="h-8 text-sm"
              placeholder="Add tag..."
            />
            {tagInput && filteredTagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-32 overflow-y-auto">
                {filteredTagSuggestions.slice(0, 5).map((suggestion: string) => (
                  <button
                    key={suggestion}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                    onClick={() => handleAddTag(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Authors */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Authors</Label>
            {renderSaveIndicator('authors_ids')}
          </div>
          <MultiAuthorSelector
            value={authorsIds}
            onChange={(val) => handleFieldSave('authors_ids', val)}
            companyId={companyId}
            disabled={disabled}
            label=""
            placeholder="Select authors"
          />
        </div>

        {/* Reviewer Groups */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Reviewer Groups</Label>
            {renderSaveIndicator('reviewer_group_ids')}
          </div>
          <div className="space-y-1">
            {reviewerGroups.map((group: any) => (
              <label key={group.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={reviewerGroupIds.includes(group.id)}
                  onCheckedChange={(checked) => {
                    const newIds = checked
                      ? [...reviewerGroupIds, group.id]
                      : reviewerGroupIds.filter((id: string) => id !== group.id);
                    handleFieldSave('reviewer_group_ids', newIds);
                  }}
                  disabled={disabled}
                />
                <span className="truncate">{group.name}</span>
              </label>
            ))}
            {reviewerGroups.length === 0 && (
              <p className="text-xs text-muted-foreground">No reviewer groups configured</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Reference Documents */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Reference Documents</Label>
            {renderSaveIndicator('reference_document_ids')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRefDocPickerOpen(true)}
            disabled={disabled}
            className="w-full justify-start text-sm h-8 font-normal"
          >
            <BookOpen className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            {referenceDocumentIds.length > 0
              ? `${referenceDocumentIds.length} document(s) linked`
              : 'Link reference docs'}
          </Button>
          {selectedRefDocNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedRefDocNames.slice(0, 3).map((name, i) => (
                <Badge key={i} variant="secondary" className="text-xs truncate max-w-[180px]">
                  {name}
                </Badge>
              ))}
              {selectedRefDocNames.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedRefDocNames.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>

        <ReferenceDocumentPicker
          open={isRefDocPickerOpen}
          onOpenChange={setIsRefDocPickerOpen}
          companyId={companyId}
          selectedIds={referenceDocumentIds}
          onConfirm={(ids) => handleFieldSave('reference_document_ids', ids)}
        />
      </CardContent>
    </Card>
  );
}
