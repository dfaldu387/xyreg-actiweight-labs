import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Building2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PhaseDocumentsTab } from "@/components/settings/document-control/PhaseDocumentsTab";
import { ViewerProductDocuments } from "./ViewerProductDocuments";
import { DocumentCIOrganizedView } from "@/components/settings/document-control/DocumentCIOrganizedView";
import { useTranslation } from "@/hooks/useTranslation";

interface ViewerDocumentsSectionProps {
  companyName: string;
}

interface CompanyData {
  id: string;
  name: string;
}

interface ProductData {
  id: string;
  name: string;
  company_id: string;
}

export function ViewerDocumentsSection({ companyName }: ViewerDocumentsSectionProps) {
  const { lang } = useTranslation();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("company");

  useEffect(() => {
    const fetchCompanyAndProducts = async () => {
      if (!companyName) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch company data
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("id, name")
          .eq("name", companyName)
          .single();

        if (companyError || !company) {
          throw new Error(`Company not found: ${companyName}`);
        }

        setCompanyData(company);

        // Fetch products for this company
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, company_id")
          .eq("company_id", company.id);

        if (productsError) {
          console.error("Error fetching products:", productsError);
          setProducts([]);
        } else {
          // Filter and sort products
          const activeProducts = (productsData || [])
            .filter(p => p.company_id === company.id)
            .sort((a, b) => a.name.localeCompare(b.name));
          setProducts(activeProducts);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load data";
        setError(errorMessage);
        console.error("Error in fetchCompanyAndProducts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyAndProducts();
  }, [companyName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2">{lang('viewerDocuments.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!companyData) {
    return (
      <Alert>
        <AlertDescription>{lang('viewerDocuments.noCompanyData')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{lang('viewerDocuments.documentsAndFiles')}</h3>
          <p className="text-sm text-muted-foreground">
            {lang('viewerDocuments.viewDocumentsDescription')}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {lang('viewerDocuments.company')}: {companyData.name}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {lang('viewerDocuments.products')}: {products.length}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {lang('viewerDocuments.companyDocuments')}
          </TabsTrigger>
          <TabsTrigger value="cis" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {lang('viewerDocuments.documentCIs')}
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {lang('viewerDocuments.productDocuments')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {lang('viewerDocuments.companyWideDocuments')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhaseDocumentsTab 
                companyId={companyData.id}
                companyName={companyName}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cis" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <DocumentCIOrganizedView 
                companyId={companyData.id}
                onDocumentUpdated={() => {
                  // Refresh callback - could be expanded if needed
                }}
                viewerMode={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {products.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{lang('viewerDocuments.noProductsFound')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                   <CardContent>
                     <ViewerProductDocuments 
                       productId={product.id}
                       productName={product.name}
                     />
                   </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}