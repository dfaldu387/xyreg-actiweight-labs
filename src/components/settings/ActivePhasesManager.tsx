
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ArrowUp, ArrowDown, Zap, RefreshCw, Wrench } from 'lucide-react';
import { usePhaseActivation } from '@/hooks/usePhaseActivation';
import { useAutoDocumentSync } from '@/hooks/useAutoDocumentSync';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ActivePhasesManagerProps {
  companyId: string;
}

export function ActivePhasesManager({ companyId }: ActivePhasesManagerProps) {
  const {
    activePhases,
    availablePhases,
    loading,
    activatePhase,
    deactivatePhase,
    reorderActivePhases,
    standardizePhases,
    cleanupOrphanedPhases
  } = usePhaseActivation(companyId);

  // Use auto-sync hook for automatic document synchronization
  const { isSyncing, lastSyncTime } = useAutoDocumentSync({
    companyId,
    onSyncComplete: () => {
      console.log('[ActivePhasesManager] Auto-sync completed');
    }
  });

  const handleMovePhase = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= activePhases.length) return;
    
    const newOrder = [...activePhases];
    const [movedPhase] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedPhase);
    
    const phaseIds = newOrder.map(phase => phase.phase_id);
    await reorderActivePhases(phaseIds);
    // Auto-sync will handle document updates automatically
  };

  const handleCleanupOrphanedPhases = async () => {
    const result = await cleanupOrphanedPhases();
    if (result.fixed > 0) {
      console.log(`[ActivePhasesManager] Cleaned up ${result.fixed} orphaned phases`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading phase activation data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Phase Activation
                {isSyncing && (
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Auto-syncing...</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Manage which phases are active for your company and their order. Document assignments sync automatically.
                {lastSyncTime && (
                  <span className="block text-xs text-blue-600 mt-1">
                    Last synced: {lastSyncTime.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                    <Wrench className="h-4 w-4 mr-2" />
                    Fix Orphaned Phases
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Fix Orphaned Phases</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will find phases that exist in your company but are not properly activated, 
                      and add them to your active phases list. This fixes the sync issue between 
                      Active Phases and Document Assignment.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCleanupOrphanedPhases}>
                      Fix Orphaned Phases
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="h-4 w-4 mr-2" />
                    Standardize Phases
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Standardize Company Phases</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will replace your current phase configuration with the standard 15-phase medical device lifecycle template. 
                      All phases will be activated and document assignments will be automatically synchronized.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={standardizePhases}>
                      Standardize & Auto-Sync All Phases
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Phase Lists */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Non-Active Phases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Non-Active Phases
              <Badge variant="outline">{availablePhases.length}</Badge>
            </CardTitle>
            <CardDescription>Phases available to activate (auto-syncs documents when activated)</CardDescription>
          </CardHeader>
          <CardContent>
            {availablePhases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No available phases</p>
                <p className="text-xs">All phases are currently active or you can use "Standardize Phases"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availablePhases.map((phase) => (
                  <div key={phase.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{phase.name}</div>
                      {phase.description && (
                        <div className="text-xs text-muted-foreground">{phase.description}</div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => activatePhase(phase.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Phases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Active Phases
              <Badge variant="default">{activePhases.length}</Badge>
            </CardTitle>
            <CardDescription>Phases currently active (documents auto-sync when modified)</CardDescription>
          </CardHeader>
          <CardContent>
            {activePhases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No active phases</p>
                <p className="text-xs">Activate phases from the available list or use "Standardize Phases"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activePhases.map((activePhase, index) => (
                  <div key={activePhase.id} className="flex items-center justify-between p-3 border rounded bg-blue-50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{activePhase.phase.name}</div>
                      {activePhase.phase.description && (
                        <div className="text-xs text-muted-foreground">{activePhase.phase.description}</div>
                      )}
                      <div className="text-xs text-blue-600">Position: {index + 1}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMovePhase(index, index - 1)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMovePhase(index, index + 1)}
                        disabled={index === activePhases.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deactivatePhase(activePhase.phase_id)}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      {activePhases.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active Phase Configuration</p>
                <p className="text-sm text-muted-foreground">
                  {activePhases.length} phases are currently active with automatic document synchronization enabled
                </p>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {activePhases.length} Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
