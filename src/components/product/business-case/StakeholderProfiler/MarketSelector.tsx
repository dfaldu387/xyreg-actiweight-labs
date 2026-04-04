import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { getAllMarkets, MarketCode } from './marketConfigurations';

interface MarketSelectorProps {
  value: MarketCode | '';
  onChange: (value: MarketCode) => void;
  disabled?: boolean;
}

export function MarketSelector({ value, onChange, disabled }: MarketSelectorProps) {
  const markets = getAllMarkets();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" />
          Market Strategy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Primary Launch Market
          </label>
          <Select 
            value={value} 
            onValueChange={(v) => onChange(v as MarketCode)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your primary market..." />
            </SelectTrigger>
            <SelectContent>
              {markets.map((market) => (
                <SelectItem key={market.code} value={market.code}>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{market.flag}</span>
                    <span>{market.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This selection determines the reimbursement and buyer profile questions below.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
