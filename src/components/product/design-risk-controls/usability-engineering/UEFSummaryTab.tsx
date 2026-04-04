import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  FileText, 
  Users, 
  MapPin, 
  AlertTriangle, 
  ClipboardCheck,
  BarChart3,
  Download,
  Clock
} from "lucide-react";
import { UsabilityEngineeringFile } from "@/services/usabilityEngineeringService";
import { format } from "date-fns";
import { toast } from "sonner";

interface UEFSummaryTabProps {
  uef: UsabilityEngineeringFile;
  productId: string;
  companyId: string;
  disabled?: boolean;
}

interface ComplianceItem {
  clause: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ElementType;
}

export function UEFSummaryTab({ uef, productId, companyId, disabled }: UEFSummaryTabProps) {
  // Calculate compliance status
  const complianceItems: ComplianceItem[] = [
    {
      clause: '5.1',
      title: 'Use Specification',
      description: 'Intended use, users, and environments defined',
      completed: !!(uef.intended_use && uef.intended_users?.length > 0),
      icon: FileText,
    },
    {
      clause: '5.2',
      title: 'User Interface Characteristics',
      description: 'UI features and safety relevance identified',
      completed: (uef.ui_characteristics?.length || 0) > 0,
      icon: Users,
    },
    {
      clause: '5.3',
      title: 'Hazard-Related Use Scenarios',
      description: 'Use scenarios that could lead to harm identified',
      completed: true, // This would need to be linked to hazards count
      icon: AlertTriangle,
    },
    {
      clause: '5.5',
      title: 'Usability Evaluation Plan',
      description: 'Formative and summative evaluation strategies defined',
      completed: !!(uef.formative_plan && uef.summative_plan),
      icon: ClipboardCheck,
    },
    {
      clause: '5.6',
      title: 'User Interface Specification',
      description: 'UI requirements and design specifications documented',
      completed: !!uef.ui_specification,
      icon: MapPin,
    },
    {
      clause: '5.7/5.9',
      title: 'Usability Evaluation Results',
      description: 'Formative and summative evaluation results documented',
      completed: false, // Would need to check for completed test cases
      icon: BarChart3,
    },
  ];

  const completedCount = complianceItems.filter(item => item.completed).length;
  const totalCount = complianceItems.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const handleExportUEF = () => {
    toast.info('UEF export functionality coming soon');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usability Engineering File Summary</h3>
          <p className="text-sm text-muted-foreground">
            Overview of IEC 62366-1 compliance status and documentation
          </p>
        </div>
        <Button variant="outline" onClick={handleExportUEF} disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          Export UEF
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Document Status</p>
                <div className="mt-1">{getStatusBadge(uef.status)}</div>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="text-2xl font-bold">{uef.version}</p>
              </div>
              <Badge variant="outline">Current</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-lg font-medium">
                  {format(new Date(uef.updated_at), 'MMM d, yyyy')}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>IEC 62366-1 Compliance Checklist</CardTitle>
              <CardDescription>
                Track completion of required usability engineering activities
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{completionPercentage}%</p>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {totalCount} complete
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-4">
            {complianceItems.map((item) => (
              <div 
                key={item.clause} 
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  item.completed ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  item.completed ? 'bg-green-100' : 'bg-muted'
                }`}>
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      Clause {item.clause}
                    </Badge>
                    <h4 className="font-medium">{item.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
                <item.icon className={`h-5 w-5 ${
                  item.completed ? 'text-green-600' : 'text-muted-foreground'
                }`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{uef.intended_users?.length || 0}</p>
            <p className="text-sm text-muted-foreground">User Profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{uef.use_environments?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Use Environments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{uef.ui_characteristics?.length || 0}</p>
            <p className="text-sm text-muted-foreground">UI Characteristics</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ClipboardCheck className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">
              {(uef.formative_plan ? 1 : 0) + (uef.summative_plan ? 1 : 0)}
            </p>
            <p className="text-sm text-muted-foreground">Evaluation Plans</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
