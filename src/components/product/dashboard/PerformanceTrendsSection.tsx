import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { Product } from '@/types/client';

interface PerformanceTrendsSectionProps {
  product: Product;
}

export function PerformanceTrendsSection({ product }: PerformanceTrendsSectionProps) {
  // Mock performance trends data - in real implementation, this would come from hooks/services
  const trends = {
    deliverySpeed: 15, // percentage improvement
    qualityScore: 92,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Delivery/Speed</span>
          </div>
          <span className="text-green-600 font-bold">+{trends.deliverySpeed}%</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Quality Score</span>
          </div>
          <span className="text-blue-600 font-bold">{trends.qualityScore}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

