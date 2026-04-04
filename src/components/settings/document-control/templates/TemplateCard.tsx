import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Shield,
  Building,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { TEMPLATE_CATEGORIES } from '@/types/templateManagement';

interface TemplateCardProps {
  template: any; // Simplified to any for now
  onDelete?: (id: string) => void;
}

export function TemplateCard({
  template,
  onDelete
}: TemplateCardProps) {
  const isSaasTemplate = template.source === 'saas';
  const hasFile = template.file_path;

  const handleDownload = () => {
    if (template.file_path) {
      // Create download link
      const link = document.createElement('a');
      link.href = template.file_path;
      link.download = template.file_name || 'template';
      link.click();
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <h3 className="font-medium text-sm">{template.name}</h3>
              {template.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {template.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {isSaasTemplate && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                SaaS
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Classification Badges */}
          <div className="flex flex-wrap gap-2">
            {/* Template Scope */}
            {template.template_scope && (
              <Badge variant="outline" className="text-xs">
                {template.template_scope === 'company-wide' ? (
                  <>
                    <Building className="h-3 w-3 mr-1" />
                    Company-wide
                  </>
                ) : (
                  <>
                    <Package className="h-3 w-3 mr-1" />
                    Product-specific
                  </>
                )}
              </Badge>
            )}
            
            {/* Template Category */}
            {template.template_category && TEMPLATE_CATEGORIES[template.template_category] && (
              <Badge variant="secondary" className="text-xs">
                {TEMPLATE_CATEGORIES[template.template_category].label}
              </Badge>
            )}
            
            {/* Document Type */}
            {template.document_type && (
              <Badge variant="outline" className="text-xs">
                {template.document_type}
              </Badge>
            )}
          </div>

          {/* File info */}
          {hasFile && (
            <div className="text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {template.file_name || 'Template file'}
                {template.file_size && (
                  <span className="ml-2">
                    ({(template.file_size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Dates */}
          <div className="text-xs text-muted-foreground">
            <div>Created: {format(new Date(template.created_at), 'MMM d, yyyy')}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {hasFile && (
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            )}

            {!isSaasTemplate && onDelete && (
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => onDelete(template.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}