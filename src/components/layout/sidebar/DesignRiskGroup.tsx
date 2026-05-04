import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, FileText, AlertTriangle, CheckCircle2, Network, Box, ChevronRight } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { UserRole } from '@/types/documentTypes';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSidebarState } from '@/hooks/useSidebarState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isoTooltips } from '@/constants/isoTooltips';
import { cn } from '@/lib/utils';

interface DesignRiskGroupProps {
  userRole: UserRole;
  currentProductId: string;
  location: {
    pathname: string;
    search: string;
  };
  accentClassName?: string;
}

export function DesignRiskGroup({
  userRole,
  currentProductId,
  location,
  accentClassName,
}: DesignRiskGroupProps) {
  const baseUrl = `/app/product/${currentProductId}`;
  const { expandedMenus, toggleMenuExpansion, setAutoExpansion } = useSidebarState();
  const { state: sidebarState } = useSidebar();
  const menuName = "Design & Risk Controls";
  const isCollapsed = sidebarState === "collapsed";

  const designRiskItems = [
    { title: "Traceability", path: `${baseUrl}/design-risk-controls?tab=traceability`, icon: Network, visible: true },
    { title: "Requirements", path: `${baseUrl}/design-risk-controls?tab=requirement-specifications`, icon: FileText, visible: true },
    { title: "Usability Engineering", path: `${baseUrl}/design-risk-controls?tab=usability-engineering`, icon: Target, visible: true },
    { title: "Risk Management", path: `${baseUrl}/design-risk-controls?tab=risk-management`, icon: AlertTriangle, visible: true },
    { title: "Verification & Validation", path: `${baseUrl}/design-risk-controls?tab=verification-validation`, icon: CheckCircle2, visible: true },
    { title: "Architecture", path: `${baseUrl}/design-risk-controls?tab=system-architecture`, icon: Box, visible: true }
  ];

  const visibleItems = designRiskItems.filter(item => item.visible);

  const isDesignRiskActive = useMemo(() => {
    return location.pathname.startsWith(`${baseUrl}/design-risk-controls`) && 
           !location.pathname.endsWith('/design-risk-landing');
  }, [location.pathname, baseUrl]);

  useEffect(() => {
    if (isDesignRiskActive) {
      setAutoExpansion(menuName, true);
    }
  }, [isDesignRiskActive, setAutoExpansion]);

  const isOpen = expandedMenus[menuName] ?? isDesignRiskActive;

  const designRiskLandingPath = `${baseUrl}/design-risk-landing`;
  const isDesignRiskLandingActive = location.pathname === designRiskLandingPath;

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleMenuExpansion(menuName)}>
      <div className="flex items-center gap-3 w-full">
        <SidebarMenuButton
          asChild
          isActive={isDesignRiskLandingActive}
          tooltip="Design & Risk Controls"
          className={cn("flex-1 px-3 py-2.5 font-medium text-sm", accentClassName)}
        >
          <Link to={designRiskLandingPath} className="flex items-center gap-3">
            <div className={`text-teal-600 [&_svg]:!text-teal-600 ${isCollapsed ? '-ml-2' : ''}`} style={isCollapsed ? {marginLeft: '-9px'} : {}}>
              <Target className="h-5 w-5" />
            </div>
            <span>Design & Risk Controls</span>
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
              const tooltipData = isoTooltips[item.title];
              return (
                <SidebarMenuSubItem key={item.path}>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname + location.search === item.path}
                          className="px-6 py-2 text-sm"
                        >
                          <Link to={item.path} className="flex items-center gap-3">
                            <div className="text-teal-500">
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
