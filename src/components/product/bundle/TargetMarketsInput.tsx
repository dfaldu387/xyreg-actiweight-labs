import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

const COMMON_MARKETS = ['EU', 'US', 'UK', 'Canada', 'Asia-Pacific', 'LATAM', 'Middle East', 'China', 'Japan', 'Australia'];

interface TargetMarketsInputProps {
  value: string[];
  onChange: (markets: string[]) => void;
  disabled?: boolean;
}

export function TargetMarketsInput({ value, onChange, disabled }: TargetMarketsInputProps) {
  const [customMarket, setCustomMarket] = useState('');

  const addMarket = (market: string) => {
    if (market && !value.includes(market)) {
      onChange([...value, market]);
    }
  };

  const removeMarket = (market: string) => {
    onChange(value.filter(m => m !== market));
  };

  const handleAddCustom = () => {
    if (customMarket.trim()) {
      addMarket(customMarket.trim());
      setCustomMarket('');
    }
  };

  return (
    <div className="space-y-3">
      <Label>Target Markets</Label>
      
      {/* Common Markets Quick Select */}
      <div className="flex flex-wrap gap-2">
        {COMMON_MARKETS.map((market) => (
          <Badge
            key={market}
            variant={value.includes(market) ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/80"
            onClick={() => {
              if (disabled) return;
              if (value.includes(market)) {
                removeMarket(market);
              } else {
                addMarket(market);
              }
            }}
          >
            {market}
            {value.includes(market) && (
              <X className="h-3 w-3 ml-1" />
            )}
          </Badge>
        ))}
      </div>

      {/* Custom Market Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add custom market..."
          value={customMarket}
          onChange={(e) => setCustomMarket(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddCustom}
          disabled={disabled || !customMarket.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Markets Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/20">
          {value.map((market) => (
            <Badge key={market} variant="secondary" className="gap-1">
              {market}
              <button
                type="button"
                onClick={() => !disabled && removeMarket(market)}
                disabled={disabled}
                className="hover:bg-destructive/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
