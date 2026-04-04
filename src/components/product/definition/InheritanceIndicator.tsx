import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link2, Pencil } from 'lucide-react';

interface InheritanceIndicatorProps {
  isInherited: boolean;
  hasOverride: boolean;
  modelName?: string;
  overrideReason?: string;
  size?: 'sm' | 'md';
}

export function InheritanceIndicator({
  isInherited,
  hasOverride,
  modelName,
  overrideReason,
  size = 'sm'
}: InheritanceIndicatorProps) {
  if (!isInherited && !hasOverride) {
    return null;
  }

  if (isInherited) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            >
              <Link2 className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
              Inherited
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Inherited from model: {modelName || 'Unknown'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (hasOverride) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`gap-1 border-orange-500/50 text-orange-700 dark:text-orange-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            >
              <Pencil className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
              Custom
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-1">Custom variant definition</p>
            {overrideReason && (
              <p className="text-xs text-muted-foreground">{overrideReason}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
