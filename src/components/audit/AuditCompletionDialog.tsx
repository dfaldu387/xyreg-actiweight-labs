import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash, Download } from "lucide-react";
import { format } from "date-fns";
import { CompanyAudit, ProductAudit } from "@/types/audit";
import { 
  AuditCompletionData, 
  AuditFinding, 
  AuditRecommendation,
  AuditOverallAssessment,
  AuditFindingSeverity,
  AuditFindingStatus,
  AuditRecommendationPriority
} from "@/types/auditCompletion";
import {
  fetchAuditCompletionData,
  createAuditFinding,
  updateAuditFinding,
  deleteAuditFinding,
  createAuditRecommendation,
  updateAuditRecommendation,
  deleteAuditRecommendation,
  uploadAuditDocument,
  deleteAuditDocument,
  getDocumentDownloadUrl
} from "@/services/auditCompletionService";
import { Card, CardContent } from "@/components/ui/card";

interface AuditCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: CompanyAudit | ProductAudit;
  auditType: 'company' | 'product';
  onComplete: (completionData: Partial<CompanyAudit | ProductAudit>) => Promise<void>;
}

export function AuditCompletionDialog({
  open,
  onOpenChange,
  audit,
  auditType,
  onComplete
}: AuditCompletionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [completionData, setCompletionData] = useState<AuditCompletionData>({
    findings: [],
    recommendations: [],
    documents: []
  });
  
  // Basic completion fields
  const [completionDate, setCompletionDate] = useState<Date | undefined>(
    audit.completion_date ? new Date(audit.completion_date) : new Date()
  );
  const [leadAuditorName, setLeadAuditorName] = useState(audit.lead_auditor_name || '');
  const [actualDuration, setActualDuration] = useState(audit.actual_audit_duration || '');
  const [executiveSummary, setExecutiveSummary] = useState(audit.executive_summary || '');
  const [overallAssessment, setOverallAssessment] = useState<AuditOverallAssessment | ''>(
    (audit.overall_assessment as AuditOverallAssessment) || ''
  );
  const [closeOutActions, setCloseOutActions] = useState(audit.close_out_actions_summary || '');

  // Load completion data when dialog opens
  useEffect(() => {
    if (open && audit.id) {
      loadCompletionData();
    }
  }, [open, audit.id]);

  const loadCompletionData = async () => {
    const data = await fetchAuditCompletionData(audit.id, auditType);
    setCompletionData(data);
  };

  const handleAddFinding = async () => {
    const newFinding: Omit<AuditFinding, 'id' | 'created_at' | 'updated_at'> = {
      audit_id: audit.id,
      audit_type: auditType,
      description: '',
      severity: 'Minor',
      status: 'Open'
    };

    const created = await createAuditFinding(newFinding);
    if (created) {
      setCompletionData(prev => ({
        ...prev,
        findings: [...prev.findings, created]
      }));
    }
  };

  const handleUpdateFinding = async (id: string, updates: Partial<AuditFinding>) => {
    const updated = await updateAuditFinding(id, updates);
    if (updated) {
      setCompletionData(prev => ({
        ...prev,
        findings: prev.findings.map(f => f.id === id ? updated : f)
      }));
    }
  };

  const handleDeleteFinding = async (id: string) => {
    const success = await deleteAuditFinding(id);
    if (success) {
      setCompletionData(prev => ({
        ...prev,
        findings: prev.findings.filter(f => f.id !== id)
      }));
    }
  };

  const handleAddRecommendation = async () => {
    const newRecommendation: Omit<AuditRecommendation, 'id' | 'created_at' | 'updated_at'> = {
      audit_id: audit.id,
      audit_type: auditType,
      description: '',
      priority: 'Medium'
    };

    const created = await createAuditRecommendation(newRecommendation);
    if (created) {
      setCompletionData(prev => ({
        ...prev,
        recommendations: [...prev.recommendations, created]
      }));
    }
  };

  const handleUpdateRecommendation = async (id: string, updates: Partial<AuditRecommendation>) => {
    const updated = await updateAuditRecommendation(id, updates);
    if (updated) {
      setCompletionData(prev => ({
        ...prev,
        recommendations: prev.recommendations.map(r => r.id === id ? updated : r)
      }));
    }
  };

  const handleDeleteRecommendation = async (id: string) => {
    const success = await deleteAuditRecommendation(id);
    if (success) {
      setCompletionData(prev => ({
        ...prev,
        recommendations: prev.recommendations.filter(r => r.id !== id)
      }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploaded = await uploadAuditDocument(file, audit.id, auditType);
    if (uploaded) {
      setCompletionData(prev => ({
        ...prev,
        documents: [uploaded, ...prev.documents]
      }));
    }
  };

  const handleDeleteDocument = async (id: string, storagePath: string) => {
    const success = await deleteAuditDocument(id, storagePath);
    if (success) {
      setCompletionData(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== id)
      }));
    }
  };

  const handleDownloadDocument = async (storagePath: string) => {
    const url = await getDocumentDownloadUrl(storagePath);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const completionUpdate = {
        status: 'Completed' as const,
        completion_date: completionDate?.toISOString().split('T')[0],
        lead_auditor_name: leadAuditorName,
        actual_audit_duration: actualDuration,
        executive_summary: executiveSummary,
        overall_assessment: overallAssessment,
        close_out_actions_summary: closeOutActions
      };

      await onComplete(completionUpdate);
      onOpenChange(false);
    } catch (error) {
      // console.error('Error completing audit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Audit - {audit.audit_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="summary">Executive Summary</TabsTrigger>
            <TabsTrigger value="findings">Findings & Recommendations</TabsTrigger>
            <TabsTrigger value="documents">Documents & Evidence</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Completion Date</Label>
                <input
                  type="date"
                  value={completionDate ? completionDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                    setCompletionDate(dateValue);
                  }}
                  className="w-full border border-foreground/15 rounded-md p-2"
                />
              </div>

              <div className="space-y-2">
                <Label>Lead Auditor</Label>
                <Input
                  value={leadAuditorName}
                  onChange={(e) => setLeadAuditorName(e.target.value)}
                  placeholder="Enter lead auditor name"
                />
              </div>

              <div className="space-y-2">
                <Label>Actual Audit Duration</Label>
                <Input
                  value={actualDuration}
                  onChange={(e) => setActualDuration(e.target.value)}
                  placeholder="e.g., 2 days (16 hours)"
                />
              </div>

              <div className="space-y-2">
                <Label>Overall Assessment</Label>
                <Select value={overallAssessment} onValueChange={(value) => setOverallAssessment(value as AuditOverallAssessment)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Compliant">Compliant</SelectItem>
                    <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                    <SelectItem value="Compliant with Observations">Compliant with Observations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Close-out Actions Summary</Label>
              <Textarea
                value={closeOutActions}
                onChange={(e) => setCloseOutActions(e.target.value)}
                placeholder="Summarize final close-out activities and verifications"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="space-y-2">
              <Label>Executive Summary</Label>
              <Textarea
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                placeholder="Provide a comprehensive executive summary of the audit..."
                rows={12}
              />
            </div>
          </TabsContent>

          <TabsContent value="findings" className="space-y-6">
            {/* Findings Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Findings</h3>
                <Button onClick={handleAddFinding} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Finding
                </Button>
              </div>

              {completionData.findings.map((finding) => (
                <Card key={finding.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <Textarea
                          value={finding.description}
                          onChange={(e) => finding.id && handleUpdateFinding(finding.id, { description: e.target.value })}
                          placeholder="Describe the finding..."
                          rows={2}
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Select 
                            value={finding.severity} 
                            onValueChange={(value) => finding.id && handleUpdateFinding(finding.id, { severity: value as AuditFindingSeverity })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Minor">Minor</SelectItem>
                              <SelectItem value="Major">Major</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select 
                            value={finding.status} 
                            onValueChange={(value) => finding.id && handleUpdateFinding(finding.id, { status: value as AuditFindingStatus })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="Addressed">Addressed</SelectItem>
                              <SelectItem value="CAPA Raised">CAPA Raised</SelectItem>
                              <SelectItem value="Pending Action">Pending Action</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Textarea
                          value={finding.corrective_actions_taken || ''}
                          onChange={(e) => finding.id && handleUpdateFinding(finding.id, { corrective_actions_taken: e.target.value })}
                          placeholder="Corrective actions taken..."
                          rows={2}
                        />
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => finding.id && handleDeleteFinding(finding.id)}
                        className="ml-2"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Recommendations</h3>
                <Button onClick={handleAddRecommendation} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recommendation
                </Button>
              </div>

              {completionData.recommendations.map((recommendation) => (
                <Card key={recommendation.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <Textarea
                          value={recommendation.description}
                          onChange={(e) => recommendation.id && handleUpdateRecommendation(recommendation.id, { description: e.target.value })}
                          placeholder="Describe the recommendation..."
                          rows={2}
                        />
                        
                        <Select 
                          value={recommendation.priority} 
                          onValueChange={(value) => recommendation.id && handleUpdateRecommendation(recommendation.id, { priority: value as AuditRecommendationPriority })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => recommendation.id && handleDeleteRecommendation(recommendation.id)}
                        className="ml-2"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documents & Evidence</h3>
                <div>
                  <input
                    type="file"
                    id="document-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                  />
                  <Button asChild size="sm">
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Document
                    </label>
                  </Button>
                </div>
              </div>

              {completionData.documents.map((document) => (
                <Card key={document.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{document.file_name}</p>
                        {document.description && (
                          <p className="text-sm text-muted-foreground">{document.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Uploaded {document.uploaded_at ? format(new Date(document.uploaded_at), "PPP") : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadDocument(document.storage_path)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => document.id && handleDeleteDocument(document.id, document.storage_path)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {completionData.documents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No documents uploaded yet. Upload audit reports, evidence, and supporting documentation.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={loading}>
            {loading ? "Completing..." : "Complete Audit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
