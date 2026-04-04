import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlanLimitWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  currentProductCount: number;
  maxProducts: number;
  planName: string;
}

export function PlanLimitWarningModal({
  open,
  onOpenChange,
  currentPlan,
  currentProductCount,
  maxProducts,
  planName
}: PlanLimitWarningModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  const getUpgradeRecommendation = () => {
    // Normalize the current plan name for comparison
    const normalizedPlan = currentPlan.toLowerCase().replace(/\s+/g, '_');
    
    switch (normalizedPlan) {
      case 'mvp_(core_build)':
      case 'mvp':
        return {
          recommendedPlan: 'Basic Plan',
          features: ['2 Products', 'Up to 10 Users', 'Reviewer Groups', 'Product Upgrades & Line Extensions'],
          price: '$99.99/month'
        };
      case 'basic_plan':
      case 'basic':
        return {
          recommendedPlan: 'Pro Plan',
          features: ['5 Products', 'Up to 25 Users', 'Multi-Company Client Compass', 'Intelligent Classification Engine'],
          price: '$99/month'
        };
      case 'pro_plan':
      case 'pro':
        return {
          recommendedPlan: 'Enterprise Plan',
          features: ['10 Products', 'Unlimited Users', 'API Access', 'White-Labeling'],
          price: '$299/month'
        };
      default:
        return {
          recommendedPlan: 'Pro Plan',
          features: ['5 Products', 'Up to 25 Users', 'Advanced Features'],
          price: '$99/month'
        };
    }
  };

  const recommendation = getUpgradeRecommendation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Plan Limit Reached</DialogTitle>
          </div>
          <DialogDescription>
            You've reached the maximum number of products allowed for your current plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Plan</span>
              <Badge variant="outline">{planName}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentProductCount} of {maxProducts} products used
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-medium">Recommended Upgrade</span>
            </div>
            
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{recommendation.recommendedPlan}</span>
                <span className="text-sm font-semibold text-primary">{recommendation.price}</span>
              </div>
              
              <div className="space-y-1">
                {recommendation.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1 h-1 bg-primary rounded-full" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handleUpgrade}
            className="w-full sm:w-auto"
          >
            Upgrade Plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
