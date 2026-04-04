import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface GS1PrefixLengthEducationProps {
  currentPrefixLength?: number;
  variant?: 'tooltip' | 'popover';
  className?: string;
}

const PREFIX_DATA = [
  { length: 6, itemDigits: 6, capacity: 1000000 },
  { length: 7, itemDigits: 5, capacity: 100000 },
  { length: 8, itemDigits: 4, capacity: 10000 },
  { length: 9, itemDigits: 3, capacity: 1000 },
  { length: 10, itemDigits: 2, capacity: 100 },
  { length: 11, itemDigits: 1, capacity: 10 },
  { length: 12, itemDigits: 0, capacity: 1 },
];

function EducationContent({ currentPrefixLength }: { currentPrefixLength?: number }) {
  const currentRow = currentPrefixLength 
    ? PREFIX_DATA.find(d => d.length === currentPrefixLength)
    : null;

  return (
    <div className="space-y-3 text-sm">
      <div>
        <h4 className="font-semibold text-foreground mb-1">How Prefix Length Affects Your Products</h4>
        <p className="text-muted-foreground text-xs">
          GTIN-14 has exactly 14 digits. A longer prefix means fewer digits for product identification.
        </p>
      </div>

      {/* Visual Structure */}
      <div className="bg-muted/50 p-2 rounded-md font-mono text-xs">
        <div className="text-muted-foreground mb-1">GTIN-14 Structure:</div>
        <div className="flex gap-1">
          <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded">1</span>
          <span className="bg-primary/20 px-2 rounded flex-1 text-center">Prefix (6-12)</span>
          <span className="bg-emerald-200 dark:bg-emerald-800 px-2 rounded flex-1 text-center">Item Ref</span>
          <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded">✓</span>
        </div>
        <div className="flex gap-1 text-[10px] text-muted-foreground mt-0.5">
          <span className="w-4 text-center">PI</span>
          <span className="flex-1 text-center">Your Company</span>
          <span className="flex-1 text-center">Your Products</span>
          <span className="w-4 text-center">CD</span>
        </div>
      </div>

      {/* Trade-off Table */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted">
            <tr>
              <th className="px-2 py-1 text-left font-medium">Prefix</th>
              <th className="px-2 py-1 text-left font-medium">Item Ref</th>
              <th className="px-2 py-1 text-right font-medium">Max Products</th>
            </tr>
          </thead>
          <tbody>
            {PREFIX_DATA.map((row) => (
              <tr 
                key={row.length}
                className={currentPrefixLength === row.length 
                  ? 'bg-primary/10 font-medium' 
                  : 'hover:bg-muted/50'
                }
              >
                <td className="px-2 py-1 border-t">{row.length} digits</td>
                <td className="px-2 py-1 border-t">{row.itemDigits} digits</td>
                <td className="px-2 py-1 border-t text-right">
                  {row.capacity.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Current Prefix Highlight */}
      {currentRow && (
        <div className="bg-primary/10 border border-primary/20 rounded-md p-2 text-xs">
          <span className="font-medium">Your {currentPrefixLength}-digit prefix</span>
          {' → '}
          <span className="text-primary font-semibold">
            {currentRow.capacity.toLocaleString()} products
          </span>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        PI = Packaging Indicator, CD = Check Digit (calculated automatically)
      </p>
    </div>
  );
}

export function GS1PrefixLengthEducation({ 
  currentPrefixLength, 
  variant = 'popover',
  className = "" 
}: GS1PrefixLengthEducationProps) {
  if (variant === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className={`h-4 w-4 text-muted-foreground hover:text-foreground cursor-help ${className}`} />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">
              Longer prefix = fewer product digits. A 9-digit prefix allows 1,000 products; 
              a 6-digit prefix allows 1,000,000.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          type="button"
          className={`inline-flex items-center justify-center rounded-full hover:bg-muted p-0.5 ${className}`}
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" side="top" align="start">
        <EducationContent currentPrefixLength={currentPrefixLength} />
      </PopoverContent>
    </Popover>
  );
}
