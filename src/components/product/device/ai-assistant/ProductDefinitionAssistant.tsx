import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Sparkles, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { DocumentUpload } from './DocumentUpload';
import { productDefinitionAIService, FieldSuggestion } from '@/services/productDefinitionAIService';
import { toast } from 'sonner';

interface ProductDefinitionAssistantProps {
  companyId: string;
  onSuggestionsGenerated?: (suggestions: FieldSuggestion[]) => void;
  className?: string;
}

export function ProductDefinitionAssistant({ 
  companyId, 
  onSuggestionsGenerated,
  className 
}: ProductDefinitionAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [error, setError] = useState<string>('');

  const handleDocumentUpload = async (file: File) => {
    setError('');
    setIsProcessing(true);
    setProcessingStep('Extracting text from document...');

    try {
      // Extract text from the uploaded document
      const extractionResult = await productDefinitionAIService.uploadAndExtractDocument({
        file,
        companyId
      });

      if (!extractionResult.success || !extractionResult.extracted_text) {
        throw new Error('Failed to extract text from document');
      }

      setUploadedDocument(file);
      setExtractedText(extractionResult.extracted_text);
      
      // Generate AI suggestions for all fields
      setProcessingStep('Analyzing document content with AI...');
      
      const suggestionsResult = await productDefinitionAIService.generateAllFieldSuggestions(
        extractionResult.extracted_text,
        companyId
      );

      if (!suggestionsResult.success || !suggestionsResult.suggestions) {
        throw new Error('Failed to generate AI suggestions');
      }

      setSuggestions(suggestionsResult.suggestions);
      onSuggestionsGenerated?.(suggestionsResult.suggestions);
      
      toast.success(`Successfully analyzed document and generated ${suggestionsResult.suggestions.length} field suggestions`);
      
    } catch (error) {
      console.error('Error processing document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process document';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleRemoveDocument = () => {
    setUploadedDocument(null);
    setExtractedText('');
    setSuggestions([]);
    setError('');
  };

  const getSuggestionCountByConfidence = () => {
    const high = suggestions.filter(s => s.confidence >= 0.8).length;
    const medium = suggestions.filter(s => s.confidence >= 0.6 && s.confidence < 0.8).length;
    const low = suggestions.filter(s => s.confidence < 0.6).length;
    return { high, medium, low };
  };

  const confidenceStats = getSuggestionCountByConfidence();

  return (
    <Card className={className}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upload from internal document</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload documents to auto-populate product definition fields
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {uploadedDocument && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                    <FileText className="w-3 h-3 mr-1" />
                    Document Analyzed
                  </Badge>
                )}
                {suggestions.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    {suggestions.length} Suggestions
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isProcessing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">{processingStep}</span>
                </div>
                <Progress value={processingStep.includes('Extracting') ? 30 : 80} className="w-full" />
              </div>
            ) : !uploadedDocument ? (
              <DocumentUpload
                onFileUpload={handleDocumentUpload}
                acceptedTypes={{
                  'application/pdf': ['.pdf'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                  'application/msword': ['.doc'],
                  'text/plain': ['.txt']
                }}
                maxSize={20 * 1024 * 1024} // 20MB
                description="Upload PDF, DOCX, DOC, or TXT product documentation to automatically extract field suggestions"
              />
            ) : (
              <div className="space-y-4">
                {/* Document Status */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        {uploadedDocument.name}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Analyzed • {extractedText.length.toLocaleString()} characters extracted
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveDocument}
                    className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/30"
                  >
                    Remove
                  </Button>
                </div>

                {/* Suggestions Summary */}
                {suggestions.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <p className="text-2xl font-bold text-emerald-600">{confidenceStats.high}</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">High Confidence</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-2xl font-bold text-yellow-600">{confidenceStats.medium}</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">Medium Confidence</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg border border-gray-200 dark:border-gray-800">
                      <p className="text-2xl font-bold text-gray-600">{confidenceStats.low}</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">Low Confidence</p>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    AI suggestions are now available in each field section. Look for the "✨" icons next to empty fields to apply suggested content.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}