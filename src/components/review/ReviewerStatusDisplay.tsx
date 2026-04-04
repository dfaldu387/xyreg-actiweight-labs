import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

import { ReviewerStatus, ReviewerGroupStatus } from '@/types/client';

interface ReviewerStatusDisplayProps {
  reviewers?: ReviewerStatus[];
  reviewerGroups?: ReviewerGroupStatus[];
  className?: string;
  showLabels?: boolean;
}

export function ReviewerStatusDisplay({
  reviewers = [],
  reviewerGroups = [],
  className,
  showLabels = true
}: ReviewerStatusDisplayProps) {
  // Handle both legacy single reviewers and new reviewer groups
  const hasGroups = reviewerGroups.length > 0;
  const hasIndividualReviewers = reviewers.length > 0;
  console.log(reviewerGroups);
  console.log("reviewers 213 456", reviewers);
  if (!hasGroups && !hasIndividualReviewers) {
    return null;
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getGroupStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'bg-emerald-50/80',
          border: 'border-emerald-200/60',
          text: 'text-emerald-700',
          icon: 'text-emerald-600'
        };
      case 'in_review':
        return {
          bg: 'bg-blue-50/80',
          border: 'border-blue-200/60',
          text: 'text-blue-700',
          icon: 'text-blue-600'
        };
      case 'pending':
        return {
          bg: 'bg-amber-50/80',
          border: 'border-amber-200/60',
          text: 'text-amber-700',
          icon: 'text-amber-600'
        };
      case 'rejected':
        return {
          bg: 'bg-red-50/80',
          border: 'border-red-200/60',
          text: 'text-red-700',
          icon: 'text-red-600'
        };
      default:
        return {
          bg: 'bg-gray-50/80',
          border: 'border-gray-200/60',
          text: 'text-gray-700',
          icon: 'text-gray-600'
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_review':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTimingInfo = (member: any): string | null => {
    try {
      // Check for assignment timing for pending/in_review status
      if ((member.status === 'pending' || member.status === 'in_review') && member.assignedAt) {
        const timing = `Assigned ${formatDistanceToNow(new Date(member.assignedAt), { addSuffix: true })}`;
        console.log('Assignment timing:', timing);
        return timing;
      }

      // Check for approval timing
      if (member.status === 'approved' && member.approvedAt && member.assignedAt) {
        const assignedTime = new Date(member.assignedAt);
        const approvedTime = new Date(member.approvedAt);
        const diffMs = approvedTime.getTime() - assignedTime.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) {
          return `Took ${diffDays} day${diffDays > 1 ? 's' : ''} to approve`;
        } else if (diffHours > 0) {
          return `Took ${diffHours} hour${diffHours > 1 ? 's' : ''} to approve`;
        } else {
          return 'Approved quickly';
        }
      }

      // Fallback to approved_at if available
      if (member.status === 'approved' && member.approved_at) {
        return `Approved ${formatDistanceToNow(new Date(member.approved_at), { addSuffix: true })}`;
      }

      return null;
    } catch (error) {
      console.warn('Error calculating timing info:', error);
      return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Reviewer Groups Display */}
      {hasGroups && reviewerGroups.map((group) => {
        const statusColor = getGroupStatusColor(group.status);

        return (
          <div key={group.id} className="space-y-3">
            {/* Group Header */}
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              statusColor.bg,
              statusColor.border
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("flex items-center justify-center", statusColor.icon)}>
                  {getStatusIcon(group.status)}
                </div>
                <div>
                  <h4 className={cn("font-semibold text-sm", statusColor.text)}>
                    {group.groupName}
                  </h4>
                  <p className={cn("text-xs opacity-80", statusColor.text)}>
                    {group.groupType} • {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className={cn("text-xs font-medium", statusColor.text)}>
                {group.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Group Members */}
            {group.members.length > 0 && (
              <div className="space-y-2 ml-4">
                {group.members.map((member) => {
                  const memberStatusColor = getGroupStatusColor(member.status);

                  return (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg border",
                        memberStatusColor.bg,
                        memberStatusColor.border
                      )}
                    >
                      <div className={cn("flex items-center justify-center", memberStatusColor.icon)}>
                        {getStatusIcon(member.status)}
                      </div>
                      <Avatar className="h-6 w-6 border-2">
                        <AvatarFallback className={cn(
                          "text-xs font-medium",
                          memberStatusColor.bg.replace('50/80', '100'),
                          memberStatusColor.text
                        )}>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-sm font-medium truncate", memberStatusColor.text)}>
                          {member.name}
                        </span>
                        {member.role && (
                          <p className={cn("text-xs opacity-80 truncate", memberStatusColor.text)}>
                            {member.role}
                          </p>
                        )}
                        {getTimingInfo(member) && (
                          <p className={cn("text-xs opacity-70 truncate italic", memberStatusColor.text)}>
                            {getTimingInfo(member)}
                          </p>
                        )}
                      </div>
                      {member.status === 'in_review' && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Legacy Individual Reviewers Display (for backward compatibility) */}
      {hasIndividualReviewers && !hasGroups && (
        <div className="space-y-3">
          {showLabels && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                Individual Reviewers ({reviewers.length})
              </span>
            </div>
          )}
          <div className="space-y-2">
            {reviewers.map((reviewer) => {
              const statusColor = getGroupStatusColor(reviewer.status);

              return (
                <div
                  key={reviewer.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border",
                    statusColor.bg,
                    statusColor.border
                  )}
                >
                  <div className={cn("flex items-center justify-center", statusColor.icon)}>
                    {getStatusIcon(reviewer.status)}
                  </div>
                  <Avatar className="h-6 w-6 border-2">
                    <AvatarFallback className={cn(
                      "text-xs font-medium",
                      statusColor.bg.replace('50/80', '100'),
                      statusColor.text
                    )}>
                      {getInitials(reviewer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-sm font-medium truncate", statusColor.text)}>
                      {reviewer.name}
                    </span>
                    {getTimingInfo(reviewer) && (
                      <p className={cn("text-xs opacity-70 truncate italic", statusColor.text)}>
                        {getTimingInfo(reviewer)}
                      </p>
                    )}
                  </div>
                  {reviewer.status === 'in_review' && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}