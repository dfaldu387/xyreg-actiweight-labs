import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { FaultTreeData, createEmptyFaultTreeData } from '@/types/rcaData';
import { nanoid } from 'nanoid';
import { 
  GitBranch, 
  Plus, 
  Trash2, 
  Save,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Circle,
  Square,
  Diamond,
  Zap,
  Info
} from 'lucide-react';

interface FaultTreeBuilderProps {
  initialData?: FaultTreeData | null;
  topEventDescription?: string;
  onSave: (data: FaultTreeData) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

interface Gate {
  id: string;
  type: 'AND' | 'OR';
  description: string;
  parentId: string | null;
}

interface BasicEvent {
  id: string;
  description: string;
  parentGateId: string;
  probability?: number;
}

export function FaultTreeBuilder({ 
  initialData, 
  topEventDescription = '',
  onSave, 
  isLoading = false,
  readOnly = false 
}: FaultTreeBuilderProps) {
  const [topEvent, setTopEvent] = useState(initialData?.topEvent || topEventDescription);
  const [gates, setGates] = useState<Gate[]>(initialData?.gates || []);
  const [basicEvents, setBasicEvents] = useState<BasicEvent[]>(initialData?.basicEvents || []);
  const [rootCause, setRootCause] = useState(initialData?.rootCause || '');
  const [expandedGates, setExpandedGates] = useState<Set<string>>(new Set(['root']));

  // Add root gate if none exists
  const hasRootGate = gates.some(g => g.parentId === null);
  
  const handleAddRootGate = (type: 'AND' | 'OR') => {
    if (readOnly || hasRootGate) return;
    const newGate: Gate = {
      id: nanoid(),
      type,
      description: `${type} Gate - All/Any of below must occur`,
      parentId: null
    };
    setGates(prev => [...prev, newGate]);
    setExpandedGates(prev => new Set([...prev, newGate.id]));
  };

  const handleAddGate = (parentId: string, type: 'AND' | 'OR') => {
    if (readOnly) return;
    const newGate: Gate = {
      id: nanoid(),
      type,
      description: '',
      parentId
    };
    setGates(prev => [...prev, newGate]);
    setExpandedGates(prev => new Set([...prev, newGate.id]));
  };

  const handleAddBasicEvent = (parentGateId: string) => {
    if (readOnly) return;
    const newEvent: BasicEvent = {
      id: nanoid(),
      description: '',
      parentGateId
    };
    setBasicEvents(prev => [...prev, newEvent]);
  };

  const handleUpdateGate = (id: string, updates: Partial<Gate>) => {
    setGates(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const handleUpdateBasicEvent = (id: string, updates: Partial<BasicEvent>) => {
    setBasicEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDeleteGate = (id: string) => {
    // Delete gate and all children
    const childGateIds = gates.filter(g => g.parentId === id).map(g => g.id);
    const allGatesToDelete = [id, ...childGateIds];
    
    // Recursively find all descendant gates
    let toCheck = [...childGateIds];
    while (toCheck.length > 0) {
      const checking = toCheck.pop()!;
      const children = gates.filter(g => g.parentId === checking).map(g => g.id);
      allGatesToDelete.push(...children);
      toCheck.push(...children);
    }
    
    setGates(prev => prev.filter(g => !allGatesToDelete.includes(g.id)));
    setBasicEvents(prev => prev.filter(e => !allGatesToDelete.includes(e.parentGateId)));
  };

  const handleDeleteBasicEvent = (id: string) => {
    setBasicEvents(prev => prev.filter(e => e.id !== id));
  };

  const toggleGateExpansion = (gateId: string) => {
    setExpandedGates(prev => {
      const next = new Set(prev);
      if (next.has(gateId)) {
        next.delete(gateId);
      } else {
        next.add(gateId);
      }
      return next;
    });
  };

  // Calculate minimal cut sets (simplified)
  const cutSets = useMemo(() => {
    if (basicEvents.length === 0) return [];
    
    // Simple cut set calculation for demo - in production this would use proper Boolean algebra
    const findCutSets = (gateId: string | null): string[][] => {
      if (gateId === null) {
        const rootGate = gates.find(g => g.parentId === null);
        if (!rootGate) return [];
        return findCutSets(rootGate.id);
      }
      
      const gate = gates.find(g => g.id === gateId);
      if (!gate) return [];
      
      const childGates = gates.filter(g => g.parentId === gateId);
      const childEvents = basicEvents.filter(e => e.parentGateId === gateId);
      
      let results: string[][] = [];
      
      // Add direct basic events
      childEvents.forEach(e => {
        if (gate.type === 'OR') {
          results.push([e.description || e.id]);
        }
      });
      
      // Process child gates recursively
      childGates.forEach(cg => {
        const childCutSets = findCutSets(cg.id);
        if (gate.type === 'OR') {
          results.push(...childCutSets);
        }
      });
      
      if (gate.type === 'AND') {
        // For AND gates, combine all inputs
        const allInputs = [
          ...childEvents.map(e => e.description || e.id),
          ...childGates.flatMap(cg => findCutSets(cg.id).flat())
        ];
        if (allInputs.length > 0) {
          results = [allInputs];
        }
      }
      
      return results;
    };
    
    return findCutSets(null);
  }, [gates, basicEvents]);

  const handleSave = useCallback(() => {
    const ftaData: FaultTreeData = {
      methodology: 'fta',
      topEvent,
      gates,
      basicEvents,
      cutSets: cutSets.length > 0 ? cutSets : undefined,
      rootCause,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(ftaData);
  }, [topEvent, gates, basicEvents, cutSets, rootCause, initialData, onSave]);

  const renderGateNode = (gate: Gate, depth: number = 0) => {
    const childGates = gates.filter(g => g.parentId === gate.id);
    const childEvents = basicEvents.filter(e => e.parentGateId === gate.id);
    const isExpanded = expandedGates.has(gate.id);
    const hasChildren = childGates.length > 0 || childEvents.length > 0;

    return (
      <div key={gate.id} className="space-y-2" style={{ marginLeft: depth * 24 }}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleGateExpansion(gate.id)}>
          <div className={`flex items-start gap-2 p-3 border rounded-lg ${
            gate.type === 'AND' ? 'border-blue-200 bg-blue-50/50' : 'border-orange-200 bg-orange-50/50'
          }`}>
            {hasChildren ? (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            ) : (
              <div className="w-6" />
            )}
            
            <div className="flex items-center gap-2 shrink-0">
              {gate.type === 'AND' ? (
                <Diamond className="h-5 w-5 text-blue-600" />
              ) : (
                <Circle className="h-5 w-5 text-orange-600" />
              )}
              <Badge variant={gate.type === 'AND' ? 'default' : 'secondary'} className="text-xs">
                {gate.type}
              </Badge>
            </div>
            
            <div className="flex-1 min-w-0">
              {readOnly ? (
                <p className="text-sm">{gate.description || 'Unnamed gate'}</p>
              ) : (
                <Input
                  value={gate.description}
                  onChange={(e) => handleUpdateGate(gate.id, { description: e.target.value })}
                  placeholder={`${gate.type} Gate description...`}
                  className="h-8"
                />
              )}
            </div>
            
            {!readOnly && (
              <div className="flex gap-1 shrink-0">
                <Select onValueChange={(v) => handleUpdateGate(gate.id, { type: v as 'AND' | 'OR' })}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue placeholder={gate.type} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDeleteGate(gate.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
          
          <CollapsibleContent>
            <div className="mt-2 space-y-2 border-l-2 border-muted ml-3 pl-3">
              {/* Child Gates */}
              {childGates.map(cg => renderGateNode(cg, depth + 1))}
              
              {/* Basic Events */}
              {childEvents.map(event => (
                <div key={event.id} className="flex items-center gap-2 p-2 border rounded-lg bg-green-50/50 border-green-200">
                  <Square className="h-4 w-4 text-green-600 shrink-0" />
                  <Badge variant="outline" className="text-xs shrink-0">Event</Badge>
                  {readOnly ? (
                    <p className="text-sm flex-1">{event.description || 'Unnamed event'}</p>
                  ) : (
                    <>
                      <Input
                        value={event.description}
                        onChange={(e) => handleUpdateBasicEvent(event.id, { description: e.target.value })}
                        placeholder="Basic event (root cause)..."
                        className="flex-1 h-8"
                      />
                      <Input
                        type="number"
                        value={event.probability || ''}
                        onChange={(e) => handleUpdateBasicEvent(event.id, { probability: parseFloat(e.target.value) || undefined })}
                        placeholder="P"
                        className="w-16 h-8"
                        step="0.1"
                        min="0"
                        max="1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteBasicEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              
              {/* Add buttons */}
              {!readOnly && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddGate(gate.id, 'AND')}
                    className="text-xs"
                  >
                    <Diamond className="h-3 w-3 mr-1" />
                    + AND Gate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddGate(gate.id, 'OR')}
                    className="text-xs"
                  >
                    <Circle className="h-3 w-3 mr-1" />
                    + OR Gate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBasicEvent(gate.id)}
                    className="text-xs"
                  >
                    <Square className="h-3 w-3 mr-1" />
                    + Basic Event
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const rootGate = gates.find(g => g.parentId === null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          Fault Tree Analysis (FTA)
        </CardTitle>
        <CardDescription>
          Build a Boolean logic tree to identify all possible failure paths
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg text-xs">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span>Top Event (Failure)</span>
          </div>
          <div className="flex items-center gap-1">
            <Diamond className="h-4 w-4 text-blue-600" />
            <span>AND Gate (all required)</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-orange-600" />
            <span>OR Gate (any sufficient)</span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-4 w-4 text-green-600" />
            <span>Basic Event (root cause)</span>
          </div>
        </div>

        {/* Top Event */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Top Event (Failure Being Analyzed)
          </Label>
          <Input
            value={topEvent}
            onChange={(e) => setTopEvent(e.target.value)}
            placeholder="e.g., Device fails to deliver therapy, Software crash during operation"
            disabled={readOnly}
            className="border-destructive/50"
          />
        </div>

        {/* Tree Structure */}
        <div className="space-y-3">
          <Label>Fault Tree Structure</Label>
          
          {!hasRootGate && !readOnly ? (
            <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg">
              <Info className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Start by adding a root gate:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddRootGate('OR')}
              >
                <Circle className="h-4 w-4 mr-2 text-orange-600" />
                OR Gate (Any cause)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddRootGate('AND')}
              >
                <Diamond className="h-4 w-4 mr-2 text-blue-600" />
                AND Gate (All causes)
              </Button>
            </div>
          ) : rootGate ? (
            <div className="border rounded-lg p-4 bg-muted/20">
              {renderGateNode(rootGate)}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No fault tree structure defined
            </div>
          )}
        </div>

        {/* Cut Sets */}
        {cutSets.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Minimal Cut Sets
            </Label>
            <p className="text-xs text-muted-foreground">
              These are the minimal combinations of basic events that can cause the top event
            </p>
            <div className="space-y-2">
              {cutSets.slice(0, 5).map((cutSet, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <Badge variant="outline" className="shrink-0">Cut Set {idx + 1}</Badge>
                  <span className="text-sm">{cutSet.join(' AND ')}</span>
                </div>
              ))}
              {cutSets.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{cutSets.length - 5} more cut sets
                </p>
              )}
            </div>
          </div>
        )}

        {/* Root Cause Summary */}
        <div className="space-y-2">
          <Label>Root Cause Summary</Label>
          <Textarea
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="Based on the fault tree analysis, document the primary root cause(s)..."
            rows={3}
            disabled={readOnly}
          />
          <p className="text-xs text-muted-foreground">
            Focus on the minimal cut sets identified - which basic events are most likely to cause the failure?
          </p>
        </div>
      </CardContent>

      {!readOnly && (
        <CardFooter className="border-t pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !topEvent}
            className="w-full"
          >
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Fault Tree Analysis
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
