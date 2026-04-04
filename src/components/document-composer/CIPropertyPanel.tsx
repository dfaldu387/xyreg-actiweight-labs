import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DocumentStatusDropdown } from '@/components/ui/document-status-dropdown';
import { PhaseRestrictedDatePicker } from '@/components/ui/phase-restricted-date-picker';
import { MultiAuthorSelector } from '@/components/common/MultiAuthorSelector';
import { SectionSelector } from '@/components/common/SectionSelector';
import { ReferenceDocumentPicker } from '@/components/common/ReferenceDocumentPicker';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { Settings2, Check, Loader2, BookOpen, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  onFieldChange,
  disabled = false,
}: CIPropertyPanelProps) {
  const { documentTypes } = useDocumentTypes(companyId);
  const { documents: refDocuments } = useReferenceDocuments(companyId);
  const [isRefDocPickerOpen, setIsRefDocPickerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Local state for text inputs (debounced)
  const [localName, setLocalName] = useState(name);
  const [fieldStates, setFieldStates] = useState<Record<string, FieldSaveState>>({});
  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isEditingNameRef = useRef(false);

  // Sync local name when prop changes externally (but not while user is typing)
  useEffect(() => {
    if (!isEditingNameRef.current) {
      setLocalName(name);
    }
  }, [name]);

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

  // Get reference doc names for display
  const selectedRefDocNames = refDocuments
    .filter(d => referenceDocumentIds.includes(d.id))
    .map(d => d.file_name);

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
    <Card className="border-0 rounded-none border-t">
      <CollapsibleTrigger asChild>
      <CardHeader className="pb-3 px-6 pt-4 cursor-pointer hover:bg-muted/50 transition-colors">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
          <Settings2 className="w-4 h-4" />
          CI Properties
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
        </CardTitle>
      </CardHeader>
      </CollapsibleTrigger>
      <CollapsibleContent>
      <CardContent className="px-6 pb-4 space-y-4">
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

        {/* Status */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Status</Label>
            {renderSaveIndicator('status')}
          </div>
          <DocumentStatusDropdown
            value={status}
            onValueChange={(val) => handleFieldSave('status', val)}
            label=""
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
            setDate={(date) => {
              const formatted = date
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                : null;
              handleFieldSave('due_date', formatted);
            }}
            disabled={disabled}
          />
        </div>

        <Separator />

        {/* Document Type */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Document Type</Label>
            {renderSaveIndicator('document_type')}
          </div>
          <Select
            value={documentType || undefined}
            onValueChange={(val) => handleFieldSave('document_type', val)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section / Tags */}
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
      </CollapsibleContent>
    </Card>
    </Collapsible>
  );
}
