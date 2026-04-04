import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Shield, Sparkles, AlertTriangle, CheckCircle, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { getCAPAPromotionRecommendation } from './RBRRecommendationEngine';
import { useGenerateRationale } from '@/hooks/useRationales';
import type { CAPAPriorityContext } from '@/types/riskBasedRationale';
import { toast } from 'sonner';

interface CAPAPriorityRationalePanelProps {
  companyId: string;
  sourceEventId: string;
  sourceType: 'NCR' | 'Audit Finding' | 'Customer Complaint';
  eventDescription?: string;
  initialSeverity?: number;
  initialProbability?: number;
  isRecurring?: boolean;
  similarEventsCount?: number;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export function CAPAPriorityRationalePanel({
  companyId,
  sourceEventId,
  sourceType,
  eventDescription: initialEventDescription = '',
  initialSeverity = 3,
  initialProbability = 3,
  isRecurring: initialIsRecurring = false,
  similarEventsCount = 0,
  onSave,
  onCancel,
}: CAPAPriorityRationalePanelProps) {
  const [eventDescription, setEventDescription] = useState(initialEventDescription);
  const [severity, setSeverity] = useState(initialSeverity);
  const [probability, setProbability] = useState(initialProbability);
  const [isRecurring, setIsRecurring] = useState(initialIsRecurring);
  const [rationaleText, setRationaleText] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState<boolean | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const generateRationale = useGenerateRationale();

  // Get recommendation based on current inputs
  const recommendation = getCAPAPromotionRecommendation(
    severity,
    probability,
    isRecurring,
    similarEventsCount
  );

  const rpn = severity * probability;
  const effectiveDecision = isOverride && overrideDecision !== null
    ? overrideDecision
    : recommendation.shouldPromote;

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleGenerateRationale = async () => {
    if (!eventDescription.trim()) {
      toast.error('Please enter the event description');
      return;
    }

    const context: CAPAPriorityContext = {
      event_description: eventDescription,
      source_type: sourceType,
      severity,
      probability,
      is_recurring: isRecurring,
      similar_events_count: similarEventsCount,
    };

    try {
      const result = await generateRationale.mutateAsync({
        type: 'capa_priority',
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
    if (!eventDescription.trim()) {
      toast.error('Please enter the event description');
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
      source_event_id: sourceEventId,
      source_type: sourceType,
      event_description: eventDescription,
      risk_assessment: { severity, probability },
      is_recurring: isRecurring,
      promoted_to_capa: effectiveDecision,
      rationale_text: rationaleText,
      qmsr_clause_reference: '8.5',
      determination: effectiveDecision ? 'CAPA Required' : 'CAPA Not Required - Correction Sufficient',
      is_override: isOverride,
      override_reason: overrideReason || undefined,
    };

    onSave?.(data);
  };

  return (
    <Card className="border-amber-200">
      <CardHeader className="bg-amber-50/50">
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          CAPA Priority Rationale (RBR-CAP)
          <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-300">
            High FDA Scrutiny
          </Badge>
        </CardTitle>
        <CardDescription>
          Justify CAPA promotion decision per QMSR Clause 8.5 - This is closely inspected by FDA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Source Information */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <Label className="text-xs text-muted-foreground">Source Event ID</Label>
            <p className="font-mono text-sm">{sourceEventId}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Source Type</Label>
            <Badge variant="outline">{sourceType}</Badge>
          </div>
        </div>

        {/* Event Description */}
        <div className="space-y-2">
          <Label htmlFor="event-description">Event Description *</Label>
          <Textarea
            id="event-description"
            placeholder="Describe the non-conformance, audit finding, or complaint..."
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Risk Assessment */}
        <div className="space-y-4 p-4 border rounded-lg">
          <Label className="text-base font-medium">Risk Assessment</Label>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Severity (Patient Impact)</Label>
                <span className="text-sm font-medium">{severity}</span>
              </div>
              <Slider
                value={[severity]}
                onValueChange={([val]) => setSeverity(val)}
                min={1}
                max={5}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Negligible</span>
                <span>Minor</span>
                <span>Moderate</span>
                <span>Major</span>
                <span>Catastrophic</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Probability (Recurrence Likelihood)</Label>
                <span className="text-sm font-medium">{probability}</span>
              </div>
              <Slider
                value={[probability]}
                onValueChange={([val]) => setProbability(val)}
                min={1}
                max={5}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Remote</span>
                <span>Unlikely</span>
                <span>Occasional</span>
                <span>Likely</span>
                <span>Frequent</span>
              </div>
            </div>
          </div>

          {/* RPN Display */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label className="text-sm">Risk Priority Number (RPN)</Label>
              <p className="text-xs text-muted-foreground">Severity × Probability</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold">{rpn}</span>
              <Badge className={`ml-2 ${getRiskLevelColor(recommendation.riskLevel)}`}>
                {recommendation.riskLevel}
              </Badge>
            </div>
          </div>
        </div>

        {/* Recurring Event */}
        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <Checkbox
            id="recurring"
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
          />
          <div>
            <Label htmlFor="recurring" className="cursor-pointer font-medium">
              This is a recurring issue
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Similar events have occurred before. Recurring issues typically require CAPA.
            </p>
            {similarEventsCount > 0 && (
              <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-700">
                {similarEventsCount} similar event(s) detected
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Recommendation Section */}
        <div className={`p-4 rounded-lg border space-y-3 ${
          recommendation.shouldPromote 
            ? 'bg-red-50 border-red-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">QMSR Recommendation</span>
            <Badge variant="outline" className={
              recommendation.shouldPromote
                ? 'bg-red-100 text-red-800 border-red-300'
                : 'bg-green-100 text-green-800 border-green-300'
            }>
              {recommendation.shouldPromote ? 'CAPA Required' : 'Correction Sufficient'}
            </Badge>
          </div>
          
          <p className="text-sm">{recommendation.rationale}</p>
          <p className="text-xs text-muted-foreground">{recommendation.qmsrJustification}</p>

          {recommendation.shouldPromote && (
            <div className="flex items-center gap-2 pt-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">FDA inspectors closely review CAPA exemptions</span>
            </div>
          )}
        </div>

        {/* Override Option */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="override"
            checked={isOverride}
            onCheckedChange={(checked) => {
              setIsOverride(checked as boolean);
              if (!checked) {
                setOverrideDecision(null);
                setOverrideReason('');
              }
            }}
          />
          <div>
            <Label htmlFor="override" className="cursor-pointer">
              Override recommendation
            </Label>
            <p className="text-xs text-muted-foreground">
              Document justification if deviating from the recommended decision
            </p>
          </div>
        </div>

        {/* Override Details */}
        {isOverride && (
          <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="space-y-2">
              <Label>Override Decision</Label>
              <Select 
                value={overrideDecision === null ? '' : overrideDecision.toString()} 
                onValueChange={(v) => setOverrideDecision(v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Promote to CAPA</SelectItem>
                  <SelectItem value="false">Correction Only (No CAPA)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="override-reason" className="text-amber-900">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Override Justification * (FDA will review this)
              </Label>
              <Textarea
                id="override-reason"
                placeholder="Document specific reasons why the recommendation does not apply..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-amber-700">
                This justification will be reviewed during FDA inspections. Be specific and thorough.
              </p>
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
              disabled={generateRationale.isPending || !eventDescription.trim()}
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
            placeholder="The rationale documenting the CAPA promotion decision..."
            value={rationaleText}
            onChange={(e) => setRationaleText(e.target.value)}
            rows={5}
          />
        </div>

        {/* Determination Display */}
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          effectiveDecision ? 'bg-red-100' : 'bg-green-100'
        }`}>
          {effectiveDecision ? (
            <>
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">CAPA Required - Full Investigation Needed</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">CAPA Not Required - Correction Sufficient</span>
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

export default CAPAPriorityRationalePanel;
