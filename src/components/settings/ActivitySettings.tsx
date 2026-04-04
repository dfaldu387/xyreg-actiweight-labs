import React from 'react';
import { ActivityLibraryTab } from '@/components/activities/ActivityLibraryTab';
import { DesignReviewTemplateSelector } from '@/components/design-review/DesignReviewTemplateSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';

interface ActivitySettingsProps {
  companyId: string;
}

export function ActivitySettings({ companyId }: ActivitySettingsProps) {
  const { lang } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{lang('companySettings.activities.title')}</h1>
        <p className="text-muted-foreground">
          {lang('companySettings.activities.subtitle')}
        </p>
      </div>

      <DesignReviewTemplateSelector
        companyId={companyId}
        currentPhase="concept"
        onTemplateSelect={(useTemplate, data) => {
          // This is just for preview in settings
          
        }}
      />

      <Separator />

      <ActivityLibraryTab />
    </div>
  );
}