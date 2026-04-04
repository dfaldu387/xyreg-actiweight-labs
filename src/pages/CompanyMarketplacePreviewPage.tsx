import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe, Eye, Settings, AlertCircle, ArrowRight, CheckCircle, RefreshCw, Users, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { DealFlowCard } from '@/components/dealflow/DealFlowCard';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { toast } from 'sonner';
import type { MarketplaceListing } from '@/types/investor';

// Separate component for each listing card to avoid closure issues
interface MarketplaceListingCardProps {
  listing: MarketplaceListing;
  onViewDetails: (listing: MarketplaceListing) => void;
  onStatusChange: (listingId: string, isPublished: boolean) => Promise<void>;
}

function MarketplaceListingCard({ listing, onViewDetails, onStatusChange }: MarketplaceListingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState<'published' | 'unpublished'>(
    listing.list_on_marketplace ? 'published' : 'unpublished'
  );

  const handleStatusChange = async (newStatus: 'published' | 'unpublished') => {
    const listingId = listing.id;
    const isPublished = newStatus === 'published';

    console.log('Changing status for listing:', { listingId, productName: listing.products?.name, newStatus });

    setIsUpdating(true);
    setLocalStatus(newStatus);

    try {
      await onStatusChange(listingId, isPublished);
    } catch (error) {
      // Revert on error
      setLocalStatus(listing.list_on_marketplace ? 'published' : 'unpublished');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      {/* Status Dropdown */}
      <div className="absolute -top-3 right-2 z-10">
        <Select
          value={localStatus}
          onValueChange={(v) => handleStatusChange(v as 'published' | 'unpublished')}
          disabled={isUpdating}
        >
          <SelectTrigger
            className={`w-32 h-7 text-xs ${
              localStatus === 'published'
                ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                : 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
            }`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="published">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Published
              </span>
            </SelectItem>
            <SelectItem value="unpublished">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                Unpublished
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className={localStatus === 'unpublished' ? 'opacity-70' : ''}>
        <DealFlowCard
          listing={listing}
          onViewDetails={onViewDetails}
        />
      </div>
    </div>
  );
}

export default function CompanyMarketplacePreviewPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'my-listings' | 'all-listings'>('my-listings');

  // Use the standard company context hook
  const { companyId: contextCompanyId, companyName: resolvedCompanyName, isLoading: isCompanyLoading } = useCurrentCompany();

  // Fallback: Look up company by name from URL if context doesn't have it
  const { data: companyFromUrl } = useQuery({
    queryKey: ['company-by-name-fallback', companyName],
    queryFn: async () => {
      if (!companyName) return null;
      const decodedName = decodeURIComponent(companyName);
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('name', decodedName)
        .maybeSingle();

      if (error) {
        console.error('Error looking up company by name:', error);
        return null;
      }
      return data;
    },
    enabled: !!companyName,
  });

  // Use context company ID if available, otherwise use URL lookup
  const companyId = contextCompanyId || companyFromUrl?.id;

 

  // Fetch company's marketplace listings
  const { data: listings, isLoading: isListingsLoading, refetch: refetchListings } = useQuery({
    queryKey: ['company-marketplace-listings', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_investor_share_settings')
        .select(`
          id,
          company_id,
          public_slug,
          marketplace_slug,
          is_active,
          list_on_marketplace,
          marketplace_listed_at,
          marketplace_expires_at,
          marketplace_categories,
          mp_funding_amount,
          mp_funding_currency,
          mp_funding_stage,
          current_phase,
          featured_product_id,
          companies!company_id(
            id,
            name,
            logo_url,
            description
          ),
          products!featured_product_id(
            id,
            name,
            description,
            images,
            device_category,
            markets
          )
        `)
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching marketplace listings:', error);
        throw error;
      }

      console.log('Marketplace listings raw data:', data);

      // Transform to MarketplaceListing format
      return (data || []).map((item: any) => {
        // Debug each item's structure
        console.log('Processing item:', {
          id: item.id,
          companies: item.companies,
          products: item.products
        });

        // Safely extract company info (could be object or null)
        const company = item.companies || {};
        const product = item.products || {};

        return {
          id: item.id,
          company_id: item.company_id,
          public_slug: item.public_slug,
          marketplace_slug: item.marketplace_slug,
          is_active: item.is_active,
          list_on_marketplace: item.list_on_marketplace,
          marketplace_listed_at: item.marketplace_listed_at,
          marketplace_expires_at: item.marketplace_expires_at,
          marketplace_categories: item.marketplace_categories || [],
          mp_funding_amount: item.mp_funding_amount,
          mp_funding_currency: item.mp_funding_currency,
          mp_funding_stage: item.mp_funding_stage,
          current_phase: item.current_phase,
          featured_product_id: item.featured_product_id,
          // Required funding fields (use mp_ values or null)
          funding_amount: item.mp_funding_amount || null,
          funding_currency: item.mp_funding_currency || null,
          funding_stage: item.mp_funding_stage || null,
          // Flat properties for compatibility
          company_name: company.name || null,
          company_logo_url: company.logo_url || null,
          company_description: company.description || null,
          product_name: product.name || null,
          product_description: product.description || null,
          product_image_url: Array.isArray(product.images) ? product.images[0] : null,
          device_category: product.device_category || null,
          markets: product.markets || null,
          development_phase: item.current_phase,
          view_count: 0,
          // Nested objects for DealFlowCard (expects these)
          companies: {
            id: company?.id || item.company_id || '',
            name: company.name || 'Unknown Company',
            logo_url: company.logo_url || null,
            description: company.description || null,
          },
          products: {
            id: product?.id || item.featured_product_id || '',
            name: product.name || 'Device',
            description: product.description || null,
            images: product.images || [],
            device_category: product.device_category || null,
            markets: product.markets || null,
          },
        };
      }) as MarketplaceListing[];
    },
    enabled: !!companyId,
  });

  // Fetch all marketplace listings (from all companies) - only when viewing all listings
  const { data: allMarketplaceListings, isLoading: isAllListingsLoading } = useQuery({
    queryKey: ['all-marketplace-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_investor_share_settings')
        .select(`
          id,
          company_id,
          public_slug,
          marketplace_slug,
          is_active,
          list_on_marketplace,
          marketplace_listed_at,
          marketplace_expires_at,
          marketplace_categories,
          mp_funding_amount,
          mp_funding_currency,
          mp_funding_stage,
          current_phase,
          featured_product_id,
          companies!company_id(
            id,
            name,
            logo_url,
            description
          ),
          products!featured_product_id(
            id,
            name,
            description,
            images,
            device_category,
            markets
          )
        `)
        .eq('is_active', true)
        .eq('list_on_marketplace', true)
        .not('marketplace_slug', 'is', null)
        .order('marketplace_listed_at', { ascending: false });

      if (error) {
        console.error('Error fetching all marketplace listings:', error);
        throw error;
      }

      // Filter out expired and transform
      const now = new Date();
      return (data || [])
        .filter(item => {
          if (!item.marketplace_expires_at) return true;
          return new Date(item.marketplace_expires_at) > now;
        })
        .map((item: any) => {
          const company = item.companies || {};
          const product = item.products || {};

          return {
            id: item.id,
            company_id: item.company_id,
            public_slug: item.public_slug,
            marketplace_slug: item.marketplace_slug,
            is_active: item.is_active,
            list_on_marketplace: item.list_on_marketplace,
            marketplace_listed_at: item.marketplace_listed_at,
            marketplace_expires_at: item.marketplace_expires_at,
            marketplace_categories: item.marketplace_categories || [],
            mp_funding_amount: item.mp_funding_amount,
            mp_funding_currency: item.mp_funding_currency,
            mp_funding_stage: item.mp_funding_stage,
            current_phase: item.current_phase,
            featured_product_id: item.featured_product_id,
            funding_amount: item.mp_funding_amount || null,
            funding_currency: item.mp_funding_currency || null,
            funding_stage: item.mp_funding_stage || null,
            company_name: company.name || null,
            company_logo_url: company.logo_url || null,
            company_description: company.description || null,
            product_name: product.name || null,
            product_description: product.description || null,
            product_image_url: Array.isArray(product.images) ? product.images[0] : null,
            device_category: product.device_category || null,
            markets: product.markets || null,
            development_phase: item.current_phase,
            view_count: 0,
            companies: {
              id: company?.id || item.company_id || '',
              name: company.name || 'Unknown Company',
              logo_url: company.logo_url || null,
              description: company.description || null,
            },
            products: {
              id: product?.id || item.featured_product_id || '',
              name: product.name || 'Device',
              description: product.description || null,
              images: product.images || [],
              device_category: product.device_category || null,
              markets: product.markets || null,
            },
          };
        }) as MarketplaceListing[];
    },
    enabled: viewMode === 'all-listings',
  });

  // Function to update listing status
  const handleStatusChange = async (listingId: string, isPublished: boolean): Promise<void> => {
    console.log('Updating status in DB:', { listingId, isPublished });

    const { error } = await supabase
      .from('company_investor_share_settings')
      .update({ list_on_marketplace: isPublished })
      .eq('id', listingId);

    if (error) {
      console.error('Error updating listing status:', error);
      toast.error('Failed to update listing status');
      throw error;
    }

    toast.success('Listing status updated');
    queryClient.invalidateQueries({ queryKey: ['company-marketplace-listings', companyId] });
  };

  const isLoading = isCompanyLoading || isListingsLoading || (!companyId && !!companyName);

  // Only show items that have a marketplace_slug (have been saved to marketplace at least once)
  const myMarketplaceItems = listings?.filter(l => l.marketplace_slug) || [];
  const publishedItems = myMarketplaceItems.filter(l => l.list_on_marketplace);
  const unpublishedItems = myMarketplaceItems.filter(l => !l.list_on_marketplace);
  // Sort: published first, then unpublished
  const sortedMyItems = [...publishedItems, ...unpublishedItems];

  // Other companies' listings (exclude own company)
  const otherCompanyListings = (allMarketplaceListings || []).filter(l => l.company_id !== companyId);

  // Check if company has shared at least one device
  const hasSharedDevices = publishedItems.length > 0;

  // Handle view mode change
  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as 'my-listings' | 'all-listings');
  };

  const handleViewDetails = (listing: MarketplaceListing) => {
    // For published devices, use marketplace route
    // For unpublished devices, use investor route (which only checks is_active, not list_on_marketplace)
    if (listing.list_on_marketplace && listing.marketplace_slug) {
      navigate(`/marketplace/${listing.marketplace_slug}?from=preview`);
    } else if (listing.public_slug) {
      // Use investor route for unpublished devices
      navigate(`/investor/${listing.public_slug}?from=preview`);
    } else if (listing.marketplace_slug) {
      // Fallback: try marketplace route with admin preview flag
      navigate(`/marketplace/${listing.marketplace_slug}?from=preview&admin=true`);
    }
  };

  const handleGoToGenesis = () => {
    navigate(`/app/company/${companyName}/portfolio-landing`);
  };

  if (isLoading) {
    return (
      <div className="w-full py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Marketplace Preview
          </h1>
          <p className="text-muted-foreground mt-1">
            See how your devices appear to investors in the Deal Flow marketplace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetchListings()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={handleViewModeChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-listings" className="gap-2">
            <Building2 className="h-4 w-4" />
            My Listings
            {myMarketplaceItems.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{myMarketplaceItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all-listings" className="gap-2">
            <Users className="h-4 w-4" />
            View Other Listings
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* My Listings View */}
      {viewMode === 'my-listings' && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{publishedItems.length}</p>
                    <p className="text-sm text-muted-foreground">Published (In Deal Flow)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{unpublishedItems.length}</p>
                    <p className="text-sm text-muted-foreground">Unpublished</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{myMarketplaceItems.length}</p>
                    <p className="text-sm text-muted-foreground">Total Marketplace Listings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Marketplace Devices */}
          {myMarketplaceItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Your Marketplace Listings</h2>
                <Badge variant="secondary">
                  {myMarketplaceItems.length} devices
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your device listings. Published devices are visible in Investor Deal Flow.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedMyItems.map((listing) => (
                  <MarketplaceListingCard
                    key={listing.id}
                    listing={listing}
                    onViewDetails={handleViewDetails}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Listings */}
          {myMarketplaceItems.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Marketplace Listings Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Go to XyReg Genesis and click "Share on Marketplace" to add devices to the marketplace.
                </p>
                <Button onClick={handleGoToGenesis}>
                  Go to Device Portfolio
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* All Listings View (Other Companies) */}
      {viewMode === 'all-listings' && (
        <>
          {/* Show guideline if company hasn't published any device */}
          {!hasSharedDevices ? (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 w-full">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 mb-2">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Share to View Other Listings</h3>
                  <p className="text-muted-foreground">
                    To browse devices from other companies on the marketplace, you need to publish at least one of your devices first.
                  </p>
                  <div className="bg-background border rounded-lg p-6 text-left space-y-3 max-w-2xl mx-auto">
                    <p className="font-medium">How to publish your device:</p>
                    <ol className="text-muted-foreground space-y-2 list-decimal list-inside">
                      <li>Go to your Device Portfolio in XyReg Genesis</li>
                      <li>Click "Share on Marketplace" for a device</li>
                      <li>Fill in the marketplace details and save</li>
                      <li>Set the status to "Published"</li>
                    </ol>
                  </div>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button variant="outline" onClick={() => setViewMode('my-listings')}>
                      View My Listings
                    </Button>
                    <Button onClick={handleGoToGenesis}>
                      Go to Device Portfolio
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Info Banner */}
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>Marketplace Listings from Other Companies</AlertTitle>
                <AlertDescription>
                  Browse devices from other companies on the marketplace. You can view these because you've shared your own devices.
                </AlertDescription>
              </Alert>

              {/* Loading State */}
              {isAllListingsLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-80" />
                  ))}
                </div>
              )}

              {/* Other Companies' Listings */}
              {!isAllListingsLoading && otherCompanyListings.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Other Companies' Devices</h2>
                    <Badge variant="secondary">
                      {otherCompanyListings.length} devices
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherCompanyListings.map((listing) => (
                      <DealFlowCard
                        key={listing.id}
                        listing={listing}
                        onViewDetails={(l) => {
                          if (l.marketplace_slug) {
                            navigate(`/marketplace/${l.marketplace_slug}`);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Other Listings */}
              {!isAllListingsLoading && otherCompanyListings.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Other Listings Yet</h3>
                    <p className="text-muted-foreground">
                      Be the first! Other companies haven't shared their devices on the marketplace yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
