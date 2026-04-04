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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserSelector } from '@/components/common/UserSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Clock, AlertTriangle } from 'lucide-react';

interface CITimelineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  ciInstance: {
    id: string;
    title: string;
    type: string;
    status: string;
    priority: string;
    due_date?: string;
    assigned_to?: string;
    company_id: string;
    product_id?: string;
    phase_id?: string;
    description?: string;
  } | null;
}

export function CITimelineEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  ciInstance 
}: CITimelineEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    status: 'planned',
    priority: 'medium',
    due_date: undefined as Date | undefined,
    assigned_to: '',
    description: '',
  });

  const [dateError, setDateError] = useState<string | null>(null);

  // Sync form data with ciInstance whenever the modal opens
  useEffect(() => {
    if (isOpen && ciInstance) {
      setFormData({
        title: ciInstance.title || '',
        status: ciInstance.status || 'planned',
        priority: ciInstance.priority || 'medium',
        due_date: ciInstance.due_date ? new Date(ciInstance.due_date) : undefined,
        assigned_to: ciInstance.assigned_to || '',
        description: ciInstance.description || '',
      });
      setDateError(null);
    }
  }, [isOpen, ciInstance]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (formData.due_date && formData.due_date < today) {
      setDateError('Due date cannot be in the past');
      return false;
    }
    
    setDateError(null);
    return true;
  };

  const handleDueDateChange = (date?: Date) => {
    setFormData(prev => ({ ...prev, due_date: date }));
    
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        setDateError('Due date cannot be in the past');
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
  };

  const handleSave = async () => {
    if (!ciInstance) return;
    
    if (!validateDates()) {
      return;
    }

    setIsSaving(true);
    try {
      const updates: any = {
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date?.toISOString().split('T')[0] || null,
        assigned_to: formData.assigned_to || null,
        description: formData.description,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('ci_instances')
        .update(updates)
        .eq('id', ciInstance.id);

      if (error) {
        console.error('Error updating CI instance:', error);
        toast.error('Failed to update CI instance');
        return;
      }

      toast.success('CI instance timeline updated successfully');
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error saving CI instance:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!ciInstance) return null;

  const statusOptions = [
    { value: 'planned', label: 'Planned', color: 'bg-gray-100' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
    { value: 'review', label: 'Review', color: 'bg-yellow-100' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100' },
    { value: 'blocked', label: 'Blocked', color: 'bg-red-100' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' },
  ];

  const isOverdue = formData.due_date && formData.due_date < new Date() && formData.status !== 'completed';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit CI Timeline: {ciInstance.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-medium border-b pb-2">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter CI instance title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter description (optional)"
              />
            </div>
          </div>

          {/* Timeline Details */}
          <div className="space-y-4">
            <h3 className="text-base font-medium border-b pb-2">Timeline Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date ? formData.due_date.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDueDateChange(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full"
              />
              {isOverdue && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  This item is overdue
                </div>
              )}
              {dateError && (
                <p className="text-sm text-destructive">{dateError}</p>
              )}
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <UserSelector
                value={formData.assigned_to || undefined}
                onValueChange={(value) => handleInputChange('assigned_to', value || '')}
                companyId={ciInstance.company_id}
                placeholder="Select assignee"
                allowClear={true}
              />
            </div>
          </div>

          {/* Current CI Information */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium">CI Instance Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Type: {ciInstance.type}</div>
              <div>ID: {ciInstance.id.slice(0, 8)}...</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !!dateError}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}