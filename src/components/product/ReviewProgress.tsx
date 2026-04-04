
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Users
} from 'lucide-react';
import { DocumentReviewAssignment, ReviewerGroup } from '@/types/reviewerGroups';

interface ReviewProgressProps {
  assignments: DocumentReviewAssignment[];
  groups: ReviewerGroup[];
  documentId: string;
}

export function ReviewProgress({ assignments, groups, documentId }: ReviewProgressProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'changes_requested':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'changes_requested':
        return 'bg-yellow-500';
      case 'in_review':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculateOverallProgress = () => {
    if (assignments.length === 0) return 0;
    const completedAssignments = assignments.filter(a => 
      ['approved', 'rejected', 'changes_requested'].includes(a.status)
    );
    return (completedAssignments.length / assignments.length) * 100;
  };

  const totalReviewers = assignments.reduce((sum, assignment) => 
    sum + assignment.progress.totalReviewers, 0
  );
  const totalApproved = assignments.reduce((sum, assignment) => 
    sum + assignment.progress.approvedCount, 0
  );
  const totalRejected = assignments.reduce((sum, assignment) => 
    sum + assignment.progress.rejectedCount, 0
  );
  const totalPending = assignments.reduce((sum, assignment) => 
    sum + assignment.progress.pendingCount, 0
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Review Progress
          </CardTitle>
          <Badge variant="outline">
            {assignments.length} group{assignments.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(calculateOverallProgress())}%</span>
          </div>
          <Progress value={calculateOverallProgress()} className="h-2" />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-lg font-semibold text-green-600">{totalApproved}</div>
            <div className="text-xs text-muted-foreground">Approved</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-red-600">{totalRejected}</div>
            <div className="text-xs text-muted-foreground">Rejected</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-gray-600">{totalPending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>

        {/* Group Assignments */}
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const group = groups.find(g => g.id === assignment.reviewerGroupId);
            if (!group) return null;

            return (
              <div key={assignment.id} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{group.name}</span>
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: group.color + '20', color: group.color }}
                    >
                      {group.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(assignment.status)}
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Group Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {assignment.progress.approvedCount + assignment.progress.rejectedCount} / {assignment.progress.totalReviewers} completed
                    </span>
                    {assignment.dueDate && (
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  {assignment.progress.totalReviewers > 0 && (
                    <Progress 
                      value={((assignment.progress.approvedCount + assignment.progress.rejectedCount) / assignment.progress.totalReviewers) * 100} 
                      className="h-1"
                    />
                  )}

                  {/* Individual Approvals */}
                  {assignment.approvals.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {assignment.approvals.slice(0, 5).map((approval) => (
                        <div key={approval.id} className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {approval.reviewerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-xs">
                            {getStatusIcon(approval.status)}
                          </div>
                        </div>
                      ))}
                      {assignment.approvals.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{assignment.approvals.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {assignments.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No review groups assigned</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
