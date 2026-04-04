import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Upload, ExternalLink, Calendar, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SupplierEvaluationWizard } from './SupplierEvaluationWizard';
import { SupplierCriticalityRationalePanel } from './SupplierCriticalityRationalePanel';
import { SupplierEvaluationDocumentService } from '@/services/supplierEvaluationDocumentService';
import { SupplierAuditService } from '@/services/supplierAuditService';
import type { SupplierEvaluationDocument } from '@/types/supplier';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface SupplierEvaluationTabProps {
  supplierId: string;
  companyId: string;
  supplierName?: string;
  supplierCriticality?: 'Critical' | 'Non-Critical';
  scopeOfSupply?: string;
  supplierStatus?: 'Approved' | 'Probationary' | 'Disqualified';
  probationaryReason?: string;
  onProbationaryReasonChange?: (reason: string) => void;
  nextScheduledAudit?: string;
  auditInterval?: string;
  onNextScheduledAuditChange?: (date: string) => void;
  onAuditIntervalChange?: (interval: string) => void;
  isEditMode?: boolean;
  onEvaluationComplete?: () => void;
}

export function SupplierEvaluationTab({
  supplierId,
  companyId,
  supplierName,
  supplierCriticality,
  scopeOfSupply,
  supplierStatus,
  probationaryReason,
  onProbationaryReasonChange,
  nextScheduledAudit,
  auditInterval,
  onNextScheduledAuditChange,
  onAuditIntervalChange,
  isEditMode = false,
  onEvaluationComplete
}: SupplierEvaluationTabProps) {
  const { lang } = useTranslation();
  const [showEvaluationWizard, setShowEvaluationWizard] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [auditDate, setAuditDate] = useState<Date | undefined>();
  const [documentData, setDocumentData] = useState({
    document_name: '',
    document_type: 'CI_Issue' as const,
    description: '',
    file_url: '',
    related_checklist_item: ''
  });

  const queryClient = useQueryClient();
  
  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['supplier-evaluation-documents', supplierId],
    queryFn: () => SupplierEvaluationDocumentService.getDocuments(supplierId),
  });
  
  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: (data: Omit<SupplierEvaluationDocument, 'id' | 'created_at' | 'updated_at'>) =>
      SupplierEvaluationDocumentService.createDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-evaluation-documents', supplierId] });
      toast.success(lang('supplier.documentAddedSuccess'));
      setShowDocumentDialog(false);
      setDocumentData({
        document_name: '',
        document_type: 'CI_Issue' as const,
        description: '',
        file_url: '',
        related_checklist_item: ''
      });
    },
    onError: () => {
      toast.error(lang('supplier.documentAddFailed'));
    }
  });

  // Create audit mutation
  const createAuditMutation = useMutation({
    mutationFn: (auditDate: string) =>
      SupplierAuditService.createSupplierAudit({
        supplierId,
        companyId,
        auditDate,
        auditType: 'Supplier Evaluation Audit',
        notes: 'CI Audit scheduled from supplier evaluation'
      }),
    onSuccess: () => {
      toast.success(lang('supplier.auditScheduledSuccess'));
      setShowAuditDialog(false);
      setAuditDate(undefined);
    },
    onError: () => {
      toast.error(lang('supplier.auditScheduleFailed'));
    }
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: () => SupplierAuditService.generateSupplierReport(supplierId),
    onSuccess: () => {
      toast.success(lang('supplier.reportGeneratedSuccess'));
      // In a real app, this would trigger a download or open the report
    },
    onError: () => {
      toast.error(lang('supplier.reportGenerateFailed'));
    }
  });
  
  // Mock evaluation data - in real app this would come from API
  const evaluationStatus = {
    lastEvaluation: '2024-01-15',
    status: 'In Progress',
    completionPercentage: 75,
    evaluator: 'John Smith'
  };

  const handleAddDocument = () => {
    if (!documentData.document_name.trim()) {
      toast.error(lang('supplier.documentNameRequired'));
      return;
    }
    
    createDocumentMutation.mutate({
      supplier_id: supplierId,
      document_name: documentData.document_name,
      document_type: documentData.document_type,
      description: documentData.description,
      file_url: documentData.file_url || undefined,
    });
  };

  const handleEvaluationComplete = () => {
    setShowEvaluationWizard(false);
    onEvaluationComplete?.();
  };

  return (
    <div className="space-y-6">
      {/* QMSR Risk-Based Rationale Panel */}
      {supplierName && supplierCriticality && (
        <SupplierCriticalityRationalePanel
          supplierId={supplierId}
          companyId={companyId}
          supplierName={supplierName}
          supplierCriticality={supplierCriticality}
          scopeOfSupply={scopeOfSupply}
          isEditMode={isEditMode}
        />
      )}
      
      {/* Probationary Reason Card - Only show if status is Probationary */}
      {supplierStatus === 'Probationary' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">{lang('supplier.probationaryStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="probationary_reason">{lang('supplier.reasonForProbationary')}</Label>
              <Textarea
                id="probationary_reason"
                value={probationaryReason || ''}
                onChange={(e) => onProbationaryReasonChange?.(e.target.value)}
                placeholder={lang('supplier.explainProbationaryStatus')}
                rows={3}
                disabled={!isEditMode}
                className="mt-2"
              />
              {!isEditMode && probationaryReason && (
                <div className="mt-2 p-3 bg-amber-100 rounded-md">
                  <p className="text-sm text-amber-800">{probationaryReason}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Scheduling Card */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('supplier.auditSchedule')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="audit_interval">{lang('supplier.auditInterval')}</Label>
              <Select
                value={auditInterval || '1 year'}
                onValueChange={onAuditIntervalChange}
                disabled={!isEditMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6 months">{lang('supplier.interval6Months')}</SelectItem>
                  <SelectItem value="1 year">{lang('supplier.interval1Year')}</SelectItem>
                  <SelectItem value="2 years">{lang('supplier.interval2Years')}</SelectItem>
                  <SelectItem value="3 years">{lang('supplier.interval3Years')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="next_audit">{lang('supplier.nextScheduledAudit')}</Label>
              <DatePicker
                date={nextScheduledAudit ? new Date(nextScheduledAudit) : undefined}
                setDate={(date) =>
                  onNextScheduledAuditChange?.(date ? date.toISOString().split('T')[0] : '')
                }
                placeholder={lang('supplier.scheduleNextAudit')}
                fromDate={new Date()}
                disabled={isEditMode ? undefined : () => true}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{lang('supplier.evaluationStatus')}</CardTitle>
            <Badge variant={evaluationStatus.status === 'Completed' ? 'default' : 'secondary'}>
              {evaluationStatus.status === 'Completed' ? lang('supplier.evalStatusCompleted') : lang('supplier.evalStatusInProgress')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">{lang('supplier.lastEvaluation')}</Label>
              <p className="font-medium">{evaluationStatus.lastEvaluation}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{lang('supplier.evaluator')}</Label>
              <p className="font-medium">{evaluationStatus.evaluator}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{lang('supplier.completionProgress')}</span>
              <span>{evaluationStatus.completionPercentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${evaluationStatus.completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={showEvaluationWizard} onOpenChange={setShowEvaluationWizard}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  {evaluationStatus.status === 'Completed' ? lang('supplier.updateEvaluation') : lang('supplier.continueEvaluation')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <SupplierEvaluationWizard
                  supplierId={supplierId}
                  companyId={companyId}
                  onComplete={handleEvaluationComplete}
                />
              </DialogContent>
            </Dialog>

            {isEditMode && (
              <>
                <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      {lang('supplier.scheduleCIAudit')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{lang('supplier.scheduleCIAudit')}</DialogTitle>
                      <DialogDescription>
                        {lang('supplier.scheduleCIAuditDescription')}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label>{lang('supplier.auditDate')}</Label>
                        <DatePicker
                          date={auditDate}
                          setDate={setAuditDate}
                          placeholder={lang('supplier.selectAuditDate')}
                          fromDate={new Date()}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowAuditDialog(false)}>
                          {lang('common.cancel')}
                        </Button>
                        <Button
                          onClick={() => {
                            if (auditDate) {
                              createAuditMutation.mutate(auditDate.toISOString().split('T')[0]);
                            }
                          }}
                          disabled={!auditDate || createAuditMutation.isPending}
                        >
                          {createAuditMutation.isPending ? lang('supplier.scheduling') : lang('supplier.scheduleAudit')}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => generateReportMutation.mutate()}
                  disabled={generateReportMutation.isPending}
                >
                  <Download className="h-4 w-4" />
                  {generateReportMutation.isPending ? lang('supplier.generating') : lang('supplier.generateReport')}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CI Issues & Documents Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{lang('supplier.ciIssuesDocuments')}</CardTitle>
            {isEditMode && (
              <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {lang('supplier.addDocument')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{lang('supplier.addEvaluationDocument')}</DialogTitle>
                    <DialogDescription>
                      {lang('supplier.addEvaluationDocumentDescription')}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="document-name">{lang('supplier.documentName')}</Label>
                      <Input
                        id="document-name"
                        placeholder={lang('supplier.enterDocumentName')}
                        value={documentData.document_name}
                        onChange={(e) => setDocumentData(prev => ({ ...prev, document_name: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="document-type">{lang('supplier.documentType')}</Label>
                      <Select
                        value={documentData.document_type}
                        onValueChange={(value: any) => setDocumentData(prev => ({ ...prev, document_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={lang('supplier.selectDocumentType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CI_Issue">{lang('supplier.docTypeCIIssue')}</SelectItem>
                          <SelectItem value="Quality_Agreement">{lang('supplier.docTypeQualityAgreement')}</SelectItem>
                          <SelectItem value="NDA">{lang('supplier.docTypeNDA')}</SelectItem>
                          <SelectItem value="Audit_Report">{lang('supplier.docTypeAuditReport')}</SelectItem>
                          <SelectItem value="Other">{lang('supplier.typeOther')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="checklist-item">{lang('supplier.relatedToChecklistItem')}</Label>
                      <Select
                        value={documentData.related_checklist_item}
                        onValueChange={(value) => setDocumentData(prev => ({ ...prev, related_checklist_item: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={lang('supplier.selectChecklistItem')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quality_agreement">{lang('supplier.checklistQualityAgreement')}</SelectItem>
                          <SelectItem value="nda_signed">{lang('supplier.checklistNDASigned')}</SelectItem>
                          <SelectItem value="initial_audit">{lang('supplier.checklistInitialAudit')}</SelectItem>
                          <SelectItem value="technical_capability">{lang('supplier.checklistTechnicalCapability')}</SelectItem>
                          <SelectItem value="other">{lang('supplier.checklistOtherGeneral')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">{lang('supplier.description')}</Label>
                      <Textarea
                        id="description"
                        placeholder={lang('supplier.describeDocumentOrCIIssue')}
                        rows={3}
                        value={documentData.description}
                        onChange={(e) => setDocumentData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{lang('supplier.uploadMethod')}</Label>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 gap-2">
                          <Upload className="h-4 w-4" />
                          {lang('supplier.uploadFile')}
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2">
                          <ExternalLink className="h-4 w-4" />
                          {lang('supplier.linkURL')}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
                        {lang('common.cancel')}
                      </Button>
                      <Button
                        onClick={handleAddDocument}
                        disabled={createDocumentMutation.isPending}
                      >
                        {createDocumentMutation.isPending ? lang('supplier.adding') : lang('supplier.addDocument')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{lang('supplier.loadingDocuments')}</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{lang('supplier.noDocumentsUploaded')}</p>
              <p className="text-sm mt-1">
                {lang('supplier.noDocumentsDescription')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.document_name}</p>
                      <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{doc.document_type}</Badge>
                    <Button variant="ghost" size="sm">
                      {lang('common.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluation History Card */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('supplier.evaluationHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{lang('supplier.noEvaluationsFound')}</p>
            <p className="text-sm mt-1">
              {lang('supplier.evaluationHistoryDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}