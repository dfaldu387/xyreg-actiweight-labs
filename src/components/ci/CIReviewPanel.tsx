import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertCircle, Calendar, User, Building } from 'lucide-react';

interface CIReviewPanelProps {
  ciInstance: {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: string;
    priority: string;
    assigned_to?: string;
    due_date?: string;
    created_at: string;
    instance_config: any;
  };
  onApprove: (ciId: string, comments?: string) => void;
  onReject: (ciId: string, comments: string) => void;
  onRequestChanges: (ciId: string, comments: string) => void;
}

export function CIReviewPanel({ 
  ciInstance, 
  onApprove, 
  onReject, 
  onRequestChanges 
}: CIReviewPanelProps) {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: 'approve' | 'reject' | 'changes') => {
    if ((action === 'reject' || action === 'changes') && !comments.trim()) {
      return; // Comments required for reject/changes
    }

    setIsSubmitting(true);
    try {
      switch (action) {
        case 'approve':
          await onApprove(ciInstance.id, comments.trim() || undefined);
          break;
        case 'reject':
          await onReject(ciInstance.id, comments.trim());
          break;
        case 'changes':
          await onRequestChanges(ciInstance.id, comments.trim());
          break;
      }
      setComments('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'in_progress': return 'outline';
      case 'pending': return 'secondary';
      case 'blocked': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* CI Instance Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{ciInstance.title}</CardTitle>
              <CardDescription className="mt-2">
                {ciInstance.description || 'No description provided'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={getPriorityColor(ciInstance.priority)}>
                {ciInstance.priority}
              </Badge>
              <Badge variant={getStatusColor(ciInstance.status)}>
                {ciInstance.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Type:</span> {ciInstance.type}
              </span>
            </div>
            
            {ciInstance.due_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Due:</span> {new Date(ciInstance.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Created:</span> {new Date(ciInstance.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Instance Configuration */}
          {ciInstance.instance_config && Object.keys(ciInstance.instance_config).length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Configuration Details</h4>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(ciInstance.instance_config, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Review Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Review Decision</CardTitle>
          <CardDescription>
            Please review the CI instance and provide your decision with any necessary comments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comments */}
          <div>
            <label htmlFor="comments" className="text-sm font-medium mb-2 block">
              Comments
            </label>
            <Textarea
              id="comments"
              placeholder="Enter your review comments here..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comments are required for rejection or change requests.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleAction('approve')}
              disabled={isSubmitting}
              className="flex items-center gap-2"
              variant="default"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
            
            <Button
              onClick={() => handleAction('changes')}
              disabled={isSubmitting || !comments.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Request Changes
            </Button>
            
            <Button
              onClick={() => handleAction('reject')}
              disabled={isSubmitting || !comments.trim()}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Approve:</strong> Mark the CI instance as completed and ready for the next phase.</p>
            <p><strong>Request Changes:</strong> Send back for modifications with specific feedback.</p>
            <p><strong>Reject:</strong> Cancel this CI instance entirely with justification.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}