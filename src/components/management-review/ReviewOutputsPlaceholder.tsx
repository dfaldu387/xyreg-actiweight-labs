import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ListChecks, DollarSign, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function ReviewOutputsPlaceholder() {
  const { lang } = useTranslation();

  const features = [
    { icon: ListChecks, title: lang('managementReview.actionTracker'), description: lang('managementReview.actionTrackerDesc') },
    { icon: DollarSign, title: lang('managementReview.resourceAllocation'), description: lang('managementReview.resourceAllocationDesc') },
    { icon: TrendingUp, title: lang('managementReview.qmsImprovements'), description: lang('managementReview.qmsImprovementsDesc') },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {features.map((f) => (
        <Card key={f.title}>
          <CardContent className="pt-6 text-center space-y-3">
            <f.icon className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <h4 className="font-semibold">{f.title}</h4>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
