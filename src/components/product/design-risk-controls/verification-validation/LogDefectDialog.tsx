import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info, CheckCircle2, FileText, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCreateDefect, useUpdateDefect } from '@/hooks/useDefectsData';
import { generateDefectId } from '@/hooks/useDefectsData';
import { DefectSeverity, DefectRecord, DEFECT_SEVERITY_LABELS, isCapaRequired } from '@/types/defect';
import { useCreateCAPA } from '@/hooks/useCAPAData';
import { useCreateCCR } from '@/hooks/useChangeControlData';
import { UserSelector } from '@/components/common/UserSelector';
import { toast } from 'sonner';

interface LogDefectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  prefillTestCaseId?: string | null;
  prefillTestExecutionId?: string | null;
}

type DialogPhase = 'form' | 'routing';

export function LogDefectDialog({
  open, onOpenChange, productId, companyId,
  prefillTestCaseId, prefillTestExecutionId,
}: LogDefectDialogProps) {
  const createDefect = useCreateDefect();
  const updateDefect = useUpdateDefect();
  const createCAPA = useCreateCAPA();
  const createCCR = useCreateCCR();

  const [phase, setPhase] = useState<DialogPhase>('form');
  const [createdDefect, setCreatedDefect] = useState<DefectRecord | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<DefectSeverity>('medium');
  const [assignedTo, setAssignedTo] = useState<string | undefined>();
  const [linkedHazardId, setLinkedHazardId] = useState<string>('none');
  const [testCaseId, setTestCaseId] = useState<string>(prefillTestCaseId || 'none');
  const [hazards, setHazards] = useState<{ id: string; hazard_id: string; description: string }[]>([]);
  const [testCases, setTestCases] = useState<{ id: string; test_case_id: string; description: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase.from('hazards').select('id, hazard_id, description').eq('product_id', productId)
      .then(({ data }) => setHazards(data || []));
    supabase.from('test_cases').select('id, test_case_id, description').eq('product_id', productId)
      .then(({ data }) => setTestCases((data as any[]) || []));
  }, [open, productId]);

  useEffect(() => {
    if (prefillTestCaseId) setTestCaseId(prefillTestCaseId);
  }, [prefillTestCaseId]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setSeverity('medium');
    setAssignedTo(undefined); setLinkedHazardId('none'); setTestCaseId('none');
    setPhase('form'); setCreatedDefect(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const defectId = await generateDefectId(companyId);
    const hazardId = linkedHazardId !== 'none' ? linkedHazardId : null;

    const defect = await createDefect.mutateAsync({
      product_id: productId,
      company_id: companyId,
      defect_id: defectId,
      title: title.trim(),
      description: description.trim(),
      severity,
      reported_by: user.id,
      assigned_to: assignedTo || null,
      linked_hazard_id: hazardId,
      test_case_id: testCaseId !== 'none' ? testCaseId : null,
      test_execution_id: prefillTestExecutionId || null,
    });

    setCreatedDefect(defect);

    // Critical/High: auto-create CAPA immediately
    if (isCapaRequired(severity)) {
      try {
        const capa = await createCAPA.mutateAsync({
          company_id: companyId,
          product_id: productId,
          source_type: 'defect',
          source_id: defect.id,
          capa_type: 'corrective',
          problem_description: `Auto-initiated from defect ${defectId}: ${title.trim()}`,
          created_by: user.id,
          severity: severity === 'critical' ? 5 : 4,
        });

        await updateDefect.mutateAsync({
          id: defect.id,
          linked_capa_id: capa.id,
        });

        toast.info(`CAPA ${capa.capa_id} auto-created per 21 CFR 820.100`);
      } catch (err) {
        console.error('Failed to auto-create CAPA:', err);
        toast.warning('Defect created but CAPA auto-creation failed. Please create manually.');
      }
      handleClose();
    } else {
      // Medium/Low: show routing options
      setPhase('routing');
    }
  };

  const handleRouteCapa = async () => {
    if (!createdDefect) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const capa = await createCAPA.mutateAsync({
        company_id: companyId,
        product_id: productId,
        source_type: 'defect',
        source_id: createdDefect.id,
        capa_type: 'corrective',
        problem_description: `Initiated from defect ${createdDefect.defect_id}: ${createdDefect.title}`,
        created_by: user.id,
        severity: severity === 'medium' ? 3 : 2,
      });

      await updateDefect.mutateAsync({
        id: createdDefect.id,
        linked_capa_id: capa.id,
      });

      toast.success(`CAPA ${capa.capa_id} created and linked to ${createdDefect.defect_id}`);
    } catch (err) {
      console.error('Failed to create CAPA:', err);
      toast.error('Failed to create CAPA. You can create one manually from the defect detail.');
    }
    handleClose();
  };

  const handleRouteCcr = async () => {
    if (!createdDefect) return;

    try {
      await createCCR.mutateAsync({
        company_id: companyId,
        product_id: productId,
        source_type: 'other',
        source_reference: createdDefect.defect_id,
        change_type: 'design',
        title: `Fix: ${createdDefect.title}`,
        description: `Change Control initiated from defect ${createdDefect.defect_id}.\n\n${createdDefect.description}`,
      });

      toast.success(`CCR created and linked to ${createdDefect.defect_id}`);
    } catch (err) {
      console.error('Failed to create CCR:', err);
      toast.error('Failed to create CCR. You can create one manually.');
    }
    handleClose();
  };

  const handleCorrectionOnly = () => {
    toast.success(`Defect ${createdDefect?.defect_id} logged as correction only.`);
    handleClose();
  };

  const showCapaWarning = isCapaRequired(severity);
  const showRoutingInfo = !showCapaWarning && (severity === 'medium' || severity === 'low');

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{phase === 'form' ? 'Log Defect' : 'Route Defect Response'}</DialogTitle>
        </DialogHeader>

        {phase === 'form' && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief defect summary" />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Steps to reproduce, expected vs actual behavior" rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={v => setSeverity(v as DefectSeverity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEFECT_SEVERITY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showCapaWarning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    CAPA will be auto-created for this severity level (21 CFR 820.100).
                  </AlertDescription>
                </Alert>
              )}

              {showRoutingInfo && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    After logging, you can route this to CAPA or Change Control.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Linked Hazard</Label>
                <Select value={linkedHazardId} onValueChange={setLinkedHazardId}>
                  <SelectTrigger><SelectValue placeholder="Select hazard..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None — No known hazard</SelectItem>
                    {hazards.map(h => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.hazard_id} — {h.description?.substring(0, 60)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Linked Test Case</Label>
                <Select value={testCaseId} onValueChange={setTestCaseId}>
                  <SelectTrigger><SelectValue placeholder="Select test case..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {testCases.map(tc => (
                      <SelectItem key={tc.id} value={tc.id}>
                        {tc.test_case_id} — {tc.description?.substring(0, 60)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <UserSelector
                value={assignedTo}
                onValueChange={setAssignedTo}
                companyId={companyId}
                label="Assign To"
                placeholder="Select assignee..."
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!title.trim() || !description.trim() || createDefect.isPending}>
                {createDefect.isPending ? 'Creating...' : 'Log Defect'}
              </Button>
            </DialogFooter>
          </>
        )}

        {phase === 'routing' && createdDefect && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Defect <strong>{createdDefect.defect_id}</strong> logged successfully. Choose follow-up action:
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={handleRouteCapa}
                disabled={createCAPA.isPending}
              >
                <Shield className="h-4 w-4" />
                Create CAPA — Systemic investigation needed
              </Button>

              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={handleRouteCcr}
                disabled={createCCR.isPending}
              >
                <FileText className="h-4 w-4" />
                Create CCR — Controlled document change needed
              </Button>

              <Button
                className="w-full justify-start gap-2"
                variant="ghost"
                onClick={handleCorrectionOnly}
              >
                <CheckCircle2 className="h-4 w-4" />
                Correction Only — One-off rework/scrap disposition
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
