import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MultiSelect } from '@/components/settings/document-control/MultiSelect';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { ReviewerGroup } from '@/services/reviewerGroupService';


interface AddReviewGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreate: (group: Partial<ReviewerGroup>) => void;
  companyId: string;
}

export function AddReviewGroupDialog({
  open,
  onOpenChange,
  onGroupCreate,
  companyId,
}: AddReviewGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<'internal' | 'external'>('external');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [color, setColor] = useState('from-emerald-500 to-emerald-600');
  const [isDefault, setIsDefault] = useState(false);
  const [requireAllApprovals, setRequireAllApprovals] = useState(false);
  const [allowSelfAssignment, setAllowSelfAssignment] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [defaultDeadlineDays, setDefaultDeadlineDays] = useState(10);
  const [canDownload, setCanDownload] = useState(true);
  const [canComment, setCanComment] = useState(true);
  const [canUpload, setCanUpload] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [canViewInternal, setCanViewInternal] = useState(false);
  const { users, isLoading } = useCompanyUsers(companyId);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      return;
    }

    // Create the new group object
    const newGroupData: Partial<ReviewerGroup> = {
      company_id: companyId,
      name: groupName.trim(),
      description: description.trim() || `Review group with ${selectedUsers.length} selected users`,
      group_type: groupType,
      members: selectedUsers.map(userId => {
        const user = users.find(u => u.id === userId);
        return {
          id: userId,
          group_id: '',
          user_id: userId,
          role: 'reviewer',
          is_lead: false,
          can_approve: false,
          can_request_changes: true,
          can_reject: true,
          notification_preferences: {
            email: true,
            in_app: true,
          },
          added_at: new Date().toISOString(),
          is_active: true,
          name: user?.name || 'Unknown User',
          email: user?.email || '',
        };
      }),
      permissions: {
        canDownload,
        canComment,
        canUpload,
        canApprove,
        canViewInternal,
      },
      color,
      is_default: isDefault,
      settings: {
        requireAllApprovals,
        allowSelfAssignment,
        enableNotifications,
        defaultDeadlineDays,
      },
    };
    // Call the parent callback to create the group
    onGroupCreate(newGroupData);
    
    // Reset form
    setGroupName('');
    setDescription('');
    setGroupType('external');
    setSelectedUsers([]);
    setColor('from-emerald-500 to-emerald-600');
    setIsDefault(false);
    setRequireAllApprovals(false);
    setAllowSelfAssignment(false);
    setEnableNotifications(true);
    setDefaultDeadlineDays(10);
    setCanDownload(true);
    setCanComment(true);
    setCanUpload(false);
    setCanApprove(false);
    setCanViewInternal(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setGroupName('');
    setDescription('');
    setGroupType('external');
    setSelectedUsers([]);
    setColor('from-emerald-500 to-emerald-600');
    setIsDefault(false);
    setRequireAllApprovals(false);
    setAllowSelfAssignment(false);
    setEnableNotifications(true);
    setDefaultDeadlineDays(10);
    setCanDownload(true);
    setCanComment(true);
    setCanUpload(false);
    setCanApprove(false);
    setCanViewInternal(false);
    onOpenChange(false);
  };

  const userOptions = users.map(user => ({
    label: `${user.name} (${user.email})`,
    value: user.id,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Review Group</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              type="text"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter group description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupType">Group Type</Label>
            <Select value={groupType} onValueChange={(value: 'internal' | 'external') => setGroupType(value)}>
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
            <Label htmlFor="color">Group Color</Label>
            <Select value={color} onValueChange={(value) => setColor(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="from-blue-500 to-blue-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    Blue
                  </div>
                </SelectItem>
                <SelectItem value="from-emerald-500 to-emerald-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
                    Emerald
                  </div>
                </SelectItem>
                <SelectItem value="from-purple-500 to-purple-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-purple-600"></div>
                    Purple
                  </div>
                </SelectItem>
                <SelectItem value="from-orange-500 to-orange-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-orange-500 to-orange-600"></div>
                    Orange
                  </div>
                </SelectItem>
                <SelectItem value="from-pink-500 to-pink-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-pink-500 to-pink-600"></div>
                    Pink
                  </div>
                </SelectItem>
                <SelectItem value="from-indigo-500 to-indigo-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                    Indigo
                  </div>
                </SelectItem>
                <SelectItem value="from-teal-500 to-teal-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-teal-500 to-teal-600"></div>
                    Teal
                  </div>
                </SelectItem>
                <SelectItem value="from-red-500 to-red-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-red-600"></div>
                    Red
                  </div>
                </SelectItem>
                <SelectItem value="from-amber-500 to-amber-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-500 to-amber-600"></div>
                    Amber
                  </div>
                </SelectItem>
                <SelectItem value="from-cyan-500 to-cyan-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-cyan-500 to-cyan-600"></div>
                    Cyan
                  </div>
                </SelectItem>
                <SelectItem value="from-slate-500 to-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-slate-500 to-slate-600"></div>
                    Slate
                  </div>
                </SelectItem>
                <SelectItem value="from-rose-500 to-rose-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-rose-500 to-rose-600"></div>
                    Rose
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Users</Label>
            {isLoading ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <div className="text-sm text-muted-foreground">Loading users...</div>
              </div>
            ) : (
              <MultiSelect
                options={userOptions}
                selected={selectedUsers}
                onChange={setSelectedUsers}
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
                  checked={canDownload}
                  onCheckedChange={setCanDownload}
                />
                <Label htmlFor="canDownload">Can Download</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canComment"
                  checked={canComment}
                  onCheckedChange={setCanComment}
                />
                <Label htmlFor="canComment">Can Comment</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canUpload"
                  checked={canUpload}
                  onCheckedChange={setCanUpload}
                />
                <Label htmlFor="canUpload">Can Upload</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canApprove"
                  checked={canApprove}
                  onCheckedChange={setCanApprove}
                />
                <Label htmlFor="canApprove">Can Approve</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canViewInternal"
                  checked={canViewInternal}
                  onCheckedChange={setCanViewInternal}
                />
                <Label htmlFor="canViewInternal">Can View Internal</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="isDefault">Set as Default Group</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="requireAllApprovals"
                  checked={requireAllApprovals}
                  onCheckedChange={setRequireAllApprovals}
                />
                <Label htmlFor="requireAllApprovals">Require All Approvals</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowSelfAssignment"
                  checked={allowSelfAssignment}
                  onCheckedChange={setAllowSelfAssignment}
                />
                <Label htmlFor="allowSelfAssignment">Allow Self Assignment</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableNotifications"
                  checked={enableNotifications}
                  onCheckedChange={setEnableNotifications}
                />
                <Label htmlFor="enableNotifications">Enable Notifications</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDeadlineDays">Default Deadline (Days)</Label>
                <Input
                  id="defaultDeadlineDays"
                  type="number"
                  min="1"
                  max="365"
                  value={defaultDeadlineDays}
                  onChange={(e) => setDefaultDeadlineDays(parseInt(e.target.value) || 10)}
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
            disabled={!groupName.trim()}
          >
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}