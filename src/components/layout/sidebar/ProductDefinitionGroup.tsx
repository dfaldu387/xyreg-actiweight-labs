import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Info, Settings, Target, Shield, QrCode, Eye, ChevronRight, Package2 } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { UserRole } from '@/types/documentTypes';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSidebarState } from '@/hooks/useSidebarState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isoTooltips } from '@/constants/isoTooltips';

interface ProductDefinitionGroupProps {
  userRole: UserRole;
  currentProductId: string;
  location: {
    pathname: string;
    search: string;
  };
}

export function ProductDefinitionGroup({
  userRole,
  currentProductId,
  location
}: ProductDefinitionGroupProps) {
  const baseUrl = `/app/product/${currentProductId}`;
  const { expandedMenus, toggleMenuExpansion, setAutoExpansion } = useSidebarState();
  const { state: sidebarState } = useSidebar();
  const menuName = "Device Definition";
  const isCollapsed = sidebarState === "collapsed";
  
  const definitionItems = [
    {
      title: "Overview",
      path: `${baseUrl}/device-information?tab=overview`,
      icon: Info,
      visible: true
    },
    {
      title: "General", 
      path: `${baseUrl}/device-information?tab=basics`,
      icon: Settings,
      visible: true
    },
    {
      title: "Intended Purpose",
      path: `${baseUrl}/device-information?tab=purpose`,
      icon: Target,
      visible: true
    },
    {
      title: "Identification",
      path: `${baseUrl}/device-information?tab=identification`,
      icon: QrCode,
      visible: true
    },
    {
      title: "Markets & Regulatory",
      path: `${baseUrl}/device-information?tab=markets-regulatory`,
      icon: Eye,
      visible: true
    },
    {
      title: "Bundles",
      path: `${baseUrl}/device-information?tab=bundles`,
      icon: Package2,
      visible: true
    }
  ];

  const visibleItems = definitionItems.filter(item => item.visible);

  const isProductDefinitionActive = useMemo(() => {
    return (location.pathname === `${baseUrl}/device-information` ||
           visibleItems.some(item => {
             const url = new URL(item.path, window.location.origin);
             const currentUrl = new URL(location.pathname + location.search, window.location.origin);
             return url.pathname === currentUrl.pathname && url.searchParams.get('tab') === currentUrl.searchParams.get('tab');
           })) && !location.pathname.endsWith('/product-definition');
  }, [location.pathname, location.search, visibleItems, baseUrl]);

  // Auto-expand when on product definition routes
  useEffect(() => {
    if (isProductDefinitionActive) {
      setAutoExpansion(menuName, true);
    }
  }, [isProductDefinitionActive, setAutoExpansion]);

  const isOpen = expandedMenus[menuName] ?? false;

  const productDefinitionPath = `${baseUrl}/product-definition`;
  const isProductDefinitionLandingActive = location.pathname === productDefinitionPath;

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleMenuExpansion(menuName)}>
      <div className="flex items-center gap-3 w-full">
        <SidebarMenuButton 
          asChild
          isActive={isProductDefinitionLandingActive}
          tooltip="Device Definition" 
          className="flex-1 px-3 py-2.5 font-medium text-sm"
        >
          <Link to={productDefinitionPath} className="flex items-center gap-3">
            <div className={`text-muted-foreground ${isCollapsed ? '-ml-2' : ''}`} style={isCollapsed ? {marginLeft: '-9px'} : {}}>
              <Info className="h-5 w-5" />
            </div>
            <span>Device Definition</span>
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
      
      <CollapsibleContent>
        <SidebarMenuSub>
          {visibleItems.map((item) => (
            <SidebarMenuSubItem key={item.path}>
              {isCollapsed ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.pathname === item.path}
                        className="px-3 py-2.5"
                      >
                        <Link to={item.path} className="flex items-center justify-center -ml-1.5">
                          <item.icon className="h-5 w-5" />
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
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
                    {isoTooltips[item.title] && (
                      <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{isoTooltips[item.title].role}</p>
                          {isoTooltips[item.title].reference && (
                            <p className="text-xs font-medium text-primary/80">{isoTooltips[item.title].reference}</p>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}