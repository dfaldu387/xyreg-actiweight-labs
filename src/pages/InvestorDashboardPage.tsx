import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Building2, ExternalLink, RefreshCw, Star, Heart, Eye, DollarSign, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useInvestorPortfolioDeals, PortfolioDeal } from '@/hooks/useInvestorPortfolioDeals';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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

// Portfolio Deal Card Component
function PortfolioDealCard({ deal }: { deal: PortfolioDeal }) {
  const navigate = useNavigate();
  const company = deal.share_settings?.companies;
  const product = deal.share_settings?.products;
  const shareSettings = deal.share_settings;

  const handleView = () => {
    navigate(`/investor/view/${deal.share_settings_id}`);
  };

  // Get image URL
  const getImageUrl = () => {
    const images = product?.images;
    if (!images || images.length === 0) return null;
    const firstImage = images[0];
    return typeof firstImage === 'string' ? firstImage : firstImage?.url;
  };

  // Get primary market
  const getPrimaryMarket = () => {
    const markets = product?.markets;
    if (!markets) return null;
    if (Array.isArray(markets)) {
      const selected = markets.find((m: any) => m.selected);
      return selected?.name || selected?.code || markets[0]?.name || markets[0]?.code;
    }
    return Object.keys(markets)[0] || null;
  };

  const imageUrl = getImageUrl();
  const primaryMarket = getPrimaryMarket();
  const fundingDisplay = formatFundingAmount(shareSettings?.mp_funding_amount, shareSettings?.mp_funding_currency);
  const fundingStageDisplay = formatFundingStage(shareSettings?.mp_funding_stage);
  const currentPhase = shareSettings?.current_phase || product?.current_lifecycle_phase;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/30 overflow-hidden">
      {/* Product Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer" onClick={handleView}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product?.name || 'Device'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Activity className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Company Logo Overlay */}
        {company?.logo_url && (
          <div className="absolute top-3 left-3 h-10 w-10 rounded-full bg-background border shadow-sm overflow-hidden">
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Rating Badge */}
        {deal.rating && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Star className="h-3 w-3 inline mr-1 fill-current" />
            {deal.rating}
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Company Name */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {company?.name || 'Unknown Company'}
          </p>
          <h3 className="font-semibold text-lg line-clamp-1">
            {product?.name || 'Device'}
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
                <DollarSign className="h-3 w-3 mr-1" />
                {fundingDisplay}
              </Badge>
            )}
          </div>
        )}

        {/* Badges Row */}
        <div className="flex flex-wrap gap-1.5">
          {primaryMarket && (
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {primaryMarket}
            </Badge>
          )}
          {currentPhase && (
            <Badge variant="secondary" className="text-xs">
              {currentPhase.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>Updated {new Date(deal.updated_at).toLocaleDateString()}</span>
          </div>
          <Button
            size="sm"
            onClick={handleView}
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

// Empty State Component
function EmptyState({
  title,
  description,
  icon: Icon
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  const navigate = useNavigate();

  return (
    <Card className="max-w-lg mx-auto">
      <CardContent className="pt-12 pb-12 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {description}
        </p>
        <Button onClick={() => navigate('/investor/deal-flow')}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Browse Deal Flow
        </Button>
      </CardContent>
    </Card>
  );
}

export default function InvestorDashboardPage() {
  const navigate = useNavigate();
  // Note: InvestorLayout already validates that user has an investor profile
  // and redirects to /investor/register if not. No need to check profile here.
  const { invested, interested, watching, allDeals, isLoading: dealsLoading, refetch } = useInvestorPortfolioDeals();

  const [activeTab, setActiveTab] = useState('invested');

  if (dealsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Portfolio</h1>
                <p className="text-muted-foreground">
                  Track your investments and deals of interest
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {/* <Button variant="outline" onClick={() => navigate('/investor/deal-flow')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Browse Deal Flow
              </Button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Invested</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{invested.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 border-rose-200 dark:border-rose-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <Heart className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">Interested</p>
                <p className="text-2xl font-bold text-rose-900 dark:text-rose-100">{interested.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Watching</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{watching.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {allDeals.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Deals in Your Portfolio"
            description="Browse the Deal Flow marketplace to discover promising MedTech companies. Mark deals as 'Invested' or 'Interested' to track them here."
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="invested" className="gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <DollarSign className="h-4 w-4" />
                Invested
                {invested.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-700 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    {invested.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="interested" className="gap-2 data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                <Heart className="h-4 w-4" />
                Interested
                {interested.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-rose-100 text-rose-700 data-[state=active]:bg-rose-600 data-[state=active]:text-white">
                    {interested.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="watching" className="gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Eye className="h-4 w-4" />
                Watching
                {watching.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    {watching.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Invested Tab */}
            <TabsContent value="invested" className="space-y-4">
              {invested.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="No Investments Yet"
                  description="When you mark a deal as 'Invested' in the Deal Flow, it will appear here for easy tracking."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {invested.map(deal => (
                    <PortfolioDealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Interested Tab */}
            <TabsContent value="interested" className="space-y-4">
              {interested.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="No Deals Marked as Interested"
                  description="When you mark a deal as 'Interested' in the Deal Flow, it will appear here so you can follow up later."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {interested.map(deal => (
                    <PortfolioDealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Watching Tab */}
            <TabsContent value="watching" className="space-y-4">
              {watching.length === 0 ? (
                <EmptyState
                  icon={Eye}
                  title="Not Watching Any Deals"
                  description="When you mark a deal as 'Watching' in the Deal Flow, it will appear here for passive monitoring."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {watching.map(deal => (
                    <PortfolioDealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
