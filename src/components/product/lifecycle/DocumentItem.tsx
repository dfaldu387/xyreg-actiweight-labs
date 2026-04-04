
import React from 'react';
import { FileText, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PhaseDocument } from '@/types/phaseDocuments';

interface DocumentItemProps {
  document: PhaseDocument;
  onDocumentClick: (document: PhaseDocument) => void;
  onUploadClick: () => void;
}

export function DocumentItem({
  document,
  onDocumentClick,
  onUploadClick
}: DocumentItemProps) {
  // Get the status color
  const getStatusColor = () => {
    if (!document.status) return "bg-gray-100";
    
    switch (document.status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Not Started":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Not Required":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDocumentClick(document);
  };
  
  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUploadClick();
  };
  
  return (
    <div 
      className="p-2 bg-white rounded-md border border-gray-200 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium">{document.name}</p>
            {document.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {document.description}
              </p>
            )}
          </div>
        </div>
        {document.status && (
          <Badge 
            variant="outline" 
            className={`text-[9px] ${getStatusColor()}`}
          >
            {document.status}
          </Badge>
        )}
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        {document.type && (
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
            {document.type}
          </span>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-5 w-5 p-0"
          onClick={handleUploadClick}
        >
          <Upload className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
