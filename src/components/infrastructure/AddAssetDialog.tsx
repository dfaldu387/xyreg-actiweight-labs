import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  onSubmit: (asset: InfrastructureAsset) => void;
  existingCount: number;
}

const TAB_PREFIXES: Record<string, string> = {
  facilities: 'FAC',
  digital: 'DIG',
  equipment: 'EQP',
  maintenance: 'MNT',
};

const TAB_TYPES: Record<string, string[]> = {
  facilities: ['Office', 'Cleanroom (ISO 7)', 'Manufacturing', 'Laboratory', 'Storage'],
  digital: ['RegOS / QMS', 'ERP / MRP', 'PLM / PDM', 'LIMS / Lab System', 'MES / Production', 'DevOps / CI-CD', 'EDMS / DMS', 'CRM / Field Safety', 'Infrastructure / IT'],
  equipment: ['Sterilization', 'Metrology', 'Mechanical Testing', 'Environmental Monitoring'],
  maintenance: ['Preventive', 'Regulatory', 'Corrective', 'Calibration', 'Environmental'],
};

export function AddAssetDialog({ open, onOpenChange, activeTab, onSubmit, existingCount }: AddAssetDialogProps) {
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

  const prefix = TAB_PREFIXES[activeTab] || 'AST';
  const types = TAB_TYPES[activeTab] || [];
  const isDigital = activeTab === 'digital';

  const handleSubmit = () => {
    const newId = `${prefix}-${String(existingCount + 1).padStart(3, '0')}`;
    onSubmit({
      id: newId,
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
    setForm({ name: '', type: '', location: '', validationStatus: 'Pending', nextInspection: '', softwareVersion: '', cybersecurityTier: '', hasEvidence: false });
  };

  const canSubmit = form.name.trim() && form.type && form.location.trim() && form.nextInspection;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{activeTab === 'facilities' ? lang('infrastructure.addDialog.titleFacility') : activeTab === 'digital' ? lang('infrastructure.addDialog.titleDigitalSystem') : activeTab === 'equipment' ? lang('infrastructure.addDialog.titleEquipment') : lang('infrastructure.addDialog.titleMaintenanceLog')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{lang('infrastructure.addDialog.assetName')} *</Label>
            <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder={lang('infrastructure.addDialog.assetNamePlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang('infrastructure.addDialog.type')} *</Label>
              <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue placeholder={lang('infrastructure.addDialog.selectType')} /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{lang('infrastructure.addDialog.location')} *</Label>
              <Input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} placeholder={lang('infrastructure.addDialog.locationPlaceholder')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{lang('infrastructure.addDialog.validationStatus')}</Label>
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
              <Label>{lang('infrastructure.addDialog.nextInspection')} *</Label>
              <Input type="date" value={form.nextInspection} onChange={(e) => setForm(p => ({ ...p, nextInspection: e.target.value }))} />
            </div>
          </div>
          {isDigital && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{lang('infrastructure.addDialog.softwareVersion')}</Label>
                <Input value={form.softwareVersion} onChange={(e) => setForm(p => ({ ...p, softwareVersion: e.target.value }))} placeholder={lang('infrastructure.addDialog.softwareVersionPlaceholder')} />
              </div>
              <div>
                <Label>{lang('infrastructure.addDialog.cybersecurityTier')}</Label>
                <Select value={form.cybersecurityTier} onValueChange={(v) => setForm(p => ({ ...p, cybersecurityTier: v }))}>
                  <SelectTrigger><SelectValue placeholder={lang('infrastructure.addDialog.selectTier')} /></SelectTrigger>
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
            <Label>{lang('infrastructure.addDialog.hasEvidence')}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{lang('infrastructure.addDialog.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>{lang('infrastructure.addDialog.addAsset')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
