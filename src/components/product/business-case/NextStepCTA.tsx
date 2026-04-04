import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface NextStepCTAProps {
  productId: string;
  currentStep: 'device-definition' | 'viability-scorecard' | 'venture-blueprint' | 'business-canvas' | 'team-profile';
  isComplete?: boolean;
}

const stepConfig = {
  'device-definition': {
    nextLabel: 'Build Venture Blueprint',
    nextRoute: (id: string) => `/app/product/${id}/business-case?tab=venture-blueprint`,
    completeMessage: 'Device definition complete!',
  },
  'viability-scorecard': {
    nextLabel: 'Build Venture Blueprint',
    nextRoute: (id: string) => `/app/product/${id}/business-case?tab=venture-blueprint`,
    completeMessage: 'Viability inputs complete!',
  },
  'venture-blueprint': {
    nextLabel: 'Fill Business Canvas',
    nextRoute: (id: string) => `/app/product/${id}/business-case?tab=business-canvas`,
    completeMessage: 'Venture blueprint documented!',
  },
  'business-canvas': {
    nextLabel: 'Add Team Profile',
    nextRoute: (id: string) => `/app/product/${id}/business-case?tab=team-profile`,
    completeMessage: 'Business canvas complete!',
  },
  'team-profile': {
    nextLabel: 'Share with Investors',
    nextRoute: (id: string) => `/app/product/${id}/business-case?tab=venture-blueprint`,
    completeMessage: 'Team profile added!',
  },
};

export function NextStepCTA({ productId, currentStep, isComplete = false }: NextStepCTAProps) {
  const navigate = useNavigate();
  const config = stepConfig[currentStep];

  if (!isComplete) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent mt-6">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="font-medium">{config.completeMessage}</p>
              <p className="text-sm text-muted-foreground">
                Continue to the next step
              </p>
            </div>
          </div>
          <Button onClick={() => navigate(config.nextRoute(productId))}>
            {config.nextLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
