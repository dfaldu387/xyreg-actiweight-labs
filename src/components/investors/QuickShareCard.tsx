import React, { useState } from 'react';
import { Share2, CheckCircle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InvestorShareDialog } from '@/components/company/InvestorShareDialog';
import { useInvestorShareSettings } from '@/hooks/useInvestorShareSettings';
import { useTranslation } from '@/hooks/useTranslation';

interface QuickShareCardProps {
  companyId: string;
  companyName: string;
  disabled?: boolean;
}

export function QuickShareCard({ companyId, companyName, disabled = false }: QuickShareCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { settings, isLoading } = useInvestorShareSettings(companyId);
  const { lang } = useTranslation();

  const isActive = settings?.is_active ?? false;
  const hasLink = !!settings?.public_slug;

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{lang('commercial.investors.quickShare.title')}</CardTitle>
                <CardDescription>
                  {lang('commercial.investors.quickShare.description')}
                </CardDescription>
              </div>
            </div>
            {hasLink && (
              <Badge variant={isActive ? "default" : "secondary"} className="ml-2">
                {isActive ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {lang('commercial.investors.quickShare.active')}
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    {lang('commercial.investors.quickShare.inactive')}
                  </>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasLink ? (
                isActive ? (
                  <span className="text-primary font-medium">{lang('commercial.investors.quickShare.linkLive')}</span>
                ) : (
                  <span>{lang('commercial.investors.quickShare.linkInactive')}</span>
                )
              ) : (
                <span>{lang('commercial.investors.quickShare.createLink')}</span>
              )}
            </div>
            <Button onClick={() => !disabled && setShowDialog(true)} size="lg" disabled={disabled}>
              <Share2 className="h-4 w-4 mr-2" />
              {hasLink ? lang('commercial.investors.quickShare.manageLink') : lang('commercial.investors.quickShare.shareWithInvestors')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <InvestorShareDialog
        companyId={companyId}
        companyName={companyName}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}
