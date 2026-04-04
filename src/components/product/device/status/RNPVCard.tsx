import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiniSparkline } from '@/components/common/MiniSparkline';
import { TrendingUp } from "lucide-react";
import { useProductRNPV } from '@/hooks/useProductRNPV';
import { useTranslation } from '@/hooks/useTranslation';

interface RNPVCardProps {
  productId: string;
}

export function RNPVCard({ productId }: RNPVCardProps) {
  const { lang } = useTranslation();
  const { data: rnpv, isLoading } = useProductRNPV(productId);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  // Generate sample trend data
  const trendData = React.useMemo(() => {
    const baseValue = rnpv?.riskAdjustedNPV || 0;
    if (baseValue === 0) return [0, 0, 0, 0, 0, 0, 0];
    
    // Generate slight variations for sparkline
    return [
      baseValue * 0.85,
      baseValue * 0.88,
      baseValue * 0.92,
      baseValue * 0.95,
      baseValue * 0.97,
      baseValue * 0.99,
      baseValue
    ];
  }, [rnpv?.riskAdjustedNPV]);

  const loaPercentage = Math.round((rnpv?.combinedLOA || 0) * 100);

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 text-white shadow-lg animate-pulse">
        <CardContent className="p-3 space-y-1 h-[80px]" />
      </Card>
    );
  }

  if (!rnpv?.riskAdjustedNPV) {
    return (
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 text-white shadow-lg">
        <CardContent className="p-3 space-y-1">
          <div className="flex items-center justify-between text-white/80 text-[10px] uppercase tracking-[0.35em]">
            <span>{lang('deviceStatus.valuationRNPV')}</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-center py-2">
            <p className="text-lg font-bold">—</p>
            <p className="text-[10px] text-white/80">{lang('deviceStatus.noAnalysisYet')}</p>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 text-[9px]">
            {lang('deviceStatus.runRNPVAnalysis')}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 text-white shadow-lg">
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center justify-between text-white/80 text-[10px] uppercase tracking-[0.35em]">
          <span>{lang('deviceStatus.valuationRNPV')}</span>
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold leading-none">{formatCurrency(rnpv.riskAdjustedNPV)}</p>
        </div>
        <div className="rounded-lg bg-white/10 px-2 py-1">
          <MiniSparkline data={trendData} color="white" height={16} />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/80">{lang('deviceStatus.combinedLOA')}</span>
          <Badge className="bg-white/20 text-white border-white/30 text-[9px]">
            {loaPercentage}%
          </Badge>
        </div>
        <div className="absolute inset-y-0 right-0 w-1/3 bg-white/10 blur-3xl" />
      </CardContent>
    </Card>
  );
}
