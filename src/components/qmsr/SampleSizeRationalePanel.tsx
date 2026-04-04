import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Shield, Calculator, Sparkles, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { getSampleSizeRecommendation } from './RBRRecommendationEngine';
import { useGenerateRationale } from '@/hooks/useRationales';
import type { SeverityOfHarm, SampleSizeContext } from '@/types/riskBasedRationale';
import { toast } from 'sonner';

interface SampleSizeRationalePanelProps {
  productId?: string;
  companyId: string;
  testCaseId?: string;
  linkedHazardId?: string;
  initialSeverity?: SeverityOfHarm;
  initialFailureMode?: string;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export function SampleSizeRationalePanel({
  productId,
  companyId,
  testCaseId,
  linkedHazardId,
  initialSeverity = 'Major',
  initialFailureMode = '',
  onSave,
  onCancel,
}: SampleSizeRationalePanelProps) {
  const [failureMode, setFailureMode] = useState(initialFailureMode);
  const [severity, setSeverity] = useState<SeverityOfHarm>(initialSeverity);
  const [sampleSize, setSampleSize] = useState<number>(32);
  const [statisticalMethod, setStatisticalMethod] = useState('Binomial (Zero Defects)');
  const [rationaleText, setRationaleText] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const generateRationale = useGenerateRationale();

  // Get recommendation whenever severity or failure mode changes
  const recommendation = getSampleSizeRecommendation(severity, failureMode || 'Unnamed failure mode');

  // Update sample size and method when recommendation changes (unless overriding)
  useEffect(() => {
    if (!isOverride) {
      setSampleSize(recommendation.recommendedN);
      setStatisticalMethod(recommendation.statisticalMethod);
    }
  }, [recommendation, isOverride]);

  const handleGenerateRationale = async () => {
    if (!failureMode.trim()) {
      toast.error('Please enter the failure mode description');
      return;
    }

    const context: SampleSizeContext = {
      failure_mode: failureMode,
      severity_level: severity,
      sample_size: sampleSize,
      statistical_method: statisticalMethod,
    };

    try {
      const result = await generateRationale.mutateAsync({
        type: 'sample_size',
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
    if (!failureMode.trim()) {
      toast.error('Please enter the failure mode description');
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
      test_case_id: testCaseId,
      linked_hazard_id: linkedHazardId,
      failure_mode: failureMode,
      severity_level: severity,
      sample_size: sampleSize,
      confidence_level: recommendation.confidenceLevel,
      statistical_method: statisticalMethod,
      rationale_text: rationaleText,
      qmsr_clause_reference: '7.3.6',
      determination: sampleSize >= recommendation.recommendedN ? 'Sample Size Justified' : 'Increased Sample Required',
      is_override: isOverride,
      override_reason: overrideReason || undefined,
    };

    onSave?.(data);
  };

  const isUsingRecommended = sampleSize === recommendation.recommendedN;

  return (
    <Card className="border-indigo-200">
      <CardHeader className="bg-indigo-50/50">
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <Shield className="h-5 w-5 text-indigo-600" />
          Sample Size Rationale (RBR-SAM)
        </CardTitle>
        <CardDescription>
          Justify the sample size based on failure mode severity per QMSR Clause 7.3.6
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Failure Mode Input */}
        <div className="space-y-2">
          <Label htmlFor="failure-mode">Failure Mode Description *</Label>
          <Textarea
            id="failure-mode"
            placeholder="Describe the potential failure mode being tested..."
            value={failureMode}
            onChange={(e) => setFailureMode(e.target.value)}
            rows={2}
          />
        </div>

        {/* Severity Selection */}
        <div className="space-y-2">
          <Label htmlFor="severity">Severity of Harm *</Label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as SeverityOfHarm)}>
            <SelectTrigger id="severity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Critical">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Critical - Life-threatening / Permanent injury
                </span>
              </SelectItem>
              <SelectItem value="Major">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Major - Temporary injury / Significant harm
                </span>
              </SelectItem>
              <SelectItem value="Minor">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Minor - No injury / Minor inconvenience
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Recommendation Section */}
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-900">QMSR Recommendation</span>
            <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">
              Clause 7.3.6
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Sample Size (n)</div>
              <div className="text-xl font-bold text-indigo-700">{recommendation.recommendedN}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Confidence Level</div>
              <div className="text-xl font-bold text-indigo-700">{recommendation.confidenceLevel}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Statistical Method</div>
              <div className="text-sm font-medium text-indigo-700">{recommendation.statisticalMethod}</div>
            </div>
          </div>

          <p className="text-xs text-indigo-600">{recommendation.qmsrJustification}</p>
        </div>

        {/* Sample Size Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sample-size">Selected Sample Size *</Label>
            {!isUsingRecommended && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Override
              </Badge>
            )}
          </div>
          <div className="flex gap-3">
            <Input
              id="sample-size"
              type="number"
              min={1}
              value={sampleSize}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setSampleSize(val);
                setIsOverride(val !== recommendation.recommendedN);
              }}
              className="w-32"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSampleSize(recommendation.recommendedN);
                setIsOverride(false);
              }}
              disabled={isUsingRecommended}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Use Recommended
            </Button>
          </div>
        </div>

        {/* Override Reason */}
        {isOverride && (
          <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <Label htmlFor="override-reason" className="text-amber-900">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Override Justification *
            </Label>
            <Textarea
              id="override-reason"
              placeholder="Document why a different sample size is appropriate..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-amber-700">
              FDA inspectors may review deviations from recommended sample sizes. Provide clear justification.
            </p>
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
              disabled={generateRationale.isPending || !failureMode.trim()}
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
            placeholder="The rationale explaining why this sample size is appropriate..."
            value={rationaleText}
            onChange={(e) => setRationaleText(e.target.value)}
            rows={5}
          />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          {sampleSize >= recommendation.recommendedN ? (
            <>
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Sample Size Justified</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                Sample size below recommendation - justification required
              </span>
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

export default SampleSizeRationalePanel;
