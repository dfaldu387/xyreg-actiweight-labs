import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Save, FlaskConical, CheckCircle2, Info, Upload, X, FileImage, FileVideo, ExternalLink, Sparkles, Loader2, Plus, FileUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UsabilityEngineeringFile } from "@/services/usabilityEngineeringService";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useDropzone } from "react-dropzone";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useUsabilityStudies } from "@/hooks/useUsabilityStudies";
import { StudyCardV2 } from "./StudyCard";
import { UsabilityStudyRow } from "@/services/usabilityStudyService";
import { updateUsabilityStudy, createUsabilityStudy } from "@/services/usabilityStudyService";
import { UsabilityDocumentImporter } from "./UsabilityDocumentImporter";
import { AIContextSourcesPanel } from "@/components/product/ai-assistant/AIContextSourcesPanel";


interface EvaluationPlanTabProps {
  uef: UsabilityEngineeringFile;
  productId: string;
  companyId: string;
  disabled?: boolean;
}

interface EvidenceFile {
  name: string;
  path: string;
  type: 'image' | 'video';
  url: string;
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
};

export function EvaluationPlanTab({ uef, productId, companyId, disabled }: EvaluationPlanTabProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Use DB-backed studies
  const { studies: formativeStudies, createStudy, isCreating } = useUsabilityStudies(productId, 'formative');
  const { studies: summativeStudies } = useUsabilityStudies(productId, 'summative');

  const [isUploading, setIsUploading] = useState<'formative' | 'summative' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const { language: appLanguage } = useLanguage();
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState<string>(appLanguage);
  const [showImporter, setShowImporter] = useState<'formative' | 'summative' | null>(null);

  // Fetch evidence files from storage
  const { data: formativeFiles = [], refetch: refetchFormative } = useQuery({
    queryKey: ['usability-evidence', productId, 'formative'],
    queryFn: async () => {
      const folder = `${productId}/formative`;
      const { data, error } = await supabase.storage.from('usability-evidence').list(folder);
      if (error) return [];
      return (data || []).map(f => ({
        name: f.name,
        path: `${folder}/${f.name}`,
        type: f.name.match(/\.(mp4|mov)$/i) ? 'video' as const : 'image' as const,
        url: supabase.storage.from('usability-evidence').getPublicUrl(`${folder}/${f.name}`).data.publicUrl,
      }));
    },
  });

  const { data: summativeFiles = [], refetch: refetchSummative } = useQuery({
    queryKey: ['usability-evidence', productId, 'summative'],
    queryFn: async () => {
      const folder = `${productId}/summative`;
      const { data, error } = await supabase.storage.from('usability-evidence').list(folder);
      if (error) return [];
      return (data || []).map(f => ({
        name: f.name,
        path: `${folder}/${f.name}`,
        type: f.name.match(/\.(mp4|mov)$/i) ? 'video' as const : 'image' as const,
        url: supabase.storage.from('usability-evidence').getPublicUrl(`${folder}/${f.name}`).data.publicUrl,
      }));
    },
  });

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      const { data: hazards } = await supabase
        .from('hazards')
        .select('hazard_id, description, hazardous_situation, potential_harm, initial_severity, risk_control_measure')
        .eq('product_id', productId)
        .or('hazard_id.ilike.HAZ-USE%,category.eq.human_factors');

      const { data: product } = await supabase
        .from('products')
        .select('name, class, intended_use')
        .eq('id', productId)
        .single();

      const { data: result, error } = await supabase.functions.invoke('ai-evaluation-plan-generator', {
        body: {
          companyId,
          productData: {
            product_name: product?.name,
            device_class: product?.class,
            intended_purpose: product?.intended_use,
          },
          hazards: hazards || [],
          uiCharacteristics: uef.ui_characteristics,
          intendedUsers: uef.intended_users,
          useEnvironments: uef.use_environments,
        },
      });

      if (error) throw error;

      if (result?.success && result?.plan) {
        const fStudies = result.plan.formative_studies || [];
        const sStudies = result.plan.summative_studies || [];
        let count = 0;

        for (const s of fStudies) {
          createStudy({
            product_id: productId,
            company_id: companyId,
            uef_id: uef.id,
            study_type: 'formative',
            name: s.name || '',
            study_subtype: s.study_type || 'other',
            objective: s.objective || '',
            method: s.method || '',
            participants_text: s.participants || '',
            tasks_text: s.tasks || '',
            acceptance_criteria: s.acceptance_criteria || '',
            status: 'draft',
          } as any);
          count++;
        }
        for (const s of sStudies) {
          createStudy({
            product_id: productId,
            company_id: companyId,
            uef_id: uef.id,
            study_type: 'summative',
            name: s.name || '',
            study_subtype: s.study_type || 'other',
            objective: s.objective || '',
            method: s.method || '',
            participants_text: s.participants || '',
            tasks_text: s.tasks || '',
            acceptance_criteria: s.acceptance_criteria || '',
            status: 'draft',
          } as any);
          count++;
        }
        toast.success(`Added ${count} AI-suggested studies.`);
      } else {
        throw new Error(result?.error || 'Failed to generate plans');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      if (error?.message?.includes('429') || error?.status === 429) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error?.message?.includes('402') || error?.status === 402) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error(error?.message || 'Failed to generate evaluation plans');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Study update handler – debounced save to DB
  const handleStudyChange = async (study: UsabilityStudyRow, updates: Partial<UsabilityStudyRow>) => {
    try {
      await updateUsabilityStudy(study.id, updates);
      queryClient.invalidateQueries({ queryKey: ['usability-studies', productId] });
    } catch {
      toast.error('Failed to save study');
    }
  };

  const handleDeleteStudy = async (studyId: string) => {
    try {
      const { error } = await supabase.from('usability_studies').delete().eq('id', studyId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['usability-studies', productId] });
      toast.success('Study removed');
    } catch {
      toast.error('Failed to delete study');
    }
  };

  const addNewStudy = (section: 'formative' | 'summative') => {
    createStudy({
      product_id: productId,
      company_id: companyId,
      uef_id: uef.id,
      study_type: section,
      name: '',
      study_subtype: section === 'formative' ? 'heuristic_evaluation' : 'simulated_use',
      status: 'draft',
    } as any);
  };

  // File upload/delete
  const handleUpload = async (files: File[], section: 'formative' | 'summative') => {
    setIsUploading(section);
    try {
      for (const file of files) {
        const filePath = `${productId}/${section}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('usability-evidence').upload(filePath, file);
        if (error) throw error;
      }
      if (section === 'formative') refetchFormative();
      else refetchSummative();
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(null);
    }
  };

  const handleDeleteFile = async (path: string, section: 'formative' | 'summative') => {
    const { error } = await supabase.storage.from('usability-evidence').remove([path]);
    if (error) { toast.error('Failed to delete file'); return; }
    if (section === 'formative') refetchFormative();
    else refetchSummative();
    toast.success('File removed');
  };

  const EvidenceDropzone = ({ section }: { section: 'formative' | 'summative' }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      handleUpload(acceptedFiles, section);
    }, [section]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      disabled: disabled || isUploading === section,
    });
    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isUploading === section ? 'Uploading...' : 'Drop images or videos here, or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, MP4, MOV</p>
      </div>
    );
  };

  const FileList = ({ files, section }: { files: EvidenceFile[]; section: 'formative' | 'summative' }) => {
    if (files.length === 0) return null;
    return (
      <div className="space-y-2 mt-4">
        <p className="text-sm font-medium">Attachments ({files.length})</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {files.map((file) => (
            <div key={file.path} className="relative group border rounded-lg overflow-hidden">
              {file.type === 'image' ? (
                <img src={file.url} alt={file.name} className="w-full h-24 object-cover" />
              ) : (
                <div className="w-full h-24 bg-muted flex items-center justify-center">
                  <FileVideo className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-1.5 text-xs truncate text-muted-foreground flex items-center gap-1">
                {file.type === 'image' ? <FileImage className="h-3 w-3 flex-shrink-0" /> : <FileVideo className="h-3 w-3 flex-shrink-0" />}
                <span className="truncate">{file.name}</span>
              </div>
              {!disabled && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteFile(file.path, section)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const navigateToVV = (testLevel: 'formative' | 'summative') => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'verification-validation');
    newParams.set('subTab', 'test-cases');
    newParams.set('createTest', 'true');
    newParams.set('testType', 'validation');
    newParams.set('testLevel', testLevel);
    newParams.set('fromUE', 'true');
    navigate(`?${newParams.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usability Evaluation Plan</h3>
          <p className="text-sm text-muted-foreground">
            IEC 62366-1 Clause 5.5 — Define multiple formative & summative studies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowImporter('formative')} disabled={disabled}>
            <FileUp className="h-4 w-4 mr-2" />
            Import from Document
          </Button>
          <Button variant="outline" onClick={() => setShowAIDialog(true)} disabled={disabled || isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {isGenerating ? 'Generating...' : 'AI Suggestions'}
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Add individual studies for each evaluation round. Studies are auto-saved to the database.
          Attach evidence photos/videos per section. Test cases are created and executed in the V&V module.
        </AlertDescription>
      </Alert>

      {/* Formative Studies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FlaskConical className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Formative Studies
                  <Badge variant="outline" className="font-normal">Clause 5.7</Badge>
                  <Badge variant="secondary" className="font-normal">{formativeStudies.length}</Badge>
                </CardTitle>
                <CardDescription>Iterative evaluations during design to identify usability issues</CardDescription>
              </div>
            </div>
            {!disabled && (
              <Button variant="outline" size="sm" onClick={() => addNewStudy('formative')} disabled={isCreating}>
                <Plus className="h-4 w-4 mr-1" />
                Add Study
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formativeStudies.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No formative studies yet. Add one or generate with AI.
            </p>
          )}
          {formativeStudies.map((study) => (
            <StudyCardV2
              key={study.id}
              study={study}
              section="formative"
              onChange={(updates) => handleStudyChange(study, updates)}
              onDelete={() => handleDeleteStudy(study.id)}
              disabled={disabled}
              defaultOpen={!study.name}
            />
          ))}

          {/* Evidence */}
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">Evidence & Attachments</p>
            <EvidenceDropzone section="formative" />
            <FileList files={formativeFiles} section="formative" />
          </div>

          <Button variant="outline" size="sm" className="w-full" disabled={disabled} onClick={() => navigateToVV('formative')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Generate Formative Test in V&V
          </Button>
        </CardContent>
      </Card>

      {/* Summative Studies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Summative Studies
                  <Badge variant="outline" className="font-normal">Clause 5.9</Badge>
                  <Badge variant="secondary" className="font-normal">{summativeStudies.length}</Badge>
                </CardTitle>
                <CardDescription>Final validation confirming the design meets usability requirements</CardDescription>
              </div>
            </div>
            {!disabled && (
              <Button variant="outline" size="sm" onClick={() => addNewStudy('summative')} disabled={isCreating}>
                <Plus className="h-4 w-4 mr-1" />
                Add Study
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {summativeStudies.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No summative studies yet. Add one or generate with AI.
            </p>
          )}
          {summativeStudies.map((study) => (
            <StudyCardV2
              key={study.id}
              study={study}
              section="summative"
              onChange={(updates) => handleStudyChange(study, updates)}
              onDelete={() => handleDeleteStudy(study.id)}
              disabled={disabled}
              defaultOpen={!study.name}
            />
          ))}

          {/* Evidence */}
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">Evidence & Attachments</p>
            <EvidenceDropzone section="summative" />
            <FileList files={summativeFiles} section="summative" />
          </div>

          <Button variant="outline" size="sm" className="w-full" disabled={disabled} onClick={() => navigateToVV('summative')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Generate Summative Test in V&V
          </Button>
        </CardContent>
      </Card>

      {/* AI Suggestions Confirmation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Evaluation Plan Suggestions
            </DialogTitle>
            <DialogDescription>
              Generate formative and summative study drafts using AI
            </DialogDescription>
          </DialogHeader>
          <AIContextSourcesPanel
            productId={productId}
            additionalSources={[
              'Usability Hazards (human-factors)',
              'UI Characteristics',
              'Intended Users & Use Environments',
            ]}
            mode="select"
            onLanguageChange={setOutputLanguage}
            onPromptChange={setAdditionalPrompt}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowAIDialog(false);
                handleGenerateWithAI();
              }}
              disabled={isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Suggestions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Importer */}
      {showImporter && (
        <UsabilityDocumentImporter
          open={!!showImporter}
          onOpenChange={(open) => { if (!open) setShowImporter(null); }}
          studyType={showImporter}
          productId={productId}
          companyId={companyId}
          uefId={uef.id}
          onImport={async (data) => {
            await createUsabilityStudy(data as any);
            queryClient.invalidateQueries({ queryKey: ['usability-studies', productId] });
          }}
        />
      )}
    </div>
  );
}
