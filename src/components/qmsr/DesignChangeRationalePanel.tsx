import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Shield, Sparkles, AlertTriangle, CheckCircle, Loader2, FileEdit, X } from 'lucide-react';
import { getDesignChangeClassification } from './RBRRecommendationEngine';
import { useGenerateRationale } from '@/hooks/useRationales';
import type { DesignChangeContext } from '@/types/riskBasedRationale';
import { toast } from 'sonner';

interface DesignChangeRationalePanelProps {
  productId: string;
  companyId: string;
  changeRequestId?: string;
  productName?: string;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

type RiskImpact = 'critical' | 'high' | 'medium' | 'low';

export function DesignChangeRationalePanel({
  productId,
  companyId,
  changeRequestId,
  productName,
  onSave,
  onCancel,
}: DesignChangeRationalePanelProps) {
  const [changeDescription, setChangeDescription] = useState('');
  const [affectedOutputs, setAffectedOutputs] = useState<string[]>([]);
  const [newOutput, setNewOutput] = useState('');
  const [riskImpact, setRiskImpact] = useState<RiskImpact>('medium');
  const [changesIntendedUse, setChangesIntendedUse] = useState(false);
  const [affectsPerformance, setAffectsPerformance] = useState(false);
  const [rationaleText, setRationaleText] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [overrideClassification, setOverrideClassification] = useState<'Minor' | 'Major' | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const generateRationale = useGenerateRationale();

  // Get recommendation based on current inputs
  const recommendation = getDesignChangeClassification(
    affectedOutputs,
    riskImpact,
    changesIntendedUse,
    affectsPerformance
  );

  const effectiveClassification = isOverride && overrideClassification 
    ? overrideClassification 
    : recommendation.classification;

  const handleAddOutput = () => {
    if (newOutput.trim() && !affectedOutputs.includes(newOutput.trim())) {
      setAffectedOutputs([...affectedOutputs, newOutput.trim()]);
      setNewOutput('');
    }
  };

  const handleRemoveOutput = (output: string) => {
    setAffectedOutputs(affectedOutputs.filter((o) => o !== output));
  };

  const handleGenerateRationale = async () => {
    if (!changeDescription.trim()) {
      toast.error('Please enter the change description');
      return;
    }

    const context: DesignChangeContext = {
      change_description: changeDescription,
      affected_design_outputs: affectedOutputs,
      risk_impact: riskImpact,
      product_name: productName,
    };

    try {
      const result = await generateRationale.mutateAsync({
        type: 'design_change',
        context,
        companyId,
      });
      
      if (result.rationale_text) {
        setRationaleText(result.rationale_text);
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleSave = () => {
    if (!changeDescription.trim()) {
      toast.error('Please enter the change description');
      return;
    }
    if (!rationaleText.trim()) {
      toast.error('Please generate or enter the rationale text');
      return;
    }
    if (isOverride && !overrideReason.trim()) {
      toast.error('Please provide a reason for overriding the recommendation');
      return;
    }

    const data = {
      product_id: productId,
      change_request_id: changeRequestId,
      change_description: changeDescription,
      change_classification: effectiveClassification,
      affected_design_outputs: affectedOutputs,
      clinical_data_required: effectiveClassification === 'Major' ? recommendation.clinicalDataRequired : false,
      regulatory_submission_required: effectiveClassification === 'Major' ? recommendation.regulatorySubmissionRequired : false,
      rationale_text: rationaleText,
      qmsr_clause_reference: '7.3.9',
      determination: effectiveClassification === 'Major' ? 'Requires Full Re-Validation' : 'Proceed as Minor Change',
      is_override: isOverride,
      override_reason: overrideReason || undefined,
    };

    onSave?.(data);
  };

  return (
    <Card className="border-indigo-200">
      <CardHeader className="bg-indigo-50/50">
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <FileEdit className="h-5 w-5 text-indigo-600" />
          Design Change Rationale (RBR-DCH)
        </CardTitle>
        <CardDescription>
          Classify design changes as Minor or Major per QMSR Clause 7.3.9
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Change Description */}
        <div className="space-y-2">
          <Label htmlFor="change-description">Change Description *</Label>
          <Textarea
            id="change-description"
            placeholder="Describe the design change being implemented..."
            value={changeDescription}
            onChange={(e) => setChangeDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Affected Design Outputs */}
        <div className="space-y-2">
          <Label>Affected Design Outputs</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Drawing 001-A, Software Module, etc."
              value={newOutput}
              onChange={(e) => setNewOutput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddOutput()}
            />
            <Button variant="outline" onClick={handleAddOutput}>
              Add
            </Button>
          </div>
          {affectedOutputs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {affectedOutputs.map((output) => (
                <Badge key={output} variant="secondary" className="flex items-center gap-1">
                  {output}
                  <button onClick={() => handleRemoveOutput(output)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {affectedOutputs.length} design output(s) affected
          </p>
        </div>

        {/* Risk Impact */}
        <div className="space-y-2">
          <Label htmlFor="risk-impact">Risk Impact Level *</Label>
          <Select value={riskImpact} onValueChange={(v) => setRiskImpact(v as RiskImpact)}>
            <SelectTrigger id="risk-impact">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical - Direct patient safety impact</SelectItem>
              <SelectItem value="high">High - Significant risk increase</SelectItem>
              <SelectItem value="medium">Medium - Moderate risk change</SelectItem>
              <SelectItem value="low">Low - Minimal risk change</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Questions */}
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <Label className="text-sm font-medium">Change Impact Assessment</Label>
          
          <div className="flex items-start gap-3">
            <Checkbox
              id="intended-use"
              checked={changesIntendedUse}
              onCheckedChange={(checked) => setChangesIntendedUse(checked as boolean)}
            />
            <div>
              <Label htmlFor="intended-use" className="cursor-pointer">
                Does this change affect the intended use?
              </Label>
              <p className="text-xs text-muted-foreground">
                Changes to indications, patient population, or use environment
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="performance"
              checked={affectsPerformance}
              onCheckedChange={(checked) => setAffectsPerformance(checked as boolean)}
            />
            <div>
              <Label htmlFor="performance" className="cursor-pointer">
                Does this change affect device performance?
              </Label>
              <p className="text-xs text-muted-foreground">
                Changes to specifications, outputs, or safety characteristics
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Recommendation Section */}
        <div className={`p-4 rounded-lg border space-y-3 ${
          recommendation.classification === 'Major' 
            ? 'bg-amber-50 border-amber-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">QMSR Classification</span>
            <Badge variant="outline" className={
              recommendation.classification === 'Major'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-green-100 text-green-800 border-green-300'
            }>
              {recommendation.classification} Change
            </Badge>
          </div>
          
          <p className="text-sm">{recommendation.rationale}</p>
          
          {recommendation.classification === 'Major' && (
            <div className="grid grid-cols-2 gap-4 text-sm pt-2">
              <div className="flex items-center gap-2">
                {recommendation.clinicalDataRequired ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span>Clinical Data: {recommendation.clinicalDataRequired ? 'Required' : 'Not Required'}</span>
              </div>
              <div className="flex items-center gap-2">
                {recommendation.regulatorySubmissionRequired ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span>Regulatory Submission: {recommendation.regulatorySubmissionRequired ? 'Required' : 'Not Required'}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{recommendation.qmsrJustification}</p>
        </div>

        {/* Override Option */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="override"
            checked={isOverride}
            onCheckedChange={(checked) => {
              setIsOverride(checked as boolean);
              if (!checked) {
                setOverrideClassification(null);
                setOverrideReason('');
              }
            }}
          />
          <div>
            <Label htmlFor="override" className="cursor-pointer">
              Override classification recommendation
            </Label>
            <p className="text-xs text-muted-foreground">
              Document justification if deviating from the recommended classification
            </p>
          </div>
        </div>

        {/* Override Details */}
        {isOverride && (
          <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="space-y-2">
              <Label>Override Classification</Label>
              <Select 
                value={overrideClassification || ''} 
                onValueChange={(v) => setOverrideClassification(v as 'Minor' | 'Major')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Minor">Minor Change</SelectItem>
                  <SelectItem value="Major">Major Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="override-reason" className="text-amber-900">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Override Justification *
              </Label>
              <Textarea
                id="override-reason"
                placeholder="Document why a different classification is appropriate..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        <Separator />

        {/* Rationale Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rationale">Rationale Text *</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateRationale}
              disabled={generateRationale.isPending || !changeDescription.trim()}
            >
              {generateRationale.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate with AI
            </Button>
          </div>
          <Textarea
            id="rationale"
            placeholder="The rationale explaining the change classification..."
            value={rationaleText}
            onChange={(e) => setRationaleText(e.target.value)}
            rows={5}
          />
        </div>

        {/* Determination Display */}
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          effectiveClassification === 'Major' ? 'bg-amber-100' : 'bg-green-100'
        }`}>
          {effectiveClassification === 'Major' ? (
            <>
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Requires Full Re-Validation</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Proceed as Minor Change</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave}>
            Save Rationale
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DesignChangeRationalePanel;
