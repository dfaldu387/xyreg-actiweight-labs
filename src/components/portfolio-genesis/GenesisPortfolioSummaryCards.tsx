import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface GenesisPortfolioSummaryCardsProps {
  totalDevices: number;
  averageReadiness: number;
  investorReadyCount: number;
  needsAttentionCount: number;
}

export function GenesisPortfolioSummaryCards({
  totalDevices,
  averageReadiness,
  investorReadyCount,
  needsAttentionCount,
}: GenesisPortfolioSummaryCardsProps) {
  const { lang } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Rocket className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{lang('portfolioGenesis.totalDevices')}</p>
              <p className="text-2xl font-bold">{totalDevices}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{lang('portfolioGenesis.avgReadiness')}</p>
              <p className="text-2xl font-bold">{averageReadiness}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{lang('portfolioGenesis.investorReady')}</p>
              <p className="text-2xl font-bold text-emerald-600">{investorReadyCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{lang('portfolioGenesis.needsAttention')}</p>
              <p className="text-2xl font-bold text-amber-600">{needsAttentionCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
