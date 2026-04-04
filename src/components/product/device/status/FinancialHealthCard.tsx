import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign } from "lucide-react";
import { useProductFinancials } from '@/hooks/useProductFinancials';
import { useTranslation } from '@/hooks/useTranslation';

interface FinancialHealthCardProps {
  productId: string;
  companyId: string;
}

export function FinancialHealthCard({ productId, companyId }: FinancialHealthCardProps) {
  const { lang } = useTranslation();
  const { data: financials, isLoading } = useProductFinancials(productId, companyId);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  // Determine health status based on runway
  const getHealthStatus = (months: number) => {
    if (months <= 0) return { color: 'bg-rose-500', labelKey: 'deviceStatus.healthStatus.critical', textColor: 'text-rose-100' };
    if (months < 6) return { color: 'bg-rose-500', labelKey: 'deviceStatus.healthStatus.low', textColor: 'text-rose-100' };
    if (months < 12) return { color: 'bg-amber-500', labelKey: 'deviceStatus.healthStatus.moderate', textColor: 'text-amber-100' };
    return { color: 'bg-emerald-500', labelKey: 'deviceStatus.healthStatus.healthy', textColor: 'text-emerald-100' };
  };

  const runwayMonths = financials?.runwayMonths || 0;
  const burnRate = financials?.burnRate || 0;
  const healthStatus = getHealthStatus(runwayMonths);
  const runwayProgress = Math.min((runwayMonths / 24) * 100, 100);

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg animate-pulse">
        <CardContent className="p-3 space-y-1 h-[80px]" />
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg">
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center justify-between text-white/80 text-[10px] uppercase tracking-[0.35em]">
          <span>{lang('deviceStatus.financialHealth')}</span>
          <DollarSign className="h-4 w-4" />
        </div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold leading-none">{runwayMonths}</p>
          <span className="text-xs text-white/80 mb-0.5">{lang('deviceStatus.monthsRunway')}</span>
        </div>
        <div className="space-y-0.5">
          <div className="flex justify-between text-[10px] text-white/80">
            <span>{lang('deviceStatus.burn')} {formatCurrency(burnRate)}{lang('deviceStatus.perMonth')}</span>
            <Badge className={`${healthStatus.color} ${healthStatus.textColor} border-white/30 text-[9px]`}>
              {lang(healthStatus.labelKey)}
            </Badge>
          </div>
          <Progress value={runwayProgress} className="h-1.5 bg-white/20" />
        </div>
        <div className="absolute inset-y-0 right-0 w-1/3 bg-white/10 blur-3xl" />
      </CardContent>
    </Card>
  );
}
