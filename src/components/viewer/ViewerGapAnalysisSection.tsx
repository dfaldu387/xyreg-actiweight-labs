import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart2, Building2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GapAnalysis } from "@/components/product/GapAnalysis";
import { fetchCompanyGapItems } from "@/services/gapAnalysisService";
import { GapAnalysisItem } from "@/types/client";
import { iso13485 } from "@/data/gapAnalysisItems";

interface ViewerGapAnalysisSectionProps {
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
  gapAnalysis?: GapAnalysisItem[];
}

export function ViewerGapAnalysisSection({ companyName }: ViewerGapAnalysisSectionProps) {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [companyGapItems, setCompanyGapItems] = useState<GapAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("company");

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch company gap analysis items
        try {
          const gapItems = await fetchCompanyGapItems(company.id);
          setCompanyGapItems(gapItems.length > 0 ? gapItems : iso13485);
        } catch (gapError) {
          console.error("Error fetching company gap items:", gapError);
          setCompanyGapItems(iso13485);
        }

        // Fetch products (gap analysis data comes from separate service)
        const productsResult = await (supabase as any)
          .from("products")
          .select("id, name, company_id")
          .eq("company_id", company.id)
          .eq("archived", false)
          .order("name");
        
        const { data: productsData, error: productsError } = productsResult;

        if (productsError) {
          console.error("Error fetching products:", productsError);
        } else {
          // For now, set empty gap analysis - this would need a proper service to fetch product gap analysis
          const processedProducts = (productsData || []).map(product => ({
            ...product,
            gapAnalysis: [] as GapAnalysisItem[]
          }));
          setProducts(processedProducts);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load gap analysis data";
        setError(errorMessage);
        console.error("Error in fetchData:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyName]);

  const handleRefreshCompanyGap = async () => {
    if (!companyData) return;
    
    try {
      const gapItems = await fetchCompanyGapItems(companyData.id);
      setCompanyGapItems(gapItems.length > 0 ? gapItems : iso13485);
    } catch (error) {
      console.error("Error refreshing company gap analysis:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading gap analysis...</span>
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
        <AlertDescription>No company data available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gap Analysis</h3>
          <p className="text-sm text-muted-foreground">
            View compliance gaps for company and products
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Company: {companyData.name}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            Products: {products.length}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Gap Analysis
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Product Gap Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Company-wide ISO 13485 Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
                    <GapAnalysis 
                      items={companyGapItems}
                      showDetailedView={true}
                      showOnlyIso13485={true}
                      companyId={companyData.id}
                      onRefresh={handleRefreshCompanyGap}
                    />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {products.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No products found for this company.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {product.name} - Gap Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GapAnalysis 
                      items={product.gapAnalysis || []}
                      showDetailedView={false}
                      productId={product.id}
                      companyId={companyData.id}
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