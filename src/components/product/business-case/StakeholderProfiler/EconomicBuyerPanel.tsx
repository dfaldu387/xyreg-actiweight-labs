import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Wallet, Shield, AlertTriangle } from 'lucide-react';
import { 
  getMarketConfig, 
  MarketCode, 
  BUDGET_TYPE_OPTIONS, 
  BUYER_TYPE_OPTIONS,
  DATA_HOSTING_OPTIONS,
} from './marketConfigurations';
import { SystemArchitecture } from './ArchitectureSelector';

export interface EconomicBuyerData {
  buyer_type: string;
  procurement_path: string;
  mhlw_category: string;
  vbp_status: string;
  prostheses_list_targeting: boolean;
  prostheses_list_grouping: string;
  primary_payer: string;
  budget_type: string;
  coding_strategy: string;
  reimbursement_code: string;
  // SiMD-specific
  remote_update_capable?: boolean;
  // SaMD-specific
  data_hosting_location?: string;
  soc2_required?: boolean;
  hipaa_baa_required?: boolean;
}

interface EconomicBuyerPanelProps {
  market: MarketCode | '';
  value: EconomicBuyerData;
  onChange: (value: EconomicBuyerData) => void;
  disabled?: boolean;
  architecture?: SystemArchitecture;
}

export function EconomicBuyerPanel({ market, value, onChange, disabled, architecture }: EconomicBuyerPanelProps) {
  const isSiMD = architecture === 'hardware_simd';
  const isSaMD = architecture === 'samd';

  if (!market) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-green-500" />
            The Buyer (Economic)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Select a primary market above to configure buyer profile.
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = getMarketConfig(market);
  const buyerOptions = BUYER_TYPE_OPTIONS[market] || BUYER_TYPE_OPTIONS.default;

  // Filter budget options based on architecture
  const filteredBudgetOptions = BUDGET_TYPE_OPTIONS.filter(opt => {
    if (isSaMD && opt.value === 'CapEx') return false; // SaMD typically not CapEx
    if (!isSaMD && opt.value === 'SaaS') return false; // Only show SaaS for SaMD
    return true;
  });

  const handleChange = (field: keyof EconomicBuyerData, fieldValue: any) => {
    onChange({ ...value, [field]: fieldValue });
  };

  // Get the market-specific answer field
  const getMarketSpecificValue = (): string => {
    switch (market) {
      case 'USA':
        return value.coding_strategy || '';
      case 'Japan':
        return value.mhlw_category || '';
      case 'China':
        return value.vbp_status || '';
      case 'Australia':
        return value.prostheses_list_targeting ? 'Yes_Prostheses' : 'No_Public';
      case 'India':
      case 'Brazil':
        return value.primary_payer || '';
      default:
        return value.procurement_path || '';
    }
  };

  const setMarketSpecificValue = (v: string) => {
    switch (market) {
      case 'USA':
        handleChange('coding_strategy', v);
        break;
      case 'Japan':
        handleChange('mhlw_category', v);
        break;
      case 'China':
        handleChange('vbp_status', v);
        break;
      case 'Australia':
        handleChange('prostheses_list_targeting', v === 'Yes_Prostheses');
        break;
      case 'India':
      case 'Brazil':
        handleChange('primary_payer', v);
        break;
      default:
        handleChange('procurement_path', v);
        break;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-green-500" />
          The Buyer (Economic)
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {config.flag} {config.label}
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Who approves the purchase decision
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Budget Type
          </label>
          <Select 
            value={value.budget_type || ''} 
            onValueChange={(v) => handleChange('budget_type', v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="CapEx or OpEx?" />
            </SelectTrigger>
            <SelectContent>
              {filteredBudgetOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.description && (
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Market-Specific Question */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {config.question}
          </label>
          <Select 
            value={getMarketSpecificValue()} 
            onValueChange={setMarketSpecificValue}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {config.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.description && (
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Buyer Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {config.buyerLabel}
          </label>
          <Select 
            value={value.buyer_type || ''} 
            onValueChange={(v) => handleChange('buyer_type', v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select buyer type..." />
            </SelectTrigger>
            <SelectContent>
              {buyerOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reimbursement Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {config.reimbursementLabel}
          </label>
          <Input
            value={value.reimbursement_code || ''}
            onChange={(e) => handleChange('reimbursement_code', e.target.value)}
            placeholder={`Enter ${config.reimbursementLabel.toLowerCase()}...`}
            disabled={disabled}
          />
        </div>

        {/* Australia-specific: Prostheses List Grouping */}
        {market === 'Australia' && value.prostheses_list_targeting && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Prostheses List Grouping
            </label>
            <Input
              value={value.prostheses_list_grouping || ''}
              onChange={(e) => handleChange('prostheses_list_grouping', e.target.value)}
              placeholder="Enter grouping code..."
              disabled={disabled}
            />
          </div>
        )}

        {/* SiMD-specific: Remote Update Capability */}
        {isSiMD && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Remote Firmware Updates</Label>
                <p className="text-xs text-muted-foreground">Can software be updated remotely?</p>
              </div>
              <Switch
                checked={value.remote_update_capable || false}
                onCheckedChange={(checked) => handleChange('remote_update_capable', checked)}
                disabled={disabled}
              />
            </div>
            
            {value.remote_update_capable && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Cybersecurity Requirement</p>
                  <p>Remote firmware updates require a dedicated Cybersecurity Post-Market Surveillance Plan per IEC 81001-5-1.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SaMD-specific: IT Gatekeeper Section */}
        {isSaMD && (
          <div className="space-y-4 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">IT Gatekeeper Requirements</span>
            </div>

            {/* Data Hosting Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Data Hosting Location
              </label>
              <Select 
                value={value.data_hosting_location || ''} 
                onValueChange={(v) => handleChange('data_hosting_location', v)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Where is data stored?" />
                </SelectTrigger>
                <SelectContent>
                  {DATA_HOSTING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compliance Requirements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">SOC2 Compliance Required</Label>
                  <p className="text-xs text-muted-foreground">Enterprise security certification</p>
                </div>
                <Switch
                  checked={value.soc2_required || false}
                  onCheckedChange={(checked) => handleChange('soc2_required', checked)}
                  disabled={disabled}
                />
              </div>

              {market === 'USA' && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">HIPAA BAA Required</Label>
                    <p className="text-xs text-muted-foreground">Business Associate Agreement for PHI</p>
                  </div>
                  <Switch
                    checked={value.hipaa_baa_required || false}
                    onCheckedChange={(checked) => handleChange('hipaa_baa_required', checked)}
                    disabled={disabled}
                  />
                </div>
              )}
            </div>

            {/* Cloud hosting warning */}
            {value.data_hosting_location && value.data_hosting_location !== 'On_Premise' && (
              <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Cybersecurity Documentation</p>
                  <p>Cloud-hosted SaMD requires cybersecurity documentation per IEC 81001-5-1 and may require penetration testing.</p>
                </div>
              </div>
            )}

            {/* China data localization warning */}
            {market === 'China' && isSaMD && (
              <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <div className="text-xs text-red-800 dark:text-red-200">
                  <p className="font-medium">China Data Localization</p>
                  <p>SaMD in China faces strict data localization requirements. Patient data must be stored on servers within mainland China.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
