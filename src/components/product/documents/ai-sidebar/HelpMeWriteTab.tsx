import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PenTool, Sparkles, Loader2, Copy, Check, RefreshCw, Lightbulb } from 'lucide-react';
import { DocumentContext, HelpWriteResult } from '@/hooks/useDocumentAI';
import { toast } from 'sonner';

interface HelpMeWriteTabProps {
  documentId: string;
  documentText: string;
  context?: DocumentContext;
  documentAI: {
    isLoading: boolean;
    error: string | null;
    helpMeWrite: (documentId: string, prompt: string, context?: DocumentContext, text?: string) => Promise<HelpWriteResult | null>;
  };
}

export function HelpMeWriteTab({
  documentId,
  documentText,
  context,
  documentAI
}: HelpMeWriteTabProps) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<HelpWriteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const examplePrompts = [
    "Write a summary section for this document",
    "Create a compliance checklist based on this document",
    "Draft an executive summary",
    "Write a procedures overview section"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || documentAI.isLoading) return;

    const generatedResult = await documentAI.helpMeWrite(documentId, prompt, context, documentText);
    if (generatedResult) {
      setResult(generatedResult);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  const handleClear = () => {
    setPrompt('');
    setResult(null);
  };

  const { isLoading, error } = documentAI;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              What would you like to write?
            </label>
            <Textarea
              placeholder="Describe what you want to write... e.g., 'Write a summary of the key procedures' or 'Create an executive overview'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] text-sm resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Example Prompts */}
          {!result && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Try these prompts:
              </p>
              <div className="flex flex-wrap gap-1">
                {examplePrompts.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 px-2"
                    onClick={() => handleExamplePrompt(example)}
                    disabled={isLoading}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading || !documentText}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
            {result && (
              <Button variant="outline" onClick={handleClear}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Generated Result */}
          {result && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Generated Content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        ~{result.wordCount} words
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(result.contentPlain)}
                        className="h-8 px-2"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* HTML Content Preview */}
                  <div
                    className="prose prose-sm max-w-none text-sm border rounded-lg p-3 bg-muted/30"
                    dangerouslySetInnerHTML={{ __html: result.content }}
                  />
                </CardContent>
              </Card>

              {/* Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Suggestions for Improvement</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Copy Plain Text Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(result.contentPlain)}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy as Plain Text
              </Button>
            </div>
          )}

          {/* Empty State when no document text */}
          {!documentText && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3">
                <p className="text-sm text-yellow-700">
                  Document content is needed to generate contextual writing. Please ensure the document has been processed.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
