import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { buildCompanyBreadcrumbs } from "@/utils/breadcrumbUtils";
import { ViewerDocumentsSection } from "@/components/viewer/ViewerDocumentsSection";
import { ViewerGapAnalysisSection } from "@/components/viewer/ViewerGapAnalysisSection";
import { FileText, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ViewerCompliancePage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("documents");
  
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`);
  };

  const breadcrumbs = buildCompanyBreadcrumbs(
    decodedCompanyName,
    "Compliance Instances",
    handleNavigateToClients,
    handleNavigateToCompany
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${decodedCompanyName} - Compliance Instances`}
        subtitle="View company and product documents and gap analysis"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <Card className="h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="p-6 pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="gap-analysis" className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Gap Analysis
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="documents" className="h-full m-0 p-6">
                <ViewerDocumentsSection companyName={decodedCompanyName} />
              </TabsContent>

              <TabsContent value="gap-analysis" className="h-full m-0 p-6">
                <ViewerGapAnalysisSection companyName={decodedCompanyName} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}