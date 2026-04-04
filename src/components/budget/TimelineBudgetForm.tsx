import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CreateBudgetItemData } from '@/services/phaseBudgetService';
import { TimelineBudgetCalculator } from '@/services/timelineBudgetCalculator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TimelineBudgetFormProps {
  phaseId: string;
  phaseName?: string;
  onSubmit: (data: CreateBudgetItemData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TimelineBudgetForm({ 
  phaseId, 
  phaseName = '',
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TimelineBudgetFormProps) {
  const [formData, setFormData] = useState<Partial<CreateBudgetItemData>>({
    phase_id: phaseId,
    category: 'fixed',
    item_name: '',
    cost: 0,
    currency: 'USD',
    timing_type: TimelineBudgetCalculator.getDefaultTimingType(phaseName),
    frequency: 'monthly',
    post_launch_cost: null,
    active_start_date: null,
    active_end_date: null
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_name || !formData.cost) return;
    
    onSubmit(formData as CreateBudgetItemData);
  };

  const handleTimingTypeChange = (value: string) => {
    const timingType = value as 'pre_launch' | 'post_launch' | 'both' | 'milestone';
    const updates: Partial<CreateBudgetItemData> = { timing_type: timingType };
    
    // Set default post-launch cost for "both" timing type
    if (timingType === 'both' && formData.cost) {
      const split = TimelineBudgetCalculator.getDefaultCostSplit(phaseName);
      const postLaunchCost = Math.round(formData.cost * (split.postLaunchPercentage / 100));
      updates.post_launch_cost = postLaunchCost;
    }
    
    // Set frequency for milestone
    if (timingType === 'milestone') {
      updates.frequency = 'one_time';
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const renderTimingInfo = () => {
    if (formData.timing_type === 'both' && formData.cost && formData.post_launch_cost) {
      return (
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Pre-launch: {formData.cost.toLocaleString()} {formData.currency}/{formData.frequency}</div>
          <div>Post-launch: {formData.post_launch_cost.toLocaleString()} {formData.currency}/{formData.frequency}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Add Timeline Budget Item
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Define costs with different rates for pre-launch and post-launch periods</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                placeholder="e.g., Technical Documentation"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="variable">Variable</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost ({formData.currency})</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                placeholder="10000"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timing_type">Timing</Label>
              <Select
                value={formData.timing_type}
                onValueChange={handleTimingTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_launch">Pre-launch only</SelectItem>
                  <SelectItem value="post_launch">Post-launch only</SelectItem>
                  <SelectItem value="both">Both periods</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as any }))}
                disabled={formData.timing_type === 'milestone'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.timing_type === 'both' && (
            <div className="space-y-2">
              <Label htmlFor="post_launch_cost">Post-launch Cost ({formData.currency})</Label>
              <Input
                id="post_launch_cost"
                type="number"
                value={formData.post_launch_cost || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  post_launch_cost: e.target.value ? Number(e.target.value) : null 
                }))}
                placeholder="1000"
              />
              <div className="text-xs text-muted-foreground">
                Different cost rate for post-launch period (leave empty to use same rate)
              </div>
            </div>
          )}

          {renderTimingInfo()}

          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/10">
              <div className="space-y-2">
                <Label>Active Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.active_start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.active_start_date ? (
                        format(formData.active_start_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.active_start_date || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, active_start_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Active End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.active_end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.active_end_date ? (
                        format(formData.active_end_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.active_end_date || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, active_end_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}