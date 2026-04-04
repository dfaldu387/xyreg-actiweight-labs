import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, FileText, Check, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UsabilityStudyRow, StudyParticipant, StudyTask, TaskObservation } from "@/services/usabilityStudyService";
import { extractTextFromChecklistFile } from "@/utils/gapChecklistTextExtractor";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportedStudyData {
  name?: string;
  study_subtype?: string;
  study_dates?: string;
  conductors?: string;
  objective?: string;
  method?: string;
  test_location?: string;
  test_conditions?: string;
  prototype_id?: string;
  software_version?: string;
  ui_under_evaluation?: string;
  training_description?: string;
  training_to_test_interval?: string;
  methods_used?: string[];
  accompanying_docs?: string;
  interview_questions?: string;
  other_equipment?: string;
  acceptance_criteria?: string;
  participants_structured?: StudyParticipant[];
  tasks_structured?: StudyTask[];
  observations?: TaskObservation[];
  positive_learnings?: string;
  negative_learnings?: string;
  recommendations?: string;
  overall_conclusion?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyType: 'formative' | 'summative';
  productId: string;
  companyId: string;
  uefId: string;
  onImport: (data: Partial<UsabilityStudyRow>) => Promise<void>;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Study Name',
  study_subtype: 'Study Type',
  study_dates: 'Study Dates',
  conductors: 'Conductors',
  objective: 'Objective',
  method: 'Method',
  test_location: 'Test Location',
  test_conditions: 'Test Conditions',
  prototype_id: 'Prototype ID',
  software_version: 'Software Version',
  ui_under_evaluation: 'UI Under Evaluation',
  training_description: 'Training Description',
  training_to_test_interval: 'Training-to-Test Interval',
  methods_used: 'Evaluation Methods',
  accompanying_docs: 'Accompanying Documents',
  interview_questions: 'Interview Questions',
  other_equipment: 'Other Equipment',
  acceptance_criteria: 'Acceptance Criteria',
  participants_structured: 'Participants',
  tasks_structured: 'Tasks',
  observations: 'Observations',
  positive_learnings: 'Positive Learnings',
  negative_learnings: 'Negative Learnings',
  recommendations: 'Recommendations',
  overall_conclusion: 'Overall Conclusion',
};

export function UsabilityDocumentImporter({ open, onOpenChange, studyType, productId, companyId, uefId, onImport }: Props) {
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ImportedStudyData | null>(null);
  const [acceptedFields, setAcceptedFields] = useState<Set<string>>(new Set());
  const [fileName, setFileName] = useState('');

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setFileName(file.name);
    setIsParsing(true);
    setParsedData(null);
    setAcceptedFields(new Set());

    try {
      // Extract text from the document
      const extractedText = await extractTextFromChecklistFile(file);

      if (!extractedText || extractedText.trim().length < 50) {
        toast.error('Could not extract sufficient text from the document');
        setIsParsing(false);
        return;
      }

      // Call AI to parse the extracted text into structured study fields
      const { data, error } = await supabase.functions.invoke('ai-usability-evaluation-importer', {
        body: {
          extractedText: extractedText.slice(0, 30000), // limit token usage
          studyType,
          productId,
        },
      });

      if (error) throw error;

      if (data?.parsed) {
        setParsedData(data.parsed);
        // Auto-accept all non-empty fields
        const fields = new Set<string>();
        for (const [key, value] of Object.entries(data.parsed)) {
          if (value && (typeof value === 'string' ? value.trim() : Array.isArray(value) ? value.length > 0 : true)) {
            fields.add(key);
          }
        }
        setAcceptedFields(fields);
      } else {
        toast.error('AI could not parse the document');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      if (err?.message?.includes('429') || err?.status === 429) {
        toast.error('Rate limit exceeded. Please try again shortly.');
      } else if (err?.message?.includes('402') || err?.status === 402) {
        toast.error('AI credits exhausted. Please add credits.');
      } else {
        toast.error(err?.message || 'Failed to parse document');
      }
    } finally {
      setIsParsing(false);
    }
  }, [studyType, productId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isParsing,
  });

  const toggleField = (field: string) => {
    const next = new Set(acceptedFields);
    if (next.has(field)) next.delete(field);
    else next.add(field);
    setAcceptedFields(next);
  };

  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!parsedData) return;

    const importData: Partial<UsabilityStudyRow> = {
      product_id: productId,
      company_id: companyId,
      uef_id: uefId,
      study_type: studyType,
      status: 'draft',
    };

    for (const field of acceptedFields) {
      (importData as any)[field] = (parsedData as any)[field];
    }

    setIsImporting(true);
    try {
      await onImport(importData);
      onOpenChange(false);
      setParsedData(null);
      setAcceptedFields(new Set());
      toast.success('Study imported successfully');
    } catch (err: any) {
      console.error('Import save error:', err);
      toast.error(err?.message || 'Failed to save imported study. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const renderFieldValue = (key: string, value: any): React.ReactNode => {
    if (Array.isArray(value)) {
      if (key === 'participants_structured') {
        return <span className="text-xs">{value.length} participant(s)</span>;
      }
      if (key === 'tasks_structured') {
        return <span className="text-xs">{value.length} task(s)</span>;
      }
      if (key === 'observations') {
        return <span className="text-xs">{value.length} observation(s)</span>;
      }
      if (key === 'methods_used') {
        return <span className="text-xs">{value.join(', ')}</span>;
      }
      return <span className="text-xs">{JSON.stringify(value)}</span>;
    }
    if (typeof value === 'string') {
      return <span className="text-xs text-muted-foreground line-clamp-2">{value}</span>;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import from Document
          </DialogTitle>
          <DialogDescription>
            Upload an existing evaluation plan or report (PDF, DOCX) to populate study fields automatically.
          </DialogDescription>
        </DialogHeader>

        {!parsedData && !isParsing && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drop your evaluation document here</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, or TXT</p>
          </div>
        )}

        {isParsing && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium">Parsing "{fileName}"...</p>
              <p className="text-xs text-muted-foreground mt-1">AI is extracting structured study data</p>
            </div>
          </div>
        )}

        {parsedData && (
          <>
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                Review imported fields below. Accept (✓) or reject (✗) each field before importing.
              </AlertDescription>
            </Alert>

            <ScrollArea className="max-h-[400px] pr-2">
              <div className="space-y-2">
                {Object.entries(parsedData).map(([key, value]) => {
                  if (!value || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0)) return null;
                  const accepted = acceptedFields.has(key);
                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        accepted ? 'bg-yellow-50 border-yellow-200' : 'bg-muted/30 border-border opacity-60'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{FIELD_LABELS[key] || key}</span>
                          {accepted && <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">📄 Imported</Badge>}
                        </div>
                        <div className="mt-1">{renderFieldValue(key, value)}</div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant={accepted ? "default" : "outline"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { if (!accepted) toggleField(key); }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={!accepted ? "destructive" : "outline"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { if (accepted) toggleField(key); }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setParsedData(null); setAcceptedFields(new Set()); }}>
                Upload Different File
              </Button>
              <Button onClick={handleImport} disabled={acceptedFields.size === 0 || isImporting}>
                <FileText className="h-4 w-4 mr-2" />
                Import {acceptedFields.size} Field(s)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
