import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Brain, Settings, CheckCircle, AlertCircle, Edit, Trash2, MoreHorizontal, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AITemplateImporterService, type TemplateAnalysisResult, type TemplateStructure } from "@/services/aiTemplateImporterService";
import { CompanyDocumentTemplateService, type CompanyTemplate } from "@/services/companyDocumentTemplateService";
import { TemplateStructureEditor } from "./TemplateStructureEditor";
import { NoAIProvidersDialog } from "./NoAIProvidersDialog";
import { EditTemplateDialog } from "./EditTemplateDialog";
import { useParams } from 'react-router-dom';

interface AITemplateImporterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onTemplateCreated: () => void;
}

type Step = 'upload' | 'analyzing' | 'editing' | 'saving' | 'create_from_scratch' | 'paste_text';

export function AITemplateImporterDialog({ 
  open, 
  onOpenChange, 
  companyId, 
  onTemplateCreated 
}: AITemplateImporterDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<TemplateAnalysisResult | null>(null);
  const [templateStructure, setTemplateStructure] = useState<TemplateStructure | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showNoAIDialog, setShowNoAIDialog] = useState(false);
  const [templates, setTemplates] = useState<CompanyTemplate[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CompanyTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<CompanyTemplate | null>(null);
  
  const { companyName } = useParams();

  // Load existing templates
  const loadTemplates = useCallback(async () => {
    try {
      const fetchedTemplates = await CompanyDocumentTemplateService.getTemplates(companyId);
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, [companyId]);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, loadTemplates]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please select a PDF, Word document, or text file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    // First check if AI providers are configured
    const aiProviders = await AITemplateImporterService.getCompanyAIProviders(companyId);
    if (aiProviders.length === 0) {
      setShowNoAIDialog(true);
      return;
    }

    setIsProcessing(true);
    setCurrentStep('analyzing');
    setProgress(10);

    try {
      // Step 1: Extract text from document
      setProgress(30);
      const extractedText = await AITemplateImporterService.extractTextFromFile(file);
      
      // Step 2: Analyze with AI
      setProgress(60);
      const analysis = await AITemplateImporterService.analyzeDocument(extractedText, companyId);
      
      // Step 3: Convert to template structure
      setProgress(90);
      const structure = AITemplateImporterService.convertAnalysisToTemplate(analysis);
      
      setAnalysisResult(analysis);
      setTemplateStructure(structure);
      setProgress(100);
      setCurrentStep('editing');
      
      toast.success('Document analysis completed successfully!');
    } catch (error) {
      console.error('Analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze document';
      
      // Check if it's an AI provider error
      if (errorMessage.includes('No AI providers configured')) {
        setShowNoAIDialog(true);
      } else {
        toast.error('Failed to analyze document. Please try again.');
      }
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  }, [file, companyId]);

  const handleAnalyzeText = useCallback(async () => {
    console.log('=== ANALYZE TEXT BUTTON CLICKED ===');
    console.log('Pasted text length:', pastedText.trim().length);
    console.log('Company ID:', companyId);
    
    if (!pastedText.trim()) {
      console.log('No text provided');
      toast.error('Please enter some text to analyze');
      return;
    }

    if (pastedText.trim().length < 50) {
      console.log('Text too short:', pastedText.trim().length);
      toast.error('Text is too short for meaningful analysis. Please enter at least 50 characters.');
      return;
    }

    // Clean the text to remove problematic control characters
    const cleanedText = pastedText
      .replace(/\t/g, '    ') // Replace tabs with spaces
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')   // Replace remaining carriage returns
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove other control characters
      .trim();

    console.log('Cleaned text length:', cleanedText.length);
    console.log('Text after cleaning preview:', cleanedText.substring(0, 200));

    console.log('Checking AI providers...');
    
    // First check if AI providers are configured
    try {
      const aiProviders = await AITemplateImporterService.getCompanyAIProviders(companyId);
      console.log('AI providers found:', aiProviders);
      
      if (aiProviders.length === 0) {
        console.log('No AI providers configured');
        setShowNoAIDialog(true);
        return;
      }
    } catch (error) {
      console.error('Error checking AI providers:', error);
      toast.error('Failed to check AI configuration');
      return;
    }

    console.log('Starting analysis process...');
    setIsProcessing(true);
    setCurrentStep('analyzing');
    setProgress(10);

    try {
      // Skip text extraction step since we already have text
      setProgress(60);
      console.log('Calling analyzeDocument with cleaned text...');
      
      const analysis = await AITemplateImporterService.analyzeDocument(cleanedText, companyId);
      console.log('Analysis result:', analysis);
      
      // Convert to template structure
      setProgress(90);
      const structure = AITemplateImporterService.convertAnalysisToTemplate(analysis);
      console.log('Template structure:', structure);
      
      setAnalysisResult(analysis);
      setTemplateStructure(structure);
      setProgress(100);
      setCurrentStep('editing');
      
      toast.success('Text analysis completed successfully!');
    } catch (error) {
      console.error('=== TEXT ANALYSIS ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('=== END TEXT ANALYSIS ERROR ===');
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze text';
      
      // Check if it's an AI provider error
      if (errorMessage.includes('No AI providers configured')) {
        setShowNoAIDialog(true);
      } else {
        toast.error('Failed to analyze text: ' + errorMessage);
      }
      setCurrentStep('paste_text');
    } finally {
      console.log('Analysis process finished, setting isProcessing to false');
      setIsProcessing(false);
    }
  }, [pastedText, companyId]);

  const handleSaveTemplate = useCallback(async () => {
    if (!templateStructure) return;

    setIsProcessing(true);
    setCurrentStep('saving');

    try {
      await AITemplateImporterService.createTemplate(
        companyId,
        templateStructure,
        templateStructure.metadata
      );
      
      toast.success('Template created successfully!');
      onTemplateCreated();
      loadTemplates(); // Refresh template list
      onOpenChange(false);
      
      // Reset state
      setCurrentStep('upload');
      setFile(null);
      setPastedText('');
      setAnalysisResult(null);
      setTemplateStructure(null);
      setProgress(0);
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [templateStructure, companyId, onTemplateCreated, onOpenChange, loadTemplates]);

  const handleClose = () => {
    if (isProcessing) return;
    onOpenChange(false);
    // Reset state when closing
    setCurrentStep('upload');
    setFile(null);
    setPastedText('');
    setAnalysisResult(null);
    setTemplateStructure(null);
    setProgress(0);
  };

  const handleEdit = (template: CompanyTemplate) => {
    setSelectedTemplate(template);
    setShowEditDialog(true);
  };

  const handleDelete = (template: CompanyTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      const success = await CompanyDocumentTemplateService.deleteTemplate(templateToDelete.id);
      if (success) {
        await loadTemplates();
        setDeleteDialogOpen(false);
        setTemplateToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleTemplateUpdated = () => {
    loadTemplates();
    setShowEditDialog(false);
    setSelectedTemplate(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dhf': return 'bg-blue-100 text-blue-800';
      case 'dmr': return 'bg-green-100 text-green-800';
      case 'technical file': return 'bg-purple-100 text-purple-800';
      case 'standard': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepIcon = (step: Step) => {
    switch (step) {
      case 'upload': return <Upload className="h-5 w-5" />;
      case 'paste_text': return <Type className="h-5 w-5" />;
      case 'analyzing': return <Brain className="h-5 w-5" />;
      case 'editing': return <Settings className="h-5 w-5" />;
      case 'saving': return <CheckCircle className="h-5 w-5" />;
      case 'create_from_scratch': return <Settings className="h-5 w-5" />;
    }
  };

  const getStepTitle = (step: Step) => {
    switch (step) {
      case 'upload': return 'Upload Document';
      case 'paste_text': return 'Paste Text';
      case 'analyzing': return 'AI Analysis';
      case 'editing': return 'Refine Template';
      case 'saving': return 'Save Template';
      case 'create_from_scratch': return 'Create Template';
    }
  };

  const createFromScratch = () => {
    const blankStructure: TemplateStructure = {
      name: 'New Template',
      document_type: 'Standard',
      tech_applicability: 'All device types',
      description: '',
      metadata: {
        ai_provider: 'manual',
        confidence_score: 1.0,
        ai_generated: false,
        original_filename: 'blank_template',
        analysis_timestamp: new Date().toISOString()
      },
      sections: [
        {
          id: 'general_info',
          name: 'General Information',
          description: 'Basic document information',
          order: 1,
          fields: [
            {
              id: 'title',
              name: 'title',
              type: 'text',
              label: 'Document Title',
              description: 'The title of the document',
              required: true,
              placeholder: 'Enter document title'
            }
          ]
        }
      ]
    };
    
    setTemplateStructure(blankStructure);
    setCurrentStep('create_from_scratch');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Template Creator
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        {(currentStep !== 'upload' && currentStep !== 'create_from_scratch' && currentStep !== 'paste_text') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {(['upload', 'analyzing', 'editing', 'saving'] as Step[]).map((step, index) => (
                <div 
                  key={step}
                  className={`flex items-center gap-2 ${
                    currentStep === step ? 'text-primary' : 
                    (['upload', 'analyzing', 'editing', 'saving'] as Step[]).indexOf(currentStep) > index 
                      ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  {getStepIcon(step)}
                  <span className="text-sm font-medium hidden sm:block">
                    {getStepTitle(step)}
                  </span>
                </div>
              ))}
            </div>
            
            {isProcessing && (
              <Progress value={progress} className="w-full" />
            )}
          </div>
        )}

        {/* Existing Templates Section */}
        {(currentStep === 'upload' || currentStep === 'paste_text') && templates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Existing Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.slice(0, 3).map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getDocumentTypeColor(template.document_type)}
                        >
                          {template.document_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(template.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(template)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {templates.length > 3 && (
                <div className="text-sm text-muted-foreground mt-2 text-center">
                  And {templates.length - 3} more template{templates.length - 3 !== 1 ? 's' : ''}...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 'upload' && (
            <div className="space-y-4">
              {/* Creation Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={createFromScratch}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Create from Scratch
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Start with a blank template and build your structure manually with full control over sections and fields.
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setCurrentStep('paste_text')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      Paste Text & Analyze
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Copy and paste your document text directly. Perfect when document extraction isn't working properly.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload & Analyze
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Upload an existing document to create a smart template. The AI will analyze the structure automatically.
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="file-upload">Select Document</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileSelect}
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-muted-foreground">
                        PDF, Word, Text - Max 10MB
                      </p>
                    </div>
                    
                    {file && (
                      <Card className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAnalyze} 
                        disabled={!file || isProcessing}
                        size="sm"
                      >
                        Analyze Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'paste_text' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Paste Your Document Text
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Copy the text from your document and paste it below. This is often more reliable than file upload for complex documents.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="document-text">Document Text</Label>
                    <Textarea
                      id="document-text"
                      placeholder="Paste your document text here..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      rows={12}
                      className="min-h-[300px] resize-y"
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 50 characters required. The more text you provide, the better the AI analysis will be.
                    </p>
                  </div>
                  
                  {pastedText.trim() && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Type className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">Text ready for analysis</p>
                            <p className="text-sm text-muted-foreground">
                              {pastedText.trim().length} characters
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep('upload')}
                      disabled={isProcessing}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleAnalyzeText} 
                      disabled={!pastedText.trim() || pastedText.trim().length < 50 || isProcessing}
                    >
                      Analyze Text
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'analyzing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 animate-pulse" />
                  Analyzing Document...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 text-lg font-medium">
                    <Brain className="h-6 w-6 animate-pulse text-primary" />
                    AI is analyzing your document...
                  </div>
                  <p className="text-muted-foreground mt-2">
                    This may take a few moments depending on document size
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Extracting text...</span>
                    <span>{progress >= 30 ? '✓' : '...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>AI analysis...</span>
                    <span>{progress >= 60 ? '✓' : '...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Creating template structure...</span>
                    <span>{progress >= 90 ? '✓' : '...'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(currentStep === 'editing' || currentStep === 'create_from_scratch') && templateStructure && (
            <div className="space-y-4">
              <TemplateStructureEditor
                structure={templateStructure}
                onStructureChange={setTemplateStructure}
                analysisMetadata={analysisResult?.metadata || templateStructure.metadata}
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                  Cancel
                </Button>
                <Button onClick={() => handleSaveTemplate()}>
                  Save Template
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'saving' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Saving Template...
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-lg font-medium">
                  <CheckCircle className="h-6 w-6 animate-pulse text-green-600" />
                  Creating your template...
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons - Removed duplicate section as save buttons are now integrated into the steps */}
      </DialogContent>
      
      {/* Edit Template Dialog */}
      {selectedTemplate && (
        <EditTemplateDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          template={selectedTemplate}
          onTemplateUpdated={handleTemplateUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* No AI Providers Dialog */}
      <NoAIProvidersDialog 
        open={showNoAIDialog}
        onOpenChange={setShowNoAIDialog}
        companyName={companyName || ''}
      />
    </Dialog>
  );
}