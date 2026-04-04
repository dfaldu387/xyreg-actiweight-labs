
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ReviewerGroup } from '@/services/reviewerGroupService';

interface EditReviewerGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ReviewerGroup | null;
  onGroupUpdated: () => void;
}

const GROUP_COLORS = [
  { name: 'Blue', value: 'from-blue-500 to-blue-600' },
  { name: 'Emerald', value: 'from-emerald-500 to-emerald-600' },
  { name: 'Purple', value: 'from-purple-500 to-purple-600' },
  { name: 'Orange', value: 'from-orange-500 to-orange-600' },
  { name: 'Pink', value: 'from-pink-500 to-pink-600' },
  { name: 'Indigo', value: 'from-indigo-500 to-indigo-600' },
  { name: 'Teal', value: 'from-teal-500 to-teal-600' },
  { name: 'Red', value: 'from-red-500 to-red-600' },
  { name: 'Amber', value: 'from-amber-500 to-amber-600' },
  { name: 'Cyan', value: 'from-cyan-500 to-cyan-600' },
  { name: 'Slate', value: 'from-slate-500 to-slate-600' },
  { name: 'Rose', value: 'from-rose-500 to-rose-600' }
];

export function EditReviewerGroupDialog({ 
  open, 
  onOpenChange, 
  group,
  onGroupUpdated 
}: EditReviewerGroupDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: 'internal' as 'internal' | 'external',
    color: 'from-blue-500 to-blue-600',
    is_default: false,
    permissions: {
      canDownload: true,
      canComment: true,
      canUpload: false,
      canApprove: false,
      canViewInternal: false
    },
    settings: {
      requireAllApprovals: false,
      allowSelfAssignment: true,
      enableNotifications: true,
      defaultDeadlineDays: 7
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when group changes
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        group_type: group.group_type === 'regulatory' ? 'external' : group.group_type,
        color: group.color,
        is_default: group.is_default,
        permissions: { ...group.permissions },
        settings: { 
          ...group.settings,
          defaultDeadlineDays: group.settings.defaultDeadlineDays || 7
        }
      });
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!group || !formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { ReviewerGroupService } = await import('@/services/reviewerGroupService');
      const service = new ReviewerGroupService();
      
      const success = await service.updateGroup(group.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        group_type: formData.group_type,
        color: formData.color,
        is_default: formData.is_default,
        permissions: formData.permissions,
        settings: formData.settings
      });

      if (success) {
        toast.success('Reviewer group updated successfully');
        onGroupUpdated();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error updating reviewer group:', error);
      toast.error('Failed to update reviewer group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionChange = (permission: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const handleSettingChange = (setting: string, value: boolean | number) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Reviewer Group</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter group name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter group description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group_type">Group Type</Label>
                <Select
                  value={formData.group_type}
                  onValueChange={(value: 'internal' | 'external') => 
                    setFormData(prev => ({ ...prev, group_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select 
                  value={formData.color} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_COLORS.map((color) => (
                      <SelectItem key={color.name} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded bg-gradient-to-r ${color.value}`}></div>
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
              />
              <Label htmlFor="is_default">Set as default group</Label>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Permissions</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData.permissions).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => handlePermissionChange(key, checked)}
                  />
                  <Label htmlFor={key} className="text-sm">
                    {key === 'canDownload' && 'Download files'}
                    {key === 'canComment' && 'Add comments'}
                    {key === 'canUpload' && 'Upload files'}
                    {key === 'canApprove' && 'Approve/Reject'}
                    {key === 'canViewInternal' && 'View internal comments'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requireAllApprovals"
                  checked={formData.settings.requireAllApprovals}
                  onCheckedChange={(checked) => handleSettingChange('requireAllApprovals', checked)}
                />
                <Label htmlFor="requireAllApprovals">Require all approvals</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowSelfAssignment"
                  checked={formData.settings.allowSelfAssignment}
                  onCheckedChange={(checked) => handleSettingChange('allowSelfAssignment', checked)}
                />
                <Label htmlFor="allowSelfAssignment">Allow self-assignment</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableNotifications"
                  checked={formData.settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
                />
                <Label htmlFor="enableNotifications">Enable notifications</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultDeadlineDays">Default deadline (days)</Label>
                <Input
                  id="defaultDeadlineDays"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.settings.defaultDeadlineDays}
                  onChange={(e) => handleSettingChange('defaultDeadlineDays', parseInt(e.target.value) || 7)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
