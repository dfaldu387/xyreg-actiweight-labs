import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { getStatusColor } from '@/utils/statusUtils';
import { detectProductType } from '@/utils/productTypeDetection';

interface PortfolioProductListItemProps {
  product: any;
  isSelected?: boolean;
  onSelectionChange?: (productId: string, selected: boolean) => void;
}

const formatDeviceClassLabel = (deviceClass: string) => {
  const classMap: Record<string, string> = {
    'class-i': 'Class I',
    'class-iia': 'Class IIa',
    'class-iib': 'Class IIb',
    'class-iii': 'Class III',
    'class-is': 'Class Is',
    'class-im': 'Class Im',
    'class-ir': 'Class Ir'
  };
  
  return classMap[deviceClass] || deviceClass;
};

export function PortfolioProductListItem({ 
  product, 
  isSelected = false,
  onSelectionChange 
}: PortfolioProductListItemProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[role="checkbox"]')) {
      return;
    }
    navigate(`/app/product/${product.id}/device-information`);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onSelectionChange?.(product.id, checked as boolean);
  };

  const productType = detectProductType(product);
  
  const getProductTypeLabel = (productType: string, productPlatform?: string) => {
    switch (productType) {
      case 'new_product':
        return 'New Product';
      case 'existing_product':
        return 'Product Upgrade';
      case 'line_extension':
        return productPlatform ? `Line Extension (${productPlatform})` : 'Line Extension';
      default:
        return 'Product';
    }
  };

  const productTypeLabel = getProductTypeLabel(productType, product.product_platform);

  const getProductTypeBorder = (product: any) => {
    const productType = detectProductType(product);
    switch (productType) {
      case 'new_product':
        return 'border-l-blue-500 border-l-4';
      case 'existing_product':
        return 'border-l-green-500 border-l-4';
      case 'line_extension':
        return 'border-l-orange-500 border-l-4';
      default:
        return 'border-l-gray-300 border-l-4';
    }
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-border hover:border-primary/50 hover:shadow-md hover:bg-accent/20'
      } ${getProductTypeBorder(product)}`}
      onClick={handleClick}
    >
      {/* Checkbox */}
      {onSelectionChange && (
        <div className="flex-shrink-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
          />
        </div>
      )}

      {/* Product Info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Name & Trade Name */}
        <div className="md:col-span-3">
          <h3 className="font-bold text-base">{product.name}</h3>
          {(product.trade_name || product.eudamed_trade_names) && (
            <p className="text-sm text-muted-foreground">
              {(() => {
                const tradeName = product.trade_name || product.eudamed_trade_names;
                if (typeof tradeName === 'string') {
                  return tradeName;
                } else if (Array.isArray(tradeName)) {
                  return tradeName.join(', ');
                } else if (typeof tradeName === 'object' && tradeName?.trade_names) {
                  return tradeName.trade_names;
                }
                return tradeName;
              })()}
            </p>
          )}
        </div>

        {/* Type, Phase, Class */}
        <div className="md:col-span-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">
            {productTypeLabel}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {product.phase}
          </Badge>
          {product.class && (
            <Badge variant="secondary" className="text-xs">
              {formatDeviceClassLabel(product.class)}
            </Badge>
          )}
        </div>

        {/* Variant Tags */}
        <div className="md:col-span-2 flex flex-wrap gap-1.5">
          {product.variant_tags && Object.keys(product.variant_tags).length > 0 ? (
            <>
              {Object.entries(product.variant_tags).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {String(value)}
                </Badge>
              ))}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>

        {/* Progress */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Progress
              value={product.progress || 0}
              className="h-2 flex-1"
            />
            <span className="text-sm font-medium whitespace-nowrap min-w-[3rem] text-right">
              {product.progress || 0}%
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="md:col-span-2 flex justify-end">
          <Badge className={`${getStatusColor(product.status)}`}>
            {product.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}
