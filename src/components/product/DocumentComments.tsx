import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MessageCircle, MapPin, Users, Calendar, Filter, Plus, ExternalLink } from 'lucide-react';
import { ReviewerGroupSelector } from './ReviewerGroupSelector';
import { useToast } from '@/hooks/use-toast';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useReviewerGroupMembership } from '@/hooks/useReviewerGroupMembership';
import type { CommentThread, Comment, CreateCommentThreadData, CreateCommentData, CommentPosition, EnhancedCommentPosition } from '@/types/comments';
import { useAuth } from '@/context/AuthContext';

interface DocumentCommentsProps {
  documentId: string;
  companyId?: string;
  reviewerGroupId: string;
  onCommentPinClick?: (position: { x: number; y: number }) => void;
  onStartPositioning?: () => void;
  onExistingCommentsChange?: (comments: CommentThread[]) => void;
}

// Helper function to safely convert Json to position type
const convertJsonToPosition = (jsonData: any): CommentPosition | EnhancedCommentPosition | undefined => {
  if (!jsonData || typeof jsonData !== 'object') return undefined;
  // console.log('convertJsonToPosition input:', jsonData, 'type:', typeof jsonData);
  try {
    // Basic validation for required x, y properties
    // if (typeof jsonData.x !== 'number' || typeof jsonData.y !== 'number') {
    //   return undefined;
    // }

    // Return the object cast as position type after validation
    return jsonData as CommentPosition | EnhancedCommentPosition;
  } catch (error) {
    console.warn('Failed to parse position data:', error);
    return undefined;
  }
};

export function DocumentComments({
  documentId,
  companyId,
  onCommentPinClick,
  onStartPositioning,
  onExistingCommentsChange,
  reviewerGroupId
}: DocumentCommentsProps) {
  // console.log('DocumentComments component rendered with:', { documentId, companyId, reviewerGroupId });
  const [newThreadContent, setNewThreadContent] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [userGroupFilter, setUserGroupFilter] = useState<string>('all');
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [showNewCommentForm, setShowNewCommentForm] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<string>('document_review');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeRole } = useCompanyRole();
  const { userGroupsData } = useReviewerGroupMembership(companyId);
  const { user } = useAuth();
  // console.log('user userGroups', userGroupsData);
  // console.log('user id', user);
  // Get reviewer groups for filtering
  const { groups: reviewerGroups, isLoading } = useReviewerGroups(companyId);

  // Test database connection
  useEffect(() => {
    const testConnection = async () => {
      // console.log('Testing database connection...');
      try {
        const { data, error } = await supabase
          .from('comment_threads')
          .select('count')
          .limit(1);
        // console.log('Database connection test result:', { data, error });
      } catch (err) {
        console.error('Database connection test failed:', err);
      }
    };
    testConnection();
  }, []);

  // Filter groups based on user role
  const filteredGroups = React.useMemo(() => {
    if (activeRole === 'admin' || activeRole === 'editor') {
      // Admin/Editor can see all groups
      return reviewerGroups;
    } else {
      // Viewer can only see their own groups
      return userGroupsData;
    }
  }, [reviewerGroups, activeRole, userGroupsData]);

  // Fetch document status
  const { data: documentData } = useQuery({
    queryKey: ['document-status', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('status')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!documentId,
  });

  // Set initial document status
  useEffect(() => {
    if (documentData?.status) {
      setDocumentStatus(documentData.status);
    }
  }, [documentData]);

  // Fetch comment threads for this document
  const { data: threads = [], isLoading: isLoadingThreads, error: queryError } = useQuery({
    queryKey: ['comment-threads', documentId],
    queryFn: async () => {
      // console.log('Starting query for documentId:', documentId);

      try {
        const { data, error } = await supabase
          .from('comment_threads')
          .select(`
            id,
            document_id,
            is_internal,
            position,
            created_at,
            updated_at,
            comments (
              *,
              user_profiles (first_name, last_name)
            )
          `)
          .eq('document_id', documentId)
          .order('created_at', { ascending: true });

        // console.log('Supabase query completed');
        // console.log('Query error:', error);
        // console.log('Query data:', data);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        // console.log('Raw threads data from DB:', data);
        // console.log('Data type:', typeof data);
        // console.log('Data length:', data?.length);

        // Transform the data to match our TypeScript types with safe position conversion
        const transformedThreads = (data || []).map(thread => {
          // console.log('Processing thread:', thread.id, 'Position:', thread.position);
          const convertedPosition = thread.position;
          // console.log('Converted position:', convertedPosition);

          return {
            ...thread,
            position: convertedPosition,
            comments: thread.comments?.map(comment => ({
              ...comment,
              user_profiles: comment.user_profiles ? {
                first_name: comment.user_profiles.first_name || '',
                last_name: comment.user_profiles.last_name || '',
                email: undefined
              } : undefined
            }))
          };
        });

        // console.log('Transformed threads:', transformedThreads);
        return transformedThreads as unknown as CommentThread[];
      } catch (error) {
        console.error('Error in queryFn:', error);
        throw error;
      }
    },
    enabled: !!documentId, // Only run query if documentId exists
  });

  // console.log('Query state - isLoading:', isLoadingThreads, 'error:', queryError, 'threads count:', threads.length);
  // console.log('threads 1322', threads);

  // Debug: Check if we have any data at all
  useEffect(() => {
    // console.log('DocumentComments useEffect - documentId changed:', documentId);
    // console.log('Current threads:', threads);
  }, [documentId, threads]);
  // Notify parent component when threads change
  useEffect(() => {
    if (onExistingCommentsChange && threads) {
      onExistingCommentsChange(threads);
    }
  }, [threads, onExistingCommentsChange]);

  // Create new comment thread
  const createThreadMutation = useMutation({
    mutationFn: async (data: CreateCommentThreadData & { content: string; groupId: string }) => {
      const { content, groupId, ...threadData } = data;

      const selectedGroup = reviewerGroups.find(g => g.id === groupId);
      const isInternal = selectedGroup?.group_type === 'internal';
      const { data: thread, error: threadError } = await supabase
        .from('comment_threads')
        .insert({
          ...threadData,
          is_internal: isInternal,
          position: {
            ...threadData.position,
            reviewer_group_id: groupId,
            reviewer_group_name: selectedGroup?.name
          }
        })
        .select()
        .single();

      if (threadError) throw threadError;

      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          thread_id: thread.id,
          content,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (commentError) throw commentError;
      return thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-threads', documentId] });
      setNewThreadContent('');
      setSelectedGroupId('');
      setPendingPosition(null);
      setShowNewCommentForm(false);
      toast({ title: 'Comment thread created successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error creating comment thread',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleCreateThread = async () => {
    if (!newThreadContent.trim() || !reviewerGroupId) return;

    try {
      // First update the document status
      const { error: statusError } = await supabase
        .from('documents')
        .update({ status: documentStatus })
        .eq('id', documentId);

      if (statusError) {
        console.error('Error updating document status:', statusError);
        toast({
          title: 'Failed to update document status',
          variant: 'destructive'
        });
        return;
      }

      // Then create the comment thread
      await createThreadMutation.mutateAsync({
        document_id: documentId,
        is_internal: false, // Will be determined by reviewer group
        position: pendingPosition,
        content: newThreadContent,
        groupId: reviewerGroupId
      });

      toast({ title: `Comment posted and document status updated to ${documentStatus.replace('_', ' ')}` });
    } catch (error) {
      console.error('Error in handleCreateThread:', error);
      toast({
        title: 'Failed to create comment',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: newStatus })
        .eq('id', documentId);

      if (error) throw error;

      setDocumentStatus(newStatus);
      toast({ title: `Document status updated to ${newStatus.replace('_', ' ')}` });
    } catch (error) {
      console.error('Error updating document status:', error);
      toast({
        title: 'Failed to update document status',
        variant: 'destructive'
      });
    }
  };

  const getGroupBadgeInfo = (thread: CommentThread) => {
    const groupId = thread.position?.reviewer_group_id;
    const groupName = thread.position?.reviewer_group_name;

    if (groupId && groupName) {
      const group = reviewerGroups.find(g => g.id === groupId);
      return {
        name: groupName,
        color: group?.color || '#3b82f6',
        group_type: group?.group_type || 'internal'
      };
    }

    // Fallback for legacy comments
    return {
      name: thread.is_internal ? 'Internal Team' : 'External Review',
      color: thread.is_internal ? '#3b82f6' : '#10b981',
      group_type: thread.is_internal ? 'internal' : 'external'
    };
  };

  // Filter threads based on selected group
  const filteredThreads = threads.filter(thread => {
    if (userGroupFilter === 'all') return true;
    // console.log('thread', thread);
    const groupId = thread.position?.reviewer_group_id;
    // console.log('groupId', groupId);
    // console.log('userGroupFilter', userGroupFilter);
    if (groupId) {
      return groupId === userGroupFilter;
    }

    // Fallback for legacy comments
    if (userGroupFilter === 'internal-team') {
      return thread.is_internal;
    }
    if (userGroupFilter === 'external-review') {
      return !thread.is_internal;
    }

    return false;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (isLoadingThreads) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col bg-gradient-to-br from-slate-50 to-white">
      {/* Header Section */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Comments</h2>
              <p className="text-sm text-slate-500">{filteredThreads.length} active discussions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStartPositioning && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStartPositioning}
                className="flex items-center gap-2 hover:bg-slate-50"
              >
                <MapPin className="h-4 w-4" />
                Add Pin
              </Button>
            )}

            <Button
              onClick={() => setShowNewCommentForm(!showNewCommentForm)}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Comment
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        {filteredGroups.length > 1 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter className="h-4 w-4" />
              <span>Filter by:</span>
            </div>

            <Select value={userGroupFilter} onValueChange={setUserGroupFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select group filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Groups ({filteredGroups.length})
                </SelectItem>
                {filteredGroups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name} ({threads.filter(t => t.position?.reviewer_group_id === group.id).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* New Comment Form */}
      {showNewCommentForm && (
        <div className="flex-shrink-0 bg-white border-b border-slate-200 p-6">
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Plus className="h-4 w-4" />
              Create New Comment Thread
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  Your Comment
                </label>
                <Textarea
                  placeholder="Share your thoughts, feedback, or questions..."
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  rows={3}
                  className="resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {pendingPosition && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 p-2 rounded-lg">
                  <MapPin className="h-3 w-3" />
                  Pinned to position: x={pendingPosition.x}, y={pendingPosition.y}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewCommentForm(false)}
                  className="text-slate-600"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleCreateThread}
                  disabled={!newThreadContent.trim() || createThreadMutation.isPending}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createThreadMutation.isPending ? 'Creating...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-slate-100 mb-4">
              <MessageCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No comments yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm">
              Start the conversation by adding the first comment to this document.
            </p>
            <Button
              onClick={() => setShowNewCommentForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Comment
            </Button>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const groupInfo = getGroupBadgeInfo(thread);
            const latestComment = thread.comments?.[thread.comments.length - 1];

            return (
              <Card
                key={thread.id}
                className="group hover:shadow-md transition-all duration-200 border-slate-200 overflow-hidden"
              >
                {/* <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: groupInfo.color }}
                      />
                      <div>
                        <Badge
                          variant="secondary"
                          className="text-xs font-medium mb-2"
                          style={{
                            backgroundColor: `${groupInfo.color}15`,
                            color: groupInfo.color,
                            border: `1px solid ${groupInfo.color}25`
                          }}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {groupInfo.name}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {formatTimeAgo(thread.created_at)}
                          {thread.comments && thread.comments.length > 1 && (
                            <span>• {thread.comments.length} messages</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {thread.position && onCommentPinClick && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCommentPinClick(thread.position!)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-slate-100"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Go to Pin
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader> */}

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {thread.comments?.map((comment, index) => (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-lg ${index === 0
                          ? 'bg-slate-50 border-l-4'
                          : 'bg-white border border-slate-100'
                          }`}
                        style={index === 0 ? { borderLeftColor: groupInfo.color } : {}}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-black text-xs font-medium">
                              {comment.user_profiles?.first_name.slice(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm text-slate-900">
                                {comment.user_profiles?.first_name && comment.user_profiles?.last_name
                                  ? `${comment.user_profiles.first_name} ${comment.user_profiles.last_name}`
                                  : 'Unknown User'
                                }
                              </span>
                              <span className="text-xs text-slate-400 mt-1">
                                {formatTimeAgo(comment.created_at)}
                              </span>
                            </div>
                          </div>

                        </div>
                        <p className="text-sm text-slate-700 font-bold leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}