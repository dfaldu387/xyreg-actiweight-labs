import React from 'react';
import { Building2, Lock, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';

interface CompetitiveAnalysisTeaserProps {
  productId: string;
}

export function CompetitiveAnalysisTeaser({ productId }: CompetitiveAnalysisTeaserProps) {
  const { data: product, isLoading: productLoading } = useProductDetails(productId);
  const emdnCode = (product as any)?.emdn_code;
  
  const { 
    data: analysis, 
    isLoading: analysisLoading 
  } = useCompetitiveAnalysis(emdnCode, { enabled: !!emdnCode });

  const isLoading = productLoading || analysisLoading;
  const hasEmdnCode = !!emdnCode;
  const competitorCount = analysis?.totalCompetitors || 0;
  const organizationCount = analysis 
    ? Object.keys(analysis.competitorsByOrganization || {}).length 
    : 0;

  return (
    <Card className="relative transition-all duration-200 border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30">
      <CardContent className="p-4">
        {/* Header with icon and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-indigo-600" />
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
                  <p className="text-sm">
                    Analyze your competitive landscape using EUDAMED data. 
                    See who else is in your device category and understand market positioning.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 gap-1">
              <Lock className="h-3 w-3" />
              Advanced
            </Badge>
          </div>
        </div>

        {/* Title and teaser */}
        <h3 className="font-semibold mb-1 text-indigo-600">Competitive Landscape</h3>
        
        {hasEmdnCode ? (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            {isLoading ? (
              'Analyzing competitors...'
            ) : competitorCount > 0 ? (
              <span className="flex items-center gap-1">
                <span className="font-semibold text-indigo-600 blur-[2px]">{competitorCount}</span>
                <span>devices from</span>
                <span className="font-semibold text-indigo-600 blur-[2px]">{organizationCount}</span>
                <span>organizations found</span>
              </span>
            ) : (
              'No competitors found in your category'
            )}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            Complete device classification to unlock competitor insights
          </p>
        )}

        {/* Action button */}
        <Button 
          variant="default"
          size="sm"
          className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <Lock className="h-3.5 w-3.5" />
          Unlock Advanced Analysis
        </Button>
      </CardContent>
    </Card>
  );
}
