import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { MyActionItems } from "../mission-control/MyActionItems";
import { PortfolioHealth } from "../mission-control/PortfolioHealth";
import { ActivityStream } from "../mission-control/ActivityStream";
import { XyregAcademy } from "../mission-control/XyregAcademy";
import { CommunicationHub } from "../mission-control/CommunicationHub";
import { PortfolioSunburst } from "@/components/charts/PortfolioSunburst";
import { computePortfolioTotal } from "@/services/portfolioSunburstService";
import { usePortfolioSunburst } from "@/hooks/usePortfolioSunburst";
import { Skeleton } from "@/components/ui/skeleton";
import { EudamedProductImporter } from "@/components/eudamed/EudamedProductImporter";

export function SingleCompanyDashboard() {
  const { activeCompanyRole } = useCompanyRole();
  const { data: portfolioData, isLoading: portfolioLoading, error: portfolioError } = usePortfolioSunburst(activeCompanyRole?.companyId);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
        <p className="text-muted-foreground">
          {activeCompanyRole?.companyName} - Product portfolio dashboard
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
          <TabsTrigger value="deadlines">Upcoming Deadlines</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="eudamed">EUDAMED Import</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <MyActionItems />
              <ActivityStream />
            </div>
            <div className="space-y-6">
              <PortfolioHealth />
              <XyregAcademy />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-6">
          <MyActionItems showDeadlinesOnly />
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <CommunicationHub scope="company" companyId={activeCompanyRole?.companyId} />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          {portfolioLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : portfolioError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Unable to load portfolio data</p>
            </div>
          ) : portfolioData ? (
            <PortfolioSunburst
              data={portfolioData}
              title={`Product Portfolio Breakdown (Total: ${computePortfolioTotal(portfolioData)} Products)`}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="eudamed" className="space-y-6">
          {activeCompanyRole?.companyId && (
            <EudamedProductImporter
              companyId={activeCompanyRole.companyId}
              companyName={activeCompanyRole.companyName}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}