import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, ArrowRight } from "lucide-react";
import { useProductNavigation } from "@/hooks/useProductNavigation";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export function RecentlyViewedProductsDropdown() {
  const navigate = useNavigate();
  const { getRecentlyViewedProducts } = useProductNavigation();
  const [recentProducts, setRecentProducts] = React.useState<any[]>([]);
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
    try {
      const products = getRecentlyViewedProducts();
      setRecentProducts(products || []);
    } catch (error) {
      console.warn('Error getting recent products:', error);
      setRecentProducts([]);
    }
  }, [getRecentlyViewedProducts]);
  
  const handleProductClick = (productPath: string) => {
    navigate(productPath);
  };

  // Don't render if not on client or no recent products
  if (!isClient || !recentProducts || recentProducts.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Clock className="h-4 w-4" />
          Recently Viewed
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-background border shadow-md">
        <DropdownMenuLabel>Recently Viewed Products</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {recentProducts.map((product, index) => {
            const timeAgo = formatDistanceToNow(new Date(product.timestamp), { addSuffix: true });
            
            return (
              <DropdownMenuItem
                key={product.productId}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                onClick={() => handleProductClick(product.fullPath)}
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="font-medium truncate">{product.productName}</div>
                  <div className="text-sm text-muted-foreground truncate">{product.companyName}</div>
                  <div className="text-xs text-muted-foreground">{timeAgo}</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}