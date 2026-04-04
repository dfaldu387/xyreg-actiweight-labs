import React, { useState } from 'react';
import { DocumentControl } from '@/types/documentComposer';
import { format } from 'date-fns';
import { useDocumentAuthors, AuthorOption } from '@/hooks/useDocumentAuthors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SOPDocumentHeaderProps {
  documentControl?: DocumentControl;
  companyName?: string;
  className?: string;
  companyId?: string;
  companyLogoUrl?: string;
  onFieldChange?: (field: string, value: string) => void;
}


const safeFormat = (date: any, fmt: string) => {
  try {
    if (!date) return 'Not set';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'Not set';
    return format(d, fmt);
  } catch {
    return 'Not set';
  }
};

function UserSelect({ 
  value, 
  authors, 
  placeholder, 
  onSelect 
}: { 
  value?: string; 
  authors: AuthorOption[]; 
  placeholder: string;
  onSelect: (name: string) => void;
}) {
  return (
    <Select value={value || ''} onValueChange={onSelect}>
      <SelectTrigger className="h-7 text-xs w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {authors.map((author) => (
          <SelectItem key={author.id} value={author.name}>
            <span className="text-xs">{author.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SOPDocumentHeader({ documentControl, companyName, className = '', companyId, companyLogoUrl, onFieldChange }: SOPDocumentHeaderProps) {
  const { authors } = useDocumentAuthors(companyId || '');

  if (!documentControl) {
    return null;
  }

  return (
    <div className={`bg-white border-2 border-gray-300 mb-6 ${className}`}>
      {/* Header with company name and document control info */}
      <div className="bg-gray-100 p-4 border-b border-gray-300">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {companyLogoUrl && (
              <img
                src={companyLogoUrl}
                alt={companyName || 'Company logo'}
                className="h-10 w-auto max-w-[80px] object-contain"
              />
            )}
            <span className="font-bold text-lg text-gray-800">
              {companyName || 'Company Name'}
            </span>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">Document Control</div>
            <div>SOP Number: {documentControl.sopNumber}</div>
            {/* <div>Version: {documentControl.version}</div> */}
          </div>
        </div>
      </div>

      {/* Document title */}
      <div className="p-4 text-center border-b border-gray-300">
        <h1 className="text-xl font-bold text-gray-800">
          {documentControl.documentTitle}
        </h1>
      </div>

      {/* Document information table */}
      <div className="p-4">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <tbody>
            <tr>
              <td className="border border-gray-300 bg-gray-50 px-3 py-2 font-semibold w-1/4">
                Effective Date:
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {safeFormat(documentControl.effectiveDate, 'dd MMMM yyyy')}
              </td>
              <td className="border border-gray-300 bg-gray-50 px-3 py-2 font-semibold w-1/4">
                Next Review Date:
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {documentControl.nextReviewDate ? (
                  <span>{safeFormat(documentControl.nextReviewDate, 'dd MMMM yyyy')}</span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Not set</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 bg-gray-50 px-3 py-2 font-semibold">
                Document Owner:
              </td>
              <td className="border border-gray-300 px-3 py-2" colSpan={3}>
                {documentControl.documentOwner ? (
                  <div className="flex items-center gap-2">
                    <span>{documentControl.documentOwner}</span>
                    <button 
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={() => onFieldChange?.('documentOwner', '')}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <UserSelect
                    authors={authors}
                    placeholder="Select document owner..."
                    onSelect={(name) => onFieldChange?.('documentOwner', name)}
                  />
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Approval section */}
      <div className="p-4 border-t border-gray-300">
        <div className="grid grid-cols-3 gap-4">
          {/* Issued By */}
          <div className="text-center">
            <div className="border border-gray-300 bg-gray-50 p-2 font-semibold text-sm">
              Issued By
            </div>
            <div className="border border-gray-300 border-t-0 p-4 h-24 flex flex-col justify-between">
              <div className="text-xs">
                {documentControl.preparedBy?.name ? (
                  <div className="flex items-center justify-center gap-1">
                    <span>{documentControl.preparedBy.name}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground underline"
                      onClick={() => onFieldChange?.('preparedBy.name', '')}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <UserSelect
                    authors={authors}
                    placeholder="Select..."
                    onSelect={(name) => onFieldChange?.('preparedBy.name', name)}
                  />
                )}
                <div className="text-gray-600">{documentControl.preparedBy?.title || '[Title]'}</div>
              </div>
              <div className="text-xs text-gray-600">
                Date: {safeFormat(documentControl.preparedBy?.date, 'dd MMMM yyyy')}
              </div>
            </div>
          </div>
          
          {/* Reviewed By */}
          <div className="text-center">
            <div className="border border-gray-300 bg-gray-50 p-2 font-semibold text-sm">
              Reviewed By
            </div>
            <div className="border border-gray-300 border-t-0 p-4 h-24 flex flex-col justify-between">
              <div className="text-xs">
                {documentControl.reviewedBy?.name ? (
                  <div className="flex items-center justify-center gap-1">
                    <span>{documentControl.reviewedBy.name}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground underline"
                      onClick={() => onFieldChange?.('reviewedBy.name', '')}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <UserSelect
                    authors={authors}
                    placeholder="Select..."
                    onSelect={(name) => onFieldChange?.('reviewedBy.name', name)}
                  />
                )}
                <div className="text-gray-600">{documentControl.reviewedBy?.title || '[Title]'}</div>
              </div>
              <div className="text-xs text-gray-600">
                Date: {safeFormat(documentControl.reviewedBy?.date, 'dd MMMM yyyy')}
              </div>
            </div>
          </div>
          
          {/* Approved By */}
          <div className="text-center">
            <div className="border border-gray-300 bg-gray-50 p-2 font-semibold text-sm">
              Approved By
            </div>
            <div className="border border-gray-300 border-t-0 p-4 h-24 flex flex-col justify-between">
              <div className="text-xs">
                {documentControl.approvedBy?.name ? (
                  <div className="flex items-center justify-center gap-1">
                    <span>{documentControl.approvedBy.name}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground underline"
                      onClick={() => onFieldChange?.('approvedBy.name', '')}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <UserSelect
                    authors={authors}
                    placeholder="Select..."
                    onSelect={(name) => onFieldChange?.('approvedBy.name', name)}
                  />
                )}
                <div className="text-gray-600">{documentControl.approvedBy?.title || '[Title]'}</div>
              </div>
              <div className="text-xs text-gray-600">
                Date: {safeFormat(documentControl.approvedBy?.date, 'dd MMMM yyyy')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
