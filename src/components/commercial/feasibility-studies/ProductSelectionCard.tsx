import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Product {
  id: string;
  name: string;
  trade_name?: string;
  description?: string;
  images?: string[];
  regulatory_class?: string;
}

interface ProductSelectionCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: () => void;
}

export function ProductSelectionCard({
  product,
  isSelected,
  onSelect,
}: ProductSelectionCardProps) {
  const { lang } = useTranslation();
  const displayName = product.trade_name || product.name;
  const thumbnail =
    product.images && product.images.length > 0 ? product.images[0] : null;
  const isLongTitle = displayName.length > 60;
  const isLongDescription = (product.description?.length || 0) > 80;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3 pr-1">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={displayName}
              className="w-16 h-16 object-cover rounded shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center shrink-0">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`font-semibold min-w-0 ${
                  isLongTitle ? "line-clamp-2" : "truncate"
                }`}
              >
                {displayName}
              </h3>
              {isSelected && (
                <Badge variant="default" className="shrink-0">
                  {lang('commercial.feasibilityStudies.selected')}
                </Badge>
              )}
            </div>
            {product.trade_name && product.name !== product.trade_name && (
              <p className="text-xs text-muted-foreground truncate">
                {product.name}
              </p>
            )}
            <p
              className={`text-sm text-muted-foreground mt-1 ${isLongDescription ? "line-clamp-3" : ""}`}
            >
              {product.description || lang('commercial.feasibilityStudies.noDescription')}
            </p>
            {product.regulatory_class && (
              <Badge variant="outline" className="mt-2">
                {product.regulatory_class}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
