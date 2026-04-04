
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button as MuiButton,
  Typography,
  Box
} from '@mui/material';
import {
  Users,
  Plus,
  Settings,
  Download,
  MessageCircle,
  Upload,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { ReviewerGroup } from '@/services/reviewerGroupService';
import { getGroupIcon, getPermissionLabel } from '@/types/reviewerGroups';
import { AddReviewGroupDialog } from './AddReviewGroupDialog';
import { EditReviewGroupDialog } from './EditReviewGroupDialog';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
// Removed AlertDialog imports - using MUI Dialog instead

interface ReviewGroupManagerProps {
  groups: ReviewerGroup[];
  onGroupUpdate: (group: ReviewerGroup) => void;
  onGroupCreate: (group: Partial<ReviewerGroup>) => void;
  onGroupDelete: (groupId: string) => void;
  showPermissions?: boolean;
  companyId: string;
}

export function ReviewGroupManager({
  groups: initialGroups,
  onGroupUpdate,
  onGroupCreate,
  onGroupDelete,
  showPermissions = true,
  companyId
}: ReviewGroupManagerProps) {
  const { lang } = useTranslation();
  const [groups, setGroups] = useState<ReviewerGroup[]>(initialGroups);
  const [selectedGroup, setSelectedGroup] = useState<ReviewerGroup | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ReviewerGroup | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<ReviewerGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use the hook for managing groups
  const { createGroup, updateGroup, deleteGroup } = useReviewerGroups(companyId);
  
  // Update local groups when prop changes
  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsDeleting(false);
    };
  }, []);
  
  
  const handleGroupSelect = (group: ReviewerGroup) => {
    setSelectedGroup(group);
  };

  const handlePermissionChange = (groupId: string, permissions: any) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      onGroupUpdate({ ...group, permissions });
    }
  };

  const handleEditGroup = (group: ReviewerGroup) => {
    setEditingGroup(group);
    setShowEditDialog(true);
  };

  const handleDeleteGroup = (group: ReviewerGroup) => {
    if (isDeleting) return; // Prevent multiple delete operations
    setDeletingGroup(group);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingGroup || isDeleting) return; // Prevent multiple delete operations
    
    setIsDeleting(true);
    try {
      // Use setTimeout to ensure the UI updates before the async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      await deleteGroup(deletingGroup.id);
      
      // Update local state immediately for better UX
      setGroups(prevGroups => prevGroups.filter(g => g.id !== deletingGroup.id));
      
      // Call the parent callback
      onGroupDelete(deletingGroup.id);
      
      // Close dialog and reset state
      setShowDeleteDialog(false);
      setDeletingGroup(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      // You might want to show a toast error here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) return; // Prevent canceling while deleting
    setShowDeleteDialog(false);
    setDeletingGroup(null);
  };

  const handleGroupUpdate = async (groupId: string, updatedGroup: Partial<ReviewerGroup>) => {
    const existingGroup = groups.find(g => g.id === groupId);
    if (!existingGroup) return;

    // EditReviewGroupDialog already handles the update and refetch
    // The groups will be updated through the initialGroups prop via useEffect
    // Just close the dialog
    setShowEditDialog(false);
    setEditingGroup(null);

    // Call the parent callback with the merged group data
    const newUpdatedGroup = { ...existingGroup, ...updatedGroup };
    onGroupUpdate(newUpdatedGroup);
  };

  const getPermissionIcons = (permissions: any) => {
    const icons = [];
    if (permissions.canDownload) icons.push(<Download key="download" className="h-3 w-3" />);
    if (permissions.canComment) icons.push(<MessageCircle key="comment" className="h-3 w-3" />);
    if (permissions.canUpload) icons.push(<Upload key="upload" className="h-3 w-3" />);
    if (permissions.canApprove) icons.push(<CheckCircle key="approve" className="h-3 w-3" />);
    if (permissions.canViewInternal) icons.push(<Eye key="view" className="h-3 w-3" />);
    return icons;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{lang('reviewerGroups.title')}</h3>
          <Badge variant="secondary">{groups.length} {lang('reviewerGroups.groups')}</Badge>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {lang('reviewerGroups.newGroup')}
        </Button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow" style={{
            backgroundColor: group.color + '20',
          }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getGroupIcon(group.group_type)}</span>
                  <span className="truncate">{group.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: group.color + '20',
                      color: group.color
                    }}
                  >
                    {group.group_type}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* <DropdownMenuItem onClick={() => handleGroupSelect(group)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem> */}
                      <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {lang('reviewerGroups.editGroup')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteGroup(group)}
                        disabled={isDeleting}
                        className="text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? lang('reviewerGroups.deleting') : lang('reviewerGroups.deleteGroup')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{lang('reviewerGroups.tabs.members')}:</span>
                  <span className='ml-1'>{group.members?.length || 0}</span>
                </div>
                {showPermissions && (
                  <div className="flex flex-wrap gap-1">
                    {getPermissionIcons(group.permissions)}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleGroupSelect(group)}
                >
                  {lang('reviewerGroups.viewDetails')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Review Group Dialog */}
      <AddReviewGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onGroupCreate={async (newGroup) => {
          try {
            // Use setTimeout to ensure the UI updates before the async operation
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // Use the hook to create the group
            const createdGroup = await createGroup(newGroup);
            if (createdGroup) {
              // Update local state immediately for better UX
              setGroups(prevGroups => [...prevGroups, createdGroup]);
              // Call the parent callback
              onGroupCreate(createdGroup);
            }
          } catch (error) {
            console.error('Error creating group:', error);
            // You might want to show a toast error here
          }
        }}
        companyId={companyId}
      />

      {/* Edit Review Group Dialog */}
      <EditReviewGroupDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onGroupUpdate={handleGroupUpdate}
        group={editingGroup}
        companyId={companyId}
      />

      {/* Delete Confirmation Dialog */}
      <MuiDialog 
        open={showDeleteDialog} 
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          }
        }}
      >
        <MuiDialogTitle
          sx={{
            color: 'hsl(var(--foreground))',
            fontWeight: 600,
            fontSize: '1.25rem',
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <AlertTriangle className="h-5 w-5 text-red-500" />
          {lang('reviewerGroups.deleteDialog.title')}
        </MuiDialogTitle>

        <MuiDialogContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: 1 }}>
            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <Box>
              <Typography
                variant="body1"
                sx={{
                  color: 'hsl(var(--foreground))',
                  lineHeight: 1.5,
                  mb: 1
                }}
              >
                {lang('reviewerGroups.deleteDialog.confirmMessage').replace('{{name}}', deletingGroup?.name || '')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'hsl(var(--muted-foreground))',
                  lineHeight: 1.5
                }}
              >
                {lang('reviewerGroups.deleteDialog.warning')}
              </Typography>
            </Box>
          </Box>
        </MuiDialogContent>

        <MuiDialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
          <MuiButton
            onClick={handleCancelDelete}
            disabled={isDeleting}
            variant="outlined"
            sx={{
              color: 'hsl(var(--foreground))',
              borderColor: 'hsl(var(--border))',
              '&:hover': {
                borderColor: 'hsl(var(--ring))',
                backgroundColor: 'hsl(var(--accent))',
              },
              '&:disabled': {
                color: 'hsl(var(--muted-foreground))',
                borderColor: 'hsl(var(--border))',
              }
            }}
          >
            {lang('common.cancel')}
          </MuiButton>
          <MuiButton
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            variant="contained"
            sx={{
              backgroundColor: '#dc2626',
              color: 'white',
              '&:hover': {
                backgroundColor: '#b91c1c',
              },
              '&:disabled': {
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
              }
            }}
          >
            {isDeleting ? lang('reviewerGroups.deleting') : lang('common.delete')}
          </MuiButton>
        </MuiDialogActions>
      </MuiDialog>

      {/* Group Details Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">{selectedGroup && getGroupIcon(selectedGroup.group_type)}</span>
              {selectedGroup?.name}
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: selectedGroup?.color + '20',
                  color: selectedGroup?.color
                }}
              >
                {selectedGroup?.group_type}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedGroup && (
            <div className="space-y-6">
              {/* Group Info */}
              <div>
                <h4 className="font-medium mb-2">{lang('reviewerGroups.details.description')}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedGroup.description || lang('reviewerGroups.details.noDescription')}
                </p>
              </div>

              {/* Members */}
              <div>
                <h4 className="font-medium mb-3">
                  {lang('reviewerGroups.tabs.members')} ({selectedGroup.members?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedGroup.members && selectedGroup.members.length > 0 ? (
                    selectedGroup.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-md border">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>
                            {member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{member.name || lang('reviewerGroups.details.unknownUser')}</span>
                            {member.is_lead && (
                              <Badge variant="outline" className="text-xs">{lang('reviewerGroups.lead')}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                          {member.role && (
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{lang('reviewerGroups.noMembers')}</p>
                  )}
                </div>
              </div>

              {/* Permissions */}
              {showPermissions && (
                <div>
                  <h4 className="font-medium mb-3">{lang('reviewerGroups.tabs.permissions')}</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedGroup.permissions).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span>{getPermissionLabel(key as any)}</span>
                        <Badge variant={value ? "default" : "secondary"}>
                          {value ? lang('reviewerGroups.details.allowed') : lang('reviewerGroups.details.denied')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div>
                <h4 className="font-medium mb-3">{lang('reviewerGroups.settings.title')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{lang('reviewerGroups.settings.requireAll')}:</span>
                    <Badge variant={selectedGroup.settings.requireAllApprovals ? "default" : "secondary"}>
                      {selectedGroup.settings.requireAllApprovals ? lang('reviewerGroups.details.yes') : lang('reviewerGroups.details.no')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang('reviewerGroups.settings.selfAssign')}:</span>
                    <Badge variant={selectedGroup.settings.allowSelfAssignment ? "default" : "secondary"}>
                      {selectedGroup.settings.allowSelfAssignment ? lang('reviewerGroups.details.yes') : lang('reviewerGroups.details.no')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang('reviewerGroups.settings.deadline')}:</span>
                    <Badge variant="outline">
                      {selectedGroup.settings.defaultDeadlineDays || 'N/A'} {lang('reviewerGroups.settings.days')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
