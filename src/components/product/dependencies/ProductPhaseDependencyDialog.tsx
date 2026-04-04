import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  Plus, 
  ArrowRight, 
  Clock, 
  PlayCircle, 
  Square, 
  StopCircle, 
  Download,
  AlertCircle,
  Link,
  RefreshCw,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ProductPhaseDependencyService, 
  ProductPhaseDependency, 
  ProductDependencyType,
  CreateProductDependencyData
} from '@/services/productPhaseDependencyService';
import { EnhancedRecalculationService } from '@/services/enhancedRecalculationService';
import { PhaseDependency } from '@/services/phaseDependencyService';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductPhase {
  id: string;
  name: string;
  phase_id?: string;
  position?: number;
}

type DependencyGraph = Map<string, Set<string>>;

const buildDependencyGraph = (deps: ProductPhaseDependency[]): DependencyGraph => {
  const graph: DependencyGraph = new Map();

  deps.forEach(dep => {
    if (!graph.has(dep.source_phase_id)) {
      graph.set(dep.source_phase_id, new Set());
    }
    graph.get(dep.source_phase_id)!.add(dep.target_phase_id);
  });

  return graph;
};

const cloneGraph = (graph: DependencyGraph): DependencyGraph => {
  const clone: DependencyGraph = new Map();
  graph.forEach((targets, source) => {
    clone.set(source, new Set(targets));
  });
  return clone;
};

const addEdgeToGraph = (graph: DependencyGraph, from?: string, to?: string): DependencyGraph => {
  if (!from || !to) return graph;
  const updated = cloneGraph(graph);
  if (!updated.has(from)) {
    updated.set(from, new Set());
  }
  updated.get(from)!.add(to);
  return updated;
};

const hasPath = (graph: DependencyGraph, start?: string, target?: string): boolean => {
  if (!start || !target) return false;
  if (start === target) return true;

  const visited = new Set<string>();
  const stack = [start];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if (node === target) {
      return true;
    }
    if (visited.has(node)) {
      continue;
    }
    visited.add(node);

    const neighbors = graph.get(node);
    if (neighbors) {
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      });
    }
  }

  return false;
};

const canAddDependencyEdge = (graph: DependencyGraph, from?: string, to?: string): boolean => {
  if (!from || !to) return true;
  if (from === to) return false;

  const directTargets = graph.get(from);
  if (directTargets && directTargets.has(to)) {
    return false;
  }

  // Prevent redundant/transitive paths and circular references as defined in the Gantt documentation.
  if (hasPath(graph, from, to)) {
    return false;
  }

  if (hasPath(graph, to, from)) {
    return false;
  }

  return true;
};

interface ProductPhaseDependencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  phases: ProductPhase[];
  onDependenciesChange?: () => void;
}

export function ProductPhaseDependencyDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  phases,
  onDependenciesChange
}: ProductPhaseDependencyDialogProps) {
  const { lang } = useTranslation();
  const [dependencies, setDependencies] = useState<ProductPhaseDependency[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  // Form state for creating new dependency
  const [sourcePhaseId, setSourcePhaseId] = useState<string>('');
  const [connectingPhaseId, setConnectingPhaseId] = useState<string>('');
  const [targetPhaseId, setTargetPhaseId] = useState<string>('');
  // Two dependency types - one for each link (Source→Connecting and Connecting→Target)
  const [firstDependencyType, setFirstDependencyType] = useState<ProductDependencyType>('finish_to_start');
  const [secondDependencyType, setSecondDependencyType] = useState<ProductDependencyType>('finish_to_start');
  
  // Edit state
  const [editingDependencyId, setEditingDependencyId] = useState<string | null>(null);
  const [editDependencyType, setEditDependencyType] = useState<ProductDependencyType>('finish_to_start');
  const [editLagDays, setEditLagDays] = useState<number>(0);

  // Group dependencies into chains (A → B → C shown as one row)
  type DependencyChain = {
    id: string;
    dependencies: ProductPhaseDependency[];
    phases: string[]; // phase IDs in order
  };

  const groupedDependencies = useMemo(() => {
    if (!dependencies || dependencies.length === 0) return [];

    const chains: DependencyChain[] = [];
    const usedDepIds = new Set<string>();

    // Maximum number of dependencies per chain (2 deps = 3 phases)
    const MAX_CHAIN_DEPS = 2;

    // Sort dependencies by source phase position
    const sortedDeps = [...dependencies].sort((a, b) => {
      const sourceA = phases.find(p => p.id === a.source_phase_id);
      const sourceB = phases.find(p => p.id === b.source_phase_id);
      return (sourceA?.position || 0) - (sourceB?.position || 0);
    });

    // Find chains
    sortedDeps.forEach(dep => {
      if (usedDepIds.has(dep.id)) return;

      // Start a new chain with this dependency
      const chain: ProductPhaseDependency[] = [dep];
      usedDepIds.add(dep.id);

      // Look for connecting dependencies (where current target = next source)
      // Stop when chain reaches MAX_CHAIN_DEPS
      let currentTargetId = dep.target_phase_id;
      let foundNext = true;

      while (foundNext && chain.length < MAX_CHAIN_DEPS) {
        foundNext = false;
        for (const nextDep of sortedDeps) {
          if (!usedDepIds.has(nextDep.id) && nextDep.source_phase_id === currentTargetId) {
            chain.push(nextDep);
            usedDepIds.add(nextDep.id);
            currentTargetId = nextDep.target_phase_id;
            foundNext = true;
            break;
          }
        }
      }

      // Build phase order for the chain
      const phaseOrder: string[] = [chain[0].source_phase_id];
      chain.forEach(d => {
        if (!phaseOrder.includes(d.target_phase_id)) {
          phaseOrder.push(d.target_phase_id);
        }
      });

      chains.push({
        id: chain.map(d => d.id).join('_'),
        dependencies: chain,
        phases: phaseOrder
      });
    });

    return chains;
  }, [dependencies, phases]);

  // Load dependencies when dialog opens
  useEffect(() => {
    if (open && productId) {
      loadDependencies();
    }
  }, [open, productId]);

  const loadDependencies = async () => {
    setLoading(true);
    try {
      const result = await ProductPhaseDependencyService.getProductDependencies(productId);
      if (result.success) {
        setDependencies(result.dependencies || []);
      } else {
        toast.error(result.error || lang('phaseDependency.errors.failedToLoad'));
        setDependencies([]);
      }
    } catch (error) {
      console.error('Error loading dependencies:', error);
      toast.error(lang('phaseDependency.errors.failedToLoad'));
      setDependencies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeFromCompany = async (overwrite: boolean = false) => {
    setInitializing(true);
    try {
      const result = await ProductPhaseDependencyService.initializeFromCompanySettings(
        productId,
        companyId,
        overwrite
      );

      if (result.success) {
        const message = overwrite
          ? lang('phaseDependency.success.reinitializedDeps', { count: result.initializedCount || 0 })
          : lang('phaseDependency.success.initializedDeps', { count: result.initializedCount || 0, skipped: result.skippedCount || 0 });
        
        toast.success(message);
        
        // Refresh dependencies to get the updated list
        await loadDependencies();
        
        // Notify parent without closing dialog
        onDependenciesChange?.();
      } else {
        toast.error(result.error || lang('phaseDependency.errors.failedToInitialize'));
      }
    } catch (error) {
      console.error('Error initializing dependencies:', error);
      toast.error(lang('phaseDependency.errors.failedToInitialize'));
    } finally {
      setInitializing(false);
    }
  };

  const handleInitializeFromActivePhases = async () => {
    setInitializing(true);
    try {
      // First, sync product phases with active company phases
      const { PhaseSynchronizationService } = await import('@/services/phaseSynchronizationService');
      const syncResult = await PhaseSynchronizationService.syncProductWithCompanyPhases(productId, companyId);
      
      if (!syncResult.success) {
        toast.error(lang('phaseDependency.errors.failedToSyncPhases', { errors: syncResult.errors.join(', ') }));
        return;
      }

      console.log(`Synced ${syncResult.syncedCount} phases with company active phases`);

      // Then, copy dependencies from active phases
      const result = await ProductPhaseDependencyService.initializeFromActiveCompanyPhases(
        productId,
        companyId,
        true
      );

      if (result.success) {
        const message = lang('phaseDependency.success.syncedPhases', { phases: syncResult.syncedCount, deps: result.initializedCount || 0 });
        
        toast.success(message);
        
        await loadDependencies();
        
        onDependenciesChange?.();
      } else {
        toast.error(result.error || lang('phaseDependency.errors.failedToCopyDeps'));
      }
    } catch (error) {
      console.error('Error syncing phases and dependencies:', error);
      toast.error(lang('phaseDependency.errors.failedToSyncDeps'));
    } finally {
      setInitializing(false);
    }
  };

  const handleCreateDependency = async () => {
    if (!sourcePhaseId || !connectingPhaseId) {
      toast.error(lang('phaseDependency.errors.selectStartAndPhase'));
      return;
    }

    // Check if "select_phase" placeholder is selected
    if (sourcePhaseId === 'select_phase' || connectingPhaseId === 'select_phase' || 
        (targetPhaseId && targetPhaseId === 'select_phase')) {
      toast.error(lang('phaseDependency.errors.selectValidPhases'));
      return;
    }

    // Check if source and connecting phases are different
    if (sourcePhaseId === connectingPhaseId) {
      toast.error(lang('phaseDependency.errors.phasesMustBeDifferent'));
      return;
    }

    // If target phase is selected, check all phases are different
    if (targetPhaseId) {
      if (connectingPhaseId === targetPhaseId || sourcePhaseId === targetPhaseId) {
        toast.error(lang('phaseDependency.errors.allPhasesMustBeDifferent'));
        return;
      }
    }

    setCreating(true);
    try {
      const createdDependencies = [];

      // First dependency: Source → Connecting (using firstDependencyType)
      const dep1 = {
        product_id: productId,
        source_phase_id: sourcePhaseId,
        target_phase_id: connectingPhaseId,
        dependency_type: firstDependencyType,
        lag_days: 0
      };

      // Validate first dependency
      const validation1 = await ProductPhaseDependencyService.validateDependency(
        productId,
        sourcePhaseId,
        connectingPhaseId
      );

      if (!validation1.valid) {
        toast.error(lang('phaseDependency.errors.firstDepInvalid', { error: validation1.error }));
        setCreating(false);
        return;
      }

      const result1 = await ProductPhaseDependencyService.createProductDependency(dep1);
      if (result1.success && result1.data) {
        createdDependencies.push({
          ...result1.data,
          source_phase_name: getPhaseById(result1.data.source_phase_id)?.name || 'Unknown',
          target_phase_name: getPhaseById(result1.data.target_phase_id)?.name || 'Unknown'
        });
      } else {
        toast.error(lang('phaseDependency.errors.failedToCreateFirst', { error: result1.error }));
        setCreating(false);
        return;
      }

      // Second dependency: Connecting → Target (only if target phase is selected)
      if (targetPhaseId) {
        const dep2 = {
          product_id: productId,
          source_phase_id: connectingPhaseId,
          target_phase_id: targetPhaseId,
          dependency_type: secondDependencyType,
          lag_days: 0
        };

        // Validate second dependency
        const validation2 = await ProductPhaseDependencyService.validateDependency(
          productId,
          connectingPhaseId,
          targetPhaseId
        );

        if (!validation2.valid) {
          toast.error(lang('phaseDependency.errors.secondDepInvalid', { error: validation2.error }));
          setCreating(false);
          return;
        }

        const result2 = await ProductPhaseDependencyService.createProductDependency(dep2);
        if (result2.success && result2.data) {
          createdDependencies.push({
            ...result2.data,
            source_phase_name: getPhaseById(result2.data.source_phase_id)?.name || 'Unknown',
            target_phase_name: getPhaseById(result2.data.target_phase_id)?.name || 'Unknown'
          });
        } else {
          toast.error(lang('phaseDependency.errors.failedToCreateSecond', { error: result2.error }));
          setCreating(false);
          return;
        }
      }

      // Success message based on number of dependencies created
      const successMessage = targetPhaseId
        ? lang('phaseDependency.success.dependenciesCreated')
        : lang('phaseDependency.success.dependencyCreated');
      toast.success(successMessage);

      // Add dependencies to local state
      setDependencies(prev => [...prev, ...createdDependencies]);

      // Recalculate timeline to reflect newly created dependencies
      await runTimelineRecalculation();

      // Reset form
      setSourcePhaseId('');
      setConnectingPhaseId('');
      setTargetPhaseId('');
      setFirstDependencyType('finish_to_start');
      setSecondDependencyType('finish_to_start');

      // Notify parent without closing dialog
      onDependenciesChange?.();
    } catch (error) {
      console.error('Error creating dependencies:', error);
      toast.error(lang('phaseDependency.errors.failedToCreate'));
    } finally {
      setCreating(false);
    }
  };

  const handleEditDependency = (dependency: ProductPhaseDependency) => {
    setEditingDependencyId(dependency.id);
    setEditDependencyType(dependency.dependency_type);
    setEditLagDays(dependency.lag_days);
  };

  const handleCancelEdit = () => {
    setEditingDependencyId(null);
    setEditDependencyType('finish_to_start');
    setEditLagDays(0);
  };

  const handleSaveEdit = async (dependencyId: string) => {
    setUpdating(true);
    try {
      const result = await ProductPhaseDependencyService.updateProductDependency(dependencyId, {
        dependency_type: editDependencyType,
        lag_days: editLagDays
      });
      
      if (result.success && result.data) {
        toast.success(lang('phaseDependency.success.dependencyUpdated'));
        
        // Update the dependency in local state immediately
        setDependencies(prev => prev.map(dep => 
          dep.id === dependencyId 
            ? {
                ...dep,
                dependency_type: editDependencyType,
                lag_days: editLagDays
              }
            : dep
        ));
        
        setEditingDependencyId(null);
        
        // Notify parent without closing dialog
        onDependenciesChange?.();
      } else {
        toast.error(result.error || lang('phaseDependency.errors.failedToUpdate'));
      }
    } catch (error) {
      console.error('Error updating dependency:', error);
      toast.error(lang('phaseDependency.errors.failedToUpdate'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDependency = async (dependencyId: string) => {
    try {
      const result = await ProductPhaseDependencyService.deleteProductDependency(dependencyId);
      
      if (result.success) {
        toast.success(lang('phaseDependency.success.dependencyDeleted'));
        
        // Remove the dependency from local state immediately
        setDependencies(prev => prev.filter(dep => dep.id !== dependencyId));
        
        // Notify parent without closing dialog
        onDependenciesChange?.();
      } else {
        toast.error(result.error || lang('phaseDependency.errors.failedToDelete'));
      }
    } catch (error) {
      console.error('Error deleting dependency:', error);
      toast.error(lang('phaseDependency.errors.failedToDelete'));
    }
  };

  const getPhaseById = (id: string) => {
    const phase = phases.find(p => p.id === id);
    return phase;
  };

  const phasePositionMap = useMemo(() => {
    const map = new Map<string, number>();
    phases.forEach(phase => {
      map.set(phase.id, phase.position ?? Number.MAX_SAFE_INTEGER);
    });
    return map;
  }, [phases]);

  const getPhasePosition = (id?: string) => {
    if (!id) {
      return Number.MIN_SAFE_INTEGER;
    }
    return phasePositionMap.get(id) ?? Number.MAX_SAFE_INTEGER;
  };

  const runTimelineRecalculation = useCallback(async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('project_start_date, projected_launch_date, company_id')
        .eq('id', productId)
        .single();

      if (productError || !productData) {
        console.warn('[ProductPhaseDependencyDialog] Unable to load product data for recalculation', productError);
        return;
      }

      const dependenciesResult = await ProductPhaseDependencyService.getProductDependencies(productId);
      if (!dependenciesResult.success || !dependenciesResult.dependencies || dependenciesResult.dependencies.length === 0) {
        return;
      }

      const activeDependencies: PhaseDependency[] = dependenciesResult.dependencies.map(dep => ({
        id: dep.id,
        source_phase_id: dep.source_phase_id,
        target_phase_id: dep.target_phase_id,
        dependency_type: dep.dependency_type,
        lag_days: dep.lag_days ?? 0,
        company_id: productData.company_id || companyId,
        created_at: dep.created_at,
        updated_at: dep.updated_at
      }));

      const timelineMode: 'forward' | 'backward' = productData.project_start_date ? 'forward' : 'backward';

      const options = {
        mode: 'preserve-manual' as const,
        timelineMode,
        projectStartDate: productData.project_start_date ? new Date(productData.project_start_date) : undefined,
        projectedLaunchDate: productData.projected_launch_date ? new Date(productData.projected_launch_date) : undefined,
        enforceConstraints: false
      };

      await EnhancedRecalculationService.recalculateTimeline(
        productId,
        productData.company_id || companyId,
        options,
        activeDependencies
      );
    } catch (error) {
      console.error('[ProductPhaseDependencyDialog] Failed to recalculate timeline after dependency update', error);
    }
  }, [productId, companyId]);

  const getDependencyIcon = (type: ProductDependencyType) => {
    switch (type) {
      case 'finish_to_start': return <StopCircle className="h-4 w-4" />;
      case 'start_to_start': return <PlayCircle className="h-4 w-4" />;
      case 'finish_to_finish': return <Square className="h-4 w-4" />;
      case 'start_to_finish': return <ArrowRight className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  const getDependencyColor = (type: ProductDependencyType) => {
    switch (type) {
      case 'finish_to_start': return 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-800';
      case 'start_to_start': return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-800';
      case 'finish_to_finish': return 'bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-800';
      case 'start_to_finish': return 'bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getShortDependencyLabel = (type: ProductDependencyType) => {
    switch (type) {
      case 'finish_to_start': return 'FS';
      case 'start_to_start': return 'SS';
      case 'finish_to_finish': return 'FF';
      case 'start_to_finish': return 'SF';
      default: return String(type).toUpperCase();
    }
  };

  const sortedPhases = [...phases].sort((a, b) => (a.position || 0) - (b.position || 0));

  const dependencyGraph = useMemo(() => buildDependencyGraph(dependencies), [dependencies]);

  const graphWithPendingFirstLink = useMemo(() => {
    if (sourcePhaseId && connectingPhaseId && canAddDependencyEdge(dependencyGraph, sourcePhaseId, connectingPhaseId)) {
      return addEdgeToGraph(dependencyGraph, sourcePhaseId, connectingPhaseId);
    }
    return dependencyGraph;
  }, [dependencyGraph, sourcePhaseId, connectingPhaseId]);

  const sourcePhaseOptions = useMemo(() => (
    sortedPhases.filter(phase => phase.id !== connectingPhaseId && phase.id !== targetPhaseId)
  ), [sortedPhases, connectingPhaseId, targetPhaseId]);

  const connectingPhaseOptions = useMemo(() => (
    sortedPhases.filter(phase => {
      if (phase.id === sourcePhaseId || phase.id === targetPhaseId) {
        return false;
      }
      if (!sourcePhaseId) {
        return true;
      }
      const sourcePosition = getPhasePosition(sourcePhaseId);
      const candidatePosition = getPhasePosition(phase.id);
      if (candidatePosition <= sourcePosition) {
        return false;
      }
      return canAddDependencyEdge(dependencyGraph, sourcePhaseId, phase.id);
    })
  ), [sortedPhases, sourcePhaseId, targetPhaseId, dependencyGraph, phasePositionMap]);

  const targetPhaseOptions = useMemo(() => (
    sortedPhases.filter(phase => {
      if (phase.id === sourcePhaseId || phase.id === connectingPhaseId) {
        return false;
      }
      if (!connectingPhaseId) {
        return true;
      }
      const connectingPosition = getPhasePosition(connectingPhaseId);
      const candidatePosition = getPhasePosition(phase.id);
      if (candidatePosition <= connectingPosition) {
        return false;
      }
      return canAddDependencyEdge(graphWithPendingFirstLink, connectingPhaseId, phase.id);
    })
  ), [sortedPhases, sourcePhaseId, connectingPhaseId, graphWithPendingFirstLink, phasePositionMap]);

  useEffect(() => {
    if (sourcePhaseId && connectingPhaseId && !canAddDependencyEdge(dependencyGraph, sourcePhaseId, connectingPhaseId)) {
      setConnectingPhaseId('');
    }
  }, [sourcePhaseId, connectingPhaseId, dependencyGraph]);

  useEffect(() => {
    if (connectingPhaseId && targetPhaseId) {
      const graphToValidate = sourcePhaseId && connectingPhaseId
        ? addEdgeToGraph(dependencyGraph, sourcePhaseId, connectingPhaseId)
        : dependencyGraph;
      if (!canAddDependencyEdge(graphToValidate, connectingPhaseId, targetPhaseId)) {
        setTargetPhaseId('');
      }
    }
  }, [sourcePhaseId, connectingPhaseId, targetPhaseId, dependencyGraph]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto z-[50]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            {lang('phaseDependency.title')}
          </DialogTitle>
          <DialogDescription>
            {lang('phaseDependency.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Initialization Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{lang('phaseDependency.cloneFromCompany')}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={initializing}
                  onClick={() => setShowConfirmDialog(true)}
                >
                  {initializing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {initializing ? lang('phaseDependency.buttons.syncing') : lang('phaseDependency.buttons.syncFromCompany')}
                </Button>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{lang('phaseDependency.alert.completeReplacement')}:</strong> {lang('phaseDependency.alert.replacementDescription')}
                <strong className="text-red-600"> {lang('phaseDependency.alert.permanentlyRemoved')}</strong> {lang('phaseDependency.alert.replacedWithActive')}
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Current Dependencies */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{lang('phaseDependency.currentDependencies')}</h4>
              <Badge variant="outline">
                {dependencies.length} {dependencies.length === 1 ? lang('phaseDependency.labels.dependency') : lang('phaseDependency.labels.dependencies')}
                {groupedDependencies.length !== dependencies.length && ` (${groupedDependencies.length} ${groupedDependencies.length === 1 ? lang('phaseDependency.labels.chain') : lang('phaseDependency.labels.chains')})`}
              </Badge>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                {lang('phaseDependency.loadingDependencies')}
              </div>
            ) : dependencies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{lang('phaseDependency.noDependencies')}</p>
                <p className="text-sm">{lang('phaseDependency.initializeOrCreate')}</p>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in-0 duration-300">
                {groupedDependencies.map(chain => {
                  const isChain = chain.dependencies.length > 1;
                  // Check if any dependency in this chain is being edited
                  const editingDepInChain = chain.dependencies.find(d => d.id === editingDependencyId);

                  return (
                    <div
                      key={chain.id}
                      className="p-3 border rounded-lg transition-all duration-200 animate-in slide-in-from-top-2 fade-in-0 hover:bg-muted/50 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-wrap">
                          {/* Display chain as: Phase1 → (type) → Phase2 → (type) → Phase3 */}
                          {chain.phases.map((phaseId, index) => {
                            const phase = getPhaseById(phaseId);
                            const dep = chain.dependencies[index]; // dependency after this phase
                            const isLastPhase = index === chain.phases.length - 1;
                            const isEditingThisDep = dep && dep.id === editingDependencyId;

                            return (
                              <React.Fragment key={phaseId}>
                                <Badge variant="outline" className="font-mono">
                                  {phase?.name || `Phase ${phaseId.slice(0, 8)}`}
                                </Badge>

                                {!isLastPhase && dep && (
                                  <>
                                    <div className="flex items-center space-x-1">
                                      {getDependencyIcon(isEditingThisDep ? editDependencyType : dep.dependency_type)}
                                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    {isEditingThisDep ? (
                                      <Select
                                        value={editDependencyType}
                                        onValueChange={(value: ProductDependencyType) => setEditDependencyType(value)}
                                      >
                                        <SelectTrigger className="w-20 h-8">
                                          <SelectValue>
                                            <Badge className={`text-xs ${getDependencyColor(editDependencyType)}`}>
                                              {getShortDependencyLabel(editDependencyType)}
                                            </Badge>
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="finish_to_start">
                                            <Badge className="bg-blue-100 text-blue-800 text-xs">FS</Badge>
                                            <span className="ml-2 text-xs">{lang('phaseDependency.types.finishToStart')}</span>
                                          </SelectItem>
                                          <SelectItem value="start_to_start">
                                            <Badge className="bg-green-100 text-green-800 text-xs">SS</Badge>
                                            <span className="ml-2 text-xs">{lang('phaseDependency.types.startToStart')}</span>
                                          </SelectItem>
                                          <SelectItem value="finish_to_finish">
                                            <Badge className="bg-purple-100 text-purple-800 text-xs">FF</Badge>
                                            <span className="ml-2 text-xs">{lang('phaseDependency.types.finishToFinish')}</span>
                                          </SelectItem>
                                          <SelectItem value="start_to_finish">
                                            <Badge className="bg-orange-100 text-orange-800 text-xs">SF</Badge>
                                            <span className="ml-2 text-xs">{lang('phaseDependency.types.startToFinish')}</span>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Badge className={`text-xs ${getDependencyColor(dep.dependency_type)}`}>
                                        {getShortDependencyLabel(dep.dependency_type)}
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        <div className="flex items-center space-x-1">
                          {editingDepInChain ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveEdit(editingDepInChain.id)}
                                disabled={updating}
                                className="text-green-600 hover:text-green-700"
                              >
                                {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDependency(chain.dependencies[0])}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  // Delete all dependencies in the chain
                                  for (const dep of chain.dependencies) {
                                    await handleDeleteDependency(dep.id);
                                  }
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Add New Dependency */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {lang('phaseDependency.addCustomDependency')}
            </h4>

            {/* Three Phase Dropdowns with Dependency Type Selectors */}
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 items-end">
                {/* Source Phase */}
                <div>
                  <Label htmlFor="sourcePhase" className="text-sm font-medium">
                    {lang('phaseDependency.labels.startPhase')}
                  </Label>
                  <Select value={sourcePhaseId} onValueChange={setSourcePhaseId}>
                    <SelectTrigger>
                      <SelectValue placeholder={lang('phaseDependency.placeholders.selectStartPhase')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="select_phase">
                          {lang('phaseDependency.placeholders.selectStartPhase')}
                        </SelectItem>
                      {sourcePhaseOptions.map(phase => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* First Dependency Type Selector */}
                <div className="flex flex-col items-center">
                  <Label className="text-xs text-muted-foreground mb-1">{lang('phaseDependency.labels.type')}</Label>
                  <Select
                    value={firstDependencyType}
                    onValueChange={(value: ProductDependencyType) => setFirstDependencyType(value)}
                  >
                    <SelectTrigger className="w-20 h-10">
                      <SelectValue>
                        <Badge className={`text-xs ${getDependencyColor(firstDependencyType)}`}>
                          {getShortDependencyLabel(firstDependencyType)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finish_to_start">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">FS</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{lang('phaseDependency.types.finishToStart')}</span>
                      </SelectItem>
                      <SelectItem value="start_to_start">
                        <Badge className="bg-green-100 text-green-800 text-xs">SS</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{lang('phaseDependency.types.startToStart')}</span>
                      </SelectItem>
                      <SelectItem value="finish_to_finish">
                        <Badge className="bg-purple-100 text-purple-800 text-xs">FF</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{lang('phaseDependency.types.finishToFinish')}</span>
                      </SelectItem>
                      <SelectItem value="start_to_finish">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">SF</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{lang('phaseDependency.types.startToFinish')}</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Connecting Phase (Middle) */}
                <div>
                  <Label htmlFor="connectingPhase" className="text-sm font-medium">
                    {lang('phaseDependency.labels.phase')}
                  </Label>
                  <Select value={connectingPhaseId} onValueChange={setConnectingPhaseId}>
                    <SelectTrigger>
                      <SelectValue placeholder={lang('phaseDependency.placeholders.selectPhase')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select_phase">
                        {lang('phaseDependency.placeholders.selectPhase')}
                      </SelectItem>
                      {connectingPhaseOptions.map(phase => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Second Dependency Type Selector */}
                <div className="flex flex-col items-center">
                  <Label className="text-xs text-muted-foreground mb-1">{lang('phaseDependency.labels.type')}</Label>
                  <Select
                    value={secondDependencyType}
                    onValueChange={(value: ProductDependencyType) => setSecondDependencyType(value)}
                  >
                    <SelectTrigger className="w-20 h-10" disabled={!connectingPhaseId}>
                      <SelectValue>
                        <Badge className={`text-xs ${getDependencyColor(secondDependencyType)}`}>
                          {getShortDependencyLabel(secondDependencyType)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finish_to_start">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">FS</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{lang('phaseDependency.types.finishToStart')}</span>
                      </SelectItem>
                      <SelectItem value="start_to_start">
                        <Badge className="bg-green-100 text-green-800 text-xs">SS</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{lang('phaseDependency.types.startToStart')}</span>
                      </SelectItem>
                      <SelectItem value="finish_to_finish">
                        <Badge className="bg-purple-100 text-purple-800 text-xs">FF</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{lang('phaseDependency.types.finishToFinish')}</span>
                      </SelectItem>
                      <SelectItem value="start_to_finish">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">SF</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{lang('phaseDependency.types.startToFinish')}</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Phase */}
                <div>
                  <Label htmlFor="targetPhase" className="text-sm font-medium">
                    {lang('phaseDependency.labels.endPhase')}
                  </Label>
                  <Select value={targetPhaseId} onValueChange={setTargetPhaseId} disabled={!connectingPhaseId}>
                    <SelectTrigger>
                      <SelectValue placeholder={lang('phaseDependency.placeholders.selectTargetPhase')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select_phase">
                        {lang('phaseDependency.placeholders.selectPhase')}
                      </SelectItem>
                      {targetPhaseOptions.map(phase => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dependency Preview */}
              {sourcePhaseId && connectingPhaseId && sourcePhaseId !== 'select_phase' && connectingPhaseId !== 'select_phase' && 
             (!targetPhaseId || targetPhaseId !== 'select_phase') && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs">
                      {getPhaseById(sourcePhaseId)?.name}
                    </Badge>
                    <Badge className={`text-xs ${getDependencyColor(firstDependencyType)}`}>
                      {getShortDependencyLabel(firstDependencyType)}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-mono text-xs">
                      {getPhaseById(connectingPhaseId)?.name}
                    </Badge>
                    {targetPhaseId && (
                      <>
                        <Badge className={`text-xs ${getDependencyColor(secondDependencyType)}`}>
                          {getShortDependencyLabel(secondDependencyType)}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="font-mono text-xs">
                          {getPhaseById(targetPhaseId)?.name}
                        </Badge>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>
                      <strong>{lang('phaseDependency.preview.link1')}:</strong> {getPhaseById(sourcePhaseId)?.name}
                      <Badge className={`mx-1 text-xs ${getDependencyColor(firstDependencyType)}`}>
                        {getShortDependencyLabel(firstDependencyType)}
                      </Badge>
                      {getPhaseById(connectingPhaseId)?.name}
                    </p>
                    {targetPhaseId && (
                      <p>
                        <strong>{lang('phaseDependency.preview.link2')}:</strong> {getPhaseById(connectingPhaseId)?.name}
                        <Badge className={`mx-1 text-xs ${getDependencyColor(secondDependencyType)}`}>
                          {getShortDependencyLabel(secondDependencyType)}
                        </Badge>
                        {getPhaseById(targetPhaseId)?.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {sourcePhaseId && connectingPhaseId && 
             sourcePhaseId !== 'select_phase' && connectingPhaseId !== 'select_phase' && 
             (!targetPhaseId || targetPhaseId !== 'select_phase') && (
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateDependency}
                  disabled={creating || !sourcePhaseId || !connectingPhaseId || 
                           sourcePhaseId === 'select_phase' || connectingPhaseId === 'select_phase' ||
                           (targetPhaseId && targetPhaseId === 'select_phase')}
                  className="h-10"
                >
                  {creating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {creating
                    ? lang('phaseDependency.buttons.creating')
                    : targetPhaseId
                      ? lang('phaseDependency.buttons.createDependencies')
                      : lang('phaseDependency.buttons.createDependency')}
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {lang('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent  className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('phaseDependency.confirmDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('phaseDependency.confirmDialog.description')}
              <br /><br />
              <strong>{lang('phaseDependency.confirmDialog.cannotBeUndone')}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                handleInitializeFromActivePhases();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {lang('phaseDependency.buttons.replaceAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
