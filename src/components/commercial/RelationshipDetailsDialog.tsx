import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface RelationshipDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship: any;
  onEdit?: () => void;
  onSave?: () => void;
}

export function RelationshipDetailsDialog({
  open,
  onOpenChange,
  relationship,
  onEdit,
  onSave,
}: RelationshipDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Editable fields
  const [revenueAttribution, setRevenueAttribution] = useState<number>(100);
  const [initialMultiplier, setInitialMultiplier] = useState<number>(1);
  const [recurringMultiplier, setRecurringMultiplier] = useState<number>(0);
  const [recurringPeriod, setRecurringPeriod] = useState<string>('monthly');
  const [lifecycleDuration, setLifecycleDuration] = useState<number>(12);
  const [typicalQuantity, setTypicalQuantity] = useState<number>(1);

  // Update state when relationship changes
  useEffect(() => {
    if (relationship) {
      setRevenueAttribution(relationship.revenue_attribution_percentage || 100);
      setInitialMultiplier(relationship.initial_multiplier || 1);
      setRecurringMultiplier(relationship.recurring_multiplier || 0);
      setRecurringPeriod(relationship.recurring_period || 'monthly');
      setLifecycleDuration(relationship.lifecycle_duration_months || 12);
      setTypicalQuantity(relationship.typical_quantity || 1);
    }
  }, [relationship]);

  if (!relationship) return null;

  const getRelationshipType = () => {
    if (relationship.main_sibling_group_id && relationship.accessory_sibling_group_id) {
      return 'Sibling Group to Sibling Group';
    } else if (relationship.main_product_id && relationship.accessory_product_id) {
      return 'Product to Product';
    } else if (relationship.main_product_id && relationship.accessory_sibling_group_id) {
      return 'Product to Sibling Group';
    } else if (relationship.main_sibling_group_id && relationship.accessory_product_id) {
      return 'Sibling Group to Product';
    }
    return 'Unknown';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        revenue_attribution_percentage: revenueAttribution,
        initial_multiplier: initialMultiplier,
        recurring_multiplier: recurringMultiplier,
        recurring_period: recurringPeriod,
        lifecycle_duration_months: lifecycleDuration,
        typical_quantity: typicalQuantity,
      };

      // Determine which table to update
      let tableName: string;
      if (relationship.main_sibling_group_id && relationship.accessory_sibling_group_id) {
        tableName = 'sibling_group_relationships';
      } else if (relationship.main_product_id && relationship.accessory_product_id) {
        tableName = 'product_accessory_relationships';
      } else if (relationship.main_product_id && relationship.accessory_sibling_group_id) {
        tableName = 'product_sibling_group_relationships';
      } else if (relationship.main_sibling_group_id && relationship.accessory_product_id) {
        tableName = 'sibling_group_product_relationships';
      } else {
        toast.error('Unable to determine relationship type');
        return;
      }

      const { error } = await (supabase as any)
        .from(tableName)
        .update(updateData)
        .eq('id', relationship.id);

      if (error) throw error;

      toast.success('Relationship updated successfully');
      setIsEditing(false);
      
      // Force a small delay to ensure the save completes before refetching
      await new Promise(resolve => setTimeout(resolve, 100));
      
      onSave?.(); // Trigger refetch in parent
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating relationship:', error);
      toast.error('Failed to update relationship');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'View'} Relationship</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Type</label>
            <p className="text-lg font-semibold mt-1">{getRelationshipType()}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Relationship Type</label>
              <div className="mt-1">
                <Badge variant="outline" className="text-sm">
                  {relationship.relationship_type || 'Not specified'}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Revenue Attribution (%)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={revenueAttribution}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setRevenueAttribution(isNaN(val) ? 0 : val);
                  }}
                />
              ) : (
                <p className="text-lg font-semibold mt-1">{revenueAttribution}%</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Initial Purchase Multiplier</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={initialMultiplier}
                  onChange={(e) => setInitialMultiplier(parseFloat(e.target.value) || 0)}
                />
              ) : (
                <p className="text-lg font-semibold mt-1">{initialMultiplier}x</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Units per main product at initial purchase</p>
            </div>

            <div>
              <Label>Recurring Multiplier</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={recurringMultiplier}
                  onChange={(e) => setRecurringMultiplier(parseFloat(e.target.value) || 0)}
                />
              ) : (
                <p className="text-lg font-semibold mt-1">{recurringMultiplier}x</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Units per main product for recurring purchases</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Recurring Period</Label>
              {isEditing ? (
                <Select value={recurringPeriod} onValueChange={setRecurringPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one_time">One Time</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg font-semibold mt-1">{recurringPeriod}</p>
              )}
            </div>

            <div>
              <Label>Lifecycle Duration (months)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min="1"
                  value={lifecycleDuration}
                  onChange={(e) => setLifecycleDuration(parseInt(e.target.value) || 12)}
                />
              ) : (
                <p className="text-lg font-semibold mt-1">{lifecycleDuration} months</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Expected relationship duration</p>
            </div>
          </div>

          {relationship.notes && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="text-sm mt-1">{relationship.notes}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Relationship
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
