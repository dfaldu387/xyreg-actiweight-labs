import { BarChart3, Calculator, DollarSign, Map, Crosshair, Target, Shield, LayoutGrid } from 'lucide-react';
import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChartBar, ChevronRight } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { UserRole } from '@/types/documentTypes';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSidebarState } from '@/hooks/useSidebarState';

interface BusinessCaseGroupProps {
  userRole: UserRole;
  currentProductId: string;
  location: {
    pathname: string;
    search: string;
  };
}

// Helper to extract tab param from a path or search string
const getTabFromPath = (pathOrSearch: string): string | null => {
  const searchPart = pathOrSearch.includes('?') ? pathOrSearch.split('?')[1] : pathOrSearch;
  const params = new URLSearchParams(searchPart);
  return params.get('tab');
};

export function BusinessCaseGroup({
  userRole,
  currentProductId,
  location
}: BusinessCaseGroupProps) {
  const baseUrl = `/app/product/${currentProductId}`;
  const { expandedMenus, toggleMenuExpansion, setAutoExpansion } = useSidebarState();
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const menuName = "Business Case";
  const isCollapsed = sidebarState === "collapsed";
  
  // Current tab from URL (semantic matching)
  const currentTab = useMemo(() => getTabFromPath(location.search), [location.search]);

  // Optional: allow other UI (e.g. Genesis "eye" button) to force-open this menu
  const forceOpenMenu = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('openMenu') === 'business-case';
  }, [location.search]);
  
  const businessCaseItems = [
    {
      title: "Venture Blueprint",
      path: `${baseUrl}/business-case?tab=venture-blueprint`,
      icon: Map,
      visible: true
    },
    {
      title: "Business Canvas",
      path: `${baseUrl}/business-case?tab=business-canvas`,
      icon: LayoutGrid,
      visible: true
    },
    {
      title: "Market Analysis",
      path: `${baseUrl}/business-case?tab=market-analysis`,
      icon: BarChart3,
      visible: true
    },
    {
      title: "Reimbursement",
      path: `${baseUrl}/business-case?tab=reimbursement`,
      icon: DollarSign,
      visible: true
    },
    {
      title: "Pricing Strategy",
      path: `${baseUrl}/business-case?tab=pricing-strategy`,
      icon: DollarSign,
      visible: true
    },
    {
      title: "rNPV Analysis",
      path: `${baseUrl}/business-case?tab=rnpv`,
      icon: Calculator,
      visible: true
    },
    {
      title: "XyReg Genesis",
      path: `${baseUrl}/business-case?tab=genesis`,
      icon: Crosshair,
      visible: true
    },
    // Pitch Builder moved to Genesis Home
    {
      title: "Strategic Horizon",
      path: `${baseUrl}/business-case?tab=exit-strategy`,
      icon: Target,
      visible: true
    },
    {
      title: "IP Strategy",
      path: `${baseUrl}/business-case?tab=ip-strategy`,
      icon: Shield,
      visible: true
    }
  ];

  const visibleItems = businessCaseItems.filter(item => item.visible);

  const isBusinessCaseActive = useMemo(() => {
    return location.pathname.startsWith(`${baseUrl}/business-case`);
  }, [location.pathname, baseUrl]);

  // Check if Genesis (venture-blueprint) is active
  const isGenesisActive = useMemo(() => {
    return location.pathname.includes('/business-case') && 
           location.search.includes('tab=venture-blueprint');
  }, [location.pathname, location.search]);

  // Auto-expand when on business case routes
  useEffect(() => {
    if (isBusinessCaseActive) {
      setAutoExpansion(menuName, true);
    }
  }, [isBusinessCaseActive, setAutoExpansion]);

  // Force-open even if user previously collapsed it
  useEffect(() => {
    if (!forceOpenMenu) return;

    // Ensure the contextual sidebar is expanded so sub-items are visible
    if (sidebarState === "collapsed") {
      toggleSidebar();
    }

    // Only flip state if the menu exists and is explicitly collapsed
    if (expandedMenus[menuName] === false) {
      toggleMenuExpansion(menuName);
    }
  }, [forceOpenMenu, expandedMenus, toggleMenuExpansion, sidebarState, toggleSidebar]);

  const isOpen = expandedMenus[menuName] ?? isBusinessCaseActive;

  const businessCasePath = `${baseUrl}/business-case?tab=venture-blueprint`;
  const isBusinessCaseLandingActive = isGenesisActive;

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleMenuExpansion(menuName)}>
      <div className="flex items-center gap-3 w-full">
        <SidebarMenuButton
          asChild
          isActive={isBusinessCaseLandingActive}
          tooltip="Business Case"
          className="flex-1 px-3 py-2.5 font-medium text-sm"
        >
          <Link to={businessCasePath} className="flex items-center gap-3">
            <div className={`text-muted-foreground ${isCollapsed ? '-ml-2' : ''}`} style={isCollapsed ? {marginLeft: '-9px'} : {}}>
              <ChartBar className="h-5 w-5" />
            </div>
            <span>Business Case</span>
          </Link>
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <button 
            className="p-1 mr-3 hover:bg-muted rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronRight className="size-4 ml-auto transition-transform data-[state=open]:rotate-90" />
          </button>
        </CollapsibleTrigger>
      </div>

      {!isCollapsed && (
        <CollapsibleContent>
          <SidebarMenuSub>
            {visibleItems.map((item) => {
              const itemTab = getTabFromPath(item.path);
              const isItemActive = location.pathname.includes('/business-case') && currentTab === itemTab;
              return (
                <SidebarMenuSubItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isItemActive}
                    tooltip={item.title}
                    className="px-6 py-2 text-sm"
                    data-testid={`business-case-item-${itemTab}`}
                  >
                    <Link to={item.path} className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}