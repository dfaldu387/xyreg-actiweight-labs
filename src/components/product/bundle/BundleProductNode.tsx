import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Handle, Position } from '@xyflow/react';
import { Package } from 'lucide-react';

interface BundleProductNodeProps {
  data: {
    productId?: string;
    name: string;
    image?: string;
    relationshipType: string;
    isPrimary: boolean;
    multiplier?: number;
    quantity?: number;
    consumptionRate?: number;
    consumptionPeriod?: string;
    isGroup?: boolean;
    productCount?: number;
    distributionPattern?: string;
    variantProducts?: Array<{
      id: string;
      name: string;
      percentage?: number;
    }>;
  };
}

const RELATIONSHIP_COLORS = {
  component: '#3b82f6',
  accessory: '#10b981',
  consumable: '#f59e0b',
  required: '#ef4444',
  optional: '#8b5cf6',
  replacement_part: '#6b7280',
};

export function BundleProductNode({ data }: BundleProductNodeProps) {
  const navigate = useNavigate();
  const size = data.isPrimary ? 120 : 80;
  const borderColor = RELATIONSHIP_COLORS[data.relationshipType as keyof typeof RELATIONSHIP_COLORS] || '#6b7280';

  const handleClick = () => {
    if (data.productId) {
      navigate(`/app/product/${data.productId}/device-information`);
    }
  };

  const formatConsumptionPeriod = (period: string) => {
    return period.replace('per_', '/');
  };

  const getDistributionPatternLabel = (pattern?: string) => {
    if (!pattern) return null;
    switch (pattern) {
      case 'even':
        return 'Equal';
      case 'gaussian_curve':
        return 'Gaussian';
      case 'empirical_data':
        return 'Custom';
      default:
        return null;
    }
  };

  const distributionLabel = getDistributionPatternLabel(data.distributionPattern);

  return (
    <div className="relative group flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      
      <div
        className="rounded-full overflow-hidden bg-background shadow-lg flex items-center justify-center relative cursor-pointer hover:shadow-xl transition-shadow"
        style={{
          width: size,
          height: size,
          border: `4px solid ${borderColor}`,
        }}
        onClick={handleClick}
      >
        {data.image ? (
          <img
            src={data.image}
            alt={data.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-1/2 h-1/2 text-muted-foreground" />
        )}
        
        {/* Multiplier Badge */}
        {data.multiplier && data.multiplier !== 1 && (
          <div className="absolute top-0 right-0 bg-background border-2 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            ×{data.multiplier}
          </div>
        )}
        
        {/* Primary Badge */}
        {data.isPrimary && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
            Primary
          </div>
        )}
      </div>
      
      {/* Product Name, Group Info, and Volume Info */}
      <div className="mt-2 text-center max-w-[140px]">
        <div className="text-xs font-medium line-clamp-2">
          {data.name}
          {data.isGroup && data.productCount !== undefined && (
            <span className="block text-[10px] text-muted-foreground mt-0.5">
              ({data.productCount} product{data.productCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        
        {/* Distribution Pattern Badge */}
        {distributionLabel && (
          <div className="mt-1">
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {distributionLabel}
            </span>
          </div>
        )}
        
        {/* Volume Display */}
        {(data.multiplier && data.multiplier !== 1) || data.quantity ? (
          <div className="text-xs font-semibold text-primary mt-1">
            {data.multiplier && data.multiplier !== 1 ? `×${data.multiplier}` : `Qty: ${data.quantity}`}
          </div>
        ) : null}
        
        {/* Consumption Rate for Consumables */}
        {data.consumptionRate && data.consumptionPeriod && (
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
            {data.consumptionRate} {formatConsumptionPeriod(data.consumptionPeriod)}
          </div>
        )}
      </div>
    </div>
  );
}
