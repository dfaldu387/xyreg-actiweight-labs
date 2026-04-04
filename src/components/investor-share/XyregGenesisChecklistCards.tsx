import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, Gauge, Map, LayoutGrid, Users, Flag, FlaskConical, 
  TrendingUp, DollarSign, CheckCircle, ArrowRight, HelpCircle,
  Calculator, Target, PieChart, Factory, AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChecklistItem {
  label: string;
  complete: boolean;
  route: string;
}

interface XyregGenesisChecklistCardsProps {
  readinessChecklist: ChecklistItem[];
  overallProgress: number;
  extraCards?: React.ReactNode[];
}

// Card configuration with colors, icons, help text, and module source
const cardConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  title: string;
  helpText: string;
  moduleSource: string;
}> = {
  'Device Description': {
    icon: FileText,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800/50 hover:border-blue-400',
    title: 'Device Description',
    helpText: 'Describe what your device IS and what it\'s FOR. Investors need to quickly understand your product before diving into details.',
    moduleSource: 'Device Info',
  },
  'Viability': {
    icon: Gauge,
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400',
    title: 'Viability Scorecard',
    helpText: 'Quantify market opportunity and risk factors. Shows investors you\'ve done your homework on market fit and regulatory pathway.',
    moduleSource: 'Business Case',
  },
  'Venture blueprint': {
    icon: Map,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    borderClass: 'border-purple-200 dark:border-purple-800/50 hover:border-purple-400',
    title: 'Venture Blueprint',
    helpText: 'Strategic planning roadmap from concept to market. Demonstrates structured thinking about your development journey.',
    moduleSource: 'Business Case',
  },
  'Business canvas': {
    icon: LayoutGrid,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800/50 hover:border-amber-400',
    title: 'Business Canvas',
    helpText: 'Your 9-section business model. Investors want to see your commercial strategy: customers, channels, revenue, and costs.',
    moduleSource: 'Business Case',
  },
  'Team profile': {
    icon: Users,
    colorClass: 'text-cyan-600',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderClass: 'border-cyan-200 dark:border-cyan-800/50 hover:border-cyan-400',
    title: 'Team Profile',
    helpText: 'Who\'s behind this? Team credibility and domain expertise are crucial factors for early-stage investor decisions.',
    moduleSource: 'Team',
  },
  'Essential Gates': {
    icon: Flag,
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50 dark:bg-rose-950/30',
    borderClass: 'border-rose-200 dark:border-rose-800/50 hover:border-rose-400',
    title: 'Essential Gates',
    helpText: 'Development milestones with go/no-go decisions. Shows disciplined project management and de-risking approach.',
    moduleSource: 'Milestones',
  },
  'Evidence Plan': {
    icon: FlaskConical,
    colorClass: 'text-pink-600',
    bgClass: 'bg-pink-50 dark:bg-pink-950/30',
    borderClass: 'border-pink-200 dark:border-pink-800/50 hover:border-pink-400',
    title: 'Clinical Evidence',
    helpText: 'Clinical evidence strategy and study design. Critical for medical device investors to understand your path to market approval.',
    moduleSource: 'Clinical Trials',
  },
  'Market Sizing': {
    icon: TrendingUp,
    colorClass: 'text-yellow-600',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderClass: 'border-yellow-200 dark:border-yellow-800/50 hover:border-yellow-400',
    title: 'Market Sizing',
    helpText: 'TAM, SAM, SOM with patient volumes. Quantifies the opportunity size and your realistic market share expectations.',
    moduleSource: 'Business Case',
  },
  'Reimbursement': {
    icon: DollarSign,
    colorClass: 'text-violet-600',
    bgClass: 'bg-violet-50 dark:bg-violet-950/30',
    borderClass: 'border-violet-200 dark:border-violet-800/50 hover:border-violet-400',
    title: 'Reimbursement',
    helpText: 'Payer strategy and coding pathway. Shows you understand how to get paid — the path from approval to revenue.',
    moduleSource: 'Business Case',
  },
  'Unit Economics': {
    icon: Calculator,
    colorClass: 'text-teal-600',
    bgClass: 'bg-teal-50 dark:bg-teal-950/30',
    borderClass: 'border-teal-200 dark:border-teal-800/50 hover:border-teal-400',
    title: 'Unit Economics',
    helpText: 'CAC, COGS, gross margin, and payback period. Shows investors you understand the economics of each sale.',
    moduleSource: 'Business Case',
  },
  'GTM Strategy': {
    icon: Target,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    borderClass: 'border-orange-200 dark:border-orange-800/50 hover:border-orange-400',
    title: 'GTM Strategy',
    helpText: 'Go-to-market channels and territory priority. Shows your commercial launch strategy and sales cycle.',
    moduleSource: 'Business Case',
  },
  'Use of Proceeds': {
    icon: PieChart,
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderClass: 'border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400',
    title: 'Use of Proceeds',
    helpText: 'How you\'ll allocate raised capital. Shows investors exactly where their money goes.',
    moduleSource: 'Business Case',
  },
  'Manufacturing': {
    icon: Factory,
    colorClass: 'text-slate-600',
    bgClass: 'bg-slate-50 dark:bg-slate-950/30',
    borderClass: 'border-slate-200 dark:border-slate-800/50 hover:border-slate-400',
    title: 'Manufacturing',
    helpText: 'Manufacturing stage and strategy. Shows your path to scaled production.',
    moduleSource: 'Business Case',
  },
  'Risk Analysis': {
    icon: AlertTriangle,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-800/50 hover:border-red-400',
    title: 'Risk Analysis',
    helpText: 'Hazard identification and risk controls (ISO 14971). Shows investors you\'ve identified and mitigated device risks.',
    moduleSource: 'Risk Management',
  },
};

// Helper to match checklist label to card config
function getCardConfigForItem(label: string): typeof cardConfig[string] | null {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('device description')) return cardConfig['Device Description'];
  if (lowerLabel.includes('viability')) return cardConfig['Viability'];
  if (lowerLabel.includes('venture blueprint')) return cardConfig['Venture blueprint'];
  if (lowerLabel.includes('business canvas')) return cardConfig['Business canvas'];
  if (lowerLabel.includes('team profile')) return cardConfig['Team profile'];
  if (lowerLabel.includes('essential gates')) return cardConfig['Essential Gates'];
  if (lowerLabel.includes('evidence plan')) return cardConfig['Evidence Plan'];
  if (lowerLabel.includes('market sizing')) return cardConfig['Market Sizing'];
  if (lowerLabel.includes('reimbursement')) return cardConfig['Reimbursement'];
  if (lowerLabel.includes('unit economics')) return cardConfig['Unit Economics'];
  if (lowerLabel.includes('gtm strategy')) return cardConfig['GTM Strategy'];
  if (lowerLabel.includes('use of proceeds')) return cardConfig['Use of Proceeds'];
  
  if (lowerLabel.includes('manufacturing')) return cardConfig['Manufacturing'];
  if (lowerLabel.includes('risk analysis') || lowerLabel.includes('key risks')) return cardConfig['Risk Analysis'];
  
  return null;
}

// Extract clean title from label
function getCleanTitle(label: string, config: typeof cardConfig[string] | null): string {
  return config?.title || label.replace(/^[✓❌]\s*/, '').split('(')[0].trim();
}

export function XyregGenesisChecklistCards({ readinessChecklist, overallProgress, extraCards }: XyregGenesisChecklistCardsProps) {
  const navigate = useNavigate();
  const { productId } = useParams();

  // Calculate completion stats
  const completedCount = readinessChecklist.filter(item => item.complete).length;
  const totalCount = readinessChecklist.length;

  return (
    <div className="space-y-6">
      {/* Progress summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Investor Readiness Checklist</h2>
          <p className="text-sm text-muted-foreground">
            Complete these sections to build your investor-ready business case
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{completedCount}/{totalCount}</div>
            <div className="text-xs text-muted-foreground">Sections Complete</div>
          </div>
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {readinessChecklist.map((item, index) => {
          const config = getCardConfigForItem(item.label);
          if (!config) return null;
          
          const Icon = config.icon;
          const title = getCleanTitle(item.label, config);
          
          return (
            <Card 
              key={index}
              className={`relative transition-all duration-200 ${config.borderClass} ${config.bgClass} ${
                item.complete ? 'opacity-100' : 'opacity-90 hover:opacity-100'
              }`}
            >
              <CardContent className="p-4">
                {/* Header with icon and status */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg ${config.bgClass} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${config.colorClass}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-sm">{config.helpText}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {item.complete ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Done
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        Missing
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Title and module source badge */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${config.colorClass}`}>{title}</h3>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground font-medium">
                    via {config.moduleSource}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  {config.helpText}
                </p>

                {/* Action button */}
                <Button 
                  variant={item.complete ? "outline" : "default"}
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => navigate(item.route + (item.route.includes('?') ? '&' : '?') + 'returnTo=investor-share')}
                >
                  {item.complete ? 'Edit' : 'Complete'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Extra cards slot (Advanced Analysis teasers) */}
        {extraCards?.map((card, index) => (
          <React.Fragment key={index}>{card}</React.Fragment>
        ))}
      </div>
    </div>
  );
}
