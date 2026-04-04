
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Search,
  Check,
  X
} from 'lucide-react';
import { ReviewerGroupService } from '@/services/reviewerGroupService';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { toast } from 'sonner';

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  companyId: string;
  onMembersAdded?: () => void; // Add callback to notify parent of changes
}

export function AddMembersDialog({
  open,
  onOpenChange,
  groupId,
  companyId,
  onMembersAdded
}: AddMembersDialogProps) {
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addMember } = useReviewerGroups(companyId);
  const reviewerGroupService = new ReviewerGroupService();

  useEffect(() => {
    if (open && companyId) {
      fetchAvailableUsers();
    }
  }, [open, companyId]);

  const fetchAvailableUsers = async () => {
    setIsLoading(true);
    try {
      console.log('[AddMembersDialog] Fetching users for company:', companyId);
      const users = await reviewerGroupService.getCompanyUsers(companyId);
      console.log('[AddMembersDialog] Fetched users:', users);
      setAvailableUsers(users);
    } catch (error) {
      console.error('[AddMembersDialog] Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setIsSubmitting(true);
    console.log('[AddMembersDialog] Starting to add members:', { groupId, selectedUsers });

    try {
      let successCount = 0;
      let errorCount = 0;

      // Add each member one by one
      for (const userId of selectedUsers) {
        try {
          console.log('[AddMembersDialog] Adding member:', { groupId, userId });
          const success = await addMember(groupId, userId, {
            role: 'reviewer',
            is_lead: false,
            can_approve: true,
            can_request_changes: true,
            can_reject: false,
            notification_preferences: { email: true, in_app: true }
          });

          if (success) {
            setIsSubmitting(false);
            successCount++;
            console.log('[AddMembersDialog] Successfully added member:', userId);
          } else {
            errorCount++;
            console.error('[AddMembersDialog] Failed to add member:', userId);
          }
        } catch (memberError) {
          console.error('[AddMembersDialog] Error adding member:', { userId, error: memberError });
          errorCount++;
        }
      }

      // Show appropriate success/error messages
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} member(s) to the group`);
        console.log('[AddMembersDialog] Members added successfully, calling onMembersAdded callback');

        // Reset form state
        setSelectedUsers([]);
        setSearchQuery('');

        // Close dialog first
        onOpenChange(false);

        // Then notify parent to refresh data after a brief delay
        setTimeout(() => {
          if (onMembersAdded) {
            console.log('[AddMembersDialog] Calling onMembersAdded callback');
            onMembersAdded();
          }
        }, 100);
      }

      if (errorCount > 0) {
        toast.error(`Failed to add ${errorCount} member(s)`);
      }
      setIsSubmitting(false);
    } catch (error) {
      console.error('[AddMembersDialog] Overall error adding members:', error);
      toast.error('Failed to add members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Members to Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* User List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No users found</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedUsers.includes(user.id)
                    ? 'bg-primary/5 border-primary'
                    : 'hover:bg-muted/50'
                    }`}
                  onClick={() => handleUserSelect(user.id)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {user.is_internal ? 'Internal' : 'External'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {user.access_level}
                      </Badge>
                    </div>
                  </div>
                  {selectedUsers.includes(user.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Selected Count */}
          {selectedUsers.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedUsers.length} user(s) selected
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedUsers.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add {selectedUsers.length} Member(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
