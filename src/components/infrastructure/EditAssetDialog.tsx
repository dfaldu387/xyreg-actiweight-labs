import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface InfrastructureAsset {
  id: string;
  name: string;
  type: string;
  location: string;
  validationStatus: 'Validated' | 'Pending' | 'Expired';
  nextInspection: string;
  softwareVersion?: string;
  cybersecurityTier?: string;
  hasEvidence: boolean;
}

interface EditAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  asset: InfrastructureAsset | null;
  onSubmit: (asset: InfrastructureAsset) => void;
}

const TAB_TYPES: Record<string, string[]> = {
  facilities: ['Office', 'Cleanroom (ISO 7)', 'Manufacturing', 'Laboratory', 'Storage'],
  digital: ['RegOS / QMS', 'ERP / MRP', 'PLM / PDM', 'LIMS / Lab System', 'MES / Production', 'DevOps / CI-CD', 'EDMS / DMS', 'CRM / Field Safety', 'Infrastructure / IT'],
  equipment: ['Sterilization', 'Metrology', 'Mechanical Testing', 'Environmental Monitoring'],
  maintenance: ['Preventive', 'Regulatory', 'Corrective', 'Calibration', 'Environmental'],
};

export function EditAssetDialog({ open, onOpenChange, activeTab, asset, onSubmit }: EditAssetDialogProps) {
  const { lang } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    type: '',
    location: '',
    validationStatus: 'Pending' as 'Validated' | 'Pending' | 'Expired',
    nextInspection: '',
    softwareVersion: '',
    cybersecurityTier: '',
    hasEvidence: false,
  });

  useEffect(() => {
    if (asset) {
      setForm({
        name: asset.name,
        type: asset.type,
        location: asset.location,
        validationStatus: asset.validationStatus,
        nextInspection: asset.nextInspection,
        softwareVersion: asset.softwareVersion || '',
        cybersecurityTier: asset.cybersecurityTier || '',
        hasEvidence: asset.hasEvidence,
      });
    }
  }, [asset]);

  const types = TAB_TYPES[activeTab] || [];
  const isDigital = activeTab === 'digital';

  const handleSubmit = () => {
    if (!asset) return;
    onSubmit({
      id: asset.id,
      name: form.name,
      type: form.type,
      location: form.location,
      validationStatus: form.validationStatus,
      nextInspection: form.nextInspection,
      softwareVersion: isDigital ? form.softwareVersion || undefined : undefined,
      cybersecurityTier: isDigital ? form.cybersecurityTier || undefined : undefined,
      hasEvidence: form.hasEvidence,
    });
    onOpenChange(false);
  };

  const canSubmit = form.name.trim() && form.type && form.location.trim() && form.nextInspection;

  const entityLabel = activeTab === 'facilities' ? lang('infrastructure.editDialog.titleFacility') : activeTab === 'digital' ? lang('infrastructure.editDialog.titleDigitalSystem') : activeTab === 'equipment' ? lang('infrastructure.editDialog.titleEquipment') : lang('infrastructure.editDialog.titleMaintenanceLog');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{entityLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-xs">{lang('infrastructure.editDialog.assetId')}</Label>
            <Input value={asset?.id || ''} disabled className="font-mono text-xs bg-muted/50" />
          </div>
          <div>
            <Label>{lang('infrastructure.editDialog.assetName')} *</Label>
            <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang('infrastructure.editDialog.type')} *</Label>
              <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue placeholder={lang('infrastructure.editDialog.selectType')} /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{lang('infrastructure.editDialog.location')} *</Label>
              <Input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang('infrastructure.editDialog.validationStatus')}</Label>
              <Select value={form.validationStatus} onValueChange={(v) => setForm(p => ({ ...p, validationStatus: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Validated">{lang('infrastructure.statusValidated')}</SelectItem>
                  <SelectItem value="Pending">{lang('infrastructure.statusPending')}</SelectItem>
                  <SelectItem value="Expired">{lang('infrastructure.statusExpired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isDigital ? `${lang('infrastructure.editDialog.nextRevalidation')} *` : `${lang('infrastructure.editDialog.nextInspection')} *`}</Label>
              <Input type="date" value={form.nextInspection} onChange={(e) => setForm(p => ({ ...p, nextInspection: e.target.value }))} />
              {isDigital && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {lang('infrastructure.editDialog.revalidationHint')}
                </p>
              )}
            </div>
          </div>
          {isDigital && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{lang('infrastructure.editDialog.softwareVersion')}</Label>
                <Input value={form.softwareVersion} onChange={(e) => setForm(p => ({ ...p, softwareVersion: e.target.value }))} placeholder={lang('infrastructure.editDialog.softwareVersionPlaceholder')} />
              </div>
              <div>
                <Label>{lang('infrastructure.editDialog.cybersecurityTier')}</Label>
                <Select value={form.cybersecurityTier} onValueChange={(v) => setForm(p => ({ ...p, cybersecurityTier: v }))}>
                  <SelectTrigger><SelectValue placeholder={lang('infrastructure.editDialog.selectTier')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tier 1">Tier 1</SelectItem>
                    <SelectItem value="Tier 2">Tier 2</SelectItem>
                    <SelectItem value="Tier 3">Tier 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Switch checked={form.hasEvidence} onCheckedChange={(v) => setForm(p => ({ ...p, hasEvidence: v }))} />
            <Label>{lang('infrastructure.editDialog.hasEvidence')}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{lang('infrastructure.editDialog.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>{lang('infrastructure.editDialog.saveChanges')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
