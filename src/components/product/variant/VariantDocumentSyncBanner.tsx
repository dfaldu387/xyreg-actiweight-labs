import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Link2 } from 'lucide-react';

interface VariantDocumentSyncBannerProps {
  masterDeviceName: string;
  linkedCount: number;
  overriddenCount: number;
  onSync: () => void;
  isSyncing: boolean;
}

export function VariantDocumentSyncBanner({
  masterDeviceName,
  linkedCount,
  overriddenCount,
  onSync,
  isSyncing,
}: VariantDocumentSyncBannerProps) {
  const inheritedCount = linkedCount - overriddenCount;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Family · {masterDeviceName}
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400">
          {inheritedCount} inherited · {overriddenCount} custom
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onSync}
        disabled={isSyncing}
        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
        Sync from Family
      </Button>
    </div>
  );
}
