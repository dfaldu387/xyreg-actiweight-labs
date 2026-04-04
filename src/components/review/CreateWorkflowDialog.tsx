
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { ReviewerGroupSelectorMultiple } from '../product/ReviewerGroupSelectorMultiple';
import { useReviewWorkflows } from '@/hooks/useReviewWorkflows';
import { toast } from 'sonner';
import type { ReviewRecordType, CreateWorkflowRequest } from '@/types/review';
import { DatePicker } from '@/components/ui/date-picker';

interface CreateWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordType: ReviewRecordType;
  recordId: string;
  recordName?: string;
  companyId: string;
  onWorkflowCreated: () => void;
  preSelectedGroups?: string[];
}

interface WorkflowStage {
  stage_name: string;
  stage_description: string;
  reviewer_groups: string[];
  required_approvals: number;
}

export function CreateWorkflowDialog({
  open,
  onOpenChange,
  recordType,
  recordId,
  recordName,
  companyId,
  onWorkflowCreated,
  preSelectedGroups = []
}: CreateWorkflowDialogProps) {
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [stages, setStages] = useState<WorkflowStage[]>([
    {
      stage_name: 'Internal Review',
      stage_description: 'Initial internal team review',
      reviewer_groups: preSelectedGroups,
      required_approvals: 1
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createWorkflow } = useReviewWorkflows();

  // Update stages when preSelectedGroups changes
  useEffect(() => {
    if (preSelectedGroups.length > 0) {
      setStages([
        {
          stage_name: 'Internal Review',
          stage_description: 'Initial internal team review',
          reviewer_groups: preSelectedGroups,
          required_approvals: 1
        }
      ]);
    }
  }, [preSelectedGroups]);

  const addStage = () => {
    setStages([
      ...stages,
      {
        stage_name: `Stage ${stages.length + 1}`,
        stage_description: '',
        reviewer_groups: [],
        required_approvals: 1
      }
    ]);
  };

  const removeStage = (index: number) => {
    if (stages.length > 1) {
      setStages(stages.filter((_, i) => i !== index));
    }
  };

  const updateStage = (index: number, field: keyof WorkflowStage, value: any) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setStages(updatedStages);
  };

  const handleSubmit = async () => {
    // if (!workflowName.trim()) {
    //   toast.error('Please enter a workflow name');
    //   return;
    // }

    // // Validate that all stages have at least one reviewer group
    // const invalidStages = stages.filter(stage => stage.reviewer_groups.length === 0);
    // if (invalidStages.length > 0) {
    //   toast.error('All stages must have at least one reviewer group assigned');
    //   return;
    // }

    setIsSubmitting(true);
    try {
      console.log('Creating workflow with data:', {
        record_type: recordType,
        record_id: recordId,
        workflow_name: workflowName.trim(),
        workflow_description: workflowDescription.trim() || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        stages: stages
      });

      const request: CreateWorkflowRequest = {
        record_type: recordType,
        record_id: recordId,
        workflow_name: workflowName.trim(),
        workflow_description: workflowDescription.trim() || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        stages: stages
      };

      const workflowId = await createWorkflow(request);

      if (workflowId) {
        console.log('Workflow created successfully with ID:', workflowId);
        toast.success('Review workflow created successfully');

        // Reset form
        resetForm();

        // Close dialog
        onOpenChange(false);

        // Notify parent component
        onWorkflowCreated();
      } else {
        console.error('Failed to create workflow - no ID returned');
        toast.error('Failed to create review workflow');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create review workflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setDueDate('');
    setStages([
      {
        stage_name: 'Internal Review',
        stage_description: 'Initial internal team review',
        reviewer_groups: preSelectedGroups,
        required_approvals: 1
      }
    ]);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Only allow closing if not currently submitting
      onOpenChange(false);
    }
  };

  const getRecordTypeLabel = () => {
    switch (recordType) {
      case 'document': return 'Document';
      case 'gap_analysis_item': return 'Gap Analysis Item';
      case 'audit': return 'Audit';
      default: return 'Record';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Review Workflow</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Set up a multi-stage review process for {getRecordTypeLabel().toLowerCase()}: {recordName || recordId}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            {/* <div>
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g., Standard Document Review"
                disabled={isSubmitting}
              />
            </div> */}

            {/* <div>
              <Label htmlFor="workflow-description">Description (Optional)</Label>
              <Textarea
                id="workflow-description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe the purpose and scope of this review workflow"
                rows={3}
                disabled={isSubmitting}
              />
            </div> */}

            <div>
              {/* <Label htmlFor="workflow-due-date">Due Date (Optional)</Label> */}
              {/* <DatePicker
                date={dueDate ? new Date(dueDate) : undefined}
                setDate={date => setDueDate(date ? date.toISOString().slice(0, 10) : '')}
                placeholder="Select due date"
                // side="bottom"
              /> */}
            </div>
          </div>

          {/* Review Stages */}
          <div className="space-y-4">
            {/* <div className="flex items-center justify-between">
              <Label>Review Stages</Label>
              <Button
                onClick={addStage}
                variant="outline"
                size="sm"
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stage
              </Button>
            </div> */}
            <div>
              <Label>Reviewer Groups</Label>
              <ReviewerGroupSelectorMultiple
                selectedGroups={stages[0].reviewer_groups}
                onGroupsChange={(groups) => updateStage(0, 'reviewer_groups', groups)}
                companyId={companyId}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleDialogOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={stages[0].reviewer_groups.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
