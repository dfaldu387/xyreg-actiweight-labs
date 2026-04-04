import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Building2, TrendingUp, FileText } from 'lucide-react';

interface ExitStrategyPlaceholderProps {
  productId: string;
  disabled?: boolean;
}

export function ExitStrategyPlaceholder({ productId, disabled }: ExitStrategyPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Exit Strategy & Comparable Valuations</h2>
        <p className="text-sm text-muted-foreground">
          Identify potential acquirers and comparable M&A transactions to show investors the path to liquidity.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Path to Liquidity
          </CardTitle>
          <CardDescription>
            Document acquisition targets and comparable transactions to demonstrate exit potential for investors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Potential Acquirers
              </div>
              <p className="text-xs text-muted-foreground">
                Strategic buyers, private equity, or larger medtech companies interested in your space
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Comparable Transactions
              </div>
              <p className="text-xs text-muted-foreground">
                Recent M&A deals in your category with revenue or EBITDA multiples
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-amber-600" />
                Strategic Rationale
              </div>
              <p className="text-xs text-muted-foreground">
                Why acquirers would want your technology, team, or market position
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg border border-dashed bg-muted/20 text-center">
            <p className="text-sm text-muted-foreground">
              Exit strategy documentation coming soon. Focus on building product value and documenting comparable transactions in your pitch materials.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
