import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Eye, EyeOff, Share2, Calendar, Lock, Store, Activity, DollarSign } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FundingStageHelpTooltip } from "@/components/investor-share/FundingStageHelpTooltip";
import { fundingStageInfo } from "@/data/fundingStageHelp";
import { DEVICE_CATEGORY_OPTIONS } from "@/types/investor";
import { useInvestorShareSettings } from "@/hooks/useInvestorShareSettings";
import { generateShareSlug, generateAccessCode, hashAccessCode, getInvestorShareUrl } from "@/services/investorShareService";
import { ISO_13485_PHASES } from "@/data/iso13485Phases";
import { useTranslation } from "@/hooks/useTranslation";

import { toast } from "sonner";

interface InvestorShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  productId?: string; // Optional - auto-sets featured product when provided
}

export function InvestorShareDialog({ open, onOpenChange, companyId, companyName, productId }: InvestorShareDialogProps) {
  const { lang } = useTranslation();
  const { settings, createOrUpdate, isUpdating, toggleActive } = useInvestorShareSettings(companyId);
  const [accessCode, setAccessCode] = useState<string>("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<string>("concept-planning");

  const [visibilitySettings, setVisibilitySettings] = useState({
    show_viability_score: true,
    show_technical_specs: true,
    show_media_gallery: true,
    show_business_canvas: true,
    show_roadmap: true,
    show_team_profile: false,
    show_venture_blueprint: true,
    show_readiness_gates: false,
    show_clinical_evidence: false,
    show_market_sizing: false,
    show_reimbursement_strategy: false,
  });
  const [monitorSettings, setMonitorSettings] = useState({
    show_rnpv: false,
    show_burn_rate: false,
    show_clinical_enrollment: true,
    show_regulatory_status_map: true,
  });
  const [autoGrantMonitorAccess, setAutoGrantMonitorAccess] = useState(false);
  const [listOnMarketplace, setListOnMarketplace] = useState(false);
  const [marketplaceCategories, setMarketplaceCategories] = useState<string[]>([]);
  
  const [fundingAmount, setFundingAmount] = useState<string>("");
  const [fundingCurrency, setFundingCurrency] = useState<string>("EUR");
  const [fundingStage, setFundingStage] = useState<string>("");

  useEffect(() => {
    if (settings) {
      setVisibilitySettings({
        show_viability_score: settings.show_viability_score,
        show_technical_specs: settings.show_technical_specs,
        show_media_gallery: settings.show_media_gallery,
        show_business_canvas: settings.show_business_canvas,
        show_roadmap: settings.show_roadmap,
        show_team_profile: settings.show_team_profile,
        show_venture_blueprint: settings.show_venture_blueprint ?? true,
        show_readiness_gates: settings.show_readiness_gates ?? false,
        show_clinical_evidence: settings.show_clinical_evidence ?? false,
        show_market_sizing: settings.show_market_sizing ?? false,
        show_reimbursement_strategy: settings.show_reimbursement_strategy ?? false,
      });
      setMonitorSettings({
        show_rnpv: settings.show_rnpv ?? false,
        show_burn_rate: settings.show_burn_rate ?? false,
        show_clinical_enrollment: settings.show_clinical_enrollment ?? true,
        show_regulatory_status_map: settings.show_regulatory_status_map ?? true,
      });
      setAutoGrantMonitorAccess(settings.auto_grant_monitor_access ?? false);
      if (settings.expires_at) {
        setExpiresAt(new Date(settings.expires_at).toISOString().split('T')[0]);
      }
      if (settings.current_phase) {
        setCurrentPhase(settings.current_phase);
      }
      setListOnMarketplace(settings.list_on_marketplace ?? false);
      setMarketplaceCategories(settings.marketplace_categories ?? []);
      
      // Funding fields - convert cents to display amount
      if (settings.funding_amount) {
        setFundingAmount(String(settings.funding_amount / 100));
      }
      if (settings.funding_currency) {
        setFundingCurrency(settings.funding_currency);
      }
      if (settings.funding_stage) {
        setFundingStage(settings.funding_stage);
      }
    }
  }, [settings]);

  const handleGenerateLink = async () => {
    const slug = generateShareSlug();
    const code = generateAccessCode();
    const codeHash = await hashAccessCode(code);

    setAccessCode(code);
    setShowAccessCode(true);

    // Convert display amount to cents
    const amountInCents = fundingAmount ? Math.round(parseFloat(fundingAmount) * 100) : null;

    createOrUpdate({
      public_slug: slug,
      access_code_hash: codeHash,
      is_active: true,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      current_phase: currentPhase,
      featured_product_id: productId || null,
      list_on_marketplace: listOnMarketplace,
      marketplace_categories: marketplaceCategories,
      auto_grant_monitor_access: autoGrantMonitorAccess,
      funding_amount: amountInCents,
      funding_currency: fundingCurrency,
      funding_stage: fundingStage || null,
      ...visibilitySettings,
      ...monitorSettings,
    });
  };

  const handleUpdateSettings = async () => {
    if (!settings?.public_slug) {
      toast.error(lang('investorShare.generateLinkFirst'));
      return;
    }

    // Convert display amount to cents
    const amountInCents = fundingAmount ? Math.round(parseFloat(fundingAmount) * 100) : null;

    createOrUpdate({
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      current_phase: currentPhase,
      featured_product_id: productId || settings.featured_product_id || null,
      list_on_marketplace: listOnMarketplace,
      marketplace_categories: marketplaceCategories,
      
      auto_grant_monitor_access: autoGrantMonitorAccess,
      funding_amount: amountInCents,
      funding_currency: fundingCurrency,
      funding_stage: fundingStage || null,
      ...visibilitySettings,
      ...monitorSettings,
    });
  };

  const handleCopyLink = () => {
    if (settings?.public_slug) {
      const url = getInvestorShareUrl(settings.public_slug);
      navigator.clipboard.writeText(url);
      toast.success(lang('investorShare.linkCopied'));
    }
  };

  const handleCopyAccessCode = () => {
    if (accessCode) {
      navigator.clipboard.writeText(accessCode);
      toast.success(lang('investorShare.accessCodeCopied'));
    }
  };

  const handlePreview = async () => {
    if (!settings?.public_slug) return;
    
    // If we have a productId from context, update featured_product_id first
    if (productId && productId !== settings.featured_product_id) {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('company_investor_share_settings')
        .update({ 
          featured_product_id: productId,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);
    }
    
    const previewUrl = `${window.location.origin}/investor/${settings.public_slug}?preview=true`;
    window.open(previewUrl, '_blank');
  };

  const shareUrl = settings?.public_slug ? getInvestorShareUrl(settings.public_slug) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {lang('investorShare.title')}
          </DialogTitle>
          <DialogDescription>
            {lang('investorShare.description', { companyName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Share Link Status */}
          {settings?.public_slug && (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={settings.is_active ? "default" : "secondary"}>
                    {settings.is_active ? lang('investorShare.active') : lang('investorShare.inactive')}
                  </Badge>
                  {settings.expires_at && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {lang('investorShare.expires')} {new Date(settings.expires_at).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={toggleActive}
                />
              </div>

              <div className="flex items-center gap-2">
                <Input value={shareUrl || ""} readOnly className="font-mono text-sm" />
                <Button size="icon" variant="outline" onClick={handleCopyLink} title={lang('investorShare.copyLink')}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={handlePreview} title={lang('investorShare.previewAsInvestor')}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              {/* Prominent Preview Button */}
              <Button
                onClick={handlePreview}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                {lang('investorShare.previewPitch')}
              </Button>

              {accessCode && showAccessCode ? (
                <div className="flex items-center gap-2 bg-warning/10 p-3 rounded-md">
                  <Lock className="h-4 w-4 text-warning" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{lang('investorShare.accessCodeSave')}</p>
                    <p className="text-lg font-mono font-bold">{accessCode}</p>
                  </div>
                  <Button size="icon" variant="outline" onClick={handleCopyAccessCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : settings?.access_code_hash && (
                <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{lang('investorShare.accessCode')}</p>
                    <p className="text-xs text-muted-foreground">
                      {lang('investorShare.accessCodePrevious')}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleGenerateLink}>
                    {lang('investorShare.regenerate')}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Current Development Phase */}
          <div className="space-y-2">
            <Label htmlFor="current_phase">{lang('investorShare.currentPhase')}</Label>
            <Select value={currentPhase} onValueChange={setCurrentPhase}>
              <SelectTrigger id="current_phase">
                <SelectValue placeholder={lang('investorShare.selectPhase')} />
              </SelectTrigger>
              <SelectContent>
                {ISO_13485_PHASES.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{phase.name}</span>
                      <span className="text-xs text-muted-foreground">{phase.isoReference}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {lang('investorShare.currentPhaseHint')}
            </p>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expires_at">{lang('investorShare.expirationDate')}</Label>
            <Input
              id="expires_at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              {lang('investorShare.expirationHint')}
            </p>
          </div>

          {/* Visibility Settings */}
          <div className="space-y-4">
            <Label className="text-base">{lang('investorShare.visibility.title')}</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="viability">{lang('investorShare.visibility.viability')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.viabilityDesc')}</p>
                </div>
                <Switch
                  id="viability"
                  checked={visibilitySettings.show_viability_score}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_viability_score: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="specs">{lang('investorShare.visibility.specs')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.specsDesc')}</p>
                </div>
                <Switch
                  id="specs"
                  checked={visibilitySettings.show_technical_specs}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_technical_specs: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="media">{lang('investorShare.visibility.media')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.mediaDesc')}</p>
                </div>
                <Switch
                  id="media"
                  checked={visibilitySettings.show_media_gallery}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_media_gallery: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="canvas">{lang('investorShare.visibility.canvas')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.canvasDesc')}</p>
                </div>
                <Switch
                  id="canvas"
                  checked={visibilitySettings.show_business_canvas}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_business_canvas: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="roadmap">{lang('investorShare.visibility.roadmap')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.roadmapDesc')}</p>
                </div>
                <Switch
                  id="roadmap"
                  checked={visibilitySettings.show_roadmap}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_roadmap: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="team">{lang('investorShare.visibility.team')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.teamDesc')}</p>
                </div>
                <Switch
                  id="team"
                  checked={visibilitySettings.show_team_profile}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_team_profile: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="blueprint">{lang('investorShare.visibility.blueprint')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.blueprintDesc')}</p>
                </div>
                <Switch
                  id="blueprint"
                  checked={visibilitySettings.show_venture_blueprint}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_venture_blueprint: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="readiness_gates">{lang('investorShare.visibility.readinessGates')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.readinessGatesDesc')}</p>
                </div>
                <Switch
                  id="readiness_gates"
                  checked={visibilitySettings.show_readiness_gates}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_readiness_gates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="clinical_evidence">{lang('investorShare.visibility.clinicalEvidence')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.clinicalEvidenceDesc')}</p>
                </div>
                <Switch
                  id="clinical_evidence"
                  checked={visibilitySettings.show_clinical_evidence}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_clinical_evidence: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="market_sizing">{lang('investorShare.visibility.marketSizing')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.marketSizingDesc')}</p>
                </div>
                <Switch
                  id="market_sizing"
                  checked={visibilitySettings.show_market_sizing}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_market_sizing: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reimbursement">{lang('investorShare.visibility.reimbursement')}</Label>
                  <p className="text-xs text-muted-foreground">{lang('investorShare.visibility.reimbursementDesc')}</p>
                </div>
                <Switch
                  id="reimbursement"
                  checked={visibilitySettings.show_reimbursement_strategy}
                  onCheckedChange={(checked) =>
                    setVisibilitySettings({ ...visibilitySettings, show_reimbursement_strategy: checked })
                  }
                />
              </div>
            </div>
          </div>


          {/* Continuous Monitoring Portal - Removed for Genesis launch (post-investment feature) */}

          {/* Funding Requirements */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <Label className="text-base">{lang('investorShare.funding.title')}</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {lang('investorShare.funding.description')}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="funding_stage">{lang('investorShare.funding.stage')}</Label>
                  <FundingStageHelpTooltip />
                </div>
                <Select value={fundingStage} onValueChange={setFundingStage}>
                  <SelectTrigger id="funding_stage">
                    <SelectValue placeholder={lang('investorShare.funding.selectStage')} />
                  </SelectTrigger>
                  <SelectContent className="w-[320px]">
                    {Object.values(fundingStageInfo).map((stage) => (
                      <SelectItem key={stage.key} value={stage.key} className="py-3">
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{stage.label}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {stage.typicalAmount}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                            {stage.description.split('.')[0]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="funding_currency">{lang('investorShare.funding.currency')}</Label>
                <Select value={fundingCurrency} onValueChange={setFundingCurrency}>
                  <SelectTrigger id="funding_currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CHF">CHF (Fr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funding_amount">{lang('investorShare.funding.amount')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {fundingCurrency === 'EUR' ? '€' : fundingCurrency === 'USD' ? '$' : fundingCurrency === 'GBP' ? '£' : 'Fr'}
                </span>
                <Input
                  id="funding_amount"
                  type="number"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  placeholder="500000"
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {lang('investorShare.funding.amountHint')}
              </p>
            </div>
          </div>

          {/* Marketplace Listing */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <Label className="text-base">{lang('investorShare.marketplace.title')}</Label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketplace">{lang('investorShare.marketplace.listOn')}</Label>
                <p className="text-xs text-muted-foreground">
                  {lang('investorShare.marketplace.listOnDesc')}
                </p>
              </div>
              <Switch
                id="marketplace"
                checked={listOnMarketplace}
                onCheckedChange={setListOnMarketplace}
              />
            </div>

            {listOnMarketplace && (
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                <Label>{lang('investorShare.marketplace.categories')}</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {lang('investorShare.marketplace.categoriesDesc')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEVICE_CATEGORY_OPTIONS.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${category}`}
                        checked={marketplaceCategories.includes(category)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMarketplaceCategories([...marketplaceCategories, category]);
                          } else {
                            setMarketplaceCategories(marketplaceCategories.filter(c => c !== category));
                          }
                        }}
                      />
                      <label htmlFor={`cat-${category}`} className="text-sm">{category}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {!settings?.public_slug ? (
              <Button
                onClick={handleGenerateLink}
                disabled={isUpdating}
                className="flex-1"
              >
                {lang('investorShare.generateLink')}
              </Button>
            ) : (
              <Button
                onClick={handleUpdateSettings}
                disabled={isUpdating}
                className="flex-1"
              >
                {lang('investorShare.updateSettings')}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {lang('investorShare.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
