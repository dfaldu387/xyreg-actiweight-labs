import React, { useState } from 'react';
import { Lock, Package, Info, Tag, Calendar, ShieldCheck, Building2, FileText, Sparkles, Search, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductContext } from '@/types/documentComposer';
import { useCompanyProductSelection } from '@/hooks/useCompanyProductSelection';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useDefaultDocumentTemplates } from '@/hooks/useDefaultDocumentTemplates';
import { HardcodedTemplateService } from '@/services/hardcodedTemplateService';
import { SmartSuggestionsPanel } from './SmartSuggestionsPanel';

import { AIStatusIndicator } from './AIStatusIndicator';
import { TemplateBrowserModal } from './TemplateBrowserModal';
import { SidebarReferenceDocuments } from './SidebarReferenceDocuments';
import { SOPDocumentContentService } from '../../services/sopDocumentContentService';
import { DocFileUpload } from './DocFileUpload';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { SidebarDocumentControl } from './SidebarDocumentControl';
import { VVPlanSidebarCard } from './VVPlanSidebarCard';

export interface ControlPanelProps {
  productContext?: ProductContext;
  documentType?: string;
  className?: string;
  isLocked?: boolean;
  initialScope?: 'company' | 'product';
  initialProductId?: string;
  createNew?: boolean;
  docName?: string | null;
  onSelectionChange?: (selection: {
    scope: 'company' | 'product';
    productId?: string;
    templateId?: string;
  }) => void;
  onGenerateDocument?: (sopTemplate?: any) => void;
  onFileUploaded?: (fileInfo: { filePath: string; fileName: string; fileSize?: number } | null) => void;
  isGenerating?: boolean;
  template?: any;
  smartData?: {
    populatedFields: string[];
    missingDataIndicators: any[];
    suggestions: string[];
    completionPercentage: number;
  };
  onRoleMappingsUpdated?: (mappings: any[]) => void;
  onContentEnhancement?: (suggestion: any) => void;
  onViewReferenceDocument?: (url: string, fileName: string) => void;
  onDocumentControlChange?: (field: string, value: string) => void;
  selectedReferenceIds?: string[];
  onReferenceSelectionChange?: (ids: string[]) => void;
  disabled?: boolean;
}

export function ControlPanel({
  productContext,
  documentType,
  className = '',
  isLocked = false,
  initialScope,
  initialProductId,
  createNew = false,
  docName,
  onSelectionChange,
  onGenerateDocument,
  isGenerating = false,
  onFileUploaded,
  template,
  smartData,
  onRoleMappingsUpdated,
  onContentEnhancement,
  onViewReferenceDocument,
  onDocumentControlChange,
  selectedReferenceIds,
  onReferenceSelectionChange,
  disabled = false
}: ControlPanelProps) {
  const { lang } = useTranslation();
  const { activeCompanyRole } = useCompanyRole();
  const companyId = activeCompanyRole?.companyId || 'temp-company-id';
  const [scope, setScope] = useState<'company' | 'product'>(initialScope || 'company');
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateBrowserOpen, setTemplateBrowserOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);

  const { products } = useCompanyProductSelection(activeCompanyRole?.companyId || '');

  // Fetch actual templates from company settings instead of using mock data
  const { templates, isLoading: templatesLoading } = useDefaultDocumentTemplates();

  // Get hardcoded templates
  const hardcodedTemplates = scope === 'company'
    ? HardcodedTemplateService.getCompanyWideTemplates()
    : HardcodedTemplateService.getProductSpecificTemplates();

  // Convert database templates to the format expected by the dropdown
  const databaseTemplates = templates.map(template => ({
    id: template.id,
    name: template.name,
    hasFile: Boolean(template.file_path || template.public_url),
    source: 'database' as const
  }));

  // Convert hardcoded templates to the format expected by the dropdown
  const hardcodedTemplateOptions = hardcodedTemplates.map(template => ({
    id: template.id,
    name: template.name,
    hasFile: false,
    source: 'hardcoded' as const
  }));

  // Combine all templates - hardcoded first for priority
  const availableTemplates = [...hardcodedTemplateOptions, ...databaseTemplates];

  const handleScopeChange = (newScope: 'company' | 'product') => {
    setScope(newScope);
    if (newScope === 'company') {
      setSelectedProductId('');
    }
    onSelectionChange?.({
      scope: newScope,
      productId: newScope === 'product' ? selectedProductId : undefined,
      templateId: selectedTemplateId
    });
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    onSelectionChange?.({
      scope,
      productId: scope === 'product' ? productId : undefined,
      templateId: selectedTemplateId
    });
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    onSelectionChange?.({
      scope,
      productId: scope === 'product' ? selectedProductId : undefined,
      templateId
    });
  };

  const handleTemplateBrowserSelection = async (document: any) => {
    // If this is a SOP document from the database, load its content
    if (document.document_type === 'SOP' && document.id) {
      try {
        // Notify parent of file info if the SOP has an attached file
        if (document.file_path || document.public_url) {
          onFileUploaded?.({
            filePath: document.file_path || document.public_url,
            fileName: document.file_name || document.name,
            fileSize: document.file_size
          });
        }

        // Extract content from the SOP document
        const sopContent = await SOPDocumentContentService.extractContentFromSOP(document.id);
        if (sopContent) {
          // Convert SOP content to template format
          const template = SOPDocumentContentService.convertSOPToTemplate(sopContent);

          // Pass the template to the parent component
          onGenerateDocument?.(template);

          // Close the template browser
          setTemplateBrowserOpen(false);

          return;
        } else {
          console.error('SOP content extraction failed - no content returned');
        }
      } catch (error) {
        console.error('Error loading SOP content:', error);
        // Fall back to the original behavior
      }
    }

    // Fallback: Find the template that matches the selected document
    const matchingTemplate = availableTemplates.find(template =>
      template.name.toLowerCase().includes(document.name?.toLowerCase() || '') ||
      document.name?.toLowerCase().includes(template.name.toLowerCase())
    );

    if (matchingTemplate) {
      handleTemplateChange(matchingTemplate.id);
    }
  };

  const handleFileUpload = (file: File | null, filePath?: string) => {

    if (file && filePath) {
      setUploadedFile(file);
      setUploadedFilePath(filePath);

      // Notify parent of file info
      onFileUploaded?.({ filePath, fileName: file.name, fileSize: file.size });

      // Process the uploaded document similar to SOP selection
      processUploadedDocument(file, filePath);
    } else if (file === null) {
      // File was removed
      setUploadedFile(null);
      setUploadedFilePath(null);
      onFileUploaded?.(null);
    }
  };

  const processUploadedDocument = async (file: File, filePath: string) => {
    try {

      // Create a template structure from the uploaded document

      
      // Pass the template to the parent component for AI processing
      const sopContent = await SOPDocumentContentService.extractContentFromSOPFromUploadedDocument(filePath, file.name, file.size);
      if (sopContent) {
        const template = SOPDocumentContentService.convertSOPToTemplate(sopContent);
        // console.log('Converted SOP template:', template);
        onGenerateDocument?.(template);
        setUploadModalOpen(false);
      }
      // console.log('SOP Content:', sopContent);


      // Close the upload modal

    } catch (error) {
      console.error('Error processing uploaded document:', error);
    }
  };

  const getRiskClassColor = (riskClass: string) => {
    switch (riskClass.toLowerCase()) {
      case 'class i':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'class ii':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'class iii':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`border-r bg-muted/30 overflow-hidden flex flex-col h-full ${className}`} data-tour="use-template">
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {isLocked ? <Lock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          {lang('draftStudio.controlPanel.documentConfiguration')}
        </div>

        {/* Document Control (SOP Header fields) */}
        {template?.documentControl && onDocumentControlChange && (
          <SidebarDocumentControl
            documentControl={template.documentControl}
            onFieldChange={onDocumentControlChange}
            companyId={companyId}
          />
        )}

        {/* Selection Controls (when not locked) */}
        {!isLocked && (
          <>
            {/* Scope Selection */}
            <Card>
              <CardContent className="pt-4">
                <Select value={scope} onValueChange={handleScopeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={lang('draftStudio.controlPanel.selectScope')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">{lang('draftStudio.controlPanel.companyWide')}</SelectItem>
                    <SelectItem value="product">{lang('draftStudio.controlPanel.productSpecific')}</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Product Selection (when product specific) */}
            {scope === 'product' && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    {lang('draftStudio.controlPanel.selectProduct')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select value={selectedProductId} onValueChange={handleProductChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={lang('draftStudio.controlPanel.selectProductPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Template Selection removed — functionality moved to + Add Document modal */}

            <Separator className="my-2" />
          </>
        )}

        {/* Product Information Card (when locked or product selected) */}
        {productContext?.name && (isLocked || (scope === 'product' && selectedProductId)) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                {lang('draftStudio.controlPanel.productDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground">{productContext?.name || lang('draftStudio.controlPanel.product')}</h3>
                {productContext?.description && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {productContext.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{lang('draftStudio.controlPanel.riskClass')}</span>
                  <Badge className={getRiskClassColor(productContext?.riskClass)}>
                    {productContext?.riskClass || lang('common.unknown')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{lang('draftStudio.controlPanel.phase')}</span>
                  <Badge variant="outline" className="text-xs">
                    {productContext?.phase || lang('common.unknown')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Regulatory Requirements */}
        {productContext?.regulatoryRequirements && productContext?.regulatoryRequirements.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {lang('draftStudio.controlPanel.regulatoryRequirements')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {productContext?.regulatoryRequirements?.map((requirement, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs mr-1 mb-1"
                  >
                    {requirement}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* V&V Plan Details Card - shown when editing a V&V Plan */}
        {template?.metadata?.source === 'vv-plan' && (
          <VVPlanSidebarCard metadata={template.metadata} />
        )}

        {/* Reference Documents */}
        <SidebarReferenceDocuments
          companyId={companyId}
          onViewDocument={onViewReferenceDocument}
          selectedIds={selectedReferenceIds}
          onSelectionChange={onReferenceSelectionChange}
        />

        {/* AI Status Indicator - Always visible */}
        <AIStatusIndicator />

        <Separator />

        {/* Generate Document Button - only show when template is selected */}
        {/* {template && onGenerateDocument && (
        <Button 
          onClick={onGenerateDocument}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Document'}
        </Button>
      )} */}


        {/* Smart Suggestions Panel */}
        {smartData && (
          <SmartSuggestionsPanel
            missingData={smartData.missingDataIndicators}
            populatedFields={smartData.populatedFields}
            completionPercentage={smartData.completionPercentage}
            suggestions={smartData.suggestions}
            companyId={companyId}
            templateContent={JSON.stringify(template)}
            onDataUpdated={() => { }}
            onContentEnhancement={onContentEnhancement}
          />
        )}

        {/* AI Assistant Info */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">{lang('draftStudio.controlPanel.aiCoauthorActive')}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang('draftStudio.controlPanel.aiCoauthorDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Document Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{lang('draftStudio.controlPanel.uploadModalTitle')}</DialogTitle>
            <DialogDescription>
              {lang('draftStudio.controlPanel.uploadModalDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <DocFileUpload
              onFileChange={handleFileUpload}
              disabled={false}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                {lang('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Browser Modal */}
      <TemplateBrowserModal
        open={templateBrowserOpen}
        onOpenChange={setTemplateBrowserOpen}
        onSelectDocument={handleTemplateBrowserSelection}
        availableTemplateNames={availableTemplates.map(t => t.name)}
      />
    </div>
  );
}