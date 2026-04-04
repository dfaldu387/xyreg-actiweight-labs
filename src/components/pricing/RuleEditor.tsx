import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, DollarSign, TrendingUp, RotateCcw } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingService } from "@/services/pricingService";
import { MARKET_CURRENCIES } from "@/utils/marketCurrencyUtils";

const pricingRuleSchema = z.object({
  rule_type: z.enum(['BASE', 'RELATIVE', 'ABSOLUTE']),
  market_code: z.string().min(1, "Market is required"),
  currency_code: z.string().min(1, "Currency is required"),
  base_price: z.number().min(0).optional(),
  relative_type: z.enum(['PERCENT', 'FIXED']).optional(),
  relative_value: z.number().optional(),
}).refine((data) => {
  if (data.rule_type === 'BASE' || data.rule_type === 'ABSOLUTE') {
    return data.base_price && data.base_price > 0;
  }
  if (data.rule_type === 'RELATIVE') {
    return data.relative_type && data.relative_value !== undefined;
  }
  return true;
}, {
  message: "Invalid pricing rule configuration",
  path: ["base_price"]
});

type PricingRuleFormData = z.infer<typeof pricingRuleSchema>;

interface RuleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  companyId: string;
  existingRule?: any;
  onSave: (rule: any) => Promise<void>;
}

const markets = Object.entries(MARKET_CURRENCIES).map(([code, info]) => ({
  code,
  name: `${info.name} (${code})`,
  currency: info.code,
}));

export const RuleEditor: React.FC<RuleEditorProps> = ({
  open,
  onOpenChange,
  productId,
  productName,
  companyId,
  existingRule,
  onSave,
}) => {
  const { lang } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(false);

  const ruleTypes = PricingService.getPricingRuleTypes();
  const relativeTypes = PricingService.getRelativeTypes();
  
  const form = useForm<PricingRuleFormData>({
    resolver: zodResolver(pricingRuleSchema),
    defaultValues: {
      rule_type: existingRule?.rule_type || 'BASE',
      market_code: existingRule?.market_code || 'US',
      currency_code: existingRule?.currency_code || 'USD',
      base_price: existingRule?.base_price || undefined,
      relative_type: existingRule?.relative_type || 'PERCENT',
      relative_value: existingRule?.relative_value || undefined,
    },
  });

  const watchRuleType = form.watch('rule_type');
  const watchMarketCode = form.watch('market_code');

  // Update currency when market changes
  React.useEffect(() => {
    if (watchMarketCode) {
      const marketCurrency = MARKET_CURRENCIES[watchMarketCode];
      if (marketCurrency) {
        form.setValue('currency_code', marketCurrency.code);
      }
    }
  }, [watchMarketCode, form]);

  const handleSubmit = async (data: PricingRuleFormData) => {
    setIsLoading(true);
    try {
      // Build rule data conditionally based on rule type
      const baseRuleData = {
        company_id: companyId,
        product_id: productId,
        rule_type: data.rule_type,
        market_code: data.market_code,
        currency_code: data.currency_code,
      };

      let ruleData: any;

      if (data.rule_type === 'BASE' || data.rule_type === 'ABSOLUTE') {
        // For BASE/ABSOLUTE rules: include base_price, exclude relative fields
        ruleData = {
          ...baseRuleData,
          base_price: data.base_price,
          relative_type: null,
          relative_value: null,
        };
      } else if (data.rule_type === 'RELATIVE') {
        // For RELATIVE rules: include relative fields, exclude base_price
        ruleData = {
          ...baseRuleData,
          relative_type: data.relative_type,
          relative_value: data.relative_value,
          base_price: null,
        };
      }

      await onSave(ruleData);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save pricing rule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'BASE':
        return <DollarSign className="h-4 w-4" />;
      case 'RELATIVE':
        return <TrendingUp className="h-4 w-4" />;
      case 'ABSOLUTE':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {existingRule ? lang('commercial.pricingStrategy.ruleEditor.editRule') : lang('commercial.pricingStrategy.ruleEditor.createRule')}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {lang('commercial.pricingStrategy.ruleEditor.device')} <span className="font-medium">{productName}</span>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Rule Type */}
            <FormField
              control={form.control}
              name="rule_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('commercial.pricingStrategy.ruleEditor.ruleType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={lang('commercial.pricingStrategy.ruleEditor.selectRuleType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ruleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {getRuleIcon(type.value)}
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {type.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Market */}
            <FormField
              control={form.control}
              name="market_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('commercial.pricingStrategy.ruleEditor.market')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={lang('commercial.pricingStrategy.ruleEditor.selectMarket')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {markets.map((market) => (
                        <SelectItem key={market.code} value={market.code}>
                          <div className="flex items-center justify-between w-full">
                            <span>{market.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {market.currency}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency (auto-populated) */}
            <FormField
              control={form.control}
              name="currency_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('commercial.pricingStrategy.ruleEditor.currency')}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    {lang('commercial.pricingStrategy.ruleEditor.currencyAutoSet')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Base Price (for BASE and ABSOLUTE rules) */}
            {(watchRuleType === 'BASE' || watchRuleType === 'ABSOLUTE') && (
              <FormField
                control={form.control}
                name="base_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchRuleType === 'BASE' ? lang('commercial.pricingStrategy.ruleEditor.basePrice') : lang('commercial.pricingStrategy.ruleEditor.absolutePrice')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Relative Pricing (for RELATIVE rules) */}
            {watchRuleType === 'RELATIVE' && (
              <>
                <FormField
                  control={form.control}
                  name="relative_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{lang('commercial.pricingStrategy.ruleEditor.adjustmentType')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={lang('commercial.pricingStrategy.ruleEditor.selectAdjustmentType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {relativeTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {type.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relative_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {lang('commercial.pricingStrategy.ruleEditor.adjustmentValue')}
                        {form.watch('relative_type') === 'PERCENT' && lang('commercial.pricingStrategy.ruleEditor.percentSuffix')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={form.watch('relative_type') === 'PERCENT' ? '10' : '5.00'}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch('relative_type') === 'PERCENT'
                          ? lang('commercial.pricingStrategy.ruleEditor.percentDescription')
                          : lang('commercial.pricingStrategy.ruleEditor.fixedDescription')
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {lang('commercial.pricingStrategy.ruleEditor.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {existingRule ? lang('commercial.pricingStrategy.ruleEditor.updateRule') : lang('commercial.pricingStrategy.ruleEditor.createRuleButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};