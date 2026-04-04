import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useDevMode } from "@/context/DevModeContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { L1PrimaryModuleBar } from "@/components/test/L1PrimaryModuleBar";
import { L2ContextualBar } from "@/components/test/L2ContextualBar";
import { defaultSidebarConfig, SidebarConfig, configureSidebarWithAuth } from "@/components/test/SidebarConfig";
import { CompanyRoleSwitcher } from "@/components/CompanyRoleSwitcher";
import { DevCompanySwitcher } from "@/components/dev/DevCompanySwitcher";
// HelpButton removed — all help now lives in GlobalHelpSidebar
import { EnhancedOnboardingTour } from "@/components/help/EnhancedOnboardingTour";
import { ContextualHelp } from "@/components/help/ContextualHelp";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "../ui/button";
import {
  User,
  Bell,
  X,
  Check,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  UserMinus,
  Timer,
  BookOpen,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { useCompanyId } from "@/hooks/useCompanyId";
import { supabase } from "@/integrations/supabase/client";
import { Notification, NotificationService } from "@/services/notificationService";
import { toast } from "sonner";
// Note: useRouteProtection removed - ProtectedRoute and CompanyRouteGuard already handle security
import { ImpersonationBanner } from "@/components/ui/ImpersonationBanner";
import { RegulatoryDisclaimer } from "./RegulatoryDisclaimer";


import { useCompanyContextPersistence } from "@/hooks/useCompanyContextPersistence";
import { ExpirationWarningBanner } from "@/components/subscription/ExpirationWarningBanner";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { useSidebarData } from "@/hooks/useSidebarData";
import { getCurrentModuleFromRoute } from "@/components/test/SidebarConfig";
import { useEffectiveUserRole } from "@/hooks/useEffectiveUserRole";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import GoogleTranslate from "@/components/GoogleTranslate";
import { useMissionControl } from "@/context/MissionControlContext";
import { ProductRouteValidator } from "@/components/product/ProductRouteValidator";
import SuperAdminSidebar from "@/components/layout/sidebar/SuperAdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useInvestorProfile } from "@/hooks/useInvestorProfile";
// import { AdvancedSettingsDialog } from "@/components/layout/AdvancedSettingsDialog";
import { ReturnToGenesisButton } from "@/components/funnel/ReturnToGenesisButton";
import { FullPageLoader } from "@/components/ui/loading-spinner";
import { FloatingReturnButton } from "../funnel/FloatingReturnButton";
import { GlobalHelpSidebar } from "@/components/help/GlobalHelpSidebar";
import { useHelpKeyboardShortcut } from "@/hooks/useHelpKeyboardShortcut";
import { NavigationSearchDialog } from "@/components/layout/NavigationSearchDialog";
import { useNavigationSearch } from "@/hooks/useNavigationSearch";
import { getModifierSymbol } from "@/utils/keyboard";
import { MobileDeviceBanner } from "@/components/ui/MobileDeviceBanner";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThreadSheetProvider } from "@/context/ThreadSheetContext";


export default function AppLayout() {
  // Note: Route protection handled by ProtectedRoute and CompanyRouteGuard

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, signOut } = useAuth();
  const { isDevMode } = useDevMode();
  const companyId = useCompanyId();
  const { companyRoles, activeCompanyRole } = useCompanyRole();

  // Genesis login redirect: LoginForm sets 'genesis_login' in sessionStorage
  // while checking the plan. Show a loader until the check completes.
  const [genesisLoginPending, setGenesisLoginPending] = useState(
    () => !!sessionStorage.getItem('genesis_login')
  );

  useEffect(() => {
    if (!genesisLoginPending) return;

    const check = () => {
      const value = sessionStorage.getItem('genesis_login');
      if (!value) {
        // Not genesis or already navigated — stop loading
        setGenesisLoginPending(false);
      } else if (value !== 'checking') {
        // Value is the redirect URL — navigate and clean up
        sessionStorage.removeItem('genesis_login');
        setGenesisLoginPending(false);
        navigate(value, { replace: true });
      }
    };

    check();
    const interval = setInterval(check, 100);
    const timeout = setTimeout(() => {
      // Safety: clear after 5s no matter what
      sessionStorage.removeItem('genesis_login');
      setGenesisLoginPending(false);
    }, 5000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [genesisLoginPending, navigate]);

  // Helper functions for user-specific localStorage keys
  // CRITICAL: All localStorage keys MUST include both userId AND companyId for data isolation
  // This prevents data leaks when switching between companies
  const getLastSelectedProductKey = () => {
    if (!user?.id || !companyId) return "lastSelectedProduct";
    return `lastSelectedProduct_${user.id}_${companyId}`;
  };

  const getLastSelectedProductRouteKey = () => {
    if (!user?.id || !companyId) return "lastSelectedProductRoute";
    return `lastSelectedProductRoute_${user.id}_${companyId}`;
  };

  // Helper function for company route localStorage key
  const getLastSelectedCompanyRouteKey = () => {
    if (!user?.id || !companyId) return "lastSelectedCompanyRoute";
    return `lastSelectedCompanyRoute_${user.id}_${companyId}`;
  };

  // Helper function for generic module route localStorage key
  // This stores the last visited route for each L1 module (documents, audits, compliance, etc.)
  const getLastModuleRouteKey = (moduleId: string) => {
    if (!user?.id || !companyId) return `lastModuleRoute_${moduleId}`;
    return `lastModuleRoute_${moduleId}_${user.id}_${companyId}`;
  };

  // Check if we're on a super admin route
  const isSuperAdminRoute = location.pathname.startsWith("/super-admin");
  // Use cached company info from React Query instead of direct fetch
  const { data: company } = useCompanyInfo(companyId);
  const { recoverCompanyContext, getEffectiveCompanyContext } = useCompanyContextPersistence();

  const [activeModule, setActiveModule] = useState<string | null>(defaultSidebarConfig.defaultActiveModule || null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig>(() =>
    configureSidebarWithAuth(defaultSidebarConfig, signOut),
  );
  const [isL2Collapsed, setIsL2Collapsed] = useState(false);
  const [hasRestoredProduct, setHasRestoredProduct] = useState(false);

  // Update sidebar config when signOut function changes
  useEffect(() => {
    setSidebarConfig(configureSidebarWithAuth(defaultSidebarConfig, signOut));
  }, [signOut]);

  // Get sidebar data for context
  const { currentCompany, currentProductId, productOwnerCompany, productsForMenu } = useSidebarData();

  // Get Mission Control context for company switching in Mission Control
  const { selectedCompanyName } = useMissionControl();

  // Track previous companyId and currentCompany to detect company changes
  const [previousCompanyId, setPreviousCompanyId] = useState<string | null>(null);
  const [previousCurrentCompany, setPreviousCurrentCompany] = useState<string | null>(null);

  // Store last selected company in localStorage for company-to-product switching
  useEffect(() => {
    if (currentCompany) {
      localStorage.setItem("lastSelectedCompany", currentCompany);
      // console.log("[AppLayout] Stored last selected company:", currentCompany);
    }
  }, [currentCompany]);

  // CRITICAL: Clear selectedProduct AND localStorage when company changes
  useEffect(() => {
    const companyChangedById = companyId && previousCompanyId && companyId !== previousCompanyId;
    const companyChangedByName = currentCompany && previousCurrentCompany && currentCompany !== previousCurrentCompany;

    if (companyChangedById || companyChangedByName) {
      // console.log("[AppLayout] Company changed, clearing selected product and localStorage:", {
      //   oldCompanyId: previousCompanyId,
      //   newCompanyId: companyId,
      //   oldCompanyName: previousCurrentCompany,
      //   newCompanyName: currentCompany,
      // });
      setSelectedProduct(null);
      setHasRestoredProduct(false); // Reset restoration flag

      // CRITICAL: Clear stored product from localStorage to prevent wrong company's product from being restored
      // Note: We clear the OLD company's keys, but the new company's keys will be different anyway
      // This is just for cleanup of old data
      if (user?.id && previousCompanyId) {
        const oldProductKey = `lastSelectedProduct_${user.id}_${previousCompanyId}`;
        const oldRouteKey = `lastSelectedProductRoute_${user.id}_${previousCompanyId}`;
        localStorage.removeItem(oldProductKey);
        localStorage.removeItem(oldRouteKey);
        // console.log("[AppLayout] Cleared stored product data for user:", user.id, "old company:", previousCompanyId);
      }
    }

    if (companyId) {
      setPreviousCompanyId(companyId);
    }
    if (currentCompany) {
      setPreviousCurrentCompany(currentCompany);
    }
  }, [companyId, previousCompanyId, currentCompany, previousCurrentCompany, user?.id]);

  // Get effective user role from user_company_access
  const { effectiveRole } = useEffectiveUserRole();
  // Auto-detect active module based on current route (only when route changes)
  useEffect(() => {
    const detectedModule = getCurrentModuleFromRoute(location.pathname);

    // Set the detected module directly - module access control is handled by L2ContextualBar filtering
    if (detectedModule && detectedModule !== activeModule) {
      setActiveModule(detectedModule);
    }
  }, [location.pathname]); // Removed effectiveRole dependency

  // Store last product and route when navigating away from products module
  useEffect(() => {
    // If we're leaving the products module (or have a product selected but switching modules)
    if (activeModule !== "products" && selectedProduct && user?.id) {
      const currentPath = location.pathname + location.search;
      // Only store if we're actually on a product route
      if (location.pathname.includes("/product/")) {
        const productKey = getLastSelectedProductKey();
        const routeKey = getLastSelectedProductRouteKey();
        // localStorage.setItem(productKey, selectedProduct);
        // localStorage.setItem(routeKey, currentPath);
        // console.log("[AppLayout] Stored last product and route:", selectedProduct, currentPath, "for user:", user?.id);
      }
    }
  }, [activeModule, selectedProduct, location.pathname, location.search, user?.id]);

  // Reset restoration flag when leaving products module
  useEffect(() => {
    if (activeModule !== "products") {
      setHasRestoredProduct(false);
    }
  }, [activeModule]);

  // Restore last product and route when returning to products module
  useEffect(() => {
    // Only restore when switching TO products module and we don't already have a selected product
    // and haven't already restored in this session
    const isCompanyRoute = location.pathname.includes("/company/");
    const isProductRoute = location.pathname.includes("/product/");

    if (
      activeModule === "products" &&
      !selectedProduct &&
      !currentProductId &&
      !hasRestoredProduct &&
      user?.id &&
      !isCompanyRoute
    ) {
      const productKey = getLastSelectedProductKey();
      const routeKey = getLastSelectedProductRouteKey();
      const lastProduct = localStorage.getItem(productKey);
      const lastRoute = localStorage.getItem(routeKey);

      if (lastProduct && lastRoute && lastRoute.includes("/product/")) {
        // console.log("[AppLayout] Restoring last product and route:", lastProduct, lastRoute, "for user:", user.id);
        setHasRestoredProduct(true);
        setSelectedProduct(lastProduct);
        // Navigate to the stored route
        navigate(lastRoute);
      } else if (lastProduct && !lastRoute) {
        setHasRestoredProduct(true);
        setSelectedProduct(lastProduct);
        navigate(`/app/product/${lastProduct}`);
      }
    }
  }, [activeModule, selectedProduct, currentProductId, hasRestoredProduct, navigate, user?.id, location.pathname]);

  // Store company route when navigating within company pages (portfolio module)
  // This ensures the route is saved when navigating between company menus
  useEffect(() => {
    if (activeModule === "portfolio" && location.pathname.includes("/company/") && user?.id) {
      const currentPath = location.pathname + location.search;
      const routeKey = getLastSelectedCompanyRouteKey();
      localStorage.setItem(routeKey, currentPath);
      // console.log("[AppLayout] Stored company route:", currentPath, "for user:", user?.id);
    }
  }, [activeModule, location.pathname, location.search, user?.id]);

  // Sync selectedProduct with currentProductId when on a product page
  // CRITICAL SECURITY: Only set selectedProduct if it belongs to current company
  // This ensures the product-specific menu is shown on page refresh, but ONLY for valid products
  useEffect(() => {
    if (activeModule === "products" && currentProductId) {
      // Only validate if we have product owner company data loaded
      if (productOwnerCompany) {
        // If we have a current company in URL (e.g., /app/company/{name}/product/{id})
        // then validate that the product belongs to that company
        if (currentCompany) {
          const productBelongsToCurrentCompany = productOwnerCompany.toLowerCase() === currentCompany.toLowerCase();

          if (productBelongsToCurrentCompany) {
            // console.log("[AppLayout] Setting selectedProduct - product belongs to current company:", {
            //   currentProductId,
            //   currentCompany,
            //   productOwnerCompany,
            // });
            setSelectedProduct(currentProductId);
          } else {
            // ONLY redirect if we've confirmed the product belongs to a different company
            console.error("[SECURITY BREACH PREVENTED] Product belongs to different company:", {
              currentProductId,
              currentCompany,
              companyId,
              productOwnerCompany,
              location: location.pathname,
            });
            setSelectedProduct(null);
            // Redirect to the correct company page for this product
            navigate(`/app/company/${encodeURIComponent(productOwnerCompany)}`);
          }
        } else {
          // No currentCompany in URL (e.g., /app/product/{id} direct link)
          // This is valid - user navigated directly to product page
          // Set selectedProduct without validation
          // console.log("[AppLayout] Setting selectedProduct - no company context in URL (direct product navigation):", {
          //   currentProductId,
          //   productOwnerCompany,
          // });
          setSelectedProduct(currentProductId);
        }
      } else {
        // Product owner company not loaded yet - set selected product optimistically
        // It will be validated once productOwnerCompany loads
        // console.log(
        //   "[AppLayout] Setting selectedProduct optimistically (company validation pending):",
        //   currentProductId,
        // );
        setSelectedProduct(currentProductId);
      }
    }
  }, [activeModule, currentProductId, productOwnerCompany, currentCompany, companyId, location.pathname, navigate]);

  // Notification fetching for AppLayout
  const notificationService = new NotificationService();
  const fetchNotifications = async () => {
    if (!companyId) return;
    try {
      // console.log("🔄 AppLayout: Fetching notifications for company:", companyId);
      const notificationsData = await notificationService.getNotifications(companyId);
      // console.log("📊 AppLayout: Received notifications:", notificationsData);
    } catch (error) {
      console.error("❌ AppLayout: Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    const initializeContextRecovery = async () => {
      if (user && !isLoading) {
        try {
          const recovered = await recoverCompanyContext();
          if (recovered) {
            // console.log("[AppLayout] Context recovery successful on mount");
          }
        } catch (error) {
          console.error("[AppLayout] Context recovery failed on mount:", error);
        }
      }
    };

    const timeoutId = setTimeout(initializeContextRecovery, 1000);
    return () => clearTimeout(timeoutId);
  }, [user, isLoading, recoverCompanyContext]);

  // Company data is now fetched via useCompanyInfo hook with React Query caching

  const { showTour, showContextualHelp, completeTour, skipTour, dismissContextualHelp } = useOnboarding();
  const [helpSidebarOpen, setHelpSidebarOpen] = useState(false);
  const [navSearchOpen, setNavSearchOpen] = useState(false);

  // Keyboard shortcut to open help (? key)
  useHelpKeyboardShortcut(() => setHelpSidebarOpen(true));
  // Keyboard shortcut to open navigation search (Ctrl+J)
  useNavigationSearch(() => setNavSearchOpen(true));
  // If auth is loading, show nothing
  if (isLoading) {
    return null;
  }

  // If no user, redirect to login (handled by AuthGuard)
  if (!user) {
    return null;
  }

  const UserNav = ({ includeCompanyLinks = true }: { includeCompanyLinks?: boolean }) => {
    const { lang } = useTranslation();
    const { planName: primaryPlanName, isLoading: isPlanLoading, isMasterPlanUser } = usePlanMenuAccess();
    const { activeCompanyRole } = useCompanyRole();
    const { effectiveRole } = useEffectiveUserRole();
    const { profile: investorProfile } = useInvestorProfile();

    // Get the current company's plan (from URL), not the primary company's plan
    const currentCompanyId = useCompanyId();
    const [currentCompanyPlanName, setCurrentCompanyPlanName] = React.useState<string | null>(null);
    const [isLoadingCurrentPlan, setIsLoadingCurrentPlan] = React.useState(false);

    // Fetch plan for current company from URL (skip for master plan users — they always get Helix OS)
    React.useEffect(() => {
      if (isMasterPlanUser) {
        setCurrentCompanyPlanName(null);
        return;
      }

      async function fetchCurrentCompanyPlan() {
        if (!currentCompanyId) {
          setCurrentCompanyPlanName(null);
          return;
        }

        setIsLoadingCurrentPlan(true);
        try {
          const { data: companyPlan } = await supabase
            .from('new_pricing_company_plans')
            .select(`
              plan:new_pricing_plans(
                name,
                display_name
              )
            `)
            .eq('company_id', currentCompanyId)
            .in('status', ['active', 'trial'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (companyPlan?.plan) {
            const plan = companyPlan.plan as { name: string; display_name: string | null };
            setCurrentCompanyPlanName(plan.display_name || plan.name);
          } else {
            // Fallback to Genesis for companies without a plan entry
            setCurrentCompanyPlanName('Genesis');
          }
        } catch (err) {
          // If error, fallback to primary plan
          setCurrentCompanyPlanName(null);
        } finally {
          setIsLoadingCurrentPlan(false);
        }
      }

      fetchCurrentCompanyPlan();
    }, [currentCompanyId, isMasterPlanUser]);

    // Master plan users always see "Helix OS", others use per-company plan
    const planName = isMasterPlanUser ? 'Helix OS' : (currentCompanyPlanName || primaryPlanName);
    const isPlanLoadingFinal = isLoadingCurrentPlan || (isPlanLoading && !currentCompanyPlanName);

    // Check if user is an investor (has investor profile)
    const isInvestor = !!investorProfile;

    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={user?.email || ""} />
              <AvatarFallback>
                {user?.user_metadata?.first_name?.[0]?.toUpperCase()}
                {user?.user_metadata?.last_name?.[0]?.toUpperCase() ||
                  (!user?.user_metadata?.first_name && !user?.user_metadata?.last_name
                    ? user?.email?.substring(0, 2).toUpperCase()
                    : "")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.email}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {(() => {
                    // If user is an investor, show "Investor" role
                    if (isInvestor) {
                      return "Investor";
                    }
                    // Get role from user_company_access (activeCompanyRole) first
                    if (activeCompanyRole?.role) {
                      return activeCompanyRole.role === "super_admin" ? "Super Admin" : activeCompanyRole.role;
                    }
                    // Fallback to effectiveRole from useEffectiveUserRole
                    if (effectiveRole) {
                      return effectiveRole === "super_admin" ? "Super Admin" : effectiveRole;
                    }
                    // Final fallback to user_metadata (for super_admin or legacy)
                    const metadataRole = user?.user_metadata?.role;
                    if (metadataRole === "super_admin") return "Super Admin";
                    if (metadataRole) return metadataRole;
                    return "User";
                  })()}
                </p>
                {/* Show current plan badge (not for investors or super admins, and only after loading) */}
                {!isInvestor &&
                  !isPlanLoadingFinal &&
                  planName &&
                  effectiveRole !== "super_admin" &&
                  activeCompanyRole?.role !== "super_admin" && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 h-4 ${
                        planName.toLowerCase() === "genesis"
                          ? "bg-teal-100 text-teal-700 border-teal-200"
                          : planName.toLowerCase() === "core" || planName.toLowerCase() === "helix os"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : planName.toLowerCase() === "enterprise"
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {planName}
                    </Badge>
                  )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {includeCompanyLinks && company && (
            <>
              <DropdownMenuItem onClick={() => navigate(`/app/company/${encodeURIComponent(company.name)}/profile`)}>
                {lang("appLayout.profile")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/app/company/${encodeURIComponent(company.name)}/pricing-new`)}
              >
                {lang("appLayout.plans")}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={signOut}>{lang("appLayout.logOut")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const DevModeIndicator = () => {
    if (!isDevMode) return null;
    return (
      <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-yellow-800">
        DEV MODE
      </Badge>
    );
  };

  // Sidebar handlers
  const handleModuleSelect = (moduleId: string) => {
    // console.log("🔄 L1 Module selected:", moduleId, "Previous:", activeModule);

    // CRITICAL FIX: If we're on /app/clients (client compass), don't use any company context
    // This prevents automatically selecting a company when user hasn't selected one
    const isOnClientsPage = location.pathname === "/app/clients";

    // CRITICAL FIX: Extract company from URL first, then use productOwnerCompany if on product page
    // This ensures we get the correct company even when navigating from a product page
    const urlCompanyMatch = location.pathname.match(/\/app\/company\/([^\/]+)/);
    const urlCompany = urlCompanyMatch ? decodeURIComponent(urlCompanyMatch[1]) : null;

    // Priority: URL company > productOwnerCompany (when on product page) > currentCompany
    // BUT: If on /app/clients, don't use currentCompany fallback - force null
    const targetCompany = isOnClientsPage ? null : urlCompany || productOwnerCompany || currentCompany;

    // console.log("🔍 [DEBUG] Current context:", {
    //   urlCompany,
    //   productOwnerCompany,
    //   currentCompany,
    //   selectedCompanyName, // Only for logging - NOT used for navigation
    //   location: location.pathname,
    //   moduleId,
    //   finalTargetCompany: targetCompany,
    // });

    // Store current module's route before switching away (generic storage for all modules)
    if (activeModule && user?.id && location.pathname.includes("/company/")) {
      const currentPath = location.pathname + location.search;
      const moduleRouteKey = getLastModuleRouteKey(activeModule);
      localStorage.setItem(moduleRouteKey, currentPath);
      // console.log("[AppLayout] Stored module route:", activeModule, currentPath, "for user:", user?.id);
    }

    // Store product and route before switching away from products module (special handling)
    if (activeModule === "products" && selectedProduct && user?.id) {
      const currentPath = location.pathname + location.search;
      if (location.pathname.includes("/product/")) {
        const productKey = getLastSelectedProductKey();
        const routeKey = getLastSelectedProductRouteKey();
        localStorage.setItem(productKey, selectedProduct);
        localStorage.setItem(routeKey, currentPath);
        // console.log(
        //   "[AppLayout] Stored product before module switch:",
        //   selectedProduct,
        //   currentPath,
        //   "for user:",
        //   user?.id,
        // );
      }
    }

    // Store company route before switching away from portfolio module (for backward compat)
    if (activeModule === "portfolio" && user?.id) {
      const currentPath = location.pathname + location.search;
      if (location.pathname.includes("/company/")) {
        const companyRouteKey = getLastSelectedCompanyRouteKey();
        localStorage.setItem(companyRouteKey, currentPath);
        // console.log("[AppLayout] Stored company route before module switch:", currentPath, "for user:", user?.id);
      }
    }

    setActiveModule(moduleId);

    // CRITICAL FIX: Navigate to appropriate page when switching modules
    // When clicking Devices (products module), restore last viewed device and menu if available
    if (moduleId === "products") {
      // Check if there's a stored device and route to restore
      const productKey = getLastSelectedProductKey();
      const routeKey = getLastSelectedProductRouteKey();
      const lastProduct = localStorage.getItem(productKey);
      const lastRoute = localStorage.getItem(routeKey);

      if (lastProduct && lastRoute && lastRoute.includes("/product/")) {
        // Validate device access before navigating
        const validateAndNavigate = async () => {
          if (!user?.id || !companyId) {
            setSelectedProduct(null);
            return;
          }

          // Check if user is owner or admin
          const { data: accessRows } = await supabase
            .from('user_company_access')
            .select('access_level, is_primary, is_invite_user')
            .eq('user_id', user.id)
            .eq('company_id', companyId)
            .limit(1);

          const accessData = accessRows?.[0] || null;
          const isOwner = accessData?.is_primary === true && !accessData?.is_invite_user;
          const isOwnerOrAdmin = isOwner || accessData?.access_level === 'admin';

          if (!isOwnerOrAdmin) {
            const { data: matrixRows } = await supabase
              .from('user_product_matrix')
              .select('product_ids')
              .eq('user_id', user.id)
              .eq('company_id', companyId)
              .eq('is_active', true)
              .limit(1);

            const matrixData = matrixRows?.[0] || null;

            // Only enforce restriction if an active matrix record exists
            if (matrixData) {
              const allowedIds = new Set<string>(matrixData.product_ids || []);

              if (!allowedIds.has(lastProduct)) {
                // No access to stored product — clear and navigate to first accessible one
                localStorage.removeItem(productKey);
                localStorage.removeItem(routeKey);

                if (allowedIds.size > 0) {
                  const firstAllowed = Array.from(allowedIds)[0];
                  setSelectedProduct(firstAllowed);
                  navigate(`/app/product/${firstAllowed}`);
                } else {
                  setSelectedProduct(null);
                  toast.error('You do not have access to any devices');
                }
                return;
              }
            }
            // No active matrix record means unrestricted access — allow navigation
          }

          // Access validated — restore last viewed device
          setSelectedProduct(lastProduct);
          navigate(lastRoute);
        };

        validateAndNavigate();
      } else {
        // No stored state - show all device families
        setSelectedProduct(null);
        // console.log("[AppLayout] L1 Device icon clicked - showing all device families");
      }
    } else if (moduleId === "portfolio") {
      // Check if there's a stored company route to restore
      const companyRouteKey = getLastSelectedCompanyRouteKey();
      const lastCompanyRoute = localStorage.getItem(companyRouteKey);

      // CRITICAL: Only restore the route if it belongs to the SAME company as current context
      // This prevents switching to a different company when clicking L1 Company menu
      const routeMatchesCurrentCompany =
        lastCompanyRoute && targetCompany && lastCompanyRoute.includes(`/company/${encodeURIComponent(targetCompany)}`);

      if (routeMatchesCurrentCompany) {
        // Restore the last visited company menu (same company)
        // console.log("[AppLayout] Restoring last company route (same company):", lastCompanyRoute);
        navigate(lastCompanyRoute);
      } else if (targetCompany) {
        // No stored route OR route is for different company - navigate to current company dashboard
        // console.log("[AppLayout] Navigating to company portfolio (company dashboard):", targetCompany);
        if (lastCompanyRoute && !routeMatchesCurrentCompany) {
          // console.log("[AppLayout] Ignored stored route (different company):", lastCompanyRoute);
        }
        navigate(`/app/company/${encodeURIComponent(targetCompany)}`);
      } else {
        console.warn("[AppLayout] No company context available for portfolio navigation");
        // Fallback to clients page if no company context
        navigate("/app/clients");
      }
      setSelectedProduct(null);
    } else if (moduleId === "mission-control") {
      // CRITICAL FIX: Always navigate to /app/company/{companyName}/mission-control when clicking Mission Control
      // This ensures consistent navigation even when coming from product pages
      if (targetCompany) {
        // console.log("[AppLayout] Navigating to company mission control:", targetCompany);
        navigate(`/app/company/${encodeURIComponent(targetCompany)}/mission-control`);
      } else {
        // console.log("[AppLayout] No company context available, navigating to global mission control");
        // Fallback to global mission control if no company context
        navigate("/app/mission-control");
      }
      setSelectedProduct(null);
    } else if (moduleId === "draft-studio") {
      if (targetCompany) {
        navigate(`/app/company/${encodeURIComponent(targetCompany)}/document-studio`);
      } else {
        navigate("/app/document-studio");
      }
      setSelectedProduct(null);
    } else if (moduleId !== "products") {
      // For other modules (documents, audits, compliance, etc.), try to restore last route
      setSelectedProduct(null);
      
      // Check if there's a stored route for this module
      if (targetCompany && user?.id) {
        const moduleRouteKey = getLastModuleRouteKey(moduleId);
        const lastModuleRoute = localStorage.getItem(moduleRouteKey);
        
        // Only restore if the route is for the same company
        const routeMatchesCurrentCompany = lastModuleRoute && 
          lastModuleRoute.includes(`/company/${encodeURIComponent(targetCompany)}`);
        
        if (routeMatchesCurrentCompany) {
          // Restore the last visited route for this module
          // console.log("[AppLayout] Restoring last module route:", moduleId, lastModuleRoute);
          navigate(lastModuleRoute);
        }
        // If no stored route, don't navigate - let the user's current navigation happen naturally
      }
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
  };

  const handleBackToProducts = () => {
    setSelectedProduct(null);
  };

  // Get translation function for super admin route
  const { lang: superAdminLang } = useTranslation();

  // Show loader while Genesis login redirect is being resolved
  if (genesisLoginPending) {
    return <FullPageLoader />;
  }

  if (isSuperAdminRoute) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex bg-gray-50 w-full">
          <SuperAdminSidebar />
          <div className="flex-1 flex flex-col min-h-0">
            <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-4 py-8 border-b bg-background sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-2xl font-semibold text-teal-700">{superAdminLang("appLayout.superAdmin")}</div>
                  <p className="text-sm text-muted-foreground">{superAdminLang("appLayout.platformConfiguration")}</p>
                </div>
                {isDevMode && <DevModeIndicator />}
              </div>
              <div className="flex items-center gap-4">
                {/* <NotificationDropdown /> */}
                <UserNav includeCompanyLinks={false} />
              </div>
            </header>
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <ThreadSheetProvider>
    <div className="min-h-screen flex w-full bg-gray-50 overflow-x-hidden">
      {/* Product Route Validator - validates product UUIDs */}
      <ProductRouteValidator />
      {/* L1 Primary Module Bar */}
      <L1PrimaryModuleBar
        activeModule={activeModule}
        onModuleSelect={handleModuleSelect}
        config={sidebarConfig}
        currentProductId={currentProductId}
      />

      {/* L2 Contextual Bar */}
      <L2ContextualBar
        activeModule={activeModule}
        selectedProduct={selectedProduct}
        onProductSelect={handleProductSelect}
        onBackToProducts={handleBackToProducts}
        config={sidebarConfig}
        currentCompany={currentCompany}
        currentProductId={currentProductId}
        companyProducts={productsForMenu}
        onCollapseChange={setIsL2Collapsed}
      />

      {/* Main Content Area - dynamic margin based on L2 collapse state */}
      <div
        className={`flex-1 flex flex-col min-h-screen overflow-x-hidden ${isL2Collapsed ? "ml-[104px]" : "ml-[352px]"}`}
      >
        <header
          className={`fixed top-0 right-0 ${isL2Collapsed ? "left-[104px]" : "left-[352px]"} h-16 flex items-center justify-between gap-2 px-4 border-b bg-background z-40 overflow-hidden`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-shrink">
            {/* Company Name or Mission Control */}
            <div className="text-2xl font-semibold text-teal-700 truncate">
              {currentCompany || superAdminLang("appLayout.dashboard")}
            </div>
            {/* Company Role Switcher */}
            <div data-tour="company-selector">{/* <CompanyRoleSwitcher /> */}</div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              {isDevMode && (
                <>
                  <DevModeIndicator />
                  <DevCompanySwitcher />
                </>
              )}
              {/* Google Translate Widget */}
              {/* <GoogleTranslate /> */}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setNavSearchOpen(true)}
                      className="relative hover:bg-muted transition-colors flex items-center gap-2 px-3 py-2"
                      aria-label="Search navigation"
                    >
                      <Search className="h-4 w-4" />
                      <span className="text-sm font-medium hidden lg:inline">Search</span>
                      <kbd className="ml-1 pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {getModifierSymbol()}+J
                      </kbd>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search pages ({getModifierSymbol()}+J)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>


              <Button
                variant="outline"
                size="icon"
                onClick={() => setHelpSidebarOpen(true)}
                className="relative hover:bg-muted transition-colors"
                aria-label="Help & Documentation"
                title="Help & Documentation"
              >
                <BookOpen className="h-4 w-4" />
              </Button>
              <LanguageSwitcher />
              <NotificationBell />
              <UserNav />
            </div>
          </div>
        </header>

        <main
          className="flex flex-1 flex-col gap-4 p-4 pt-20 relative overflow-x-hidden overflow-y-auto"
          data-tour="dashboard-content"
        >
          <Outlet />
          <ImpersonationBanner />
          {/* {!isSuperAdminRoute && <ExpirationWarningBanner />}
          {isSuperAdminRoute ? (
          ) : (
            <SubscriptionGuard>
              <Outlet />
            </SubscriptionGuard>
          )} */}
        </main>
        <RegulatoryDisclaimer />
    </div>

      {/* Floating Contextual Help */}
      {showContextualHelp && (
        <div className="fixed top-20 right-4 z-50 max-w-sm">
          <ContextualHelp onDismiss={dismissContextualHelp} />
        </div>
      )}

      {/* Enhanced Help System Components */}
      <GlobalHelpSidebar open={helpSidebarOpen} onOpenChange={setHelpSidebarOpen} />
      <NavigationSearchDialog open={navSearchOpen} onOpenChange={setNavSearchOpen} />

      {/* <EnhancedOnboardingTour isActive={showTour} onComplete={completeTour} onSkip={skipTour} /> */}

      {/* Genesis Flow Return Button */}
      <ReturnToGenesisButton />
      {/* Floating Step Navigation Bar - shows when returnTo param is present */}
      <FloatingReturnButton />

      {/* Mobile Device Banner - suggests desktop for better experience */}
      <MobileDeviceBanner />
    </div>
    </ThreadSheetProvider>
  );
}
