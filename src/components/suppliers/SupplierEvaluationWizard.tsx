import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Circle, ArrowRight, Upload, File, Link, X } from 'lucide-react';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierService } from '@/services/supplierService';
import { SupplierDocumentService } from '@/services/supplierDocumentService';
import { SupplierEvaluationDocumentService } from '@/services/supplierEvaluationDocumentService';
import { toast } from 'sonner';

const evaluationSchema = z.object({
  quality_agreement_sent: z.boolean(),
  nda_signed: z.boolean(),
  initial_audit_completed: z.boolean(),
  technical_capability_assessed: z.boolean(),
  notes: z.string().optional(),
});

type EvaluationFormData = z.infer<typeof evaluationSchema>;

interface SupplierEvaluationWizardProps {
  supplierId: string;
  companyId: string;
  onComplete: () => void;
}

const EVALUATION_CHECKLIST = [
  {
    key: 'quality_agreement_sent' as const,
    label: 'Quality Agreement Sent/Received',
    description: 'Quality agreement has been sent to and received from the supplier',
  },
  {
    key: 'nda_signed' as const,
    label: 'NDA Signed',
    description: 'Non-disclosure agreement has been executed',
  },
  {
    key: 'initial_audit_completed' as const,
    label: 'Initial Quality Audit Completed',
    description: 'Initial quality system audit has been performed',
  },
  {
    key: 'technical_capability_assessed' as const,
    label: 'Technical Capability Assessed',
    description: 'Technical capabilities have been evaluated and documented',
  },
];

export function SupplierEvaluationWizard({ supplierId, companyId, onComplete }: SupplierEvaluationWizardProps) {
  const [currentStep, setCurrentStep] = useState<'checklist' | 'review'>('checklist');
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, {file?: File, url?: string, name: string}>>({});
  const queryClient = useQueryClient();

  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      quality_agreement_sent: false,
      nda_signed: false,
      initial_audit_completed: false,
      technical_capability_assessed: false,
      notes: '',
    },
  });

  const createEvaluationMutation = useMutation({
    mutationFn: (evaluation: any) => SupplierService.createEvaluation(evaluation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier evaluation completed successfully');
      onComplete();
    },
    onError: () => {
      toast.error('Failed to complete evaluation');
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      SupplierService.updateSupplier(id, updates),
  });

  const watchedValues = form.watch();
  const completedItems = EVALUATION_CHECKLIST.filter(item => watchedValues[item.key]).length;
  const allCompleted = completedItems === EVALUATION_CHECKLIST.length;

  const handleFileUpload = async (checklistKey: string, file: File) => {
    try {
      const uploadResult = await SupplierDocumentService.uploadDocument(file, supplierId, companyId, checklistKey);
      setUploadedDocuments(prev => ({
        ...prev,
        [checklistKey]: { file, name: file.name, url: uploadResult.url }
      }));
      toast.success('Document uploaded successfully');
    } catch {
      toast.error('Failed to upload document');
    }
  };

  const handleUrlLink = (checklistKey: string, url: string, name: string) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [checklistKey]: { url, name }
    }));
    toast.success('Document link added');
  };

  const removeDocument = (checklistKey: string) => {
    setUploadedDocuments(prev => {
      const newState = { ...prev };
      delete newState[checklistKey];
      return newState;
    });
  };

  const onSubmit = async (data: EvaluationFormData) => {
    if (currentStep === 'checklist') {
      setCurrentStep('review');
      return;
    }

    // Create evaluation record
    const evaluation = {
      supplier_id: supplierId,
      evaluation_date: new Date().toISOString().split('T')[0],
      checklist_results: {
        quality_agreement_sent: data.quality_agreement_sent,
        nda_signed: data.nda_signed,
        initial_audit_completed: data.initial_audit_completed,
        technical_capability_assessed: data.technical_capability_assessed,
      },
      status: allCompleted ? 'Completed' : 'In Progress',
      notes: data.notes,
    };

    try {
      await createEvaluationMutation.mutateAsync(evaluation);
      
      // Save uploaded documents
      for (const [checklistKey, doc] of Object.entries(uploadedDocuments)) {
        await SupplierEvaluationDocumentService.createDocument({
          supplier_id: supplierId,
          document_name: doc.name,
          document_type: 'CI_Issue',
          description: `Document for ${checklistKey.replace(/_/g, ' ')}`,
          file_url: doc.url,
          related_checklist_item: checklistKey,
        });
      }
      
      // If all items are completed, update supplier status to Approved
      if (allCompleted) {
        await updateSupplierMutation.mutateAsync({
          id: supplierId,
          updates: { status: 'Approved' }
        });
      }
    } catch {
      // Failed to complete evaluation
    }
  };

  const handleBack = () => {
    setCurrentStep('checklist');
  };

  const DocumentUploadSection = ({ checklistKey }: { checklistKey: string }) => {
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [nameInput, setNameInput] = useState('');

    const handleUrlSubmit = () => {
      if (urlInput.trim() && nameInput.trim()) {
        handleUrlLink(checklistKey, urlInput.trim(), nameInput.trim());
        setUrlInput('');
        setNameInput('');
        setShowUrlInput(false);
      }
    };

    const existingDoc = uploadedDocuments[checklistKey];

    return (
      <div className="mt-2 space-y-2">
        {existingDoc ? (
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4" />
              <span className="text-sm">{existingDoc.name}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => removeDocument(checklistKey)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) { // 10MB limit
                        toast.error('File size must be less than 10MB');
                        return;
                      }
                      handleFileUpload(checklistKey, file);
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowUrlInput(!showUrlInput)}
              >
                <Link className="h-3 w-3 mr-1" />
                Link Document
              </Button>
            </div>
            
            {showUrlInput && (
              <div className="space-y-2 p-2 border rounded">
                <Input
                  placeholder="Document name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
                <Input
                  placeholder="Document URL"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleUrlSubmit}>
                    Add Link
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowUrlInput(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Supplier Evaluation</DialogTitle>
        <DialogDescription>
          Complete the initial evaluation checklist for this supplier to ensure compliance with ISO 13485 requirements.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-sm">
          <span>Progress: {completedItems}/{EVALUATION_CHECKLIST.length} items completed</span>
          {allCompleted && (
            <Badge variant="default" className="bg-success text-success-foreground">
              Ready for Approval
            </Badge>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {currentStep === 'checklist' && (
              <>
                <div className="space-y-4">
                  {EVALUATION_CHECKLIST.map((item) => (
                    <FormField
                      key={item.key}
                      control={form.control}
                      name={item.key}
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-3 rounded-md border p-4">
                          <div className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none flex-1">
                              <FormLabel className="text-sm font-medium">
                                {item.label}
                              </FormLabel>
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                          </div>
                          {/* File upload section for each checklist item */}
                          <DocumentUploadSection checklistKey={item.key} />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evaluation Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes about the evaluation..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={onComplete}>
                    Skip for Now
                  </Button>
                  <Button type="submit">
                    Review Evaluation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {currentStep === 'review' && (
              <>
                <div className="space-y-4">
                  <h4 className="font-medium">Evaluation Summary</h4>
                  
                  <div className="space-y-2">
                    {EVALUATION_CHECKLIST.map((item) => (
                      <div key={item.key} className="flex items-center space-x-2">
                        {watchedValues[item.key] ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={watchedValues[item.key] ? 'text-foreground' : 'text-muted-foreground'}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {watchedValues.notes && (
                    <div>
                      <h5 className="font-medium mb-2">Notes</h5>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {watchedValues.notes}
                      </p>
                    </div>
                  )}

                  <div className="bg-muted p-4 rounded-md">
                    <h5 className="font-medium mb-2">Evaluation Outcome</h5>
                    <p className="text-sm">
                      {allCompleted ? (
                        <span className="text-success">
                          ✓ All evaluation criteria have been met. The supplier will be marked as "Approved".
                        </span>
                      ) : (
                        <span className="text-warning">
                          ⚠ Evaluation is incomplete. The supplier will remain "Probationary" until all criteria are met.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back to Checklist
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createEvaluationMutation.isPending}
                  >
                    {createEvaluationMutation.isPending ? 'Completing...' : 'Complete Evaluation'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </div>
    </>
  );
}