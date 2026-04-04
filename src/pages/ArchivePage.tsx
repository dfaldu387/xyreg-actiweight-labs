
import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArchivedCompanies } from "@/components/archive/ArchivedCompanies";
import { ArchivedProducts } from "@/components/archive/ArchivedProducts";
import { ArchivedBomRevisions } from "@/components/archive/ArchivedBomRevisions";

export default function ArchivePage() {
  const [activeTab, setActiveTab] = useState<string>("companies");
  
  return (
    <div className="min-h-screen">
      <DashboardHeader /> 
      
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="container mx-auto py-6 px-4 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Archives</h1>
            <p className="text-muted-foreground">Manage archived companies and products</p>
          </div>
          
          <Tabs 
            defaultValue="companies" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="companies">Companies</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="bom">BOM Revisions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="companies" className="space-y-4">
              <ArchivedCompanies />
            </TabsContent>
            
            <TabsContent value="bom" className="space-y-4">
              <ArchivedBomRevisions />
            </TabsContent>
            <TabsContent value="products" className="space-y-4">
              <ArchivedProducts />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
