import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { ExecutiveKPIDashboard } from "@/components/kpi/ExecutiveKPIDashboard";
import { PortfolioHealthDashboard } from "@/components/portfolio/PortfolioHealthDashboard";
import { useOptimizedCompanyProducts } from "@/hooks/useOptimizedCompanyProducts";
import { useSimplifiedAuthGuard } from "@/hooks/useSimplifiedAuthGuard";
import { useSimplifiedNetworkStatus } from "@/hooks/useSimplifiedNetworkStatus";
import { CompanyDashboardErrorBoundary } from "@/components/error/CompanyDashboardErrorBoundary";
import { buildCompanyBreadcrumbs } from "@/utils/breadcrumbUtils";
import { Settings, Bell, X, Check, AlertTriangle, CheckCircle, Clock, User, Calendar, FileText, XCircle, UserPlus, UserMinus, RefreshCw, Download, Share } from "lucide-react";
import { CompanyHelixMap } from "@/components/qmsr";
import { Badge } from "@/components/ui/badge";
import { useRBRPulseStatus } from "@/hooks/useRBRPulseStatus";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

import { useDevMode } from "@/context/DevModeContext";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Notification, NotificationService } from "@/services/notificationService";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { resolveCompanyToUuid } from "@/utils/simplifiedCompanyResolver";
import { useTranslation } from "@/hooks/useTranslation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { PORTFOLIO_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";


// Notification Component
const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const companyId = useCompanyId();
  const { user } = useAuth();
  const notificationService = new NotificationService();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef(null);
  const { lang } = useTranslation();

  // get notifications from notifications service
  useEffect(() => {
    if (companyId) {
      const fetchNotifications = async () => {
        const notificationsData = await notificationService.getNotifications(companyId, user?.id);
        setNotifications(notificationsData);
        setUnreadCount(notificationsData?.filter(n => !n.is_read).length);
      };
      fetchNotifications();
    }
  }, [companyId, user?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !(dropdownRef.current as any).contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    setUnreadCount(prev => prev - 1);
    const error = await notificationService.markAsRead(id);
    if (error) {
      // console.error('Failed to mark notification as read:', error);
    }
    toast.success(lang('companyDashboard.notificationMarkedRead'));
  };

  const markAllAsRead = async () => {
    setUnreadCount(0);
    const error = await notificationService.markAllAsRead(companyId, user?.id);
    if (error) {
      // console.error('Failed to mark all notifications as read:', error);
    }
    toast.success(lang('companyDashboard.allNotificationsMarkedRead'));
  };

  const removeNotification = async (notificationId: string) => {
    const error = await notificationService.removeNotification(notificationId);
    if (error) {
      // console.error('Failed to remove notification:', error);
    }
    toast.success(lang('companyDashboard.notificationRemoved'));
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getTypeIconAndColor = (type: string) => {
    switch (type) {
      case "group_create":
      case "group_created":
        return {
          icon: CheckCircle,
          color: "text-green-600"
        };
      case "group_edit":
      case "group_edited":
        return {
          icon: AlertTriangle,
          color: "text-yellow-600"
        };
      case "group_delete":
      case "group_deleted":
        return {
          icon: XCircle,
          color: "text-red-600"
        };
      case "group_member_added":
        return {
          icon: UserPlus,
          color: "text-green-600"
        };
      case "group_member_removed":
        return {
          icon: UserMinus,
          color: "text-red-600"
        };
      default:
        return {
          icon: AlertTriangle,
          color: "text-slate-400"
        };
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "group_create":
      case "group_created":
        return "border-green-400";
      case "group_edit":
      case "group_edited":
        return "border-yellow-400";
      case "group_delete":
      case "group_deleted":
        return "border-red-400";
      case "group_member_added":
        return "border-green-400";
      case "group_member_removed":
        return "border-red-400";
      default:
        return "border-slate-200";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge - Currently commented out */}
      {/* <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative hover:bg-slate-100 transition-colors">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>}
       </Button> */}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{lang('companyDashboard.notifications')}</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    {lang('companyDashboard.markAllRead')}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-600 mt-1">
                {unreadCount === 1
                  ? lang('companyDashboard.unreadNotification').replace('{{count}}', String(unreadCount))
                  : lang('companyDashboard.unreadNotifications').replace('{{count}}', String(unreadCount))}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-slate-900 mb-1">{lang('companyDashboard.noNotifications')}</h4>
                <p className="text-slate-600">{lang('companyDashboard.allCaughtUp')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notification => {
                  const { icon: IconComponent, color } = getTypeIconAndColor(notification.type);
                  return (
                    <div key={notification.id} className={`p-4 transition-all duration-200 hover:bg-slate-50 border-l-4 ${getBorderColor(notification.type)}`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${notification.is_read ? "bg-slate-200" : "bg-white shadow-sm"}`}>
                          <IconComponent className={`h-5 w-5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-semibold ${notification.is_read ? "text-slate-600" : "text-slate-900"}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              {!notification.is_read && (
                                <Button variant="ghost" size="icon" onClick={() => markAsRead(notification.id)} className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100">
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => removeNotification(notification.id)} className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className={`text-sm mt-1 ${notification.is_read ? "text-slate-500" : "text-slate-700"}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{notification.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <Button variant="ghost" className="w-full text-sm text-slate-600 hover:text-slate-900">
                {lang('companyDashboard.viewAllNotifications')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// QMS Foundation Section with external header matching Portfolio Financial Health
const QMSFoundationSection = ({ companyId, products, navigate }: { companyId: string; products: any[]; navigate: (path: string) => void }) => {
  const { lang } = useTranslation();
  const handleViewInProduct = () => {
    if (products && products.length > 0) {
      // Navigate to the first product's dashboard (which contains the Device Helix Map)
      navigate(`/app/product/${products[0].id}`);
    } else {
      toast('No products available', { description: 'Add a product to view device-level processes.' });
    }
  };
  
  return (
    <div className="space-y-4">
      {/* External Header - matches Portfolio Financial Health styling */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{lang('companyDashboard.qmsFoundation')}</h1>
          <p className="text-muted-foreground">{lang('companyDashboard.qmsFoundationSubtitle')}</p>
        </div>
      </div>
      
      {/* Map Component - Company-level only (Rungs 1 & 5) */}
      <CompanyHelixMap 
        companyId={companyId} 
        showHeader={false}
        onNodeClick={(nodeId, nodeType) => {
          console.log('Company Node clicked:', nodeId, nodeType);
        }}
        onViewInProduct={handleViewInProduct}
      />
    </div>
  );
};

export default function CompanyDashboard() {
  const { companyName } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { isDevMode, selectedRole } = useDevMode();
  const { companyRoles, activeCompanyRole, switchCompanyRole, isLoading: rolesLoading } = useCompanyRole();
  const authGuard = useSimplifiedAuthGuard();
  const networkStatus = useSimplifiedNetworkStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useTranslation();
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isRestricted = !isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.DASHBOARD);

  // Sync dashboard tab with URL param for help system context
  const dashboardTab = searchParams.get('dashboardTab') || 'portfolio';
  
  const handleDashboardTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'portfolio') {
      newParams.delete('dashboardTab'); // Clean URL for default tab
    } else {
      newParams.set('dashboardTab', tab);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Use optimized data fetching first to get companyId
  const shouldFetchData = authGuard.isReady && authGuard.isAuthenticated && networkStatus.isOnline;

  // Check if user is admin via dev mode or normal authentication
  const isAdmin = isDevMode ? selectedRole === "admin" : hasAdminPrivileges(userRole);
  const {
    products,
    isLoading,
    error,
    companyId,
    refetch
  } = useOptimizedCompanyProducts(companyName || '', {
    enabled: shouldFetchData && Boolean(companyName)
  });

  // Fetch company data to get SRN for EUDAMED import
  const { data: companyData } = useQuery({
    queryKey: ['company-data', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, srn')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  // Move the redirect effect to the top with all other hooks
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : '';

  // Synchronize URL-based company selection with CompanyRoleContext
  useEffect(() => {
    const syncCompanySelection = async () => {
      if (!decodedCompanyName || decodedCompanyName === 'Unknown Company' || !decodedCompanyName.trim()) {
        return;
      }

      // CRITICAL: Wait for roles to load before doing security checks
      // Otherwise empty companyRoles during loading causes false security breach detection
      if (rolesLoading) {
        return;
      }

      // Check if the URL company matches the currently active company
      if (activeCompanyRole && activeCompanyRole.companyName.toLowerCase() === decodedCompanyName.toLowerCase()) {
        return; // Already synchronized
      }

      // Find the company in user's roles by name
      const matchingRole = companyRoles.find(role =>
        role.companyName.toLowerCase() === decodedCompanyName.toLowerCase()
      );

      if (matchingRole && !matchingRole.isActive) {
        const result = await switchCompanyRole(matchingRole.companyId, {
          updateUserMetadata: true,
          navigateToCompany: false // Don't navigate since we're already here
        });
        
      } else if (!matchingRole) {
        // CRITICAL SECURITY: Company not in user's roles - DENY ACCESS

        // Redirect to Client Compass immediately - do not attempt to resolve or switch
        navigate('/app/clients', { replace: true });
        return;
      }
    };

    syncCompanySelection();
  }, [decodedCompanyName, activeCompanyRole, companyRoles, switchCompanyRole, rolesLoading]);

  useEffect(() => {
    if (decodedCompanyName === 'Unknown Company' || !decodedCompanyName.trim()) {
      navigate('/app/clients', { replace: true });
      return;
    }
  }, [decodedCompanyName, navigate]);

  const navigateToClients = () => {
    navigate('/app/clients');
  };

  const navigateToCompany = () => {
    navigate(`/app/clients`);
  };

  const breadcrumbs = buildCompanyBreadcrumbs(
    decodedCompanyName,
    lang('companyDashboard.executiveDashboard'),
    navigateToClients,
    navigateToCompany,
    { clientCompassLabel: lang('companyDashboard.clientCompass') }
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
    toast.success(lang('companyDashboard.dashboardRefreshed'));
  };

  const handleExport = () => {
    toast.success(lang('companyDashboard.dashboardExported'));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(lang('companyDashboard.linkCopied'));
  };

  const headerActions = (
    <>
      {/* Dashboard Actions */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? lang('companyDashboard.refreshing') : lang('companyDashboard.refresh')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isRestricted}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {lang('companyDashboard.export')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={isRestricted}
        className="gap-2"
      >
        <Share className="h-4 w-4" />
        {lang('companyDashboard.share')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isRestricted}
        className="gap-2"
      >
        <Settings className="h-4 w-4" />
        {lang('companyDashboard.customize')}
      </Button>

      {/* Notification System - moved to end */}
      <NotificationDropdown />
    </>
  );

  // CRITICAL: Conditional returns AFTER all hooks are called
  // UNIFIED loading state - combines all loading checks into ONE to prevent multiple loaders/flickering
  const isAnyLoading = !authGuard.isReady || rolesLoading || isLoading;

  if (isAnyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">{lang('companyDashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  // Show auth error state (only after loading is complete)
  if (!authGuard.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">{lang('companyDashboard.authenticationRequired')}</h2>
          <p className="text-muted-foreground">{authGuard.error}</p>
          <button
            onClick={() => navigate('/landing')}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            {lang('companyDashboard.goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  // Show network error state
  if (!networkStatus.isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-orange-600">{lang('companyDashboard.connectionIssue')}</h2>
          <p className="text-muted-foreground">{networkStatus.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            {lang('companyDashboard.retryConnection')}
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-500">{lang('companyDashboard.errorLoadingCompany')}</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-x-2">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              {lang('companyDashboard.retry')}
            </button>
            <button
              onClick={() => navigate('/app/clients')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {lang('companyDashboard.backToClients')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if we're redirecting
  if (decodedCompanyName === 'Unknown Company' || !decodedCompanyName.trim()) {
    return null;
  }

  const displayName = decodedCompanyName;

  return (
    <RestrictedFeatureProvider isRestricted={isRestricted} planName={planName} featureName="Company Dashboard">
      <CompanyDashboardErrorBoundary>
        <div className="flex h-full min-h-0 flex-col">
          <ConsistentPageHeader
            breadcrumbs={breadcrumbs}
            title={`${displayName} ${lang('companyDashboard.executiveDashboard')}`}
            subtitle={lang('companyDashboard.subtitle')}
            actions={headerActions}
          />

          {isRestricted && <RestrictedPreviewBanner className="!mt-6 !mb-0" />}

          <div className="flex-1 overflow-y-auto">
            <div className="w-full py-6 space-y-6">
              {/* Dashboard Tabs - Portfolio Health & QMS Foundation */}
              <Tabs value={dashboardTab} onValueChange={handleDashboardTabChange}>
                <TabsList className="grid w-full max-w-2xl grid-cols-2">
                  <TabsTrigger value="portfolio">
                    {lang('portfolioHealth.title') || 'Portfolio Health'}
                  </TabsTrigger>
                  <TabsTrigger value="qms-foundation">
                    {lang('companyDashboard.qmsFoundation') || 'QMS Foundation'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio" className="mt-6 space-y-6">
                  <ExecutiveKPIDashboard />
                </TabsContent>

                <TabsContent value="qms-foundation" className="mt-6">
                  {companyId && (
                    <QMSFoundationSection companyId={companyId} products={products || []} navigate={navigate} />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </CompanyDashboardErrorBoundary>
    </RestrictedFeatureProvider>
  );
}