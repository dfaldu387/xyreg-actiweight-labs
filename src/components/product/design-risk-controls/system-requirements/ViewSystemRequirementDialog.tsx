import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RequirementSpecification } from "@/components/product/design-risk-controls/requirement-specifications/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

interface ViewSystemRequirementDialogProps {
  requirement: RequirementSpecification;
  trigger: React.ReactNode;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Passed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Not Started':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'safety':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'performance':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'usability':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'environmental':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'compliance':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export function ViewSystemRequirementDialog({ requirement, trigger }: ViewSystemRequirementDialogProps) {
  const { lang } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{lang('systemRequirements.dialog.view.title')}</span>
            <Badge variant="outline" className="font-mono">
              {requirement.requirement_id}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Category */}
          <div className="flex items-center gap-3">
            {requirement.category && (
              <Badge
                variant="outline"
                className={getCategoryColor(requirement.category)}
              >
                {requirement.category}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={getStatusColor(requirement.verification_status)}
            >
              {requirement.verification_status}
            </Badge>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{lang('systemRequirements.form.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{requirement.description}</p>
            </CardContent>
          </Card>

          {/* Traces To */}
          {requirement.traces_to && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{lang('systemRequirements.form.tracesTo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{requirement.traces_to}</p>
              </CardContent>
            </Card>
          )}

          {/* Linked Risks */}
          {requirement.linked_risks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{lang('systemRequirements.form.linkedRisks')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{requirement.linked_risks}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{lang('systemRequirements.dialog.view.metadata')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">{lang('systemRequirements.table.created')}:</span>
                  <p className="text-muted-foreground">
                    {new Date(requirement.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">{lang('systemRequirements.dialog.view.lastUpdated')}:</span>
                  <p className="text-muted-foreground">
                    {new Date(requirement.updated_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">{lang('systemRequirements.dialog.view.module')}:</span>
                  <p className="text-muted-foreground">
                    {lang('systemRequirements.title')}
                  </p>
                </div>
                <div>
                  <span className="font-medium">{lang('systemRequirements.dialog.view.requirementId')}:</span>
                  <p className="text-muted-foreground font-mono">
                    {requirement.requirement_id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}