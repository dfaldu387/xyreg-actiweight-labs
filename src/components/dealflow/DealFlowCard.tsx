import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, MapPin, Activity, Gauge, Users, DollarSign, Star, Heart, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MarketplaceListing } from '@/types/investor';
import type { DealStatus } from '@/hooks/useInvestorDealNotes';

interface DealFlowCardProps {
  listing: MarketplaceListing;
  onViewDetails: (listing: MarketplaceListing) => void;
  dealStatus?: DealStatus;
}

// Helper to format funding amount
const formatFundingAmount = (amount: number | null, currency: string | null): string | null => {
  if (!amount) return null;
  const displayAmount = amount / 100; // Convert from cents
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'CHF' ? 'Fr' : '';
  
  if (displayAmount >= 1000000) {
    return `${currencySymbol}${(displayAmount / 1000000).toFixed(1)}M`;
  } else if (displayAmount >= 1000) {
    return `${currencySymbol}${(displayAmount / 1000).toFixed(0)}K`;
  }
  return `${currencySymbol}${displayAmount.toLocaleString()}`;
};

// Helper to format funding stage
const formatFundingStage = (stage: string | null): string | null => {
  if (!stage) return null;
  const stages: Record<string, string> = {
    'pre-seed': 'Pre-Seed',
    'seed': 'Seed',
    'series-a': 'Series A',
    'series-b': 'Series B',
    'bridge': 'Bridge',
    'other': 'Other',
  };
  return stages[stage] || stage;
};

// Helper to get status badge config
const getStatusConfig = (status: DealStatus | undefined) => {
  switch (status) {
    case 'invested':
      return {
        label: 'Invested',
        icon: CheckCircle,
        className: 'bg-emerald-500 text-white border-emerald-500'
      };
    case 'interested':
      return {
        label: 'Interested',
        icon: Heart,
        className: 'bg-rose-500 text-white border-rose-500'
      };
    case 'watching':
      return {
        label: 'Watching',
        icon: Eye,
        className: 'bg-blue-500 text-white border-blue-500'
      };
    case 'passed':
      return {
        label: 'Passed',
        icon: null,
        className: 'bg-gray-500 text-white border-gray-500'
      };
    default:
      return null;
  }
};

export function DealFlowCard({ listing, onViewDetails, dealStatus }: DealFlowCardProps) {
  const viabilityScore = listing.product_viability_scorecards?.[0]?.total_score;
  const valueProposition = listing.business_canvas?.value_propositions;

  // Extract primary market from markets data
  const getPrimaryMarket = () => {
    const markets = listing.products?.markets;
    if (!markets) return null;
    
    if (Array.isArray(markets)) {
      const selected = markets.find((m: any) => m.selected);
      return selected?.name || selected?.code || markets[0]?.name || markets[0]?.code;
    }
    
    return Object.keys(markets)[0] || null;
  };

  // Get viability color based on score
  const getViabilityColor = (score: number | null | undefined) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 71) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    if (score >= 41) return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    return 'bg-red-500/10 text-red-600 border-red-500/30';
  };

  // Truncate value proposition to 2 lines
  const truncateText = (text: string | null | undefined, maxLength: number = 120) => {
    if (!text) return null;
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const primaryMarket = getPrimaryMarket();
  // Use marketplace-specific funding if available, fallback to investor funding
  const mpFundingAmount = (listing as any).mp_funding_amount;
  const mpFundingCurrency = (listing as any).mp_funding_currency;
  const mpFundingStage = (listing as any).mp_funding_stage;
  const fundingDisplay = formatFundingAmount(
    mpFundingAmount ?? listing.funding_amount,
    mpFundingCurrency ?? listing.funding_currency
  );
  const fundingStageDisplay = formatFundingStage(mpFundingStage ?? listing.funding_stage);

  // Handle both string URLs and object formats for images
  const getImageUrl = () => {
    const images = listing.products?.images;
    if (!images || images.length === 0) return null;
    const firstImage = images[0];
    // Handle both formats: string URL or object with url property
    return typeof firstImage === 'string' ? firstImage : firstImage?.url;
  };

  const imageUrl = getImageUrl();

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/30 overflow-hidden">
      {/* Product Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/5 to-primary/10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.products?.name || 'Device'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Activity className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Company Logo Overlay */}
        {listing.companies?.logo_url && (
          <div className="absolute top-3 left-3 h-10 w-10 rounded-full bg-background border shadow-sm overflow-hidden">
            <img
              src={listing.companies.logo_url}
              alt={listing.companies?.name || 'Company'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Status Badge - Top Right */}
        {dealStatus && dealStatus !== 'new' && (() => {
          const config = getStatusConfig(dealStatus);
          if (!config) return null;
          const StatusIcon = config.icon;
          return (
            <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
              {StatusIcon && <StatusIcon className="h-3 w-3 inline mr-1" />}
              {config.label}
            </div>
          );
        })()}

        {/* Viability Score Badge - Only show if no status badge */}
        {(!dealStatus || dealStatus === 'new') && viabilityScore !== undefined && viabilityScore !== null && (
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold border ${getViabilityColor(viabilityScore)}`}>
            <Gauge className="h-3 w-3 inline mr-1" />
            {viabilityScore}
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Company Name */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {listing.companies?.name || (listing as any).company_name || 'Unknown Company'}
          </p>
          <h3 className="font-semibold text-lg line-clamp-1">
            {listing.products?.name || 'Device'}
          </h3>
        </div>

        {/* Funding Badge - Prominent Position */}
        {(fundingDisplay || fundingStageDisplay) && (
          <div className="flex items-center gap-2 flex-wrap">
            {fundingStageDisplay && (
              <Badge variant="default" className="bg-primary/90 text-primary-foreground text-xs">
                {fundingStageDisplay}
              </Badge>
            )}
            {fundingDisplay && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary font-semibold">
                {/* <DollarSign className="h-3 w-3 mr-1" /> */}
                {fundingDisplay}
              </Badge>
            )}
          </div>
        )}

        {/* Badges Row */}
        <div className="flex flex-wrap gap-1.5">
          {listing.products?.device_category && (
            <Badge variant="outline" className="text-xs">
              {listing.products.device_category}
            </Badge>
          )}
          {primaryMarket && (
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {primaryMarket}
            </Badge>
          )}
          {listing.current_phase && (
            <Badge variant="secondary" className="text-xs">
              {listing.current_phase.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          )}
        </div>

        {/* Value Proposition */}
        {valueProposition && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {truncateText(valueProposition)}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{listing.view_count || 0} investors viewed</span>
          </div>
          <Button
            size="sm"
            onClick={() => onViewDetails(listing)}
            className="gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
