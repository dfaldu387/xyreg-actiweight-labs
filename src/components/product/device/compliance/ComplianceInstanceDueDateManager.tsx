
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useComplianceInstanceDueDates } from "@/hooks/useComplianceInstanceDueDates";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ComplianceInstanceDueDateManagerProps {
  productId?: string;
}

export function ComplianceInstanceDueDateManager({ productId }: ComplianceInstanceDueDateManagerProps) {
  const { 
    instances, 
    isLoading, 
    error, 
    updateDueDate, 
    getOverdueCount, 
    getUpcomingCount 
  } = useComplianceInstanceDueDates(productId);

  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  const handleDateChange = async (instanceId: string, date: Date | undefined) => {
    setSavingStates(prev => ({ ...prev, [instanceId]: true }));
    
    try {
      const dateString = date ? date.toISOString().split('T')[0] : null;
      await updateDueDate(instanceId, dateString);
    } finally {
      setSavingStates(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'partially_compliant': return 'bg-yellow-100 text-yellow-800';
      case 'not_applicable': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading compliance instances</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overdueCount = getOverdueCount();
  const upcomingCount = getUpcomingCount();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold">{instances.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Due This Week</p>
                <p className="text-2xl font-bold text-yellow-600">{upcomingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {instances.filter(i => i.status === 'compliant').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Instance Due Dates</CardTitle>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No compliance instances found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id} className={instance.isOverdue ? "bg-red-50" : ""}>
                    <TableCell className="max-w-md">
                      <div>
                        <p className="font-medium">{instance.requirement}</p>
                        {instance.clauseId && (
                          <p className="text-sm text-muted-foreground">{instance.clauseId}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{instance.framework}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(instance.status)}>
                        {instance.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(instance.priority)}>
                        {instance.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{instance.assignedTo || "Unassigned"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={instance.dueDate ? new Date(instance.dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleDateChange(instance.id, e.target.value ? new Date(e.target.value) : undefined)}
                          className="w-[180px]"
                        />
                        {instance.isOverdue && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {savingStates[instance.id] && (
                        <LoadingSpinner size="sm" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
