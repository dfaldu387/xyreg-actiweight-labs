import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building, Crosshair, Lock, Package } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { defaultSidebarConfig, createDynamicRoute, filterModulesByRole, type MenuItem, type ModuleConfig } from '@/components/test/SidebarConfig';
import { getCompanyFromUrl } from '@/utils/urlCompanyContext';
import { getModifierSymbol } from '@/utils/keyboard';
import { useSimpleClientsFixed } from '@/hooks/useSimpleClientsFixed';
import { CompanyUsageService } from '@/services/companyUsageService';
import { useAuth } from '@/context/AuthContext';
import { useEffectiveUserRole } from '@/hooks/useEffectiveUserRole';

import { useIsInvestor } from '@/hooks/useIsInvestor';
import { useNewPricingPlan } from '@/hooks/useNewPricingPlan';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { useAdvancedSettings } from '@/context/AdvancedSettingsContext';
import { SIDEBAR_TO_MENU_ACCESS_MAP } from '@/constants/menuAccessKeys';
import { CompanyContextService } from '@/services/companyContext';
import { supabase } from '@/integrations/supabase/client';

interface SearchableItem {
  id: string;
  label: string;
  breadcrumb: string;
  route: string;
  icon?: React.ReactNode;
  moduleId: string;
  moduleLabel: string;
  disabled?: boolean;
  lockedByPlan?: boolean;
  lockMessage?: string;
}

interface NavigationSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function flattenMenuItems(
  items: MenuItem[],
  moduleId: string,
  moduleLabel: string,
  parentPath: string[] = [],
  isCompanyAdmin: boolean = false
): SearchableItem[] {
  const result: SearchableItem[] = [];

  for (const item of items) {
    if (item.hidden || item.disabled) continue;
    if (item.companyAdminOnly && !isCompanyAdmin) continue;

    const currentPath = [...parentPath, item.name];

    if (item.children && item.children.length > 0) {
      result.push(
        ...flattenMenuItems(item.children, moduleId, moduleLabel, currentPath, isCompanyAdmin)
      );
    } else if (item.route) {
      result.push({
        id: item.id,
        label: item.name,
        breadcrumb: currentPath.join(' > '),
        route: item.route,
        icon: item.icon,
        moduleId,
        moduleLabel,
      });
    }
  }

  return result;
}

export function NavigationSearchDialog({ open, onOpenChange }: NavigationSearchDialogProps) {
  const navigate = useNavigate();

  const { user } = useAuth();
  const { effectiveRole } = useEffectiveUserRole();
  const { isInvestor } = useIsInvestor();
  const { isGenesis } = useNewPricingPlan();
  const { isMenuEnabled: isPlanMenuEnabled, planName, menuAccess } = usePlanMenuAccess();
  const { showLockedMenus } = useAdvancedSettings();

  const params = useParams();
  const companyNameFromUrl = useMemo(() => (open ? getCompanyFromUrl() : null), [open]);

  // Extract product ID from URL (same as useSidebarData)
  const productId = useMemo(() => {
    const id = params.productId || null;
    if (!id) return null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id) ? id : null;
  }, [params.productId]);

  // Fetch company list (same as Client Compass)
  const { clients = [], isDataLoaded } = useSimpleClientsFixed();

  // Resolve company name: URL company > product owner company > null
  const companyName = useMemo(() => {
    if (companyNameFromUrl) return companyNameFromUrl;
    // If on a product page, find the product's owner company
    if (productId && clients.length) {
      for (const client of clients) {
        if (client.productList?.some(p => p.id === productId)) {
          return client.name;
        }
      }
    }
    return null;
  }, [companyNameFromUrl, productId, clients]);

  // Role-based module filtering (shared logic with L1PrimaryModuleBar)
  const allowedModules = useMemo(() => {
    return filterModulesByRole(defaultSidebarConfig.modules, effectiveRole as string, isInvestor);
  }, [effectiveRole, isInvestor]);

  const [recentCompanyIds, setRecentCompanyIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && isDataLoaded) {
      CompanyUsageService.getRecentCompanyIds(3).then(setRecentCompanyIds);
    }
  }, [open, isDataLoaded]);

  const { recentCompanies, allCompanies } = useMemo(() => {
    const recentIdSet = new Set(recentCompanyIds);

    const recent = clients
      .filter(c => recentIdSet.has(c.id))
      .sort((a, b) => recentCompanyIds.indexOf(a.id) - recentCompanyIds.indexOf(b.id));

    const recentIds = new Set(recent.map(c => c.id));
    const rest = [...clients]
      .filter(c => !recentIds.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { recentCompanies: recent, allCompanies: rest };
  }, [clients, recentCompanyIds]);

  // Fetch user's device access restrictions from user_product_matrix
  const [userProductRestrictions, setUserProductRestrictions] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (!user?.id || !open) return;
    const fetchRestrictions = async () => {
      const { data } = await supabase
        .from('user_product_matrix')
        .select('company_id, product_ids')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (data) {
        const restrictions: Record<string, string[]> = {};
        data.forEach(row => {
          if (row.product_ids && row.product_ids.length > 0) {
            restrictions[row.company_id] = row.product_ids;
          }
        });
        setUserProductRestrictions(restrictions);
      }
    };
    fetchRestrictions();
  }, [user?.id, open]);

  // Flatten all devices from all clients, filtered by user's device access restrictions
  // Family members (same basic_udi_di or parent_product_id) of allowed devices are also included
  const devices = useMemo(() => {
    return clients.flatMap(client => {
      const restrictedIds = userProductRestrictions[client.id];
      if (!restrictedIds) return client.productList.map(product => ({
        id: product.id,
        name: product.name,
        companyId: client.id,
        companyName: client.name,
      }));

      const allowedSet = new Set(restrictedIds);
      const products = client.productList.filter((product: any) => allowedSet.has(product.id));
      return products.map(product => ({
        id: product.id,
        name: product.name,
        companyId: client.id,
        companyName: client.name,
      }));
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, userProductRestrictions]);

  const searchableItems = useMemo(() => {
    const allowedModuleIds = new Set(allowedModules.map(m => m.id));
    const role = effectiveRole as string;
    const items: SearchableItem[] = [];

    // Collect role-filtered modules (excluding company settings which is added separately below)
    const modulesToSearch: ModuleConfig[] = [];
    for (const mod of defaultSidebarConfig.modules) {
      if (allowedModuleIds.has(mod.id)) modulesToSearch.push(mod);
    }

    const isSingleCompanyMode = clients.length <= 1;
    const isCompanyAdmin = role === 'admin' || role === 'company_admin' || role === 'consultant';

    // Process main modules first
    for (const mod of modulesToSearch) {
      const flattened = flattenMenuItems(mod.menuItems, mod.id, mod.label, [], isCompanyAdmin);
      for (const item of flattened) {
        // Hide Client Compass when user has only a single company or is not a consultant
        if (item.id === 'clients' && (isSingleCompanyMode || (role !== 'consultant'))) continue;
        const resolvedRoute = createDynamicRoute(item.route, companyName ?? undefined, productId ?? undefined);
        const hasUnresolvedCompany = resolvedRoute.includes(':companyName');
        const hasUnresolvedProduct = resolvedRoute.includes(':id');

        // Show these items as disabled when no company context
        const disabledWhenNoCompany = ['marketplace-preview', 'mission-control-main'];
        if (disabledWhenNoCompany.includes(item.id) && hasUnresolvedCompany) {
          items.push({ ...item, route: '', disabled: true });
          continue;
        }

        // Hide items that require a company context
        if (hasUnresolvedCompany) continue;

        // Hide items that require a product context when no product is selected
        if (hasUnresolvedProduct) continue;

        // Check if menu item is locked by subscription plan (same as L2ContextualBar)
        const menuAccessKey = SIDEBAR_TO_MENU_ACCESS_MAP[item.id];
        let isDisabledByPlan = false;
        if (menuAccessKey) {
          const manualKey = `${menuAccessKey}.manual`;
          const autoDataKey = `${menuAccessKey}.auto-data`;
          if (menuAccess && (manualKey in menuAccess || autoDataKey in menuAccess)) {
            const manualEnabled = menuAccess[manualKey] === true;
            const autoDataEnabled = menuAccess[autoDataKey] === true;
            isDisabledByPlan = !(manualEnabled || autoDataEnabled);
          } else {
            isDisabledByPlan = !isPlanMenuEnabled(item.id, mod.id);
          }
        }

        // If locked and showLockedMenus is off, hide completely
        if (isDisabledByPlan && !showLockedMenus) continue;

        if (isDisabledByPlan) {
          const lockMsg = planName
            ? `This feature is not available on the ${planName} plan.`
            : 'This feature requires an upgraded plan.';
          items.push({ ...item, route: resolvedRoute, lockedByPlan: true, lockMessage: lockMsg });
          continue;
        }

        items.push({ ...item, route: resolvedRoute });
      }
    }

    // XyReg Genesis - show for Genesis plan users (same as L1PrimaryModuleBar)
    if (isGenesis) {
      let genesisRoute: string;
      if (productId) {
        genesisRoute = `/app/product/${productId}/business-case?tab=genesis`;
      } else if (companyName) {
        genesisRoute = `/app/company/${encodeURIComponent(companyName)}/genesis`;
      } else {
        const storedCompany = localStorage.getItem('lastSelectedCompany');
        genesisRoute = storedCompany
          ? `/app/company/${encodeURIComponent(storedCompany)}/genesis`
          : '/app/genesis';
      }
      items.push({
        id: 'xyreg-genesis-shortcut',
        label: 'XyReg Genesis',
        breadcrumb: 'XyReg Genesis',
        route: genesisRoute,
        icon: <Crosshair className="h-5 w-5 text-amber-500" />,
        moduleId: 'genesis',
        moduleLabel: 'XyReg Genesis',
      });
    }

    // Company Settings - only for admin, company_admin, consultant, investor, business (same as L1PrimaryModuleBar)
    const companySettingsAllowedRoles = ['admin', 'company_admin', 'consultant', 'investor', 'business'];
    if (role && companySettingsAllowedRoles.includes(role) && role !== 'author') {
      const settingsMod = defaultSidebarConfig.companySettingsModule;
      const flattened = flattenMenuItems(settingsMod.menuItems, settingsMod.id, settingsMod.label, [], isCompanyAdmin);
      for (const item of flattened) {
        const resolvedRoute = createDynamicRoute(item.route, companyName ?? undefined, productId ?? undefined);
        if (resolvedRoute.includes(':companyName')) continue;
        if (resolvedRoute.includes(':id')) continue;
        items.push({ ...item, route: resolvedRoute });
      }
    }

    return items;
  }, [open, companyName, productId, allowedModules, clients, effectiveRole, isGenesis, isPlanMenuEnabled, menuAccess, planName, showLockedMenus]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, SearchableItem[]> = {};
    for (const item of searchableItems) {
      if (!groups[item.moduleLabel]) {
        groups[item.moduleLabel] = [];
      }
      groups[item.moduleLabel].push(item);
    }
    return groups;
  }, [searchableItems]);

  const handleSelect = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  const handleCompanySelect = (companyId: string, name: string) => {
    CompanyContextService.setFromUserSelection(companyId, name);
    CompanyUsageService.recordCompanyAccess(companyId);
    onOpenChange(false);
    navigate(`/app/company/${encodeURIComponent(name)}/mission-control`);
  };

  const handleDeviceSelect = (deviceId: string, companyId: string, companyName: string) => {
    CompanyContextService.setFromUserSelection(companyId, companyName);
    CompanyUsageService.recordCompanyAccess(companyId);
    onOpenChange(false);
    navigate(`/app/product/${deviceId}`);
  };

  const modSymbol = getModifierSymbol();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <TooltipProvider>
      <CommandInput placeholder={`Search pages...`} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedItems).map(([groupLabel, items]) => (
          <CommandGroup key={groupLabel} heading={groupLabel}>
            {items.map((item) => item.lockedByPlan ? (
              <CommandItem
                key={item.id}
                value={item.breadcrumb}
                onSelect={() => handleSelect(item.route)}
                className="text-foreground/60"
              >
                {item.icon && (
                  <span className="mr-2 flex-shrink-0">{item.icon}</span>
                )}
                <span>{item.breadcrumb}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-auto flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">
                        {item.lockMessage}{' '}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenChange(false);
                            const upgradeCompany = companyName || localStorage.getItem('lastSelectedCompany') || '';
                            navigate(upgradeCompany
                              ? `/app/company/${encodeURIComponent(upgradeCompany)}/profile?tab=plan`
                              : '/app/profile?tab=plan');
                          }}
                          className="text-amber-600 hover:text-amber-700 underline font-medium"
                        >
                          Upgrade to access it.
                        </button>
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </CommandItem>
            ) : (
              <CommandItem
                key={item.id}
                value={item.breadcrumb}
                disabled={item.disabled}
                onSelect={() => !item.disabled && handleSelect(item.route)}
                className={item.disabled ? 'cursor-not-allowed' : ''}
              >
                {item.icon && (
                  <span className="mr-2 flex-shrink-0">{item.icon}</span>
                )}
                <span>{item.breadcrumb}</span>
                {item.disabled && (
                  <span className="ml-auto text-xs text-muted-foreground">Select a company first</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        {/* Company list — always shown at the bottom */}
        {recentCompanies.length > 0 && (
          <CommandGroup heading="Recent Companies">
            {recentCompanies.map((company) => (
              <CommandItem
                key={`recent-${company.id}`}
                value={`recent ${company.name}`}
                onSelect={() => handleCompanySelect(company.id, company.name)}
              >
                <Building className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>{company.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {allCompanies.length > 0 && (
          <CommandGroup heading="All Companies">
            {allCompanies.map((company) => (
              <CommandItem
                key={`all-${company.id}`}
                value={`company ${company.name}`}
                onSelect={() => handleCompanySelect(company.id, company.name)}
              >
                <Building className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>{company.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {/* Devices — always shown at the bottom */}
        {devices.length > 0 && (
          <CommandGroup heading="Devices">
            {devices.map((device) => (
              <CommandItem
                key={`device-${device.id}`}
                value={`device ${device.name} ${device.companyName}`}
                onSelect={() => handleDeviceSelect(device.id, device.companyId, device.companyName)}
              >
                <Package className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>{device.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{device.companyName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      </TooltipProvider>
    </CommandDialog>
  );
}
