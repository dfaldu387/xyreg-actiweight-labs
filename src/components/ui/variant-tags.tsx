import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface VariantAttribute {
  dimensionName: string;
  optionName: string;
  dimensionId: string;
  optionId: string;
}

export interface VariantTagsProps {
  variants: VariantAttribute[];
  size?: 'sm' | 'default';
}

const getTagColor = (dimensionName: string): string => {
  const normalizedName = dimensionName.toLowerCase();
  
  if (normalizedName.includes('tech') || normalizedName.includes('level')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
  }
  if (normalizedName.includes('color') || normalizedName.includes('colour')) {
    return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
  }
  if (normalizedName.includes('recharg') || normalizedName.includes('battery')) {
    return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
  }
  if (normalizedName.includes('power') || normalizedName.includes('watt')) {
    return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
  }
  
  // Default color for other dimensions
  return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
};

export function VariantTags({ variants, size = 'default' }: VariantTagsProps) {
  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {variants.map((variant, index) => (
        <Badge
          key={`${variant.dimensionId}-${variant.optionId}-${index}`}
          variant="outline"
          className={`${getTagColor(variant.dimensionName)} ${
            size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs'
          }`}
          title={`${variant.dimensionName}: ${variant.optionName}`}
        >
          {variant.optionName}
        </Badge>
      ))}
    </div>
  );
}