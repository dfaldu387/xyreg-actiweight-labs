
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Users } from 'lucide-react';

interface DocumentActionMenuProps {
  onEdit: () => void;
  onAssignReviewers: () => void;
  disabled?: boolean;
  documentType?: 'product-specific' | 'template-instance' | 'gap-analysis-item';
  isDefaultDocument?: boolean;
}

export function DocumentActionMenu({ 
  onEdit, 
  onAssignReviewers, 
  disabled = false,
  documentType = 'product-specific',
  isDefaultDocument = false
}: DocumentActionMenuProps) {
  const getEditLabel = () => {
    switch (documentType) {
      case 'template-instance':
        return 'Edit Instance';
      case 'gap-analysis-item':
        return 'Edit Item';
      default:
        return 'Edit Document';
    }
  };

  // For gap analysis items, only show the assign reviewers option
  if (documentType === 'gap-analysis-item') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onAssignReviewers}
        disabled={disabled}
        className="flex items-center gap-1"
      >
        <Users className="h-4 w-4" />
        Assign Reviewers
      </Button>
    );
  }

  // For template instances (CI instances), only show edit action
  // Reviewer groups are assigned within the Edit Instance dialog
  if (documentType === 'template-instance') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        disabled={disabled}
        className="flex !bg-white items-center gap-1"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    );
  }

  // For product-specific documents, show both edit and assign reviewers
  const handleEdit = () => {
    onEdit();
  };

  const handleAssignReviewers = () => {
    onAssignReviewers();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          {getEditLabel()}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAssignReviewers}>
          <Users className="h-4 w-4 mr-2" />
          Assign Reviewers
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
