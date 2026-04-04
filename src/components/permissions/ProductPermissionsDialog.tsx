
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSimpleClients } from "@/hooks/useSimpleClients";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

interface ProductPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  companyId: string;
  companyName: string;
  initialProductAccess?: string[];
  onSave: (productIds: string[]) => void;
}

export function ProductPermissionsDialog({
  open,
  onOpenChange,
  userId,
  userName,
  companyId,
  companyName,
  initialProductAccess = [],
  onSave
}: ProductPermissionsDialogProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(initialProductAccess);
  const { clients, isLoading } = useSimpleClients();

  // Find the specific company and its products
  const company = clients.find(c => c.id === companyId);
  const products = company?.productList || [];

  useEffect(() => {
    setSelectedProducts(initialProductAccess);
  }, [initialProductAccess, open]);

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSave = () => {
    onSave(selectedProducts);
    onOpenChange(false);
    toast.success(`Product permissions updated for ${userName}`);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Product Access for {userName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select which products in {companyName} this user can access
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedProducts.length} of {products.length} products selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <Separator />

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No products found for this company
                </p>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      id={product.id}
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => handleProductToggle(product.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={product.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {product.name}
                      </label>
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
                ))
              )}
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
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
