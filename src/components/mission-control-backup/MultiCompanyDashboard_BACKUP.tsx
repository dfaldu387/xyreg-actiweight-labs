import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { MyActionItems } from "../mission-control/MyActionItems";
import { ActivityStream } from "../mission-control/ActivityStream";
import { CommunicationHub } from "../mission-control/CommunicationHub";
import { PortfolioHealth } from "../mission-control/PortfolioHealth";

interface CompanyStatus {
  id: string;
  name: string;
  status: 'on-track' | 'needs-attention' | 'at-risk';
  productCount: number;
  urgentTasks: number;
}

export function MultiCompanyDashboard() {
  const navigate = useNavigate();
  const { companyRoles } = useCompanyRole();

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Mission Control</h1>
          <p className="text-muted-foreground">
            Portfolio overview across {companyRoles.length} companies
          </p>
        </div>
        <Button onClick={() => navigate('/app/clients')} className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          View All Companies
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
          <TabsTrigger value="deadlines">Upcoming Deadlines</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Portfolio Health and Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            <PortfolioHealth dashboardType="multi-company" />
            <div className="space-y-6">
              <MyActionItems />
              <ActivityStream />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-6">
          <MyActionItems showDeadlinesOnly />
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <CommunicationHub scope="multi-company" />
        </TabsContent>
      </Tabs>
    </div>
  );
}