import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

import { DocumentStudioPersistenceService, DocumentStudioData } from '@/services/documentStudioPersistenceService';
import { toast } from 'sonner';
import { Building2, Box, Layers, FileEdit, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

type DocScope = 'enterprise' | 'device' | 'phase';

export interface DeviceOption {
  id: string;
  name: string;
}

interface SaveDescriptionAsDocCIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  familyName: string;
  companyId: string;
  companyName: string;
  
  masterDeviceId: string;
  devices: DeviceOption[];
  onDocumentCreated?: (docId: string, docName: string, docType: string) => void;
}

interface PhaseOption {
  id: string;
  name: string;
}

export function SaveDescriptionAsDocCIDialog({
  open,
  onOpenChange,
  description,
  familyName,
  companyId,
  companyName,
  
  masterDeviceId,
  devices,
  onDocumentCreated,
}: SaveDescriptionAsDocCIDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<DocScope>('enterprise');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(masterDeviceId);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
  const [phases, setPhases] = useState<PhaseOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStudioId, setSavedStudioId] = useState<string | null>(null);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);

  // Reset device selection when scope changes
  useEffect(() => {
    if (scope === 'enterprise') {
      setSelectedDeviceId(masterDeviceId);
    }
  }, [scope, masterDeviceId]);

  // Fetch phases when scope is 'phase'
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
          if (mapped.length > 0 && !selectedPhaseId) {
            setSelectedPhaseId(mapped[0].id);
          }
        });
    }
  }, [scope, companyId]);

  const needsDeviceSelector = scope === 'device' || scope === 'phase';

  const handleSave = async () => {
    if (!description?.trim()) {
      toast.error('No description content to save');
      return;
    }

    if (needsDeviceSelector && !selectedDeviceId) {
      toast.error('Please select a device');
      return;
    }

    setIsSaving(true);
    try {
      // Fetch the actual company_id from the master device to avoid context/cache mismatch
      let resolvedCompanyId = companyId;
      const { data: deviceData, error: deviceError } = await supabase
        .from('products')
        .select('company_id')
        .eq('id', masterDeviceId)
        .single();

      if (deviceData?.company_id) {
        resolvedCompanyId = deviceData.company_id;
      }

      const docScope = scope === 'enterprise' ? 'company' : 'product';
      const productId = scope !== 'enterprise' ? selectedDeviceId : undefined;
      const templateIdKey = `FAMILY-DESC-${masterDeviceId}`;
      const docName = familyName;

      // Build Document Studio sections with the rich text content
      const sections = [
        {
          id: 'family-desc-content',
          title: 'Product Family Description',
          content: [{ id: 'family-desc-1', type: 'paragraph', content: description }],
          order: 0,
        },
      ];

      // Check if a studio template already exists
      const existing = await DocumentStudioPersistenceService.loadTemplate(
        resolvedCompanyId,
        templateIdKey,
        productId
      );

      const studioData: DocumentStudioData = {
        ...(existing.data?.id ? { id: existing.data.id } : {}),
        company_id: resolvedCompanyId,
        product_id: productId,
        template_id: templateIdKey,
        name: docName,
        type: 'Technical',
        sections,
        metadata: { source: 'family-description' },
      };

      // Save to Document Studio
      const saveResult = await DocumentStudioPersistenceService.saveTemplate(studioData);

      if (!saveResult.success || !saveResult.id) {
        throw new Error(saveResult.error || 'Failed to save studio template');
      }

      // Sync to Document CI
      const syncResult = await DocumentStudioPersistenceService.syncToDocumentCI({
        companyId: resolvedCompanyId,
        productId,
        name: docName,
        documentReference: templateIdKey,
        documentScope: docScope === 'company' ? 'company_document' : 'product_document',
        documentType: 'Technical',
      });

      setSavedStudioId(saveResult.id);
      setSavedTemplateId(templateIdKey);
      queryClient.invalidateQueries({ queryKey: ['company-documents', resolvedCompanyId] });
      if (resolvedCompanyId !== companyId) {
        queryClient.invalidateQueries({ queryKey: ['company-documents', companyId] });
      }
      toast.success('Document created successfully');

      if (onDocumentCreated && syncResult.success && syncResult.id) {
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
    const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${familyName} - Product Family Description</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}
h1{color:#1E3A8A;border-bottom:2px solid #1E3A8A;padding-bottom:8px}
.meta{color:#666;font-size:0.9em;margin-bottom:24px}</style></head>
<body><h1>Product Family Description: ${familyName}</h1>
<div class="meta">Generated: ${new Date().toLocaleDateString()}</div>
${description}</body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${familyName.replace(/[^a-zA-Z0-9]/g, '_')}_Family_Description.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  const handleOpenInStudio = () => {
    if (savedTemplateId) {
      const productId = scope !== 'enterprise' ? selectedDeviceId : '';
      const params = new URLSearchParams();
      params.set('templateId', savedTemplateId);
      if (productId) params.set('productId', productId);
      navigate(`/app/company/${encodeURIComponent(companyName)}/document-studio?${params.toString()}`);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSavedStudioId(null);
    setSavedTemplateId(null);
    setScope('enterprise');
    setSelectedDeviceId(masterDeviceId);
    setSelectedPhaseId('');
    onOpenChange(false);
  };

  const isSaveDisabled = isSaving
    || (scope === 'phase' && !selectedPhaseId)
    || (needsDeviceSelector && !selectedDeviceId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Document</DialogTitle>
          <DialogDescription>
            Save this family description as a document.
          </DialogDescription>
        </DialogHeader>

        {!savedStudioId ? (
          <>
            {/* Scope Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Location of Document CI</Label>
              <RadioGroup
                value={scope}
                onValueChange={(v) => setScope(v as DocScope)}
                className="space-y-2"
              >
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="enterprise" id="scope-enterprise" />
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Enterprise Level</p>
                    <p className="text-xs text-muted-foreground">Company-wide document, visible across all products</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="device" id="scope-device" />
                  <Box className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Device Specific (No Phase)</p>
                    <p className="text-xs text-muted-foreground">Linked to a device, not tied to a lifecycle phase</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="phase" id="scope-phase" />
                  <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Phase Specific (in Device)</p>
                    <p className="text-xs text-muted-foreground">Linked to a specific lifecycle phase of a device</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Device selector for device & phase scopes */}
            {needsDeviceSelector && (
              <div className="space-y-2">
                <Label className="text-sm">Select Device</Label>
                <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a device..." />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Phase selector when phase-specific */}
            {scope === 'phase' && (
              <div className="space-y-2">
                <Label className="text-sm">Select Phase</Label>
                <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a lifecycle phase..." />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaveDisabled}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Document
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Post-save actions */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              Document CI saved successfully
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <FileEdit className="h-5 w-5" />
                <div className="text-center">
                  <p className="text-sm font-medium">Inline Edit</p>
                  <p className="text-xs text-muted-foreground">Edit from CI box</p>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenInStudio}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <FileEdit className="h-5 w-5" />
                <div className="text-center">
                  <p className="text-sm font-medium">Edit in Studio</p>
                  <p className="text-xs text-muted-foreground">Open in Document Studio</p>
                </div>
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
