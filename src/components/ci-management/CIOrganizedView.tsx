import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, ChevronRight, Building2, Package, Workflow, FileText } from "lucide-react";
import { CITemplateService } from "@/services/ciTemplateService";
import { CIInstanceService } from "@/services/ciInstanceService";
import { toast } from "sonner";

interface CIItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  status?: string;
  description?: string;
  product_id?: string;
  is_active?: boolean;
  created_at: string;
}

// For now, we'll simulate phase organization
// In the future, this could be enhanced to support actual phase relationships
interface ProductGroup {
  product_id: string;
  product_name: string;
  items: CIItem[];
}

interface CIOrganizedViewProps {
  companyId: string;
  selectedProductId?: string;
}

export function CIOrganizedView({ companyId, selectedProductId }: CIOrganizedViewProps) {
  const [companyWideItems, setCompanyWideItems] = useState<CIItem[]>([]);
  const [productSpecificItems, setProductSpecificItems] = useState<CIItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("templates");
  const [expandedSections, setExpandedSections] = useState({
    companyWide: true,
    productSpecific: true
  });

  useEffect(() => {
    loadCIData();
  }, [companyId, selectedProductId, activeTab]);

  const loadCIData = async () => {
    try {
      setIsLoading(true);
      
      if (activeTab === "templates") {
        await loadTemplates();
      } else {
        await loadInstances();
      }
    } catch (error) {
      console.error("Error loading CI data:", error);
      toast.error("Failed to load CI data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    // Load all company templates (templates are always company-wide, not product-specific)
    const companyTemplates = await CITemplateService.getCompanyTemplates(companyId);
    setCompanyWideItems(companyTemplates);
    setProductSpecificItems([]);
  };

  const loadInstances = async () => {
    // Load company-wide instances (instances without product_id)
    const companyInstances = await CIInstanceService.getCompanyInstances(companyId);
    const companyWide = companyInstances.filter(i => !i.product_id);
    setCompanyWideItems(companyWide);

    if (selectedProductId) {
      // Load product-specific instances
      const productInstances = await CIInstanceService.getProductInstances(selectedProductId);
      setProductSpecificItems(productInstances);
    } else {
      setProductSpecificItems([]);
    }
  };


  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "document":
        return <FileText className="h-4 w-4" />;
      case "audit":
        return <FileText className="h-4 w-4" />;
      case "activity":
        return <Workflow className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "audit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "gap":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "document":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "activity":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const renderCIItem = (item: CIItem) => (
    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        {getTypeIcon(item.type)}
        <div className="flex-1">
          <div className="font-medium">{item.title}</div>
          {item.description && (
            <div className="text-sm text-muted-foreground mt-1">
              {item.description.length > 60
                ? `${item.description.substring(0, 60)}...`
                : item.description}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={getTypeColor(item.type)}>
          {item.type}
        </Badge>
        <Badge variant={getPriorityColor(item.priority)}>
          {item.priority}
        </Badge>
        {activeTab === "instances" && item.status && (
          <Badge variant="outline">
            {item.status.replace("_", " ")}
          </Badge>
        )}
        {activeTab === "templates" && item.is_active !== undefined && (
          <Badge variant={item.is_active ? "default" : "secondary"}>
            {item.is_active ? "Active" : "Inactive"}
          </Badge>
        )}
      </div>
    </div>
  );

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: CIItem[],
    sectionKey: keyof typeof expandedSections,
    showAddButton = true
  ) => (
    <Collapsible
      open={expandedSections[sectionKey]}
      onOpenChange={() => toggleSection(sectionKey)}
    >
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {expandedSections[sectionKey] ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
                {icon}
                <CardTitle className="text-lg">{title}</CardTitle>
                <Badge variant="secondary" className="ml-2">
                  {items.length}
                </Badge>
              </div>
              {showAddButton && (
                <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-sm">
                  No {activeTab} in this section yet
                </div>
                {showAddButton && (
                  <Button size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add {activeTab.slice(0, -1)}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(renderCIItem)}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading CI data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Intelligence</h2>
          <p className="text-muted-foreground">
            Organize CI {activeTab} by company-wide and product-specific scope
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="instances">Instances</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-6">
        {/* Company Wide Section */}
        {renderSection(
          "Company Wide",
          <Building2 className="h-5 w-5" />,
          companyWideItems,
          "companyWide"
        )}

        {/* Product Specific Section */}
        {selectedProductId && (
          <div className="space-y-4">
            <Collapsible
              open={expandedSections.productSpecific}
              onOpenChange={() => toggleSection("productSpecific")}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {expandedSections.productSpecific ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                      <Package className="h-5 w-5" />
                      <CardTitle className="text-lg">Product Specific</CardTitle>
                       <Badge variant="secondary" className="ml-2">
                         {productSpecificItems.length}
                       </Badge>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                   <CardContent className="pt-0 space-y-4">
                     {/* Simple product-specific items for now */}
                     <Card className="bg-muted/30">
                       <CardHeader className="pb-3">
                         <div className="flex items-center gap-2">
                           <FileText className="h-4 w-4" />
                           <CardTitle className="text-base">Product {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</CardTitle>
                           <Badge variant="outline" className="ml-2">
                             {productSpecificItems.length}
                           </Badge>
                         </div>
                       </CardHeader>
                       <CardContent className="pt-0">
                         {productSpecificItems.length === 0 ? (
                           <div className="text-center py-4 text-muted-foreground text-sm">
                             No product-specific {activeTab} yet
                           </div>
                         ) : (
                           <div className="space-y-2">
                             {productSpecificItems.map(renderCIItem)}
                           </div>
                         )}
                       </CardContent>
                     </Card>
                   </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        )}

        {!selectedProductId && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm text-muted-foreground">
                Select a product to view product-specific CI {activeTab}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}