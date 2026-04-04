import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ListChecks, BookOpen, Shield, FileText, Layers } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClassificationDecisionPath } from './ClassificationDecisionPath';
import { Question, DecisionPathEntry } from '@/types/classification';

// Extended rule info to include decision path and rule text
export interface ClassificationRuleInfo {
  rule: string;
  description: string;
  determinedBy: 'assistant' | 'manual';
  ruleText?: string;
  ruleSource?: string;
  // Support both old format { path, answers } and new format (array of DecisionPathEntry)
  decisionPath?: DecisionPathEntry[] | {
    path: string[];
    answers: Record<string, string>;
  };
}

// Component structure for calculating highest class
export interface ComponentForClassification {
  id: string;
  name?: string;
  riskClass?: string;
  isSelected?: boolean;
  componentType?: 'device' | 'software';
}

interface ClassificationRuleCardProps {
  ruleInfo?: ClassificationRuleInfo | null;
  questions?: Record<string, Question>;
  /** Components to derive highest class from */
  components?: ComponentForClassification[];
  /** Market code for market-specific labels */
  marketCode?: string;
  /** Direct risk class from market (takes priority) */
  riskClass?: string;
  /** Market name for display */
  marketName?: string;
}

// Helper to check if decisionPath is in old format
function isOldDecisionPathFormat(dp: any): dp is { path: string[]; answers: Record<string, string> } {
  return dp && Array.isArray(dp.path) && typeof dp.answers === 'object';
}

// Helper to check if decisionPath is in new format (array of DecisionPathEntry)
function isNewDecisionPathFormat(dp: any): dp is DecisionPathEntry[] {
  return Array.isArray(dp) && (dp.length === 0 || (dp[0] && typeof dp[0].questionId === 'string'));
}

// Risk class hierarchy for determining highest class
const RISK_CLASS_HIERARCHY: Record<string, number> = {
  'I': 1,
  'Ia': 1,
  'Ib': 1,
  'Is': 1,
  'Im': 1,
  'II': 2,
  'IIa': 2,
  'IIb': 3,
  'III': 4,
  'IV': 5,
  // FDA classes
  '1': 1,
  '2': 2,
  '3': 3,
};

// Get display label for risk class
function getRiskClassDisplayLabel(riskClass: string): string {
  // Already has "Class" prefix
  if (riskClass.toLowerCase().startsWith('class')) return riskClass;
  // Add "Class" prefix
  return `Class ${riskClass}`;
}

// Market code to regulation name mapping
const MARKET_REGULATION_NAMES: Record<string, string> = {
  'EU': 'EU MDR 2017/745',
  'USA': 'FDA 21 CFR',
  'CA': 'Health Canada CMDR',
  'AU': 'TGA',
  'UK': 'UK MDR 2002',
  'JP': 'PMDA',
  'BR': 'ANVISA RDC',
  'CN': 'NMPA',
  'KR': 'MFDS',
  'IN': 'CDSCO MDR 2017',
  'CH': 'Swissmedic MepV',
};

export function ClassificationRuleCard({ ruleInfo, questions, components, marketCode, riskClass, marketName }: ClassificationRuleCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate highest class from components
  const highestClassInfo = useMemo(() => {
    if (!components || components.length === 0) return null;

    const selectedComponents = components.filter(c => c.isSelected !== false && c.riskClass);
    if (selectedComponents.length === 0) return null;

    let highestClass = '';
    let highestLevel = -1;

    selectedComponents.forEach(component => {
      const level = RISK_CLASS_HIERARCHY[component.riskClass || ''] || 0;
      if (level > highestLevel) {
        highestLevel = level;
        highestClass = component.riskClass || '';
      }
    });

    return {
      class: highestClass,
      label: getRiskClassDisplayLabel(highestClass),
      componentCount: selectedComponents.length,
    };
  }, [components]);

  // Determine if we have expandable content (support both formats)
  const hasDecisionPath = ruleInfo?.decisionPath && (
    (isOldDecisionPathFormat(ruleInfo.decisionPath) && ruleInfo.decisionPath.path.length > 0) ||
    (isNewDecisionPathFormat(ruleInfo.decisionPath) && ruleInfo.decisionPath.length > 0)
  );

  const hasExpandableContent = ruleInfo?.ruleText || ruleInfo?.description || (hasDecisionPath && questions);

  // Determine what to display as main class (priority: direct riskClass > highest from components > rule parse)
  const displayClass = riskClass
    ? getRiskClassDisplayLabel(riskClass)
    : highestClassInfo?.label
    || 'Not Classified';

  const displayRule = ruleInfo?.rule || '';
  const regulationName = marketCode ? MARKET_REGULATION_NAMES[marketCode] : '';

  // If no risk class and no components, don't render
  if (!riskClass && !highestClassInfo && !ruleInfo) {
    return null;
  }

  return (
    <Collapsible open={showDetails} onOpenChange={setShowDetails}>
      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
        {/* Compact Header - Always visible */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                Overall Classification:
              </span>
              <Badge variant="secondary" className="bg-blue-600 dark:bg-blue-700 text-white font-bold px-3 py-0.5">
                {displayClass}
              </Badge>
              {displayRule && (
                <Badge variant="outline" className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 text-xs">
                  {displayRule}
                </Badge>
              )}
            </div>
          </div>

          {/* Expand/Collapse Button */}
          {hasExpandableContent && (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1"
              >
                <span className="text-xs">
                  {showDetails ? 'Hide' : 'Details'}
                </span>
                {showDetails ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        {/* Context info line - regulation and component count */}
        <div className="flex items-center gap-3 mt-1.5 ml-6 text-xs text-blue-600 dark:text-blue-400">
          {regulationName && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {regulationName}
            </span>
          )}
          {highestClassInfo && highestClassInfo.componentCount > 0 && (
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {highestClassInfo.componentCount === 1
                ? '1 component'
                : `Highest of ${highestClassInfo.componentCount} components`}
            </span>
          )}
          {ruleInfo?.determinedBy === 'assistant' && (
            <Badge variant="outline" className="h-4 text-[10px] border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 px-1.5">
              AI Classified
            </Badge>
          )}
        </div>

        {/* Expandable Details Section */}
        {hasExpandableContent && (
          <CollapsibleContent className="space-y-3 pt-3 border-t border-blue-200 dark:border-blue-700 mt-3">
            {/* Rule Description */}
            {ruleInfo?.description && (
              <div className="bg-white/60 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-md p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  {ruleInfo.description}
                </p>
              </div>
            )}

            {/* Decision Path - Old Format */}
            {ruleInfo?.decisionPath && isOldDecisionPathFormat(ruleInfo.decisionPath) && ruleInfo.decisionPath.path.length > 0 && questions && (
              <ClassificationDecisionPath
                path={ruleInfo.decisionPath.path}
                answers={ruleInfo.decisionPath.answers}
                questions={questions}
                resultClass={ruleInfo.rule.split(',')[0]}
                resultRule={ruleInfo.rule}
              />
            )}

            {/* Decision Path - New Format (array of DecisionPathEntry) */}
            {ruleInfo?.decisionPath && isNewDecisionPathFormat(ruleInfo.decisionPath) && ruleInfo.decisionPath.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-xs flex items-center gap-1.5 text-blue-800 dark:text-blue-200">
                  <ListChecks className="h-3.5 w-3.5" />
                  Classification Journey
                </h4>
                <div className="space-y-2">
                  {ruleInfo.decisionPath.map((entry, index) => (
                    <div key={index} className="bg-white/60 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-md p-2.5">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200">{entry.questionText}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">→ {entry.selectedOptionText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Rule Text */}
            {ruleInfo?.ruleText && (
              <div className="space-y-2">
                <h4 className="font-medium text-xs flex items-center gap-1.5 text-blue-800 dark:text-blue-200">
                  <BookOpen className="h-3.5 w-3.5" />
                  Official Rule Text
                </h4>
                <div className="bg-white/60 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-md p-3 space-y-1.5">
                  {ruleInfo.ruleSource && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Source: {ruleInfo.ruleSource}
                    </p>
                  )}
                  <p className="text-xs whitespace-pre-line text-blue-900/80 dark:text-blue-100/80 leading-relaxed">
                    {ruleInfo.ruleText}
                  </p>
                </div>
              </div>
            )}
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}
