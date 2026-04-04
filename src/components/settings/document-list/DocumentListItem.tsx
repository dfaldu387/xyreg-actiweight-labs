
import { FileText } from "lucide-react";
import { DocumentProtectionBadge } from "@/components/documents/DocumentProtectionBadge";
import { DocumentInclusionDropdown } from "@/components/documents/DocumentInclusionDropdown";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentPhaseSelector } from "./DocumentPhaseSelector";
import { DocumentDeleteButton } from "./DocumentDeleteButton";
import { InclusionRule } from "@/types/documentInclusion";

interface Document {
  id: string;
  name: string;
  status: string;
  document_type?: string;
  is_protected?: boolean;
  inclusion_rules?: InclusionRule;
}

interface DocumentListItemProps {
  document: Document;
  isLoading: boolean;
  availablePhases: string[];
  onDelete: (id: string) => Promise<boolean>;
  onPhaseSelect: (documentName: string, phases: string[]) => void;
  onUpdatePhases: (documentName: string) => Promise<void>;
  onInclusionRuleChange?: (documentId: string, rule: InclusionRule) => Promise<void>;
}

export function DocumentListItem({
  document,
  isLoading,
  availablePhases,
  onDelete,
  onPhaseSelect,
  onUpdatePhases,
  onInclusionRuleChange,
}: DocumentListItemProps) {
  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  const handleInclusionRuleChange = async (rule: InclusionRule) => {
    if (onInclusionRuleChange) {
      await onInclusionRuleChange(document.id, rule);
    }
  };

  const currentInclusionRule: InclusionRule = document.inclusion_rules || { type: 'always_include' };

  return (
    <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/10">
      <div className="flex-none">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{document.name}</span>
          <DocumentProtectionBadge 
            documentType={document.document_type || 'Standard'}
            isProtected={document.is_protected || false}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DocumentStatusBadge status={document.status} />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {document.is_protected ? (
          <DocumentInclusionDropdown
            currentRule={currentInclusionRule}
            onRuleChange={handleInclusionRuleChange}
            disabled={isLoading}
          />
        ) : (
          <DocumentPhaseSelector
            documentName={document.name}
            isLoading={isLoading}
            availablePhases={availablePhases}
            onPhaseSelect={onPhaseSelect}
            onUpdatePhases={() => onUpdatePhases(document.name)}
          />
        )}

        {!document.is_protected && (
          <DocumentDeleteButton
            documentId={document.id}
            name={document.name}
            isLoading={isLoading}
            onDelete={() => handleDelete(document.id)}
          />
        )}
      </div>
    </div>
  );
}
