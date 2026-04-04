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
import { EnhancedProductMarket } from '@/types/client';
import { KeyFeature } from '@/utils/keyFeaturesNormalizer';

type DocScope = 'enterprise' | 'device' | 'phase';

interface DeviceComponent {
  name: string;
  description: string;
}

interface PurposeData {
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

export interface DeviceDefinitionExportData {
  // General
  productName?: string;
  tradeName?: string;
  referenceNumber?: string;
  modelReference?: string;
  description?: string;
  deviceCategory?: string;
  primaryRegulatoryType?: string;
  coreDeviceNature?: string;
  isActiveDevice?: boolean;
  keyFeatures?: KeyFeature[];
  deviceComponents?: DeviceComponent[];
  emdnCode?: string;
  // Purpose
  intendedPurposeData?: PurposeData;
  contraindications?: string[];
  intendedUsers?: string[];
  clinicalBenefits?: string[];
  userInstructions?: UserInstructions;
  storageSterilityHandling?: StorageSterilityHandlingData;
  // Identification
  basicUdiDi?: string;
  udiDi?: string;
  udiPi?: string;
  gtin?: string;
  registrationNumber?: string;
  registrationStatus?: string;
  registrationDate?: string | null;
  // Markets
  markets?: EnhancedProductMarket[];
  ceMarkStatus?: string;
  notifiedBody?: string;
  conformityAssessmentRoute?: string;
  isoCertifications?: string[];
  marketAuthorizationHolder?: string;
  manufacturer?: string;
  // Lifecycle
  currentLifecyclePhase?: string;
  designFreezeDate?: string | null;
  projectedLaunchDate?: string | null;
  actualLaunchDate?: string | null;
}

interface SaveDeviceDefinitionAsDocCIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  companyId: string;
  companyName: string;
  deviceData: DeviceDefinitionExportData;
  onDocumentCreated?: (docId: string, docName: string, docType: string) => void;
}

function buildFullDeviceHtml(productName: string, d: DeviceDefinitionExportData): string {
  const parts: string[] = [];
  let sectionNum = 0;

  const nextSection = (title: string) => {
    sectionNum++;
    return `<h2>${sectionNum}. ${title}</h2>`;
  };

  const field = (label: string, value?: string | null) => {
    if (value?.trim()) return `<p><strong>${label}:</strong> ${value}</p>`;
    return '';
  };

  const listField = (label: string, items?: string[]) => {
    if (!items || items.length === 0) return '';
    return `<p><strong>${label}:</strong></p><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  };

  const richField = (label: string, value?: string) => {
    if (!value?.trim()) return '';
    const isHtml = /<[a-z][\s\S]*>/i.test(value);
    return `<p><strong>${label}:</strong></p>${isHtml ? value : `<p>${value}</p>`}`;
  };

  // === Section 1: General / Definition ===
  const s1: string[] = [];
  s1.push(field('Product Name', d.productName));
  s1.push(field('Trade Name', d.tradeName));
  s1.push(field('Reference Number', d.referenceNumber));
  s1.push(field('Model Reference', d.modelReference));
  s1.push(richField('Description', d.description));
  s1.push(field('Device Category', d.deviceCategory));
  s1.push(field('Regulatory Type', d.primaryRegulatoryType));
  s1.push(field('Core Device Nature', d.coreDeviceNature));
  if (d.isActiveDevice !== undefined) {
    s1.push(field('Active Device', d.isActiveDevice ? 'Yes' : 'No'));
  }
  s1.push(field('EMDN Code', d.emdnCode));
  if (d.keyFeatures && d.keyFeatures.length > 0) {
    s1.push(`<p><strong>Key Features:</strong></p><ul>${d.keyFeatures.map(f => `<li>${f.name || ''}</li>`).join('')}</ul>`);
  }
  if (d.deviceComponents && d.deviceComponents.length > 0) {
    s1.push(`<p><strong>Device Components:</strong></p><ul>${d.deviceComponents.map(c => `<li><strong>${c.name}</strong>${c.description ? ` — ${c.description}` : ''}</li>`).join('')}</ul>`);
  }
  const s1Content = s1.filter(Boolean).join('');
  if (s1Content) parts.push(nextSection('General / Definition') + s1Content);

  // === Section 2: Purpose & Context ===
  const s2: string[] = [];
  const ip: PurposeData = d.intendedPurposeData || {};
  s2.push(field('Intended Use', ip.clinicalPurpose));
  s2.push(field('Indications', ip.indications));
  s2.push(field('Mode of Action', ip.modeOfAction));
  s2.push(field('Intended Use Category', ip.intended_use_category));
  s2.push(listField('Essential Performance', ip.essentialPerformance));
  s2.push(listField('Clinical Benefits', d.clinicalBenefits));
  if (ip.targetPopulation && ip.targetPopulation.length > 0) {
    s2.push(field('Target Population', ip.targetPopulation.join(', ')));
  }
  if (ip.useEnvironment && ip.useEnvironment.length > 0) {
    s2.push(field('Use Environment', ip.useEnvironment.join(', ')));
  }
  s2.push(field('Duration of Use', ip.durationOfUse));
  if (d.intendedUsers && d.intendedUsers.length > 0) {
    s2.push(field('Intended Users', d.intendedUsers.join(', ')));
  }
  s2.push(field('User Profile', ip.userProfile));
  s2.push(listField('Warnings', ip.warnings));
  s2.push(listField('Contraindications', d.contraindications));

  // Storage/Sterility
  const st = d.storageSterilityHandling;
  if (st) {
    if (st.isSterile) {
      const method = STERILIZATION_METHODS.find(m => m.value === st.sterilizationMethod)?.label || st.sterilizationMethod;
      if (method) s2.push(field('Sterilization Method', method));
      s2.push(field('Sterility Assurance Level', st.sterilityAssuranceLevel));
    }
    if (st.storageTemperatureMin !== undefined || st.storageTemperatureMax !== undefined) {
      const unit = st.storageTemperatureUnit === 'celsius' ? '°C' : '°F';
      s2.push(field('Storage Temperature', `${st.storageTemperatureMin ?? '—'}${unit} to ${st.storageTemperatureMax ?? '—'}${unit}`));
    }
    if (st.specialEnvironmentalControls?.length > 0) {
      const labels = st.specialEnvironmentalControls.map(v => ENVIRONMENTAL_CONTROLS.find(e => e.value === v)?.label || v);
      s2.push(field('Environmental Controls', labels.join(', ')));
    }
    if (st.shelfLifeValue) {
      s2.push(field('Shelf Life', `${st.shelfLifeValue} ${st.shelfLifeUnit}`));
    }
    if (st.handlingPrecautions?.length > 0) {
      const labels = st.handlingPrecautions.map(v => HANDLING_PRECAUTIONS.find(h => h.value === v)?.label || v);
      s2.push(field('Handling Precautions', labels.join(', ')));
    }
  }

  // User instructions
  const ui = d.userInstructions || {};
  s2.push(richField('How to Use', ui.how_to_use));
  s2.push(richField('Charging / Power', ui.charging));
  s2.push(richField('Maintenance', ui.maintenance));

  const s2Content = s2.filter(Boolean).join('');
  if (s2Content) parts.push(nextSection('Purpose & Context') + s2Content);

  // === Section 3: Identification & Traceability ===
  const s3: string[] = [];
  s3.push(field('Basic UDI-DI', d.basicUdiDi));
  s3.push(field('UDI-DI', d.udiDi));
  s3.push(field('UDI-PI', d.udiPi));
  s3.push(field('GTIN', d.gtin));
  s3.push(field('Registration Number', d.registrationNumber));
  s3.push(field('Registration Status', d.registrationStatus));
  if (d.registrationDate) s3.push(field('Registration Date', new Date(d.registrationDate).toLocaleDateString()));
  const s3Content = s3.filter(Boolean).join('');
  if (s3Content) parts.push(nextSection('Identification & Traceability') + s3Content);

  // === Section 4: Markets & Regulatory ===
  const s4: string[] = [];
  const selectedMarkets = (d.markets || []).filter(m => m.selected);
  if (selectedMarkets.length > 0) {
    s4.push(`<p><strong>Target Markets:</strong></p><table style="border-collapse:collapse;width:100%;margin:8px 0"><thead><tr style="border-bottom:2px solid #ccc"><th style="text-align:left;padding:4px 8px">Market</th><th style="text-align:left;padding:4px 8px">Risk Class</th><th style="text-align:left;padding:4px 8px">Status</th></tr></thead><tbody>${selectedMarkets.map(m =>
      `<tr style="border-bottom:1px solid #eee"><td style="padding:4px 8px">${m.name || m.code}</td><td style="padding:4px 8px">${m.riskClass || '—'}</td><td style="padding:4px 8px">${m.regulatoryStatus || '—'}</td></tr>`
    ).join('')}</tbody></table>`);
  }
  s4.push(field('CE Mark Status', d.ceMarkStatus));
  s4.push(field('Notified Body', d.notifiedBody));
  s4.push(field('Conformity Assessment Route', d.conformityAssessmentRoute));
  s4.push(listField('ISO Certifications', d.isoCertifications));
  s4.push(field('Market Authorization Holder', d.marketAuthorizationHolder));
  s4.push(field('Manufacturer', d.manufacturer));
  const s4Content = s4.filter(Boolean).join('');
  if (s4Content) parts.push(nextSection('Markets & Regulatory') + s4Content);

  // === Section 5: Lifecycle ===
  const s5: string[] = [];
  s5.push(field('Current Phase', d.currentLifecyclePhase));
  if (d.designFreezeDate) s5.push(field('Design Freeze Date', new Date(d.designFreezeDate).toLocaleDateString()));
  if (d.projectedLaunchDate) s5.push(field('Projected Launch Date', new Date(d.projectedLaunchDate).toLocaleDateString()));
  if (d.actualLaunchDate) s5.push(field('Actual Launch Date', new Date(d.actualLaunchDate).toLocaleDateString()));
  const s5Content = s5.filter(Boolean).join('');
  if (s5Content) parts.push(nextSection('Lifecycle') + s5Content);

  return parts.join('');
}

export function SaveDeviceDefinitionAsDocCIDialog({
  open,
  onOpenChange,
  productId,
  productName,
  companyId,
  companyName,
  deviceData,
  onDocumentCreated,
}: SaveDeviceDefinitionAsDocCIDialogProps) {
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
      const htmlContent = buildFullDeviceHtml(productName, deviceData);

      if (!htmlContent.trim()) {
        toast.error('No device data to export');
        return;
      }

      const templateIdKey = `DEVICE-DEF-${productId}`;
      const docName = `Device Definition — ${productName}`;
      const docScope = scope === 'enterprise' ? 'company' : 'product';
      const scopeProductId = scope !== 'enterprise' ? productId : undefined;

      const sections = [
        {
          id: 'device-definition-content',
          title: 'Device Definition',
          content: [{ id: 'device-def-1', type: 'paragraph', content: htmlContent }],
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
        metadata: { source: 'device-definition-export' },
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
        onDocumentCreated(syncResult.id, docName, 'Report');
      }
    } catch (err: any) {
      console.error('Save as Doc CI failed:', err);
      toast.error(`Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const htmlContent = buildFullDeviceHtml(productName, deviceData);
    const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Device Definition — ${productName}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}
h1{color:#1E3A8A;border-bottom:2px solid #1E3A8A;padding-bottom:8px}h2{color:#374151;margin-top:24px}
ul{margin:4px 0 12px 20px}p{margin:4px 0}
table{font-size:0.95em}th{font-weight:600}
img{max-width:100%;height:auto}
.meta{color:#666;font-size:0.9em;margin-bottom:24px}</style></head>
<body><h1>Device Definition — ${productName}</h1>
<div class="meta">Generated: ${new Date().toLocaleDateString()}</div>
${htmlContent}</body></html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_Device_Definition.html`;
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
            Export the complete Device Definition (all tabs) as a document.
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
