
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MultiSelect } from '@/components/settings/document-control/MultiSelect';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';

interface CreateReviewerGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean, created?: boolean) => void;
  companyId: string;
}

const CARD_COLORS = [
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

export function CreateReviewerGroupDialog({
  open,
  onOpenChange,
  companyId
}: CreateReviewerGroupDialogProps) {
  const { createGroup } = useReviewerGroups(companyId);
  const { users, isLoading } = useCompanyUsers(companyId);

  const userOptions = users.map(user => ({
    label: `${user.name} (${user.email})`,
    value: user.id,
  }));

  const initialFormData = {
    name: '',
    description: '',
    group_type: 'external' as 'internal' | 'external',
    color: CARD_COLORS[0].value,
    selectedUsers: [] as string[],
    permissions: {
      canDownload: true,
      canComment: true,
      canUpload: false,
      canApprove: false,
      canViewInternal: false
    },
    settings: {
      isDefault: false,
      requireAllApprovals: false,
      allowSelfAssignment: false,
      enableNotifications: true,
      defaultDeadlineDays: 10
    }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log('[CreateReviewerGroupDialog]', message);
    console.log('🔥 USER DEBUG: CreateReviewerGroupDialog dialog opened/active');
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const groupTypeOptions = [
    { value: 'internal', label: 'Internal Team', icon: '👥', description: 'Internal company reviewers' },
    { value: 'external', label: 'External Consultants', icon: '🌐', description: 'External consultant reviewers' }
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      // Handle nested object updates
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (parent === 'permissions') {
          newData.permissions = { ...newData.permissions, [child]: value };
        } else if (parent === 'settings') {
          newData.settings = { ...newData.settings, [child]: value };
        }
      } else {
        newData[field as keyof typeof newData] = value;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebugInfo([]); // Clear previous debug info

    addDebugInfo('Form submission started');

    if (!formData.name.trim()) {
      toast.error('Group name is required');
      addDebugInfo('Validation failed: Group name is required');
      return;
    }

    if (!companyId) {
      toast.error('Company ID is required');
      addDebugInfo('Validation failed: Company ID is missing');
      return;
    }

    setIsSubmitting(true);
    addDebugInfo(`Creating group with data: ${JSON.stringify({
      name: formData.name,
      group_type: formData.group_type,
      company_id: companyId
    })}`);

    try {
      const groupPayload = {
        name: formData.name,
        description: formData.description,
        group_type: formData.group_type,
        color: formData.color,
        company_id: companyId,
        permissions: formData.permissions,
        settings: formData.settings,
        selected_users: formData.selectedUsers
      };

      addDebugInfo('Calling createGroup service method...');
      const newGroup = await createGroup(groupPayload);

      if (newGroup) {
        addDebugInfo(`Group created successfully with ID: ${newGroup.id}`);
        toast.success('Reviewer group created successfully');

        // Reset form
        setFormData(initialFormData);

        // Close dialog and notify parent that a group was created
        addDebugInfo('Closing dialog and notifying parent');
        onOpenChange(false, true);
      } else {
        addDebugInfo('Group creation returned null');
        toast.error('Failed to create reviewer group - no data returned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reviewer group';
      addDebugInfo(`Error during group creation: ${errorMessage}`);
      console.error('[CreateReviewerGroupDialog] Error creating group:', error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      addDebugInfo('Form submission completed');
    }
  };

  const handleCancel = () => {
    addDebugInfo('Dialog cancelled');
    // Reset form when cancelling
    setFormData(initialFormData);
    setDebugInfo([]);
    onOpenChange(false, false);
  };

  React.useEffect(() => {
    if (open) {
      console.log('🔥 USER DEBUG: CreateReviewerGroupDialog OPENED!');
      console.log('🔥 USER DEBUG: Group type options:', groupTypeOptions);
      console.log('🔥 USER DEBUG: Color options:', CARD_COLORS);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Review Group
          </DialogTitle>
        </DialogHeader>

        {/* Debug Information (only show if there are debug messages) */}
        {debugInfo.length > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-gray-600">{info}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="groupName">Group Name</Label>
                <div className="text-muted-foreground hover:text-foreground cursor-help" title="A descriptive name for this reviewer group">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <path d="M12 17h.01"/>
                  </svg>
                </div>
              </div>
              <Input
                id="groupName"
                type="text"
                placeholder="Enter group name..."
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="description">Description</Label>
                <HelpTooltip content="Optional description explaining the purpose of this reviewer group" />
              </div>
              <Textarea
                id="description"
                placeholder="Enter group description..."
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="groupType">Group Type</Label>
                <HelpTooltip content="Defines the category (Internal/External/Regulatory) which affects default permissions and workflows" />
              </div>
                <Select 
                  value={formData.group_type} 
                  onValueChange={(value: 'internal' | 'external') => updateFormData('group_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="color">Group Color</Label>
                <HelpTooltip content="Visual identifier for the group in the UI" />
              </div>
              <Select
                value={formData.color}
                onValueChange={(value) => updateFormData('color', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {CARD_COLORS.map((color) => (
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

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Select Users</Label>
                <HelpTooltip content="Choose which users will be members of this reviewer group" />
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">Loading users...</div>
                </div>
              ) : (
                <MultiSelect
                  options={userOptions}
                  selected={formData.selectedUsers}
                  onChange={(selected) => updateFormData('selectedUsers', selected)}
                  placeholder="Select users..."
                />
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Permissions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="canDownload"
                    checked={formData.permissions.canDownload}
                    onCheckedChange={(checked) => updateFormData('permissions.canDownload', checked)}
                  />
                  <Label htmlFor="canDownload">Can Download</Label>
                  <HelpTooltip content="Allow members to download document files and attachments" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="canComment"
                    checked={formData.permissions.canComment}
                    onCheckedChange={(checked) => updateFormData('permissions.canComment', checked)}
                  />
                  <Label htmlFor="canComment">Can Comment</Label>
                  <HelpTooltip content="Allow members to add comments and feedback on documents" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="canUpload"
                    checked={formData.permissions.canUpload}
                    onCheckedChange={(checked) => updateFormData('permissions.canUpload', checked)}
                  />
                  <Label htmlFor="canUpload">Can Upload</Label>
                  <HelpTooltip content="Allow members to upload new versions or additional files/attachments" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="canApprove"
                    checked={formData.permissions.canApprove}
                    onCheckedChange={(checked) => updateFormData('permissions.canApprove', checked)}
                  />
                  <Label htmlFor="canApprove">Can Approve</Label>
                  <HelpTooltip content="Allow members to approve or reject documents in the review process" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="canViewInternal"
                    checked={formData.permissions.canViewInternal}
                    onCheckedChange={(checked) => updateFormData('permissions.canViewInternal', checked)}
                  />
                  <Label htmlFor="canViewInternal">Can View Internal</Label>
                  <HelpTooltip content="Allow members to see internal team comments (vs. external comments only)" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={formData.settings.isDefault}
                    onCheckedChange={(checked) => updateFormData('settings.isDefault', checked)}
                  />
                  <Label htmlFor="isDefault">Set as Default Group</Label>
                  <HelpTooltip content="Makes this the default reviewer group that gets automatically assigned to new documents" />
                </div>
                 <div className="flex items-center space-x-2">
                  <Switch
                    id="requireAllApprovals"
                    checked={formData.settings.requireAllApprovals}
                    onCheckedChange={(checked) => updateFormData('settings.requireAllApprovals', checked)}
                  />
                  <Label htmlFor="requireAllApprovals">Require All Approvals</Label>
                  <HelpTooltip content="When enabled, ALL members of this group must approve before the document is considered approved (vs. just needing one approval)" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowSelfAssignment"
                    checked={formData.settings.allowSelfAssignment}
                    onCheckedChange={(checked) => updateFormData('settings.allowSelfAssignment', checked)}
                  />
                  <Label htmlFor="allowSelfAssignment">Allow Self Assignment</Label>
                  <HelpTooltip content="When enabled, users can assign themselves to review documents for this group (vs. requiring admin assignment)" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableNotifications"
                    checked={formData.settings.enableNotifications}
                    onCheckedChange={(checked) => updateFormData('settings.enableNotifications', checked)}
                  />
                  <Label htmlFor="enableNotifications">Enable Notifications</Label>
                  <HelpTooltip content="When enabled, group members receive email/system notifications about new assignments and review updates" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="defaultDeadlineDays">Default Deadline (Days)</Label>
                    <HelpTooltip content="How many days reviewers have to complete their review by default" />
                  </div>
                  <Input
                    id="defaultDeadlineDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.settings.defaultDeadlineDays}
                    onChange={(e) => updateFormData('settings.defaultDeadlineDays', parseInt(e.target.value) || 10)}
                  />
                </div>
              </div>
            </div>
          </form>

          <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
