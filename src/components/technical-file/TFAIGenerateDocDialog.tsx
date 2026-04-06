import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileEdit, Loader2 } from 'lucide-react';
import { DocumentStudioPersistenceService } from '@/services/documentStudioPersistenceService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductDataProps {
  name?: string | null;
  trade_name?: string | null;
  description?: string | null;
  device_summary?: string | null;
  class?: string | null;
  intended_use?: string | null;
  intended_purpose_data?: any;
  basic_udi_di?: string | null;
  udi_di?: string | null;
  device_category?: string | null;
  conformity_assessment_route?: string | null;
  notified_body?: string | null;
  manufacturer?: string | null;
  ec_certificate?: string | null;
  article_number?: string | null;
  version?: string | null;
}

interface CompanyDataProps {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  contact_person?: string | null;
  ar_name?: string | null;
  ar_address?: string | null;
  ar_city?: string | null;
  ar_country?: string | null;
  ar_postal_code?: string | null;
  srn?: string | null;
}

interface TFAIGenerateDocDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  substepDescription: string;
  sectionId: string;
  substepLetter: string;
  companyId: string;
  companyName: string;
  productId: string;
  productData?: ProductDataProps;
  companyData?: CompanyDataProps;
  onDocumentCreated: (docId: string, docName: string, docType: string) => void;
}

function buildContextBlock(companyData?: CompanyDataProps, productData?: ProductDataProps): string {
  const lines: string[] = [];

  if (companyData) {
    lines.push('=== Manufacturer Information ===');
    if (companyData.name) lines.push(`Manufacturer Name: ${companyData.name}`);
    const addrParts = [companyData.address, companyData.postal_code, companyData.city, companyData.country].filter(Boolean);
    if (addrParts.length) lines.push(`Address: ${addrParts.join(', ')}`);
    if (companyData.contact_person) lines.push(`Contact Person: ${companyData.contact_person}`);
    if (companyData.srn) lines.push(`SRN (Single Registration Number): ${companyData.srn}`);
    if (companyData.ar_name) {
      lines.push('--- Authorized Representative ---');
      lines.push(`AR Name: ${companyData.ar_name}`);
      const arAddr = [companyData.ar_address, companyData.ar_postal_code, companyData.ar_city, companyData.ar_country].filter(Boolean);
      if (arAddr.length) lines.push(`AR Address: ${arAddr.join(', ')}`);
    }
    lines.push('');
  }

  if (productData) {
    lines.push('=== Device Information ===');
    if (productData.name) lines.push(`Product Name: ${productData.name}`);
    if (productData.trade_name) lines.push(`Trade Name: ${productData.trade_name}`);
    if (productData.description) lines.push(`Description: ${productData.description}`);
    if (productData.device_summary) lines.push(`Device Summary: ${productData.device_summary}`);
    if (productData.class) lines.push(`Risk Class: ${productData.class}`);
    if (productData.device_category) lines.push(`Device Category: ${productData.device_category}`);
    if (productData.intended_use) lines.push(`Intended Use: ${productData.intended_use}`);
    if (productData.basic_udi_di) lines.push(`Basic UDI-DI: ${productData.basic_udi_di}`);
    if (productData.udi_di) lines.push(`UDI-DI: ${productData.udi_di}`);
    if (productData.conformity_assessment_route) lines.push(`Conformity Assessment Route: ${productData.conformity_assessment_route}`);
    if (productData.notified_body) lines.push(`Notified Body: ${productData.notified_body}`);
    if (productData.ec_certificate) lines.push(`EC Certificate: ${productData.ec_certificate}`);
    if (productData.article_number) lines.push(`Article/Catalog Number: ${productData.article_number}`);
    if (productData.version) lines.push(`Version: ${productData.version}`);
    lines.push('');
  }

  return lines.length > 0 ? lines.join('\n') : '';
}

export function TFAIGenerateDocDialog({
  open,
  onOpenChange,
  substepDescription,
  sectionId,
  substepLetter,
  companyId,
  companyName,
  productId,
  productData,
  companyData,
  onDocumentCreated,
}: TFAIGenerateDocDialogProps) {
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');

  const templateKey = `TF-${sectionId}-${substepLetter}`;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Step 1: Create initial draft record
      setStatusText('Creating draft...');
      const documentData = {
        company_id: companyId,
        product_id: productId,
        template_id: templateKey,
        name: substepDescription,
        type: 'technical-file',
        sections: [
          {
            id: 'section-1',
            title: substepDescription,
            content: [
              {
                id: 'content-1',
                type: 'paragraph',
                content: '*[To be completed]*',
              },
            ],
          },
        ],
        metadata: {
          source: 'technical-file',
          sectionId,
          substepLetter,
          description: substepDescription,
          additionalInstructions: instructions || undefined,
        },
      };

      const saveResult = await DocumentStudioPersistenceService.saveTemplate(documentData);
      if (!saveResult.success) {
        toast.error('Failed to create document draft');
        return;
      }

      // Step 2: Call AI content generator with enriched context
      setStatusText(`Generating ${substepDescription}...`);
      const contextBlock = buildContextBlock(companyData, productData);

      const aiPrompt = `Generate comprehensive content for a medical device Technical File section.

Section: ${sectionId} - ${substepDescription}

This is part of the MDR Technical Documentation (EU Medical Device Regulation).

${contextBlock ? `Use the following real product and manufacturer data — do NOT use placeholders like [Manufacturer Name] or [Device Name]. Insert the actual values provided below:\n\n${contextBlock}` : `Company: ${companyName}`}

${instructions ? `Additional instructions from the user:\n${instructions}\n` : ''}

Please generate detailed, professional content appropriate for this technical file section. Include relevant regulatory references and structured subsections. Use the actual manufacturer and device data provided above throughout the document.`;

      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          prompt: aiPrompt,
          sectionTitle: substepDescription,
          currentContent: '',
          companyId,
        },
      });

      if (aiError) {
        console.error('TFAIGenerateDocDialog: AI generation error:', aiError);
        toast.error('AI generation failed, but draft was created');
      }

      // Step 3: Update draft with generated content
      let generatedContent = aiData?.content || aiData?.generatedContent || '';
      if (generatedContent) {
        generatedContent = generatedContent.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();

        const updatedData = {
          ...documentData,
          sections: [
            {
              id: 'section-1',
              title: substepDescription,
              content: [
                {
                  id: 'content-1',
                  type: 'paragraph',
                  content: generatedContent,
                  isAIGenerated: true,
                  metadata: {
                    author: 'ai',
                    aiUsed: true,
                    generatedAt: new Date().toISOString(),
                  },
                },
              ],
            },
          ],
        };

        await DocumentStudioPersistenceService.saveTemplate(updatedData);
      }

      // Step 4: Create/find CI record
      setStatusText('Linking document...');
      let ciDocId = templateKey;

      const { data: existingCI } = await supabase
        .from('phase_assigned_document_template')
        .select('id')
        .eq('company_id', companyId)
        .eq('product_id', productId)
        .eq('document_reference', templateKey)
        .maybeSingle();

      if (existingCI) {
        ciDocId = existingCI.id;
      } else {
        const { data: phaseData } = await supabase
          .from('lifecycle_phases')
          .select('id')
          .eq('product_id', productId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (phaseData?.id) {
          const { data: newCI, error: ciError } = await supabase
            .from('phase_assigned_document_template')
            .insert([{
              company_id: companyId,
              product_id: productId,
              phase_id: phaseData.id,
              name: substepDescription,
              document_type: 'technical-file',
              document_reference: templateKey,
              status: 'draft',
            }])
            .select('id')
            .single();

          if (!ciError && newCI) {
            ciDocId = newCI.id;
          }
        }
      }

      // Step 5: Link to technical file section
      await supabase
        .from('technical_file_document_links')
        .upsert(
          {
            product_id: productId,
            section_id: sectionId,
            document_id: ciDocId,
          },
          { onConflict: 'product_id,section_id,document_id' }
        );

      // Done - open the drawer
      onOpenChange(false);
      setInstructions('');
      onDocumentCreated(ciDocId, substepDescription, 'technical-file');
      toast.success(generatedContent
        ? 'Document generated — review and edit in the side panel'
        : 'Draft created — use AI Auto-Fill to generate content');
    } catch (error) {
      console.error('TFAIGenerateDocDialog: Error:', error);
      toast.error('Failed to generate document');
    } finally {
      setIsGenerating(false);
      setStatusText('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-primary" />
            Create {substepDescription}
          </DialogTitle>
          <DialogDescription>
            AI will generate draft content for this technical file section using your product and manufacturer data, then open it in the side editor for review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ai-instructions" className="text-sm">
              Additional Instructions (optional)
            </Label>
            <Textarea
              id="ai-instructions"
              placeholder="E.g. Focus on MDR Class IIa requirements, include references to harmonised standards..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {statusText || 'Generating...'}
              </>
            ) : (
              <>
                <FileEdit className="h-4 w-4" />
                Create Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
