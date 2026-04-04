import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, FileQuestion } from 'lucide-react';
import { NUB_STATUSES, NUB_PROCESS_STEPS, NUB_KEY_FACTS } from '@/utils/reimbursement/germanyNUBProcess';

export function NUBApplicationGuide() {
  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1:
        return <CheckCircle2 className="h-6 w-6 text-emerald-600" />;
      case 2:
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 3:
        return <FileQuestion className="h-6 w-6 text-blue-600" />;
      case 4:
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'bg-emerald-600';
      case 2:
        return 'bg-red-600';
      case 3:
        return 'bg-blue-600';
      case 4:
        return 'bg-yellow-600';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>{NUB_KEY_FACTS.title}</CardTitle>
          <Badge variant="outline" className="w-fit">{NUB_KEY_FACTS.subtitle}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{NUB_KEY_FACTS.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Key Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Target Setting: </span>
                  <span className="font-medium">{NUB_KEY_FACTS.targetSetting}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration: </span>
                  <span className="font-medium">{NUB_KEY_FACTS.duration}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Governing Body: </span>
                  <span className="font-medium">{NUB_KEY_FACTS.governingBody}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Annual Cycle: </span>
                  <span className="font-medium">{NUB_KEY_FACTS.annualCycle}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-2">Ideal For</h4>
              <ul className="space-y-1">
                {NUB_KEY_FACTS.idealFor.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NUB Statuses */}
      <div>
        <h3 className="text-lg font-semibold mb-4">NUB Status Outcomes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NUB_STATUSES.map((status) => (
            <Card key={status.status}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(status.status)}>Status {status.status}</Badge>
                      <CardTitle className="text-base">{status.name}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">{status.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Implications</h4>
                  <p className="text-xs text-muted-foreground">{status.implications}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Next Steps</h4>
                  <ul className="space-y-1">
                    {status.nextSteps.map((step, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Application Process */}
      <div>
        <h3 className="text-lg font-semibold mb-4">NUB Application Process</h3>
        <div className="space-y-4">
          {NUB_PROCESS_STEPS.map((step, idx) => (
            <Card key={step.step}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">{step.step}</Badge>
                  <div className="flex-1">
                    <CardTitle className="text-base mb-2">{step.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{step.timeline}</Badge>
                    <CardDescription className="mt-2">{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Key Actions</h4>
                  <ul className="space-y-1">
                    {step.keyActions.map((action, actionIdx) => (
                      <li key={actionIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {step.documents && step.documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Required Documents</h4>
                    <div className="space-y-1">
                      {step.documents.map((doc, docIdx) => (
                        <div key={docIdx} className="text-xs bg-secondary/30 rounded px-3 py-2">
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Annual NUB Cycle Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="w-24">Oct 31</Badge>
              <div className="text-sm">Application Deadline</div>
            </div>
            <div className="border-l-2 border-primary/20 ml-12 pl-4 py-2 space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-24">Dec - Mar</Badge>
                <div className="text-sm text-muted-foreground">InEK Evaluation Period</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-24">Mar/Apr</Badge>
                <div className="text-sm text-muted-foreground">Status Published</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-24">Apr - Dec</Badge>
                <div className="text-sm text-muted-foreground">Negotiations (Status 1)</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="w-24">Jan 1</Badge>
                <div className="text-sm">Agreement Year Begins</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
