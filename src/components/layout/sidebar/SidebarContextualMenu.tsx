import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, ChartBar, Calendar, FileSearch, Users, Flag, Monitor, Eye, Activity, ScrollText, MessageCircle, Package, Truck, FolderKanban, Layers, Lightbulb, AlertTriangle, ClipboardCheck, Building2, FileWarning, Lock } from 'lucide-react';
import { SidebarMenuButton, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarGroupLabel, SidebarSeparator, useSidebar } from '@/components/ui/sidebar';
import { hasAdminPrivileges } from '@/utils/roleUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isoTooltips } from '@/constants/isoTooltips';
import { UserRole } from '@/types/documentTypes';
import { useSubscriptionContext } from '@/context/SubscriptionContext';
import { useDeviceModuleAccess } from '@/hooks/useDeviceModuleAccess';
import { ComplianceInstancesGroup } from './ComplianceInstancesGroup';
import { MilestonesGroup } from './MilestonesGroup';
import { ProductDefinitionGroup } from './ProductDefinitionGroup';
import { BusinessCaseGroup } from './BusinessCaseGroup';
import { DesignRiskGroup } from './DesignRiskGroup';
import { DeviceOperationsGroup } from './DeviceOperationsGroup';
import { CompanyCommercialGroup } from './CompanyCommercialGroup';
  import { OperationsGroup } from './OperationsGroup';
  import { PortfolioGroup } from './PortfolioGroup';
  import { QualityGovernanceGroup } from './QualityGovernanceGroup';
// IPManagementGroup removed - now inline
import { SidebarContextSwitcher } from './SidebarContextSwitcher';
import { domainTokens } from '@/config/domainColors';
import { cn } from '@/lib/utils';
interface CompanyInfo {
  id: string;
  name: string;
  status: "On Track" | "At Risk" | "Needs Attention";
}

interface SidebarContextualMenuProps {
  userRole: UserRole;
  currentProductId: string | null;
  currentCompany: string | null;
  productOwnerCompany?: string | null;
  location: {
    pathname: string;
    search: string;
  };
  onCollapseMenu: (menuName: string) => void;
  singleCompanyName: string | null;
  companies?: CompanyInfo[];
}
export function SidebarContextualMenu({
  userRole,
  currentProductId,
  currentCompany,
  productOwnerCompany,
  location,
  onCollapseMenu,
  singleCompanyName,
  companies = []
}: SidebarContextualMenuProps) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { isSubscriptionExpired, isMasterPlanUser } = useSubscriptionContext();
  const { hasAccess: hasDeviceModuleAccess } = useDeviceModuleAccess(currentProductId);

  // When subscription is expired and user is not master, lock all menus
  const menusLocked = isSubscriptionExpired && !isMasterPlanUser;

  // Canonical "all devices" URL — points to the company's device portfolio
  // (cards view). Falls back to the global Client Compass when no company is
  // available so the link always lands on a real page.
  const backToDevicesHref = (() => {
    const companyForLink = productOwnerCompany || currentCompany;
    if (companyForLink) {
      return `/app/company/${encodeURIComponent(companyForLink)}/portfolio?view=cards`;
    }
    return '/app/clients';
  })();


  // Product-specific menu items
  if (currentProductId && userRole !== "viewer") {
    return (
      <>
        {state === "collapsed" && <SidebarSeparator className="mx-1 my-1 bg-border" />}
        {menusLocked && (
          <div className="mx-3 mb-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-xs text-destructive">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>Subscription expired. Menus locked.</span>
          </div>
        )}
        <SidebarGroup className={menusLocked ? "pointer-events-none opacity-50" : ""}>
          <SidebarGroupLabel>Product</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarContextSwitcher currentContext="product" currentProductId={currentProductId} currentCompany={currentCompany} productOwnerCompany={productOwnerCompany} />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Back to all devices" 
                  size="lg" 
                  className={state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm"}
                >
                  <Link to={backToDevicesHref} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                    <div className="text-muted-foreground">
                      <Layers className="h-5 w-5" />
                    </div>
                    {state !== "collapsed" && <span>← Back to all devices</span>}
                  </Link>
                </SidebarMenuButton>
                {state !== "collapsed" && (
                  <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                    Return to your complete device portfolio overview
                  </p>
                )}
              </SidebarMenuItem>

              {hasDeviceModuleAccess('device-dashboard') && (
              <SidebarMenuItem>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={location.pathname === `/app/product/${currentProductId}`} size="lg" className={cn(state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm", domainTokens('business').button)}>
                        <Link to={`/app/product/${currentProductId}`} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                          <LayoutDashboard className="h-5 w-5 !text-amber-600" />
                          {state !== "collapsed" && <span>Device Dashboard</span>}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isoTooltips["Device Dashboard"] && (
                      <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm">Device Dashboard</p>
                          <p className="text-xs text-muted-foreground">{isoTooltips["Device Dashboard"].role}</p>
                          {isoTooltips["Device Dashboard"].reference && <p className="text-xs font-medium text-primary/80">{isoTooltips["Device Dashboard"].reference}</p>}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {state !== "collapsed" && (
                  <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                    Real-time overview of your device's regulatory compliance status and key milestones
                  </p>
                )}
              </SidebarMenuItem>
              )}

              {hasDeviceModuleAccess('bill-of-materials') && (
              <SidebarMenuItem>
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <SidebarMenuButton
                          asChild
                          isActive={location.pathname === `/app/product/${currentProductId}/bom`}
                          className={cn("px-3 py-2.5 font-medium text-sm", domainTokens('design-risk').button)}
                        >
                          <Link to={`/app/product/${currentProductId}/bom`} className="flex items-center gap-3">
                            <Package className="h-5 w-5 !text-teal-600" />
                            <span>Bill of Materials</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isoTooltips["Bill of Materials"] && (
                        <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                          <div className="space-y-1.5">
                            <p className="font-semibold text-sm">Bill of Materials</p>
                            <p className="text-xs text-muted-foreground">{isoTooltips["Bill of Materials"].role}</p>
                            {isoTooltips["Bill of Materials"].reference && <p className="text-xs font-medium text-primary/80">{isoTooltips["Bill of Materials"].reference}</p>}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Versioned BOMs with cost rollups and supplier tracking
                    </p>
                  )}
              </SidebarMenuItem>
              )}

              {hasDeviceModuleAccess('development-lifecycle') && (
              <SidebarMenuItem>
                <ComplianceInstancesGroup context="product" userRole={userRole} currentProductId={currentProductId} location={location} singleCompanyName={singleCompanyName} accentClassName={domainTokens('clinical-reg').button} />
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Track regulatory documentation, gap analysis, activities, and audit compliance
                    </p>
                  )}
              </SidebarMenuItem>
              )}

              {hasDeviceModuleAccess('design-risk-controls') && (
              <SidebarMenuItem>
                <DesignRiskGroup userRole={userRole} currentProductId={currentProductId} location={location} accentClassName={domainTokens('design-risk').button} />
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Manage design controls, risk assessment, and product verification
                    </p>
                  )}
              </SidebarMenuItem>
              )}

              {hasDeviceModuleAccess('device-definition') && (
              <SidebarMenuItem>
                <ProductDefinitionGroup userRole={userRole} currentProductId={currentProductId} location={location} accentClassName={domainTokens('design-risk').button} />
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Define device specifications, intended use, indications, and contraindications
                    </p>
                  )}
              </SidebarMenuItem>
              )}

              {hasDeviceModuleAccess('business-case') && (
              <SidebarMenuItem>
                <BusinessCaseGroup userRole={userRole} currentProductId={currentProductId} location={location} accentClassName={domainTokens('business').button} />
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Strategic planning tools for market analysis, pricing, and financial projections
                    </p>
                  )}
              </SidebarMenuItem>
              )}

              {hasDeviceModuleAccess('operations') && (
              <SidebarMenuItem>
                <DeviceOperationsGroup userRole={userRole} currentProductId={currentProductId} location={location} accentClassName={domainTokens('operations').button} />
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Manufacturing strategy, supply chain, and production
                    </p>
                  )}
              </SidebarMenuItem>
              )}

              {/* Quality & Governance Group (NC, CAPA, CC, DR) */}
              {hasDeviceModuleAccess('quality-governance') && (
              <SidebarMenuItem>
                <QualityGovernanceGroup
                  context="product"
                  basePath={`/app/product/${currentProductId}`}
                  location={location}
                  accentClassName={domainTokens('quality').button}
                />
              </SidebarMenuItem>
              )}

              {hasDeviceModuleAccess('clinical-trials') && (
              <SidebarMenuItem>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={location.pathname === `/app/product/${currentProductId}/design-risk-controls` && location.search.includes('tab=usability-engineering')} size="lg" className={cn(state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm", domainTokens('clinical-reg').button)}>
                        <Link to={`/app/product/${currentProductId}/design-risk-controls?tab=usability-engineering`} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                          <Users className="h-5 w-5 !text-purple-600" />
                          {state !== "collapsed" && <span>Usability Engineering</span>}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isoTooltips["Usability Engineering"] && (
                      <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm">Usability Engineering</p>
                          <p className="text-xs text-muted-foreground">{isoTooltips["Usability Engineering"].role}</p>
                          {isoTooltips["Usability Engineering"].reference && <p className="text-xs font-medium text-primary/80">{isoTooltips["Usability Engineering"].reference}</p>}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {state !== "collapsed" && (
                  <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                    IEC 62366-1 usability engineering file and human factors
                  </p>
                )}
              </SidebarMenuItem>
              )}

              {hasDeviceModuleAccess('development-lifecycle') && (
              <SidebarMenuItem>
                <MilestonesGroup userRole={userRole} currentProductId={currentProductId} location={location} accentClassName={domainTokens('operations').button} />
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Timeline tracking of development phases, regulatory submissions, and clinical trials
                    </p>
                  )}
              </SidebarMenuItem>
              )}

              {/* Design Review now in Quality & Governance group above */}

              {hasDeviceModuleAccess('regulatory-submissions') && (
              <SidebarMenuItem>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={location.pathname === `/app/product/${currentProductId}/post-market-surveillance`} size="lg" className={cn(state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm", domainTokens('clinical-reg').button)}>
                        <Link to={`/app/product/${currentProductId}/post-market-surveillance`} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                          <Eye className="h-5 w-5 !text-purple-600" />
                          {state !== "collapsed" && <span>Post-Market Surveillance</span>}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isoTooltips["Post-Market Surveillance"] && (
                      <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm">Post-Market Surveillance</p>
                          <p className="text-xs text-muted-foreground">{isoTooltips["Post-Market Surveillance"].role}</p>
                          {isoTooltips["Post-Market Surveillance"].reference && <p className="text-xs font-medium text-primary/80">{isoTooltips["Post-Market Surveillance"].reference}</p>}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {state !== "collapsed" && (
                  <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                    Monitor safety events, vigilance reporting, and post-market compliance
                  </p>
                )}
              </SidebarMenuItem>
              )}
              {(userRole === "admin" || userRole === "editor") && hasDeviceModuleAccess('audit-log') && (
                <SidebarMenuItem>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild isActive={location.pathname === `/app/product/${currentProductId}/user-access`} size="lg" className={cn(state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm", domainTokens('quality').button)}>
                          <Link to={`/app/product/${currentProductId}/user-access`} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                            <Users className="h-5 w-5 !text-emerald-600" />
                            {state !== "collapsed" && <span>User Access</span>}
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isoTooltips["User Access"] && (
                        <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                          <div className="space-y-1.5">
                            <p className="font-semibold text-sm">User Access</p>
                            <p className="text-xs text-muted-foreground">{isoTooltips["User Access"].role}</p>
                            {isoTooltips["User Access"].reference && <p className="text-xs font-medium text-primary/80">{isoTooltips["User Access"].reference}</p>}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Control team permissions and manage user roles for this device
                    </p>
                  )}
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {state === "collapsed" && <SidebarSeparator className="mx-1 my-1 bg-border" />}
      </>
    );
  }
  // Global admin section - shows on /app/clients and other global routes when no company context
  const isGlobalRoute = location.pathname === '/app/clients' || location.pathname === '/app/archives' || location.pathname === '/app/devices';
  
  if (!currentCompany && isGlobalRoute) {
    // Use singleCompanyName for IP Management link on global routes
    const targetCompany = singleCompanyName;

    // Sort companies: 3 most recent on top (by name for now, since we don't have updated_at)
    // The order from the backend is already most-recently-active first
    const sortedCompanies = companies.slice(0, 3);
    const remainingCompanies = companies.slice(3);

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'On Track': return 'bg-green-500';
        case 'At Risk': return 'bg-yellow-500';
        case 'Needs Attention': return 'bg-red-500';
        default: return 'bg-green-500';
      }
    };

    const renderCompanyItem = (company: CompanyInfo) => (
      <SidebarMenuItem key={company.id}>
        <SidebarMenuButton
          asChild
          tooltip={`${company.name} (${company.status})`}
          size="lg"
          className={state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm"}
        >
          <Link
            to={`/app/company/${encodeURIComponent(company.name)}`}
            className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}
          >
            <div className="relative text-muted-foreground">
              <Building2 className="h-5 w-5" />
              <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar ${getStatusColor(company.status)}`} />
            </div>
            {state !== "collapsed" && (
              <span className="truncate">{company.name}</span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
    
    return (
      <>
        {state === "collapsed" && <SidebarSeparator className="mx-1 my-1 bg-border" />}
        {/* Company list */}
        {companies.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Recent</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sortedCompanies.map(renderCompanyItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {remainingCompanies.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>All Companies</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {remainingCompanies.map(renderCompanyItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {/* IP Management */}
        {hasAdminPrivileges(userRole) && targetCompany && (
          <SidebarGroup data-version="2024120402">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem data-testid="ip-management-global">
                  <SidebarMenuButton asChild tooltip="IP Management" size="lg" className={state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm"}>
                    <Link to={`/app/company/${encodeURIComponent(targetCompany)}/ip-portfolio`} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                      <div className="text-muted-foreground">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      {state !== "collapsed" && <span>IP Management</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {state === "collapsed" && <SidebarSeparator className="mx-1 my-1 bg-border" />}
      </>
    );
  }

  // Company-specific menu items
  if (currentCompany && hasAdminPrivileges(userRole)) {

    return (
      <>
        {state === "collapsed" && <SidebarSeparator className="mx-1 my-1 bg-border" />}
        {menusLocked && (
          <div className="mx-3 mb-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-xs text-destructive">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>Subscription expired. Menus locked.</span>
          </div>
        )}
        <SidebarGroup data-version="2024120401" className={menusLocked ? "pointer-events-none opacity-50" : ""}>
          <SidebarGroupLabel>Company</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarContextSwitcher currentContext="company" currentProductId={currentProductId} currentCompany={currentCompany} productOwnerCompany={productOwnerCompany} />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Back to all devices" 
                  size="lg" 
                  className={state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm"}
                >
                  <Link to={backToDevicesHref} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                    <div className="text-muted-foreground">
                      <Layers className="h-5 w-5" />
                    </div>
                    {state !== "collapsed" && <span>← Back to all devices</span>}
                  </Link>
                </SidebarMenuButton>
                {state !== "collapsed" && (
                  <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                    Return to your complete device portfolio overview
                  </p>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={location.pathname === `/app/company/${encodeURIComponent(currentCompany)}`} size="lg" className={state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm"}>
                        <Link to={`/app/company/${encodeURIComponent(currentCompany)}`} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                          <div className="text-muted-foreground">
                            <Monitor className="h-5 w-5" />
                          </div>
                          {state !== "collapsed" && <span>Executive Dashboard</span>}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isoTooltips["Executive Dashboard"] && (
                      <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm">Executive Dashboard</p>
                          <p className="text-xs text-muted-foreground">{isoTooltips["Executive Dashboard"].role}</p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {state !== "collapsed" && (
                  <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                    MedTech Executive Dashboard - Integrated Compliance Operating System
                  </p>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <PortfolioGroup
                  userRole={userRole}
                  currentCompany={currentCompany}
                  location={location}
                  accentClassName={domainTokens('business').button}
                />
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Choose your preferred visualization to explore your device portfolio
                    </p>
                  )}
              </SidebarMenuItem>

              {/* Compliance Instances Group */}
              <SidebarMenuItem>
                <ComplianceInstancesGroup context="company" userRole={userRole} currentCompany={currentCompany} location={location} singleCompanyName={singleCompanyName} accentClassName={domainTokens('clinical-reg').button} />
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Manage documents, gap analysis, activities, and audits across all products
                    </p>
                  )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={location.pathname === `/app/company/${encodeURIComponent(currentCompany)}/milestones`} size="lg" className={cn(state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm", domainTokens('operations').button)}>
                        <Link to={`/app/company/${encodeURIComponent(currentCompany)}/milestones`} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                          <Calendar className="h-5 w-5 !text-blue-600" />
                          {state !== "collapsed" && <span>Enterprise Roadmap</span>}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isoTooltips["Enterprise Roadmap"] && (
                      <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm">Enterprise Roadmap</p>
                          <p className="text-xs text-muted-foreground">{isoTooltips["Enterprise Roadmap"].role}</p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {state !== "collapsed" && (
                  <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                    Timeline view of products, phases, documents, activities, audits, and gap analysis
                  </p>
                )}
              </SidebarMenuItem>

              {/* Operations Group */}
              <SidebarMenuItem>
                <OperationsGroup userRole={userRole} currentCompany={currentCompany} location={location} accentClassName={domainTokens('operations').button} />
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Suppliers, infrastructure, and calibration management
                    </p>
                  )}
              </SidebarMenuItem>

              {/* Quality & Governance Group (NC, CAPA, CC, DR) */}
              <SidebarMenuItem>
                <QualityGovernanceGroup
                  context="company"
                  basePath={`/app/company/${encodeURIComponent(currentCompany)}`}
                  location={location}
                  accentClassName={domainTokens('quality').button}
                />
              </SidebarMenuItem>

              {/* Commercial Intelligence Group */}
              <SidebarMenuItem>
                <CompanyCommercialGroup userRole={userRole} currentCompany={currentCompany} location={location} accentClassName={domainTokens('business').button} />
                  {state !== "collapsed" && (
                    <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                      Manage global strategy for categories, platforms, and models. Set target markets, pricing templates, and strategic positioning at the company level.
                    </p>
                  )}
              </SidebarMenuItem>

              {/* IP Management - v2024120403 */}
              <SidebarMenuItem data-testid="ip-management-menu-item" data-build="2024120403">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={location.pathname.includes('/ip-portfolio')} size="lg" className={cn(state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm", domainTokens('business').button)}>
                        <Link to={`/app/company/${encodeURIComponent(currentCompany)}/ip-portfolio`} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                          <Lightbulb className="h-5 w-5 !text-amber-600" />
                          {state !== "collapsed" && <span>IP Management</span>}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isoTooltips["IP Management"] && (
                      <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm">IP Management</p>
                          <p className="text-xs text-muted-foreground">{isoTooltips["IP Management"].role}</p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {state !== "collapsed" && (
                  <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                    Manage patents, trademarks, copyrights, and other intellectual property assets
                  </p>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={location.pathname === `/app/company/${encodeURIComponent(currentCompany)}/post-market-surveillance`} size="lg" className={cn(state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm", domainTokens('quality').button)}>
                        <Link to={`/app/company/${encodeURIComponent(currentCompany)}/post-market-surveillance`} className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3"}>
                          <Eye className="h-5 w-5 !text-emerald-600" />
                          {state !== "collapsed" && <span>Post-Market Surveillance</span>}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isoTooltips["Post-Market Surveillance"] && (
                      <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm">Post-Market Surveillance</p>
                          <p className="text-xs text-muted-foreground">{isoTooltips["Post-Market Surveillance"].role}</p>
                          {isoTooltips["Post-Market Surveillance"].reference && <p className="text-xs font-medium text-primary/80">{isoTooltips["Post-Market Surveillance"].reference}</p>}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {state !== "collapsed" && (
                  <p className="text-xs text-muted-foreground px-3 mt-1 mb-2">
                    Company-wide PMS compliance monitoring and event tracking
                  </p>
                )}
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {state === "collapsed" && <SidebarSeparator className="mx-1 my-1 bg-border" />}
      </>
    );
  }

  // Standard menu items for non-admin roles
  if (!hasAdminPrivileges(userRole)) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <ComplianceInstancesGroup context="standard" userRole={userRole} location={location} currentCompany={currentCompany} singleCompanyName={singleCompanyName} />

            {userRole === "viewer" && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/app/review-panel"} tooltip="Review Panel" size="lg" className="px-3 font-medium text-sm">
                  <Link to="/app/review-panel" className="flex items-center gap-3" onClick={() => onCollapseMenu("Company Dashboard")}>
                    <div className="text-muted-foreground -ml-1.5">
                      <FileSearch className="h-5 w-5" />
                    </div>
                    <span>Review Panel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // No common menu items for admin roles when not in company/product context
  return null;
}