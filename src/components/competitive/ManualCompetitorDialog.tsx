import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { manualCompetitorService, ManualCompetitor } from '@/services/manualCompetitorService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQueryClient } from '@tanstack/react-query';

const DEVICE_CLASSIFICATION_OPTIONS = [
  { value: 'Class I', label: 'Class I' },
  { value: 'Class IIa', label: 'Class IIa' },
  { value: 'Class IIb', label: 'Class IIb' },
  { value: 'Class III', label: 'Class III' },
  { value: 'Class A', label: 'Class A (IVD)' },
  { value: 'Class B', label: 'Class B (IVD)' },
  { value: 'Class C', label: 'Class C (IVD)' },
  { value: 'Class D', label: 'Class D (IVD)' },
  { value: '510(k)', label: '510(k) (FDA)' },
  { value: 'PMA', label: 'PMA (FDA)' },
  { value: 'De Novo', label: 'De Novo (FDA)' },
];

const REGULATORY_STATUS_OPTIONS = [
  { value: 'Approved', label: 'Approved / Cleared' },
  { value: 'Marketed', label: 'On Market' },
  { value: 'Clinical Trials', label: 'In Clinical Trials' },
  { value: 'Development', label: 'In Development' },
  { value: 'Pending', label: 'Pending Approval' },
  { value: 'Unknown', label: 'Unknown' },
];

const MARKET_OPTIONS = [
  { value: 'EU', label: 'EU (MDR/IVDR)' },
  { value: 'US', label: 'US (FDA)' },
  { value: 'UK', label: 'UK (UKCA)' },
  { value: 'CN', label: 'China (NMPA)' },
  { value: 'JP', label: 'Japan (PMDA)' },
  { value: 'AU', label: 'Australia (TGA)' },
  { value: 'CA', label: 'Canada (Health Canada)' },
  { value: 'BR', label: 'Brazil (ANVISA)' },
  { value: 'KR', label: 'South Korea (MFDS)' },
  { value: 'IN', label: 'India (CDSCO)' },
  { value: 'Global', label: 'Global' },
];

interface ManualCompetitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  competitor?: ManualCompetitor | null;
  onSaved: () => void;
  disabled?: boolean;
}

export function ManualCompetitorDialog({
  open,
  onOpenChange,
  productId,
  competitor,
  onSaved,
  disabled = false
}: ManualCompetitorDialogProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [formData, setFormData] = useState({
    competitor_company: '',
    product_name: '',
    device_classification: '',
    regulatory_status: '',
    area_of_focus: '',
    market: '',
    market_share_estimate: '',
    homepage_url: '',
    notes: ''
  });

  // Fetch product's company_id
  useEffect(() => {
    const fetchCompanyId = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('company_id')
        .eq('id', productId)
        .single();

      if (data && !error) {
        setCompanyId(data.company_id);
      }
    };

    if (productId) {
      fetchCompanyId();
    }
  }, [productId]);

  useEffect(() => {
    if (competitor) {
      setFormData({
        competitor_company: competitor.competitor_company || '',
        product_name: competitor.product_name || '',
        device_classification: competitor.device_classification || '',
        regulatory_status: competitor.regulatory_status || '',
        area_of_focus: competitor.area_of_focus || '',
        market: competitor.market || '',
        market_share_estimate: competitor.market_share_estimate || '',
        homepage_url: competitor.homepage_url || '',
        notes: competitor.notes || ''
      });
    } else {
      // Reset form when adding new
      setFormData({
        competitor_company: '',
        product_name: '',
        device_classification: '',
        regulatory_status: '',
        area_of_focus: '',
        market: '',
        market_share_estimate: '',
        homepage_url: '',
        notes: ''
      });
    }
  }, [competitor, open]);

  const handleSave = async () => {
    if (disabled) return;
    if (!formData.competitor_company.trim()) {
      toast.error(lang('marketAnalysis.competitorDialog.toast.companyRequired'));
      return;
    }

    // Validate companyId is loaded before saving
    if (!competitor && !companyId) {
      toast.error(lang('marketAnalysis.competitorDialog.toast.companyDataNotLoaded'));
      return;
    }

    setIsSaving(true);
    try {
      if (competitor) {
        // Update existing
        await manualCompetitorService.updateCompetitor(competitor.id, formData);
        toast.success(lang('marketAnalysis.competitorDialog.toast.updated'));
      } else {
        // Create new
        await manualCompetitorService.createCompetitor({
          product_id: productId,
          company_id: companyId,
          ...formData
        });
        toast.success(lang('marketAnalysis.competitorDialog.toast.added'));
      }
      
      // Invalidate viability score caches so the scorecard updates with new competitor data
      queryClient.invalidateQueries({ queryKey: ['investor-preview-data', productId] });
      queryClient.invalidateQueries({ queryKey: ['calculated-viability-score', productId] });
      
      onSaved();
    } catch (error) {
      console.error('Error saving competitor:', error);
      toast.error(lang('marketAnalysis.competitorDialog.toast.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {competitor ? lang('marketAnalysis.competitorDialog.editTitle') : lang('marketAnalysis.competitorDialog.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {lang('marketAnalysis.competitorDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competitor_company">
                {lang('marketAnalysis.competitorDialog.companyName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="competitor_company"
                value={formData.competitor_company}
                onChange={(e) => setFormData({ ...formData, competitor_company: e.target.value })}
                placeholder={lang('marketAnalysis.competitorDialog.companyNamePlaceholder')}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_name">{lang('marketAnalysis.competitorDialog.deviceName')}</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder={lang('marketAnalysis.competitorDialog.deviceNamePlaceholder')}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device_classification">{lang('marketAnalysis.competitorDialog.deviceClassification')}</Label>
              <Select
                value={formData.device_classification}
                onValueChange={(value) => setFormData({ ...formData, device_classification: value })}
                disabled={disabled}
              >
                <SelectTrigger id="device_classification" className="bg-background">
                  <SelectValue placeholder={lang('marketAnalysis.competitorDialog.selectClassification')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-[9991]" position="popper" sideOffset={4}>
                  {DEVICE_CLASSIFICATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regulatory_status">Regulatory Status</Label>
              <Select
                value={formData.regulatory_status}
                onValueChange={(value) => setFormData({ ...formData, regulatory_status: value })}
                disabled={disabled}
              >
                <SelectTrigger id="regulatory_status" className="bg-background">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-background z-[9991]" position="popper" sideOffset={4}>
                  {REGULATORY_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market">{lang('marketAnalysis.competitorDialog.market')}</Label>
              <Select
                value={formData.market}
                onValueChange={(value) => setFormData({ ...formData, market: value })}
                disabled={disabled}
              >
                <SelectTrigger id="market" className="bg-background">
                  <SelectValue placeholder={lang('marketAnalysis.competitorDialog.selectMarket')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-[9991]" position="popper" sideOffset={4}>
                  {MARKET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area_of_focus">{lang('marketAnalysis.competitorDialog.areaOfFocus')}</Label>
              <Input
                id="area_of_focus"
                value={formData.area_of_focus}
                onChange={(e) => setFormData({ ...formData, area_of_focus: e.target.value })}
                placeholder={lang('marketAnalysis.competitorDialog.areaOfFocusPlaceholder')}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market_share_estimate">{lang('marketAnalysis.competitorDialog.marketShareEstimate')}</Label>
              <Input
                id="market_share_estimate"
                value={formData.market_share_estimate}
                onChange={(e) => setFormData({ ...formData, market_share_estimate: e.target.value })}
                placeholder={lang('marketAnalysis.competitorDialog.marketSharePlaceholder')}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="homepage_url">{lang('marketAnalysis.competitorDialog.homepageUrl')}</Label>
            <Input
              id="homepage_url"
              type="url"
              value={formData.homepage_url}
              onChange={(e) => setFormData({ ...formData, homepage_url: e.target.value })}
              placeholder={lang('marketAnalysis.competitorDialog.homepageUrlPlaceholder')}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{lang('marketAnalysis.competitorDialog.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={lang('marketAnalysis.competitorDialog.notesPlaceholder')}
              rows={4}
              disabled={disabled}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {lang('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || disabled}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {lang('marketAnalysis.competitorDialog.saving')}
              </>
            ) : (
              lang('marketAnalysis.competitorDialog.saveCompetitor')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
