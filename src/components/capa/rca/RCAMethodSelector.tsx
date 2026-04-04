import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RCAMethodology, RCA_METHODOLOGY_LABELS, calculateRiskLevel } from '@/types/capa';
import { ProblemComplexity, PROBLEM_COMPLEXITY_LABELS, PROBLEM_COMPLEXITY_DESCRIPTIONS } from '@/types/rcaData';
import { getRecommendedMethodologies, isRecommendationFollowed, RCARecommendation } from './RCARecommendationEngine';
import { 
  Brain, 
  GitBranch, 
  Fish, 
  HelpCircle, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Shield,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface RCAMethodSelectorProps {
  severity: number | null;
  probability: number | null;
  problemComplexity: ProblemComplexity | null;
  selectedMethodologies: RCAMethodology[];
  onComplexityChange: (complexity: ProblemComplexity | null) => void;
  onMethodologiesChange: (methodologies: RCAMethodology[]) => void;
  onOverrideReasonChange?: (reason: string) => void;
  overrideReason?: string;
  readOnly?: boolean;
}

const METHODOLOGY_ICONS: Record<RCAMethodology, React.ReactNode> = {
  '5_whys': <HelpCircle className="h-4 w-4" />,
  'fishbone': <Fish className="h-4 w-4" />,
  'fta': <GitBranch className="h-4 w-4" />,
  'pareto': <BarChart3 className="h-4 w-4" />,
  'other': <Brain className="h-4 w-4" />
};

const METHODOLOGY_INFO: Record<RCAMethodology, { hasTooling: boolean; description: string }> = {
  '5_whys': { 
    hasTooling: true, 
    description: 'Quick, efficient drill-down for linear cause-effect chains' 
  },
  'fishbone': { 
    hasTooling: true, 
    description: 'Comprehensive 6M analysis (Man, Machine, Method, Material, Measurement, Environment)' 
  },
  'fta': { 
    hasTooling: true, 
    description: 'Boolean logic tree for complex system failures' 
  },
  'pareto': { 
    hasTooling: true, 
    description: '80/20 analysis to identify vital few causes' 
  },
  'other': { 
    hasTooling: false, 
    description: 'Custom methodology - document in root cause summary' 
  }
};

export function RCAMethodSelector({
  severity,
  probability,
  problemComplexity,
  selectedMethodologies,
  onComplexityChange,
  onMethodologiesChange,
  onOverrideReasonChange,
  overrideReason = '',
  readOnly = false
}: RCAMethodSelectorProps) {
  const riskLevel = calculateRiskLevel(severity, probability);
  const recommendation = useMemo(() => 
    getRecommendedMethodologies(severity, probability, problemComplexity),
    [severity, probability, problemComplexity]
  );
  
  const complianceStatus = useMemo(() =>
    isRecommendationFollowed(selectedMethodologies, recommendation),
    [selectedMethodologies, recommendation]
  );

  const handleComplexitySelect = (complexity: ProblemComplexity) => {
    if (readOnly) return;
    onComplexityChange(complexity === problemComplexity ? null : complexity);
  };

  const handleMethodologyToggle = (methodology: RCAMethodology, checked: boolean) => {
    if (readOnly) return;
    const updated = checked 
      ? [...selectedMethodologies, methodology]
      : selectedMethodologies.filter(m => m !== methodology);
    onMethodologiesChange(updated);
  };

  const handleSelectRecommended = () => {
    if (readOnly) return;
    const methods: RCAMethodology[] = [recommendation.primary];
    if (recommendation.secondary) {
      methods.push(recommendation.secondary);
    }
    onMethodologiesChange(methods);
  };

  const getRiskBadgeVariant = () => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Risk Level Display */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Helix RCA Decision Tree
            </CardTitle>
            <Badge variant={getRiskBadgeVariant()}>
              Risk: {riskLevel?.toUpperCase() || 'NOT ASSESSED'}
            </Badge>
          </div>
          <CardDescription>
            QMSR-compliant risk-proportional methodology selection
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Step 1: Problem Classification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs">1</span>
            Classify the Problem
          </CardTitle>
          <CardDescription className="text-xs">
            How would you describe this issue? This helps determine the appropriate investigation method.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(PROBLEM_COMPLEXITY_LABELS) as ProblemComplexity[]).map((complexity) => (
              <button
                key={complexity}
                type="button"
                disabled={readOnly}
                onClick={() => handleComplexitySelect(complexity)}
                className={`text-left p-3 border rounded-lg transition-all ${
                  problemComplexity === complexity
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/50'
                } ${readOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="font-medium text-sm">{PROBLEM_COMPLEXITY_LABELS[complexity]}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {PROBLEM_COMPLEXITY_DESCRIPTIONS[complexity]}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: AI Recommendation */}
      <Card className={problemComplexity ? 'border-primary/30 bg-primary/5' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs">2</span>
            <Sparkles className="h-4 w-4 text-primary" />
            Helix Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Recommendation Display */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-background rounded-lg border">
            <div className="flex items-center gap-2">
              {METHODOLOGY_ICONS[recommendation.primary]}
              <span className="font-medium text-sm">{RCA_METHODOLOGY_LABELS[recommendation.primary]}</span>
              <Badge variant="default" className="text-xs">Primary</Badge>
            </div>
            {recommendation.secondary && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  {METHODOLOGY_ICONS[recommendation.secondary]}
                  <span className="font-medium text-sm">{RCA_METHODOLOGY_LABELS[recommendation.secondary]}</span>
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </div>
              </>
            )}
          </div>

          {/* Reasoning */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>{recommendation.reason}</span>
          </div>

          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectRecommended}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Recommended Selection
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Method Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs">3</span>
            Select Methodologies
          </CardTitle>
          <CardDescription className="text-xs">
            Choose one or more methods. You can combine methods for thorough analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(METHODOLOGY_INFO) as RCAMethodology[]).map((methodology) => {
              const info = METHODOLOGY_INFO[methodology];
              const isRecommended = methodology === recommendation.primary || methodology === recommendation.secondary;
              const isSelected = selectedMethodologies.includes(methodology);
              
              return (
                <div 
                  key={methodology}
                  className={`flex items-center space-x-3 p-3 border rounded-lg transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/50'
                  } ${isRecommended ? 'ring-1 ring-primary/30' : ''}`}
                >
                  <Checkbox
                    id={`method-${methodology}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleMethodologyToggle(methodology, checked === true)}
                    disabled={readOnly}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {METHODOLOGY_ICONS[methodology]}
                      <label 
                        htmlFor={`method-${methodology}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {RCA_METHODOLOGY_LABELS[methodology]}
                      </label>
                      {info.hasTooling && (
                        <Badge variant="secondary" className="text-[10px] py-0">
                          Visual Tool
                        </Badge>
                      )}
                      {isRecommended && (
                        <Badge variant="outline" className="text-[10px] py-0 border-primary text-primary">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compliance Status */}
          {selectedMethodologies.length > 0 && (
            <Alert variant={complianceStatus.followed ? 'default' : 'destructive'}>
              <div className="flex items-center gap-2">
                {complianceStatus.followed ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription className="text-xs">
                  {complianceStatus.followed 
                    ? 'Selection meets QMSR risk-proportionate requirements' 
                    : complianceStatus.reason
                  }
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Override Reason - show when recommendation not followed */}
          {!complianceStatus.followed && selectedMethodologies.length > 0 && onOverrideReasonChange && (
            <div className="space-y-2">
              <Label className="text-xs">Override Justification (Required for Audit Trail)</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => onOverrideReasonChange(e.target.value)}
                placeholder="Explain why a different methodology was chosen..."
                rows={2}
                disabled={readOnly}
                className="text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* QMSR Justification - Collapsible */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">QMSR Justification</p>
              <p className="text-xs text-muted-foreground mt-1">{recommendation.qmsrJustification}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
