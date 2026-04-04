
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Plus, Users, Clock, CheckCircle, FileText, AlertCircle, Settings, Calendar, Trash2, Loader2 } from 'lucide-react';
import { CreateWorkflowDialog } from './CreateWorkflowDialog';
import { WorkflowList } from './WorkflowList';
import { ReviewDashboard } from './ReviewDashboard';
import { ReviewerGroupManagementDialog } from './ReviewerGroupManagementDialog';
import { ReviewerGroupSelectionDialog } from './ReviewerGroupSelectionDialog';
import { useReviewWorkflows } from '@/hooks/useReviewWorkflows';
import type { ReviewRecordType } from '@/types/review';
import { toast } from 'sonner';
import { ReviewerGroup } from '@/types/reviewerGroups';

interface UniversalReviewManagerProps {
  recordType: ReviewRecordType;
  recordId: string;
  recordName?: string;
  companyId: string;
  className?: string;
  onReviewerGroupsChange?: () => void;
  enabled?: boolean;
}

export function UniversalReviewManager({
  recordType,
  recordId,
  recordName,
  companyId,
  className,
  onReviewerGroupsChange,
  enabled = true
}: UniversalReviewManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [reviwer, setReviwer] = useState<any[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ groupId: string; groupName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const {
    workflows,
    isLoading,
    fetchWorkflows,
    addReviewerGroup,
    reviewerGroups,
    fetchReviewerGroups,
    removeReviewerGroup,
  } = useReviewWorkflows(recordType, recordId, companyId, { enabled });
  console.log('reviewerGroups', reviewerGroups);
  const getRecordTypeLabel = () => {
    switch (recordType) {
      case 'document':
        return 'Document';
      case 'gap_analysis_item':
        return 'Gap Analysis Item';
      case 'audit':
        return 'Audit';
      default:
        return 'Record';
    }
  };

  const activeWorkflows = workflows.filter(w => w.overall_status === 'pending' || w.overall_status === 'in_review');
  const completedWorkflows = workflows.filter(w => w.overall_status === 'approved' || w.overall_status === 'rejected');

  const handleWorkflowCreated = async () => {
    console.log('Workflow created callback - refreshing workflows');
    await fetchWorkflows();
    setSelectedGroups([]);
  };

  const handleGroupsSelected = async (selectedGroups: string[]) => {
    if (selectedGroups.length === 0) {
      toast.error('Please select at least one reviewer group');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await addReviewerGroup(recordId, selectedGroups);
      if (response && response.success) {
        toast.success(response.message || 'Reviewer groups assigned successfully');
        // Refresh reviewer groups display
        await fetchReviewerGroups();
        // Notify parent component to refresh if callback provided
        if (onReviewerGroupsChange) {
          onReviewerGroupsChange();
        }
        // For gap_analysis_item, don't open workflow dialog - assignment is complete
        if (recordType !== 'gap_analysis_item') {
          setSelectedGroups(selectedGroups);
          setShowCreateDialog(true);
        } else {
          // For gap analysis items, just close the selection dialog
          setSelectedGroups([]);
        }
      } else {
        toast.error(response?.message || 'Failed to assign reviewer groups');
      }
    } catch (error) {
      console.error('Error assigning reviewer groups:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign reviewer groups');
    } finally {
      setIsAssigning(false);
      setShowGroupSelection(false);
    }
  };

  const handleRemoveReviewerGroup = (groupId: string, groupName: string) => {
    setDeleteConfirmation({ groupId, groupName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    setIsDeleting(true);
    try {
      const result = await removeReviewerGroup(deleteConfirmation.groupId);
      if (result.success) {
        toast.success(result.message);
        fetchReviewerGroups();
        if (onReviewerGroupsChange) {
          onReviewerGroupsChange();
        }
        setDeleteConfirmation(null);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleWorkflowDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedGroups([]);
    }
    setShowCreateDialog(open);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading reviews...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`${className} relative`}>
        {isAssigning && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Assigning reviewer groups...</p>
            </div>
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {recordName && <p className="text-xs text-muted-foreground">{recordName}</p>}
            </div>

            <div className="flex items-center gap-1">
              <Button
                onClick={() => setShowGroupManagement(true)}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Setup
              </Button>
              <Button
                onClick={() => setShowGroupSelection(true)}
                size="sm"
                className="h-7 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Review
              </Button>
            </div>
          </div>

          {/* Quick Stats - More Compact */}
          {workflows.length > 0 && (
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <span className="text-muted-foreground">Active:</span>
                <span className="font-medium">{activeWorkflows.length}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium">{completedWorkflows.length}</span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {/* Delete Confirmation Alert */}
          {deleteConfirmation && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Remove Reviewer Group</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Are you sure you want to remove "{deleteConfirmation.groupName}" from this review?
                </span>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelDelete}
                    className="h-7 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmDelete}
                    className="h-7 px-3"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {reviewerGroups.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium mb-1">No reviewer groups yet</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                Set up reviewer groups first, then create workflows to collaborate with your team.
              </p>
            </div>
          ) : (
            // Reviewer Group Section
            <div className="space-y-4">
              {reviewerGroups.length > 0 ? (
                <div className="grid gap-4">
                  {reviewerGroups.map((group: ReviewerGroup) => (
                    <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Group Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-2 border-blue-200">
                              <span className="text-2xl">
                                {group.group_type === 'external' ? '🌐' : '👥'}
                              </span>
                            </div>
                          </div>

                          {/* Group Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 text-lg truncate">
                                {group.name}
                              </h4>
                              <Badge
                                variant="secondary"
                                className={`capitalize text-xs px-2 py-1 ${group.group_type === 'external' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    'bg-blue-100 text-blue-800 border-blue-200'
                                  }`}
                              >
                                {group.group_type || 'internal'}
                              </Badge>
                            </div>

                            {group.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {group.description}
                              </p>
                            )}

                            {/* Group Stats */}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {/* <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{group.members?.length || 0} members</span>
                              </div> */}
                              {group.created_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div className="flex-shrink-0 ml-4">
                          <Button
                            onClick={() => handleRemoveReviewerGroup(group.id, group.name)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Remove reviewer group"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Member Preview (if any) */}
                      {group.members && group.members.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Recent Members
                            </span>
                            <span className="text-xs text-gray-400">
                              {group.members.length} total
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {group.members.slice(0, 3).map((member: any, index: number) => (
                              <div key={member.id || index} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {member.user_profiles?.first_name?.[0] ||
                                      member.user_profiles?.last_name?.[0] ||
                                      member.name?.[0] || 'U'}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-600 truncate max-w-20">
                                  {member.user_profiles?.first_name && member.user_profiles?.last_name
                                    ? `${member.user_profiles.first_name} ${member.user_profiles.last_name}`
                                    : member.name || 'Unknown User'
                                  }
                                </span>
                              </div>
                            ))}
                            {group.members.length > 3 && (
                              <div className="text-xs text-gray-400">
                                +{group.members.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviewer Groups</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create reviewer groups to start managing document reviews
                  </p>
                  <Button
                    onClick={() => setShowGroupManagement(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Reviewer Group
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewerGroupSelectionDialog
        open={showGroupSelection}
        onOpenChange={setShowGroupSelection}
        recordType={recordType}
        recordId={recordId}
        recordName={recordName}
        companyId={companyId}
        onGroupsSelected={handleGroupsSelected}
        setReviwer={setReviwer as any}
        fetchReviewerGroups={fetchReviewerGroups}
      />

      {/* <CreateWorkflowDialog 
          open={showCreateDialog} 
          onOpenChange={handleWorkflowDialogClose} 
          recordType={recordType} 
          recordId={recordId} 
          recordName={recordName} 
          companyId={companyId} 
          onWorkflowCreated={handleWorkflowCreated}
          preSelectedGroups={selectedGroups}
        /> */}

      <ReviewerGroupManagementDialog
        open={showGroupManagement}
        onOpenChange={setShowGroupManagement}
        companyId={companyId}
      />
    </>
  );
}
