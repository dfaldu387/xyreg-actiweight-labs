import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, BarChart3, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface VVReportsModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function VVReportsModule({ productId, companyId, disabled = false }: VVReportsModuleProps) {
  const { lang } = useTranslation();

  const handleGenerateReport = (reportType: string) => {
    if (disabled) return;
    toast.info(lang('verificationValidation.reports.reportGenerationComingSoon', { reportType }));
  };

  const reportTypes = [
    {
      id: 'verification-summary',
      title: lang('verificationValidation.reports.verificationSummaryReport'),
      description: lang('verificationValidation.reports.verificationSummaryDescription'),
      icon: CheckCircle2,
      color: 'default' as const
    },
    {
      id: 'validation-summary',
      title: lang('verificationValidation.reports.validationSummaryReport'),
      description: lang('verificationValidation.reports.validationSummaryDescription'),
      icon: CheckCircle2,
      color: 'default' as const
    },
    {
      id: 'test-execution-report',
      title: lang('verificationValidation.reports.testExecutionReport'),
      description: lang('verificationValidation.reports.testExecutionDescription'),
      icon: BarChart3,
      color: 'outline' as const
    },
    {
      id: 'defect-analysis',
      title: lang('verificationValidation.reports.defectAnalysisReport'),
      description: lang('verificationValidation.reports.defectAnalysisDescription'),
      icon: TrendingUp,
      color: 'outline' as const
    },
    {
      id: 'traceability-matrix',
      title: lang('verificationValidation.reports.traceabilityMatrixReport'),
      description: lang('verificationValidation.reports.traceabilityMatrixDescription'),
      icon: FileText,
      color: 'secondary' as const
    },
    {
      id: 'regulatory-compliance',
      title: lang('verificationValidation.reports.regulatoryComplianceReport'),
      description: lang('verificationValidation.reports.regulatoryComplianceDescription'),
      icon: AlertCircle,
      color: 'secondary' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{lang('verificationValidation.reports.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {lang('verificationValidation.reports.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <CardDescription className="text-sm">{report.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={report.color}>
                    {lang('verificationValidation.reports.ready')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReport(report.title)}
                    disabled={disabled}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {lang('verificationValidation.reports.generate')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReport(`${report.title} PDF`)}
                    disabled={disabled}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {lang('verificationValidation.reports.exportPdf')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">{lang('verificationValidation.reports.reportFeatures')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('verificationValidation.reports.automatedGeneration')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {lang('verificationValidation.reports.realTimeDataCompilation')}</li>
                <li>• {lang('verificationValidation.reports.regulatoryTemplateCompliance')}</li>
                <li>• {lang('verificationValidation.reports.interactiveChartsAndMetrics')}</li>
                <li>• {lang('verificationValidation.reports.versionControlAndAuditTrails')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('verificationValidation.reports.exportOptions')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {lang('verificationValidation.reports.pdfForRegulatorySubmissions')}</li>
                <li>• {lang('verificationValidation.reports.excelForDataAnalysis')}</li>
                <li>• {lang('verificationValidation.reports.htmlForWebViewing')}</li>
                <li>• {lang('verificationValidation.reports.customFormattingOptions')}</li>
              </ul>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>{lang('verificationValidation.reports.note')}:</strong> {lang('verificationValidation.reports.noteContent')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{lang('verificationValidation.reports.reportMetricsDashboard')}</CardTitle>
          <CardDescription>{lang('verificationValidation.reports.keyMetricsAtAGlance')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">--</div>
              <div className="text-sm text-muted-foreground">{lang('verificationValidation.reports.testCases')}</div>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">--</div>
              <div className="text-sm text-muted-foreground">{lang('verificationValidation.reports.passRate')}</div>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">--</div>
              <div className="text-sm text-muted-foreground">{lang('verificationValidation.reports.openDefects')}</div>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">--</div>
              <div className="text-sm text-muted-foreground">{lang('verificationValidation.reports.coverage')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
