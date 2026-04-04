import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Shield,
  Building,
  Package,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { TEMPLATE_CATEGORIES } from '@/types/templateManagement';
import { DocumentContentViewer } from './DocumentContentViewer';
import { DocumentTemplateFileService } from '@/services/documentTemplateFileService';
import { SuperAdminTemplateManagementService } from '@/services/superAdminTemplateManagementService';
import { toast } from 'sonner';

interface TemplateViewDialogProps {
  template: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateViewDialog({
  template,
  isOpen,
  onClose
}: TemplateViewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!template) return null;

  const isSaasTemplate = template.source === 'saas';
  const hasFile = template.file_path;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!template.file_path) {
      toast.error('No file available for download');
      return;
    }

    setIsDownloading(true);
    try {
      try {
        await SuperAdminTemplateManagementService.downloadTemplateFile(
          template.file_path, 
          template.file_name || 'template'
        );
        toast.success('Template downloaded successfully');
      } catch (firstError) {
        await DocumentTemplateFileService.downloadFile(
          template.file_path, 
          template.file_name || 'template'
        );
        toast.success('Template downloaded successfully');
      }
    } catch (error) {
      toast.error('Failed to download template. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="space-y-4">
            {/* Source & Scope Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {isSaasTemplate && (
                <Badge variant="secondary" className="text-sm">
                  <Shield className="h-3 w-3 mr-1" />
                  SaaS Template
                </Badge>
              )}
              {template.scope && (
                <Badge variant="outline" className="text-sm">
                  {template.scope === 'company' ? (
                    <><Building className="h-3 w-3 mr-1" />Company-wide</>
                  ) : template.scope === 'product' ? (
                    <><Package className="h-3 w-3 mr-1" />Product-specific</>
                  ) : template.scope === 'both' ? (
                    <>Company & Product</>
                  ) : null}
                </Badge>
              )}
              {template.document_type && (
                <Badge variant="outline" className="text-sm">
                  {template.document_type}
                </Badge>
              )}
              {template.category && (
                <Badge variant="outline" className="text-sm">
                  {template.category}
                </Badge>
              )}
            </div>

            {/* Description */}
            {template.description && (
              <div>
                <h4 className="font-medium text-sm mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {template.description}
                </p>
              </div>
            )}

            {/* Regulatory References - show if available */}
            {template.regulatory_references && (
              <div>
                <h4 className="font-medium text-sm mb-2">Regulatory References</h4>
                <p className="text-sm text-muted-foreground">
                  {template.regulatory_references}
                </p>
              </div>
            )}

            {/* Template Sections - show if available */}
            {template.sections && Array.isArray(template.sections) && template.sections.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Template Sections</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  {template.sections.map((section: any, index: number) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-xs font-mono text-muted-foreground/60 mt-0.5">{index + 1}.</span>
                      <span>{typeof section === 'string' ? section : section.title || section.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Template Structure Content */}
            {template.structure?.sections && Array.isArray(template.structure.sections) && template.structure.sections.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Document Structure</h4>
                <div className="space-y-3">
                  {template.structure.sections.map((section: any, idx: number) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-3">
                      <h5 className="font-medium text-sm">{section.name || section.title}</h5>
                      {section.description && (
                        <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                      )}
                      {section.fields?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {section.fields.map((field: any, fIdx: number) => (
                            <div key={fIdx} className="text-xs flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{field.type}</Badge>
                              <span>{field.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Classification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {template.template_scope && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Scope</h4>
                  <Badge variant="outline" className="text-sm">
                    {template.template_scope === 'company-wide' ? (
                      <><Building className="h-3 w-3 mr-1" />Company-wide</>
                    ) : (
                      <><Package className="h-3 w-3 mr-1" />Product-specific</>
                    )}
                  </Badge>
                </div>
              )}
              
              {template.template_category && TEMPLATE_CATEGORIES[template.template_category] && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Category</h4>
                  <Badge variant="secondary" className="text-sm">
                    {TEMPLATE_CATEGORIES[template.template_category].label}
                  </Badge>
                </div>
              )}
            </div>

            {/* File Information */}
            {hasFile && (
              <div>
                <h4 className="font-medium text-sm mb-2">File Information</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">
                      {template.file_name || 'Template file'}
                    </span>
                  </div>
                  {template.file_size && (
                    <div className="text-sm text-muted-foreground">
                      Size: {(template.file_size / 1024).toFixed(1)} KB
                    </div>
                  )}
                  {template.file_type && (
                    <div className="text-sm text-muted-foreground">
                      Type: {template.file_type}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No file message for SaaS templates */}
            {!hasFile && isSaasTemplate && (
              <div className="bg-muted/30 border border-dashed rounded-lg p-4 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  This is a SaaS template definition. Create a compliance instance from this template to start working on the document.
                </p>
              </div>
            )}

            {/* Metadata */}
            <div>
              <h4 className="font-medium text-sm mb-2">Metadata</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Created: {format(new Date(template.created_at), 'MMM d, yyyy')}
                </div>
                {template.updated_at && template.updated_at !== template.created_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Updated: {format(new Date(template.updated_at), 'MMM d, yyyy')}
                  </div>
                )}
                {template.uploaded_by && (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Uploaded by: {template.uploaded_by}
                  </div>
                )}
              </div>
            </div>

            {/* Category Description */}
            {template.template_category && TEMPLATE_CATEGORIES[template.template_category] && (
              <div>
                <h4 className="font-medium text-sm mb-2">Category Information</h4>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    {TEMPLATE_CATEGORIES[template.template_category].description}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Examples:</strong> {TEMPLATE_CATEGORIES[template.template_category].examples.join(', ')}
                  </div>
                </div>
              </div>
            )}

            {/* Document Preview */}
            {hasFile && (
              <DocumentContentViewer
                filePath={template.file_path}
                fileName={template.file_name || 'template'}
                fileType={template.file_type}
                className="pt-4 border-t"
              />
            )}
          </div>

          {/* Actions */}
          {hasFile && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button 
                onClick={handleDownload} 
                className="flex-1"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}