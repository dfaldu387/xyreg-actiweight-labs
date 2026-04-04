import React, { useState, useEffect } from 'react';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Users,
  Trash2,
  Edit,
  UserPlus,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { CreateReviewerGroupDialog } from './CreateReviewerGroupDialog';
import { AddMembersDialog } from './AddMembersDialog';
import { EditReviewGroupDialog } from '../product/EditReviewGroupDialog';
import { ReviewerGroup } from '@/services/reviewerGroupService';

interface ReviewerGroupManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function ReviewerGroupManagementDialog({
  open,
  onOpenChange,
  companyId
}: ReviewerGroupManagementDialogProps) {
  const {
    groups,
    isLoading,
    error,
    fetchGroups,
    deleteGroup,
    removeMember,
    refetch
  } = useReviewerGroups(companyId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<any>(null);
  // Debug logging
  // useEffect(() => {
  //   console.log('[ReviewerGroupManagementDialog] Groups data:', {
  //     companyId,
  //     groups,
  //     isLoading,
  //     error,
  //     groupsLength: groups?.length
  //   });
  // }, [companyId, groups, isLoading, error]);
  console.log('[ReviewerGroupManagementDialog] Groups data:', isLoading)
  // Refresh data when dialog opens
  useEffect(() => {
    if (open && companyId) {
      console.log('[ReviewerGroupManagementDialog] Dialog opened, fetching groups for company:', companyId);
      fetchGroups();
    }
  }, [open, companyId, fetchGroups]);

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'regulatory': return '🏛️';
      case 'external': return '🌐';
      default: return '👥';
    }
  };

  const handleEditGroup = (group: any) => {
    setSelectedGroupId(group.id);
    setSelectedGroupForEdit(group);
    setShowEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setShowEditDialog(false);
    setSelectedGroupForEdit(null);
  };
  const handleGroupUpdate = async (groupId: string, updatedGroupData: Partial<ReviewerGroup>) => {
    console.log('Group updated:', updatedGroupData);
    // EditReviewGroupDialog already handles the update and refetch
    // Just close the dialog - the data should already be refreshed
    setShowEditDialog(false);
    setSelectedGroupForEdit(null);
  };
  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this reviewer group?')) {
      console.log('[ReviewerGroupManagementDialog] Deleting group:', groupId);
      const success = await deleteGroup(groupId);
      if (success) {
        console.log('[ReviewerGroupManagementDialog] Group deleted successfully, refreshing list');
      }
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    if (confirm('Are you sure you want to remove this member from the group?')) {
      console.log('[ReviewerGroupManagementDialog] Removing member:', { groupId, userId });
      await removeMember(groupId, userId);
    }
  };

  const handleCreateDialogClose = (created: boolean) => {
    setShowCreateDialog(false);
    if (created) {
      console.log('[ReviewerGroupManagementDialog] Group created, refreshing list');
      fetchGroups();
    }
  };

  const handleMembersAdded = () => {
    console.log('[ReviewerGroupManagementDialog] Members added callback triggered, refreshing groups');
    fetchGroups();
  };

  const handleRefresh = () => {
    console.log('[ReviewerGroupManagementDialog] Manual refresh requested');
    fetchGroups();
  };

  const handleAddMembers = (groupId: string) => {
    setSelectedGroupId(groupId);
    setShowAddMembersDialog(true);
  };

  const handleAddMembersDialogClose = () => {
    setShowAddMembersDialog(false);
    setSelectedGroupId(null);
  };

  // if (isLoading) {
  //   return (
  //     <Dialog open={open} onOpenChange={onOpenChange}>
  //       <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
  //         <DialogHeader>
  //           <DialogTitle>Manage Review Groups</DialogTitle>
  //         </DialogHeader>
  //         <div className="flex items-center justify-center py-8">
  //           <div className="text-center">
  //             <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
  //             <p className="text-sm text-muted-foreground">Loading reviewer groups...</p>
  //           </div>
  //         </div>
  //       </DialogContent>
  //     </Dialog>
  //   );
  // }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Review Groups</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Error Loading Groups</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Review Groups
                <Badge variant="secondary">{groups.length} groups</Badge>
              </DialogTitle>
              <div className="flex items-center gap-2 mt-5">
                <Button onClick={handleRefresh} variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button onClick={() => setShowCreateDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Group
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No reviewer groups created yet.</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {groups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getGroupIcon(group.group_type)}</span>
                          <div>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            {group.description && (
                              <p className="text-sm text-muted-foreground">{group.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            style={{ backgroundColor: group.color + '20', color: group.color }}
                          >
                            {group.group_type}
                          </Badge>
                          {group.is_default && (
                            <Badge variant="outline">Default</Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddMembers(group.id)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!group.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteGroup(group.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="members" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="members">
                            Members ({group.members?.length || 0})
                          </TabsTrigger>
                          <TabsTrigger value="permissions">Permissions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="members" className="mt-4">
                          {group.members && group.members.length > 0 ? (
                            <div className="space-y-2">
                              {group.members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={member.avatar_url} />
                                      <AvatarFallback>
                                        {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">{member.name || 'Unknown User'}</p>
                                      <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {member.role}
                                    </Badge>
                                    {member.is_lead && (
                                      <Badge variant="secondary" className="text-xs">Lead</Badge>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMember(group.id, member.user_id)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <p className="text-sm">No members in this group yet.</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => handleAddMembers(group.id)}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Members
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="permissions" className="mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Document Permissions</h4>
                              <div className="space-y-1 text-sm">
                                <div className={group.permissions.canDownload ? 'text-green-600' : 'text-gray-400'}>
                                  ✓ Download files
                                </div>
                                <div className={group.permissions.canComment ? 'text-green-600' : 'text-gray-400'}>
                                  ✓ Add comments
                                </div>
                                <div className={group.permissions.canUpload ? 'text-green-600' : 'text-gray-400'}>
                                  ✓ Upload files
                                </div>
                                <div className={group.permissions.canApprove ? 'text-green-600' : 'text-gray-400'}>
                                  ✓ Approve/Reject
                                </div>
                                <div className={group.permissions.canViewInternal ? 'text-green-600' : 'text-gray-400'}>
                                  ✓ View internal comments
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Group Settings</h4>
                              <div className="space-y-1 text-sm">
                                <div className={group.settings.requireAllApprovals ? 'text-green-600' : 'text-gray-400'}>
                                  {group.settings.requireAllApprovals ? '✓' : '✗'} Require all approvals
                                </div>
                                <div className={group.settings.allowSelfAssignment ? 'text-green-600' : 'text-gray-400'}>
                                  {group.settings.allowSelfAssignment ? '✓' : '✗'} Allow self-assignment
                                </div>
                                <div className={group.settings.enableNotifications ? 'text-green-600' : 'text-gray-400'}>
                                  {group.settings.enableNotifications ? '✓' : '✗'} Enable notifications
                                </div>
                                {group.settings.defaultDeadlineDays && (
                                  <div className="text-sm text-muted-foreground">
                                    Default deadline: {group.settings.defaultDeadlineDays} days
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateReviewerGroupDialog
        open={showCreateDialog}
        onOpenChange={handleCreateDialogClose}
        companyId={companyId}
      />

      {selectedGroupId && (
        <AddMembersDialog
          open={showAddMembersDialog}
          onOpenChange={handleAddMembersDialogClose}
          groupId={selectedGroupId}
          companyId={companyId}
          onMembersAdded={handleMembersAdded}
        />
      )}
      <EditReviewGroupDialog
        open={showEditDialog}
        onOpenChange={handleEditDialogClose}
        group={selectedGroupForEdit}
        onGroupUpdate={handleGroupUpdate}
        companyId={companyId}
      />
    </>
  );
}
