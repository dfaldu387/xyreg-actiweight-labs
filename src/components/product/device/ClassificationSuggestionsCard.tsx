import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, HelpCircle, Lightbulb } from 'lucide-react';
import { ClassificationSuggestion } from '@/services/DeviceClassificationService';
import { ConditionalClassificationTrigger } from '@/components/classification/ConditionalClassificationTrigger';
import { RuleTextDialog } from '@/components/classification/RuleTextDialog';
import { getRuleByNumber, MDRRule } from '@/data/mdrRuleTexts';
import { useTranslation } from '@/hooks/useTranslation';

interface ClassificationSuggestionsCardProps {
  suggestions: ClassificationSuggestion[];
  isLoading?: boolean;
  onClassificationSelected?: (marketCode: string, deviceClass: string) => void;
  primaryRegulatoryType?: string;
  keyTechnologyCharacteristics?: any;
}

export function ClassificationSuggestionsCard({
  suggestions,
  isLoading = false,
  onClassificationSelected,
  primaryRegulatoryType,
  keyTechnologyCharacteristics
}: ClassificationSuggestionsCardProps) {
  const { lang } = useTranslation();
  const [selectedRule, setSelectedRule] = useState<MDRRule | null>(null);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);

  const handleRuleClick = (ruleText: string) => {
    // Extract rule number from text like "(MDR Annex VIII, Rule 14)" or "Rule 14"
    const ruleMatch = ruleText.match(/Rule (\d+)/i);
    if (ruleMatch) {
      const ruleNumber = ruleMatch[1];
      const rule = getRuleByNumber(ruleNumber);
      if (rule) {
        setSelectedRule(rule);
        setIsRuleDialogOpen(true);
      }
    }
  };

  const renderClickableRule = (ruleText: string) => {
    const ruleMatch = ruleText.match(/Rule (\d+)/i);
    if (ruleMatch) {
      return (
        <button
          onClick={() => handleRuleClick(ruleText)}
          className="text-xs text-primary hover:text-primary-glow hover:underline cursor-pointer transition-colors"
        >
          ({ruleText})
        </button>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">
        ({ruleText})
      </span>
    );
  };
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            {lang('regulatory.suggestions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            {lang('regulatory.suggestions.analyzing')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            {lang('regulatory.suggestions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              {lang('regulatory.suggestions.emptyState')}
            </p>
            <ConditionalClassificationTrigger
              onClassificationSelected={(deviceClass) => {
                // Handle global classification if needed
              }}
              primaryRegulatoryType={primaryRegulatoryType}
              keyTechnologyCharacteristics={keyTechnologyCharacteristics}
              className="mx-auto"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'medium':
        return <HelpCircle className="h-4 w-4 text-warning" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          {lang('regulatory.suggestions.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {lang('regulatory.suggestions.description')}
          <strong className="text-foreground"> {lang('regulatory.suggestions.verifyWarning')}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div 
            key={`${suggestion.marketCode}-${index}`}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{suggestion.marketName}</span>
                <Badge variant="outline">{suggestion.marketCode}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {getConfidenceIcon(suggestion.confidence)}
                <Badge variant={getConfidenceBadgeVariant(suggestion.confidence)}>
                  {suggestion.confidence} {lang('regulatory.suggestions.confidence')}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{lang('regulatory.suggestions.suggestedClass')}</span>
                <Badge variant="default" className="text-sm">
                  {suggestion.suggestedClass}
                </Badge>
                {suggestion.rule && renderClickableRule(suggestion.rule)}
              </div>

              {suggestion.reasoning && suggestion.reasoning.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">{lang('regulatory.suggestions.reasoning')}</span>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {suggestion.reasoning.map((reason, reasonIndex) => (
                      <li key={reasonIndex} className="flex items-start gap-1">
                        <span className="text-xs mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestion.alternativeClasses && suggestion.alternativeClasses.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">{lang('regulatory.suggestions.alternativeClasses')}</span>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.alternativeClasses.map((altClass, altIndex) => (
                      <Badge key={altIndex} variant="outline" className="text-xs">
                        {altClass}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {suggestion.requiresExpertReview && (
              <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-md border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning-foreground">
                  {lang('regulatory.suggestions.expertReviewRecommended')}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onClassificationSelected?.(suggestion.marketCode, suggestion.suggestedClass)}
              >
                {lang('regulatory.suggestions.useThisClassification')}
              </Button>
              <ConditionalClassificationTrigger 
                onClassificationSelected={(deviceClass) => {
                  onClassificationSelected?.(suggestion.marketCode, deviceClass);
                }}
                primaryRegulatoryType={primaryRegulatoryType}
                keyTechnologyCharacteristics={keyTechnologyCharacteristics}
                className="text-xs"
              />
            </div>
          </div>
        ))}

        {/* Classification Improvement Suggestions */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700 space-y-2">
              <p className="font-medium">{lang('regulatory.suggestions.improveAccuracyTitle')}</p>
              <p className="text-xs">{lang('regulatory.suggestions.improveAccuracyDescription')}</p>
              <ul className="space-y-0.5 pl-4 text-xs">
                <li>• <strong>{lang('regulatory.suggestions.improveAnatomicalLocation')}</strong> {lang('regulatory.suggestions.improveAnatomicalLocationDetail')}</li>
                <li>• <strong>{lang('regulatory.suggestions.improveEnergyDelivery')}</strong> {lang('regulatory.suggestions.improveEnergyDeliveryDetail')}</li>
                <li>• <strong>{lang('regulatory.suggestions.improveDuration')}</strong> {lang('regulatory.suggestions.improveDurationDetail')}</li>
                <li>• <strong>{lang('regulatory.suggestions.improveSpecialProperties')}</strong> {lang('regulatory.suggestions.improveSpecialPropertiesDetail')}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-md border">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">{lang('regulatory.suggestions.disclaimersTitle')}</p>
              <ul className="space-y-0.5 pl-4">
                <li>• {lang('regulatory.suggestions.disclaimer1')}</li>
                <li>• {lang('regulatory.suggestions.disclaimer2')}</li>
                <li>• {lang('regulatory.suggestions.disclaimer3')}</li>
                <li>• {lang('regulatory.suggestions.disclaimer4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>

      <RuleTextDialog
        isOpen={isRuleDialogOpen}
        onClose={() => setIsRuleDialogOpen(false)}
        rule={selectedRule}
      />
    </Card>
  );
}