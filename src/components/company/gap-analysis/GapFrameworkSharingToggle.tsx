import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GapFrameworkSharingToggleProps {
  frameworkKey: string;
  isShared: boolean;
  onToggle: (framework: string, shared: boolean) => void;
  isLoading?: boolean;
}

export function GapFrameworkSharingToggle({
  frameworkKey,
  isShared,
  onToggle,
  isLoading = false,
}: GapFrameworkSharingToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Users className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">Share across family</span>
      <Switch
        checked={isShared}
        onCheckedChange={(checked) => onToggle(frameworkKey, checked)}
        disabled={isLoading}
      />
      {isShared ? (
        <Badge variant="outline" className="text-[10px] border-green-300 bg-green-50 text-green-700 dark:bg-green-950/50 dark:border-green-700 dark:text-green-400">
          Shared
        </Badge>
      ) : (
        <Badge variant="outline" className="text-[10px] border-muted bg-muted/30 text-muted-foreground">
          Individual
        </Badge>
      )}
    </div>
  );
}
