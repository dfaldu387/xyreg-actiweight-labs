import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Settings, Key, ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface NoAIProvidersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
}

export function NoAIProvidersDialog({ 
  open, 
  onOpenChange, 
  companyName 
}: NoAIProvidersDialogProps) {
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    onOpenChange(false);
    navigate(`/app/company/${encodeURIComponent(companyName)}/settings?tab=general`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            AI Service Required
          </DialogTitle>
        </DialogHeader>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full shrink-0">
                <Key className="h-4 w-4 text-amber-600" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-amber-800">
                  AI Document Analyzer Unavailable
                </p>
                <p className="text-sm text-amber-700">
                  The AI document analyzer can't work because there are no AI providers set up. You need to configure at least one AI service to use this feature.
                </p>
              </div>
            </div>

            <div className="space-y-3 pl-11">
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-800">Required steps:</p>
                <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                  <li>Go to Company Settings → API Keys section</li>
                  <li>Add at least one AI provider (OpenAI, Anthropic, or Gemini)</li>
                  <li>Save your API key</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGoToSettings} className="bg-amber-600 hover:bg-amber-700">
            <Settings className="h-4 w-4 mr-2" />
            Go to API Keys
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}