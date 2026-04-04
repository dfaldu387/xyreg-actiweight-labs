import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';
import { useConfirm } from '@/components/ui/confirm-dialog';
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
import { EditReviewerGroupDialog } from './EditReviewerGroupDialog';
import { AddMembersDialog } from './AddMembersDialog';

interface ReviewerGroupManagerProps {
  companyId: string;
}

export function ReviewerGroupManager({ companyId }: ReviewerGroupManagerProps) {
  const { lang } = useTranslation();
  const {
    groups,
    isLoading,
    error,
    fetchGroups,
    deleteGroup,
    removeMember
  } = useReviewerGroups(companyId);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<any>(null);

  // Debug logging
  useEffect(() => {
    // console.log('[ReviewerGroupManager] Groups data:', { companyId, groups, isLoading, error, groupsLength: groups?.length });
  }, [companyId, groups, isLoading, error]);

  // Debug logging for dialog state
  useEffect(() => {
    // console.log('[ReviewerGroupManager] Dialog state changed:', { showAddMembersDialog, selectedGroupId });
  }, [showAddMembersDialog, selectedGroupId]);

  // Refresh data when component mounts
  useEffect(() => {
    if (companyId) {
      // console.log('[ReviewerGroupManager] Fetching groups for company:', companyId);
      fetchGroups();
    }
  }, [companyId, fetchGroups]);

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'regulatory': return '🏛️';
      case 'external': return '🌐';
      default: return '👥';
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this reviewer group?')) {
      // console.log('[ReviewerGroupManager] Deleting group:', groupId);
      const success = await deleteGroup(groupId);
      if (success) {
        // console.log('[ReviewerGroupManager] Group deleted successfully, refreshing list');
      }
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    if (confirm('Are you sure you want to remove this member from the group?')) {
      // console.log('[ReviewerGroupManager] Removing member:', { groupId, userId });
      await removeMember(groupId, userId);
    }
  };

  const handleCreateDialogClose = (created: boolean) => {
    setShowCreateDialog(false);
    if (created) {
      // console.log('[ReviewerGroupManager] Group created, refreshing list');
      fetchGroups();
    }
  };

  const handleEditGroup = (group: any) => {
    // console.log('[ReviewerGroupManager] Edit group clicked:', group);
    setSelectedGroupForEdit(group);
    setShowEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setShowEditDialog(false);
    setSelectedGroupForEdit(null);
  };

  const handleGroupUpdated = () => {
    // console.log('[ReviewerGroupManager] Group updated, refreshing list');
    fetchGroups();
  };

  const handleMembersAdded = () => {
    // console.log('[ReviewerGroupManager] Members added callback triggered, refreshing groups');
    fetchGroups();
  };

  const handleRefresh = () => {
    // console.log('[ReviewerGroupManager] Manual refresh requested');
    fetchGroups();
  };

  const handleAddMembers = (groupId: string) => {
    // console.log('[ReviewerGroupManager] Add members button clicked for group:', groupId);
    // console.log('[ReviewerGroupManager] Current dialog state before update:', { showAddMembersDialog, selectedGroupId });
    
    setSelectedGroupId(groupId);
    setShowAddMembersDialog(true);
    
    // console.log('[ReviewerGroupManager] State should be updated to:', { showAddMembersDialog: true, selectedGroupId: groupId });
  };

  const handleAddMembersDialogClose = () => {
    // console.log('[ReviewerGroupManager] Closing add members dialog');
    setShowAddMembersDialog(false);
    setSelectedGroupId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{lang('reviewerGroups.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">{lang('reviewerGroups.errorLoading')}</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {lang('reviewerGroups.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{lang('reviewerGroups.title')}</h3>
            <Badge variant="secondary">{groups.length} {lang('reviewerGroups.groups')}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {lang('reviewerGroups.newGroup')}
            </Button>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{lang('reviewerGroups.empty')}</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {lang('reviewerGroups.createFirst')}
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
                        <Badge variant="outline">{lang('reviewerGroups.default')}</Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            // console.log('[ReviewerGroupManager] UserPlus button clicked, calling handleAddMembers');
                            handleAddMembers(group.id);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                        >
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
                        {lang('reviewerGroups.tabs.members')} ({group.members?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="permissions">{lang('reviewerGroups.tabs.permissions')}</TabsTrigger>
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
                                  <Badge variant="secondary" className="text-xs">{lang('reviewerGroups.lead')}</Badge>
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
                          <p className="text-sm">{lang('reviewerGroups.noMembers')}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={(e) => {
                              e.preventDefault();
                              // console.log('[ReviewerGroupManager] Empty state button clicked, calling handleAddMembers');
                              handleAddMembers(group.id);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {lang('reviewerGroups.addMembers')}
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="permissions" className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">{lang('reviewerGroups.permissions.documentTitle')}</h4>
                          <div className="space-y-1 text-sm">
                            <div className={group.permissions.canDownload ? 'text-green-600' : 'text-gray-400'}>
                              ✓ {lang('reviewerGroups.permissions.download')}
                            </div>
                            <div className={group.permissions.canComment ? 'text-green-600' : 'text-gray-400'}>
                              ✓ {lang('reviewerGroups.permissions.comment')}
                            </div>
                            <div className={group.permissions.canUpload ? 'text-green-600' : 'text-gray-400'}>
                              ✓ {lang('reviewerGroups.permissions.upload')}
                            </div>
                            <div className={group.permissions.canApprove ? 'text-green-600' : 'text-gray-400'}>
                              ✓ {lang('reviewerGroups.permissions.approve')}
                            </div>
                            <div className={group.permissions.canViewInternal ? 'text-green-600' : 'text-gray-400'}>
                              ✓ {lang('reviewerGroups.permissions.viewInternal')}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">{lang('reviewerGroups.settings.title')}</h4>
                          <div className="space-y-1 text-sm">
                            <div className={group.settings.requireAllApprovals ? 'text-green-600' : 'text-gray-400'}>
                              {group.settings.requireAllApprovals ? '✓' : '✗'} {lang('reviewerGroups.settings.requireAll')}
                            </div>
                            <div className={group.settings.allowSelfAssignment ? 'text-green-600' : 'text-gray-400'}>
                              {group.settings.allowSelfAssignment ? '✓' : '✗'} {lang('reviewerGroups.settings.selfAssign')}
                            </div>
                            <div className={group.settings.enableNotifications ? 'text-green-600' : 'text-gray-400'}>
                              {group.settings.enableNotifications ? '✓' : '✗'} {lang('reviewerGroups.settings.notifications')}
                            </div>
                            {group.settings.defaultDeadlineDays && (
                              <div className="text-sm text-muted-foreground">
                                {lang('reviewerGroups.settings.deadline')}: {group.settings.defaultDeadlineDays} {lang('reviewerGroups.settings.days')}
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

      <CreateReviewerGroupDialog
        open={showCreateDialog}
        onOpenChange={handleCreateDialogClose}
        companyId={companyId}
      />

      <EditReviewerGroupDialog
        open={showEditDialog}
        onOpenChange={handleEditDialogClose}
        group={selectedGroupForEdit}
        onGroupUpdated={handleGroupUpdated}
      />

      <AddMembersDialog
        open={showAddMembersDialog}
        onOpenChange={handleAddMembersDialogClose}
        groupId={selectedGroupId || ''}
        companyId={companyId}
        onMembersAdded={handleMembersAdded}
      />
    </>
  );
}
