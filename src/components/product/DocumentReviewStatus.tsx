
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, AlertTriangle, Users } from 'lucide-react';

interface DocumentReviewStatusProps {
  documentId: string;
  documentName: string;
  reviewStatus: 'not_started' | 'in_review' | 'changes_requested' | 'approved' | 'rejected';
  deadline?: string;
  reviewProgress?: number;
  pendingReviewers?: number;
  totalReviewers?: number;
  onApprove?: () => void;
  onRequestChanges?: () => void;
  onReject?: () => void;
  canReview?: boolean;
}

const statusConfig = {
  not_started: {
    label: 'Not Started',
    color: 'bg-gray-500',
    icon: Clock,
    description: 'Review has not begun'
  },
  in_review: {
    label: 'In Review',
    color: 'bg-blue-500',
    icon: Clock,
    description: 'Currently being reviewed'
  },
  changes_requested: {
    label: 'Changes Requested',
    color: 'bg-orange-500',
    icon: AlertTriangle,
    description: 'Reviewer has requested changes'
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-500',
    icon: CheckCircle,
    description: 'Document has been approved'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500',
    icon: XCircle,
    description: 'Document has been rejected'
  }
};

export function DocumentReviewStatus({
  documentId,
  documentName,
  reviewStatus,
  deadline,
  reviewProgress = 0,
  pendingReviewers = 0,
  totalReviewers = 0,
  onApprove,
  onRequestChanges,
  onReject,
  canReview = false
}: DocumentReviewStatusProps) {
  const config = statusConfig[reviewStatus];
  const StatusIcon = config.icon;
  
  const isOverdue = deadline && new Date(deadline) < new Date();
  const daysUntilDeadline = deadline 
    ? Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Review Status: {documentName}
          </CardTitle>
          <Badge className={`${config.color} text-white`}>
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress and Reviewers */}
        {totalReviewers > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Review Progress
              </span>
              <span>{totalReviewers - pendingReviewers}/{totalReviewers} completed</span>
            </div>
            <Progress value={reviewProgress} className="h-2" />
          </div>
        )}

        {/* Deadline Info */}
        {deadline && (
          <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
            <Clock className="h-4 w-4" />
            {isOverdue ? (
              <span className="font-medium">Overdue by {Math.abs(daysUntilDeadline!)} days</span>
            ) : daysUntilDeadline === 0 ? (
              <span className="font-medium text-orange-600">Due today</span>
            ) : (
              <span>Due in {daysUntilDeadline} days ({new Date(deadline).toLocaleDateString()})</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {canReview && reviewStatus === 'in_review' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              onClick={onApprove}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button 
              onClick={onRequestChanges}
              size="sm"
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Request Changes
            </Button>
            <Button 
              onClick={onReject}
              size="sm"
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {/* Pending Action Message */}
        {pendingReviewers > 0 && (
          <div className="text-sm text-muted-foreground border-l-4 border-blue-500 pl-3">
            Waiting for {pendingReviewers} reviewer{pendingReviewers !== 1 ? 's' : ''} to complete their review
          </div>
        )}
      </CardContent>
    </Card>
  );
}
