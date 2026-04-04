import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  Users
} from "lucide-react";
import {
  PRESET_SCENARIOS,
  calculateSampleSizeWithDetails,
  type BinaryOutcomeParams,
  type ContinuousOutcomeParams,
} from "@/utils/sampleSizeFormulas";
import { useTranslation } from "@/hooks/useTranslation";

interface SampleSizeCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (sampleSize: number) => void;
}

type OutcomeType = 'binary' | 'continuous';

const iconMap = {
  TrendingDown: TrendingDown,
  TrendingUp: TrendingUp,
  Activity: Activity,
};

export function SampleSizeCalculator({ open, onOpenChange, onApply }: SampleSizeCalculatorProps) {
  const { lang } = useTranslation();
  const [outcomeType, setOutcomeType] = useState<OutcomeType>('binary');
  const [customMode, setCustomMode] = useState(false);

  // Binary outcome params
  const [p0, setP0] = useState(0.20);
  const [p1, setP1] = useState(0.10);

  // Continuous outcome params
  const [mu0, setMu0] = useState(50);
  const [mu1, setMu1] = useState(40);
  const [sigma, setSigma] = useState(20);

  // Common params
  const [alpha, setAlpha] = useState(0.05);
  const [power, setPower] = useState(0.80);

  const getParams = (): BinaryOutcomeParams | ContinuousOutcomeParams => {
    if (outcomeType === 'binary') {
      return { p0, p1, alpha, power, twoSided: true };
    }
    return { mu0, mu1, sigma, alpha, power, twoSided: true };
  };

  const result = calculateSampleSizeWithDetails(outcomeType, getParams());

  const handlePresetSelect = (presetKey: keyof typeof PRESET_SCENARIOS) => {
    const preset = PRESET_SCENARIOS[presetKey];
    setOutcomeType(preset.outcomeType);
    setCustomMode(true);

    if (preset.outcomeType === 'binary') {
      const params = preset.params as BinaryOutcomeParams;
      setP0(params.p0);
      setP1(params.p1);
      setAlpha(params.alpha);
      setPower(params.power);
    } else {
      const params = preset.params as ContinuousOutcomeParams;
      setMu0(params.mu0);
      setMu1(params.mu1);
      setSigma(params.sigma);
      setAlpha(params.alpha);
      setPower(params.power);
    }
  };

  const handleApply = () => {
    onApply(result.total);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            {lang('clinicalTrials.calculator.title')}
          </DialogTitle>
          <DialogDescription>
            {lang('clinicalTrials.calculator.description')}
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            {lang('clinicalTrials.calculator.disclaimer')}
          </AlertDescription>
        </Alert>

        {!customMode ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {lang('clinicalTrials.calculator.presetTitle')}
            </h3>

            {Object.entries(PRESET_SCENARIOS).map(([key, scenario]) => {
              const Icon = iconMap[scenario.icon as keyof typeof iconMap];
              const presetResult = calculateSampleSizeWithDetails(
                scenario.outcomeType,
                scenario.params as any
              );

              return (
                <div
                  key={key}
                  className="p-4 border rounded-lg hover:border-primary/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => handlePresetSelect(key as keyof typeof PRESET_SCENARIOS)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{scenario.name}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {scenario.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {scenario.outcomeType === 'binary' ? (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                p₀ {((scenario.params as BinaryOutcomeParams).p0 * 100).toFixed(0)}%
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                p₁ {((scenario.params as BinaryOutcomeParams).p1 * 100).toFixed(0)}%
                              </Badge>
                            </>
                          ) : (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                μ₀ {(scenario.params as ContinuousOutcomeParams).mu0}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                μ₁ {(scenario.params as ContinuousOutcomeParams).mu1}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                σ {(scenario.params as ContinuousOutcomeParams).sigma}
                              </Badge>
                            </>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            α {scenario.params.alpha}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            power {(scenario.params.power * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{presetResult.total}</div>
                      <div className="text-xs text-muted-foreground">{lang('clinicalTrials.calculator.patientsTotal')}</div>
                    </div>
                  </div>
                </div>
              );
            })}

            <Separator />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setCustomMode(true)}
            >
              {lang('clinicalTrials.calculator.enterCustom')}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCustomMode(false)}
              className="text-muted-foreground"
            >
              {lang('clinicalTrials.calculator.backToPresets')}
            </Button>

            {/* Outcome Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{lang('clinicalTrials.calculator.outcomeType')}</Label>
              <RadioGroup
                value={outcomeType}
                onValueChange={(v) => setOutcomeType(v as OutcomeType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="binary" id="binary" />
                  <Label htmlFor="binary" className="cursor-pointer">
                    {lang('clinicalTrials.calculator.binary')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="continuous" id="continuous" />
                  <Label htmlFor="continuous" className="cursor-pointer">
                    {lang('clinicalTrials.calculator.continuous')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Parameters */}
            <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-medium text-sm">{lang('clinicalTrials.calculator.studyParams')}</h4>

              {outcomeType === 'binary' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {lang('clinicalTrials.calculator.baselineRate')}
                      <span className="text-muted-foreground ml-1">%</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={(p0 * 100).toFixed(0)}
                      onChange={(e) => setP0(parseFloat(e.target.value) / 100 || 0)}
                      placeholder="e.g., 20"
                    />
                    <p className="text-xs text-muted-foreground">{lang('clinicalTrials.calculator.controlRate')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {lang('clinicalTrials.calculator.expectedRate')}
                      <span className="text-muted-foreground ml-1">%</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={(p1 * 100).toFixed(0)}
                      onChange={(e) => setP1(parseFloat(e.target.value) / 100 || 0)}
                      placeholder="e.g., 10"
                    />
                    <p className="text-xs text-muted-foreground">{lang('clinicalTrials.calculator.deviceRate')}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">{lang('clinicalTrials.calculator.baselineMean')}</Label>
                    <Input
                      type="number"
                      value={mu0}
                      onChange={(e) => setMu0(parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 50"
                    />
                    <p className="text-xs text-muted-foreground">{lang('clinicalTrials.calculator.controlMean')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{lang('clinicalTrials.calculator.expectedMean')}</Label>
                    <Input
                      type="number"
                      value={mu1}
                      onChange={(e) => setMu1(parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 40"
                    />
                    <p className="text-xs text-muted-foreground">{lang('clinicalTrials.calculator.expectedDevice')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{lang('clinicalTrials.calculator.stdDeviation')}</Label>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={sigma}
                      onChange={(e) => setSigma(parseFloat(e.target.value) || 1)}
                      placeholder="e.g., 20"
                    />
                    <p className="text-xs text-muted-foreground">{lang('clinicalTrials.calculator.expectedVariability')}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">{lang('clinicalTrials.calculator.significanceLevel')}</Label>
                  <Input
                    type="number"
                    min={0.001}
                    max={0.2}
                    step={0.01}
                    value={alpha}
                    onChange={(e) => setAlpha(parseFloat(e.target.value) || 0.05)}
                    placeholder="0.05"
                  />
                  <p className="text-xs text-muted-foreground">{lang('clinicalTrials.calculator.typeIError')}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">
                    {lang('clinicalTrials.calculator.statisticalPower')}
                    <span className="text-muted-foreground ml-1">%</span>
                  </Label>
                  <Input
                    type="number"
                    min={50}
                    max={99}
                    step={5}
                    value={(power * 100).toFixed(0)}
                    onChange={(e) => setPower(parseFloat(e.target.value) / 100 || 0.8)}
                    placeholder="80"
                  />
                  <p className="text-xs text-muted-foreground">{lang('clinicalTrials.calculator.typeIIError')}</p>
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">{lang('clinicalTrials.calculator.calculatedSize')}</h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold text-primary">
                      {result.total === Infinity ? '∞' : result.total}
                    </span>
                    <span className="text-muted-foreground">{lang('clinicalTrials.calculator.patientsTotal')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ({result.perArm === Infinity ? '∞' : result.perArm} {lang('clinicalTrials.calculator.perArm')})
                  </p>
                </div>
                <Users className="h-12 w-12 text-primary/20" />
              </div>

              <Separator className="my-3" />

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{lang('clinicalTrials.calculator.assumptions')}</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {result.assumptions.map((assumption, i) => (
                    <li key={i}>• {assumption}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {lang('clinicalTrials.calculator.cancel')}
              </Button>
              <Button
                onClick={handleApply}
                disabled={result.total === Infinity}
              >
                {lang('clinicalTrials.calculator.applyToForm', { count: result.total })}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
