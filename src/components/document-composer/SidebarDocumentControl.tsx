import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { useDocumentAuthors } from '@/hooks/useDocumentAuthors';
import { DocumentControl } from '@/types/documentComposer';

interface SidebarDocumentControlProps {
  documentControl?: Partial<DocumentControl>;
  onFieldChange: (field: string, value: string) => void;
  companyId: string;
}

export function SidebarDocumentControl({
  documentControl,
  onFieldChange,
  companyId,
}: SidebarDocumentControlProps) {
  const { authors, isLoading } = useDocumentAuthors(companyId);

  if (!documentControl) return null;

  const roleFields = [
    { key: 'preparedBy', label: 'Issued By', value: documentControl.preparedBy?.name },
    { key: 'reviewedBy', label: 'Reviewed By', value: documentControl.reviewedBy?.name },
    { key: 'approvedBy', label: 'Approved By', value: documentControl.approvedBy?.name },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Document Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* SOP Number */}
        {documentControl.sopNumber && (
          <div>
            <Label className="text-xs text-muted-foreground">SOP Number</Label>
            <p className="text-sm font-medium">{documentControl.sopNumber}</p>
          </div>
        )}

        {/* Document Title */}
        {documentControl.documentTitle && (
          <div>
            <Label className="text-xs text-muted-foreground">Document Title</Label>
            <p className="text-sm font-medium truncate">{documentControl.documentTitle}</p>
          </div>
        )}

        {/* Document Owner */}
        <div>
          <Label className="text-xs text-muted-foreground">Document Owner</Label>
          <Select
            value={documentControl.documentOwner || ''}
            onValueChange={(val) => onFieldChange('documentOwner', val)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              {authors.map((author) => (
                <SelectItem key={author.id} value={author.name}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prepared / Reviewed / Approved By */}
        {roleFields.map(({ key, label, value }) => (
          <div key={key}>
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Select
              value={value || ''}
              onValueChange={(val) => onFieldChange(`${key}.name`, val)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {authors.map((author) => (
                  <SelectItem key={author.id} value={author.name}>
                    {author.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
