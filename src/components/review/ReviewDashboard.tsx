
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import type { ReviewWorkflow, ReviewRecordType } from '@/types/review';

interface ReviewDashboardProps {
  workflows: ReviewWorkflow[];
  recordType: ReviewRecordType;
}

export function ReviewDashboard({ workflows, recordType }: ReviewDashboardProps) {
  const getStatusCounts = () => {
    return {
      pending: workflows.filter(w => w.overall_status === 'pending').length,
      in_review: workflows.filter(w => w.overall_status === 'in_review').length,
      approved: workflows.filter(w => w.overall_status === 'approved').length,
      rejected: workflows.filter(w => w.overall_status === 'rejected').length,
      changes_requested: workflows.filter(w => w.overall_status === 'changes_requested').length
    };
  };

  const getCompletionRate = () => {
    const completed = workflows.filter(w => 
      w.overall_status === 'approved' || w.overall_status === 'rejected'
    ).length;
    
    return workflows.length > 0 ? (completed / workflows.length) * 100 : 0;
  };

  const statusCounts = getStatusCounts();
  const completionRate = getCompletionRate();
  const totalActive = statusCounts.pending + statusCounts.in_review;

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-2">No workflow data</h3>
        <p className="text-sm text-muted-foreground">
          Create some review workflows to see analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Reviews</p>
                <p className="text-2xl font-bold text-blue-900">{workflows.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Active Now</p>
                <p className="text-2xl font-bold text-orange-900">{totalActive}</p>
              </div>
              <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Completion Rate</p>
                <p className="text-2xl font-bold text-green-900">{Math.round(completionRate)}%</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall completion</span>
              <span className="font-medium">{Math.round(completionRate)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {statusCounts.approved + statusCounts.rejected} of {workflows.length} reviews completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statusCounts.in_review > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">In Review</p>
                    <p className="text-xs text-blue-600">Currently being reviewed</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {statusCounts.in_review}
                </Badge>
              </div>
            )}

            {statusCounts.pending > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pending</p>
                    <p className="text-xs text-gray-600">Waiting to start</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {statusCounts.pending}
                </Badge>
              </div>
            )}

            {statusCounts.approved > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Approved</p>
                    <p className="text-xs text-green-600">Review completed successfully</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {statusCounts.approved}
                </Badge>
              </div>
            )}

            {statusCounts.changes_requested > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-900">Changes Requested</p>
                    <p className="text-xs text-yellow-600">Needs revision</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  {statusCounts.changes_requested}
                </Badge>
              </div>
            )}

            {statusCounts.rejected > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">Rejected</p>
                    <p className="text-xs text-red-600">Review not approved</p>
                  </div>
                </div>
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  {statusCounts.rejected}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
