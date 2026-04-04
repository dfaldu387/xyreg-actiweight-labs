import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, AlertCircle, Clock, FileText, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { PMSActivityTracking } from "@/hooks/usePMSActivities";
import { PMSStatusDropdown } from "./PMSStatusDropdown";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface PMSChecklistCardProps {
  activity: PMSActivityTracking;
  onUpdate: (updates: Partial<PMSActivityTracking>) => void;
  disabled?: boolean;
}

export function PMSChecklistCard({ activity, onUpdate, disabled = false }: PMSChecklistCardProps) {
  const { lang } = useTranslation();

  const getStatusIcon = () => {
    switch (activity.status) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (activity.status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleChecklistItemToggle = (index: number) => {
    const updatedItems = [...(activity.related_documents || [])];
    const wasCompleted = updatedItems[index]?.completed;
    updatedItems[index] = {
      ...updatedItems[index],
      completed: !wasCompleted
    };
    
    const completedCount = updatedItems.filter((item: any) => item.completed).length;
    const totalCount = updatedItems.length;
    const newPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    // If unchecking an item and activity was complete, reopen it
    let newStatus = activity.status;
    if (!wasCompleted) {
      // Checking an item
      if (newPercentage === 100 && activity.status === 'pending') {
        newStatus = 'complete';
      } else if (activity.status === 'pending') {
        newStatus = 'in_progress';
      }
    } else {
      // Unchecking an item
      if (activity.status === 'complete') {
        newStatus = 'in_progress';
        toast.info(lang('devicePMS.checklistCard.activityReopened'));
      }
    }
    
    const updates: Partial<PMSActivityTracking> = {
      related_documents: updatedItems,
      completion_percentage: newPercentage,
      status: newStatus
    };
    
    // Clear completion_date if reopening
    if (activity.status === 'complete' && newStatus !== 'complete') {
      updates.completion_date = null;
    }
    
    onUpdate(updates);
  };

  const handleStatusChange = (newStatus: PMSActivityTracking['status']) => {
    const updates: Partial<PMSActivityTracking> = { status: newStatus };
    
    // Set completion_date when marking complete
    if (newStatus === 'complete' && activity.status !== 'complete') {
      updates.completion_date = new Date().toISOString();
      updates.completion_percentage = 100;
    }
    
    // Clear completion_date when reopening
    if (activity.status === 'complete' && newStatus !== 'complete') {
      updates.completion_date = null;
    }
    
    onUpdate(updates);
  };

  const handleReopen = () => {
    onUpdate({
      status: 'in_progress',
      completion_date: null
    });
    toast.success(lang('devicePMS.checklistCard.activityReopenedSuccess'));
  };

  const completedItems = (activity.related_documents || []).filter((item: any) => item.completed).length;
  const totalItems = activity.related_documents?.length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <CardTitle className="text-lg">{activity.activity_name}</CardTitle>
              
              {activity.description && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {activity.description}
                </p>
              )}
              
              <CardDescription className="mt-1.5">
                {activity.market_code} {lang('devicePMS.checklistCard.market')}
                {activity.regulatory_reference && (
                  <> • {activity.regulatory_reference}</>
                )}
              </CardDescription>
            </div>
          </div>
          <PMSStatusDropdown
            activity={activity}
            onStatusChange={handleStatusChange}
            disabled={disabled}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        {totalItems > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{lang('devicePMS.checklistCard.progress')}</span>
              <span className="font-medium">{completedItems} / {totalItems}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Due Date */}
        {activity.due_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{lang('devicePMS.checklistCard.due')}:</span>
            <span className="font-medium">
              {format(new Date(activity.due_date), 'MMM dd, yyyy')}
            </span>
          </div>
        )}

        {/* Checklist Items */}
        {totalItems > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              {lang('devicePMS.checklistCard.checklistItems')}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activity.related_documents.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded hover:bg-accent/50 transition-colors">
                  <Checkbox
                    checked={item.completed || false}
                    onCheckedChange={() => handleChecklistItemToggle(index)}
                    disabled={disabled}
                  />
                  <span className="text-sm flex-1">{item.item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {activity.status === 'complete' && activity.completion_date && (
            <>
              <div className="text-sm text-muted-foreground flex items-center gap-2 flex-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {lang('devicePMS.checklistCard.completed')} {format(new Date(activity.completion_date), 'MMM dd, yyyy')}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReopen}
                className="gap-2"
                disabled={disabled}
              >
                <RotateCcw className="h-4 w-4" />
                {lang('devicePMS.checklistCard.reopen')}
              </Button>
            </>
          )}
        </div>

        {/* Notes */}
        {activity.notes && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            {activity.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
