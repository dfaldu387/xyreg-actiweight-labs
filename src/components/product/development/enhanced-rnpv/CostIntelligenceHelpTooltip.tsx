import React from 'react';
import { HelpCircle, Info, AlertCircle, TrendingUp, Brain, Globe } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface CostIntelligenceHelpTooltipProps {
  type: 'deviceClass' | 'scenario' | 'smartEstimate' | 'inflation' | 'currency' | 'templates' | 'adjustments';
  className?: string;
}

const helpContent = {
  deviceClass: {
    icon: Brain,
    title: "Device Class Intelligence",
    content: `Device complexity automatically adjusts costs based on regulatory requirements:
    • Class I: Basic multipliers (1.0-1.2x)
    • Class II: Moderate complexity (1.2-1.8x)  
    • Class III: High complexity (1.5-2.5x)
    • IVD/SaMD: Specialized adjustments based on risk classification`
  },
  scenario: {
    icon: TrendingUp,
    title: "Cost Scenarios",
    content: `Smart scenario planning for different cost approaches:
    • Conservative: Higher cost estimates, safe planning (+15-25%)
    • Typical: Standard market costs, balanced approach (baseline)
    • Aggressive: Lower cost estimates, optimistic planning (-10-20%)`
  },
  smartEstimate: {
    icon: Brain,
    title: "Smart Cost Estimation",
    content: `AI-powered cost intelligence that combines:
    • Market-specific regulatory data
    • Device complexity multipliers
    • Current currency exchange rates
    • Inflation projections
    • Historical cost validation`
  },
  inflation: {
    icon: TrendingUp,
    title: "Inflation Adjustment",
    content: `Automatic inflation modeling for multi-year timelines:
    • Uses configurable annual inflation rate
    • Compounds over years to launch
    • Accounts for regional economic differences
    • Updates costs for realistic planning`
  },
  currency: {
    icon: Globe,
    title: "Currency Intelligence",
    content: `Real-time currency conversion with:
    • Live exchange rates
    • Regional cost database
    • Currency risk awareness
    • Multi-market planning support`
  },
  templates: {
    icon: Info,
    title: "Cost Templates",
    content: `Market-validated cost templates providing:
    • Regulatory submission fees
    • Clinical trial requirements
    • Marketing and distribution costs
    • Maintenance and compliance costs
    • Timeline and frequency information`
  },
  adjustments: {
    icon: AlertCircle,
    title: "Smart Adjustments",
    content: `Detailed breakdown of all cost modifications:
    • Device class complexity factors
    • Scenario-based adjustments
    • Inflation calculations
    • Currency conversion rates
    • Final validated estimates`
  }
};

export function CostIntelligenceHelpTooltip({ type, className = "" }: CostIntelligenceHelpTooltipProps) {
  const help = helpContent[type];
  const IconComponent = help.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center cursor-help ${className}`}>
            <IconComponent className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side="top">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">{help.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {help.content}
            </p>
            <Badge variant="outline" className="text-xs">
              Smart Cost Intelligence
            </Badge>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}