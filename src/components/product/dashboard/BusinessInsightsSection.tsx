
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { Product } from '@/types/client';
import { useTranslation } from '@/hooks/useTranslation';

interface BusinessInsightsSectionProps {
  product: Product;
}

export function BusinessInsightsSection({ product }: BusinessInsightsSectionProps) {
  const { lang } = useTranslation();

  // Mock data for demonstration - in real implementation, this would come from hooks/services
  const upcomingMilestones = [
    {
      id: '1',
      title: 'Design Freeze Review',
      dueDate: '2024-06-20',
      daysLeft: 6,
      priority: 'high',
      phase: 'Design Controls'
    },
    {
      id: '2',
      title: 'Clinical Evaluation Report',
      dueDate: '2024-06-25',
      daysLeft: 11,
      priority: 'medium',
      phase: 'Clinical Evaluation'
    },
    {
      id: '3',
      title: 'Risk Management File Update',
      dueDate: '2024-07-01',
      daysLeft: 17,
      priority: 'low',
      phase: 'Risk Management'
    }
  ];

  const recentActivity = [
    {
      id: '1',
      action: 'Document approved',
      document: 'Design History File v2.1',
      user: 'Dr. Sarah Johnson',
      timestamp: '2 hours ago',
      type: 'approval'
    },
    {
      id: '2',
      action: 'Phase transition',
      document: 'Moved to Verification & Validation',
      user: 'System',
      timestamp: '1 day ago',
      type: 'transition'
    },
    {
      id: '3',
      action: 'New submission',
      document: 'Clinical Protocol Amendment',
      user: 'Mark Chen',
      timestamp: '2 days ago',
      type: 'submission'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approval': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'transition': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'submission': return <Users className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Upcoming Milestones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {lang('businessInsights.upcomingMilestones')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingMilestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{milestone.title}</h4>
                  <Badge className={getPriorityColor(milestone.priority)}>
                    {milestone.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{milestone.phase}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {lang('businessInsights.daysLeft').replace('{{count}}', String(milestone.daysLeft))}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="ml-2">
                {lang('businessInsights.view')}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {lang('businessInsights.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{activity.action}</span>
                </div>
                <p className="text-sm text-gray-700 truncate">{activity.document}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.user}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
