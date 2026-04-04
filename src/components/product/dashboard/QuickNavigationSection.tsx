
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Clock,
  Users,
  ArrowRight,
  Eye,
  Download
} from 'lucide-react';
import { Product } from '@/types/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface QuickNavigationSectionProps {
  product: Product;
}

export function QuickNavigationSection({ product }: QuickNavigationSectionProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  // Mock data for quick access items - in real implementation, this would come from hooks/services
  const quickAccessItems = [
    {
      type: 'document',
      title: 'Risk Management File v3.2',
      description: 'Needs immediate review and approval',
      urgency: 'high',
      action: 'Review',
      count: 1,
      route: `/app/product/${product.id}/documents`,
      icon: FileText
    },
    {
      type: 'approval',
      title: 'Pending Approvals',
      description: '3 documents awaiting your approval',
      urgency: 'medium',
      action: 'Approve',
      count: 3,
      route: `/app/product/${product.id}/approvals`,
      icon: CheckSquare
    },
    {
      type: 'deadline',
      title: 'Upcoming Deadlines',
      description: '5 items due within 7 days',
      urgency: 'medium',
      action: 'View',
      count: 5,
      route: `/app/product/${product.id}/calendar`,
      icon: Calendar
    },
    {
      type: 'overdue',
      title: 'Overdue Items',
      description: '2 critical items past due date',
      urgency: 'high',
      action: 'Review',
      count: 2,
      route: `/app/product/${product.id}/overdue`,
      icon: AlertTriangle
    }
  ];

  const commonActions = [
    {
      label: 'View Documents',
      icon: FileText,
      route: `/app/product/${product.id}/documents`,
      description: 'All device documentation'
    },
    {
      label: 'Gap Analysis',
      icon: AlertTriangle,
      route: `/app/product/${product.id}/gap-analysis`,
      description: 'Regulatory compliance gaps'
    },
    {
      label: 'Lifecycle Timeline',
      icon: Clock,
      route: `/app/product/${product.id}/lifecycle`,
      description: 'Phase progress and timeline'
    },
    {
      label: 'Team Assignments',
      icon: Users,
      route: `/app/product/${product.id}/team`,
      description: 'Task assignments and workload'
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Priority Items Requiring Attention */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {lang('quickNavigation.needsYourAttention')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickAccessItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{item.title}</h4>
                    <Badge className={getUrgencyColor(item.urgency)}>
                      {item.count}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleNavigation(item.route)}
                className="ml-2 shrink-0"
              >
                {item.action}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {lang('quickNavigation.quickActions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {commonActions.map((action, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <action.icon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{action.label}</h4>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigation(action.route)}
                className="ml-2 shrink-0"
              >
                <Eye className="h-3 w-3 mr-1" />
                {lang('quickNavigation.view')}
              </Button>
            </div>
          ))}

          {/* Bulk Actions */}
          <div className="pt-2 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="h-3 w-3 mr-1" />
                {lang('quickNavigation.exportData')}
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <FileText className="h-3 w-3 mr-1" />
                {lang('quickNavigation.generateReport')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
