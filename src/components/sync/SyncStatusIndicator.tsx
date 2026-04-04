import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { useCompanySync } from '@/hooks/useCompanySync';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
  productId: string;
  companyId: string;
  onSyncComplete?: () => void;
  showFullDetails?: boolean;
}

export function SyncStatusIndicator({ 
  productId, 
  companyId, 
  onSyncComplete,
  showFullDetails = true 
}: SyncStatusIndicatorProps) {
  const {
    syncStatus,
    isSyncing,
    isLoadingSyncStatus,
    lastSyncResult,
    syncProduct,
    refreshSyncStatus
  } = useCompanySync(productId, companyId);

  const handleSync = async () => {
    try {
      await syncProduct();
      onSyncComplete?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getSyncStatusIcon = () => {
    if (isSyncing || isLoadingSyncStatus) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }

    switch (syncStatus?.syncStatus) {
      case 'in_sync':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'out_of_sync':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSyncStatusBadge = () => {
    if (isSyncing) {
      return <Badge variant="secondary">Syncing...</Badge>;
    }

    switch (syncStatus?.syncStatus) {
      case 'in_sync':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">In Sync</Badge>;
      case 'out_of_sync':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">Out of Sync</Badge>;
      case 'failed':
        return <Badge variant="destructive">Sync Failed</Badge>;
      case 'syncing':
        return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600">Syncing</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!showFullDetails) {
    return (
      <div className="flex items-center gap-2">
        {getSyncStatusIcon()}
        {getSyncStatusBadge()}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing || isLoadingSyncStatus}
        >
          <Zap className="h-3 w-3 mr-1" />
          Sync
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getSyncStatusIcon()}
          Sync Status
          {getSyncStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncStatus && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Documents:</span>
              <span className="font-medium">{syncStatus.totalDocuments}</span>
            </div>
            {syncStatus.documentsOutOfSync > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Out of Sync:</span>
                <span className="font-medium text-yellow-600">{syncStatus.documentsOutOfSync}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Check:</span>
              <span className="font-medium text-xs">
                {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {syncStatus?.errors && syncStatus.errors.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-red-600">Errors:</h4>
            <div className="text-xs text-red-500 space-y-1">
              {syncStatus.errors.map((error, index) => (
                <div key={index} className="bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {lastSyncResult && (
          <div className="space-y-2 text-sm border-t pt-3">
            <h4 className="font-medium">Last Sync Result:</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Documents Created:</span>
                <span className="font-medium text-green-600">{lastSyncResult.documentsCreated}</span>
              </div>
              <div className="flex justify-between">
                <span>Documents Updated:</span>
                <span className="font-medium text-blue-600">{lastSyncResult.documentsUpdated}</span>
              </div>
              {lastSyncResult.documentsRemoved > 0 && (
                <div className="flex justify-between">
                  <span>Issues Cleaned:</span>
                  <span className="font-medium text-orange-600">{lastSyncResult.documentsRemoved}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || isLoadingSyncStatus}
            className="flex-1"
          >
            <Zap className="h-3 w-3 mr-1" />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshSyncStatus}
            disabled={isLoadingSyncStatus}
          >
            <RefreshCw className={cn("h-3 w-3", isLoadingSyncStatus && "animate-spin")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}