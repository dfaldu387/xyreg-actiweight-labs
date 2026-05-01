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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUpdateCCR } from '@/hooks/useChangeControlData';
import { CCRWithRelations, RiskImpact, RISK_IMPACT_LABELS } from '@/types/changeControl';
import { AiAssistPopover } from './AiAssistPopover';

interface CCRImpactEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ccr: CCRWithRelations;
}

export function CCRImpactEditDialog({ open, onOpenChange, ccr }: CCRImpactEditDialogProps) {
  const updateCCR = useUpdateCCR();
  const [riskImpact, setRiskImpact] = useState<RiskImpact>(ccr.risk_impact);
  const [regulatoryImpact, setRegulatoryImpact] = useState<boolean>(ccr.regulatory_impact);
  const [regulatoryDescription, setRegulatoryDescription] = useState<string>(ccr.regulatory_impact_description ?? '');
  const [costImpact, setCostImpact] = useState<string>(ccr.cost_impact != null ? String(ccr.cost_impact) : '');
  const [implementationPlan, setImplementationPlan] = useState<string>(ccr.implementation_plan ?? '');
  const [verificationPlan, setVerificationPlan] = useState<string>(ccr.verification_plan ?? '');

  useEffect(() => {
    if (open) {
      setRiskImpact(ccr.risk_impact);
      setRegulatoryImpact(ccr.regulatory_impact);
      setRegulatoryDescription(ccr.regulatory_impact_description ?? '');
      setCostImpact(ccr.cost_impact != null ? String(ccr.cost_impact) : '');
      setImplementationPlan(ccr.implementation_plan ?? '');
      setVerificationPlan(ccr.verification_plan ?? '');
    }
  }, [open, ccr]);

  const handleSave = async () => {
    const parsedCost = costImpact.trim() === '' ? null : Number(costImpact);
    await updateCCR.mutateAsync({
      id: ccr.id,
      risk_impact: riskImpact,
      regulatory_impact: regulatoryImpact,
      regulatory_impact_description: regulatoryDescription.trim() || null,
      cost_impact: Number.isFinite(parsedCost as number) ? (parsedCost as number) : null,
      implementation_plan: implementationPlan.trim() || null,
      verification_plan: verificationPlan.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Impact Assessment</DialogTitle>
          <DialogDescription>
            Per ISO 13485 §7.3.9, impact must be assessed before approval. Changes are locked once the CCR is approved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Risk Impact</Label>
            <Select value={riskImpact} onValueChange={(v) => setRiskImpact(v as RiskImpact)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(RISK_IMPACT_LABELS) as RiskImpact[]).map((r) => (
                  <SelectItem key={r} value={r}>{RISK_IMPACT_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Regulatory Impact</Label>
            <RadioGroup
              value={regulatoryImpact ? 'yes' : 'no'}
              onValueChange={(v) => setRegulatoryImpact(v === 'yes')}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="reg-no" />
                <Label htmlFor="reg-no" className="font-normal">No</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="reg-yes" />
                <Label htmlFor="reg-yes" className="font-normal">Yes</Label>
              </div>
            </RadioGroup>
          </div>

          {regulatoryImpact && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reg-desc">Regulatory Impact Description</Label>
                <AiAssistPopover
                  ccrId={ccr.id}
                  field="regulatory_impact_description"
                  currentValue={regulatoryDescription}
                  onInsert={setRegulatoryDescription}
                />
              </div>
              <Textarea
                id="reg-desc"
                value={regulatoryDescription}
                onChange={(e) => setRegulatoryDescription(e.target.value)}
                rows={3}
                placeholder="What regulatory submissions or notifications are triggered?"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cost-impact">Cost Impact (USD)</Label>
            <Input
              id="cost-impact"
              type="number"
              value={costImpact}
              onChange={(e) => setCostImpact(e.target.value)}
              placeholder="0"
            />
          </div>

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
              rows={3}
              placeholder="Steps required to execute the change"
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
              rows={3}
              placeholder="How effectiveness will be verified post-implementation"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateCCR.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateCCR.isPending}>
            {updateCCR.isPending ? 'Saving…' : 'Save Impact Assessment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}