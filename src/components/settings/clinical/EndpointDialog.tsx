import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, HelpCircle } from 'lucide-react';
import { useStandardEndpoints, StandardEndpoint } from '@/hooks/useStandardEndpoints';

interface EndpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: StandardEndpoint | null;
  companyId: string;
}

export function EndpointDialog({ open, onOpenChange, endpoint, companyId }: EndpointDialogProps) {
  const { createEndpoint, updateEndpoint } = useStandardEndpoints(companyId);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    measurement_criteria: '',
    category: '',
    regulatory_references: [] as string[],
  });
  const [newReference, setNewReference] = useState('');

  useEffect(() => {
    if (endpoint && endpoint.id) {
      setFormData({
        name: endpoint.name || '',
        description: endpoint.description || '',
        measurement_criteria: endpoint.measurement_criteria || '',
        category: endpoint.category || '',
        regulatory_references: endpoint.regulatory_references || [],
      });
    } else if (endpoint) {
      // New endpoint with type pre-set
      setFormData({
        name: '',
        description: '',
        measurement_criteria: '',
        category: '',
        regulatory_references: [],
      });
    }
  }, [endpoint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (endpoint?.id) {
        await updateEndpoint(endpoint.id, formData);
      } else if (endpoint) {
        await createEndpoint({
          ...formData,
          endpoint_type: endpoint.endpoint_type,
          is_active: true,
        });
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving endpoint:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      measurement_criteria: '',
      category: '',
      regulatory_references: [],
    });
    setNewReference('');
  };

  const addReference = () => {
    if (newReference.trim()) {
      setFormData(prev => ({
        ...prev,
        regulatory_references: [...prev.regulatory_references, newReference.trim()]
      }));
      setNewReference('');
    }
  };

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      regulatory_references: prev.regulatory_references.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {endpoint?.id ? 'Edit' : 'Add'} {endpoint?.endpoint_type === 'primary' ? 'Primary' : 'Secondary'} Endpoint
          </DialogTitle>
          <DialogDescription>
            Define a reusable endpoint that can be selected when creating clinical trials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="name">Endpoint Name *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Clear, descriptive name for the clinical endpoint (e.g., 'Device-related adverse events at 30 days')</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Device-related adverse events at 30 days"
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="description">Description</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Brief explanation of what this endpoint measures</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the endpoint"
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="measurement_criteria">Measurement Criteria</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Define how this endpoint will be measured, assessed, and validated during the trial</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="measurement_criteria"
              value={formData.measurement_criteria}
              onChange={(e) => setFormData(prev => ({ ...prev, measurement_criteria: e.target.value }))}
              placeholder="How this endpoint will be measured and assessed"
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="category">Category</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Classification of the endpoint (e.g., Safety, Efficacy, Cardiovascular, Orthopedic)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Safety, Efficacy, Cardiovascular"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="references">Regulatory References</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Add relevant standards or guidelines (e.g., ISO 14155:2020, FDA Guidance on Medical Device Clinical Studies)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                id="references"
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                placeholder="e.g., ISO 14155:2020, FDA Guidance"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReference())}
              />
              <Button type="button" onClick={addReference}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.regulatory_references.map((ref, index) => (
                <Badge key={index} variant="secondary">
                  {ref}
                  <button
                    type="button"
                    onClick={() => removeReference(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {endpoint?.id ? 'Update' : 'Create'} Endpoint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
