import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DistributionPattern } from '@/types/siblingGroup';

interface Product {
  id: string;
  name: string;
  trade_name?: string;
  percentage: number;
  position: number;
}

interface BundleGroupDistributionViewerProps {
  groupName: string;
  distributionPattern: DistributionPattern;
  products: Product[];
  totalPercentage: number;
}

const distributionPatternLabels: Record<DistributionPattern, string> = {
  even: 'Even Distribution',
  gaussian_curve: 'Normal Curve',
  empirical_data: 'Custom Distribution',
};

const distributionPatternDescriptions: Record<DistributionPattern, string> = {
  even: 'Each variant has equal probability',
  gaussian_curve: 'Distribution follows a bell curve with middle variants most common',
  empirical_data: 'Distribution based on real-world data or custom percentages',
};

export function BundleGroupDistributionViewer({
  groupName,
  distributionPattern,
  products,
  totalPercentage,
}: BundleGroupDistributionViewerProps) {
  // Sort products by position
  const sortedProducts = [...products].sort((a, b) => a.position - b.position);
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h4 className="font-semibold text-sm mb-1">Distribution Pattern</h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{distributionPatternLabels[distributionPattern]}</Badge>
          <span className="text-xs text-muted-foreground">
            {distributionPatternDescriptions[distributionPattern]}
          </span>
        </div>
      </div>

      {/* Products with percentages */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Variant</span>
          <span>Distribution %</span>
        </div>
        {sortedProducts.map((product) => (
          <div key={product.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate flex-1">
                {product.trade_name || product.name}
              </span>
              <span className="text-xs font-semibold text-primary ml-2">
                {product.percentage}%
              </span>
            </div>
            <Progress value={product.percentage} className="h-2" />
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="pt-3 border-t">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Total Distribution</span>
          <span className={totalPercentage === 100 ? 'text-green-600' : 'text-amber-600'}>
            {totalPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}
