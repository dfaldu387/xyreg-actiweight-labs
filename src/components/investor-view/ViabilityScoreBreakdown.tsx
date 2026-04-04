import { useState, useEffect } from 'react';
import { Info, AlertCircle, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Lightbulb, HelpCircle, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import type { ScoreBreakdownItem } from '@/services/calculateViabilityScore';
export type { ScoreBreakdownItem };

// Scoring explanations for each category
const categoryExplanations: Record<string, string> = {
  regulatory: "Device class determines base points (Class I: +25, IIa: +12, IIb: +5, III: 0). Bonus points for competitor precedent (+3) and penalty for multi-market complexity (-3 per additional market).",
  clinical: "Evidence strategy is scored by burden: Literature-only (+18), PMCF (+14), Clinical study (+11), Pre-market (+7). Clinical Need adds up to +6pts. Supporting Literature adds up to +6pts.",
  reimbursement: "Existing exact CPT/DRG codes score highest (+20). Partial coverage (+10) or new code required (+5). Unset scores 0.",
  technical: "Standard hardware scores highest (+20). SaMD/software (+15), Novel materials (+8), Drug-device combo (+5) reflect increasing complexity and regulatory burden.",
};

interface ScoreCategory {
  score: number;
  maxScore: number;
  source: string;
  breakdown?: ScoreBreakdownItem[];
}

interface ViabilityScoreBreakdownProps {
  totalScore: number;
  regulatory: ScoreCategory;
  clinical: ScoreCategory;
  reimbursement: ScoreCategory;
  technical: ScoreCategory;
  missingInputs?: string[];
  children: React.ReactNode;
  autoOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const StatusIcon = ({ status }: { status: 'complete' | 'partial' | 'missing' }) => {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'partial':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'missing':
      return <XCircle className="w-4 h-4 text-red-400" />;
  }
};

// Factor-level explanations for each scoring factor with Genesis step references
interface FactorInfo {
  explanation: string;
  stepNumber: number;
  stepLabel: string;
  route: string;
}

const factorInfoMap: Record<string, FactorInfo> = {
  'Device Class': {
    explanation: 'Lower risk classes score higher: Class I: +25pts, IIa: +12pts, IIb: +5pts, III: 0pts.',
    stepNumber: 8,
    stepLabel: 'Target Markets',
    route: 'device-information?tab=markets-regulatory&subtab=markets',
  },
  'Predicate Device': {
    explanation: 'Having a predicate device simplifies FDA 510(k) pathway. Yes: +3pts, Not set: 0pts.',
    stepNumber: 8,
    stepLabel: 'Device Classification',
    route: 'device-information?tab=markets-regulatory&subtab=us-fda',
  },
  'Competitor Regulatory Approved': {
    explanation: 'Having approved competitors proves regulatory feasibility. Approved: +3pts, None found: 0pts.',
    stepNumber: 2,
    stepLabel: 'Competitive Landscape',
    route: 'business-case?tab=market-analysis&subtab=competitive',
  },
  'Multi-Market Complexity': {
    explanation: 'Tiered penalty: 1-2 markets: 0pts, 3-5 markets: -1pt, 6-8 markets: -2pts, 9+ markets: -3pts.',
    stepNumber: 8,
    stepLabel: 'Target Markets',
    route: 'device-information?tab=markets-regulatory&subtab=markets',
  },
  'Evidence Strategy': {
    explanation: 'Clinical evidence approach affects viability. Literature-only: +18pts, Literature available: +15pts, PMCF: +14pts, Clinical study: +11pts, Pre-market: +7pts.',
    stepNumber: 17,
    stepLabel: 'Clinical Evidence',
    route: 'clinical-trials?tab=evidence-plan',
  },
  'Clinical Need': {
    explanation: 'A well-defined intended use for an unmet clinical need. Detailed (>50 chars): +6pts, Defined (>20 chars): +4pts, Minimal: +2pts.',
    stepNumber: 1,
    stepLabel: 'Device Concept',
    route: 'device-definition',
  },
  'Sample Size': {
    explanation: 'Smaller studies score higher: ≤30 subjects: +2pts, 31-100: 0pts, 101-300: -2pts, >300: -4pts.',
    stepNumber: 17,
    stepLabel: 'Clinical Evidence',
    route: 'clinical-trials?tab=evidence-plan',
  },
  'Supporting Literature': {
    explanation: 'Literature strengthens your evidence base. Direct relevance: +3pts/citation, Analogous: +2pts, Supportive: +1pt. Max 6 pts.',
    stepNumber: 17,
    stepLabel: 'Clinical Evidence',
    route: 'clinical-trials?tab=evidence-plan',
  },
  'Code Status': {
    explanation: 'Existing reimbursement codes score highest: Existing: +14pts, Partial: +10pts, Bundled: +10pts, New needed: +4pts.',
    stepNumber: 15,
    stepLabel: 'Reimbursement Codes',
    route: 'business-case?tab=reimbursement',
  },
  'Value Proposition': {
    explanation: 'Value proposition >10 chars in Statement of Use: +3pts, Not set or too short: 0pts.',
    stepNumber: 5,
    stepLabel: 'Statement of Use',
    route: 'device-information?tab=purpose&subtab=statement',
  },
  'Market Size': {
    explanation: 'Based on SOM: ≥ $1M → +1pt, ≥ $10M → +2pts, ≥ $100M → +3pts. (TAM/SAM don\'t count.)',
    stepNumber: 11,
    stepLabel: 'Market Sizing',
    route: 'business-case?tab=market-analysis&subtab=market-sizing',
  },
  'Device Type': {
    explanation: 'Standard hardware: +14pts, SaMD (standalone): +12pts, SiMD (embedded): +8pts, Combo product: +5pts, Not set: 0pts.',
    stepNumber: 3,
    stepLabel: 'System Architecture',
    route: 'device-information?tab=basics&subtab=technical&section=architecture',
  },
  'Technology Type': {
    explanation: 'Standard hardware: +14pts, SaMD (standalone): +12pts, SiMD (embedded): +8pts, Combo product: +5pts.',
    stepNumber: 3,
    stepLabel: 'System Architecture',
    route: 'device-information?tab=basics&subtab=technical&section=architecture',
  },
  'Solution Concept': {
    explanation: 'Device description >20 chars: +2pts, Not set: 0pts.',
    stepNumber: 3,
    stepLabel: 'Device Definition',
    route: 'device-information?tab=basics&subtab=definition',
  },
  'Risk Analysis': {
    explanation: '+3pts: All 4 categories have identified risks (not "None known"). +1pt bonus: All risks have mitigation plans defined.',
    stepNumber: 16,
    stepLabel: 'High-Level Risk Assessment',
    route: 'design-risk-controls?tab=risk-management&riskSubTab=high-level',
  },
  'Team Profile': {
    explanation: '1 member: +1pt, 2+ members: +3pts (max).',
    stepNumber: 22,
    stepLabel: 'Team Profile',
    route: 'business-case?tab=team-profile',
  },
};

interface CategoryBreakdownProps {
  breakdown: ScoreBreakdownItem[];
  productId?: string;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

const CategoryBreakdown = ({ breakdown, productId, onNavigate, onClose }: CategoryBreakdownProps) => {
  // Find the best improvement tip (from factors with most potential gain)
  const improvementTip = breakdown
    .filter(item => item.improvement && item.points < item.maxPoints)
    .sort((a, b) => (b.maxPoints - b.points) - (a.maxPoints - a.points))[0];

  const handleStepClick = (factor: string) => {
    const info = factorInfoMap[factor];
    if (info && productId) {
      onClose();
      const separator = info.route.includes('?') ? '&' : '?';
      const path = `/app/product/${productId}/${info.route}${separator}returnTo=viability-scorecard`;
      onNavigate(path);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <TooltipProvider delayDuration={150}>
        <div className="rounded-lg border bg-muted/30 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Factor</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Value</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Points</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((item, idx) => {
                const factorInfo = factorInfoMap[item.factor];
                return (
                  <tr key={idx} className={cn("border-b last:border-0", item.status === 'missing' && "bg-red-50/30 dark:bg-red-950/10")}>
                    <td className="py-2 px-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        {item.factor}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="p-0.5 rounded-full hover:bg-muted transition-colors">
                              <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-primary" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="max-w-[280px] text-xs z-[9999]"
                            sideOffset={5}
                          >
                            <p className="font-semibold mb-1">{item.factor}</p>
                            <p className="mb-2">
                              {factorInfo?.explanation || item.improvement || `This factor contributes up to ${item.maxPoints} points to your score.`}
                            </p>
                            {factorInfo && productId && (
                              <button
                                onClick={() => handleStepClick(item.factor)}
                                className="flex items-center gap-1 text-primary hover:underline font-medium"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Go to Step {factorInfo.stepNumber} ({factorInfo.stepLabel})
                              </button>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{item.currentValue}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={cn(
                        "font-semibold",
                        item.points > 0 && item.points === item.maxPoints && "text-emerald-600",
                        item.points > 0 && item.points < item.maxPoints && "text-amber-600",
                        item.points <= 0 && "text-red-500"
                      )}>
                        {item.points > 0 ? '+' : ''}{item.points}
                      </span>
                      <span className="text-muted-foreground">/{item.maxPoints}</span>
                    </td>
                    <td className="py-2 px-1">
                      <StatusIcon status={item.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TooltipProvider>
      
      {improvementTip && (
        <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 p-2 rounded-md">
          <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{improvementTip.improvement}</span>
        </div>
      )}
    </div>
  );
};

export function ViabilityScoreBreakdown({
  totalScore,
  regulatory,
  clinical,
  reimbursement,
  technical,
  missingInputs = [],
  children,
  autoOpen = false,
  onOpenChange,
}: ViabilityScoreBreakdownProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  
  // Handle autoOpen prop
  useEffect(() => {
    if (autoOpen && !open) {
      setOpen(true);
    }
  }, [autoOpen]);

  // Notify parent when open state changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };
  
  // Auto-expand all categories that have breakdown data
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    regulatory: true,
    clinical: true,
    reimbursement: true,
    technical: true,
  });

  const categories = [
    { name: 'Regulatory', icon: '📋', ...regulatory, color: 'bg-blue-500', key: 'regulatory' },
    { name: 'Clinical', icon: '🔬', ...clinical, color: 'bg-purple-500', key: 'clinical' },
    { name: 'Reimbursement', icon: '💰', ...reimbursement, color: 'bg-emerald-500', key: 'reimbursement' },
    { name: 'Technical', icon: '⚙️', ...technical, color: 'bg-orange-500', key: 'technical' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 71) return 'text-emerald-600';
    if (score >= 41) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasBreakdown = (category: ScoreCategory) => {
    return category.breakdown && category.breakdown.length > 0;
  };

  const handleClose = () => {
    setOpen(false);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-600" />
            Viability Score Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total Score */}
          <div className="text-center pb-4 border-b">
            <div className={cn("text-4xl font-bold", getScoreColor(totalScore))}>
              {totalScore}
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Combined viability score
            </p>
          </div>

          {/* Category Breakdown */}
          <TooltipProvider delayDuration={200}>
            <div className="space-y-3">
              {categories.map((category) => (
                <Collapsible
                  key={category.key}
                  open={expandedCategories[category.key]}
                  onOpenChange={() => toggleCategory(category.key)}
                >
                  <div className="space-y-2">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors">
                        <div className="flex items-center gap-2">
                          {hasBreakdown(category) ? (
                            expandedCategories[category.key] ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )
                          ) : (
                            <span className="w-4" />
                          )}
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium text-sm">{category.name}</span>
                          <Tooltip>
                            <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button type="button" className="ml-1 p-0.5 rounded-full hover:bg-muted/80 transition-colors">
                                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs text-xs z-[9999]" sideOffset={5} onClick={(e) => e.stopPropagation()}>
                              <p className="font-semibold mb-1">How {category.name} is scored:</p>
                              <p>{categoryExplanations[category.key]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className={cn(
                          "text-sm font-semibold",
                          category.score === 0 && "text-red-500",
                          category.score > 0 && category.score < category.maxScore * 0.6 && "text-amber-600",
                          category.score >= category.maxScore * 0.6 && "text-emerald-600"
                        )}>
                          {category.score}/{category.maxScore}
                        </span>
                    </div>
                  </CollapsibleTrigger>
                  
                  <Progress 
                    value={(category.score / category.maxScore) * 100} 
                    className="h-2"
                  />
                  
                  <p className="text-xs text-muted-foreground">
                    {category.source}
                  </p>
                  
                  <CollapsibleContent>
                    {hasBreakdown(category) ? (
                      <CategoryBreakdown 
                        breakdown={category.breakdown!} 
                        productId={productId}
                        onNavigate={navigate}
                        onClose={handleClose}
                      />
                    ) : (
                      <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground italic">
                        Detailed breakdown not available for this category.
                      </div>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
              ))}
            </div>
          </TooltipProvider>

          {/* Missing Inputs */}
          {missingInputs.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Missing Data</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {missingInputs.map((input, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {input}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* How It's Calculated */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              This score is calculated in real-time from your device definition, 
              clinical evidence plan, reimbursement strategy, and risk analysis data.
              Click each category to see factor-by-factor details.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
