import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateCCR } from '@/hooks/useChangeControlData';
import { CCRWithRelations } from '@/types/changeControl';
import { AiAssistPopover } from './AiAssistPopover';

interface CCRImplementationEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ccr: CCRWithRelations;
}

export function CCRImplementationEditDialog({ open, onOpenChange, ccr }: CCRImplementationEditDialogProps) {
  const updateCCR = useUpdateCCR();
  const [implementationPlan, setImplementationPlan] = useState<string>(ccr.implementation_plan ?? '');
  const [implementationNotes, setImplementationNotes] = useState<string>(ccr.implementation_notes ?? '');
  const [verificationPlan, setVerificationPlan] = useState<string>(ccr.verification_plan ?? '');
  const [verificationEvidence, setVerificationEvidence] = useState<string>(ccr.verification_evidence ?? '');

  useEffect(() => {
    if (open) {
      setImplementationPlan(ccr.implementation_plan ?? '');
      setImplementationNotes(ccr.implementation_notes ?? '');
      setVerificationPlan(ccr.verification_plan ?? '');
      setVerificationEvidence(ccr.verification_evidence ?? '');
    }
  }, [open, ccr]);

  const handleSave = async () => {
    await updateCCR.mutateAsync({
      id: ccr.id,
      implementation_plan: implementationPlan.trim() || null,
      implementation_notes: implementationNotes.trim() || null,
      verification_plan: verificationPlan.trim() || null,
      verification_evidence: verificationEvidence.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Implementation & Verification</DialogTitle>
          <DialogDescription>
            Document how the change will be executed and how its effectiveness will be verified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="impl-plan">Implementation Plan</Label>
              <AiAssistPopover
                ccrId={ccr.id}
                field="implementation_plan"
                currentValue={implementationPlan}
                onInsert={setImplementationPlan}
              />
            </div>
            <Textarea
              id="impl-plan"
              value={implementationPlan}
              onChange={(e) => setImplementationPlan(e.target.value)}
              rows={5}
              placeholder="Steps required to execute the change"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="impl-notes">Implementation Notes</Label>
            <Textarea
              id="impl-notes"
              value={implementationNotes}
              onChange={(e) => setImplementationNotes(e.target.value)}
              rows={3}
              placeholder="Notes captured during execution"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ver-plan">Verification Plan</Label>
              <AiAssistPopover
                ccrId={ccr.id}
                field="verification_plan"
                currentValue={verificationPlan}
                onInsert={setVerificationPlan}
              />
            </div>
            <Textarea
              id="ver-plan"
              value={verificationPlan}
              onChange={(e) => setVerificationPlan(e.target.value)}
              rows={4}
              placeholder="How effectiveness will be verified post-implementation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ver-evidence">Verification Evidence</Label>
            <Textarea
              id="ver-evidence"
              value={verificationEvidence}
              onChange={(e) => setVerificationEvidence(e.target.value)}
              rows={3}
              placeholder="References to evidence collected (test reports, records, links)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateCCR.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateCCR.isPending}>
            {updateCCR.isPending ? 'Saving…' : 'Save Implementation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}