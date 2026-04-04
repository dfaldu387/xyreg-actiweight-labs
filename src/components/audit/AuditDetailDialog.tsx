
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, FileText, CheckCircle, AlertCircle, Download, Archive } from "lucide-react";
import { format } from "date-fns";
import { CompanyAudit, ProductAudit } from "@/types/audit";
import { AuditCompletionData } from "@/types/auditCompletion";
import { fetchAuditCompletionData, getDocumentDownloadUrl } from "@/services/auditCompletionService";

interface AuditDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: CompanyAudit | ProductAudit;
}

export function AuditDetailDialog({
  open,
  onOpenChange,
  audit
}: AuditDetailDialogProps) {
  const [completionData, setCompletionData] = useState<AuditCompletionData>({
    findings: [],
    recommendations: [],
    documents: []
  });
  const [loading, setLoading] = useState(false);

  const auditType = 'company_id' in audit ? 'company' : 'product';

  useEffect(() => {
    if (open && audit.status === 'Completed') {
      loadCompletionData();
    }
  }, [open, audit.id, audit.status]);

  const loadCompletionData = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditCompletionData(audit.id, auditType);
      setCompletionData(data);
    } catch (error) {
      // console.error('Error loading completion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (storagePath: string) => {
    const url = await getDocumentDownloadUrl(storagePath);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-500";
      case "Major": return "bg-orange-500";
      case "Minor": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Closed": return "text-green-600";
      case "Addressed": return "text-blue-600";
      case "Open": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "text-red-600";
      case "Medium": return "text-orange-600";
      case "Low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const getOverallAssessmentColor = (assessment?: string) => {
    switch (assessment) {
      case "Compliant": return "text-green-600 bg-green-100";
      case "Non-Compliant": return "text-red-600 bg-red-100";
      case "Compliant with Observations": return "text-orange-600 bg-orange-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  if (!audit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Audit Details & Report - {audit.audit_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Audit Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Audit Type</Label>
                  <p className="font-medium">{audit.audit_type}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className="bg-green-100 text-green-800">{audit.status}</Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Completion Date</Label>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {audit.completion_date ? format(new Date(audit.completion_date), "PPP") : "Not set"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Lead Auditor</Label>
                  <p className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {audit.lead_auditor_name || "Not specified"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Audit Duration</Label>
                  <p>{audit.actual_audit_duration || "Not specified"}</p>
                </div>
              </div>

              {audit.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm bg-muted p-3 rounded">{audit.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="summary" className="w-full">
            <TabsList>
              <TabsTrigger value="summary">Executive Summary</TabsTrigger>
              <TabsTrigger value="findings">Findings & Actions</TabsTrigger>
              <TabsTrigger value="documents">Documents & Evidence</TabsTrigger>
              <TabsTrigger value="closeout">Close-out Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Executive Summary</h4>
                    
                    {audit.executive_summary ? (
                      <div className="prose max-w-none text-sm">
                        <p className="whitespace-pre-wrap">{audit.executive_summary}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No executive summary provided.</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <Card className={cn("border-2", audit.overall_assessment ? getOverallAssessmentColor(audit.overall_assessment) : "border-gray-200")}>
                        <CardContent className="p-4 text-center">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                          <p className="font-semibold">{audit.overall_assessment || "Not Assessed"}</p>
                          <p className="text-sm">Overall Assessment</p>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-800 mb-1">{completionData.findings.length}</div>
                          <p className="font-semibold text-blue-800">Findings</p>
                          <p className="text-sm text-blue-600">
                            {completionData.findings.filter(f => f.status === 'Closed' || f.status === 'Addressed').length} Addressed
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-800 mb-1">{completionData.recommendations.length}</div>
                          <p className="font-semibold text-purple-800">Recommendations</p>
                          <p className="text-sm text-purple-600">For Improvement</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="findings" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Audit Findings & Corrective Actions</h4>
                      <Badge variant="secondary">{completionData.findings.length} findings</Badge>
                    </div>
                    
                    {completionData.findings.length > 0 ? (
                      <div className="space-y-3">
                        {completionData.findings.map((finding) => (
                          <Card key={finding.id} className="border-l-4" style={{ borderLeftColor: getSeverityColor(finding.severity) }}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-medium">{finding.description}</h5>
                                    <Badge variant="outline" className={`text-xs text-white ${getSeverityColor(finding.severity)}`}>
                                      {finding.severity}
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(finding.status)}`}>
                                      {finding.status}
                                    </Badge>
                                  </div>
                                  {finding.corrective_actions_taken && (
                                    <p className="text-sm text-muted-foreground">
                                      <strong>Corrective Actions:</strong> {finding.corrective_actions_taken}
                                    </p>
                                  )}
                                </div>
                                {(finding.status === "Closed" || finding.status === "Addressed") && (
                                  <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No findings recorded for this audit.</p>
                    )}

                    {completionData.recommendations.length > 0 && (
                      <>
                        <Separator className="my-6" />
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Recommendations</h4>
                          <Badge variant="secondary">{completionData.recommendations.length} recommendations</Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {completionData.recommendations.map((recommendation) => (
                            <Card key={recommendation.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-medium">{recommendation.description}</h5>
                                      <Badge variant="outline" className={`text-xs ${getPriorityColor(recommendation.priority)}`}>
                                        {recommendation.priority} Priority
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Audit Documents & Evidence</h4>
                      <Badge variant="secondary">{completionData.documents.length} documents</Badge>
                    </div>
                    
                    {completionData.documents.length > 0 ? (
                      <div className="space-y-3">
                        {completionData.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{doc.file_name}</p>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                  {doc.uploaded_at ? format(new Date(doc.uploaded_at), "PPP") : 'Unknown date'}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDownloadDocument(doc.storage_path)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No documents uploaded for this audit.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="closeout" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Close-out Actions</h4>
                    
                    {audit.close_out_actions_summary ? (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{audit.close_out_actions_summary}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No close-out actions summary provided.</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <Button className="h-auto p-4 justify-start">
                        <Download className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <p className="font-medium">Generate Final Report</p>
                          <p className="text-sm text-muted-foreground">Export comprehensive audit report</p>
                        </div>
                      </Button>
                      
                      <Button variant="outline" className="h-auto p-4 justify-start">
                        <Archive className="h-5 w-5 mr-3" />
                        <div className="text-left">
                          <p className="font-medium">Archive Audit</p>
                          <p className="text-sm text-muted-foreground">Move to archive with retention policy</p>
                        </div>
                      </Button>
                    </div>

                    <Separator />

                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Audit Completion Checklist</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>All findings documented and addressed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Evidence collected and stored</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Final report reviewed and approved</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Stakeholders notified of completion</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for labels
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>;
}

// Helper function for cn utility
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
