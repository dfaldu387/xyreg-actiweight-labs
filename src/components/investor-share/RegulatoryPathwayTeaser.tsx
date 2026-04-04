import React from 'react';
import { Route, Lock, HelpCircle } from 'lucide-react';
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

interface RegulatoryPathwayTeaserProps {
  productId: string;
}

export function RegulatoryPathwayTeaser({ productId }: RegulatoryPathwayTeaserProps) {
  const { data: product, isLoading } = useProductDetails(productId);
  
  // Count selected target markets
  const markets = (product as any)?.markets || [];
  const selectedMarkets = markets.filter((m: any) => m.selected === true);
  const marketCount = selectedMarkets.length;

  return (
    <Card className="relative transition-all duration-200 border-purple-200 dark:border-purple-800/50 hover:border-purple-400 bg-purple-50 dark:bg-purple-950/30">
      <CardContent className="p-4">
        {/* Header with icon and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <Route className="h-5 w-5 text-purple-600" />
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
                    Plan your regulatory pathway with market-by-market scenarios. 
                    Includes 510(k), PMA, CE marking strategy with best/expected/worst case timelines.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 gap-1">
              <Lock className="h-3 w-3" />
              Advanced
            </Badge>
          </div>
        </div>

        {/* Title and teaser */}
        <h3 className="font-semibold mb-1 text-purple-600">Regulatory Pathway</h3>
        
        {isLoading ? (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            Loading markets...
          </p>
        ) : marketCount > 0 ? (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-purple-600 blur-[2px]">{marketCount}</span>
              <span>markets planned - unlock timeline scenarios</span>
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            Select target markets to plan regulatory pathway
          </p>
        )}

        {/* Action button */}
        <Button 
          variant="default"
          size="sm"
          className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <Lock className="h-3.5 w-3.5" />
          Unlock Advanced Analysis
        </Button>
      </CardContent>
    </Card>
  );
}
