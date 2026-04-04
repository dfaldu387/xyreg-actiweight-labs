
export interface ReviewerGroupPermissions {
  canDownload: boolean;
  canComment: boolean;
  canUpload: boolean;
  canApprove: boolean;
  canViewInternal: boolean;
}

export interface ReviewerGroupMember {
  id: string;
  name: string;
  email: string;
  role?: string;
  isLead?: boolean;
  avatar_url?: string;
  joinedAt?: string;
  lastActivity?: string;
}

export interface ReviewerGroup {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  group_type: 'internal' | 'external';
  type?: 'internal' | 'external'; // For backward compatibility
  members?: ReviewerGroupMember[];
  permissions: ReviewerGroupPermissions;
  color?: string;
  is_default?: boolean;
  isDefault?: boolean; // For backward compatibility
  created_at?: string;
  createdAt?: string; // For backward compatibility
  updated_at?: string;
  updatedAt?: string; // For backward compatibility
  created_by?: string;
  settings: {
    requireAllApprovals: boolean;
    allowSelfAssignment: boolean;
    enableNotifications: boolean;
    defaultDeadlineDays?: number;
  };
}

export interface DocumentReviewAssignment {
  id: string;
  documentId: string;
  reviewerGroupId: string;
  assignedAt: string;
  assignedBy: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'changes_requested';
  dueDate?: string;
  notes?: string;
  completedAt?: string;
  completedBy?: string;
  approvals: ReviewApproval[];
  progress: {
    totalReviewers: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
  };
}

export interface ReviewApproval {
  id: string;
  reviewerId: string;
  reviewerName: string;
  status: 'approved' | 'rejected' | 'changes_requested';
  comment?: string;
  timestamp: string;
}

// Default reviewer groups template
export const getDefaultReviewerGroups = (companyId: string): ReviewerGroup[] => [
  {
    id: 'internal-team',
    company_id: companyId,
    name: 'Internal Team',
    description: 'Internal company reviewers',
    group_type: 'internal',
    type: 'internal', // For backward compatibility
    members: [],
    permissions: {
      canDownload: true,
      canComment: true,
      canUpload: true,
      canApprove: true,
      canViewInternal: true
    },
    color: '#3b82f6',
    is_default: true,
    isDefault: true, // For backward compatibility
    settings: {
      requireAllApprovals: false,
      allowSelfAssignment: true,
      enableNotifications: true,
      defaultDeadlineDays: 7
    }
  },
  {
    id: 'external-consultants',
    company_id: companyId,
    name: 'External Consultants',
    description: 'External consultant reviewers',
    group_type: 'external',
    type: 'external', // For backward compatibility
    members: [],
    permissions: {
      canDownload: true,
      canComment: true,
      canUpload: false,
      canApprove: false,
      canViewInternal: false
    },
    color: '#10b981',
    is_default: false,
    isDefault: false, // For backward compatibility
    settings: {
      requireAllApprovals: false,
      allowSelfAssignment: false,
      enableNotifications: true,
      defaultDeadlineDays: 10
    }
  },
  {
    id: 'regulatory-affairs',
    company_id: companyId,
    name: 'Regulatory Affairs',
    description: 'Regulatory affairs team',
    group_type: 'internal',
    type: 'internal', // For backward compatibility
    members: [],
    permissions: {
      canDownload: true,
      canComment: true,
      canUpload: true,
      canApprove: true,
      canViewInternal: true
    },
    color: '#8b5cf6',
    is_default: false,
    isDefault: false, // For backward compatibility
    settings: {
      requireAllApprovals: false,
      allowSelfAssignment: true,
      enableNotifications: true,
      defaultDeadlineDays: 5
    }
  }
];

// Helper functions
export const getGroupIcon = (type: string): string => {
  switch (type) {
    case 'external':
      return '🌐';
    default:
      return '👥';
  }
};

export const getPermissionLabel = (permission: keyof ReviewerGroupPermissions): string => {
  switch (permission) {
    case 'canDownload':
      return 'Download files';
    case 'canComment':
      return 'Add comments';
    case 'canUpload':
      return 'Upload files';
    case 'canApprove':
      return 'Approve/Reject';
    case 'canViewInternal':
      return 'View internal comments';
    default:
      return permission;
  }
};
