import React, { useState, useEffect } from 'react';
import {
  Globe, ChevronDown, ChevronUp, Calendar, Settings, Eye, CheckCircle,
  Gauge, Cpu, Image, LayoutGrid, Map, Users, TrendingUp, FlaskConical,
  DollarSign, Target, AlertTriangle, Factory, PieChart, Briefcase, Store,
  Copy, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInvestorShareSettings, VisibilitySettings, MarketplaceVisibilitySettings, MARKETPLACE_VISIBILITY_DEFAULTS } from '@/hooks/useInvestorShareSettings';
import { DEVICE_CATEGORY_OPTIONS } from '@/types/investor';
import { generateMarketplaceSlug, generateShareSlug, getMarketplaceListingUrl } from '@/services/investorShareService';
import { FundingStageHelpTooltip } from '@/components/investor-share/FundingStageHelpTooltip';
import { fundingStageInfo } from '@/data/fundingStageHelp';
import { toast } from 'sonner';

interface MarketplaceShareCardProps {
  companyId: string;
  companyName: string;
  productId?: string;
  /** When 'dialog', renders content directly without card wrapper */
  variant?: 'card' | 'dialog';
}

// Visibility toggle item configuration (same structure, reused from InvestorShareCard)
const VISIBILITY_ITEMS: Array<{
  key: keyof VisibilitySettings;
  mpKey: keyof MarketplaceVisibilitySettings;
  label: string;
  description: string;
  icon: React.ReactNode;
  recommendedOff?: boolean; // Flag items that should typically be OFF for marketplace
}> = [
  { key: 'show_viability_score', mpKey: 'mp_show_viability_score', label: 'Viability Score', description: 'Overall investment attractiveness', icon: <Gauge className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_technical_specs', mpKey: 'mp_show_technical_specs', label: 'Technical Specs', description: 'Device specifications and features', icon: <Cpu className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_media_gallery', mpKey: 'mp_show_media_gallery', label: 'Media Gallery', description: 'Product images and videos', icon: <Image className="h-4 w-4" /> }, // Recommended ON
  { key: 'show_business_canvas', mpKey: 'mp_show_business_canvas', label: 'Business Canvas', description: 'Business model overview', icon: <LayoutGrid className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_venture_blueprint', mpKey: 'mp_show_venture_blueprint', label: 'Strategic Blueprint', description: 'Go-to-market strategy', icon: <Map className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_roadmap', mpKey: 'mp_show_roadmap', label: 'Development Roadmap', description: 'Timeline and milestones', icon: <Calendar className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_team_profile', mpKey: 'mp_show_team_profile', label: 'Team Profile', description: 'Founder and team information', icon: <Users className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_market_sizing', mpKey: 'mp_show_market_sizing', label: 'Market Sizing', description: 'TAM, SAM, SOM analysis', icon: <TrendingUp className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_clinical_evidence', mpKey: 'mp_show_clinical_evidence', label: 'Clinical Evidence', description: 'Study data and publications', icon: <FlaskConical className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_readiness_gates', mpKey: 'mp_show_readiness_gates', label: 'Readiness Gates', description: 'Development stage progress', icon: <CheckCircle className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_regulatory_timeline', mpKey: 'mp_show_regulatory_timeline', label: 'Regulatory Timeline', description: 'Approval pathway timeline', icon: <Calendar className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_reimbursement_strategy', mpKey: 'mp_show_reimbursement_strategy', label: 'Reimbursement Strategy', description: 'Payer and pricing strategy', icon: <DollarSign className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_gtm_strategy', mpKey: 'mp_show_gtm_strategy', label: 'GTM Strategy', description: 'Go-to-market execution plan', icon: <Target className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_use_of_proceeds', mpKey: 'mp_show_use_of_proceeds', label: 'Use of Proceeds', description: 'How funds will be allocated', icon: <PieChart className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_key_risks', mpKey: 'mp_show_key_risks', label: 'Key Risks', description: 'Risk factors and mitigations', icon: <AlertTriangle className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_manufacturing', mpKey: 'mp_show_manufacturing', label: 'Manufacturing', description: 'Production capabilities', icon: <Factory className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_unit_economics', mpKey: 'mp_show_unit_economics', label: 'Unit Economics', description: 'Cost and margin analysis', icon: <Briefcase className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_team_gaps', mpKey: 'mp_show_team_gaps', label: 'Team Gaps', description: 'Hiring needs and plans', icon: <Users className="h-4 w-4" />, recommendedOff: true },
  { key: 'show_exit_strategy', mpKey: 'mp_show_exit_strategy', label: 'Exit Strategy', description: 'Acquirers and comparable transactions', icon: <TrendingUp className="h-4 w-4" />, recommendedOff: true },
];

export function MarketplaceShareCard({ companyId, companyName, productId, variant = 'card' }: MarketplaceShareCardProps) {
  const [isOpen, setIsOpen] = useState(variant === 'dialog');
  const [marketplaceExpiresAt, setMarketplaceExpiresAt] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [fundingAmount, setFundingAmount] = useState<string>('');
  const [fundingCurrency, setFundingCurrency] = useState<string>('EUR');
  const [fundingStage, setFundingStage] = useState<string>('');

  const {
    settings,
    isLoading,
    createOrUpdate,
    isUpdating,
    getMarketplaceVisibility
  } = useInvestorShareSettings(companyId, productId);

  const [visibilitySettings, setVisibilitySettings] = useState<MarketplaceVisibilitySettings>(MARKETPLACE_VISIBILITY_DEFAULTS);

  // Sync local state with settings
  useEffect(() => {
    if (settings) {
      // Get marketplace visibility and convert to mp_ prefixed format
      setVisibilitySettings({
        mp_show_viability_score: settings.mp_show_viability_score,
        mp_show_technical_specs: settings.mp_show_technical_specs,
        mp_show_media_gallery: settings.mp_show_media_gallery,
        mp_show_business_canvas: settings.mp_show_business_canvas,
        mp_show_roadmap: settings.mp_show_roadmap,
        mp_show_team_profile: settings.mp_show_team_profile,
        mp_show_venture_blueprint: settings.mp_show_venture_blueprint,
        mp_show_market_sizing: settings.mp_show_market_sizing,
        mp_show_reimbursement_strategy: settings.mp_show_reimbursement_strategy,
        mp_show_team_gaps: settings.mp_show_team_gaps,
        mp_show_regulatory_timeline: settings.mp_show_regulatory_timeline,
        mp_show_clinical_evidence: settings.mp_show_clinical_evidence,
        mp_show_readiness_gates: settings.mp_show_readiness_gates,
        mp_show_gtm_strategy: settings.mp_show_gtm_strategy,
        mp_show_key_risks: settings.mp_show_key_risks,
        mp_show_manufacturing: settings.mp_show_manufacturing,
        mp_show_unit_economics: settings.mp_show_unit_economics,
        mp_show_use_of_proceeds: settings.mp_show_use_of_proceeds,
        mp_show_exit_strategy: settings.mp_show_exit_strategy,
      });

      if (settings.marketplace_expires_at) {
        setMarketplaceExpiresAt(new Date(settings.marketplace_expires_at).toISOString().split('T')[0]);
      }
      if (settings.marketplace_categories) {
        setCategories(settings.marketplace_categories);
      }
      // Sync marketplace-specific funding data (mp_ prefix)
      if ((settings as any).mp_funding_amount) {
        setFundingAmount(String((settings as any).mp_funding_amount / 100));
      }
      if ((settings as any).mp_funding_currency) {
        setFundingCurrency((settings as any).mp_funding_currency);
      }
      if ((settings as any).mp_funding_stage) {
        setFundingStage((settings as any).mp_funding_stage);
      }
    }
  }, [settings]);

  const isListed = settings?.list_on_marketplace ?? false;
  const hasSettings = !!settings?.id;
  const marketplaceSlug = settings?.marketplace_slug;
  const marketplaceUrl = marketplaceSlug ? getMarketplaceListingUrl(marketplaceSlug) : null;

  // Local state for publish status dropdown
  const [publishStatus, setPublishStatus] = useState<'published' | 'unpublished'>('unpublished');

  // Sync publish status with settings
  useEffect(() => {
    if (settings) {
      setPublishStatus(settings.list_on_marketplace ? 'published' : 'unpublished');
    }
  }, [settings?.list_on_marketplace]);

  const handlePublishStatusChange = (status: 'published' | 'unpublished') => {
    setPublishStatus(status);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePreviewMarketplace = () => {
    if (marketplaceUrl) {
      window.open(marketplaceUrl, '_blank');
    }
  };

  const handleSaveSettings = () => {
    const amountInCents = fundingAmount ? Math.round(parseFloat(fundingAmount) * 100) : null;
    const isPublished = publishStatus === 'published';

    const updateData: any = {
      is_active: true, // Required for Deal Flow visibility
      list_on_marketplace: isPublished,
      marketplace_categories: categories,
      marketplace_expires_at: marketplaceExpiresAt ? new Date(marketplaceExpiresAt).toISOString() : null,
      mp_funding_amount: amountInCents,
      mp_funding_currency: fundingCurrency,
      mp_funding_stage: fundingStage || null,
      ...visibilitySettings,
    };

    // Include product ID for product-specific marketplace settings
    if (productId) {
      updateData.featured_product_id = productId;
    }

    // Generate marketplace_slug if missing (always generate for both published and unpublished)
    if (!marketplaceSlug) {
      updateData.marketplace_slug = generateMarketplaceSlug();
      updateData.marketplace_listed_at = new Date().toISOString();
    }

    // Generate public_slug if missing (needed for preview of unpublished devices)
    if (!settings?.public_slug) {
      updateData.public_slug = generateShareSlug();
    }

    createOrUpdate(updateData);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setCategories([...categories, category]);
    } else {
      setCategories(categories.filter(c => c !== category));
    }
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
      <Card className="border-emerald-200 dark:border-emerald-800/50">
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Shared content renderer (without actions for dialog variant)
  const renderContent = () => (
    <>
      {/* Publish Status Dropdown */}
      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
        {/* Status dropdown */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${publishStatus === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-medium">Listing Status</span>
          </div>
          <Select value={publishStatus} onValueChange={(v) => handlePublishStatusChange(v as 'published' | 'unpublished')}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="published">
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Published
                </span>
              </SelectItem>
              <SelectItem value="unpublished">
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  Unpublished
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {publishStatus === 'published'
            ? 'Device is visible in Investor Deal Flow marketplace'
            : 'Device is saved but not visible in Deal Flow. Only visible in your Marketplace Preview.'}
        </p>

        {/* URL with actions - show if slug exists */}
        {marketplaceSlug && (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 bg-white dark:bg-emerald-950/30 rounded-md text-sm font-mono text-muted-foreground border border-emerald-200 dark:border-emerald-800">
              <Globe className="h-3 w-3 flex-shrink-0 text-emerald-600" />
              <span className="truncate">{marketplaceUrl}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => marketplaceUrl && copyToClipboard(marketplaceUrl, 'Marketplace link')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="z-[9991]">Copy link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={handlePreviewMarketplace}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="z-[9991]">Preview</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Device Categories</Label>
        <div className="grid grid-cols-2 gap-2">
          {DEVICE_CATEGORY_OPTIONS.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`mp-cat-${category}`}
                checked={categories.includes(category)}
                onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
              />
              <label htmlFor={`mp-cat-${category}`} className="text-sm cursor-pointer">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Expiration Date */}
      <div className="space-y-2">
        <Label htmlFor="marketplace-expires">Listing Expiration (Optional)</Label>
        <Input
          id="marketplace-expires"
          type="date"
          value={marketplaceExpiresAt}
          onChange={(e) => setMarketplaceExpiresAt(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Funding Requirements */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          <Label className="text-sm font-medium">Funding Requirements</Label>
          <FundingStageHelpTooltip />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
          <div className="space-y-1">
            <Label htmlFor="marketplace-stage" className="text-xs">Stage</Label>
            <Select value={fundingStage} onValueChange={setFundingStage}>
              <SelectTrigger id="marketplace-stage">
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
                <SelectItem value="CHF">CHF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="marketplace-amount" className="text-xs">Amount</Label>
            <Input
              id="marketplace-amount"
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
          <Label className="text-sm font-medium">What's Visible</Label>
          <Badge variant="outline" className="text-emerald-600 border-emerald-300">
            {enabledCount}/{VISIBILITY_ITEMS.length}
          </Badge>
        </div>

        <div className="grid gap-2 max-h-64 overflow-y-auto pr-2">
          {VISIBILITY_ITEMS.map((item) => (
            <div
              key={item.mpKey}
              className={`flex items-center justify-between gap-3 p-2 rounded-md transition-colors ${
                visibilitySettings[item.mpKey] ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded shrink-0 ${visibilitySettings[item.mpKey] ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium block truncate">{item.label}</span>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
              </div>
              <Switch
                checked={visibilitySettings[item.mpKey]}
                onCheckedChange={(checked) =>
                  setVisibilitySettings({ ...visibilitySettings, [item.mpKey]: checked })
                }
                className="shrink-0"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  // Action buttons renderer
  const renderActions = () => (
    <>
      <div className="flex gap-2">
        <Button
          onClick={handleSaveSettings}
          disabled={isUpdating || categories.length === 0}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          <Settings className="h-4 w-4 mr-2" />
          Save Marketplace Settings
        </Button>
      </div>

      {categories.length === 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Select at least one category to save marketplace settings
        </p>
      )}
    </>
  );

  // Dialog variant - render content with sticky footer
  if (variant === 'dialog') {
    return (
      <div className="flex flex-col">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-3">
          {renderContent()}
        </div>
        <div className="sticky bottom-0 pt-4 mt-4 border-t bg-background space-y-2">
          {renderActions()}
        </div>
      </div>
    );
  }

  // Card variant - render with collapsible card
  return (
    <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Share on Marketplace
                    {hasSettings && marketplaceSlug && (
                      <Badge
                        variant={isListed ? "default" : "secondary"}
                        className={isListed ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}
                      >
                        {isListed ? 'Published' : 'Unpublished'}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isListed
                      ? `${enabledCount} items visible on Deal Flow (${categories.length} categories)`
                      : marketplaceSlug
                        ? 'Saved but not visible in Deal Flow'
                        : 'List on Deal Flow for investor discovery'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
