import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, ChevronDown, ChevronUp, Copy, ExternalLink, Lock, Calendar, Settings,
  Eye, CheckCircle, Circle, Gauge, Cpu, Image, LayoutGrid, Map, Users,
  TrendingUp, FlaskConical, DollarSign, Target, AlertTriangle, Factory, PieChart, Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInvestorShareSettings, VisibilitySettings, INVESTOR_VISIBILITY_DEFAULTS } from '@/hooks/useInvestorShareSettings';
import { generateShareSlug, generateAccessCode, hashAccessCode, getInvestorShareUrl } from '@/services/investorShareService';
import { FundingStageHelpTooltip } from '@/components/investor-share/FundingStageHelpTooltip';
import { fundingStageInfo } from '@/data/fundingStageHelp';
import { toast } from 'sonner';

interface InvestorShareCardProps {
  companyId: string;
  companyName: string;
  productId?: string;
  /** When 'dialog', renders content directly without card wrapper */
  variant?: 'card' | 'dialog';
}

// Visibility toggle item configuration
const VISIBILITY_ITEMS: Array<{
  key: keyof VisibilitySettings;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  { key: 'show_viability_score', label: 'Viability Score', description: 'Overall investment attractiveness', icon: <Gauge className="h-4 w-4" /> },
  { key: 'show_technical_specs', label: 'Technical Specs', description: 'Device specifications and features', icon: <Cpu className="h-4 w-4" /> },
  { key: 'show_media_gallery', label: 'Media Gallery', description: 'Product images and videos', icon: <Image className="h-4 w-4" /> },
  { key: 'show_business_canvas', label: 'Business Canvas', description: 'Business model overview', icon: <LayoutGrid className="h-4 w-4" /> },
  { key: 'show_venture_blueprint', label: 'Strategic Blueprint', description: 'Go-to-market strategy', icon: <Map className="h-4 w-4" /> },
  { key: 'show_roadmap', label: 'Development Roadmap', description: 'Timeline and milestones', icon: <Calendar className="h-4 w-4" /> },
  { key: 'show_team_profile', label: 'Team Profile', description: 'Founder and team information', icon: <Users className="h-4 w-4" /> },
  { key: 'show_market_sizing', label: 'Market Sizing', description: 'TAM, SAM, SOM analysis', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'show_clinical_evidence', label: 'Clinical Evidence', description: 'Study data and publications', icon: <FlaskConical className="h-4 w-4" /> },
  { key: 'show_readiness_gates', label: 'Readiness Gates', description: 'Development stage progress', icon: <CheckCircle className="h-4 w-4" /> },
  { key: 'show_regulatory_timeline', label: 'Regulatory Timeline', description: 'Approval pathway timeline', icon: <Calendar className="h-4 w-4" /> },
  { key: 'show_reimbursement_strategy', label: 'Reimbursement Strategy', description: 'Payer and pricing strategy', icon: <DollarSign className="h-4 w-4" /> },
  { key: 'show_gtm_strategy', label: 'GTM Strategy', description: 'Go-to-market execution plan', icon: <Target className="h-4 w-4" /> },
  { key: 'show_use_of_proceeds', label: 'Use of Proceeds', description: 'How funds will be allocated', icon: <PieChart className="h-4 w-4" /> },
  { key: 'show_key_risks', label: 'Key Risks', description: 'Risk factors and mitigations', icon: <AlertTriangle className="h-4 w-4" /> },
  { key: 'show_manufacturing', label: 'Manufacturing', description: 'Production capabilities', icon: <Factory className="h-4 w-4" /> },
  { key: 'show_unit_economics', label: 'Unit Economics', description: 'Cost and margin analysis', icon: <Briefcase className="h-4 w-4" /> },
  { key: 'show_team_gaps', label: 'Team Gaps', description: 'Hiring needs and plans', icon: <Users className="h-4 w-4" /> },
  { key: 'show_exit_strategy', label: 'Exit Strategy', description: 'Acquirers and comparable transactions', icon: <TrendingUp className="h-4 w-4" /> },
];

export function InvestorShareCard({ companyId, companyName, productId, variant = 'card' }: InvestorShareCardProps) {
  const [isOpen, setIsOpen] = useState(variant === 'dialog');
  const [accessCode, setAccessCode] = useState<string>('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [fundingAmount, setFundingAmount] = useState<string>('');
  const [fundingCurrency, setFundingCurrency] = useState<string>('EUR');
  const [fundingStage, setFundingStage] = useState<string>('');

  const { settings, isLoading, createOrUpdate, createOrUpdateAsync, isUpdating, toggleActive, getInvestorVisibility } = useInvestorShareSettings(companyId, productId);

  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(INVESTOR_VISIBILITY_DEFAULTS);
  const initializedRef = useRef(false);

  // Sync local state with settings - only on initial load (using ref to avoid re-renders)
  useEffect(() => {
    if (settings && !initializedRef.current) {
      const investorVis = getInvestorVisibility();
      if (investorVis) {
        setVisibilitySettings(investorVis);
      }
      if (settings.expires_at) {
        setExpiresAt(new Date(settings.expires_at).toISOString().split('T')[0]);
      }
      if (settings.funding_amount) {
        setFundingAmount(String(settings.funding_amount / 100));
      }
      if (settings.funding_currency) {
        setFundingCurrency(settings.funding_currency);
      }
      if (settings.funding_stage) {
        setFundingStage(settings.funding_stage);
      }
      initializedRef.current = true;
    }
  }, [settings?.id]); // Only re-run when settings record changes, not on every render

  // Memoized toggle handler to prevent unnecessary re-renders
  const handleVisibilityToggle = useCallback((key: keyof VisibilitySettings, checked: boolean) => {
    setVisibilitySettings(prev => ({ ...prev, [key]: checked }));
  }, []);

  const isActive = settings?.is_active ?? false;
  const hasLink = !!settings?.public_slug;
  const shareUrl = settings?.public_slug ? getInvestorShareUrl(settings.public_slug) : null;

  const handleGenerateLink = async () => {
    const slug = generateShareSlug();
    const code = generateAccessCode();
    const codeHash = await hashAccessCode(code);

    const amountInCents = fundingAmount ? Math.round(parseFloat(fundingAmount) * 100) : null;

    try {
      // Wait for DB update to complete before showing the new code
      await createOrUpdateAsync({
        public_slug: slug,
        access_code_hash: codeHash,
        is_active: true,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        featured_product_id: productId || null,
        funding_amount: amountInCents,
        funding_currency: fundingCurrency,
        funding_stage: fundingStage || null,
        ...visibilitySettings,
      });
      // Only show code after successful save
      setAccessCode(code);
      setShowAccessCode(true);
    } catch {
      // Error is already handled by the mutation's onError
    }
  };

  // Regenerate only the access code, keeping the same URL
  const handleRegenerateCode = async () => {
    const code = generateAccessCode();
    const codeHash = await hashAccessCode(code);

    try {
      // Wait for DB update to complete before showing the new code
      await createOrUpdateAsync({
        access_code_hash: codeHash,
      });
      // Only show code after successful save
      setAccessCode(code);
      setShowAccessCode(true);
    } catch {
      // Error is already handled by the mutation's onError
    }
  };

  const handleSaveSettings = () => {
    if (!settings?.public_slug) {
      toast.error('Generate a link first');
      return;
    }

    const amountInCents = fundingAmount ? Math.round(parseFloat(fundingAmount) * 100) : null;

    createOrUpdate({
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      featured_product_id: productId || settings.featured_product_id || null,
      funding_amount: amountInCents,
      funding_currency: fundingCurrency,
      funding_stage: fundingStage || null,
      ...visibilitySettings,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePreview = () => {
    if (!settings?.public_slug) return;
    const previewUrl = `${window.location.origin}/investor/${settings.public_slug}?preview=true`;
    window.open(previewUrl, '_blank');
  };

  const enabledCount = Object.values(visibilitySettings).filter(Boolean).length;

  if (isLoading) {
    if (variant === 'dialog') {
      return (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      );
    }
    return (
      <Card className="border-indigo-200 dark:border-indigo-800/50">
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Shared content renderer
  const renderContent = () => (
    <>
      {/* Share Link Section */}
      {hasLink && (
        <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-3">
          {/* Link Status & Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span className="text-sm font-medium">{isActive ? 'Link Active' : 'Link Inactive'}</span>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={toggleActive}
              disabled={isUpdating}
            />
          </div>

          {/* URL with actions */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 bg-white dark:bg-indigo-950/30 rounded-md text-sm font-mono text-muted-foreground border border-indigo-200 dark:border-indigo-800">
              <Lock className="h-3 w-3 flex-shrink-0 text-indigo-600" />
              <span className="truncate">{shareUrl}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => shareUrl && copyToClipboard(shareUrl, 'Share link')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="z-[9991]">Copy link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={handlePreview}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="z-[9991]">Preview</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Access Code Section */}
          {accessCode && showAccessCode ? (
            // Newly generated access code - show prominently
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
              <Lock className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-700 dark:text-amber-300">Save this access code</p>
                <p className="text-lg font-mono font-bold">{accessCode}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(accessCode, 'Access code')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : settings?.access_code_hash && (
            // Existing access code - show regenerate option
            <div className="flex items-center gap-2 bg-white dark:bg-indigo-950/30 p-3 rounded-md border border-indigo-200 dark:border-indigo-800">
              <Lock className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Access Code</p>
                <p className="text-xs text-muted-foreground">
                  Access code was generated previously. Click to generate a new one.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleRegenerateCode}>
                Regenerate
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Expiration Date */}
      <div className="space-y-2 pl-1">
        <Label htmlFor="investor-expires">Link Expiration (Optional)</Label>
        <Input
          id="investor-expires"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Funding Requirements */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-indigo-600" />
          <Label className="text-sm font-medium">Funding Requirements</Label>
          <FundingStageHelpTooltip />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
          <div className="space-y-1 pl-1">
            <Label htmlFor="investor-stage" className="text-xs">Stage</Label>
            <Select value={fundingStage} onValueChange={setFundingStage}>
              <SelectTrigger id="investor-stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(fundingStageInfo).map((stage) => (
                  <SelectItem key={stage.key} value={stage.key}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Currency</Label>
            <Select value={fundingCurrency} onValueChange={setFundingCurrency}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="investor-amount" className="text-xs">Amount</Label>
            <Input
              id="investor-amount"
              type="number"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(e.target.value)}
              placeholder="500000"
            />
          </div>
        </div>
      </div>

      {/* Visibility Settings */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">What Investors Can See</Label>
          <Badge variant="outline">{enabledCount}/{VISIBILITY_ITEMS.length}</Badge>
        </div>

        <div className="grid gap-2 max-h-64 overflow-y-auto pr-2">
          {VISIBILITY_ITEMS.map((item) => (
            <div
              key={item.key}
              className={`flex items-center justify-between gap-3 p-2 rounded-md transition-colors ${
                visibilitySettings[item.key] ? 'bg-indigo-50 dark:bg-indigo-950/30' : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded shrink-0 ${visibilitySettings[item.key] ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'bg-muted text-muted-foreground'}`}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium block truncate">{item.label}</span>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
              </div>
              <Switch
                checked={visibilitySettings[item.key]}
                onCheckedChange={(checked) => handleVisibilityToggle(item.key, checked)}
                className="shrink-0"
              />
            </div>
          ))}
        </div>
      </div>

    </>
  );

  // Actions renderer
  const renderActions = () => (
    <div className="flex gap-2">
      {!hasLink ? (
        <Button onClick={handleGenerateLink} disabled={isUpdating} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          <Send className="h-4 w-4 mr-2" />
          Generate Share Link
        </Button>
      ) : (
        <Button onClick={handleSaveSettings} disabled={isUpdating} className="flex-1">
          <Settings className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      )}
    </div>
  );

  // Dialog variant - render content with sticky footer
  if (variant === 'dialog') {
    return (
      <div className="flex flex-col">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-3">
          {renderContent()}
        </div>
        <div className="sticky bottom-0 pt-4 mt-4 border-t bg-background">
          {renderActions()}
        </div>
      </div>
    );
  }

  // Card variant - render with collapsible card
  return (
    <Card className="border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Send className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Share with Investor
                    {hasLink && (
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className={isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {hasLink
                      ? `${enabledCount} items visible to investors`
                      : 'Send a secure link directly to investors you know'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasLink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (shareUrl) copyToClipboard(shareUrl, 'Share link');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {renderContent()}
            <div className="pt-2">
              {renderActions()}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
