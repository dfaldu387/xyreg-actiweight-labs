
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentItem } from './DocumentItem';
import { PhaseDocument } from '@/types/phaseDocuments';
import { cleanPhaseName } from '@/utils/phaseNumbering';

interface PhaseCardProps {
  phaseName: string;
  documents: PhaseDocument[];
  isExpanded: boolean;
  onToggle: (phase: string) => void;
  onDocumentClick: (doc: PhaseDocument) => void;
  onUploadClick: (phaseName: string, docName: string) => void;
  phaseProgress: number;
  docDescriptions?: Record<string, string>;
  phasePosition?: number;
}

export function PhaseCard({
  phaseName,
  documents,
  isExpanded,
  onToggle,
  onDocumentClick,
  onUploadClick,
  phaseProgress,
  docDescriptions = {},
  phasePosition = 0
}: PhaseCardProps) {
  const handleDocumentClick = (doc: PhaseDocument) => {
    onDocumentClick(doc);
  };

  const handleUploadClick = (documentName: string) => {
    onUploadClick(phaseName, documentName);
  };

  const displayName = cleanPhaseName(phaseName);

  const toggleClass = cn(
    "p-3.5 bg-background rounded-md border flex justify-between items-center cursor-pointer transition-colors",
    isExpanded && "shadow-sm"
  );

  return (
    <div className="phase-card">
      <div 
        className={toggleClass}
        onClick={() => onToggle(phaseName)}
      >
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "w-12 h-12 rounded-md flex items-center justify-center text-xs font-semibold",
              phaseProgress === 100 ? "bg-green-100 text-green-800" : 
              phaseProgress > 0 ? "bg-blue-100 text-blue-800" : 
              "bg-gray-100 text-gray-800"
            )}
          >
            <div className="text-center">
              <div className="text-sm">{phaseProgress}%</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-1">
              <h4 className="font-semibold text-base">{displayName}</h4>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={phaseProgress} className="h-1.5 w-24 bg-gray-100" />
              <Badge variant="outline" className="text-xs">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 h-8 w-8 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(phaseName);
          }}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {isExpanded && documents.length > 0 && (
        <div className="mt-2 pl-16 space-y-2">
          {documents.map((doc, index) => (
            <DocumentItem
              key={`${doc.id || doc.name}-${index}`}
              document={doc}
              onDocumentClick={handleDocumentClick}
              onUploadClick={() => handleUploadClick(doc.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
