import React, { useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layers, DollarSign, ChevronRight, Globe, FileKey, LayoutGrid, AlertTriangle } from "lucide-react";
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSidebarState } from "@/hooks/useSidebarState";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { isoTooltips } from "@/constants/isoTooltips";

interface PortfolioGroupProps {
  userRole: string | null;
  currentCompany: string;
  location: { pathname: string };
}

export function PortfolioGroup({ userRole, currentCompany, location }: PortfolioGroupProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { expandedMenus, toggleMenuExpansion, setAutoExpansion } = useSidebarState();
  const menuName = "Portfolio Management";
  const baseUrl = `/app/company/${encodeURIComponent(currentCompany)}`;

  const portfolioItems = [
    {
      title: "Portfolio Views",
      path: `${baseUrl}/portfolio-landing?tab=portfolio`,
      icon: LayoutGrid,
    },
    {
      title: "Budget Dashboard",
      path: `${baseUrl}/portfolio-landing?tab=budget`,
      icon: DollarSign,
    },
    {
      title: "Variance Analysis",
      path: `${baseUrl}/portfolio-landing?tab=variance-analysis`,
      icon: Globe,
    },
    {
      title: "Investors",
      path: `${baseUrl}/portfolio-landing?tab=investors`,
      icon: FileKey,
    },
    {
      title: "Portfolio Risk Map",
      path: `${baseUrl}/portfolio-landing?tab=risk-map`,
      icon: AlertTriangle,
    },
  ];

  const isPortfolioLandingActive = location.pathname === `${baseUrl}/portfolio-landing`;
  const isPortfolioActive = useMemo(() => {
    return isPortfolioLandingActive || portfolioItems.some(item => location.pathname === item.path);
  }, [location.pathname, isPortfolioLandingActive, portfolioItems]);

  useEffect(() => {
    if (isPortfolioActive) {
      setAutoExpansion(menuName, true);
    }
  }, [isPortfolioActive, setAutoExpansion]);

  const isOpen = expandedMenus[menuName] ?? isPortfolioActive;

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleMenuExpansion(menuName)}>
      <div className="flex items-center gap-3 w-full">
        <SidebarMenuButton
          asChild
          isActive={isPortfolioLandingActive}
          tooltip="Portfolio Management"
          className="flex-1 px-3 py-2.5 font-medium text-sm"
        >
          <Link to={`${baseUrl}/portfolio-landing?tab=portfolio`} className="flex items-center gap-3">
            <div className={`text-muted-foreground ${isCollapsed ? '-ml-2' : ''}`} style={isCollapsed ? { marginLeft: '-9px' } : {}}>
              <Layers className="h-5 w-5" />
            </div>
            <span>Portfolio Management</span>
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

      {!isCollapsed && (
        <CollapsibleContent>
          <SidebarMenuSub>
            {portfolioItems.map((item) => {
              const tooltipData = isoTooltips[item.title];
              return (
                <SidebarMenuSubItem key={item.path}>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === item.path}
                          className="px-6 py-2 text-sm"
                        >
                          <Link to={item.path} className="flex items-center gap-3">
                            <div className="text-muted-foreground">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {tooltipData && (
                        <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                          <div className="space-y-1.5">
                            <p className="font-semibold text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{tooltipData.role}</p>
                            {tooltipData.reference && (
                              <p className="text-xs font-medium text-primary/80">{tooltipData.reference}</p>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
