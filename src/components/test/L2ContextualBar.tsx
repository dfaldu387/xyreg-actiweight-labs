import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, Search, Package, X, Clock, Goal, Network, ChevronDown, Lock, Building, Archive } from 'lucide-react';
import { ModuleConfig, SidebarConfig, MenuItem, createDynamicRoute, getCurrentModuleFromRoute, translateSidebarConfig, DOMAIN_COLOR_CLASSES, DomainColor } from './SidebarConfig';
import { useDeviceModuleAccess } from '@/hooks/useDeviceModuleAccess';

const DOMAIN_LABELS: Record<string, string> = {
  gold: 'Strategy',
  blue: 'Operations',
  teal: 'Design & Risk',
  green: 'Quality',
  purple: 'Clinical & Regulatory',
};

function getDomainTooltip(name: string, domainColor?: DomainColor): string {
  if (!domainColor || !DOMAIN_LABELS[domainColor]) return name;
  return `${DOMAIN_LABELS[domainColor]}: ${name}`;
}
import { AddProductDialog } from '@/components/product/AddProductDialog';
import { DeviceHoverCard } from '@/components/product/DeviceHoverCard';
import { FamilyHoverCard } from '@/components/product/FamilyHoverCard';
import { ClientCompassCompanyList } from './ClientCompassCompanyList';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useAuth } from '@/context/AuthContext';
import { useEffectiveUserRole } from '@/hooks/useEffectiveUserRole';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useUserModuleAccess } from '@/hooks/useUserModuleAccess';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { COMPANY_MODULES } from '@/types/userCompanyModuleAccess';
import { SIDEBAR_TO_MENU_ACCESS_MAP } from '@/constants/menuAccessKeys';
import { Spinner } from '@/components/ui/spinner';
import { isoTooltips } from '@/constants/isoTooltips';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductsByBasicUDI } from '@/hooks/useProductsByBasicUDI';
import { useBasicUDIAliases } from '@/hooks/useBasicUDIAliases';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useAdvancedSettings } from '@/context/AdvancedSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useCustomerFeatureFlags } from '@/hooks/useCustomerFeatureFlag';

const filterByFeatureFlags = (items: MenuItem[], flags: Record<string, boolean> | undefined): MenuItem[] => {
  return items.map(item => {
    // Filter children first
    if (item.children && item.children.length > 0) {
      const filteredChildren = item.children.filter(child => {
        if (!child.featureFlag) return true;
        if (!flags) return true; // Default ON if flags not loaded
        return flags[child.featureFlag] !== false;
      });
      return { ...item, children: filteredChildren };
    }
    // Check the item itself
    if (item.featureFlag) {
      if (!flags) return item; // Default ON
      if (flags[item.featureFlag] === false) return null;
    }
    return item;
  }).filter((item): item is MenuItem => item !== null);
};

interface L2ContextualBarProps {
  activeModule: string | null;
  selectedProduct: string | null;
  onProductSelect: (productId: string) => void;
  onBackToProducts: () => void;
  config: SidebarConfig;
  currentCompany?: string | null;
  currentProductId?: string | null;
  companyProducts?: Array<{ id: string; name: string; }>;
  onCollapseChange?: (isCollapsed: boolean) => void;
  forceOpen?: boolean;
}

export function L2ContextualBar({
  activeModule,
  selectedProduct,
  onProductSelect,
  onBackToProducts,
  config,
  currentCompany,
  currentProductId,
  companyProducts = [],
  onCollapseChange,
  forceOpen
}: L2ContextualBarProps) {
  const location = useLocation();
  const { companyName: urlCompanyName } = useParams<{ companyName: string }>();
  const { lang } = useTranslation();
  const { hasAccess: hasDeviceModuleAccess, isLoading: isDeviceModuleLoading } = useDeviceModuleAccess(currentProductId || null);
  const customerFeatureFlags = useCustomerFeatureFlags();

  // Get company name from URL params or session storage (for product pages)
  const getCompanyNameForUpgrade = (): string => {
    if (urlCompanyName) return urlCompanyName;

    // Fallback to session storage (for product pages)
    try {
      const contextStr = sessionStorage.getItem('xyreg_company_context_v2');
      if (contextStr) {
        const context = JSON.parse(contextStr);
        if (context.companyName) return context.companyName;
      }
    } catch (e) {
      console.error('Error reading company context:', e);
    }
    return '';
  };

  // Keep companyName variable for backward compatibility in the component
  const companyName = urlCompanyName;
  // Persist expanded states per module so they survive L1 switches
  const expandedItemsPerModule = useRef<Record<string, Set<string>>>({});
  const expandedProductsPerModule = useRef<Record<string, Set<string>>>({});

  const getPersistedExpandedItems = (): Set<string> => {
    if (!activeModule) return new Set();
    return expandedItemsPerModule.current[activeModule] || new Set();
  };
  const getPersistedExpandedProducts = (): Set<string> => {
    if (!activeModule) return new Set();
    return expandedProductsPerModule.current[activeModule] || new Set();
  };

  const [expandedItems, setExpandedItemsRaw] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProductsRaw] = useState<Set<string>>(new Set());

  // Wrap setters to also persist to the ref map
  const setExpandedItems: typeof setExpandedItemsRaw = (value) => {
    setExpandedItemsRaw(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (activeModule) expandedItemsPerModule.current[activeModule] = next;
      return next;
    });
  };
  const setExpandedProducts: typeof setExpandedProductsRaw = (value) => {
    setExpandedProductsRaw(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (activeModule) expandedProductsPerModule.current[activeModule] = next;
      return next;
    });
  };

  // Persist the L2 open/collapsed state so it survives L1 module switches
  const wasOpenBeforeSwitch = useRef(false);

  // Restore persisted expanded states when switching L1 modules
  useEffect(() => {
    if (!activeModule) return;
    setExpandedItemsRaw(getPersistedExpandedItems());
    setExpandedProductsRaw(getPersistedExpandedProducts());
    if (wasOpenBeforeSwitch.current) {
      wasOpenBeforeSwitch.current = false; // Consume the flag
      setIsCollapsed(false);
      onCollapseChange?.(false);
    }
  }, [activeModule]);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed, expand on hover

  // Force open L2 when requested (e.g., during guided tour)
  useEffect(() => {
    if (forceOpen) {
      setIsCollapsed(false);
      onCollapseChange?.(false);
    }
  }, [forceOpen]);
  const [isPinned, setIsPinned] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Helper functions for storing/retrieving last selected child for dropdown menus
  const getLastSelectedChildKey = (parentId: string) => 
    `l2_last_child_${parentId}_${companyId || 'global'}`;
  
  const getLastSelectedChild = (parentId: string): string | null => {
    try {
      return localStorage.getItem(getLastSelectedChildKey(parentId));
    } catch {
      return null;
    }
  };
  
  const setLastSelectedChild = (parentId: string, childId: string) => {
    try {
      localStorage.setItem(getLastSelectedChildKey(parentId), childId);
    } catch (e) {
      console.error('Error storing last selected child:', e);
    }
  };

  // UDI Alias editing state
  const [editingUdiAlias, setEditingUdiAlias] = useState<string | null>(null); // basicUdi being edited
  const [aliasInputValue, setAliasInputValue] = useState('');
  const aliasInputRef = useRef<HTMLInputElement>(null);

  // Track last click time for double-click detection (UDI family)
  const lastClickTimeRef = useRef<{ basicUdi: string; time: number } | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  


  // Use the new single source of truth for company context
  const { companyId, refreshContext } = useCurrentCompany();
  const { companyRoles } = useCompanyRole();

  // Refresh company context on mount to keep session alive
  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  // Force-open L2 + Business Case group when requested via URL (e.g. Genesis eye button)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openMenu = params.get('openMenu');
    if (!openMenu) return;

    // Business Case lives under the "strategic-growth" parent in the L2 sidebar config
    if (openMenu === 'business-case' || openMenu === 'strategic-growth') {
      // Use timeout to ensure this runs after any competing state updates
      setTimeout(() => {
        setIsCollapsed(false);
        onCollapseChange?.(false);
        setExpandedItems(prev => {
          const next = new Set(prev);
          next.add('strategic-growth');
          return next;
        });
      }, 50);
    }
  }, [location.search, location.pathname, onCollapseChange]);

  // Auto-expand the matching parent group based on the current product route.
  // Ensures the Device Definition / Design & Risk Controls sections are visibly
  // opened (e.g. during the guided platform tour) when landing on a child tab.
  useEffect(() => {
    const path = location.pathname;
    const parentToExpand = path.includes('/device-information')
      ? 'device-definition'
      : path.includes('/design-risk-controls')
      ? 'design-risk-controls'
      : path.includes('/portfolio-landing')
      ? 'company-products'
      : (path.endsWith('/suppliers') || path.includes('/suppliers/') || path.endsWith('/infrastructure') || path.endsWith('/calibration-schedule'))
      ? 'operations'
      : (path.endsWith('/documents') || path.endsWith('/gap-analysis'))
      ? 'enterprise-compliance'
      : null;
    if (!parentToExpand) return;

    setExpandedItems(prev => {
      if (prev.has(parentToExpand)) return prev;
      const next = new Set(prev);
      next.add(parentToExpand);
      return next;
    });
  }, [location.pathname]);


  // Fetch UDI aliases for the company
  const { getAlias, saveAlias, isSaving } = useBasicUDIAliases(companyId || null);

  // Fetch all variants for all products (grouped by basic_udi_di)
  const { groupedProducts: allVariantsByBasicUDI } = useProductsByBasicUDI(companyId || '', undefined);

  // Fetch basic_udi_di for all company products
  const { data: productsWithBasicUDI } = useQuery({
    queryKey: ['products-basic-udi', companyId, companyProducts.map(p => p.id).join(',')],
    queryFn: async () => {
      if (!companyId || !companyProducts.length) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, basic_udi_di, udi_di, is_master_device, parent_product_id, parent_relationship_type')
        .in('id', companyProducts.map(p => p.id))
        .eq('is_archived', false);
      if (error) {
        console.error('[L2ContextualBar] Error fetching basic_udi_di:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!companyId && companyProducts.length > 0,
  });

  // Create a map of product ID to basic_udi_di
  const productBasicUDIMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!productsWithBasicUDI) return map;
    productsWithBasicUDI.forEach((p: any) => {
      if (p.basic_udi_di) {
        map.set(p.id, p.basic_udi_di);
      }
    });
    return map;
  }, [productsWithBasicUDI]);

  // Create a map of product ID to its variants
  const productVariantsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    if (!allVariantsByBasicUDI || !companyProducts) return map;

    companyProducts.forEach(product => {
      const basicUdi = productBasicUDIMap.get(product.id);
      if (basicUdi) {
        const variants = allVariantsByBasicUDI.get(basicUdi) || [];
        // Filter out the product itself from variants
        const otherVariants = variants.filter((v: any) => v.id !== product.id);
        if (otherVariants.length > 0) {
          map.set(product.id, otherVariants);
        }
      }
    });

    return map;
  }, [allVariantsByBasicUDI, companyProducts, productBasicUDIMap]);

  // Determine primary device for each basic_udi_di group
  // Priority: explicit is_master_device flag > heuristic fallback
  const mainDeviceMap = useMemo(() => {
    const map = new Map<string, string>(); // basic_udi_di -> primary device id
    if (!allVariantsByBasicUDI || !productsWithBasicUDI) return map;

    allVariantsByBasicUDI.forEach((variants, basicUdi) => {
      if (variants.length > 1) {
        // First, check for explicit primary device designation
        const primaryDevice = variants.find((v: any) => v.is_master_device === true);
        if (primaryDevice) {
          map.set(basicUdi, primaryDevice.id);
          return;
        }
        
        // Fallback: heuristic (lowest UDI-DI suffix or first alphabetically)
        const sorted = [...variants].sort((a, b) => {
          if (a.udi_di && b.udi_di) {
            const aSuffix = a.udi_di.replace(/\D/g, '').slice(-6);
            const bSuffix = b.udi_di.replace(/\D/g, '').slice(-6);
            if (aSuffix && bSuffix) {
              return aSuffix.localeCompare(bSuffix);
            }
          }
          return (a.name || '').localeCompare(b.name || '');
        });
        map.set(basicUdi, sorted[0].id);
      }
    });

    return map;
  }, [allVariantsByBasicUDI, productsWithBasicUDI]);

  // Check if product is main device and has variants
  const isMainDevice = (productId: string) => {
    const basicUdi = productBasicUDIMap.get(productId);
    if (!basicUdi) return false;
    const mainDeviceId = mainDeviceMap.get(basicUdi);
    return mainDeviceId === productId;
  };

  const hasVariants = (productId: string) => {
    return productVariantsMap.has(productId) && productVariantsMap.get(productId)!.length > 0;
  };

  const getVariants = (productId: string) => {
    return productVariantsMap.get(productId) || [];
  };
  const selectedProductIsMainDevice = selectedProduct ? isMainDevice(selectedProduct) : false;
  const selectedProductVariants = selectedProduct ? getVariants(selectedProduct) : [];
  // Variant selection menu disabled - always show device menu directly
  const shouldShowVariantSelection = false; // Disabled - always show device menu
  const [showVariantPicker, setShowVariantPicker] = useState(false);

  // Keep variant picker disabled
  useEffect(() => {
    setShowVariantPicker(false);
  }, []);

  // Clear click tracking refs when going back to products list
  // This fixes the issue where clicking a device after "Back to All Devices" doesn't work
  useEffect(() => {
    if (!selectedProduct && activeModule === 'products') {
      // Clear any pending timeouts and click tracking
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastClickTimeRef.current = null;
    }
  }, [selectedProduct, activeModule]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const { user } = useAuth();
  const { effectiveRole, isAdmin } = useEffectiveUserRole();

  // Translate the sidebar config for i18n support
  const translatedConfig = useMemo(() => translateSidebarConfig(config, lang), [config, lang]);
  const { modules, companySettingsModule, userProfileModule, enableCollapse, enableTooltips, enableBadges, customStyles } = translatedConfig;
  const navigate = useNavigate();
  // Get user's module access permissions
  const { hasAccess: hasModuleAccess, isLoading: isLoadingModuleAccess, allowedModuleIds } = useUserModuleAccess();

  // Check if user is an author or editor (restricted access)
  const isAuthorRole = effectiveRole === 'author';
  const isEditorRole = effectiveRole === 'editor';
  const isViewerRole = effectiveRole === 'viewer';

  // Get plan-based menu access permissions
  const { isMenuEnabled: isPlanMenuEnabled, isLoading: isLoadingPlanAccess, planName, menuAccess } = usePlanMenuAccess();

  // Get advanced settings for showing/hiding locked menus
  const { showLockedMenus } = useAdvancedSettings();

  // Track when module access has loaded for the first time
  useEffect(() => {
    if (!isLoadingModuleAccess && allowedModuleIds !== null) {
      setHasLoadedOnce(true);
    }
  }, [isLoadingModuleAccess, allowedModuleIds]);

  // Get product details for launch date
  const productIdToUse = currentProductId || selectedProduct;
  const { data: productDetails } = useProductDetails(productIdToUse || undefined);

  // Fetch product name if not found in companyProducts (for variants)
  const { data: fetchedProduct } = useQuery({
    queryKey: ['product-name', productIdToUse],
    queryFn: async () => {
      if (!productIdToUse) return null;
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('id', productIdToUse)
        .single();
      if (error) {
        console.error('[L2ContextualBar] Error fetching product:', error);
        return null;
      }
      return data;
    },
    enabled: !!productIdToUse && !companyProducts.find(p => p.id === productIdToUse),
  });

  // Helper functions for user-specific localStorage keys
  // CRITICAL: All localStorage keys MUST include both userId AND companyId for data isolation
  // This prevents data leaks when switching between companies
  const getLastSelectedProductKey = () => {
    if (!user?.id || !companyId) return 'lastSelectedProduct';
    return `lastSelectedProduct_${user.id}_${companyId}`;
  };

  const getLastSelectedProductRouteKey = () => {
    if (!user?.id || !companyId) return 'lastSelectedProductRoute';
    return `lastSelectedProductRoute_${user.id}_${companyId}`;
  };

  // Auto-detect active module from current route if not set
  useEffect(() => {
    if (!activeModule) {
      const detectedModule = getCurrentModuleFromRoute(location.pathname);
      if (detectedModule) {
        // This would need to be handled by the parent component
        // For now, we'll just use the detected module for display
      }
    }
  }, [location.pathname, activeModule]);

  // Collapse product trees when switching away from products module
  // Use raw setter to avoid overwriting persisted state for other modules
  // NOTE: Do NOT reset isPinned here — user expects L2 to stay open when switching L1 modules
  useEffect(() => {
    if (activeModule !== 'products') {
      setExpandedProductsRaw(new Set());
    }
  }, [activeModule]);

  // Collapse product trees when L2 sidebar is collapsed (visual only, don't persist)
  useEffect(() => {
    if (isCollapsed) {
      setExpandedProductsRaw(new Set());
    }
  }, [isCollapsed]);

  // Notify parent about current collapsed state.
  // During guided tours (`forceOpen`) we must not report a collapsed sidebar,
  // otherwise the layout shifts as if L2 were closed even while it is forced open.
  useEffect(() => {
    onCollapseChange?.(forceOpen ? false : isCollapsed);
  }, [isCollapsed, forceOpen, onCollapseChange]);

  // Helper functions for recently viewed products
  const getRecentProducts = (): string[] => {
    try {
      const recent = localStorage.getItem('recentProducts');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  };

  const addToRecentProducts = (productId: string) => {
    try {
      const recent = getRecentProducts();
      // Remove if already exists
      const filtered = recent.filter(id => id !== productId);
      // Add to beginning
      filtered.unshift(productId);
      // Keep only last 3
      const limited = filtered.slice(0, 3);
      localStorage.setItem('recentProducts', JSON.stringify(limited));
    } catch (error) {
      console.error('Failed to save recent products:', error);
    }
  };

  // Track recently viewed products when currentProductId changes
  useEffect(() => {
    if (currentProductId && activeModule === 'products') {
      addToRecentProducts(currentProductId);

      // Auto-expand family group if viewing a family member
      const productInfo = productsWithBasicUDI?.find((p: any) => p.id === currentProductId);
      if (productInfo) {
        const primaryId = productInfo.is_master_device ? productInfo.id : productInfo.parent_product_id;
        if (primaryId) {
          setExpandedProductsRaw(prev => new Set(prev).add(primaryId));
        }
      }
    }
  }, [currentProductId, activeModule, productsWithBasicUDI]);

  // Auto-select product when company has only one device
  useEffect(() => {
    if (
      activeModule === 'products' &&
      !selectedProduct &&
      !currentProductId &&
      companyProducts.length === 1
    ) {
      const singleProduct = companyProducts[0];
      onProductSelect(singleProduct.id);
      addToRecentProducts(singleProduct.id);
      navigate(`/app/product/${singleProduct.id}`);
    }
  }, [activeModule, selectedProduct, currentProductId, companyProducts, onProductSelect, navigate]);

  // Auto-expand device family when on device-family route
  // Collapse when navigating away
  useEffect(() => {
    const isDeviceFamilyRoute = location.pathname.includes('/device-family/');
    const isProductRoute = location.pathname.includes('/product/') && !isDeviceFamilyRoute;

    if (isDeviceFamilyRoute) {
      const match = location.pathname.match(/\/device-family\/([^/]+)/);
      if (match) {
        const masterIdFromUrl = match[1];
        setExpandedProductsRaw(new Set([masterIdFromUrl]));
      }
    } else if (isProductRoute && currentProductId) {
      // If viewing a variant, expand the master's family
      const productInfo = productsWithBasicUDI?.find((p: any) => p.id === currentProductId);
      if (productInfo) {
        const masterId = productInfo.is_master_device ? productInfo.id : productInfo.parent_product_id;
        if (masterId) {
          setExpandedProductsRaw(new Set([masterId]));
        } else {
          setExpandedProductsRaw(new Set());
        }
      } else {
        setExpandedProductsRaw(new Set());
      }
    } else {
      setExpandedProductsRaw(new Set());
    }
  }, [location.pathname, currentProductId, productsWithBasicUDI]);

  // Store current product route when on a product page
  // This ensures the route is saved when navigating between device menus
  // Filter out returnTo parameter to prevent "Genesis mode" from persisting unintentionally
  useEffect(() => {
    if (activeModule === 'products' && currentProductId && location.pathname.includes('/product/') && user?.id) {
      // Remove returnTo parameter before storing to prevent unwanted mode persistence
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete('returnTo');
      const cleanSearch = searchParams.toString();
      const currentPath = location.pathname + (cleanSearch ? `?${cleanSearch}` : '');
      
      const productKey = getLastSelectedProductKey();
      const routeKey = getLastSelectedProductRouteKey();
      localStorage.setItem(productKey, currentProductId);
      localStorage.setItem(routeKey, currentPath);
      // console.log('[L2ContextualBar] Stored product route:', currentProductId, currentPath, 'for user:', user?.id);
    }
  }, [activeModule, currentProductId, location.pathname, location.search, user?.id]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0, parentId?: string, parentDomainColor?: string) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const indentClass = level > 0 ? `ml-${level * 4}` : '';
    const effectiveDomainColor = item.domainColor || (level > 0 ? parentDomainColor : undefined);

    // Check if this is a variant item
    const isVariant = (item as any).isVariant === true;
    const productHasVariants = (item as any).hasVariants === true;
    const isMainDevice = (item as any).isMainDevice === true;
    const productIsExpanded = expandedProducts.has(item.id);
    const variants = (item as any).variants || [];

    // Check if this is a UDI family item
    const isUDIFamily = (item as any).isUDIFamily === true;
    const basicUdi = (item as any).basicUdi as string | undefined;
    const devicesInFamily = (item as any).devicesInFamily as any[] || [];
    const isUDIFamilyExpanded = basicUdi ? expandedProducts.has(basicUdi) : false;

    if (item.hidden) return null;

    // Render separator item
    if ((item as any).isSeparator) {
      return (
        <div key={item.id} className="my-3 mx-3 border-t-2 border-muted-foreground/30" />
      );
    }

    // Render section label item
    if ((item as any).isSectionLabel) {
      return (
        <div key={item.id} className="px-3 pt-1 pb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{item.name}</span>
        </div>
      );
    }

    // Determine active state (change text/icon color only; no active background)
    const isRouteActive = (route?: string): boolean => {
      if (!route) return false;
      // Build dynamic route using current context
      const isProductRoute = route.includes('/product');
      const isCompanyRoute = route.includes('/company');
      const productId = isProductRoute && !isCompanyRoute ? (currentProductId || selectedProduct || undefined) : undefined;
      const companyToUse = currentCompany || undefined;
      const dynamicRoute = createDynamicRoute(route, companyToUse, productId);

      const [routePath, routeQuery] = dynamicRoute.split('?');
      const currentPath = location.pathname;
      const currentQuery = location.search.startsWith('?') ? location.search.slice(1) : location.search;

      // Path must match at least up to the routePath
      if (currentPath !== routePath) {
        // Do not mark siblings active just because they share the prefix
        return false;
      }

      // If the route expects query params, they must match exactly
      if (routeQuery) {
        const expected = new URLSearchParams(routeQuery);
        const current = new URLSearchParams(currentQuery);
        for (const [key, value] of expected.entries()) {
          if ((current.get(key) || '') !== value) {
            return false;
          }
        }
        return true;
      }

      // No expected query - exact path match is enough
      return true;
    };

    // Parent active when its own route matches OR any child route matches.
    // This ensures e.g. "Portfolio Management" (default tab=budget) still
    // highlights when the URL is on a sibling tab like ?tab=portfolio.
    const ownRouteActive = item.route ? isRouteActive(item.route) : false;
    const anyChildActive = item.children ? item.children.some(child => isRouteActive(child.route)) : false;
    const isActive = ownRouteActive || anyChildActive;

    // Check if menu item is disabled by plan's menu_access
    const menuAccessKey = SIDEBAR_TO_MENU_ACCESS_MAP[item.id];

    // Special handling for items with access modes (e.g., market-analysis with .manual and .auto-data)
    let isDisabledByPlan = false;
    if (menuAccessKey) {
      const manualKey = `${menuAccessKey}.manual`;
      const autoDataKey = `${menuAccessKey}.auto-data`;

      // Check if this item has access mode keys in menuAccess
      if (menuAccess && (manualKey in menuAccess || autoDataKey in menuAccess)) {
        // Access mode keys exist - check if at least one is enabled
        const manualEnabled = menuAccess[manualKey] === true;
        const autoDataEnabled = menuAccess[autoDataKey] === true;
        isDisabledByPlan = !(manualEnabled || autoDataEnabled);
      } else {
        // No access mode keys, use standard check
        isDisabledByPlan = !isPlanMenuEnabled(item.id, activeModule || undefined);
      }
    }

    // If showLockedMenus is false and item is disabled by plan, hide it completely
    if (isDisabledByPlan && !isVariant && !showLockedMenus) {
      return null;
    }

    // Render disabled menu item (grayed out with lock icon)
    // For items WITH children, allow expanding to show locked sub-items
    if (isDisabledByPlan && !isVariant && !hasChildren) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <Button
              onClick={() => handleItemClick(item)}
              className={`
                w-full flex items-center justify-between p-3 rounded-lg bg-transparents hover:bg-transparent
                ${indentClass}
              `}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {item.icon && (
                  <div className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-blue-700' : 'text-foreground/60')}>
                    {item.icon}
                  </div>
                )}
                <span className={cn('text-sm font-medium truncate leading-tight', isActive ? 'text-blue-700' : 'text-foreground/60')}>
                  {item.name}
                </span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Lock className="w-4 h-4 text-foreground/60" />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                {planName
                  ? (<span className="p-0 m-0">{lang('sidebar.featureNotAvailable').replace('{{planName}}', planName)} <Button variant="link" className="p-0 m-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/app/company/${encodeURIComponent(getCompanyNameForUpgrade() || '')}/profile?tab=plan`); }}>{lang('sidebar.upgradeToAccess')}</Button></span>)
                  : (<span className="p-0 m-0"><Button variant="link" className="p-0 m-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/app/company/${encodeURIComponent(getCompanyNameForUpgrade() || '')}/profile?tab=plan`); }}>{lang('sidebar.upgradePlan')}</Button> {lang('sidebar.toAccessFeature')}</span>)}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    // Render disabled parent menu item WITH children (expandable to show locked sub-items)
    if (isDisabledByPlan && !isVariant && hasChildren) {
      const isExpanded = expandedItems.has(item.id);
      return (
        <div key={item.id}>
          <Button
            onClick={() => toggleExpanded(item.id)}
            className={`
              w-full flex items-center justify-between p-3 rounded-lg bg-transparent hover:bg-sidebar-accent
              ${indentClass}
            `}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {item.icon && (
                <div className={cn('w-5 h-5 flex-shrink-0', 'text-foreground/60')}>
                  {item.icon}
                </div>
              )}
              <span className={cn('text-sm font-medium truncate leading-tight', 'text-foreground/60')}>
                {item.name}
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <ChevronRight
                className={cn(
                  'w-4 h-4 text-foreground/60 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            </div>
          </Button>
          {isExpanded && item.children && (
            <div className="mt-1 space-y-1">
              {item.children.map(child => renderMenuItem(child, level + 1, item.id, effectiveDomainColor))}
            </div>
          )}
        </div>
      );
    }

    const handleButtonClick = () => {
      // For products with variants, clicking the main button should navigate to the product
      // The chevron button handles expand/collapse separately
      if (productHasVariants) {
        handleItemClick(item, { parentId });
      } else if (hasChildren) {
        toggleExpanded(item.id);
      } else {
        // Call the outer handleItemClick which has the proper logic for different item types
        handleItemClick(item, { parentId });
      }
    };

    // Render variant item
    if (isVariant) {
      return (
        <div key={item.id} className="relative">
          <button
            onClick={() => handleItemClick(item, { parentId })}
            disabled={item.disabled}
            className={`
              w-full flex items-center justify-between p-2 pl-6 rounded-lg transition-colors min-h-[36px]
              hover:${customStyles?.accentColor || 'bg-sidebar-accent'}
              ${indentClass}
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isActive ? 'bg-accent/60' : ''}
            `}
          >
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {item.icon && (
                <div className={`w-3 h-3 ${isActive ? 'text-blue-700' : (customStyles?.textColor || 'text-sidebar-foreground')} flex-shrink-0`}>
                  {item.icon}
                </div>
              )}
              <span className={`text-xs font-medium ${isActive ? 'text-blue-700' : (customStyles?.textColor || 'text-sidebar-foreground')} truncate leading-tight`}>
                {item.name}
              </span>
              {item.upcoming && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded whitespace-nowrap flex-shrink-0">
                  Upcoming
                </span>
              )}
            </div>
          </button>
        </div>
      );
    }

    // Render UDI Family item
    if (isUDIFamily && basicUdi) {
      // Check if this family is active (viewing device-family page or any device in the family)
      const isUDIFamilyActive = (() => {
        // Check if on device-family route matching this master
        if (location.pathname.includes('/device-family/')) {
          const match = location.pathname.match(/\/device-family\/([^/]+)/);
          if (match) {
            const masterIdFromUrl = match[1];
            if (masterIdFromUrl === basicUdi) return true;
            if (devicesInFamily.some((d: any) => d.id === masterIdFromUrl)) return true;
          }
        }
        // Check if viewing any device in this family
        if (currentProductId) {
          return devicesInFamily.some((d: any) => d.id === currentProductId);
        }
        return false;
      })();

      // Get alias for this UDI
      const udiAlias = getAlias(basicUdi);
      const isEditingThisUdi = editingUdiAlias === basicUdi;

      // Check if this UDI family has only one device
      const hasOnlyOneDevice = devicesInFamily.length === 1;
      const singleDevice = hasOnlyOneDevice ? devicesInFamily[0] : null;

      // Display name logic: use master device name, never raw UUID
      const masterName = item.name;
      const displayName = hasOnlyOneDevice && singleDevice
        ? (udiAlias || singleDevice.name || singleDevice.trade_name || masterName)
        : (udiAlias || masterName) + (devicesInFamily.length > 1 ? ` (${devicesInFamily.length})` : '');

      // Handle click on button area - toggle tree or navigate to single device
      const handleButtonClick = (e: React.MouseEvent) => {
        // Don't do anything if editing
        if (isEditingThisUdi) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // If only one device, navigate directly to that device
        if (hasOnlyOneDevice && singleDevice) {
          e.preventDefault();
          e.stopPropagation();
          // CRITICAL FIX: Call onProductSelect to set selectedProduct state
          // This ensures the product menu shows even when navigating to same URL
          onProductSelect(singleDevice.id);
          navigate(`/app/product/${singleDevice.id}`);
          return;
        }

        // Toggle expand/collapse for multiple devices
        e.preventDefault();
        e.stopPropagation();
        setExpandedProducts(prev => {
          const newSet = new Set(prev);
          if (newSet.has(basicUdi)) {
            newSet.delete(basicUdi);
          } else {
            newSet.add(basicUdi);
          }
          return newSet;
        });
      };

      // Handle click on text/name - navigate with double-click detection for editing
      const handleNameClick = (e: React.MouseEvent) => {
        // Don't do anything if editing
        if (isEditingThisUdi) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // If only one device, navigate directly to that device
        if (hasOnlyOneDevice && singleDevice) {
          e.preventDefault();
          e.stopPropagation();
          // CRITICAL FIX: Call onProductSelect to set selectedProduct state
          // This ensures the product menu shows even when navigating to same URL
          onProductSelect(singleDevice.id);
          navigate(`/app/product/${singleDevice.id}`);
          return;
        }

        const now = Date.now();
        const lastClick = lastClickTimeRef.current;

        // Check if this is a double-click (within 300ms and same basicUdi)
        if (lastClick && lastClick.basicUdi === basicUdi && (now - lastClick.time) < 300) {
          // Clear any pending single-click navigation
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
          }

          // This is a double-click - edit alias
          e.preventDefault();
          e.stopPropagation();
          // console.log('[L2ContextualBar] Double-click detected, editing alias:', basicUdi);
          setEditingUdiAlias(basicUdi);
          // Show current alias if exists, otherwise show basic UDI so user can edit it
          setAliasInputValue(udiAlias || masterName);
          lastClickTimeRef.current = null;

          // Focus the input after render
          setTimeout(() => {
            aliasInputRef.current?.focus();
            aliasInputRef.current?.select();
          }, 0);
        } else {
          // This might be a single-click - wait to see if another click comes
          lastClickTimeRef.current = { basicUdi, time: now };

          // Clear any existing timeout
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
          }

          // Set a timeout to navigate after 300ms if no second click
          clickTimeoutRef.current = setTimeout(() => {
            // Single click confirmed - navigate to device family page
            // basicUdi is now the masterId directly
            if (companyId) {
              const routeKey = getLastSelectedProductRouteKey();
              const productKey = getLastSelectedProductKey();
              localStorage.removeItem(routeKey);
              localStorage.removeItem(productKey);
            }
            navigate(`/app/device-family/${basicUdi}`);
            lastClickTimeRef.current = null;
            clickTimeoutRef.current = null;
          }, 300);
        }
      };

      // Handle saving alias
      const handleSaveAlias = () => {
        if (aliasInputValue.trim()) {
          saveAlias({ basicUdiDi: basicUdi, alias: aliasInputValue.trim() });
        }
        setEditingUdiAlias(null);
        setAliasInputValue('');
      };

      // Handle cancel editing
      const handleCancelEdit = () => {
        setEditingUdiAlias(null);
        setAliasInputValue('');
      };

      return (
        <div key={item.id}>
          <FamilyHoverCard basicUdiDi={basicUdi} companyId={companyId || ''} devices={devicesInFamily}>
          <button
            onClick={handleButtonClick}
            disabled={item.disabled}
            className={`
              w-full flex items-center justify-between p-3 rounded-lg transition-colors min-h-[44px]
              hover:${customStyles?.accentColor || 'bg-sidebar-accent'}
              ${indentClass}
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isUDIFamilyActive ? 'bg-blue-50' : ''}
            `}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {item.icon && (
                <div
                  className={`w-5 h-5 ${isUDIFamilyActive ? 'text-blue-700' : (customStyles?.textColor || 'text-sidebar-foreground')} flex-shrink-0`}
                >
                  {item.icon}
                </div>
              )}
              {isEditingThisUdi ? (
                <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={aliasInputRef}
                    type="text"
                    value={aliasInputValue}
                    onChange={(e) => setAliasInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveAlias();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    onBlur={handleSaveAlias}
                    className="flex-1 px-2 py-1 text-sm border rounded bg-white text-foreground min-w-0"
                    disabled={isSaving}
                  />
                </div>
              ) : (
                <span
                  className={`text-sm font-medium ${isUDIFamilyActive ? 'text-blue-700' : (customStyles?.textColor || 'text-sidebar-foreground')} truncate leading-tight cursor-pointer`}
                  onClick={handleNameClick}
                  
                >
                  {displayName}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Only show chevron if there are multiple devices */}
              {devicesInFamily.length > 1 && !isEditingThisUdi && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpandedProducts(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(basicUdi)) {
                        newSet.delete(basicUdi);
                      } else {
                        newSet.add(basicUdi);
                      }
                      return newSet;
                    });
                  }}
                  className="p-1 hover:bg-muted/50 rounded"
                >
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isUDIFamilyExpanded ? 'rotate-90' : ''}`}
                  />
                </button>
              )}
            </div>
          </button>
          </FamilyHoverCard>
          {/* Expanded device list - only show if more than one device */}
          {isUDIFamilyExpanded && devicesInFamily.length > 1 && (
            <div className="ml-6 mt-1 space-y-1">
              {[...devicesInFamily]
                .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
                .map((device: any) => {
                const isDeviceActive = currentProductId === device.id;
                const isVariant = device.parent_product_id && device.parent_relationship_type === 'variant';
                return (
                  <DeviceHoverCard key={device.id} productId={device.id}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onProductSelect(device.id);
                        navigate(`/app/product/${device.id}`);
                      }}
                      style={undefined}
                      className={`
                        w-full flex items-start justify-start space-x-2 p-2 rounded-lg transition-colors text-left
                        hover:${customStyles?.accentColor || 'bg-sidebar-accent'}
                        ${isDeviceActive ? 'bg-blue-50' : ''}
                      `}
                    >
                      <Package className={`w-4 h-4 ${isDeviceActive ? 'text-blue-700' : 'text-muted-foreground'} flex-shrink-0 mt-0.5`} />
                      <span className={`text-sm ${isDeviceActive ? 'text-blue-700 font-medium' : (customStyles?.textColor || 'text-sidebar-foreground')} truncate`}>
                        {device.name || device.trade_name || 'Unnamed Device'}
                      </span>
                    </button>
                  </DeviceHoverCard>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const domainColors = effectiveDomainColor && DOMAIN_COLOR_CLASSES[effectiveDomainColor];
    const isActiveDropdownParent = isActive && hasChildren;
    const isActiveChildItem = isActive && level > 0;
    const iconColorClass = domainColors
      ? (isActive && !isActiveChildItem ? domainColors.textSolid : isActiveChildItem ? domainColors.icon : domainColors.icon)
      : (isActive && !isActiveChildItem ? 'text-white' : (customStyles?.textColor || 'text-sidebar-foreground'));

    // Tour-only emphasis: highlight the exact L2 item the guided tour is
    // currently referring to, including single-link items like Dashboard and
    // Mission Control plus expandable parent groups.
    const isCompanyRootRoute = /^\/app\/company\/[^/]+$/.test(location.pathname);
    const isTourTargetItem =
      !!forceOpen &&
      level === 0 &&
      ((item.id === 'company-dashboard' && isCompanyRootRoute) ||
        (item.id === 'mission-control-main' && location.pathname.includes('/mission-control')) ||
        (item.id === 'device-definition' && location.pathname.includes('/device-information')) ||
        (item.id === 'design-risk-controls' && location.pathname.includes('/design-risk-controls')) ||
        (item.id === 'company-products' && location.pathname.includes('/portfolio-landing')) ||
        (item.id === 'operations' && (location.pathname.endsWith('/suppliers') || location.pathname.includes('/suppliers/') || location.pathname.endsWith('/infrastructure') || location.pathname.endsWith('/calibration-schedule'))) ||
        (item.id === 'enterprise-compliance' && (location.pathname.endsWith('/documents') || location.pathname.endsWith('/gap-analysis'))));

    const button = (
      <div className={`relative ${domainColors && level === 0 ? `border-l-[4px] ${domainColors.border} rounded-none` : ''}`}>
        <button
          onClick={handleButtonClick}
          disabled={item.disabled}
          className={`
            w-full flex items-center justify-between p-3 rounded-lg transition-colors min-h-[44px]
            ${isActive ? '' : `hover:${customStyles?.accentColor || 'bg-sidebar-accent'}`}
            ${indentClass}
            ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isActiveChildItem && domainColors ? `ring-2 ring-inset ${domainColors.ring} ${domainColors.bg}` : isActive && domainColors ? domainColors.bgSolid + ' shadow-sm' : isActive ? 'bg-blue-500 shadow-sm' : ''}
            ${isTourTargetItem ? 'ring-2 ring-amber-500/70 shadow-[0_0_0_4px_hsl(var(--background)),0_0_0_6px_rgba(245,158,11,0.35)] animate-pulse' : ''}
          `}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {item.icon && (
              <div className={`w-5 h-5 ${iconColorClass} flex-shrink-0`}>
                {item.icon}
              </div>
            )}
            <span className={`text-sm font-medium ${isActiveChildItem && domainColors ? domainColors.icon : isActive && domainColors ? domainColors.textSolid : isActive ? 'text-white' : (customStyles?.textColor || 'text-sidebar-foreground')} truncate leading-tight`}>
              {item.name}
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {item.badge && enableBadges && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                {item.badge}
              </span>
            )}
            {(hasChildren || productHasVariants) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (productHasVariants) {
                    setExpandedProducts(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(item.id)) {
                        newSet.delete(item.id);
                      } else {
                        newSet.add(item.id);
                      }
                      return newSet;
                    });
                  } else if (hasChildren) {
                    toggleExpanded(item.id);
                  }
                }}
                className="p-1 hover:bg-muted/50 rounded"
              >
                <ChevronRight
                  className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${(isExpanded || productIsExpanded) ? 'rotate-90' : ''}`}
                />
              </button>
            )}
          </div>
        </button>
      </div>
    );

    if (enableTooltips) {
      return (
        <div key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="max-w-xs p-3">
              <div className="space-y-1.5">
                <div className="font-semibold">{getDomainTooltip(item.name, item.domainColor)}</div>
                {isoTooltips[item.name] && (
                  <>
                    <p className="text-xs text-muted-foreground">{isoTooltips[item.name].role}</p>
                    {isoTooltips[item.name].reference && (
                      <p className="text-xs font-medium text-primary/80">{isoTooltips[item.name].reference}</p>
                    )}
                  </>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          {hasChildren && isExpanded && (
            <div className="ml-4 space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1, item.id, effectiveDomainColor))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.id}>
        {button}
        {hasChildren && isExpanded && (
          <div className="ml-4 space-y-1">
            {item.children?.map(child => renderMenuItem(child, level + 1, item.id, effectiveDomainColor))}
          </div>
        )}
      </div>
    );
  };

  // Map menu item IDs to COMPANY_MODULES for access control
  const getModuleIdForMenuItem = (menuItemId: string): string | null => {
    const mapping: Record<string, string> = {
      'company-dashboard': COMPANY_MODULES.DASHBOARD,
      'company-products': COMPANY_MODULES.DEVICE_PORTFOLIO,
      'company-milestones': COMPANY_MODULES.MILESTONES,
      'enterprise-compliance': COMPANY_MODULES.COMPLIANCE_INSTANCES,
      'compliance-instances': COMPANY_MODULES.COMPLIANCE_INSTANCES,
      'operations': COMPANY_MODULES.OPERATIONS,
      'commercial': COMPANY_MODULES.COMMERCIAL,
      'company-pms': COMPANY_MODULES.POST_MARKET_SURVEILLANCE,
      'quality-governance': COMPANY_MODULES.QUALITY_GOVERNANCE,
      'company-hr': COMPANY_MODULES.HUMAN_RESOURCES,
      'human-resources': COMPANY_MODULES.HUMAN_RESOURCES,
      'audit-log': COMPANY_MODULES.AUDIT_LOG,
    };
    return mapping[menuItemId] || null;
  };

  const getCurrentModule = (): ModuleConfig | null => {
    if (!activeModule) return null;

    const allModules = [...modules, companySettingsModule, userProfileModule];
    return allModules.find(module => module.id === activeModule) || null;
  };

  const getMenuItems = (): MenuItem[] => {
    const currentModule = getCurrentModule();
    if (!currentModule) return [];

    // Viewers can only see the Review Panel - no other company menus
    if (isViewerRole && currentModule.id !== 'review') {
      return [];
    }

    if (showVariantPicker && shouldShowVariantSelection) {
      const items: MenuItem[] = [
        {
          id: 'variant-selection-label',
          name: lang('sidebar.selectDeviceVariant'),
          icon: <Goal className="w-5 h-5" />,
          disabled: true,
        },
        {
          id: 'variant-selection-close',
          name: lang('sidebar.backToDeviceMenu'),
          icon: <ChevronLeft className="w-5 h-5" />,
        },
      ];

      selectedProductVariants.forEach((variant) => {
        const variantSuffix = variant.udi_di ? ` (${String(variant.udi_di).slice(-6)})` : '';
        items.push({
          id: `variant-${variant.id}`,
          name: `${variant.trade_name || variant.name || 'Variant'}${variantSuffix}`,
          icon: <div className="w-2 h-2 rounded-full border-2 border-gray-400 bg-white" />,
          isVariant: true,
          isProductListItem: true,
          productId: variant.id,
        } as MenuItem & { isVariant?: boolean; isProductListItem?: boolean; productId?: string });
      });

      return items;
    }

    const items: MenuItem[] = [];

    // Add special buttons based on module configuration
    if (currentModule.showBackButton && selectedProduct) {
      items.push({
        id: 'back-to-products',
        name: currentModule.backButtonText || 'Back to all devices',
        icon: <ArrowLeft className="w-5 h-5" />,
        onClick: onBackToProducts
      });
      items.push({
        id: 'separator',
        name: '---',
        icon: undefined,
        hidden: true
      });
    }

    // Check if we're on a family route (used in multiple places)
    const isProductFamilyRoute = location.pathname.includes('/product-family/') || location.pathname.includes('/device-family/');

    // Only show Add and Search buttons when no product is selected in products module
    // Authors and editors cannot add devices - they only have restricted access
    // Also show on product-family route
    if (currentModule.showAddButton && !(activeModule === 'products' && selectedProduct && !isProductFamilyRoute) && !isAuthorRole && !isEditorRole) {
      const addButtonText = activeModule === 'products'
        ? (currentModule.addButtonText || 'Add Device')
        : (currentModule.addButtonText || 'Add Item');
      items.push({
        id: 'add-item',
        name: addButtonText,
        icon: <Plus className="w-5 h-5" />
      });
    }

    // Only show search if there are products to search (for products module)
    // Also show on product-family route
    const shouldShowSearch = currentModule.showSearchButton &&
      !(activeModule === 'products' && selectedProduct && !isProductFamilyRoute) &&
      !(activeModule === 'products' && companyProducts.length === 0);

    if (shouldShowSearch) {
      items.push({
        id: 'search-items',
        name: currentModule.searchButtonText || 'Search Items...',
        icon: <Search className="w-5 h-5" />
      });
    }

    // Add separator if we have special buttons
    if (items.length > 0) {
      items.push({
        id: 'separator-2',
        name: '---',
        icon: undefined,
        hidden: true
      });
    }

    // For genesis module, show device list so users can select a device to open Genesis for
    if (currentModule.id === 'genesis') {
      // Filter devices based on search query
      let filteredProducts = companyProducts;
      if (showSearchBar && searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = companyProducts.filter(product =>
          product.name.toLowerCase().includes(query)
        );
      }

      if (filteredProducts.length === 0) {
        items.push({
          id: showSearchBar && searchQuery ? 'no-search-results' : 'no-products-message',
          name: showSearchBar && searchQuery ? lang('sidebar.noSearchResults') : lang('sidebar.noDeviceFound'),
          icon: showSearchBar && searchQuery ? <Search className="w-5 h-5" /> : <Package className="w-5 h-5" />,
          disabled: true
        });
      } else {
        // Show filtered company devices for Genesis
        filteredProducts.forEach(product => {
          items.push({
            id: `genesis-device-${product.id}`,
            name: product.name,
            icon: <Package className="w-5 h-5" />,
            route: `/app/product/${product.id}/business-case?tab=genesis`,
            isProductListItem: true,
            productId: product.id
          } as MenuItem & { isProductListItem?: boolean; productId?: string });
        });
      }
      return items;
    }

    // Add regular menu items, but for products module, show actual product list grouped by master-variant
    // Also show device list when on device-family route (even if selectedProduct is set)
    const isDeviceFamilyRoute = location.pathname.includes('/device-family/');
    if (currentModule.id === 'products' && (!selectedProduct || isProductFamilyRoute || isDeviceFamilyRoute)) {
      const visibleProducts = companyProducts.filter(product => {
        return !('module_id' in product) || !product.module_id;
      });
      if (visibleProducts.length === 0) {
        items.push({
          id: 'no-products-message',
          name: lang('sidebar.noDeviceFound'),
          icon: <Package className="w-5 h-5" />,
          disabled: true
        });
      } else {
        // Group products by master-variant relationship
        const masterFamilyMap = new Map<string, { masterId: string; masterName: string; devices: any[] }>();
        const standaloneProducts: any[] = [];

        // Build lookup of full device info from allVariantsByBasicUDI
        const allDeviceInfo = new Map<string, any>();
        if (allVariantsByBasicUDI) {
          allVariantsByBasicUDI.forEach((devices) => {
            devices.forEach((d: any) => allDeviceInfo.set(d.id, d));
          });
        }

        // First pass: identify masters
        visibleProducts.forEach(product => {
          const info = productsWithBasicUDI?.find((p: any) => p.id === product.id);
          if (info?.is_master_device) {
            const deviceInfo = allDeviceInfo.get(product.id) || { id: product.id, name: product.name };
            masterFamilyMap.set(product.id, {
              masterId: product.id,
              masterName: product.name,
              devices: [deviceInfo],
            });
          }
        });

        // Second pass: assign variants to masters, collect standalone
        visibleProducts.forEach(product => {
          const info = productsWithBasicUDI?.find((p: any) => p.id === product.id);
          if (info?.is_master_device) return; // Already handled

          const deviceInfo = allDeviceInfo.get(product.id) || { id: product.id, name: product.name };

          if (info?.parent_product_id && info?.parent_relationship_type === 'variant' && masterFamilyMap.has(info.parent_product_id)) {
            masterFamilyMap.get(info.parent_product_id)!.devices.push(deviceInfo);
          } else {
            standaloneProducts.push(product);
          }
        });

        // Also add variants from allVariantsByBasicUDI that are in companyProducts (access-filtered)
        const accessibleProductIds = new Set(companyProducts.map(p => p.id));
        masterFamilyMap.forEach((family) => {
          allDeviceInfo.forEach((device) => {
            if (device.parent_product_id === family.masterId && device.parent_relationship_type === 'variant') {
              if (accessibleProductIds.has(device.id) && !family.devices.find((d: any) => d.id === device.id)) {
                family.devices.push(device);
              }
            }
          });
        });

        // Filter based on search query
        let filteredFamilies = Array.from(masterFamilyMap.values());
        let filteredStandalone = standaloneProducts;

        if (showSearchBar && searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredFamilies = filteredFamilies.filter(family =>
            family.masterName.toLowerCase().includes(query) ||
            family.devices.some((d: any) => (d.name || d.trade_name || '').toLowerCase().includes(query))
          );
          filteredStandalone = standaloneProducts.filter(product =>
            product.name.toLowerCase().includes(query)
          );
        }

        // Check if search returned no results
        if (filteredFamilies.length === 0 && filteredStandalone.length === 0 && showSearchBar && searchQuery) {
          items.push({
            id: 'no-search-results',
            name: lang('sidebar.noSearchResults'),
            icon: <Search className="w-5 h-5" />,
            disabled: true
          });
        } else {
          // Build a lookup of all product IDs to their items for recently viewed section
          const allProductsMap = new Map<string, { name: string; id: string }>();
          filteredFamilies.forEach(family => {
            family.devices.forEach((device: any) => {
              allProductsMap.set(device.id, { name: device.name || device.trade_name || 'Unnamed', id: device.id });
            });
          });
          filteredStandalone.forEach(product => {
            allProductsMap.set(product.id, { name: product.name, id: product.id });
          });

          // Add recently viewed section (top 3) — only when not searching
          if (!searchQuery) {
            const recentIds = getRecentProducts();
            const recentItems = recentIds
              .filter(id => allProductsMap.has(id))
              .slice(0, 3);

            if (recentItems.length > 0) {
              items.push({
                id: 'recent-label',
                name: 'Recent',
                icon: <Clock className="w-4 h-4" />,
                isSectionLabel: true,
              } as any);

              recentItems.forEach(productId => {
                const product = allProductsMap.get(productId)!;
                items.push({
                  id: `recent-${product.id}`,
                  name: product.name,
                  icon: <Package className="w-5 h-5" />,
                  route: `/app/product/${product.id}`,
                  isProductListItem: true,
                  productId: product.id,
                } as MenuItem & { isProductListItem?: boolean; productId?: string });
              });

              items.push({
                id: 'recent-separator',
                name: '',
                icon: undefined,
                isSeparator: true,
              } as any);

              items.push({
                id: 'all-devices-label',
                name: 'All Devices',
                icon: undefined,
                isSectionLabel: true,
              } as any);
            }
          }

          // Sort families alphabetically by master name
          filteredFamilies.sort((a, b) => a.masterName.localeCompare(b.masterName));

          // Add family items
          filteredFamilies.forEach(family => {
            const isExpanded = expandedProducts.has(family.masterId);
            const deviceCount = family.devices.length;
            const hasOnlyOneDevice = deviceCount === 1;
            const singleDevice = hasOnlyOneDevice ? family.devices[0] : null;

            const displayName = hasOnlyOneDevice && singleDevice
              ? (singleDevice.name || family.masterName)
              : family.masterName;

            items.push({
              id: `device-family-${family.masterId}`,
              name: displayName,
              icon: deviceCount > 1
                ? <Network className="w-5 h-5 text-blue-500" />
                : <Package className="w-5 h-5 text-blue-500" />,
              isUDIFamily: true,
              basicUdi: family.masterId,
              devicesInFamily: family.devices,
              isExpanded: isExpanded,
            } as MenuItem & { isUDIFamily?: boolean; basicUdi?: string; devicesInFamily?: any[]; isExpanded?: boolean });
          });

          // Sort standalone products alphabetically
          filteredStandalone.sort((a, b) => a.name.localeCompare(b.name));

          // Add standalone products (no master, no parent)
          filteredStandalone.forEach(product => {
            items.push({
              id: product.id,
              name: product.name,
              icon: <Package className="w-5 h-5" />,
              route: `/app/product/${product.id}`,
              isProductListItem: true,
              productId: product.id
            } as MenuItem & { isProductListItem?: boolean; productId?: string });
          });
        }
      }
    } else {
      // Hide Client Compass when administrating ≤ 1 company
      let filteredMenuItems = (currentModule.id === 'mission-control' && companyRoles && companyRoles.length <= 1)
        ? currentModule.menuItems.filter(mi => mi.id !== 'clients')
        : currentModule.menuItems;

      // Filter out companyAdminOnly items if user is not a company admin
      filteredMenuItems = filteredMenuItems.filter(mi => {
        if (mi.companyAdminOnly && !isAdmin) {
          return false;
        }
        return true;
      });

      // Filter menu items based on company module access (only for portfolio module)
      if (currentModule.id === 'portfolio' && activeModule === 'portfolio') {
        filteredMenuItems = filteredMenuItems.map(item => {
          // First check if the parent item should be shown
          const moduleId = getModuleIdForMenuItem(item.id);

          // If no module ID mapping exists, allow the item (for items not subject to access control)
          if (!moduleId) {
            // Still need to filter children if they exist
            if (item.children && item.children.length > 0) {
              const filteredChildren = item.children.filter(child => {
                const childModuleId = getModuleIdForMenuItem(child.id);
                return !childModuleId || hasModuleAccess(childModuleId);
              });
              return { ...item, children: filteredChildren };
            }
            return item;
          }

          // Check if user has access to this module
          if (!hasModuleAccess(moduleId)) {
            return null; // Filter out this item
          }

          // If has access and has children, filter children too
          if (item.children && item.children.length > 0) {
            const filteredChildren = item.children.filter(child => {
              const childModuleId = getModuleIdForMenuItem(child.id);
              return !childModuleId || hasModuleAccess(childModuleId);
            });
            return { ...item, children: filteredChildren };
          }

          return item;
        }).filter((item): item is MenuItem => item !== null);
      }

      // Filter menu items based on device module access (for product/device context)
      if (activeModule === 'products' && currentProductId) {
        if (!isDeviceModuleLoading) {
          const deviceModuleIdMap: Record<string, string> = {
            'dashboard': 'device-dashboard',
            'strategic-growth': 'business-case',
            'device-definition': 'device-definition',
            'bom': 'bill-of-materials',
            'design-risk-controls': 'design-risk-controls',
            'milestones': 'development-lifecycle',
            'device-operations': 'operations',
            'clinical-trials': 'clinical-trials',
            'quality-governance': 'quality-governance',
            'device-audit-log': 'audit-log',
            'compliance-instances': 'regulatory-submissions',
          };

          filteredMenuItems = filteredMenuItems.filter(item => {
            const permModuleId = deviceModuleIdMap[item.id];
            if (!permModuleId) return true; // Not mapped = always show
            return hasDeviceModuleAccess(permModuleId);
          }).map(item => {
            // Filter children (sub-menus) based on granular permissions
            if (item.children && item.children.length > 0) {
              const parentPermId = deviceModuleIdMap[item.id];
              if (parentPermId) {
                const filteredChildren = item.children.filter(child => {
                  const subPermId = `${parentPermId}.${child.id}`;
                  return hasDeviceModuleAccess(subPermId);
                });
                return { ...item, children: filteredChildren };
              }
            }
            return item;
          });
        }
      }

      // Apply customer feature flag filtering
      filteredMenuItems = filterByFeatureFlags(filteredMenuItems, customerFeatureFlags);

      items.push(...filteredMenuItems);
    }

    return items;
  };

  // Helper function to calculate days ago/remaining from launch date
  // const getDaysAgo = (launchDate: string | Date | null | undefined): string | null => {
  //   if (!launchDate) return null;

  //   const launch = typeof launchDate === 'string' ? new Date(launchDate) : launchDate;
  //   if (isNaN(launch.getTime())) return null;

  //   const now = new Date();
  //   // Reset time to compare dates only
  //   const launchDateOnly = new Date(launch.getFullYear(), launch.getMonth(), launch.getDate());
  //   const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  //   const diffTime = nowDateOnly.getTime() - launchDateOnly.getTime();
  //   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  //   if (diffDays < 0) {
  //     // Future date - show days remaining
  //     const daysRemaining = Math.abs(diffDays);
  //     if (daysRemaining === 1) return '1 day to launch!';
  //     return `${daysRemaining} days to launch!`;
  //   }
  //   if (diffDays === 0) return 'Today';
  //   if (diffDays === 1) return '1 day ago';
  //   return `${diffDays} days ago`;
  // };

  const getHeaderTitle = (): string => {
    const currentModule = getCurrentModule();
    if (!currentModule) return 'Select a Module';

    if (selectedProduct && currentModule.id === 'products') {
      // First, try to find the product name from the companyProducts array
      const product = companyProducts.find(p => p.id === selectedProduct);
      // console.log('[L2ContextualBar] Product from companyProducts:', product);

      if (product) {
        return product.name;
      }

      // If not found in companyProducts (e.g., variant not in filtered list), use fetched product
      if (fetchedProduct) {
        return fetchedProduct.name || "loading...";
      }

      // If productDetails is available, use that
      if (productDetails?.name) {
        return productDetails.name;
      }

      return lang('sidebar.loading');
    }

    // For Portfolio module, show "Company Dashboard" if company is selected, otherwise "Select Company"
    if (currentModule.id === 'portfolio') {
      const isOnClientsPage = location.pathname === '/app/clients';
      if (isOnClientsPage || !currentCompany) {
        return lang('sidebar.selectCompany');
      }
      return lang('sidebar.companyDashboard');
    }

    // For Mission Control, show company name if available, otherwise "Select Company"
    // CRITICAL FIX: Don't show company name if we're on /app/clients (no company selected)
    if (currentModule.id === 'mission-control') {
      // Check if we're on the clients page (no company context)
      const isOnClientsPage = location.pathname === '/app/clients';
      if (isOnClientsPage || !currentCompany) {
        return lang('sidebar.selectCompany');
      }
      return currentCompany;
    }

    return currentModule.headerTitle;
  };

  // Get product launch date and format for display
  // const getProductLaunchInfo = () => {
  //   if (!productIdToUse || activeModule !== 'products') return null;

  //   const launchDate = productDetails?.actual_launch_date || productDetails?.projected_launch_date;
  //   if (!launchDate) return null;

  //   const daysAgo = getDaysAgo(launchDate);
  //   const formattedDate = new Date(launchDate).toLocaleDateString();

  //   // Determine if it's a future date
  //   const launch = typeof launchDate === 'string' ? new Date(launchDate) : launchDate;
  //   const now = new Date();
  //   const launchDateOnly = new Date(launch.getFullYear(), launch.getMonth(), launch.getDate());
  //   const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  //   const diffTime = nowDateOnly.getTime() - launchDateOnly.getTime();
  //   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  //   const isFuture = diffDays < 0;

  //   return {
  //     date: formattedDate,
  //     daysAgo,
  //     isFuture
  //   };
  // };

  const handleItemClick = (item: MenuItem, options?: { fromCollapsedState?: boolean; parentId?: string }) => {
    // console.log('[L2ContextualBar] handleItemClick called:', {
    //   itemId: item.id,
    //   itemRoute: item.route,
    //   hasOnClick: !!item.onClick,
    //   activeModule,
    //   selectedProduct,
    //   currentCompany,
    //   currentProductId
    // });

    // If clicking an item with children from collapsed state, navigate to last selected child
    const hasChildren = item.children && item.children.length > 0;
    if (options?.fromCollapsedState && hasChildren && item.children) {
      const lastChildId = getLastSelectedChild(item.id);
      const targetChild = lastChildId 
        ? item.children.find(c => c.id === lastChildId) 
        : item.children[0];
      
      if (targetChild) {
        // Navigate to the child item instead
        handleItemClick(targetChild, { parentId: item.id });
        return;
      }
    }

    // If this is a child item being clicked, store it as last selected
    if (options?.parentId) {
      setLastSelectedChild(options.parentId, item.id);
    }

    // If item has a custom onClick handler, call it and return
    if (item.onClick) {
      // console.log('[L2ContextualBar] Calling custom onClick handler for item:', item.id);
      item.onClick();
      return;
    }

    // Handle UDI family items (from collapsed state)
    const itemWithUDI = item as MenuItem & { isUDIFamily?: boolean; devicesInFamily?: any[] };
    if (itemWithUDI.isUDIFamily && itemWithUDI.devicesInFamily) {
      const devices = itemWithUDI.devicesInFamily;
      if (devices.length === 1) {
        // Single device family -- navigate directly to the device
        navigate(`/app/product/${devices[0].id}`);
        onProductSelect(devices[0].id);
      } else if (devices.length > 1) {
        // Multi-device family -- expand sidebar to show device list
        setIsCollapsed(false);
        onCollapseChange?.(false);
      }
      return;
    }

    const itemWithMeta = item as MenuItem & { isProductListItem?: boolean; productId?: string };
    const isProductListItem = itemWithMeta.isProductListItem === true;
    const itemProductId = itemWithMeta.productId || item.id;

    const allowProductSelectionFromList =
      activeModule === 'products' && (!selectedProduct || (showVariantPicker && shouldShowVariantSelection));

    if (item.id === 'variant-selection-close') {
      setShowVariantPicker(false);
      return;
    }

    if (item.id === 'back-to-products') {
      // Check if we came from Genesis (tab=genesis in current URL)
      const currentSearchParams = new URLSearchParams(location.search);
      const isFromGenesis = currentSearchParams.get('tab') === 'genesis';

      if (isFromGenesis) {
        // Navigate back to genesis page with company context
        const storedCompany = localStorage.getItem('lastSelectedCompany');
        if (storedCompany) {
          navigate(`/app/company/${encodeURIComponent(storedCompany)}/genesis`);
        } else {
          navigate('/app/genesis');
        }
      } else {
        onBackToProducts();
      }
    } else if (item.id === 'add-item') {
      // Handle Add Product click - open the add product dialog
      if (activeModule === 'products' || activeModule === 'genesis') {
        setShowAddProductDialog(true);
      }
    } else if (item.id === 'search-items') {
      // Handle Search Devices click - toggle search bar
      if (activeModule === 'products' || activeModule === 'genesis') {
        setShowSearchBar(!showSearchBar);
        if (!showSearchBar) {
          // Clear search query when opening
          setSearchQuery('');
        }
      }
    } else if (allowProductSelectionFromList && isProductListItem) {
      // Only treat as product selection if item has NO route (i.e., it's a product from the list, not a menu item)
      // Menu items like "Milestones" have routes and should NOT be treated as product selections
      addToRecentProducts(itemProductId);
      onProductSelect(itemProductId);

      // Clear stored route to ensure we always navigate to base product route
      // This prevents route restoration from navigating to a sub-route
      if (companyId) {
        const routeKey = getLastSelectedProductRouteKey();
        localStorage.removeItem(routeKey);

        // Store only the product ID (not the route) so restoration doesn't interfere
        const productKey = getLastSelectedProductKey();
        localStorage.setItem(productKey, itemProductId);
      }

      // Check if we came from Genesis (tab=genesis in current URL) to maintain Genesis context
      const currentSearchParams = new URLSearchParams(location.search);
      const isFromGenesis = currentSearchParams.get('tab') === 'genesis';

      // Navigate to the product - if from genesis, go to genesis tab
      if (isFromGenesis) {
        navigate(`/app/product/${itemProductId}/business-case?tab=genesis`);
      } else {
        navigate(`/app/product/${itemProductId}`);
      }
    } else if (item.route) {
      // Handle dynamic routes with company and product ID replacement
      // Determine context based on the route type
      const isProductRoute = item.route.includes('/product');
      const isCompanyRoute = item.route.includes('/company');
      const isProductFamilyRoute = item.route.includes('/product-family') || item.route.includes('/device-family');

      // CRITICAL FIX: When coming from company-wide view, don't use stored product ID
      // Check if we're currently on a company route (company-wide view)
      const isCurrentlyOnCompanyRoute = location.pathname.includes('/company/') && !location.pathname.includes('/product/');

      // Only pass product ID if we're actually on a product route
      // Company routes should NEVER include product IDs
      // Product-family routes should NOT use stored product IDs (they show all devices in family)
      let productId = undefined;
      if (isProductRoute && !isCompanyRoute && !isProductFamilyRoute) {
        // Only for pure product routes like /app/product/:id
        // Don't use stored product ID if we're coming from company-wide view
        if (!isCurrentlyOnCompanyRoute) {
          productId = currentProductId || selectedProduct || undefined;
        }
        // If coming from company-wide, productId stays undefined (will navigate to base route or let route handle it)
      }

      // Get company to use for navigation
      // CRITICAL FIX: If we're on /app/clients (client compass), don't use stored company from localStorage
      // This prevents automatically selecting a company when user hasn't selected one
      const isOnClientsPage = location.pathname === '/app/clients';
      let companyToUse = currentCompany;
      if (isCompanyRoute && !currentCompany && !isOnClientsPage) {
        const storedCompany = localStorage.getItem('lastSelectedCompany');
        if (storedCompany) {
          companyToUse = storedCompany;
          // console.log('[L2ContextualBar] Using stored company from localStorage:', storedCompany);
        }
      }

      // For company routes (like Device Portfolio), clear product selection and stored routes
      // BUT only when switching FROM products module, not when navigating within company
      if (isCompanyRoute && activeModule === 'products') {
        // Clear stored product route to prevent restoration interference
        const routeKey = getLastSelectedProductRouteKey();
        localStorage.removeItem(routeKey);
      }

      const dynamicRoute = createDynamicRoute(
        item.route,
        companyToUse || undefined,
        productId
      );

      // console.log('[L2ContextualBar] Navigation:', {
      //   route: item.route,
      //   isProductRoute,
      //   isCompanyRoute,
      //   currentCompany,
      //   companyToUse,
      //   productId,
      //   selectedProduct,
      //   finalRoute: dynamicRoute
      // });

      navigate(dynamicRoute);
    }
  };

  if (!activeModule) {
    return (
      <TooltipProvider>
        <div
          data-tour="main-menu"
          className={`h-screen fixed left-16 top-0 z-10 ${customStyles?.l2Background || 'bg-sidebar-background'} border-r ${customStyles?.borderColor || 'border-sidebar-border'} shadow-xl transition-all duration-300 ${isCollapsed ? 'w-16 cursor-pointer' : 'w-72'}`}
          onClick={() => {
            if (isCollapsed) {
              setIsCollapsed(false);
              onCollapseChange?.(false);
            }
          }}
          onMouseLeave={(e) => {
            if (forceOpen) return;
            if (!isCollapsed) {
              const mouseX = e.clientX;
              if (mouseX < 64) {
                wasOpenBeforeSwitch.current = true;
                setIsCollapsed(true);
                onCollapseChange?.(true);
                return;
              }
              wasOpenBeforeSwitch.current = false;
              setIsCollapsed(true);
              onCollapseChange?.(true);
            }
          }}
        >
          <div className="p-4 text-center text-gray-500 overflow-y-auto h-full">
            {isCollapsed ? (
              <div className="flex flex-col items-center space-y-4">
                {enableCollapse && (
                  <button
                    onClick={() => {
                      setIsCollapsed(false);
                      onCollapseChange?.(false);
                    }}
                    className={`p-2 hover:${customStyles?.accentColor || 'bg-sidebar-accent'} rounded-lg transition-colors`}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>
            ) : (
              <div>
                {enableCollapse && (
                  <div className="flex justify-between items-center mb-4">
                    <p>{lang('sidebar.selectModule')}</p>
                    <button
                      onClick={() => {
                        setIsCollapsed(true);
                        onCollapseChange?.(true);
                      }}
                      className={`p-2 hover:${customStyles?.accentColor || 'bg-sidebar-accent'} rounded-lg transition-colors`}
                    >
                      {/* <ChevronLeft className="w-5 h-5 text-gray-400" /> */}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div
        data-tour="main-menu"
        className={`h-screen fixed left-16 top-0 z-10 ${customStyles?.l2Background || 'bg-sidebar-background'} border-r ${customStyles?.borderColor || 'border-sidebar-border'} shadow-xl transition-all duration-600 ease-in-out overflow-hidden ${isCollapsed ? 'w-11 cursor-pointer' : 'w-72'}`}
        onClick={(e) => {
          if (isCollapsed) {
            // Only expand if clicking the container itself, not a child button/icon
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('a')) return;
            setIsCollapsed(false);
            onCollapseChange?.(false);
          }
        }}
        onMouseLeave={(e) => {
          if (forceOpen) return;
          if (!isCollapsed && !isPinned) {
            // Check if mouse is moving to L1 sidebar (x < 64px) - likely switching modules
            const mouseX = e.clientX;
            if (mouseX < 64) {
              // Track that L2 was open before this potential module switch
              wasOpenBeforeSwitch.current = true;
              setIsCollapsed(true);
              onCollapseChange?.(true);
              return;
            }
            // Moving right (away from sidebar) - normal collapse, don't restore
            wasOpenBeforeSwitch.current = false;
            setIsCollapsed(true);
            onCollapseChange?.(true);
          }
        }}
      >
        <div className={`p-4 h-full ${isCollapsed ? 'overflow-y-auto' : 'overflow-y-auto'} relative`}>
          {/* Loading overlay while device module permissions are resolving */}
          {isDeviceModuleLoading && activeModule === 'products' && currentProductId && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
              <div className="flex flex-col items-center gap-2">
                <Spinner size={isCollapsed ? 'sm' : 'md'} />
                {!isCollapsed && <span className="text-xs text-muted-foreground">Loading modules...</span>}
              </div>
            </div>
          )}
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-2 pt-2">
              {/* Open button for tablet/touch devices - hidden on xl screens and above */}
              <button
                onClick={() => {
                  setIsCollapsed(false);
                  setIsPinned(true);
                  onCollapseChange?.(false);
                }}
                className="p-1.5 hover:bg-sidebar-accent rounded border border-sidebar-border bg-sidebar-background transition-colors mb-2"
                aria-label="Pin sidebar open"
                title="Pin sidebar open"
              >
                <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
              </button>
              {/* Show menu items in collapsed state */}
              <div className="space-y-2 w-full flex flex-col items-center mt-2">
                {location.pathname === '/app/clients' ? (
                  <div className="flex flex-col items-center justify-center py-8 px-2 text-center">
                    <Building className={`w-8 h-8 ${customStyles?.textColor || 'text-sidebar-foreground'} opacity-50 mb-2`} />
                    <p className={`text-xs ${customStyles?.textColor || 'text-sidebar-foreground'} opacity-70`}>
                      {lang('sidebar.selectCompany')}
                    </p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const menuItems = getMenuItems();
                      // In collapsed state, only show top-level items for better UX
                      // Don't show expanded children, variants, or UDI family devices
                      // This keeps the collapsed sidebar compact and prevents excessive scrolling
                      const topLevelItems = menuItems.filter(item => !item.hidden && !(item as any).isSectionLabel && !(item as any).isSeparator);

                      return topLevelItems.map((item) => {
                        if (item.hidden) return null;

                        // Check if menu item is disabled by plan's menu_access
                        const collapsedMenuAccessKey = SIDEBAR_TO_MENU_ACCESS_MAP[item.id];

                        // Special handling for items with access modes (e.g., market-analysis with .manual and .auto-data)
                        let isCollapsedDisabledByPlan = false;
                        if (collapsedMenuAccessKey) {
                          const manualKey = `${collapsedMenuAccessKey}.manual`;
                          const autoDataKey = `${collapsedMenuAccessKey}.auto-data`;

                          // Check if this item has access mode keys in menuAccess
                          if (menuAccess && (manualKey in menuAccess || autoDataKey in menuAccess)) {
                            // Access mode keys exist - check if at least one is enabled
                            const manualEnabled = menuAccess[manualKey] === true;
                            const autoDataEnabled = menuAccess[autoDataKey] === true;
                            isCollapsedDisabledByPlan = !(manualEnabled || autoDataEnabled);
                          } else {
                            // No access mode keys, use standard check
                            isCollapsedDisabledByPlan = !isPlanMenuEnabled(item.id, activeModule || undefined);
                          }
                        }

                        // If showLockedMenus is false and item is disabled by plan, hide it completely
                        if (isCollapsedDisabledByPlan && !showLockedMenus) {
                          return null;
                        }

                        // Render disabled item in collapsed state
                        if (isCollapsedDisabledByPlan) {
                          return (
                            <Tooltip key={item.id} delayDuration={200}>
                              <TooltipTrigger asChild>
                                <div
                                  className="w-9 h-9 flex items-center justify-center rounded-lg cursor-not-allowed select-none bg-slate-50/50 hover:bg-slate-100/50"
                                >
                                  <div className="relative">
                                    {item.icon && (
                                      <div className="w-5 h-5 text-slate-400">
                                        {item.icon}
                                      </div>
                                    )}
                                    <Lock className="w-2.5 h-2.5 text-slate-500 absolute -bottom-0.5 -right-0.5" />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" sideOffset={8} className="max-w-xs">
                                <div className="flex items-start gap-2">
                                  <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="font-semibold text-slate-400">{item.name}</div>
                                    <p className="text-xs mt-1">
                                      {planName
                                        ? lang('sidebar.notAvailableOnPlan').replace('{{planName}}', planName)
                                        : lang('sidebar.upgradeRequired')}{' '}
                                      <Button
                                        variant="link"
                                        className="p-0 m-0 h-auto text-xs text-amber-600 hover:text-amber-700"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/app/company/${encodeURIComponent(getCompanyNameForUpgrade() || '')}/profile?tab=plan`); }}
                                      >
                                        {lang('sidebar.upgradeToAccess')}
                                      </Button>
                                    </p>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        const isActive = (() => {
                          // Check own route
                          if (item.route) {
                            const isProductRoute = item.route.includes('/product');
                            const isCompanyRoute = item.route.includes('/company');
                            const productId = isProductRoute && !isCompanyRoute ? (currentProductId || selectedProduct || undefined) : undefined;
                            const fallbackCompany = currentCompany || (() => {
                              const segments = location.pathname.split('/');
                              const companyIdx = segments.indexOf('company');
                              return companyIdx >= 0 && segments[companyIdx + 1] ? decodeURIComponent(segments[companyIdx + 1]) : undefined;
                            })();
                            const dynamicRoute = createDynamicRoute(item.route, fallbackCompany, productId);
                            const [routePath, routeQuery] = dynamicRoute.split('?');
                            const currentPath = location.pathname;
                            const currentQuery = location.search.startsWith('?') ? location.search.slice(1) : location.search;

                            if (currentPath === routePath) {
                              if (routeQuery) {
                                const expected = new URLSearchParams(routeQuery);
                                const current = new URLSearchParams(currentQuery);
                                let allMatch = true;
                                for (const [key, value] of expected.entries()) {
                                  if ((current.get(key) || '') !== value) { allMatch = false; break; }
                                }
                                if (allMatch) return true;
                              } else {
                                return true;
                              }
                            }
                          }
                          // Check children routes (for dropdown parents like Quality & Governance)
                          if (item.children && item.children.length > 0) {
                            return item.children.some(child => {
                              if (!child.route) return false;
                              const cIsProduct = child.route.includes('/product');
                              const cIsCompany = child.route.includes('/company');
                              const cProductId = cIsProduct && !cIsCompany ? (currentProductId || selectedProduct || undefined) : undefined;
                              const cFallbackCompany = currentCompany || (() => {
                                const segments = location.pathname.split('/');
                                const companyIdx = segments.indexOf('company');
                                return companyIdx >= 0 && segments[companyIdx + 1] ? decodeURIComponent(segments[companyIdx + 1]) : undefined;
                              })();
                              const cDynamic = createDynamicRoute(child.route, cFallbackCompany, cProductId);
                              const [cPath] = cDynamic.split('?');
                              return location.pathname === cPath;
                            });
                          }
                          return false;
                        })();

                        // Check if this is a UDI family item to show device count in tooltip
                        const isUDIFamily = (item as any).isUDIFamily === true;
                        const devicesInFamily = (item as any).devicesInFamily as any[] || [];
                        const deviceCount = devicesInFamily.length;

                        // For UDI family / device items, use FamilyHoverCard to match expanded state
                        if (isUDIFamily && devicesInFamily.length > 0) {
                          const basicUdi = (item as any).basicUdi as string || '';
                          return (
                            <FamilyHoverCard key={item.id} basicUdiDi={basicUdi} companyId={companyId || ''} devices={devicesInFamily}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemClick(item, { fromCollapsedState: true });
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setIsCollapsed(false);
                                  onCollapseChange?.(false);
                                  if (item.children && item.children.length > 0) {
                                    setExpandedItems(prev => {
                                      const next = new Set(prev);
                                      next.add(item.id);
                                      return next;
                                    });
                                  }
                                }}
                                disabled={item.disabled}
                                className={`
                                w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ease-in-out
                                ${isActive ? '' : `hover:${customStyles?.accentColor || 'bg-sidebar-accent'}`}
                                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                ${isActive && item.domainColor && DOMAIN_COLOR_CLASSES[item.domainColor] ? DOMAIN_COLOR_CLASSES[item.domainColor].bgSolid + ' shadow-sm' : isActive ? 'bg-blue-500 shadow-sm' : ''}
                              `}
                              >
                                {item.icon && (() => {
                                  const dc = item.domainColor && DOMAIN_COLOR_CLASSES[item.domainColor];
                                  const cls = dc ? (isActive ? dc.textSolid : dc.icon) : (isActive ? 'text-white' : (customStyles?.textColor || 'text-sidebar-foreground'));
                                  return <div className={`w-5 h-5 ${cls}`}>{item.icon}</div>;
                                })()}
                              </button>
                            </FamilyHoverCard>
                          );
                        }

                        return (
                          <Tooltip key={item.id} delayDuration={200}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemClick(item, { fromCollapsedState: true });
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setIsCollapsed(false);
                                  onCollapseChange?.(false);
                                  if (item.children && item.children.length > 0) {
                                    setExpandedItems(prev => {
                                      const next = new Set(prev);
                                      next.add(item.id);
                                      return next;
                                    });
                                  }
                                }}
                                disabled={item.disabled}
                                className={`
                                w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ease-in-out
                                ${isActive ? '' : `hover:${customStyles?.accentColor || 'bg-sidebar-accent'}`}
                                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                ${isActive && item.domainColor && DOMAIN_COLOR_CLASSES[item.domainColor] ? DOMAIN_COLOR_CLASSES[item.domainColor].bgSolid + ' shadow-sm' : isActive ? 'bg-blue-500 shadow-sm' : ''}
                              `}
                              >
                                {item.icon && (() => {
                                  const dc = item.domainColor && DOMAIN_COLOR_CLASSES[item.domainColor];
                                  const cls = dc ? (isActive ? dc.textSolid : dc.icon) : (isActive ? 'text-white' : (customStyles?.textColor || 'text-sidebar-foreground'));
                                  return <div className={`w-5 h-5 ${cls}`}>{item.icon}</div>;
                                })()}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8} className="max-w-xs p-3">
                              <div className="space-y-1.5">
                                <div className="font-semibold">{getDomainTooltip(item.name, item.domainColor)}</div>
                                {isoTooltips[item.name] && (
                                  <>
                                    <p className="text-xs text-muted-foreground">{isoTooltips[item.name].role}</p>
                                    {isoTooltips[item.name].reference && (
                                      <p className="text-xs font-medium text-primary/80">{isoTooltips[item.name].reference}</p>
                                    )}
                                  </>
                                )}
                                {item.badge && (
                                  <div className="text-xs text-muted-foreground mt-1">{item.badge}</div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      });
                    })()}
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeModule === 'products' && productIdToUse && (
                      <Package className={`w-5 h-5 ${customStyles?.textColor || 'text-sidebar-foreground'} flex-shrink-0`} />
                    )}
                    <h2 className={`text-lg font-semibold ${customStyles?.textColor || 'text-sidebar-foreground'} truncate`}>
                      {getHeaderTitle()}
                    </h2>
                    {/* {activeModule === 'products' && productIdToUse && (() => {
                      const launchInfo = getProductLaunchInfo();
                      if (launchInfo) {
                        return (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                            {launchInfo.isFuture ? (
                              <Goal className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            <span>{launchInfo.date}</span>
                            {launchInfo.daysAgo && (
                              <span className="text-xs">• {launchInfo.daysAgo}</span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()} */}
                  </div>
                </div>
                {/* Close/unpin button */}
                <button
                  onClick={() => {
                    setIsPinned(false);
                    setIsCollapsed(true);
                    onCollapseChange?.(true);
                  }}
                  className="p-1.5 hover:bg-sidebar-accent rounded border border-sidebar-border bg-sidebar-background transition-colors flex-shrink-0 ml-2"
                  aria-label="Close sidebar"
                  title="Close sidebar"
                >
                  <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
                </button>
              </div>

              {/* Search Bar (shown when search is activated) */}
              {showSearchBar && (activeModule === 'products' || activeModule === 'genesis') && (
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={lang('sidebar.searchDevices')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setShowSearchBar(false);
                        setSearchQuery('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                      title={lang('sidebar.closeSearch')}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {/* On /app/clients, show company list with traffic light status */}
                {location.pathname === '/app/clients' ? (
                  <ClientCompassCompanyList companyRoles={companyRoles} isCollapsed={isCollapsed} customStyles={customStyles} />
                ) : !hasLoadedOnce && isLoadingModuleAccess && activeModule === 'portfolio' ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="md" />
                  </div>
                ) : (
                  getMenuItems().map((item) => renderMenuItem(item))
                )}
              </div>
            </>
          )}

        </div>
      </div>

      {/* Add Product Dialog */}
      {companyId && (
        <AddProductDialog
          companyId={companyId}
          open={showAddProductDialog}
          onOpenChange={setShowAddProductDialog}
          onProductAdded={(productId) => {
            // Navigate to the newly created product
            addToRecentProducts(productId);
            onProductSelect(productId);
            navigate(`/app/product/${productId}/device-information`);
          }}
        />
      )}
    </TooltipProvider>
  );
}