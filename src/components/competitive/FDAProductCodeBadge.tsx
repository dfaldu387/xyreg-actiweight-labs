import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, Loader2 } from 'lucide-react';
import { FDAProductCodeService } from '@/services/fdaProductCodeService';
import { FDAProductCodeInfo } from '@/types/fdaEnhanced';

interface FDAProductCodeBadgeProps {
  code: string;
  count?: number;
  showTooltip?: boolean;
  clickable?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function FDAProductCodeBadge({ 
  code, 
  count, 
  showTooltip = true, 
  clickable = true,
  size = 'default'
}: FDAProductCodeBadgeProps) {
  const [productCodeInfo, setProductCodeInfo] = useState<FDAProductCodeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProductCodeInfo = async () => {
      try {
        const info = await FDAProductCodeService.getProductCodeInfo(code);
        setProductCodeInfo(info);
      } catch (error) {
        console.error('Error fetching product code info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductCodeInfo();
  }, [code]);
  
  const badge = (
    <Badge 
      variant="outline" 
      className={`
        ${clickable && productCodeInfo ? 'cursor-pointer hover:bg-primary/5 transition-colors' : ''}
        ${size === 'sm' ? 'text-xs py-0.5 px-1.5' : ''}
        ${size === 'lg' ? 'text-sm py-1.5 px-3' : ''}
        inline-flex items-center gap-1
      `}
      onClick={clickable && productCodeInfo ? () => window.open(productCodeInfo.fdaUrl, '_blank') : undefined}
    >
      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      <span className="font-mono font-medium">{code}</span>
      {count && <span className="text-muted-foreground">({count})</span>}
      {clickable && productCodeInfo && (
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      )}
    </Badge>
  );

  if (!showTooltip || !productCodeInfo || loading) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-semibold">{productCodeInfo.description}</div>
            <div className="text-xs space-y-0.5">
              <div className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${FDAProductCodeService.getDeviceClassColor(productCodeInfo.deviceClass)}`}>
                {FDAProductCodeService.getDeviceClassDescription(productCodeInfo.deviceClass)}
              </div>
              <div className="text-muted-foreground">
                {productCodeInfo.medicalSpecialty}
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                Regulation: {productCodeInfo.regulationNumber}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}