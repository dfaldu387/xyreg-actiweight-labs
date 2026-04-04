
import { GapAnalysisItem } from "./client";

export type ImportanceLevel = 'high' | 'medium' | 'low';
export type TemplateScope = 'company' | 'product';

export interface GapAnalysisTemplate {
  id: string;
  name: string;
  framework: string;
  description: string;
  importance: ImportanceLevel;
  scope: TemplateScope;
  isActive: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  checklistItems?: GapChecklistItem[];
  progress?: number;
}

export interface GapChecklistItem {
  id: string;
  clause: string;
  section: string;
  requirement: string;
  description: string;
  category: 'documentation' | 'verification' | 'compliance';
  framework: string;
  chapter: string;
  subsection?: string;
  requirement_summary?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'not_applicable';
  dueDate?: string;
  assignedTo?: string;
  completedAt?: string;
  // Enhanced fields for comprehensive audit support
  questionNumber?: string;
  clauseDescription?: string;
  evidenceMethod?: string;
  auditGuidance?: string;
  priority?: 'low' | 'medium' | 'high';
  // Ownership matrix fields
  qa_ra_owner?: 'primary' | 'secondary' | 'none';
  rd_owner?: 'primary' | 'secondary' | 'none';
  mfg_ops_owner?: 'primary' | 'secondary' | 'none';
  labeling_owner?: 'primary' | 'secondary' | 'none';
  clinical_owner?: 'primary' | 'secondary' | 'none';
  other_owner?: 'primary' | 'secondary' | 'none';
  // Enhanced evidence and compliance tracking
  key_standards?: string;
  excludes_if?: string;
  applicable_standards?: string[];
  evidence_requirements?: string[];
}

export interface GapTemplateImportData {
  framework: string;
  name: string;
  description: string;
  importance: ImportanceLevel;
  scope: TemplateScope;
  items: GapTemplateImportItem[];
}

export interface GapTemplateImportItem {
  requirement: string;
  section?: string;
  clauseId?: string;
  clauseSummary?: string;
  checklistItems: {
    description: string;
    category: 'documentation' | 'verification' | 'compliance';
  }[];
}
