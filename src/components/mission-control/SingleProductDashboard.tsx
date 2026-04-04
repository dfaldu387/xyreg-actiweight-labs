import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRight, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MyActionItems } from "./MyActionItems";
import { ActivityStream } from "./ActivityStream";
import { CommunicationHub } from "./CommunicationHub";
import { ViabilityFunnelWidget } from "./ViabilityFunnelWidget";

interface SingleProductDashboardProps {
  productId: string;
  companyId: string;
}

export function SingleProductDashboard({ productId, companyId }: SingleProductDashboardProps) {
  const navigate = useNavigate();

  // Mock product data - replace with real data
  const productData = {
    id: productId,
    name: "HeartGuard Pro X1",
    status: "In Development",
    progress: 67,
    currentPhase: "Design Verification",
    upcomingMilestone: "FDA 510(k) Submission",
    milestoneDate: "2024-03-15"
  };

  const handleViewProduct = () => {
    navigate(`/app/product/${productId}`);
  };

  const handleViewCompanyStatus = () => {
    navigate(`/app/mission-control`);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Mission Control</h1>
          <p className="text-muted-foreground">
            Focused dashboard for {productData.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleViewCompanyStatus} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Building className="h-4 w-4" />
            Company Status
          </Button>
          <Button onClick={handleViewProduct} className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            View Full Product
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Viability Funnel Progress Tracker */}
      <ViabilityFunnelWidget productId={productId} companyId={companyId} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Product Overview</TabsTrigger>
          <TabsTrigger value="deadlines">Upcoming Deadlines</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Product Health Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {productData.name} Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <p className="font-semibold">{productData.status}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current Phase</p>
                  <p className="font-semibold">{productData.currentPhase}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Next Milestone</p>
                  <p className="font-semibold">{productData.upcomingMilestone}</p>
                  <p className="text-sm text-muted-foreground">{productData.milestoneDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Items and Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            <MyActionItems productId={productId} />
            <ActivityStream productId={productId} />
          </div>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-6">
          <MyActionItems productId={productId} showDeadlinesOnly />
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <CommunicationHub scope="product" productId={productId} companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}