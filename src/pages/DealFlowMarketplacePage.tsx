import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, AlertCircle, Lock, Globe, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DealFlowCard } from '@/components/dealflow/DealFlowCard';
import { DealFlowFilters } from '@/components/dealflow/DealFlowFilters';
import { useMarketplaceListings, type MarketplaceFilters } from '@/hooks/useMarketplaceListings';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { useInvestorViewLogs } from '@/hooks/useInvestorViewLogs';
import { useInvitedDeals } from '@/hooks/useInvitedDeals';
import { useInvestorDealStatuses } from '@/hooks/useInvestorDealStatuses';

import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { MarketplaceListing } from '@/types/investor';

export default function DealFlowMarketplacePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MarketplaceFilters>({ dealCategory: 'public' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const { profile, isLoading: profileLoading, isVerified } = useInvestorProfile();
  const { data: invitedDeals } = useInvitedDeals();
  const { statusMap } = useInvestorDealStatuses();
  
  // Pass invited deals data to marketplace listings hook
  const { data: listings, isLoading: listingsLoading, error } = useMarketplaceListings(
    filters,
    {
      invitedShareSettingsIds: invitedDeals?.shareSettingsIds || [],
      invitedCompanyIds: invitedDeals?.companyIds || [],
      investorProfileId: profile?.id,
    }
  );
  const { logView } = useInvestorViewLogs(undefined);

  // Invalidate marketplace cache on mount to ensure fresh data after RLS changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['investor-profile'] });
  }, [queryClient]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/investor/register');
        return;
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  // Filter listings by search query
  const filteredListings = listings?.filter(listing => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      listing.companies.name.toLowerCase().includes(query) ||
      listing.products?.name?.toLowerCase().includes(query) ||
      listing.business_canvas?.value_propositions?.toLowerCase().includes(query)
    );
  });

  const handleViewDetails = (listing: MarketplaceListing) => {
    // Log view if user has profile
    if (profile?.id) {
      logView({
        shareSettingsId: listing.id,
        companyId: listing.company_id,
        productId: listing.featured_product_id || undefined,
        investorProfileId: profile.id,
      });
    }

    // Navigate to marketplace detail page
    // Must use marketplace_slug for /marketplace/ route (not public_slug - they're different columns)
    if (listing.marketplace_slug) {
      navigate(`/marketplace/${listing.marketplace_slug}?from=deal-flow`);
    } else if (listing.public_slug) {
      // Fallback to investor view route if only public_slug exists
      navigate(`/investor/${listing.public_slug}?from=deal-flow`);
    }
  };

  if (isCheckingAuth || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Prompt to complete profile if not verified (profile loading is done, no profile exists)
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Please complete your investor profile to access the deal flow marketplace.
          </p>
          <Button onClick={() => navigate('/investor/register')}>
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent border-b">
        <div className="px-6 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">XYREG Deal Flow</h1>
              <p className="text-muted-foreground">
                Discover vetted MedTech investment opportunities
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-medium">{listings?.length || 0}</span>
              <span className="text-muted-foreground">
                {filters.dealCategory === 'invited' ? 'Invited Deals' : 
                 filters.dealCategory === 'all' ? 'Total Deals' : 'Public Listings'}
              </span>
            </div>
            {invitedDeals && (invitedDeals.shareSettingsIds.length > 0 || invitedDeals.companyIds.length > 0) && (
              <div className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{invitedDeals.shareSettingsIds.length + invitedDeals.companyIds.length}</span>
                <span className="text-muted-foreground">Private Invites</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Verified Investors Only</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-6">
        {/* Filters */}
        <DealFlowFilters
          filters={filters}
          onFiltersChange={setFilters}
          invitedCount={(invitedDeals?.shareSettingsIds.length || 0) + (invitedDeals?.companyIds.length || 0)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load listings. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {listingsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        )}

        {/* Listings Grid */}
        {!listingsLoading && filteredListings && filteredListings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <DealFlowCard
                key={listing.id}
                listing={listing}
                onViewDetails={handleViewDetails}
                dealStatus={statusMap[listing.id]}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!listingsLoading && filteredListings && filteredListings.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No listings found</h2>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button variant="outline" onClick={() => { setFilters({}); setSearchQuery(''); }}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
