import { useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useProductDetails } from "@/hooks/useProductDetails";
import { ManufacturingForm } from "@/components/product/business-case/ManufacturingForm";
import { Card, CardContent } from "@/components/ui/card";
import { Factory, Loader2, ClipboardCheck, Plus, Cog, Truck, Wrench, Sparkles, Package, Users } from "lucide-react";
import { InvestorShareFlowWrapper } from "@/components/funnel/InvestorShareFlowWrapper";
import { useTranslation } from "@/hooks/useTranslation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { InspectionList } from "@/components/incoming-inspection/InspectionList";
import { InspectionDetailPanel } from "@/components/incoming-inspection/InspectionDetailPanel";
import { InspectionCreateDialog } from "@/components/incoming-inspection/InspectionCreateDialog";
import { useInspectionsByProduct, useInspectionById } from "@/hooks/useIncomingInspection";
import { ProductionOrderList } from "@/components/production/ProductionOrderList";
import { ProductionOrderDetailPanel } from "@/components/production/ProductionOrderDetailPanel";
import { ProductionOrderCreateDialog } from "@/components/production/ProductionOrderCreateDialog";
import { useProductionOrdersByProduct, useProductionOrderById } from "@/hooks/useProduction";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuth } from "@/context/AuthContext";
import { InspectionRecord } from "@/types/incomingInspection";
import { ProductionOrder } from "@/types/production";
import { InstallationServicingTab } from "@/components/operations/InstallationServicingTab";
import { SterilizationCleanlinessTab } from "@/components/operations/SterilizationCleanlinessTab";
import { PreservationHandlingTab } from "@/components/operations/PreservationHandlingTab";
import { CustomerPropertyTab } from "@/components/operations/CustomerPropertyTab";

export default function DeviceOperationsPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const initialTab = searchParams.get("tab") || "supply-chain";
  const isInvestorFlow = returnTo === "investor-share" || returnTo === "genesis" || returnTo === "venture-blueprint";
  const { lang } = useTranslation();
  const { user } = useAuth();

  const { data: product, isLoading } = useProductDetails(productId);
  const { data: inspections = [], isLoading: inspectionsLoading } = useInspectionsByProduct(productId || '');
  const { data: productionOrders = [], isLoading: productionLoading } = useProductionOrdersByProduct(productId || '');
  const { data: suppliers = [] } = useSuppliers(product?.company_id || '');

  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [createInspectionOpen, setCreateInspectionOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  const { data: inspectionDetail } = useInspectionById(selectedInspection?.id || '');
  const { data: orderDetail } = useProductionOrderById(selectedOrder?.id || '');

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
    setSelectedInspection(null);
    setSelectedOrder(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product || !productId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {lang('deviceOperations.page.deviceNotFound')}
        </CardContent>
      </Card>
    );
  }

  const content = (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Factory className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{lang('deviceOperations.page.title')}</h1>
          <p className="text-muted-foreground">
            {lang('deviceOperations.page.subtitle').replace('{{productName}}', product.name)}
          </p>
        </div>
      </div>

      <Tabs value={initialTab} onValueChange={handleTabChange}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="supply-chain" className="gap-2">
            <Truck className="h-4 w-4" />
            {lang('deviceOperations.tabs.supplyChain')}
          </TabsTrigger>
          <TabsTrigger value="incoming-inspection" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            {lang('deviceOperations.tabs.incomingInspection')}
          </TabsTrigger>
          <TabsTrigger value="production" className="gap-2">
            <Cog className="h-4 w-4" />
            {lang('deviceOperations.tabs.production')}
          </TabsTrigger>
          <TabsTrigger value="sterilization-cleanliness" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {lang('deviceOperations.tabs.sterilizationCleanliness')}
          </TabsTrigger>
          <TabsTrigger value="preservation-handling" className="gap-2">
            <Package className="h-4 w-4" />
            {lang('deviceOperations.tabs.preservationHandling')}
          </TabsTrigger>
          <TabsTrigger value="installation-servicing" className="gap-2">
            <Wrench className="h-4 w-4" />
            {lang('deviceOperations.tabs.installationServicing')}
          </TabsTrigger>
          <TabsTrigger value="customer-property" className="gap-2">
            <Users className="h-4 w-4" />
            {lang('deviceOperations.tabs.customerProperty')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supply-chain">
          <ManufacturingForm 
            productId={productId} 
            companyId={product.company_id} 
          />
        </TabsContent>

        <TabsContent value="incoming-inspection">
          {selectedInspection && inspectionDetail ? (
            <InspectionDetailPanel
              inspection={inspectionDetail}
              userId={user?.id || ''}
              onBack={() => setSelectedInspection(null)}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{lang('deviceOperations.inspection.recordsTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{lang('deviceOperations.inspection.isoRef')}</p>
                </div>
                <Button onClick={() => setCreateInspectionOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> {lang('deviceOperations.inspection.newInspection')}
                </Button>
              </div>

              <InspectionList
                inspections={inspections}
                isLoading={inspectionsLoading}
                onInspectionClick={(ins) => setSelectedInspection(ins)}
              />

              <InspectionCreateDialog
                open={createInspectionOpen}
                onOpenChange={setCreateInspectionOpen}
                companyId={product.company_id}
                productId={productId}
                userId={user?.id || ''}
                suppliers={suppliers}
              />
            </div>
          )}
        </TabsContent>


        <TabsContent value="production">
          {selectedOrder && orderDetail ? (
            <ProductionOrderDetailPanel
              order={orderDetail}
              userId={user?.id || ''}
              onBack={() => setSelectedOrder(null)}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{lang('deviceOperations.production.ordersTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{lang('deviceOperations.production.isoRef')}</p>
                </div>
                <Button onClick={() => setCreateOrderOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> {lang('deviceOperations.production.newOrder')}
                </Button>
              </div>

              <ProductionOrderList
                orders={productionOrders}
                isLoading={productionLoading}
                onOrderClick={(o) => setSelectedOrder(o)}
              />

              <ProductionOrderCreateDialog
                open={createOrderOpen}
                onOpenChange={setCreateOrderOpen}
                companyId={product.company_id}
                productId={productId}
                userId={user?.id || ''}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="sterilization-cleanliness">
          <SterilizationCleanlinessTab productId={productId} companyId={product.company_id} />
        </TabsContent>

        <TabsContent value="preservation-handling">
          <PreservationHandlingTab productId={productId} companyId={product.company_id} />
        </TabsContent>

        <TabsContent value="installation-servicing">
          <InstallationServicingTab productId={productId} companyId={product.company_id} />
        </TabsContent>

        <TabsContent value="customer-property">
          <CustomerPropertyTab productId={productId} companyId={product.company_id} />
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isInvestorFlow) {
    return (
      <InvestorShareFlowWrapper productId={productId}>
        {content}
      </InvestorShareFlowWrapper>
    );
  }

  return (
    <div className="py-4 px-4">
      {content}
    </div>
  );
}
