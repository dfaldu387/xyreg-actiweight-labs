import { DashboardHeader } from "@/components/DashboardHeader";
import { ClientCard } from "@/components/ClientCard";
import { ClientDetails } from "@/components/ClientDetails";
import { ClientLoadingState } from "@/components/dashboard/ClientLoadingState";
import { useSimpleClientsFixed } from "@/hooks/useSimpleClientsFixed";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Client } from "@/types/client";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DirectNameFix } from "@/components/eudamed/DirectNameFix";
import { CompanyUsageService } from "@/services/companyUsageService";
import { HelpAnchor } from "@/components/help/HelpAnchor";
import { AwaitingMyReviewWidget } from "@/components/review/AwaitingMyReviewWidget";

import { Badge } from "@/components/ui/badge";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { MISSION_CONTROL_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";
import { useTranslation } from "@/hooks/useTranslation";

function ClientsContent() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { collapseMenu } = useSidebarState();
  const { companyRoles, activeCompanyRole, isLoading: companyRolesLoading } = useCompanyRole();
  const navigate = useNavigate();
  const { lang } = useTranslation();

  // Plan-based menu access
  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(MISSION_CONTROL_MENU_ACCESS.CLIENT_COMPASS);
  const isRestricted = !isFeatureEnabled;

  const ITEMS_PER_PAGE = 20;

  // Check if user has only one company and redirect to company dashboard
  // useEffect(() => {
  //   // Don't redirect while company roles are still loading
  //   if (companyRolesLoading) return;
    
  //   // If user has only one company, redirect to its dashboard
  //   if (companyRoles.length === 1) {
  //     const singleCompany = companyRoles[0];
  //     console.log('[Clients] User has only one company, redirecting to company dashboard:', singleCompany.companyName);
  //     navigate(`/app/company/${encodeURIComponent(singleCompany.companyName)}`, { replace: true });
  //     return;
  //   }
  // }, [companyRoles, companyRolesLoading, navigate]);

  // Debounce search term to reduce filtering overhead
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 200); // 200ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  const {
    clients = [],
    isLoading,
    error,
    refreshClients,
    isDataLoaded
  } = useSimpleClientsFixed();

  // Fetch recent company IDs from database
  const [recentCompanyIds, setRecentCompanyIds] = useState<string[]>([]);
  useEffect(() => {
    // Only fetch once when data is loaded (isDataLoaded is stable)
    if (isDataLoaded) {
      CompanyUsageService.getRecentCompanyIds(3).then(setRecentCompanyIds);
    }
  }, [isDataLoaded]); // Use stable flag instead of clients array to prevent infinite loop

  // Performance monitoring
  const [loadStartTime] = useState(performance.now());
  const [currentLoadTime, setCurrentLoadTime] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentLoadTime(performance.now() - loadStartTime);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setCurrentLoadTime(0);
    }
  }, [isLoading, loadStartTime]);

  const handleStatusFilterChange = (value: string) => {
    if (isRestricted) return;
    setStatusFilter(value);
  };
  // console.log("isLoading ClientsContent",isLoading)
  // Filter clients based on debounced search term and status
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Apply search filter (using debounced term for better performance)
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.country.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const statusMap = {
        "on-track": "On Track",
        "at-risk": "At Risk",
        "attention": "Needs Attention"
      };

      const targetStatus = statusMap[statusFilter as keyof typeof statusMap];
      if (targetStatus) {
        filtered = filtered.filter(client => client.status === targetStatus);
      }
    }

    return filtered;
  }, [clients, debouncedSearchTerm, statusFilter]);

  // Separate clients into Recent (from DB) and All (alphabetically sorted, excluding recent)
  const { recentClients, alphabeticalClients } = useMemo(() => {
    const recentIdSet = new Set(recentCompanyIds);

    // Preserve DB order (most recent first) by sorting based on index in recentCompanyIds
    const recent = filteredClients
      .filter(client => recentIdSet.has(client.id))
      .sort((a, b) => recentCompanyIds.indexOf(a.id) - recentCompanyIds.indexOf(b.id));

    // Filter out recent companies from All Company section
    const recentClientIds = new Set(recent.map(c => c.id));
    const alphabetical = [...filteredClients]
      .filter(client => !recentClientIds.has(client.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { recentClients: recent, alphabeticalClients: alphabetical };
  }, [filteredClients, recentCompanyIds]);

  const handleClientSelect = useCallback((client: Client) => {
    if (isRestricted) return;
    setSelectedClient(client);
  }, [isRestricted]);

  const handleCloseDetails = useCallback(() => {
    if (isRestricted) return;
    setSelectedClient(null);
  }, [isRestricted]);

  const handleClientArchived = useCallback((clientId: string) => {
    if (isRestricted) return;
    // Close the details panel since the client was archived
    setSelectedClient(null);
    // The data will be automatically refreshed by the query invalidation
  }, [isRestricted]);

  const handleCompanyDashboardClick = useCallback(() => {
    if (isRestricted) return;
    collapseMenu("Company Dashboard");
  }, [collapseMenu, isRestricted]);

  // Get clients to display based on pagination state (for All Companies section)
  const displayedClients = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    return alphabeticalClients.slice(startIndex, endIndex);
  }, [alphabeticalClients, currentPage]);

  const handleLoadMore = useCallback(() => {
    if (isRestricted) return;
    setCurrentPage(prevPage => prevPage + 1);
  }, [isRestricted]);

  const handleShowAll = useCallback(() => {
    if (isRestricted) return;
    // Calculate total pages needed to show all clients
    const totalPages = Math.ceil(alphabeticalClients.length / ITEMS_PER_PAGE);
    setCurrentPage(totalPages);
  }, [alphabeticalClients.length, isRestricted]);

  // Show loading state while checking plan access
  if (isLoadingPlanAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{lang('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName="Client Compass"
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-background/95 rounded-lg shadow-sm">
          <HelpAnchor helpKey="client-compass">
            <DashboardHeader
              refreshClients={refreshClients}
              searchTerm={searchTerm}
              onSearchChange={(value) => {
                if (isRestricted) return;
                setSearchTerm(value);
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              clientCount={clients.length}
              disabled={isRestricted}
            />
          </HelpAnchor>
        {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
        </div>

      {/* Main content area with proper scrolling */}
      <div className="flex-1 overflow-y-auto" data-tour="client-compass-grid">
        <div className="w-full py-6">

          {/* Emergency Fix for Nox Medical moved to notification bell */}

          <ClientLoadingState
            isLoading={isLoading}
            hasError={!!error}
            errorMessage={error || undefined}
            onRefresh={refreshClients}
            clientCount={filteredClients.length}
          />

          {/* Loading progress indicator */}

          {/* Loading skeleton for immediate visual feedback */}
          {/* {isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* Error state */}
          {error && !isLoading && (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-red-600">{lang('clients.errorLoadingClients')}</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
              <button
                onClick={() => {
                  if (isRestricted) return;
                  refreshClients();
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRestricted}
              >
                {lang('clients.tryAgain')}
              </button>
            </div>
          )}

          {/* Client grid */}
          {!isLoading && !error && (
            <div className="space-y-8">
              {filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  {clients.length === 0 ? (
                    <>
                      <h2 className="text-xl font-semibold">{lang('clients.noClientsFound')}</h2>
                      <p className="text-muted-foreground mt-2">{lang('clients.getStartedAddClient')}</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold">{lang('clients.noMatchingClients')}</h2>
                      <p className="text-muted-foreground mt-2">{lang('clients.adjustSearchCriteria')}</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Recent Section */}
                  {recentClients.length > 0 && (
                    <div className="space-y-4">
                      {/* Section Divider with Text */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-muted-foreground/40"></div>
                        <Badge variant="outline" className="text-sm font-medium px-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300">{lang('clients.mostRecent')}</Badge>
                        <div className="flex-1 h-px bg-muted-foreground/40"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
                        {recentClients.map((client) => (
                          <ClientCard
                            key={`recent-${client.id}`}
                            client={client}
                            onClientSelect={handleClientSelect}
                            onCompanyDashboardClick={handleCompanyDashboardClick}
                            disabled={isRestricted}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Companies Section (Alphabetical) */}
                  {alphabeticalClients.length > 0 && (
                    <div className="space-y-4">
                      {/* Section Divider with Text */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-muted-foreground/40"></div>
                        <Badge variant="outline" className="text-sm font-medium px-2 bg-green-100 hover:bg-green-200 text-green-800 border-green-300">{lang('clients.allClients')}</Badge>
                        <div className="flex-1 h-px bg-muted-foreground/40"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
                        {displayedClients.map((client) => (
                          <ClientCard
                            key={`all-${client.id}`}
                            client={client}
                            onClientSelect={handleClientSelect}
                            onCompanyDashboardClick={handleCompanyDashboardClick}
                            disabled={isRestricted}
                          />
                        ))}

                        {/* Show "Load More" button if there are more clients */}
                        {displayedClients.length < alphabeticalClients.length && (
                          <div className="col-span-full flex justify-center py-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-3">
                                {lang('clients.showingOfClients')
                                  .replace('{{shown}}', String(displayedClients.length))
                                  .replace('{{total}}', String(alphabeticalClients.length))}
                              </p>
                              <div className="flex gap-3">
                                <Button
                                  onClick={handleLoadMore}
                                  variant="default"
                                  className="px-6"
                                  disabled={isRestricted}
                                >
                                  {lang('clients.loadMore')}
                                </Button>
                                <Button
                                  onClick={handleShowAll}
                                  variant="outline"
                                  className="px-6"
                                  disabled={isRestricted}
                                >
                                  {lang('clients.showAll')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Side panel for client details */}
      {selectedClient && (
        <div className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-lg z-50 animate-slide-in-right min-w-[450px]">
          <ClientDetails
            client={selectedClient}
            onClose={handleCloseDetails}
            onClientArchived={handleClientArchived}
            disabled={isRestricted}
          />
        </div>
      )}
      </div>
    </RestrictedFeatureProvider>
  );
}

export default function Clients() {
  return (
    <ErrorBoundary level="page">
      <ClientsContent />
    </ErrorBoundary>
  );
}
