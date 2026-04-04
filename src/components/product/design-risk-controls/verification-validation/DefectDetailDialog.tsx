import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowRight, FileText, Shield, ClipboardList } from 'lucide-react';
import { DefectRecord, DefectStatus, DEFECT_STATUS_GATES, DEFECT_STATUS_LABELS, isCapaRequired, canResolve } from '@/types/defect';
import { DefectSeverityBadge, DefectStatusBadge } from './DefectSeverityBadge';
import { useUpdateDefect } from '@/hooks/useDefectsData';

interface DefectDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defect: DefectRecord | null;
  onCreateCapa?: (defect: DefectRecord) => void;
  onCreateCcr?: (defect: DefectRecord) => void;
}

export function DefectDetailDialog({
  open, onOpenChange, defect, onCreateCapa, onCreateCcr,
}: DefectDetailDialogProps) {
  const updateDefect = useUpdateDefect();
  const [resolution, setResolution] = useState(defect?.resolution || '');
  const [rootCause, setRootCause] = useState(defect?.root_cause || '');

  if (!defect) return null;

  const nextStatuses = DEFECT_STATUS_GATES[defect.status as DefectStatus] || [];
  const capaRequired = isCapaRequired(defect.severity as any);
  const resolveCheck = canResolve({ severity: defect.severity as any, resolution, linked_capa_id: defect.linked_capa_id });

  const handleAdvanceStatus = async (newStatus: DefectStatus) => {
    const updates: any = { id: defect.id, status: newStatus };
    if (newStatus === 'resolved') {
      updates.resolution = resolution;
      updates.root_cause = rootCause || null;
      updates.resolved_at = new Date().toISOString();
    }
    await updateDefect.mutateAsync(updates);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{defect.defect_id}</span>
            <span>{defect.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Severity */}
          <div className="flex items-center gap-3">
            <DefectSeverityBadge severity={defect.severity as any} />
            <DefectStatusBadge status={defect.status} />
          </div>

          {/* CAPA Required Banner */}
          {capaRequired && !defect.linked_capa_id && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>CAPA Required (21 CFR 820.100):</strong> This critical defect requires a linked CAPA before it can be resolved.
              </AlertDescription>
            </Alert>
          )}

          {/* CCR Recommended */}
          {defect.status === 'in_progress' && !defect.linked_ccr_id && (
            <Alert>
              <ClipboardList className="h-4 w-4" />
              <AlertDescription>
                <strong>CCR Recommended (ISO 13485):</strong> Changes to a baselined system should be tracked via Change Control.
              </AlertDescription>
            </Alert>
          )}

          {/* Description */}
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p className="text-sm mt-1">{defect.description}</p>
          </div>

          {/* Linked Items */}
          <div>
            <Label className="text-xs text-muted-foreground">Linked Items</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {defect.test_case_id && (
                <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />Test Case</Badge>
              )}
              {defect.linked_hazard_id && (
                <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" />Hazard</Badge>
              )}
              {defect.linked_capa_id && (
                <Badge variant="outline" className="gap-1 border-orange-500 text-orange-700"><AlertTriangle className="h-3 w-3" />CAPA</Badge>
              )}
              {defect.linked_ccr_id && (
                <Badge variant="outline" className="gap-1 border-blue-500 text-blue-700"><ClipboardList className="h-3 w-3" />CCR</Badge>
              )}
              {!defect.test_case_id && !defect.linked_hazard_id && !defect.linked_capa_id && !defect.linked_ccr_id && (
                <span className="text-sm text-muted-foreground">No linked items</span>
              )}
            </div>
          </div>

          {/* Root Cause & Resolution (visible when in_progress or later) */}
          {(defect.status === 'in_progress' || defect.status === 'resolved') && (
            <>
              <div className="space-y-2">
                <Label>Root Cause Analysis</Label>
                <Textarea value={rootCause} onChange={e => setRootCause(e.target.value)} placeholder="Describe the root cause..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Resolution Notes {defect.status === 'in_progress' && '*'}</Label>
                <Textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="How was this defect resolved?" rows={2} />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!defect.linked_capa_id && onCreateCapa && (
              <Button variant="outline" size="sm" onClick={() => onCreateCapa(defect)}>
                <AlertTriangle className="h-3 w-3 mr-1" /> Create CAPA
              </Button>
            )}
            {!defect.linked_ccr_id && onCreateCcr && (
              <Button variant="outline" size="sm" onClick={() => onCreateCcr(defect)}>
                <ClipboardList className="h-3 w-3 mr-1" /> Create CCR
              </Button>
            )}
          </div>

          {/* Status Workflow Buttons */}
          {nextStatuses.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-xs text-muted-foreground mb-2 block">Advance Status</Label>
              <div className="flex gap-2">
                {nextStatuses.map(ns => {
                  const disabled = ns === 'resolved' && !resolveCheck.allowed;
                  return (
                    <Button
                      key={ns}
                      size="sm"
                      variant={ns === 'resolved' ? 'default' : 'outline'}
                      disabled={disabled || updateDefect.isPending}
                      onClick={() => handleAdvanceStatus(ns)}
                      title={disabled ? resolveCheck.reason : undefined}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      {DEFECT_STATUS_LABELS[ns]}
                    </Button>
                  );
                })}
              </div>
              {nextStatuses.includes('resolved') && !resolveCheck.allowed && (
                <p className="text-xs text-destructive mt-1">{resolveCheck.reason}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
