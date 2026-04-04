import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Save, Plus, X, Loader2, Users } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

/**
 * Field definitions for the family editor.
 * Each entry maps a field_key to its label, type, and placeholder.
 */
const FAMILY_FIELDS = [
  { key: 'intendedUse', label: 'Intended Use (The Why)', type: 'textarea' as const, placeholder: 'State the general medical purpose of the device...' },
  { key: 'intendedFunction', label: 'Intended Function / Indications (The What)', type: 'textarea' as const, placeholder: 'What does the device diagnose, treat, monitor, or screen for?' },
  { key: 'modeOfAction', label: 'Mode of Action (The How)', type: 'textarea' as const, placeholder: 'How does the device achieve its function?' },
  { key: 'valueProposition', label: 'Value Proposition', type: 'textarea' as const, placeholder: 'What unique value does the device provide?' },
  { key: 'clinicalBenefits', label: 'Clinical Benefits', type: 'tags' as const, placeholder: 'Add a clinical benefit...' },
  { key: 'intendedPatientPopulation', label: 'Target Patient Population', type: 'tags' as const, placeholder: 'Add a population group...' },
  { key: 'intendedUser', label: 'Intended User', type: 'tags' as const, placeholder: 'Add an intended user...' },
  { key: 'durationOfUse', label: 'Duration of Use', type: 'text' as const, placeholder: 'e.g. Single use, Short-term (<30 days), Long-term' },
  { key: 'environmentOfUse', label: 'Environment of Use', type: 'tags' as const, placeholder: 'Add an environment...' },
  { key: 'contraindications', label: 'Contraindications', type: 'tags' as const, placeholder: 'Add a contraindication...' },
  { key: 'warningsPrecautions', label: 'Warnings & Precautions', type: 'tags' as const, placeholder: 'Add a warning or precaution...' },
] as const;

interface FamilyFieldEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basicUdiDi: string;
  getFamilyValue: (key: string) => Json | undefined;
  saveFamilyValue: (key: string, value: Json) => void;
  isSaving: boolean;
}

export function FamilyFieldEditorDialog({
  open,
  onOpenChange,
  basicUdiDi,
  getFamilyValue,
  saveFamilyValue,
  isSaving,
}: FamilyFieldEditorDialogProps) {
  // Local draft state for all fields
  const [draft, setDraft] = useState<Record<string, Json>>({});
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  // Populate draft from current family values when dialog opens
  useEffect(() => {
    if (open) {
      const initial: Record<string, Json> = {};
      FAMILY_FIELDS.forEach(f => {
        const val = getFamilyValue(f.key);
        initial[f.key] = val ?? (f.type === 'tags' ? [] : '');
      });
      setDraft(initial);
      setTagInputs({});
    }
  }, [open, getFamilyValue]);

  const handleTextChange = (key: string, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleAddTag = (key: string) => {
    const input = (tagInputs[key] || '').trim();
    if (!input) return;
    const current = (draft[key] as string[]) || [];
    if (current.includes(input)) {
      setTagInputs(prev => ({ ...prev, [key]: '' }));
      return;
    }
    setDraft(prev => ({ ...prev, [key]: [...current, input] }));
    setTagInputs(prev => ({ ...prev, [key]: '' }));
  };

  const handleRemoveTag = (key: string, index: number) => {
    const current = (draft[key] as string[]) || [];
    setDraft(prev => ({ ...prev, [key]: current.filter((_, i) => i !== index) }));
  };

  const handleSaveAll = () => {
    let savedCount = 0;
    FAMILY_FIELDS.forEach(f => {
      const value = draft[f.key];
      const existingValue = getFamilyValue(f.key);
      // Only save if value changed or is new
      if (JSON.stringify(value) !== JSON.stringify(existingValue ?? (f.type === 'tags' ? [] : ''))) {
        saveFamilyValue(f.key, value);
        savedCount++;
      }
    });
    if (savedCount > 0) {
      toast.success(`Saved ${savedCount} family field${savedCount > 1 ? 's' : ''}`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Edit Product Family Values
          </DialogTitle>
          <DialogDescription>
            These values are shared across all variants with Basic UDI-DI: <code className="text-xs bg-muted px-1 py-0.5 rounded">{basicUdiDi}</code>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-5 pb-4">
            {FAMILY_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-sm font-medium">{field.label}</Label>

                {field.type === 'textarea' && (
                  <Textarea
                    value={(draft[field.key] as string) || ''}
                    onChange={(e) => handleTextChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="min-h-[70px]"
                  />
                )}

                {field.type === 'text' && (
                  <Input
                    value={(draft[field.key] as string) || ''}
                    onChange={(e) => handleTextChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}

                {field.type === 'tags' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={tagInputs[field.key] || ''}
                        onChange={(e) => setTagInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(field.key);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleAddTag(field.key)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {((draft[field.key] as string[]) || []).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="gap-1 pr-1">
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(field.key, i)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="mt-3" />
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Family Values
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}