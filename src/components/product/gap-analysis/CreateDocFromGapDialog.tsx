import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, FileText } from 'lucide-react';
import { DocumentCreationService } from '@/services/documentCreationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


export interface GapContext {
  section: string;
  framework: string;
  clauseTitle: string;
}

interface CreateDocFromGapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gapContext: GapContext;
  productId?: string;
  companyId?: string;
  /** Called after document is created with the new doc ID */
  onCreated?: (docId: string) => void;
}

const DOC_TYPES = ['SOP', 'Form', 'Record', 'Work Instruction', 'Policy', 'Plan', 'Report', 'Technical File'];

export function CreateDocFromGapDialog({
  open,
  onOpenChange,
  gapContext,
  productId,
  companyId,
  onCreated,
}: CreateDocFromGapDialogProps) {
  const suggestedName = `SOP - ${gapContext.clauseTitle || gapContext.section}`;
  const [docName, setDocName] = useState(suggestedName);
  const [docType, setDocType] = useState('SOP');
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setDocName(`SOP - ${gapContext.clauseTitle || gapContext.section}`);
      setDocType('SOP');
    }
  }, [open, gapContext]);

  const handleCreate = async () => {
    if (!docName.trim() || !companyId) return;
    setIsCreating(true);

    try {
      // 1. Create the document CI
      // Determine scope based on context: product_document when in device, company_document otherwise
      const scope = productId ? 'product_document' : 'company_document';
      const docId = await DocumentCreationService.createDocument({
        name: docName.trim(),
        documentType: docType,
        scope,
        companyId,
        productId,
        status: 'Draft',
        silent: true,
      });

      if (!docId) {
        toast.error('Failed to create document');
        return;
      }

      // 2. Call AI to draft content
      try {
        const prompt = `Draft a ${docType} for a medical device to address the requirement:
Framework: ${gapContext.framework}
Clause: ${gapContext.section} - ${gapContext.clauseTitle}

The document should provide comprehensive coverage of this regulatory requirement,
following ISO 13485 and applicable standards. Include sections for purpose, scope,
responsibilities, procedure, and records as appropriate.`;

        const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-content-generator', {
          body: {
            prompt,
            context: `Regulatory framework: ${gapContext.framework}, Section: ${gapContext.section}`,
            outputFormat: 'html',
          },
        });

        if (!aiError && aiData?.content) {
          // Save AI content as description (brief_summary) on the document
          await supabase
            .from('phase_assigned_document_template')
            .update({ brief_summary: aiData.content })
            .eq('id', docId);
        }
      } catch (aiErr) {
        console.warn('AI drafting failed, document created without content:', aiErr);
      }

      toast.success(`Document "${docName}" created and drafted`);
      onCreated?.(docId);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Create doc from gap failed:', err);
      toast.error(err.message || 'Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Create & Draft with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Context preview */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              AI Context
            </p>
            <p className="text-xs text-foreground">
              <span className="font-medium">{gapContext.framework}</span> — {gapContext.section}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {gapContext.clauseTitle}
            </p>
          </div>

          {/* Document name */}
          <div className="space-y-1.5">
            <Label className="text-sm">Document Name</Label>
            <Input
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder="Enter document name..."
              className="text-sm"
            />
          </div>

          {/* Document type */}
          <div className="space-y-1.5">
            <Label className="text-sm">Document Type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isCreating || !docName.trim()}
            className="gap-1.5"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Create & Draft
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
