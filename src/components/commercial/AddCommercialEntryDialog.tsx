import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subWeeks, subMonths, subQuarters, getYear, getMonth, getQuarter, getWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateCommercialData } from '@/hooks/useCommercialData';
import { useCompanyProducts } from '@/hooks/useCompanyProducts';
import { CompanyProductModelsService } from '@/services/companyProductModelsService';
import { CompanyPlatformService } from '@/services/companyPlatformService';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';
import { useProductVariants } from '@/hooks/useProductVariants';

interface AddCommercialEntryDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  selectedModel: string;
  platform: string;
  category: string;
  selectedProduct: string;
  selectedVariant: string;
  periodType: 'week' | 'month' | 'quarter';
  selectedPeriod: string;
  periodStart: Date;
  periodEnd: Date;
  revenueAmount: string;
  cogsAmount: string;
  unitsSold: string;
  currencyCode: string;
  marketCode: string;
}

export function AddCommercialEntryDialog({ 
  companyId, 
  open, 
  onOpenChange, 
  onSuccess 
}: AddCommercialEntryDialogProps) {
  const { toast } = useToast();
  const { lang } = useTranslation();
  const createMutation = useCreateCommercialData();

  // Fetch products for the company with commercial fields
  const { data: productsWithCommercialFields = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products-commercial-fields', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name, device_category, product_platform, model_reference, company_id')
        .eq('company_id', companyId)
        .eq('is_archived', false);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
  
  // Fetch product models for the company
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['company-product-models', companyId],
    queryFn: () => CompanyProductModelsService.getDistinctModels(companyId),
    enabled: !!companyId,
  });

  // Fetch platforms for the company
  const { data: platforms = [], isLoading: platformsLoading } = useQuery({
    queryKey: ['company-platforms', companyId],
    queryFn: () => CompanyPlatformService.getDistinctPlatforms(companyId),
    enabled: !!companyId,
  });

  // Get unique categories from products
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(
      productsWithCommercialFields.map(p => p.device_category).filter(Boolean)
    )];
    return uniqueCategories.sort();
  }, [productsWithCommercialFields]);

  const [formData, setFormData] = useState<FormData>({
    selectedModel: '',
    platform: '',
    category: '',
    selectedProduct: '',
    selectedVariant: '',
    periodType: 'month',
    selectedPeriod: '',
    periodStart: startOfMonth(new Date()),
    periodEnd: endOfMonth(new Date()),
    revenueAmount: '',
    cogsAmount: '',
    unitsSold: '',
    currencyCode: 'EUR',
    marketCode: 'EU'
  });

  // Get selected product for variant loading
  const selectedProduct = React.useMemo(() => {
    return productsWithCommercialFields.find(p => 
      p.model_reference === formData.selectedModel &&
      (formData.platform ? p.product_platform === formData.platform : true) &&
      (formData.category ? p.device_category === formData.category : true)
    );
  }, [productsWithCommercialFields, formData.selectedModel, formData.platform, formData.category]);

  // Fetch variants for the selected product
  const { variants, loading: variantsLoading } = useProductVariants(selectedProduct?.id);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cascading dropdown filters - Category first, then Model, then Platform
  const getFilteredCategories = (): string[] => {
    return categories as string[]; // Always show all categories first
  };

  const getFilteredModels = () => {
    if (!formData.category) return models;
    
    return models.filter(model => {
      const modelProducts = productsWithCommercialFields.filter(p => p.model_reference === model.name);
      return modelProducts.some(p => p.device_category === formData.category);
    });
  };

  const getFilteredPlatforms = () => {
    if (!formData.category) return platforms;
    
    let filteredPlatforms = platforms.filter(platform => {
      const platformProducts = productsWithCommercialFields.filter(p => p.product_platform === platform.name);
      return platformProducts.some(p => p.device_category === formData.category);
    });

    if (formData.selectedModel) {
      filteredPlatforms = filteredPlatforms.filter(platform => {
        const platformProducts = productsWithCommercialFields.filter(p => p.product_platform === platform.name);
        return platformProducts.some(p => p.model_reference === formData.selectedModel);
      });
    }
    
    return filteredPlatforms;
  };

  // Cascading dropdown handlers
  const handleCategoryChange = (categoryName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      category: categoryName,
      selectedModel: '', // Reset dependent fields
      platform: ''
    }));
  };

  const handleModelChange = (modelName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedModel: modelName,
      platform: '', // Reset dependent fields
      selectedVariant: ''
    }));
  };

  const handlePlatformChange = (platformName: string) => {
    setFormData(prev => ({ ...prev, platform: platformName }));
  };

  const handlePeriodTypeChange = (periodType: 'week' | 'month' | 'quarter') => {
    setFormData(prev => ({ ...prev, periodType, selectedPeriod: '' }));
  };

  const getPeriodOptions = () => {
    const now = new Date();
    const currentYear = getYear(now);
    const options: { value: string; label: string }[] = [];

    if (formData.periodType === 'month') {
      // Generate last 12 months and next 12 months
      for (let i = -12; i <= 12; i++) {
        const date = new Date(currentYear, getMonth(now) + i, 1);
        const value = `${getYear(date)}-${getMonth(date)}`;
        const label = format(date, 'MMMM yyyy');
        options.push({ value, label });
      }
    } else if (formData.periodType === 'quarter') {
      // Generate last 8 quarters and next 8 quarters
      for (let i = -8; i <= 8; i++) {
        const date = subQuarters(now, -i);
        const quarter = getQuarter(date);
        const year = getYear(date);
        const value = `${year}-Q${quarter}`;
        const label = `Q${quarter} ${year}`;
        options.push({ value, label });
      }
    } else if (formData.periodType === 'week') {
      // Generate last 26 weeks and next 26 weeks
      for (let i = -26; i <= 26; i++) {
        const date = subWeeks(now, -i);
        const week = getWeek(date);
        const year = getYear(date);
        const value = `${year}-W${week}`;
        const label = `Week ${week}, ${year}`;
        options.push({ value, label });
      }
    }

    return options;
  };

  const handlePeriodChange = (selectedPeriod: string) => {
    let startDate: Date;
    let endDate: Date;

    if (formData.periodType === 'month') {
      const [year, month] = selectedPeriod.split('-').map(Number);
      startDate = startOfMonth(new Date(year, month, 1));
      endDate = endOfMonth(new Date(year, month, 1));
    } else if (formData.periodType === 'quarter') {
      const [year, quarter] = selectedPeriod.replace('Q', '').split('-').map(Number);
      const quarterStart = new Date(year, (quarter - 1) * 3, 1);
      startDate = startOfQuarter(quarterStart);
      endDate = endOfQuarter(quarterStart);
    } else if (formData.periodType === 'week') {
      const [year, week] = selectedPeriod.replace('W', '').split('-').map(Number);
      const firstDayOfYear = new Date(year, 0, 1);
      const daysToAdd = (week - 1) * 7;
      const weekStart = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      startDate = startOfWeek(weekStart, { weekStartsOn: 1 });
      endDate = endOfWeek(weekStart, { weekStartsOn: 1 });
    } else {
      startDate = new Date();
      endDate = new Date();
    }

    setFormData(prev => ({
      ...prev,
      selectedPeriod,
      periodStart: startDate,
      periodEnd: endDate
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (!formData.selectedModel.trim()) {
      newErrors.selectedModel = 'Model selection is required';
    }
    if (!formData.marketCode.trim()) {
      newErrors.marketCode = 'Market selection is required';
    }
    if (!formData.selectedPeriod.trim()) {
      newErrors.selectedPeriod = 'Period selection is required';
    }
    if (!formData.revenueAmount || parseFloat(formData.revenueAmount) < 0) {
      newErrors.revenueAmount = 'Valid revenue amount is required';
    }
    if (!formData.cogsAmount || parseFloat(formData.cogsAmount) < 0) {
      newErrors.cogsAmount = 'Valid COGS amount is required';
    }
    if (!formData.unitsSold || parseInt(formData.unitsSold) < 0) {
      newErrors.unitsSold = 'Valid units sold is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Find the product that matches the selected model, platform, and category
      const matchingProduct = productsWithCommercialFields.find(p => 
        p.model_reference === formData.selectedModel &&
        (formData.platform ? p.product_platform === formData.platform : true) &&
        (formData.category ? p.device_category === formData.category : true)
      );

      if (!matchingProduct) {
        toast({
          title: "Error",
          description: "Could not find matching product for the selected criteria",
          variant: "destructive",
        });
        return;
      }

      const revenueAmount = parseFloat(formData.revenueAmount);
      const cogsAmount = parseFloat(formData.cogsAmount);
      const unitsSold = parseInt(formData.unitsSold);

      await createMutation.mutateAsync({
        product_id: matchingProduct.id,
        variant_id: formData.selectedVariant || null,
        revenue_amount: revenueAmount,
        cogs_amount: cogsAmount,
        units_sold: unitsSold,
        period_start: formData.periodStart.toISOString(),
        period_end: formData.periodEnd.toISOString(),
        currency_code: formData.currencyCode,
        market_code: formData.marketCode,
      });

      toast({
        title: "Entry Added Successfully",
        description: `Added commercial data for ${formData.selectedModel}`,
      });

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error Adding Entry",
        description: "There was an error adding the commercial data entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      selectedModel: '',
      platform: '',
      category: '',
      selectedProduct: '',
      selectedVariant: '',
      periodType: 'month',
      selectedPeriod: '',
      periodStart: startOfMonth(new Date()),
      periodEnd: endOfMonth(new Date()),
      revenueAmount: '',
      cogsAmount: '',
      unitsSold: '',
      currencyCode: 'EUR',
      marketCode: 'EU'
    });
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang('commercialEntry.title')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* First row: Category and Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="category">{lang('commercialEntry.category')}</Label>
                <HelpTooltip content={lang('commercialEntry.help.category')} />
              </div>
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('commercialEntry.selectCategoryFirst')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-[2000] max-h-60">
                  {getFilteredCategories().length > 0 ? (
                    getFilteredCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-muted-foreground">{lang('commercialEntry.noCategoriesFound')}</div>
                  )}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="selectedModel">{lang('commercialEntry.model')}</Label>
                <HelpTooltip content={lang('commercialEntry.help.model')} />
              </div>
              <Select
                value={formData.selectedModel}
                onValueChange={handleModelChange}
                disabled={modelsLoading || !formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.category ? lang('commercialEntry.selectCategoryFirst') :
                    modelsLoading ? lang('common.loading') : lang('commercialEntry.selectModel')
                  } />
                </SelectTrigger>
                <SelectContent className="bg-background z-[2000] max-h-60">
                  {getFilteredModels().length > 0 ? (
                    getFilteredModels().map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      {!formData.category ? lang('commercialEntry.selectCategoryFirst') : lang('commercialEntry.noModelsFound')}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.selectedModel && (
                <p className="text-sm text-destructive">{errors.selectedModel}</p>
              )}
            </div>
          </div>

          {/* Second row: Platform and Market */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="platform">{lang('commercialEntry.platform')} <span className="text-muted-foreground text-sm">({lang('common.optional')})</span></Label>
                <HelpTooltip content={lang('commercialEntry.help.platform')} />
              </div>
              <Select
                value={formData.platform}
                onValueChange={handlePlatformChange}
                disabled={platformsLoading || !formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.category ? lang('commercialEntry.selectCategoryFirst') :
                    platformsLoading ? lang('common.loading') : lang('commercialEntry.selectPlatformOptional')
                  } />
                </SelectTrigger>
                <SelectContent className="bg-background z-[2000] max-h-60">
                  {getFilteredPlatforms().length > 0 ? (
                    getFilteredPlatforms().map((platform) => (
                      <SelectItem key={platform.name} value={platform.name}>
                        {platform.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      {!formData.category ? lang('commercialEntry.selectCategoryFirst') : lang('commercialEntry.noPlatformsRegistered')}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="market">{lang('commercialEntry.market')}</Label>
                <HelpTooltip content={lang('commercialEntry.help.market')} />
              </div>
              <Select
                value={formData.marketCode}
                onValueChange={(value) => setFormData(prev => ({ ...prev, marketCode: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('commercialEntry.selectMarket')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-[2000]">
                  <SelectItem value="EU">European Union (EU)</SelectItem>
                  <SelectItem value="US">United States (US)</SelectItem>
                  <SelectItem value="CA">Canada (CA)</SelectItem>
                  <SelectItem value="JP">Japan (JP)</SelectItem>
                  <SelectItem value="AU">Australia (AU)</SelectItem>
                  <SelectItem value="BR">Brazil (BR)</SelectItem>
                  <SelectItem value="CN">China (CN)</SelectItem>
                  <SelectItem value="IN">India (IN)</SelectItem>
                  <SelectItem value="KR">South Korea (KR)</SelectItem>
                </SelectContent>
              </Select>
              {errors.marketCode && (
                <p className="text-sm text-destructive">{errors.marketCode}</p>
              )}
            </div>
          </div>

          {/* Optional: Variant Selection */}
          {selectedProduct && variants && variants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="variant">{lang('commercialEntry.variant')} <span className="text-muted-foreground text-sm">({lang('common.optional')})</span></Label>
                <HelpTooltip content={lang('commercialEntry.help.variant')} />
              </div>
              <Select
                value={formData.selectedVariant}
                onValueChange={(value) => setFormData(prev => ({ ...prev, selectedVariant: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('commercialEntry.allVariants')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-[2000]">
                  <SelectItem value="">{lang('commercialEntry.allVariants')}</SelectItem>
                  {variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name || `Variant ${variant.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Third row: Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">{lang('commercialEntry.currency')}</Label>
            <Select
              value={formData.currencyCode}
              onValueChange={(value) => setFormData(prev => ({ ...prev, currencyCode: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={lang('commercialEntry.selectCurrency')} />
              </SelectTrigger>
              <SelectContent className="bg-background z-[2000]">
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="CAD">CAD ($)</SelectItem>
                <SelectItem value="AUD">AUD ($)</SelectItem>
                <SelectItem value="BRL">BRL (R$)</SelectItem>
                <SelectItem value="CNY">CNY (¥)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="KRW">KRW (₩)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Third row: Period selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>{lang('commercialEntry.periodType')}</Label>
                <HelpTooltip content={lang('commercialEntry.help.periodType')} />
              </div>
              <Select
                value={formData.periodType}
                onValueChange={handlePeriodTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('commercialEntry.selectPeriodType')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-[2000]">
                  <SelectItem value="week">{lang('commercialEntry.periodTypes.week')}</SelectItem>
                  <SelectItem value="month">{lang('commercialEntry.periodTypes.month')}</SelectItem>
                  <SelectItem value="quarter">{lang('commercialEntry.periodTypes.quarter')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>{lang('commercialEntry.period')}</Label>
                <HelpTooltip content={lang('commercialEntry.help.period')} />
              </div>
              <Select
                value={formData.selectedPeriod}
                onValueChange={handlePeriodChange}
                disabled={!formData.periodType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.periodType ? lang('commercialEntry.selectPeriodTypeFirst') : lang('commercialEntry.selectPeriod')
                  } />
                </SelectTrigger>
                <SelectContent className="bg-background z-[2000] max-h-60">
                  {getPeriodOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.selectedPeriod && (
                <p className="text-sm text-destructive">{errors.selectedPeriod}</p>
              )}
            </div>
          </div>

          {formData.selectedPeriod && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {lang('commercialEntry.periodLabel')}: <span className="font-medium text-foreground">
                  {format(formData.periodStart, "MMM dd, yyyy")} - {format(formData.periodEnd, "MMM dd, yyyy")}
                </span>
              </p>
            </div>
          )}

          {/* Fourth row: Financial data */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="revenue">{lang('commercialEntry.revenueAmount')}</Label>
                <HelpTooltip content={lang('commercialEntry.help.revenue')} />
              </div>
              <Input
                id="revenue"
                type="number"
                min="0"
                step="0.01"
                value={formData.revenueAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, revenueAmount: e.target.value }))}
                placeholder="0.00"
              />
              {errors.revenueAmount && (
                <p className="text-sm text-destructive">{errors.revenueAmount}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="cogs">{lang('commercialEntry.cogsAmount')}</Label>
                <HelpTooltip content={lang('commercialEntry.help.cogs')} />
              </div>
              <Input
                id="cogs"
                type="number"
                min="0"
                step="0.01"
                value={formData.cogsAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, cogsAmount: e.target.value }))}
                placeholder="0.00"
              />
              {errors.cogsAmount && (
                <p className="text-sm text-destructive">{errors.cogsAmount}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="units">{lang('commercialEntry.unitsSold')}</Label>
                <HelpTooltip content={lang('commercialEntry.help.units')} />
              </div>
              <Input
                id="units"
                type="number"
                min="0"
                value={formData.unitsSold}
                onChange={(e) => setFormData(prev => ({ ...prev, unitsSold: e.target.value }))}
                placeholder="0"
              />
              {errors.unitsSold && (
                <p className="text-sm text-destructive">{errors.unitsSold}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            {lang('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? lang('commercialEntry.adding') : lang('commercialEntry.addEntry')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}