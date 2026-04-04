import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedProductMarket } from "@/types/client";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MultiMarketStatusDisplayProps {
  markets: EnhancedProductMarket[];
  productId?: string;
  productClass?: string;
  onMarketClick?: (marketCode: string) => void;
}

// Country flag mapping
const countryFlags: Record<string, string> = {
  'EU': '🇪🇺',
  'US': '🇺🇸',
  'USA': '🇺🇸',
  'CA': '🇨🇦',
  'AU': '🇦🇺',
  'JP': '🇯🇵',
  'BR': '🇧🇷',
  'CN': '🇨🇳',
  'IN': '🇮🇳',
  'KR': '🇰🇷',
  'UK': '🇬🇧',
  'CH': '🇨🇭'
};

// Format class value from DB format (e.g. "class-i" -> "I", "class-iia" -> "IIa")
const formatClassValue = (rawClass: string): string => {
  if (!rawClass) return '';
  const cleaned = rawClass.replace(/^class[-_\s]*/i, '').trim();
  // Map common patterns
  const classMap: Record<string, string> = {
    'i': 'I', 'ii': 'II', 'iia': 'IIa', 'iib': 'IIb', 'iii': 'III',
    '1': 'I', '2': 'II', '2a': 'IIa', '2b': 'IIb', '3': 'III',
  };
  return classMap[cleaned.toLowerCase()] || cleaned;
};

// Format status text for better readability
const formatStatusText = (status: string): string => {
  if (!status) return "Not Set";
  
  const specialCases: Record<string, string> = {
    'ce_marked': 'CE Marked',
    'ce_marking_in_progress': 'CE Marking in Progress',
    'fda_approved': 'FDA Approved',
    'fda_cleared': 'FDA Cleared',
    'fda_pending': 'FDA Pending',
    'fda_denied': 'FDA Denied',
    'health_canada_licensed': 'Health Canada Licensed',
    'health_canada_review': 'Health Canada Review',
    'tga_registered': 'TGA Registered',
    'tga_pending': 'TGA Pending',
    'pmda_approved': 'PMDA Approved',
    'pmda_pending': 'PMDA Pending',
    'anvisa_approved': 'ANVISA Approved',
    'anvisa_pending': 'ANVISA Pending',
    'nmpa_approved': 'NMPA Approved',
    'nmpa_pending': 'NMPA Pending',
    'cdsco_approved': 'CDSCO Approved',
    'cdsco_pending': 'CDSCO Pending',
    'kfda_approved': 'KFDA Approved',
    'kfda_pending': 'KFDA Pending',
    'market_withdrawn': 'Market Withdrawn',
    'market_recall': 'Market Recall',
    'under_review': 'Under Review',
    'pending_approval': 'Pending Approval',
    'pre-development': 'Pre-Development'
  };
  
  const normalizedStatus = status.toLowerCase();
  if (specialCases[normalizedStatus]) {
    return specialCases[normalizedStatus];
  }
  
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getStatusBadgeProps = (status: string | undefined) => {
  if (!status) return { variant: "outline" as const, className: "text-muted-foreground", text: "Not Set" };

  const normalizedStatus = status.toLowerCase();
  const formattedText = formatStatusText(status);

  const greenStatuses = ['launched', 'approved', 'cleared', 'marked', 'licensed', 'ce_marked', 'fda_approved', 'fda_cleared', 'health_canada_licensed', 'tga_registered', 'pmda_approved', 'anvisa_approved', 'nmpa_approved', 'cdsco_approved', 'kfda_approved'];
  if (greenStatuses.some(s => normalizedStatus.includes(s))) {
    return { variant: "default" as const, className: "bg-green-500 hover:bg-green-600", text: formattedText };
  }

  const blueStatuses = ['development', 'progress', 'pending', 'ce_marking_in_progress', 'fda_pending', 'health_canada_review', 'tga_pending', 'pmda_pending', 'anvisa_pending', 'nmpa_pending', 'cdsco_pending', 'kfda_pending', 'under_review', 'pending_approval'];
  if (blueStatuses.some(s => normalizedStatus.includes(s))) {
    return { variant: "default" as const, className: "bg-blue-500 hover:bg-blue-600", text: formattedText };
  }

  const redStatuses = ['pre-development', 'concept', 'withdrawn', 'recall', 'denied', 'market_withdrawn', 'market_recall', 'fda_denied', 'inactive'];
  if (redStatuses.some(s => normalizedStatus.includes(s))) {
    return { variant: "default" as const, className: "bg-red-500 hover:bg-red-600", text: formattedText };
  }

  return { variant: "outline" as const, className: "text-muted-foreground", text: formattedText };
};

export function MultiMarketStatusDisplay({ markets, productId, productClass, onMarketClick }: MultiMarketStatusDisplayProps) {
  // Fetch product class from DB if not provided via props
  const { data: fetchedClass } = useQuery({
    queryKey: ['product-class', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data } = await supabase
        .from('products')
        .select('class, eudamed_risk_class')
        .eq('id', productId)
        .single();
      const raw = data?.eudamed_risk_class || data?.class;
      return raw ? formatClassValue(raw) : null;
    },
    enabled: !!productId && !productClass,
    staleTime: 5 * 60 * 1000,
  });

  const resolvedClass = productClass ? formatClassValue(productClass) : fetchedClass;

  const selectedMarkets = markets.filter(market => market.selected);

  if (selectedMarkets.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs sm:text-sm text-muted-foreground">No target markets configured</p>
      </div>
    );
  }

  const handleCardClick = (marketCode: string) => {
    if (onMarketClick) {
      onMarketClick(marketCode);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
      {selectedMarkets.map((market, index) => {
        const flag = countryFlags[market.code] || '🌍';
        const statusProps = getStatusBadgeProps(market.regulatoryStatus);
        const effectiveClass = market.riskClass ? formatClassValue(market.riskClass) : resolvedClass;
        
        return (
          <Card 
            key={`${market.code}-${index}`} 
            className={`h-fit ${onMarketClick ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
            onClick={() => handleCardClick(market.code)}
          >
            <CardContent className="p-2 sm:p-3">
              <div className="space-y-2">
                {/* Market Header */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">{flag}</span>
                  <span className="text-xs sm:text-sm font-medium truncate">
                    {market.name || market.code}
                  </span>
                </div>
                
                {/* Regulatory Status Badge - includes class if available */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge 
                    variant={statusProps.variant}
                    className={`text-xs ${statusProps.className}`}
                  >
                    {statusProps.text}{effectiveClass ? ` (Class ${effectiveClass})` : ''}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
