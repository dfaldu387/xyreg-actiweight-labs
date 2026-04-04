import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { TraceabilityLinksService, CreateTraceabilityLinkData } from "@/services/traceabilityLinksService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, Plus, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface TraceabilityLinkEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  sourceType?: string;
  sourceId?: string;
  sourceName?: string;
}

interface LinkableItem {
  id: string;
  identifier: string;
  name: string;
  type: string;
}

const ENTITY_TYPES = [
  { value: 'user_need', label: 'User Need', prefix: 'UN-' },
  { value: 'system_requirement', label: 'System Requirement', prefix: 'RS-' },
  { value: 'software_requirement', label: 'Software Requirement', prefix: 'SWR-' },
  { value: 'hardware_requirement', label: 'Hardware Requirement', prefix: 'HWR-' },
  { value: 'test_case', label: 'Test Case', prefix: 'TC-' },
  { value: 'hazard', label: 'Hazard', prefix: 'HAZ-' },
];

const LINK_TYPES = [
  { value: 'derives_from', label: 'Derives From' },
  { value: 'implements_risk_control', label: 'Implements Risk Control' },
  { value: 'verifies_control', label: 'Verifies Control' },
  { value: 'mitigates', label: 'Mitigates' },
  { value: 'traces_to', label: 'Traces To' },
];

export function TraceabilityLinkEditor({
  open,
  onOpenChange,
  productId,
  companyId,
  sourceType,
  sourceId,
  sourceName,
}: TraceabilityLinkEditorProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  
  const [selectedSourceType, setSelectedSourceType] = useState(sourceType || '');
  const [selectedSourceId, setSelectedSourceId] = useState(sourceId || '');
  const [selectedTargetType, setSelectedTargetType] = useState('');
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [linkType, setLinkType] = useState('traces_to');
  const [rationale, setRationale] = useState('');

  // Fetch source items based on selected type
  const { data: sourceItems = [] } = useQuery({
    queryKey: ['linkable-items', productId, selectedSourceType],
    queryFn: () => fetchItemsByType(productId, selectedSourceType),
    enabled: !!selectedSourceType && !sourceId,
  });

  // Fetch target items based on selected type
  const { data: targetItems = [] } = useQuery({
    queryKey: ['linkable-items', productId, selectedTargetType],
    queryFn: () => fetchItemsByType(productId, selectedTargetType),
    enabled: !!selectedTargetType,
  });

  const createLinksMutation = useMutation({
    mutationFn: async () => {
      const finalSourceId = sourceId || selectedSourceId;
      const finalSourceType = sourceType || selectedSourceType;
      
      if (!finalSourceId || !finalSourceType || selectedTargetIds.length === 0) {
        throw new Error('Please select source and target items');
      }

      const links: CreateTraceabilityLinkData[] = selectedTargetIds.map(targetId => ({
        product_id: productId,
        company_id: companyId,
        source_type: finalSourceType,
        source_id: finalSourceId,
        target_type: selectedTargetType,
        target_id: targetId,
        link_type: linkType,
        rationale: rationale || undefined,
      }));

      for (const link of links) {
        await TraceabilityLinksService.create(link);
      }

      return links.length;
    },
    onSuccess: (count) => {
      toast.success(`Created ${count} traceability link${count > 1 ? 's' : ''}`);
      queryClient.invalidateQueries({ queryKey: ['traceability-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['traceability-gaps'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create links: ${error.message}`);
    },
  });

  const resetForm = () => {
    if (!sourceType) setSelectedSourceType('');
    if (!sourceId) setSelectedSourceId('');
    setSelectedTargetType('');
    setSelectedTargetIds([]);
    setLinkType('traces_to');
    setRationale('');
  };

  const handleTargetToggle = (targetId: string, checked: boolean) => {
    if (checked) {
      setSelectedTargetIds(prev => [...prev, targetId]);
    } else {
      setSelectedTargetIds(prev => prev.filter(id => id !== targetId));
    }
  };

  const selectedSource = useMemo(() => {
    if (sourceId && sourceName) {
      return { id: sourceId, name: sourceName };
    }
    return sourceItems.find(item => item.id === selectedSourceId);
  }, [sourceId, sourceName, sourceItems, selectedSourceId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Create Traceability Link
          </DialogTitle>
          <DialogDescription>
            Link items together to establish traceability relationships.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Source Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Source Item</Label>
            
            {sourceId && sourceName ? (
              <div className="p-3 bg-muted rounded-md">
                <Badge variant="outline" className="mr-2">
                  {ENTITY_TYPES.find(t => t.value === sourceType)?.label || sourceType}
                </Badge>
                <span className="text-sm">{sourceName}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={selectedSourceType} onValueChange={setSelectedSourceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Item</Label>
                  <Select 
                    value={selectedSourceId} 
                    onValueChange={setSelectedSourceId}
                    disabled={!selectedSourceType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.identifier} - {item.name.substring(0, 40)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Link Type */}
          <div className="space-y-2">
            <Label>Link Type</Label>
            <Select value={linkType} onValueChange={setLinkType}>
              <SelectTrigger>
                <SelectValue placeholder="Select link type..." />
              </SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Target Items</Label>
            
            <div className="space-y-2">
              <Label>Target Type</Label>
              <Select value={selectedTargetType} onValueChange={(v) => {
                setSelectedTargetType(v);
                setSelectedTargetIds([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target type..." />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.filter(t => t.value !== (sourceType || selectedSourceType)).map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTargetType && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Items ({selectedTargetIds.length} selected)</Label>
                  {selectedTargetIds.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedTargetIds([])}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-48 border rounded-md p-3">
                  <div className="space-y-2">
                    {targetItems.map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          id={item.id}
                          checked={selectedTargetIds.includes(item.id)}
                          onCheckedChange={(checked) => handleTargetToggle(item.id, !!checked)}
                        />
                        <label 
                          htmlFor={item.id}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          <Badge variant="secondary" className="mr-2">
                            {item.identifier}
                          </Badge>
                          <span className="text-muted-foreground">
                            {item.name.substring(0, 60)}{item.name.length > 60 ? '...' : ''}
                          </span>
                        </label>
                      </div>
                    ))}
                    {targetItems.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No items found for this type
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Rationale */}
          <div className="space-y-2">
            <Label>Rationale (Optional)</Label>
            <Textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Explain why these items are linked..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => createLinksMutation.mutate()}
            disabled={createLinksMutation.isPending || selectedTargetIds.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create {selectedTargetIds.length > 0 ? `${selectedTargetIds.length} ` : ''}Link{selectedTargetIds.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function fetchItemsByType(productId: string, type: string): Promise<LinkableItem[]> {
  switch (type) {
    case 'user_need': {
      const { data } = await supabase
        .from('user_needs')
        .select('id, user_need_id, description')
        .eq('product_id', productId);
      return (data || []).map(item => ({
        id: item.id,
        identifier: item.user_need_id || 'UN-???',
        name: item.description || '',
        type: 'user_need',
      }));
    }
    case 'system_requirement': {
      const { data } = await supabase
        .from('requirement_specifications')
        .select('id, requirement_id, description')
        .eq('product_id', productId)
        .or('requirement_type.eq.system,requirement_type.is.null');
      return (data || []).map(item => ({
        id: item.id,
        identifier: item.requirement_id || 'RS-???',
        name: item.description || '',
        type: 'system_requirement',
      }));
    }
    case 'software_requirement': {
      const { data } = await supabase
        .from('software_requirements')
        .select('id, requirement_id, description')
        .eq('product_id', productId);
      return (data || []).map(item => ({
        id: item.id,
        identifier: item.requirement_id || 'SWR-???',
        name: item.description || '',
        type: 'software_requirement',
      }));
    }
    case 'hardware_requirement': {
      const { data } = await supabase
        .from('hardware_requirements')
        .select('id, requirement_id, description')
        .eq('product_id', productId);
      return (data || []).map(item => ({
        id: item.id,
        identifier: item.requirement_id || 'HWR-???',
        name: item.description || '',
        type: 'hardware_requirement',
      }));
    }
    case 'test_case': {
      const { data } = await supabase
        .from('test_cases')
        .select('id, test_case_id, description')
        .eq('product_id', productId);
      return (data || []).map(item => ({
        id: item.id,
        identifier: item.test_case_id || 'TC-???',
        name: item.description || '',
        type: 'test_case',
      }));
    }
    case 'hazard': {
      const { data } = await supabase
        .from('hazards')
        .select('id, hazard_id, description')
        .eq('product_id', productId);
      return (data || []).map(item => ({
        id: item.id,
        identifier: item.hazard_id || 'HAZ-???',
        name: item.description || '',
        type: 'hazard',
      }));
    }
    default:
      return [];
  }
}
