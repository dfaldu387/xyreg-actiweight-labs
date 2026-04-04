import React from 'react';
import { Lock, FileKey, Users, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface DataRoomsUpgradeCardProps {
  companyName: string;
}

export function DataRoomsUpgradeCard({ companyName }: DataRoomsUpgradeCardProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();

  const features = [
    {
      icon: FileKey,
      title: lang('commercial.investors.upgrade.customDataRooms'),
      description: lang('commercial.investors.upgrade.customDataRoomsDesc')
    },
    {
      icon: Users,
      title: lang('commercial.investors.upgrade.granularAccess'),
      description: lang('commercial.investors.upgrade.granularAccessDesc')
    },
    {
      icon: Shield,
      title: lang('commercial.investors.upgrade.security'),
      description: lang('commercial.investors.upgrade.securityDesc')
    },
    {
      icon: TrendingUp,
      title: lang('commercial.investors.upgrade.analytics'),
      description: lang('commercial.investors.upgrade.analyticsDesc')
    }
  ];

  return (
    <Card className="border-muted bg-muted/20 relative overflow-hidden">
      {/* Watermark effect */}
      {/* <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <Lock className="h-64 w-64" />
      </div> */}

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
              <FileKey className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg text-muted-foreground">{lang('commercial.investors.upgrade.title')}</CardTitle>
              <CardDescription>
                {lang('commercial.investors.upgrade.description')}
              </CardDescription>
            </div>
          </div>
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 opacity-60">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <feature.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">{feature.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium">{lang('commercial.investors.upgrade.availableOn')}</p>
            <p className="text-xs text-muted-foreground">
              {lang('commercial.investors.upgrade.manageMultiple')}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate(`/app/company/${encodeURIComponent(companyName)}/pricing`)}
            className="whitespace-nowrap"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {lang('commercial.investors.upgrade.upgradeTo')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
