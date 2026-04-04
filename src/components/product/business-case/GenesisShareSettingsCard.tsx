import React, { useState } from 'react';
import { 
  Share2, CheckCircle, Lock, ExternalLink, Settings, TrendingUp, FlaskConical, 
  Globe, Eye, Activity, Copy, Gauge, Cpu, Image, LayoutGrid, Map, Calendar, 
  Users, Flame, Circle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InvestorShareDialog } from '@/components/company/InvestorShareDialog';
import { useInvestorShareSettings } from '@/hooks/useInvestorShareSettings';
import { getInvestorShareUrl, getInvestorMonitorUrl } from '@/services/investorShareService';
import { toast } from 'sonner';

interface GenesisShareSettingsCardProps {
  companyId: string;
  companyName: string;
  productId: string;
}

export function GenesisShareSettingsCard({ companyId, companyName, productId }: GenesisShareSettingsCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { settings, isLoading } = useInvestorShareSettings(companyId);

  const isActive = settings?.is_active ?? false;
  const hasLink = !!settings?.public_slug;
  const shareUrl = settings?.public_slug ? getInvestorShareUrl(settings.public_slug) : null;
  const monitorUrl = settings?.public_slug ? getInvestorMonitorUrl(settings.public_slug) : null;

  // Snapshot settings
  const snapshotSettings = {
    show_viability_score: settings?.show_viability_score ?? true,
    show_technical_specs: settings?.show_technical_specs ?? true,
    show_media_gallery: settings?.show_media_gallery ?? true,
    show_business_canvas: settings?.show_business_canvas ?? true,
    show_roadmap: settings?.show_roadmap ?? true,
    show_team_profile: settings?.show_team_profile ?? false,
    show_venture_blueprint: settings?.show_venture_blueprint ?? true,
  };

  // Monitor settings
  const monitorSettings = {
    show_rnpv: settings?.show_rnpv ?? false,
    show_burn_rate: settings?.show_burn_rate ?? false,
    show_clinical_enrollment: settings?.show_clinical_enrollment ?? true,
    show_regulatory_status_map: settings?.show_regulatory_status_map ?? true,
  };

  const enabledSnapshotCount = Object.values(snapshotSettings).filter(Boolean).length;
  const enabledMonitorCount = Object.values(monitorSettings).filter(Boolean).length;

  const copyToClipboard = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    toast.success(`${label} copied to clipboard`);
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
        </CardHeader>
      </Card>
    );
  }

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
                <CardTitle className="text-lg">Share Settings</CardTitle>
                <CardDescription>
                  Configure links, visibility, and what investors can access
                </CardDescription>
              </div>
            </div>
            {hasLink && (
              <Badge 
                variant={isActive ? "default" : "secondary"}
                className={isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
              >
                {isActive ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Share Links Section */}
          {hasLink && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Share Links
              </div>
              
              {/* Snapshot Link */}
              {shareUrl && (
                <div className="flex items-center gap-3 group">
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Eye className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Snapshot</span>
                  </div>
                  <code className="flex-1 text-sm bg-muted/50 px-3 py-2 rounded-md truncate font-mono">
                    {shareUrl}
                  </code>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(shareUrl, 'Snapshot link')}
                      className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.open(shareUrl, '_blank')}
                      className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Monitor Link */}
              {monitorUrl && enabledMonitorCount > 0 && (
                <div className="flex items-center gap-3 group">
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Activity className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Monitor</span>
                  </div>
                  <code className="flex-1 text-sm bg-muted/50 px-3 py-2 rounded-md truncate font-mono">
                    {monitorUrl}
                  </code>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(monitorUrl, 'Monitor link')}
                      className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.open(monitorUrl, '_blank')}
                      className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Two-column Settings Summary */}
          {hasLink && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Investor Snapshot Column */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Investor Snapshot</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                    {enabledSnapshotCount}/7
                  </Badge>
                </div>
                <div className="space-y-2">
                  <SettingItem enabled={snapshotSettings.show_viability_score} label="Viability Score" icon={<Gauge className="h-3.5 w-3.5" />} accentColor="primary" />
                  <SettingItem enabled={snapshotSettings.show_technical_specs} label="Technical Specs" icon={<Cpu className="h-3.5 w-3.5" />} accentColor="primary" />
                  <SettingItem enabled={snapshotSettings.show_media_gallery} label="Media Gallery" icon={<Image className="h-3.5 w-3.5" />} accentColor="primary" />
                  <SettingItem enabled={snapshotSettings.show_business_canvas} label="Business Canvas" icon={<LayoutGrid className="h-3.5 w-3.5" />} accentColor="primary" />
                  <SettingItem enabled={snapshotSettings.show_venture_blueprint} label="Strategic Blueprint" icon={<Map className="h-3.5 w-3.5" />} accentColor="primary" />
                  <SettingItem enabled={snapshotSettings.show_roadmap} label="Roadmap" icon={<Calendar className="h-3.5 w-3.5" />} accentColor="primary" />
                  <SettingItem enabled={snapshotSettings.show_team_profile} label="Team Profile" icon={<Users className="h-3.5 w-3.5" />} accentColor="primary" />
                </div>
              </div>

              {/* Continuous Monitor Column */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="font-semibold text-sm">Continuous Monitor</span>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">
                    {enabledMonitorCount}/4
                  </Badge>
                </div>
                <div className="space-y-2">
                  <SettingItem enabled={monitorSettings.show_rnpv} label="rNPV Valuation" icon={<TrendingUp className="h-3.5 w-3.5" />} accentColor="emerald" />
                  <SettingItem enabled={monitorSettings.show_burn_rate} label="Burn Rate & Runway" icon={<Flame className="h-3.5 w-3.5" />} accentColor="emerald" />
                  <SettingItem enabled={monitorSettings.show_clinical_enrollment} label="Clinical Enrollment" icon={<FlaskConical className="h-3.5 w-3.5" />} accentColor="emerald" />
                  <SettingItem enabled={monitorSettings.show_regulatory_status_map} label="Regulatory Status Map" icon={<Globe className="h-3.5 w-3.5" />} accentColor="emerald" />
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowDialog(true)} size="lg" className="gap-2">
              <Settings className="h-4 w-4" />
              {hasLink ? 'Configure Settings' : 'Create Share Link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <InvestorShareDialog
        companyId={companyId}
        companyName={companyName}
        productId={productId}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}

// Helper component for settings list items
function SettingItem({ 
  enabled, 
  label, 
  icon,
  accentColor = 'primary'
}: { 
  enabled: boolean; 
  label: string; 
  icon?: React.ReactNode;
  accentColor?: 'primary' | 'emerald';
}) {
  const enabledIconClass = accentColor === 'emerald' 
    ? 'bg-emerald-500/20 text-emerald-600' 
    : 'bg-primary/20 text-primary';
  
  const enabledCheckClass = accentColor === 'emerald'
    ? 'text-emerald-600'
    : 'text-primary';

  return (
    <div 
      className={`
        flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200
        ${enabled ? 'bg-background/60' : 'opacity-50'}
      `}
    >
      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${enabled ? enabledIconClass : 'bg-muted text-muted-foreground'}`}>
        {icon || <Circle className="h-3.5 w-3.5" />}
      </div>
      <span className={`text-sm flex-1 ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
      {enabled ? (
        <CheckCircle className={`h-4 w-4 ${enabledCheckClass}`} />
      ) : (
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </div>
  );
}
