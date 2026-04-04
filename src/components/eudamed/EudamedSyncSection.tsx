import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEudamedSync } from '@/hooks/useEudamedSync';
import { useEudamedDuplicateCleanup } from '@/hooks/useEudamedDuplicateCleanup';
import { RefreshCw, CheckCircle, AlertCircle, Clock, Database, Trash2, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface EudamedSyncSectionProps {
  companyId: string;
  companyName: string;
  onSyncComplete?: () => void;
}

export function EudamedSyncSection({ companyId, companyName, onSyncComplete }: EudamedSyncSectionProps) {
  const { lang } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { 
    isSyncing, 
    syncStatus, 
    isLoadingStatus, 
    progress, 
    loadSyncStatus, 
    performSync 
  } = useEudamedSync();
  
  const { isCleaningUp, cleanupDuplicates } = useEudamedDuplicateCleanup();

  useEffect(() => {
    loadSyncStatus(companyId);
  }, [companyId, loadSyncStatus]);

  const handleSync = async () => {
    const result = await performSync(companyId);
    if (result?.success && onSyncComplete) {
      onSyncComplete();
    }
  };

  const handleCleanupDuplicates = async () => {
    try {
      const result = await cleanupDuplicates(companyId);
      if (result.success && onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const getSyncStatusBadge = () => {
    if (!syncStatus) return null;

    switch (syncStatus.status) {
      case 'running':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{lang('eudamed.sync.status.running')}</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />{lang('eudamed.sync.status.completed')}</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />{lang('eudamed.sync.status.failed')}</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{lang('eudamed.sync.status.pending')}</Badge>;
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  {lang('eudamed.sync.title')}
                </CardTitle>
                <CardDescription>
                  {lang('eudamed.sync.description')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getSyncStatusBadge()}
                <ChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`} 
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
        {/* Sync Status Overview */}
        {syncStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{syncStatus.duplicates_merged}</div>
              <div className="text-sm text-muted-foreground">{lang('eudamed.sync.stats.duplicatesMerged')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncStatus.new_products_created}</div>
              <div className="text-sm text-muted-foreground">{lang('eudamed.sync.stats.productsCreated')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{syncStatus.duplicates_found}</div>
              <div className="text-sm text-muted-foreground">{lang('eudamed.sync.stats.duplicatesFound')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{syncStatus.errors?.length || 0}</div>
              <div className="text-sm text-muted-foreground">{lang('eudamed.sync.stats.errors')}</div>
            </div>
          </div>
        )}

        {/* Last Sync Info */}
        {syncStatus?.completed_at && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm text-muted-foreground">
              {lang('eudamed.sync.lastSynchronized')}: {formatDistanceToNow(new Date(syncStatus.completed_at), { addSuffix: true })}
            </span>
            <span className="text-sm font-medium">
              {lang('eudamed.sync.type')}: {syncStatus.sync_type}
            </span>
          </div>
        )}

        {/* Progress Bar */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progress.operation}</span>
              <span>{progress.processed}%</span>
            </div>
            <Progress value={progress.processed} className="w-full" />
          </div>
        )}

        {/* Sync Actions */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleCleanupDuplicates}
              disabled={isCleaningUp || isSyncing || isLoadingStatus}
              variant="outline"
              size="lg"
            >
              <Trash2 className={`w-4 h-4 mr-2 ${isCleaningUp ? 'animate-spin' : ''}`} />
              {isCleaningUp ? lang('eudamed.sync.cleaning') : lang('eudamed.sync.cleanDuplicates')}
            </Button>

            <Button
              onClick={handleSync}
              disabled={isSyncing || isLoadingStatus || isCleaningUp}
              size="lg"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? lang('eudamed.sync.synchronizing') : lang('eudamed.sync.fullSync')}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>{lang('eudamed.sync.thisSyncWill')}</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>{lang('eudamed.sync.actions.updateExisting')}</li>
              <li>{lang('eudamed.sync.actions.autoPopulate')}</li>
              <li>{lang('eudamed.sync.actions.findMerge')}</li>
              <li>{lang('eudamed.sync.actions.importMissing')}</li>
              <li>{lang('eudamed.sync.actions.identifyOrphaned')}</li>
              <li>{lang('eudamed.sync.actions.preserveCustom')}</li>
            </ul>
          </div>
        </div>

        {/* Error Display */}
        {syncStatus?.errors && syncStatus.errors.length > 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h4 className="font-medium text-destructive mb-2">{lang('eudamed.sync.syncErrors')}</h4>
            <ul className="text-sm text-destructive space-y-1">
              {syncStatus.errors.slice(0, 5).map((error, index) => (
                <li key={index} className="list-disc list-inside">{error}</li>
              ))}
              {syncStatus.errors.length > 5 && (
                <li className="font-medium">{lang('eudamed.sync.andMoreErrors', { count: syncStatus.errors.length - 5 })}</li>
              )}
            </ul>
          </div>
        )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}