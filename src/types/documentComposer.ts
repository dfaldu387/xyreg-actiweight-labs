export interface DocumentSection {
  id: string;
  title: string;
  content: DocumentContent[];
  order: number;
  showHeader?: boolean;
  customTitle?: string;
}

export interface DocumentContent {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'table';
  content: string;
  isAIGenerated: boolean;
  aiSources?: AISource[];
  metadata?: {
    confidence: number;
    lastModified: Date;
    author: 'ai' | 'user';
    dataSource?: 'auto-populated' | 'missing' | 'manual';
    populatedFrom?: string;
    isHighlighted?: boolean;
    requiresAttention?: boolean;
    aiUsed?: boolean;
    companyDataUsed?: boolean;
  };
}

export interface AISource {
  id: string;
  title: string;
  type: 'regulation' | 'standard' | 'guideline' | 'company_policy';
  url?: string;
  excerpt: string;
  relevanceScore: number;
}

export interface ProductContext {
  id: string;
  name: string;
  riskClass: string;
  phase: string;
  description?: string;
  regulatoryRequirements: string[];
}

export interface DocumentControl {
  sopNumber: string;
  documentTitle: string;
  version: string;
  effectiveDate: Date;
  nextReviewDate?: Date;
  documentOwner: string;
  preparedBy: {
    name: string;
    title: string;
    date: Date;
    signature?: string;
  };
  reviewedBy: {
    name: string;
    title: string;
    date: Date;
    signature?: string;
  };
  approvedBy: {
    name: string;
    title: string;
    date: Date;
    signature?: string;
  };
}

export interface RevisionHistory {
  version: string;
  date: Date;
  description: string;
  changedBy: string;
}

export interface AssociatedDocument {
  title: string;
  documentNumber: string;
  type: 'SOP' | 'Form' | 'Template' | 'Checklist';
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  sections: DocumentSection[];
  productContext: ProductContext;
  documentControl?: DocumentControl;
  revisionHistory?: RevisionHistory[];
  associatedDocuments?: AssociatedDocument[];
  metadata: {
    version: string;
    lastUpdated: Date;
    estimatedCompletionTime: string;
  };
  formatOptions?: {
    showSectionNumbers?: boolean;
  };
}