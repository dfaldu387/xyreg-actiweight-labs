
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ReviewWorkflow } from '@/types/review';

interface WorkflowListProps {
  workflows: ReviewWorkflow[];
  showProgress?: boolean;
  onViewWorkflow?: (workflow: ReviewWorkflow) => void;
}

export function WorkflowList({ workflows, showProgress = false, onViewWorkflow }: WorkflowListProps) {
  console.log('workflows', workflows)
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'changes_requested':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'in_review':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'changes_requested': return 'bg-yellow-500';
      case 'in_review': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200 mr-2';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 mr-2';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200 mr-2';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200 mr-2';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 mr-2';
    }
  };

  const calculateProgress = (workflow: ReviewWorkflow) => {
    if (!showProgress) return 0;
    return (workflow.current_stage / workflow.total_stages) * 100;
  };

  if (workflows.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-muted-foreground">No workflows found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workflows.map((workflow) => (
        <Card key={workflow.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mt-5">
              <div className="flex-1">
                {/* <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(workflow.overall_status)}
                  <h3 className="font-semibold whitespace-nowrap">{workflow.workflow_name}</h3>
                </div> */}
                {/* {workflow.workflow_description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {workflow.workflow_description}
                  </p>
                )} */}
                <Badge className={getPriorityColor(workflow.priority)}>
                  {workflow.priority}
                </Badge>
                <Badge className={getStatusColor(workflow.overall_status)}>
                  {workflow.overall_status.replace('_', ' ')}
                </Badge>

                <div className="flex items-start mt-5 flex-col gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Stage {workflow.current_stage} of {workflow.total_stages}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created {formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {workflow.due_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        Due {formatDistanceToNow(new Date(workflow.due_date), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>

                {showProgress && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(calculateProgress(workflow))}% complete</span>
                    </div>
                    <Progress value={calculateProgress(workflow)} className="h-2" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">


                {onViewWorkflow && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewWorkflow(workflow)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
