import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronRight } from "lucide-react";

interface DeviceModulePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: { id: string; name: string }[];
  value: Record<string, string[]>;
  onSave: (value: Record<string, string[]>) => void;
  subjectName?: string;
}

const MODULE_TREE: {
  id: string;
  label: string;
  subs: { id: string; label: string }[];
}[] = [
  { id: 'device-dashboard', label: 'Device Dashboard', subs: [] },
  { id: 'business-case', label: 'Business Case', subs: [
    { id: 'xyreg-genesis', label: 'XyReg Genesis' }, { id: 'venture-blueprint', label: 'Venture Blueprint' },
    { id: 'business-canvas', label: 'Business Canvas' }, { id: 'team-profile', label: 'Team' },
    { id: 'market-analysis', label: 'Market Analysis' }, { id: 'gtm-strategy', label: 'GTM' },
    { id: 'use-of-proceeds', label: 'Use of Proceeds' }, { id: 'rnpv', label: 'rNPV Analysis' },
    { id: 'reimbursement', label: 'Reimbursement' }, { id: 'pricing', label: 'Pricing Strategy' },
    { id: 'exit-strategy', label: 'Strategic Horizon' }, { id: 'ip-strategy', label: 'IP Strategy' },
  ]},
  { id: 'device-definition', label: 'Device Definition', subs: [
    { id: 'overview', label: 'Overview' }, { id: 'general', label: 'General' },
    { id: 'purpose', label: 'Intended Purpose' }, { id: 'markets-tab', label: 'Market & Regulatory' },
    { id: 'identification', label: 'Identification' }, { id: 'bundles', label: 'Bundles' },
    { id: 'variants', label: 'Variants' },
  ]},
  { id: 'bill-of-materials', label: 'Bill of Materials', subs: [] },
  { id: 'design-risk-controls', label: 'Design & Risk Controls', subs: [
    { id: 'requirements', label: 'Requirements' }, { id: 'architecture', label: 'Architecture' },
    { id: 'risk-mgmt', label: 'Risk Management' }, { id: 'vv', label: 'Verification & Validation' },
    { id: 'usability-engineering', label: 'Usability Engineering' }, { id: 'traceability', label: 'Traceability' },
  ]},
  { id: 'development-lifecycle', label: 'Development Lifecycle', subs: [] },
  { id: 'operations', label: 'Operations', subs: [
    { id: 'supply-chain', label: 'Supply Chain' }, { id: 'incoming-inspection', label: 'Incoming Inspection' },
    { id: 'production', label: 'Production' }, { id: 'sterilization-cleanliness', label: 'Sterilization & Cleanliness' },
    { id: 'preservation-handling', label: 'Preservation & Handling' },
    { id: 'installation-servicing', label: 'Installation & Servicing' }, { id: 'customer-property', label: 'Customer Property' },
  ]},
  { id: 'clinical-trials', label: 'Clinical Trials', subs: [] },
  { id: 'quality-governance', label: 'Quality Governance', subs: [
    { id: 'audits', label: 'Audits' }, { id: 'nonconformity', label: 'Nonconformity' },
    { id: 'product-capa', label: 'CAPA' }, { id: 'product-change-control', label: 'Change Control' },
    { id: 'design-review', label: 'Design Review' }, { id: 'user-access', label: 'User Access' },
  ]},
  { id: 'audit-log', label: 'Audit Log', subs: [] },
  { id: 'regulatory-submissions', label: 'Regulatory & Submissions', subs: [
    { id: 'gap-analysis', label: 'Gap Analysis' }, { id: 'activities', label: 'Activities' },
    { id: 'documents', label: 'Technical Documentation' }, { id: 'technical-file', label: 'Technical File' },
    { id: 'pms', label: 'Post-Market Surveillance' },
  ]},
];

const ALL_PARENT_MODULE_IDS = MODULE_TREE.map(m => m.id);

export function DeviceModulePickerDialog({
  open,
  onOpenChange,
  devices,
  value,
  onSave,
  subjectName,
}: DeviceModulePickerDialogProps) {
  const [temp, setTemp] = useState<Record<string, string[]>>(value);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

  // Re-seed temp state whenever the dialog opens
  useEffect(() => {
    if (open) {
      setTemp(value);
      setExpandedDevice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSave = () => {
    onSave(temp);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Device Module Access</DialogTitle>
          <DialogDescription>
            Configure which modules{' '}
            <span className="font-bold">{subjectName || 'this user'}</span>{' '}
            can access per device. Click a device to expand and toggle modules on/off.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          <div className="space-y-1 pr-4">
            {devices.map(device => {
              const isExpanded = expandedDevice === device.id;
              const deviceMods = temp[device.id] || [];
              const moduleCount = deviceMods.filter(m => ALL_PARENT_MODULE_IDS.includes(m)).length;

              return (
                <div key={device.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedDevice(isExpanded ? null : device.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium">{device.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {moduleCount === 0 ? 'No restrictions' : `${moduleCount} of ${ALL_PARENT_MODULE_IDS.length} modules`}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/20 p-2 space-y-0.5">
                      <div className="flex justify-end mb-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            if (moduleCount === ALL_PARENT_MODULE_IDS.length) {
                              setTemp(prev => ({ ...prev, [device.id]: [] }));
                            } else {
                              setTemp(prev => ({ ...prev, [device.id]: [...ALL_PARENT_MODULE_IDS] }));
                            }
                          }}
                        >
                          {moduleCount === ALL_PARENT_MODULE_IDS.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      {MODULE_TREE.map((mod) => {
                        const subIds = mod.subs.map(s => `${mod.id}.${s.id}`);
                        const enabledSubCount = subIds.filter(id => deviceMods.includes(id)).length;
                        return (
                          <div key={mod.id}>
                            <div className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-background">
                              <label htmlFor={`dmp-${device.id}-${mod.id}`} className="text-sm font-medium cursor-pointer">
                                {mod.label}
                                {mod.subs.length > 0 && <span className="text-xs text-muted-foreground ml-1">({enabledSubCount}/{mod.subs.length})</span>}
                              </label>
                              <Switch
                                id={`dmp-${device.id}-${mod.id}`}
                                checked={deviceMods.includes(mod.id)}
                                onCheckedChange={(checked) => {
                                  setTemp(prev => {
                                    const current = prev[device.id] || [];
                                    if (checked) {
                                      return { ...prev, [device.id]: [...new Set([...current, mod.id, ...subIds])] };
                                    } else {
                                      const removeSet = new Set([mod.id, ...subIds]);
                                      return { ...prev, [device.id]: current.filter(id => !removeSet.has(id)) };
                                    }
                                  });
                                }}
                                className="scale-75"
                              />
                            </div>
                            {mod.subs.length > 0 && deviceMods.includes(mod.id) && (
                              <div className="ml-6 mb-1 space-y-0.5 border-l-2 border-muted pl-3">
                                {mod.subs.map((sub) => {
                                  const subFullId = `${mod.id}.${sub.id}`;
                                  return (
                                    <div key={sub.id} className="flex items-center justify-between py-0.5 pr-1">
                                      <label htmlFor={`dmp-${device.id}-${subFullId}`} className="text-xs text-muted-foreground cursor-pointer">
                                        {sub.label}
                                      </label>
                                      <Switch
                                        id={`dmp-${device.id}-${subFullId}`}
                                        checked={deviceMods.includes(subFullId)}
                                        onCheckedChange={(checked) => {
                                          setTemp(prev => {
                                            const current = prev[device.id] || [];
                                            return {
                                              ...prev,
                                              [device.id]: checked
                                                ? [...current, subFullId]
                                                : current.filter(id => id !== subFullId),
                                            };
                                          });
                                        }}
                                        className="scale-[0.6]"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <Separator className="mt-1" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
