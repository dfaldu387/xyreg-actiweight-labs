import React from 'react';
import { Lightbulb, Lock, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIPAssets } from '@/hooks/useIPAssets';

interface IPPortfolioTeaserProps {
  companyId: string;
}

export function IPPortfolioTeaser({ companyId }: IPPortfolioTeaserProps) {
  const { data: ipAssets, isLoading } = useIPAssets(companyId);
  
  // Group by IP type
  const assetsByType = (ipAssets || []).reduce((acc, asset) => {
    const type = asset.ip_type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalAssets = ipAssets?.length || 0;
  const patents = assetsByType['patent'] || 0;
  const trademarks = assetsByType['trademark'] || 0;
  const otherAssets = totalAssets - patents - trademarks;

  // Build summary text
  const getSummaryParts = () => {
    const parts: string[] = [];
    if (patents > 0) parts.push(`${patents} patent${patents > 1 ? 's' : ''}`);
    if (trademarks > 0) parts.push(`${trademarks} trademark${trademarks > 1 ? 's' : ''}`);
    if (otherAssets > 0) parts.push(`${otherAssets} other`);
    return parts;
  };

  return (
    <Card className="relative transition-all duration-200 border-amber-200 dark:border-amber-800/50 hover:border-amber-400 bg-amber-50 dark:bg-amber-950/30">
      <CardContent className="p-4">
        {/* Header with icon and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-amber-600" />
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
                    Showcase your intellectual property portfolio to investors. 
                    Patents, trademarks, and trade secrets often drive MedTech valuations.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
              <Lock className="h-3 w-3" />
              Advanced
            </Badge>
          </div>
        </div>

        {/* Title and teaser */}
        <h3 className="font-semibold mb-1 text-amber-600">IP Portfolio</h3>
        
        {isLoading ? (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            Loading IP assets...
          </p>
        ) : totalAssets > 0 ? (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            <span className="flex items-center gap-1 flex-wrap">
              {getSummaryParts().map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span>,</span>}
                  <span className="font-semibold text-amber-600 blur-[2px]">{part}</span>
                </React.Fragment>
              ))}
              <span>- unlock IP strategy</span>
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            Add IP assets to showcase portfolio strength
          </p>
        )}

        {/* Action button */}
        <Button 
          variant="default"
          size="sm"
          className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
        >
          <Lock className="h-3.5 w-3.5" />
          Unlock Advanced Analysis
        </Button>
      </CardContent>
    </Card>
  );
}
