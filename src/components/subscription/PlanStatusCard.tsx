import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Crown, Package, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProductLimits } from '@/hooks/useProductLimits';

interface PlanStatusCardProps {
  className?: string;
}

export function PlanStatusCard({ className }: PlanStatusCardProps) {
  const navigate = useNavigate();
  const { planInfo, isLoading } = useProductLimits();

  if (isLoading || !planInfo) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-2 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { planName, maxProducts, currentCount } = planInfo;
  const usagePercentage = (currentCount / maxProducts) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = currentCount >= maxProducts;

  const getStatusColor = () => {
    if (isAtLimit) return 'text-red-500';
    if (isNearLimit) return 'text-amber-500';
    return 'text-green-500';
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Plan Status
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {planName}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Products</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {currentCount} / {maxProducts === -1 ? '∞' : maxProducts}
            </span>
          </div>
          
          {maxProducts !== -1 && (
            <Progress 
              value={usagePercentage} 
              className="h-2"
            />
          )}
        </div>

        {isAtLimit && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">
              You've reached your plan limit
            </span>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-700">
              Approaching plan limit
            </span>
          </div>
        )}

        {(isAtLimit || isNearLimit) && (
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => navigate('/pricing')}
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
