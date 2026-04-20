import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { DocumentStudioPersistenceService, DocumentStudioData } from '@/services/documentStudioPersistenceService';
import { toast } from 'sonner';
import { Building2, Box, Layers, FileEdit, Loader2, Check, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { StorageSterilityHandlingData, STERILIZATION_METHODS, ENVIRONMENTAL_CONTROLS, HANDLING_PRECAUTIONS } from '@/types/storageHandling';

type DocScope = 'enterprise' | 'device' | 'phase';

interface IntendedPurposeData {
  clinicalPurpose?: string;
  indications?: string;
  targetPopulation?: string[];
  userProfile?: string;
  useEnvironment?: string[];
  durationOfUse?: string;
  modeOfAction?: string;
  warnings?: string[];
  intended_use_category?: string;
  essentialPerformance?: string[];
}

interface UserInstructions {
  how_to_use?: string;
  charging?: string;
  maintenance?: string;
}

interface SavePurposeAsDocCIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  companyId: string;
  companyName: string;
  intendedPurposeData?: IntendedPurposeData;
  contraindications?: string[];
  intendedUsers?: string[];
  clinicalBenefits?: string[];
  userInstructions?: UserInstructions;
  storageSterilityHandling?: StorageSterilityHandlingData;
  onDocumentCreated?: (docId: string, docName: string, docType: string) => void;
}

function buildPurposeHtml(
  productName: string,
  data: IntendedPurposeData,
  contraindications: string[],
  intendedUsers: string[],
  clinicalBenefits: string[],
  userInstructions: UserInstructions,
  storage?: StorageSterilityHandlingData
): string {
  const parts: string[] = [];

  // Helper: only add section if content exists
  const addText = (label: string, value?: string) => {
    if (value?.trim()) parts.push(`<p><strong>${label}:</strong> ${value}</p>`);
  };
  const addList = (label: string, items?: string[]) => {
    if (items && items.length > 0) {
      parts.push(`<p><strong>${label}:</strong></p><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`);
    }
  };
  const addRich = (label: string, value?: string) => {
    if (value?.trim()) {
      // If value contains HTML tags, render as-is; otherwise wrap in <p>
      const isHtml = /<[a-z][\s\S]*>/i.test(value);
      parts.push(`<p><strong>${label}:</strong></p>${isHtml ? value : `<p>${value}</p>`}`);
    }
  };

  // Section 1: Statement of Use
  const s1: string[] = [];
  if (data.clinicalPurpose?.trim()) s1.push(`<p><strong>Intended Use:</strong> ${data.clinicalPurpose}</p>`);
  if (data.indications?.trim()) s1.push(`<p><strong>Indications:</strong> ${data.indications}</p>`);
  if (data.modeOfAction?.trim()) s1.push(`<p><strong>Mode of Action:</strong> ${data.modeOfAction}</p>`);
  if (data.intended_use_category) s1.push(`<p><strong>Intended Use Category:</strong> ${data.intended_use_category}</p>`);
  if (data.essentialPerformance && data.essentialPerformance.length > 0) {
    s1.push(`<p><strong>Essential Performance:</strong></p><ul>${data.essentialPerformance.map(e => `<li>${e}</li>`).join('')}</ul>`);
  }
  if (clinicalBenefits.length > 0) {
    s1.push(`<p><strong>Clinical Benefits:</strong></p><ul>${clinicalBenefits.map(b => `<li>${b}</li>`).join('')}</ul>`);
  }
  if (s1.length > 0) {
    parts.push(`<h2>1. Statement of Use</h2>${s1.join('')}`);
  }

  // Section 2: Context of Use
  const s2: string[] = [];
  if (data.targetPopulation && data.targetPopulation.length > 0) {
    s2.push(`<p><strong>Target Population:</strong> ${data.targetPopulation.join(', ')}</p>`);
  }
  if (data.useEnvironment && data.useEnvironment.length > 0) {
    s2.push(`<p><strong>Use Environment:</strong> ${data.useEnvironment.join(', ')}</p>`);
  }
  if (data.durationOfUse) s2.push(`<p><strong>Duration of Use:</strong> ${data.durationOfUse}</p>`);
  if (intendedUsers.length > 0) s2.push(`<p><strong>Intended Users:</strong> ${intendedUsers.join(', ')}</p>`);
  if (data.userProfile?.trim()) s2.push(`<p><strong>User Profile:</strong> ${data.userProfile}</p>`);
  if (s2.length > 0) {
    parts.push(`<h2>2. Context of Use</h2>${s2.join('')}`);
  }

  // Section 3: Safety & Usage
  const s3: string[] = [];
  if (data.warnings && data.warnings.length > 0) {
    s3.push(`<p><strong>Warnings:</strong></p><ul>${data.warnings.map(w => `<li>${w}</li>`).join('')}</ul>`);
  }
  if (contraindications.length > 0) {
    s3.push(`<p><strong>Contraindications:</strong></p><ul>${contraindications.map(c => `<li>${c}</li>`).join('')}</ul>`);
  }
  if (storage) {
    if (storage.isSterile) {
      const method = STERILIZATION_METHODS.find(m => m.value === storage.sterilizationMethod)?.label || storage.sterilizationMethod;
      if (method) s3.push(`<p><strong>Sterilization Method:</strong> ${method}</p>`);
      if (storage.sterilityAssuranceLevel) s3.push(`<p><strong>Sterility Assurance Level:</strong> ${storage.sterilityAssuranceLevel}</p>`);
    }
    if (storage.storageTemperatureMin !== undefined || storage.storageTemperatureMax !== undefined) {
      const unit = storage.storageTemperatureUnit === 'celsius' ? '°C' : '°F';
      s3.push(`<p><strong>Storage Temperature:</strong> ${storage.storageTemperatureMin ?? '—'}${unit} to ${storage.storageTemperatureMax ?? '—'}${unit}</p>`);
    }
    if (storage.specialEnvironmentalControls?.length > 0) {
      const labels = storage.specialEnvironmentalControls.map(v => ENVIRONMENTAL_CONTROLS.find(e => e.value === v)?.label || v);
      s3.push(`<p><strong>Environmental Controls:</strong> ${labels.join(', ')}</p>`);
    }
    if (storage.shelfLifeValue) {
      s3.push(`<p><strong>Shelf Life:</strong> ${storage.shelfLifeValue} ${storage.shelfLifeUnit}</p>`);
    }
    if (storage.handlingPrecautions?.length > 0) {
      const labels = storage.handlingPrecautions.map(v => HANDLING_PRECAUTIONS.find(h => h.value === v)?.label || v);
      s3.push(`<p><strong>Handling Precautions:</strong> ${labels.join(', ')}</p>`);
    }
  }
  if (s3.length > 0) {
    parts.push(`<h2>3. Safety & Usage</h2>${s3.join('')}`);
  }

  // Section 4: Additional Information
  const s4: string[] = [];
  if (userInstructions.how_to_use?.trim()) {
    const isHtml = /<[a-z][\s\S]*>/i.test(userInstructions.how_to_use);
    s4.push(`<p><strong>How to Use:</strong></p>${isHtml ? userInstructions.how_to_use : `<p>${userInstructions.how_to_use}</p>`}`);
  }
  if (userInstructions.charging?.trim()) {
    const isHtml = /<[a-z][\s\S]*>/i.test(userInstructions.charging);
    s4.push(`<p><strong>Charging / Power:</strong></p>${isHtml ? userInstructions.charging : `<p>${userInstructions.charging}</p>`}`);
  }
  if (userInstructions.maintenance?.trim()) {
    const isHtml = /<[a-z][\s\S]*>/i.test(userInstructions.maintenance);
    s4.push(`<p><strong>Maintenance:</strong></p>${isHtml ? userInstructions.maintenance : `<p>${userInstructions.maintenance}</p>`}`);
  }
  if (s4.length > 0) {
    parts.push(`<h2>4. Additional Information</h2>${s4.join('')}`);
  }

  return parts.join('');
}

export function SavePurposeAsDocCIDialog({
  open,
  onOpenChange,
  productId,
  productName,
  companyId,
  companyName,
  intendedPurposeData = {},
  contraindications = [],
  intendedUsers = [],
  clinicalBenefits = [],
  userInstructions = {},
  storageSterilityHandling,
  onDocumentCreated,
}: SavePurposeAsDocCIDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<DocScope>('device');
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [phases, setPhases] = useState<{ id: string; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStudioId, setSavedStudioId] = useState<string | null>(null);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (scope === 'phase' && companyId) {
      supabase
        .from('company_chosen_phases')
        .select('position, company_phases!inner(id, name)')
        .eq('company_id', companyId)
        .order('position')
        .then(({ data }) => {
          const mapped = (data || []).map((cp: any) => ({
            id: cp.company_phases.id,
            name: cp.company_phases.name,
          }));
          setPhases(mapped);
          if (mapped.length > 0 && !selectedPhaseId) setSelectedPhaseId(mapped[0].id);
        });
    }
  }, [scope, companyId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const htmlContent = buildPurposeHtml(
        productName,
        intendedPurposeData,
        contraindications,
        intendedUsers,
        clinicalBenefits,
        userInstructions,
        storageSterilityHandling
      );

      if (!htmlContent.trim()) {
        toast.error('No purpose data to export');
        return;
      }

      const templateIdKey = `PURPOSE-CONTEXT-${productId}`;
      const docName = `Device Purpose & Context — ${productName}`;
      const docScope = scope === 'enterprise' ? 'company' : 'product';
      const scopeProductId = scope !== 'enterprise' ? productId : undefined;

      const sections = [
        {
          id: 'purpose-context-content',
          title: 'Device Purpose & Context',
          content: [{ id: 'purpose-1', type: 'paragraph', content: htmlContent }],
          order: 0,
        },
      ];

      const existing = await DocumentStudioPersistenceService.loadTemplate(
        companyId, templateIdKey, scopeProductId
      );

      const studioData: DocumentStudioData = {
        ...(existing.data?.id ? { id: existing.data.id } : {}),
        company_id: companyId,
        product_id: scopeProductId,
        template_id: templateIdKey,
        name: docName,
        type: 'Technical',
        sections,
        metadata: { source: 'device-purpose-context' },
      };

      const saveResult = await DocumentStudioPersistenceService.saveTemplate(studioData);
      if (!saveResult.success || !saveResult.id) {
        throw new Error(saveResult.error || 'Failed to save studio template');
      }

      const syncResult = await DocumentStudioPersistenceService.syncToDocumentCI({
        companyId,
        productId: scopeProductId,
        phaseId: scope === 'phase' ? selectedPhaseId : undefined,
        name: docName,
        documentReference: templateIdKey,
        documentScope: docScope === 'company' ? 'company_document' : 'product_document',
        documentType: 'Technical',
      });
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Failed to create Document CI record');
      }

      setSavedStudioId(saveResult.id);
      setSavedTemplateId(templateIdKey);
      queryClient.invalidateQueries({ queryKey: ['company-documents', companyId] });
      toast.success('Document created successfully');

      if (onDocumentCreated && syncResult.id) {
        handleClose();
        onDocumentCreated(syncResult.id, docName, 'Technical');
      }
    } catch (err: any) {
      console.error('Save as Doc CI failed:', err);
      toast.error(`Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const htmlContent = buildPurposeHtml(
      productName, intendedPurposeData, contraindications,
      intendedUsers, clinicalBenefits, userInstructions, storageSterilityHandling
    );
    const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Device Purpose & Context — ${productName}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}
h1{color:#1E3A8A;border-bottom:2px solid #1E3A8A;padding-bottom:8px}h2{color:#374151;margin-top:24px}
ul{margin:4px 0 12px 20px}p{margin:4px 0}
img{max-width:100%;height:auto}
.meta{color:#666;font-size:0.9em;margin-bottom:24px}</style></head>
<body><h1>Device Purpose & Context — ${productName}</h1>
<div class="meta">Generated: ${new Date().toLocaleDateString()}</div>
${htmlContent}</body></html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_Purpose_Context.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  const handleOpenInStudio = () => {
    if (savedTemplateId) {
      const params = new URLSearchParams();
      params.set('templateId', savedTemplateId);
      if (scope !== 'enterprise') params.set('productId', productId);
      navigate(`/app/company/${encodeURIComponent(companyName)}/document-studio?${params.toString()}`);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSavedStudioId(null);
    setSavedTemplateId(null);
    setScope('device');
    setSelectedPhaseId('');
    onOpenChange(false);
  };

  const isSaveDisabled = isSaving || (scope === 'phase' && !selectedPhaseId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Document</DialogTitle>
          <DialogDescription>
            Export all Device Purpose & Context data as a document.
          </DialogDescription>
        </DialogHeader>

        {!savedStudioId ? (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Location of Document CI</Label>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as DocScope)} className="space-y-2">
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="enterprise" />
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Enterprise Level</p>
                    <p className="text-xs text-muted-foreground">Company-wide document</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="device" />
                  <Box className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Device Specific (No Phase)</p>
                    <p className="text-xs text-muted-foreground">Linked to this device</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="phase" />
                  <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Phase Specific</p>
                    <p className="text-xs text-muted-foreground">Linked to a lifecycle phase</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {scope === 'phase' && (
              <div className="space-y-2">
                <Label className="text-sm">Select Phase</Label>
                <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
                  <SelectTrigger><SelectValue placeholder="Choose a lifecycle phase..." /></SelectTrigger>
                  <SelectContent>
                    {phases.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaveDisabled}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Document
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              Document CI saved successfully
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleDownload} className="h-auto py-4 flex flex-col items-center gap-2">
                <Download className="h-5 w-5" />
                <div className="text-center">
                  <p className="text-sm font-medium">Download</p>
                  <p className="text-xs text-muted-foreground">Save as HTML file</p>
                </div>
              </Button>
              <Button variant="outline" onClick={handleOpenInStudio} className="h-auto py-4 flex flex-col items-center gap-2">
                <FileEdit className="h-5 w-5" />
                <div className="text-center">
                  <p className="text-sm font-medium">Edit in Studio</p>
                  <p className="text-xs text-muted-foreground">Open in Document Studio</p>
                </div>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
