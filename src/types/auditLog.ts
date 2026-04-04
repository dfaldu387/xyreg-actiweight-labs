
export interface AuditLogEntry {
  id: string;
  document_id: string;
  user_id: string;
  company_id: string;
  
  // Action details
  action: 'view' | 'edit' | 'comment' | 'review' | 'download' | 'annotate' | 'status_change' | 'share' | 'export';
  action_details: Record<string, any>;
  
  // Session information
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  
  // Timing
  created_at: string;
  duration_seconds?: number;
  
  // Activity metrics
  page_views?: number;
  annotations_created?: number;
  annotations_modified?: number;
  annotations_deleted?: number;
  comments_added?: number;
  reviews_created?: number;
  
  // Device and location info
  device_info?: {
    browser?: string;
    os?: string;
    device?: string;
    screen_resolution?: string;
  };
  location_info?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  
  // Additional metadata
  metadata?: Record<string, any>;
  
  // Joined user profile data
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };

  // Legacy/computed properties for backward compatibility
  actionType?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  description?: string;
  user?: string;
  date?: string;
  time?: string;
  ipAddress?: string;
  companyName?: string; // For super admin views
}

export interface AuditLogStats {
  total_views: number;
  unique_users: number;
  total_duration: number;
  total_annotations: number;
  total_comments: number;
  total_reviews: number;
  recent_activity_count: number;
}

export interface CreateAuditLogData {
  document_id: string;
  user_id: string;
  company_id: string;
  action: AuditLogEntry['action'];
  action_details?: Record<string, any>;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  duration_seconds?: number;
  page_views?: number;
  annotations_created?: number;
  annotations_modified?: number;
  annotations_deleted?: number;
  comments_added?: number;
  reviews_created?: number;
  device_info?: Record<string, any>;
  location_info?: Record<string, any>;
  metadata?: Record<string, any>;
  reason?: string;
}
