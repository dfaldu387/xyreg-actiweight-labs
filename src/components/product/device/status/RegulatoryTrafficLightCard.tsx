import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RegulatoryTrafficLightCardProps {
  productId: string;
  markets?: any[]; // Accept markets directly from parent
  isParentLoading?: boolean; // Loading state from parent component
}

interface MarketStatus {
  code: string;
  name: string;
  status: 'authorized' | 'pending' | 'planned' | 'not_applicable';
}

export function RegulatoryTrafficLightCard({ productId, markets: propMarkets, isParentLoading }: RegulatoryTrafficLightCardProps) {
  // Only fetch if markets not provided via props
  const { data: product, isLoading } = useQuery({
    queryKey: ['product-markets', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('markets')
        .eq('id', productId)
        .single();
      return data;
    },
    enabled: !!productId && !propMarkets
  });

  // Use markets from props if available, otherwise from query
  const rawMarketsData = propMarkets || product?.markets;

  // Transform market status data
  const markets: MarketStatus[] = React.useMemo(() => {
    if (!rawMarketsData) return [];

    const marketsData = rawMarketsData as any;

    // Debug log to see the actual structure
    // console.log('[RegulatoryTrafficLightCard] Raw markets data:', marketsData);
    // console.log('[RegulatoryTrafficLightCard] Source:', propMarkets ? 'props' : 'query');

    const marketArray = Array.isArray(marketsData)
      ? marketsData
      : Object.entries(marketsData).map(([code, data]: [string, any]) => ({
          code,
          name: data?.name || code,
          status: data?.status || 'planned',
          selected: data?.selected,
          marketLaunchStatus: data?.marketLaunchStatus,
          regulatoryStatus: data?.regulatoryStatus
        }));

    // Filter for selected markets - check for truthy selected value
    const selectedMarkets = marketArray.filter((m: any) => {
      // Accept any truthy value for selected (true, "true", 1, etc.)
      // Also accept if selected is undefined but market has marketLaunchStatus or regulatoryStatus set
      const isSelected = m.selected === true ||
                         m.selected === 'true' ||
                         m.selected === 1 ||
                         // If no explicit selected field, check if market has launch data
                         (m.selected === undefined && (m.marketLaunchStatus || m.regulatoryStatus));
      // console.log(`[RegulatoryTrafficLightCard] Market ${m.code}: selected=${m.selected}, marketLaunchStatus=${m.marketLaunchStatus}, regulatoryStatus=${m.regulatoryStatus}, isSelected=${isSelected}`);
      return isSelected;
    });

    return selectedMarkets
      .slice(0, 4)
      .map((m: any) => ({
        code: m.code || m.market_code || 'Unknown',
        name: m.name || m.market_name || m.code || 'Unknown',
        status: normalizeStatus(m)
      }));
  }, [rawMarketsData, propMarkets]);

  function normalizeStatus(market: any): 'authorized' | 'pending' | 'planned' | 'not_applicable' {
    // Check if explicitly launched via marketLaunchStatus
    if (market.marketLaunchStatus === 'launched') {
      return 'authorized';
    }

    // Check regulatory status for launch indicators
    const regulatoryStatus = (market.regulatoryStatus || '').toUpperCase();
    const launchIndicators: Record<string, string[]> = {
      'EU': ['CE_MARKED'],
      'US': ['FDA_APPROVED', 'FDA_CLEARED'],
      'USA': ['FDA_APPROVED', 'FDA_CLEARED'],
      'CA': ['HEALTH_CANADA_LICENSED'],
      'AU': ['TGA_REGISTERED'],
      'JP': ['PMDA_APPROVED'],
      'BR': ['ANVISA_APPROVED'],
      'CN': ['NMPA_APPROVED'],
      'UK': ['CE_MARKED'],
      'CH': ['CE_MARKED']
    };

    const marketCode = market.code || market.market_code || '';
    const marketLaunchStatuses = launchIndicators[marketCode] || [];
    if (marketLaunchStatuses.includes(regulatoryStatus)) {
      return 'authorized';
    }

    // Fallback to status field
    const s = (market.status || market.regulatory_status || '').toLowerCase();
    if (s.includes('authorized') || s.includes('approved') || s.includes('cleared') || s.includes('launched')) return 'authorized';
    if (s.includes('pending') || s.includes('submitted') || s.includes('review')) return 'pending';
    if (s.includes('not_applicable') || s.includes('n/a')) return 'not_applicable';
    return 'planned';
  }

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'authorized':
        return { icon: '🟢', label: 'Launched', color: 'bg-emerald-500/20 text-emerald-100' };
      case 'pending':
        return { icon: '🟡', label: 'Pending', color: 'bg-amber-500/20 text-amber-100' };
      case 'not_applicable':
        return { icon: '⚪', label: 'N/A', color: 'bg-gray-500/20 text-gray-100' };
      default:
        return { icon: '⚪', label: 'Planned', color: 'bg-white/20 text-white' };
    }
  };

  // Show loading skeleton if parent is loading or if we're fetching and no props markets
  if (isParentLoading || (isLoading && !propMarkets)) {
    return (
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 text-white shadow-lg">
        <CardContent className="p-3 space-y-1">
          <div className="flex items-center justify-between text-white/80 text-[10px] uppercase tracking-[0.35em]">
            <span>Regulatory Status</span>
            <Globe className="h-4 w-4" />
          </div>
          <div className="space-y-1 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-8 bg-white/20 rounded" />
                <div className="h-5 w-16 bg-white/20 rounded-full" />
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 right-0 w-1/3 bg-white/10 blur-3xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 text-white shadow-lg">
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center justify-between text-white/80 text-[10px] uppercase tracking-[0.35em]">
          <span>Regulatory Status</span>
          <Globe className="h-4 w-4" />
        </div>
        
        {markets.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-white/80 text-xs">No markets configured</p>
          </div>
        ) : (
          <div className="space-y-1">
            {markets.map((market) => {
              const indicator = getStatusIndicator(market.status);
              return (
                <div key={market.code} className="flex items-center justify-between">
                  <span className="text-xs font-medium">{market.code}</span>
                  <Badge className={`${indicator.color} border-white/30 text-[9px]`}>
                    <span className="mr-0.5">{indicator.icon}</span>
                    {indicator.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
        <div className="absolute inset-y-0 right-0 w-1/3 bg-white/10 blur-3xl" />
      </CardContent>
    </Card>
  );
}
