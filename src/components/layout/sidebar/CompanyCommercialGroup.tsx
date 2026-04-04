import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ChartBar, ChevronRight, DollarSign, Map, BarChart3, FileKey, Globe, TrendingUp, LayoutGrid, Target, Banknote } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { UserRole } from '@/types/documentTypes';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSidebarState } from '@/hooks/useSidebarState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CompanyCommercialGroupProps {
  userRole: UserRole;
  currentCompany: string;
  location: {
    pathname: string;
    search: string;
  };
}

export function CompanyCommercialGroup({
  userRole,
  currentCompany,
  location
}: CompanyCommercialGroupProps) {
  const baseUrl = `/app/company/${encodeURIComponent(currentCompany)}`;
  const { expandedMenus, toggleMenuExpansion, setAutoExpansion } = useSidebarState();
  const { state: sidebarState } = useSidebar();
  const menuName = "Commercial Intelligence";
  const isCollapsed = sidebarState === "collapsed";

  const commercialItems = [
    {
      title: "Strategic Blueprint",
      path: `${baseUrl}/commercial?tab=strategic-blueprint`,
      icon: TrendingUp,
      visible: true
    },
    {
      title: "Business Canvas",
      path: `${baseUrl}/commercial?tab=business-canvas`,
      icon: LayoutGrid,
      visible: true
    },
    {
      title: "Viability Studies",
      path: `${baseUrl}/commercial?tab=feasibility-studies`,
      icon: Map,
      visible: true
    },
    {
      title: "Market Analysis",
      path: `${baseUrl}/commercial?tab=market-analysis`,
      icon: BarChart3,
      visible: true
    },
    {
      title: "Commercial Performance",
      path: `${baseUrl}/commercial?tab=commercial-performance`,
      icon: Calculator,
      visible: true
    },
    {
      title: "Variance Analysis",
      path: `${baseUrl}/commercial?tab=variance-analysis`,
      icon: BarChart3,
      visible: true
    },
    {
      title: "Pricing Strategy",
      path: `${baseUrl}/commercial?tab=pricing-strategy`,
      icon: DollarSign,
      visible: true
    },
    {
      title: "Investors",
      path: `${baseUrl}/commercial?tab=investors`,
      icon: FileKey,
      visible: true
    },
    {
      title: "Funding & Grants",
      path: `${baseUrl}/commercial?tab=funding-grants`,
      icon: Banknote,
      visible: true
    }
  ];

  // Smart link for Strategic Horizon - routes to last viewed product's exit-strategy or device picker
  const strategicHorizonLink = useMemo(() => {
    try {
      const lastProduct = localStorage.getItem(`lastViewedProduct_${currentCompany}`);
      if (lastProduct) {
        return `/app/product/${lastProduct}/business-case?tab=exit-strategy`;
      }
    } catch {
      // localStorage not available
    }
    return '/app/devices';
  }, [currentCompany]);

  const visibleItems = commercialItems.filter(item => item.visible);

  const isCommercialActive = useMemo(() => {
    return location.pathname.startsWith(`${baseUrl}/commercial`) && 
           !location.pathname.endsWith('/commercial-landing');
  }, [location.pathname, baseUrl]);

  // Auto-expand when on commercial routes
  useEffect(() => {
    if (isCommercialActive) {
      setAutoExpansion(menuName, true);
    }
  }, [isCommercialActive, setAutoExpansion]);

  const isOpen = expandedMenus[menuName] ?? isCommercialActive;

  const commercialPath = `${baseUrl}/commercial-landing`;
  const isCommercialLandingActive = location.pathname === commercialPath;

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleMenuExpansion(menuName)}>
      <div className="flex items-center gap-3 w-full">
        <SidebarMenuButton
          asChild
          isActive={isCommercialLandingActive}
          tooltip="Commercial Intelligence"
          className="flex-1 px-3 py-2.5 font-medium text-sm"
        >
          <Link to={commercialPath} className="flex items-center gap-3">
            <div className={`text-muted-foreground ${isCollapsed ? '-ml-2' : ''}`} style={isCollapsed ? {marginLeft: '-9px'} : {}}>
              <ChartBar className="h-5 w-5" />
            </div>
            <span>Commercial Intelligence</span>
          </Link>
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <button 
            className="p-1 mr-3 hover:bg-muted rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronRight className={`size-4 ml-auto transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <SidebarMenuSub>
          {visibleItems.map((item) => (
            <SidebarMenuSubItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname + location.search === item.path}
                tooltip={item.title}
                className="px-6 py-2 text-sm"
              >
                <Link to={item.path} className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuSubItem>
          ))}
          {/* Strategic Horizon - smart link to product-level exit strategy */}
          <SidebarMenuSubItem>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    asChild
                    isActive={false}
                    className="px-6 py-2 text-sm"
                    data-testid="l1-strategic-horizon"
                  >
                    <Link to={strategicHorizonLink} className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        <Target className="h-5 w-5" />
                      </div>
                      <span>Strategic Horizon</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Opens Strategic Horizon for your last viewed device</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}