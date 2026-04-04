import React, { useState, useCallback } from 'react';
import { GitBranch, ExternalLink, Calendar, Building, ChevronRight, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFDAPredicateTrail } from '@/hooks/useFDAPredicateSearch';
import { FDAPredicateService } from '@/services/fdaPredicateService';
import { PredicateDevice } from '@/types/fdaPredicateTrail';

interface InteractivePredicateTrailProps {
  initialKNumber: string;
  maxDepth?: number;
}

interface TrailNode {
  device: PredicateDevice;
  children: TrailNode[];
  isExpanded: boolean;
  isLoading: boolean;
  level: number;
}

export function InteractivePredicateTrail({ initialKNumber, maxDepth = 5 }: InteractivePredicateTrailProps) {
  // ALL HOOKS MUST BE DECLARED FIRST, BEFORE ANY CONDITIONAL LOGIC OR EARLY RETURNS
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([initialKNumber]));
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [navigationPath, setNavigationPath] = useState<PredicateDevice[]>([]);
  const [trailTree, setTrailTree] = useState<Map<string, PredicateDevice[]>>(new Map());

  const { data: initialTrail, isLoading: initialLoading, error } = useFDAPredicateTrail(
    initialKNumber, 
    1 // Start with depth 1 for interactive expansion
  );

  // Initialize trail tree with initial data and auto-expand if predicates exist
  React.useEffect(() => {
    if (initialTrail?.upstreamPredicates && initialTrail.upstreamPredicates.length > 0) {
      setTrailTree(prev => new Map(prev.set(initialKNumber, initialTrail.upstreamPredicates)));
      // Auto-expand the target device to show its predicates
      setExpandedNodes(prev => new Set([...prev, initialKNumber]));
    }
  }, [initialTrail, initialKNumber]);

  const handleNodeExpand = useCallback(async (kNumber: string, device: PredicateDevice) => {
    if (loadingNodes.has(kNumber)) return;

    if (expandedNodes.has(kNumber)) {
      // Collapse node
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(kNumber);
        return newSet;
      });
    } else {
      // Expand node - load its predicates
      setLoadingNodes(prev => new Set(prev.add(kNumber)));
      
      try {
        const trail = await FDAPredicateService.buildPredicateTrail(kNumber, 1);
        
        if (trail.upstreamPredicates.length > 0) {
          setTrailTree(prev => new Map(prev.set(kNumber, trail.upstreamPredicates)));
          setExpandedNodes(prev => new Set(prev.add(kNumber)));
        }
      } catch (error) {
        console.error(`Failed to load predicates for ${kNumber}:`, error);
      } finally {
        setLoadingNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(kNumber);
          return newSet;
        });
      }
    }
  }, [expandedNodes, loadingNodes]);

  const handleDeviceClick = useCallback((device: PredicateDevice) => {
    setNavigationPath(prev => {
      // Check if this device is already in the path
      const existingIndex = prev.findIndex(d => d.kNumber === device.kNumber);
      if (existingIndex !== -1) {
        // If it exists, truncate the path at that point and add the device
        return [...prev.slice(0, existingIndex + 1)];
      }
      // Otherwise, add it to the path
      return [...prev, device];
    });
  }, []);

  const handleBreadcrumbClick = useCallback((index: number) => {
    setNavigationPath(prev => prev.slice(0, index + 1));
  }, []);

  const renderBreadcrumbs = useCallback(() => {
    if (navigationPath.length === 0) return null;

    return (
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Navigation Path:</span>
            {navigationPath.map((device, index) => (
              <React.Fragment key={device.kNumber}>
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBreadcrumbClick(index)}
                  className="h-auto p-1 text-sm"
                >
                  {device.kNumber}
                </Button>
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }, [navigationPath, handleBreadcrumbClick]);

  const renderInteractiveDevice = useCallback((
    device: PredicateDevice, 
    level: number = 0, 
    isTarget: boolean = false
  ) => {
    const isExpanded = expandedNodes.has(device.kNumber);
    const isLoading = loadingNodes.has(device.kNumber);
    const hasChildren = trailTree.has(device.kNumber);
    const children = trailTree.get(device.kNumber) || [];

    return (
      <div key={device.kNumber} className={`relative ${level > 0 ? 'ml-6' : ''}`}>
        {/* Connection line for non-root nodes */}
        {level > 0 && (
          <>
            <div className="absolute -left-3 top-6 w-3 h-px bg-border"></div>
            <div className="absolute -left-6 top-6 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary"></div>
          </>
        )}
        
        <Card className={`mb-3 ${isTarget ? 'border-primary bg-primary/5' : ''} hover:shadow-md transition-shadow`}>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Device header with expand button */}
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNodeExpand(device.kNumber, device)}
                      className="h-6 w-6 p-0"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                    
                    <Badge 
                      variant={isTarget ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleDeviceClick(device)}
                    >
                      {device.kNumber}
                    </Badge>
                    
                    {device.productCode && (
                      <Badge variant="secondary">{device.productCode}</Badge>
                    )}
                    {device.deviceClass && (
                      <Badge variant="outline">Class {device.deviceClass}</Badge>
                    )}
                    {isTarget && <Badge className="bg-primary">Target Device</Badge>}
                  </div>
                  
                  <h4 
                    className="font-medium text-base cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleDeviceClick(device)}
                  >
                    {device.deviceName}
                  </h4>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {device.applicant && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {device.applicant}
                      </div>
                    )}
                    {device.decisionDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(device.decisionDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNodeExpand(device.kNumber, device)}
                    disabled={isLoading}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  {device.documentUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={device.documentUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Device summary */}
              {device.statementOrSummary && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    {device.statementOrSummary.length > 200 
                      ? device.statementOrSummary.substring(0, 200) + '...'
                      : device.statementOrSummary
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div className="ml-4 border-l border-border/50 pl-2">
            {children.map(childDevice => 
              renderInteractiveDevice(childDevice, level + 1, false)
            )}
          </div>
        )}
      </div>
    );
  }, [expandedNodes, loadingNodes, trailTree, handleNodeExpand, handleDeviceClick]);

  // NOW WE CAN SAFELY HAVE CONDITIONAL RENDERING - ALL HOOKS ARE DECLARED ABOVE
  if (initialLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading interactive predicate trail...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-destructive">
            <p>Error loading predicate trail: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!initialTrail) {
    return null;
  }

  const targetDevice = initialTrail.targetDevice || initialTrail.predicateChain.find(d => d.kNumber === initialKNumber) || {
    kNumber: initialKNumber,
    deviceName: 'Target Device',
    applicant: 'Unknown',
    decisionDate: '',
    statementOrSummary: ''
  } as PredicateDevice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Interactive Predicate Trail Navigator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{initialTrail.upstreamPredicates.length}</div>
              <div className="text-sm text-muted-foreground">Upstream Predicates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{expandedNodes.size - 1}</div>
              <div className="text-sm text-muted-foreground">Explored Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{navigationPath.length}</div>
              <div className="text-sm text-muted-foreground">Navigation Depth</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>🔍 <strong>Click</strong> on K-numbers to add to navigation path</p>
            <p>📂 <strong>Click</strong> expand buttons to load predicate devices</p>
            <p>🌐 <strong>Click</strong> external link to view FDA document</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation breadcrumbs */}
      {renderBreadcrumbs()}

      {/* Interactive Trail Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Family Tree View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Debug info */}
            {initialTrail && (
              <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <strong>Debug:</strong> Trail has {initialTrail.upstreamPredicates?.length || 0} upstream, 
                {initialTrail.predicateChain?.length || 0} chain items, 
                Tree has {trailTree.size} entries
                <details className="mt-2">
                  <summary>Raw Trail Data</summary>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(initialTrail, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            {renderInteractiveDevice(targetDevice, 0, true)}
          </div>
        </CardContent>
      </Card>

      {/* Downstream References */}
      {initialTrail.downstreamReferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Downstream References</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {initialTrail.downstreamReferences.slice(0, 6).map(device => (
                <div 
                  key={device.kNumber} 
                  className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => handleDeviceClick(device)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">{device.kNumber}</Badge>
                    {device.deviceClass && (
                      <Badge variant="secondary" className="text-xs">Class {device.deviceClass}</Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{device.deviceName}</p>
                  <p className="text-xs text-muted-foreground truncate">{device.applicant}</p>
                </div>
              ))}
            </div>
            
            {initialTrail.downstreamReferences.length > 6 && (
              <div className="text-center mt-4">
                <Badge variant="outline">
                  +{initialTrail.downstreamReferences.length - 6} more downstream references
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}