
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, FileX, CheckCircle, ArrowRight } from 'lucide-react';
import { Product } from '@/types/client';
import { useTranslation } from '@/hooks/useTranslation';

interface EnhancedProductStatusSectionProps {
  product: Product;
}

export function EnhancedProductStatusSection({ product }: EnhancedProductStatusSectionProps) {
  const { lang } = useTranslation();

  // Mock specific issues for demonstration
  const statusDetails = {
    issues: [
      {
        type: 'overdue_document',
        title: 'Risk Assessment Document overdue by 5 days',
        severity: 'high',
        assignee: 'Dr. Sarah Johnson',
        action: 'Review & approve'
      },
      {
        type: 'missing_approval',
        title: 'Design Control Plan needs final approval',
        severity: 'medium',
        assignee: 'Mark Chen',
        action: 'Approve'
      },
      {
        type: 'approaching_deadline',
        title: 'Clinical Protocol due in 3 days',
        severity: 'medium',
        assignee: 'Lisa Wang',
        action: 'Submit'
      }
    ],
    blockers: [
      {
        title: 'Waiting for external lab results',
        impact: 'Blocks progression to next phase',
        expectedResolution: '2024-06-22'
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track': return 'bg-green-500';
      case 'At Risk': return 'bg-yellow-500';
      case 'Needs Attention': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <FileX className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'On Track': return lang('productStatus.onTrack');
      case 'At Risk': return lang('productStatus.atRisk');
      case 'Needs Attention': return lang('productStatus.needsAttention');
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{lang('productStatus.deviceStatusDetails')}</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(product.status || 'On Track')}`} />
            <Badge variant="outline" className="font-medium">
              {getStatusLabel(product.status || 'On Track')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{lang('productStatus.overallCompletion')}</span>
            <span className="text-muted-foreground">{product.progress || 0}%</span>
          </div>
          <Progress value={product.progress || 0} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {lang('productStatus.currentPhase')} {product.current_lifecycle_phase || lang('productStatus.notSpecified')}
          </p>
        </div>

        {/* Specific Issues */}
        {statusDetails.issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {lang('productStatus.issuesRequiringAction').replace('{{count}}', String(statusDetails.issues.length))}
            </h4>
            <div className="space-y-2">
              {statusDetails.issues.map((issue, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      {getSeverityIcon(issue.severity)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{issue.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lang('productStatus.assignedTo')} {issue.assignee}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="ml-2 shrink-0">
                      {issue.action}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blockers */}
        {statusDetails.blockers.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <FileX className="h-4 w-4 text-red-500" />
              {lang('productStatus.currentBlockers')}
            </h4>
            <div className="space-y-2">
              {statusDetails.blockers.map((blocker, index) => (
                <div key={index} className="p-3 rounded-lg border bg-red-50 border-red-200">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{blocker.title}</p>
                    <p className="text-xs text-muted-foreground">{blocker.impact}</p>
                    <p className="text-xs text-blue-600">
                      {lang('productStatus.expectedResolution')} {blocker.expectedResolution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
