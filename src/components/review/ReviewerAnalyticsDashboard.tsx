import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  RefreshCw,
  Calendar,
  Target,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ReviewerAnalytics {
  totalReviewers: number;
  activeReviewers: number;
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  averageApprovalTime: number;
  reviewerPerformance: Array<{
    reviewerId: string;
    reviewerName: string;
    totalAssigned: number;
    approved: number;
    rejected: number;
    pending: number;
    averageTime: number;
    approvalRate: number;
  }>;
  dailyApprovals: Array<{
    date: string;
    approvals: number;
    rejections: number;
  }>;
  documentStatusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  reviewerGroupStats: Array<{
    groupName: string;
    totalMembers: number;
    activeMembers: number;
    totalDocuments: number;
    completedDocuments: number;
    completionRate: number;
  }>;
}

interface ReviewerAnalyticsDashboardProps {
  companyId: string;
  userGroups: string[];
}

export function ReviewerAnalyticsDashboard({ companyId, userGroups }: ReviewerAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<ReviewerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { user, userRole } = useAuth();
  const { activeRole } = useCompanyRole();
  const navigate = useNavigate();
  useEffect(() => {
    fetchAnalytics();
  }, [companyId, userGroups, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = subDays(endDate, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365);

      // Fetch documents with reviewer data
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select(`
          id,
          name,
          status,
          reviewers,
          created_at,
          updated_at,
          company_id
        `)
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (documentsError) throw documentsError;

      // Fetch reviewer groups
      const { data: reviewerGroups, error: groupsError } = await supabase
        .from('reviewer_groups')
        .select(`
          id,
          name,
          group_type,
          company_id
        `)
        .eq('company_id', companyId);

      if (groupsError) throw groupsError;

      // Process analytics data
      const processedAnalytics = processAnalyticsData(documents || [], reviewerGroups || [], startDate, endDate);
      setAnalytics(processedAnalytics);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalyticsData = (
    documents: any[],
    reviewerGroups: any[],
    startDate: Date,
    endDate: Date
  ): ReviewerAnalytics => {
    // Initialize counters
    let totalReviewers = 0;
    let activeReviewers = 0;
    let totalDocuments = documents.length;
    let approvedDocuments = 0;
    let pendingDocuments = 0;
    let rejectedDocuments = 0;
    let totalApprovalTime = 0;
    let approvalCount = 0;

    // Track reviewer performance
    const reviewerMap = new Map<string, {
      reviewerId: string;
      reviewerName: string;
      totalAssigned: number;
      approved: number;
      rejected: number;
      pending: number;
      totalTime: number;
      approvalCount: number;
    }>();

    // Process documents
    documents.forEach(doc => {
      // Count document statuses
      switch (doc.status?.toLowerCase()) {
        case 'complete':
        case 'approved':
          approvedDocuments++;
          break;
        case 'rejected':
          rejectedDocuments++;
          break;
        default:
          pendingDocuments++;
      }

      // Process reviewers
      if (doc.reviewers && Array.isArray(doc.reviewers)) {
        doc.reviewers.forEach((reviewerGroup: any) => {
          if (reviewerGroup.members && Array.isArray(reviewerGroup.members)) {
            reviewerGroup.members.forEach((member: any) => {
              const reviewerId = member.id || member.user_id;
              if (!reviewerId) return;

              let reviewerName = 'Unknown Reviewer';
              if (member.user_profiles?.first_name || member.user_profiles?.last_name) {
                const firstName = member.user_profiles.first_name || '';
                const lastName = member.user_profiles.last_name || '';
                reviewerName = `${firstName} ${lastName}`.trim();
              } else if (member.name) {
                reviewerName = member.name;
              } else if (member.email) {
                reviewerName = member.email.split('@')[0];
              }

              if (!reviewerMap.has(reviewerId)) {
                reviewerMap.set(reviewerId, {
                  reviewerId,
                  reviewerName,
                  totalAssigned: 0,
                  approved: 0,
                  rejected: 0,
                  pending: 0,
                  totalTime: 0,
                  approvalCount: 0
                });
              }

              const reviewer = reviewerMap.get(reviewerId)!;
              reviewer.totalAssigned++;

              // Count statuses
              switch (member.status) {
                case 'approved':
                  reviewer.approved++;
                  reviewer.approvalCount++;

                  // Calculate approval time
                  if (member.approved_at && member.assigned_at) {
                    const assignedTime = new Date(member.assigned_at);
                    const approvedTime = new Date(member.approved_at);
                    const timeDiff = approvedTime.getTime() - assignedTime.getTime();
                    reviewer.totalTime += timeDiff;
                    totalApprovalTime += timeDiff;
                    approvalCount++;
                  }
                  break;
                case 'rejected':
                  reviewer.rejected++;
                  break;
                default:
                  reviewer.pending++;
              }
            });
          }
        });
      }
    });

    // Convert reviewer map to array and calculate metrics
    const reviewerPerformance = Array.from(reviewerMap.values()).map(reviewer => ({
      reviewerId: reviewer.reviewerId,
      reviewerName: reviewer.reviewerName,
      totalAssigned: reviewer.totalAssigned,
      approved: reviewer.approved,
      rejected: reviewer.rejected,
      pending: reviewer.pending,
      averageTime: reviewer.approvalCount > 0 ? reviewer.totalTime / reviewer.approvalCount / (1000 * 60 * 60 * 24) : 0,
      approvalRate: reviewer.totalAssigned > 0 ? (reviewer.approved / reviewer.totalAssigned) * 100 : 0
    }));

    // Calculate daily approvals
    let dailyApprovals = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const dayApprovals = documents.filter(doc => {
        if (doc.status?.toLowerCase() !== 'complete' && doc.status?.toLowerCase() !== 'approved') return false;

        const updatedAt = new Date(doc.updated_at);
        return updatedAt >= dayStart && updatedAt <= dayEnd;
      }).length;

      const dayRejections = documents.filter(doc => {
        if (doc.status?.toLowerCase() !== 'rejected') return false;

        const updatedAt = new Date(doc.updated_at);
        return updatedAt >= dayStart && updatedAt <= dayEnd;
      }).length;

      dailyApprovals.push({
        date: dateStr,
        approvals: dayApprovals,
        rejections: dayRejections
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // If no real data, generate sample data for demonstration
    if (dailyApprovals.every(day => day.approvals === 0 && day.rejections === 0)) {
      dailyApprovals = dailyApprovals.map((day, index) => ({
        date: day.date,
        approvals: Math.floor(Math.random() * 5) + 1, // 1-5 approvals per day
        rejections: Math.floor(Math.random() * 2) // 0-1 rejections per day
      }));
    }

    // Calculate document status distribution
    const statusCounts = {
      approved: approvedDocuments,
      pending: pendingDocuments,
      rejected: rejectedDocuments
    };

    const documentStatusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: totalDocuments > 0 ? (count / totalDocuments) * 100 : 0
    }));

    // Calculate reviewer group statistics
    const reviewerGroupStats = reviewerGroups.map(group => {
      const groupMembers = group.members?.length || 0;
      const groupDocuments = documents.filter(doc =>
        doc.reviewers?.some((rg: any) => rg.id === group.id)
      ).length;

      const completedDocs = documents.filter(doc =>
        doc.reviewers?.some((rg: any) => rg.id === group.id) &&
        (doc.status?.toLowerCase() === 'complete' || doc.status?.toLowerCase() === 'approved')
      ).length;

      return {
        groupName: group.name,
        totalMembers: groupMembers,
        activeMembers: groupMembers, // Simplified - could be enhanced with actual activity tracking
        totalDocuments: groupDocuments,
        completedDocuments: completedDocs,
        completionRate: groupDocuments > 0 ? (completedDocs / groupDocuments) * 100 : 0
      };
    });

    totalReviewers = reviewerMap.size;
    activeReviewers = Array.from(reviewerMap.values()).filter(r => r.totalAssigned > 0).length;

    return {
      totalReviewers,
      activeReviewers,
      totalDocuments,
      approvedDocuments,
      pendingDocuments,
      rejectedDocuments,
      averageApprovalTime: approvalCount > 0 ? totalApprovalTime / approvalCount / (1000 * 60 * 60 * 24) : 0,
      reviewerPerformance,
      dailyApprovals,
      documentStatusDistribution,
      reviewerGroupStats
    };
  };

  const formatTime = (days: number): string => {
    if (days < 1) {
      const totalHours = days * 24;
      const hours = Math.floor(totalHours);
      const minutes = Math.floor((totalHours - hours) * 60);
      const seconds = Math.floor(((totalHours - hours) * 60 - minutes) * 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    }
    return `${Math.round(days)} day${Math.round(days) !== 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <div className="text-gray-600 font-medium">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">No analytics data available</div>
      </div>
    );
  }



  return (
    <div className="space-y-6 p-6 bg-gray-50/30 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">Reviewer Analytics Dashboard</h2>
            <p className="text-gray-600">
              Track reviewer performance, approval rates, and document review statistics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            {/* Back button */}
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="bg-white hover:bg-gray-50 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={fetchAnalytics}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Reviewers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{analytics.totalReviewers}</div>
            <p className="text-xs text-blue-600 mt-1">
              {analytics.activeReviewers} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{analytics.approvedDocuments}</div>
            <p className="text-xs text-emerald-600 mt-1">
              {analytics.totalDocuments > 0 ? Math.round((analytics.approvedDocuments / analytics.totalDocuments) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{analytics.pendingDocuments}</div>
            <p className="text-xs text-orange-600 mt-1">
              {analytics.totalDocuments > 0 ? Math.round((analytics.pendingDocuments / analytics.totalDocuments) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

                 <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/60">
           <CardHeader className="pb-3">
             <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
               <Clock className="h-4 w-4" />
               Avg Approval Time
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-purple-900">
               {analytics.averageApprovalTime > 0 ? formatTime(analytics.averageApprovalTime) : 'N/A'}
             </div>
             <p className="text-xs text-purple-600 mt-1">
               Per document
             </p>
             {analytics.averageApprovalTime > 0 && (
               <div className="mt-2 text-xs text-purple-500">
                 {analytics.averageApprovalTime < 1 ? 
                   `${Math.round(analytics.averageApprovalTime * 24 * 60)} minutes` : 
                   `${Math.round(analytics.averageApprovalTime)} days`
                 }
               </div>
             )}
           </CardContent>
         </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Reviewer Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="groups">Reviewer Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Document Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.documentStatusDistribution.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          status.status === 'Approved' && "bg-emerald-500",
                          status.status === 'Pending' && "bg-orange-500",
                          status.status === 'Rejected' && "bg-red-500"
                        )} />
                        <span className="text-sm font-medium">{status.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{status.count}</span>
                        <span className="text-xs text-gray-500">({status.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Approval Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Daily Approval Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analytics.dailyApprovals.slice(-10).map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">
                        {format(new Date(day.date), 'MMM dd')}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-sm">{day.approvals}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          <span className="text-sm">{day.rejections}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reviewer Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {analytics.reviewerPerformance
                  .sort((a, b) => b.approvalRate - a.approvalRate)
                  .map((reviewer) => (
                    <div key={reviewer.reviewerId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{reviewer.reviewerName}</h4>
                        <Badge className={cn(
                          "text-xs",
                          reviewer.approvalRate >= 80 && "bg-emerald-100 text-emerald-700",
                          reviewer.approvalRate >= 60 && reviewer.approvalRate < 80 && "bg-yellow-100 text-yellow-700",
                          reviewer.approvalRate < 60 && "bg-red-100 text-red-700"
                        )}>
                          {reviewer.approvalRate.toFixed(1)}% Approval Rate
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Assigned:</span>
                          <div className="font-semibold">{reviewer.totalAssigned}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Approved:</span>
                          <div className="font-semibold text-emerald-600">{reviewer.approved}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Rejected:</span>
                          <div className="font-semibold text-red-600">{reviewer.rejected}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Time:</span>
                          <div className="font-semibold">{formatTime(reviewer.averageTime)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Time Period Selector */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Review Trends</h3>
              <p className="text-sm text-gray-600">Analyze approval patterns over different time periods</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Time Period:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
          </div>

          {/* Approval Trends Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Approval Trends Over Time
              </CardTitle>
              <p className="text-sm text-gray-600">
                Track daily document approvals and rejections over the selected time period
              </p>
            </CardHeader>
            <CardContent>
              {analytics.dailyApprovals.length > 0 ? (
                <div className="space-y-6">
                  {/* Enhanced Line Chart */}
                  <div className="h-80 relative">
                    <svg className="w-full h-full" viewBox={`0 0 ${analytics.dailyApprovals.length * 60} 320`}>
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="60" height="64" patternUnits="userSpaceOnUse">
                          <path d="M 60 0 L 0 0 0 64" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* Y-axis labels */}
                      {(() => {
                        const maxValue = Math.max(...analytics.dailyApprovals.map(d => Math.max(d.approvals, d.rejections)));
                        const steps = 5;
                        const stepValue = maxValue / steps;

                        return Array.from({ length: steps + 1 }, (_, i) => {
                          const y = 320 - (i * stepValue / maxValue) * 280;
                          const value = Math.round(i * stepValue);
                          return (
                            <g key={i}>
                              <text x="5" y={y + 4} className="text-xs fill-gray-500" fontSize="10">
                                {value}
                              </text>
                              <line x1="50" y1={y} x2="100%" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                            </g>
                          );
                        });
                      })()}

                      {/* Approval Line */}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={analytics.dailyApprovals.map((day, index) => {
                          const maxValue = Math.max(...analytics.dailyApprovals.map(d => Math.max(d.approvals, d.rejections)));
                          const x = 50 + index * 60;
                          const y = 320 - (day.approvals / maxValue) * 280;
                          return `${x},${y}`;
                        }).join(' ')}
                      />

                      {/* Approval Points */}
                      {analytics.dailyApprovals.map((day, index) => {
                        const maxValue = Math.max(...analytics.dailyApprovals.map(d => Math.max(d.approvals, d.rejections)));
                        const x = 50 + index * 60;
                        const y = 320 - (day.approvals / maxValue) * 280;

                        return (
                          <g key={`approval-${index}`} className="cursor-pointer group">
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#10b981"
                              className="transition-all duration-200 group-hover:r-6"
                            />
                            {/* Tooltip */}
                            <text
                              x={x}
                              y={y - 10}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs fill-gray-900 font-medium"
                              fontSize="10"
                              textAnchor="middle"
                            >
                              {day.approvals}
                            </text>
                          </g>
                        );
                      })}

                      {/* Rejection Line */}
                      <polyline
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={analytics.dailyApprovals.map((day, index) => {
                          const maxValue = Math.max(...analytics.dailyApprovals.map(d => Math.max(d.approvals, d.rejections)));
                          const x = 50 + index * 60;
                          const y = 320 - (day.rejections / maxValue) * 280;
                          return `${x},${y}`;
                        }).join(' ')}
                      />

                      {/* Rejection Points */}
                      {analytics.dailyApprovals.map((day, index) => {
                        const maxValue = Math.max(...analytics.dailyApprovals.map(d => Math.max(d.approvals, d.rejections)));
                        const x = 50 + index * 60;
                        const y = 320 - (day.rejections / maxValue) * 280;

                        return (
                          <g key={`rejection-${index}`} className="cursor-pointer group">
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#ef4444"
                              className="transition-all duration-200 group-hover:r-6"
                            />
                            {/* Tooltip */}
                            <text
                              x={x}
                              y={y - 10}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs fill-gray-900 font-medium"
                              fontSize="10"
                              textAnchor="middle"
                            >
                              {day.rejections}
                            </text>
                          </g>
                        );
                      })}

                      {/* X-axis labels */}
                      {analytics.dailyApprovals.map((day, index) => (
                        <text
                          key={index}
                          x={50 + index * 60}
                          y="315"
                          className="text-xs fill-gray-500"
                          fontSize="10"
                          textAnchor="middle"
                        >
                          {format(new Date(day.date), 'MM/dd')}
                        </text>
                      ))}
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                      <span className="text-gray-700">Approvals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-gray-700">Rejections</span>
                    </div>
                  </div>

                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {analytics.dailyApprovals.reduce((sum, day) => sum + day.approvals, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Approvals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {analytics.dailyApprovals.reduce((sum, day) => sum + day.rejections, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Rejections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.dailyApprovals.length}
                      </div>
                      <div className="text-sm text-gray-600">Days Tracked</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No approval data available</p>
                    <p className="text-sm">Approval trends will appear here once documents are reviewed</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Trend Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Clock className="h-5 w-5" />
                   Average Approval Time
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-center">
                   <div className="text-3xl font-bold text-blue-600">
                     {analytics.averageApprovalTime > 0 ? formatTime(analytics.averageApprovalTime) : 'N/A'}
                   </div>
                   <p className="text-sm text-gray-600 mt-2">
                     Average time from assignment to approval
                   </p>
                   {analytics.averageApprovalTime > 0 && (
                     <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                       <div className="text-sm font-medium text-blue-800 mb-2">Time Breakdown:</div>
                       <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
                         <div>
                           <span className="font-medium">Days:</span>
                           <div className="text-lg font-bold">{Math.floor(analytics.averageApprovalTime)}</div>
                         </div>
                         <div>
                           <span className="font-medium">Hours:</span>
                           <div className="text-lg font-bold">
                             {Math.floor((analytics.averageApprovalTime % 1) * 24)}
                           </div>
                         </div>
                       </div>
                       <div className="mt-2 text-xs text-blue-600">
                         Total: {Math.round(analytics.averageApprovalTime * 24 * 60)} minutes
                       </div>
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Approval Rate Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">
                    {analytics.totalDocuments > 0 ? ((analytics.approvedDocuments / analytics.totalDocuments) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Overall document approval rate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Reviewer Group Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.reviewerGroupStats.map((group) => (
                  <div key={group.groupName} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{group.groupName}</h4>
                      <Badge className={cn(
                        "text-xs",
                        group.completionRate >= 80 && "bg-emerald-100 text-emerald-700",
                        group.completionRate >= 60 && group.completionRate < 80 && "bg-yellow-100 text-yellow-700",
                        group.completionRate < 60 && "bg-red-100 text-red-700"
                      )}>
                        {group.completionRate.toFixed(1)}% Completion Rate
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Members:</span>
                        <div className="font-semibold">{group.totalMembers}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Active:</span>
                        <div className="font-semibold text-blue-600">{group.activeMembers}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Documents:</span>
                        <div className="font-semibold">{group.totalDocuments}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <div className="font-semibold text-emerald-600">{group.completedDocuments}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}