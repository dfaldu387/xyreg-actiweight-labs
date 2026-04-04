
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Building2, Package } from "lucide-react";
import { useSimpleClients } from "@/hooks/useSimpleClients";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

interface MultiLevelPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  initialCompanyAccess?: string[];
  initialProductAccess?: Record<string, string[]>;
  onSave: (companyIds: string[], productAccess: Record<string, string[]>) => void;
}

export function MultiLevelPermissionsDialog({
  open,
  onOpenChange,
  userId,
  userName,
  initialCompanyAccess = [],
  initialProductAccess = {},
  onSave
}: MultiLevelPermissionsDialogProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(initialCompanyAccess);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string[]>>(initialProductAccess);
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([]);
  const { clients, isLoading } = useSimpleClients();

  useEffect(() => {
    setSelectedCompanies(initialCompanyAccess);
    setSelectedProducts(initialProductAccess);
    // Auto-expand companies that have products selected
    setExpandedCompanies(Object.keys(initialProductAccess));
  }, [initialCompanyAccess, initialProductAccess, open]);

  const handleCompanyToggle = (companyId: string) => {
    const isCurrentlySelected = selectedCompanies.includes(companyId);
    
    if (isCurrentlySelected) {
      // Remove company and all its products
      setSelectedCompanies(prev => prev.filter(id => id !== companyId));
      setSelectedProducts(prev => {
        const updated = { ...prev };
        delete updated[companyId];
        return updated;
      });
    } else {
      // Add company
      setSelectedCompanies(prev => [...prev, companyId]);
      // Expand to show products
      if (!expandedCompanies.includes(companyId)) {
        setExpandedCompanies(prev => [...prev, companyId]);
      }
    }
  };

  const handleProductToggle = (companyId: string, productId: string) => {
    setSelectedProducts(prev => {
      const companyProducts = prev[companyId] || [];
      const updated = { ...prev };
      
      if (companyProducts.includes(productId)) {
        updated[companyId] = companyProducts.filter(id => id !== productId);
        if (updated[companyId].length === 0) {
          delete updated[companyId];
        }
      } else {
        updated[companyId] = [...companyProducts, productId];
      }
      
      return updated;
    });
  };

  const handleCompanyExpand = (companyId: string) => {
    setExpandedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSave = () => {
    onSave(selectedCompanies, selectedProducts);
    onOpenChange(false);
    toast.success(`Permissions updated for ${userName}`);
  };

  const getTotalSelectedProducts = () => {
    return Object.values(selectedProducts).reduce((total, products) => total + products.length, 0);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Multi-Level Permissions for {userName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Grant access to companies and specific products within those companies
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{selectedCompanies.length} companies selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{getTotalSelectedProducts()} products selected</span>
            </div>
          </div>

          <Separator />

          <ScrollArea className="h-96">
            <div className="space-y-2">
              {clients.map((company) => {
                const isCompanySelected = selectedCompanies.includes(company.id);
                const isExpanded = expandedCompanies.includes(company.id);
                const companyProducts = selectedProducts[company.id] || [];
                
                return (
                  <div key={company.id} className="border rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={isCompanySelected}
                        onCheckedChange={() => handleCompanyToggle(company.id)}
                      />
                      <Collapsible open={isExpanded} onOpenChange={() => handleCompanyExpand(company.id)}>
                        <CollapsibleTrigger className="flex items-center space-x-2 hover:bg-muted/50 p-1 rounded">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <Building2 className="h-4 w-4" />
                          <span className="font-medium">{company.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {company.products} products
                          </Badge>
                          {companyProducts.length > 0 && (
                            <Badge className="text-xs bg-blue-100 text-blue-800">
                              {companyProducts.length} selected
                            </Badge>
                          )}
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="mt-2 ml-6 space-y-2">
                          {(company.productList || []).map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={companyProducts.includes(product.id)}
                                onCheckedChange={() => handleProductToggle(company.id, product.id)}
                                disabled={!isCompanySelected}
                              />
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <span className="text-sm">{product.name}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {product.status || 'Unknown'}
                                  </Badge>
                                  {product.progress !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      {product.progress}% complete
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!company.productList || company.productList.length === 0) && (
                            <p className="text-sm text-muted-foreground ml-6">
                              No products found
                            </p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Permissions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
