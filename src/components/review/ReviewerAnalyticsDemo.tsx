import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Users,
    CheckCircle,
    Clock,
    Target,
    TrendingUp,
    BarChart3,
    PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoAnalytics {
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

export function ReviewerAnalyticsDemo() {
    // Sample data for demonstration
    const demoData: DemoAnalytics = {
        totalReviewers: 12,
        activeReviewers: 8,
        totalDocuments: 45,
        approvedDocuments: 28,
        pendingDocuments: 12,
        rejectedDocuments: 5,
        averageApprovalTime: 2.5,
        reviewerPerformance: [
            {
                reviewerId: '1',
                reviewerName: 'Dr. Sarah Johnson',
                totalAssigned: 8,
                approved: 7,
                rejected: 1,
                pending: 0,
                averageTime: 1.8,
                approvalRate: 87.5
            },
            {
                reviewerId: '2',
                reviewerName: 'Prof. Michael Chen',
                totalAssigned: 6,
                approved: 5,
                rejected: 0,
                pending: 1,
                averageTime: 2.2,
                approvalRate: 83.3
            },
            {
                reviewerId: '3',
                reviewerName: 'Dr. Emily Rodriguez',
                totalAssigned: 7,
                approved: 6,
                rejected: 1,
                pending: 0,
                averageTime: 1.5,
                approvalRate: 85.7
            },
            {
                reviewerId: '4',
                reviewerName: 'Prof. David Kim',
                totalAssigned: 5,
                approved: 4,
                rejected: 1,
                pending: 0,
                averageTime: 3.1,
                approvalRate: 80.0
            }
        ],
        dailyApprovals: [
            { date: '2024-01-15', approvals: 3, rejections: 0 },
            { date: '2024-01-16', approvals: 2, rejections: 1 },
            { date: '2024-01-17', approvals: 4, rejections: 0 },
            { date: '2024-01-18', approvals: 1, rejections: 2 },
            { date: '2024-01-19', approvals: 3, rejections: 1 },
            { date: '2024-01-20', approvals: 2, rejections: 0 },
            { date: '2024-01-21', approvals: 5, rejections: 1 }
        ],
        documentStatusDistribution: [
            { status: 'Approved', count: 28, percentage: 62.2 },
            { status: 'Pending', count: 12, percentage: 26.7 },
            { status: 'Rejected', count: 5, percentage: 11.1 }
        ],
        reviewerGroupStats: [
            {
                groupName: 'Technical Review Team',
                totalMembers: 5,
                activeMembers: 4,
                totalDocuments: 20,
                completedDocuments: 16,
                completionRate: 80.0
            },
            {
                groupName: 'Regulatory Compliance',
                totalMembers: 4,
                activeMembers: 3,
                totalDocuments: 15,
                completedDocuments: 12,
                completionRate: 80.0
            },
            {
                groupName: 'Quality Assurance',
                totalMembers: 3,
                activeMembers: 1,
                totalDocuments: 10,
                completedDocuments: 0,
                completionRate: 0.0
            }
        ]
    };

    const formatTime = (days: number): string => {
        if (days < 1) {
            const hours = Math.round(days * 24);
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        return `${Math.round(days)} day${Math.round(days) !== 1 ? 's' : ''}`;
    };

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
                        <Badge variant="secondary" className="mt-2">
                            Demo Mode - Sample Data
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-gray-50 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Export Report
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
                        <div className="text-2xl font-bold text-blue-900">{demoData.totalReviewers}</div>
                        <p className="text-xs text-blue-600 mt-1">
                            {demoData.activeReviewers} active
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
                        <div className="text-2xl font-bold text-emerald-900">{demoData.approvedDocuments}</div>
                        <p className="text-xs text-emerald-600 mt-1">
                            {demoData.totalDocuments > 0 ? Math.round((demoData.approvedDocuments / demoData.totalDocuments) * 100) : 0}% of total
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
                        <div className="text-2xl font-bold text-orange-900">{demoData.pendingDocuments}</div>
                        <p className="text-xs text-orange-600 mt-1">
                            {demoData.totalDocuments > 0 ? Math.round((demoData.pendingDocuments / demoData.totalDocuments) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/60">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Avg Approval Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900">
                            {formatTime(demoData.averageApprovalTime)}
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                            Per document
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Analytics */}
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
                            {demoData.documentStatusDistribution.map((status) => (
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
                            {demoData.dailyApprovals.map((day) => (
                                <div key={day.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-medium">
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-emerald-600">
                                            <CheckCircle className="h-3 w-3" />
                                            <span className="text-sm">{day.approvals}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-red-600">
                                            <span className="text-sm">{day.rejections}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reviewer Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Top Reviewer Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {demoData.reviewerPerformance
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

            {/* Reviewer Groups */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Reviewer Group Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {demoData.reviewerGroupStats.map((group) => (
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
        </div>
    );
}