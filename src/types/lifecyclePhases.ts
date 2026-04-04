
import { LifecycleDocument } from '@/types/client';

export interface LifecyclePhasesProps {
  deviceClass?: string;
  companyId?: string;
}

export interface PhaseDocumentState {
  [phaseName: string]: LifecycleDocument[];
}

// Add DocumentItemProps interface for DocumentItem component
export interface DocumentItemProps {
  document: LifecycleDocument;
  phaseName: string;
  onDocumentClick: (document: LifecycleDocument) => void;
  onUploadClick: (phaseName: string, documentName: string) => void;
  description?: string;
}

// Add PhaseCardProps interface for PhaseCard component
export interface PhaseCardProps {
  phaseName: string;
  documents: LifecycleDocument[];
  isExpanded: boolean;
  onToggle: (phaseName: string) => void;
  onDocumentClick: (document: LifecycleDocument) => void;
  onUploadClick: (phaseName: string, documentName: string) => void;
  phaseProgress: number;
  docDescriptions?: Record<string, string>;
}

// Add PhaseDocumentDescriptions interface for document descriptions
export interface PhaseDocumentDescriptions {
  [phaseName: string]: Record<string, string>;
}
