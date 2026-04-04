export type DataRoomStatus = 'draft' | 'active' | 'archived';
export type AccessLevel = 'viewer' | 'limited_viewer';
export type AccessStatus = 'pending' | 'active' | 'revoked' | 'expired';
export type ContentType = 'product_overview' | 'financials' | 'strategic_plans' | 'custom_document';
export type ActivityAction = 'login' | 'view_content' | 'download' | 'logout';

export interface DataRoom {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  status: DataRoomStatus;
  access_start_date?: string;
  access_end_date?: string;
  branding_logo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
}

export interface DataRoomAccess {
  id: string;
  data_room_id: string;
  investor_email: string;
  investor_name?: string;
  investor_organization?: string;
  access_level: AccessLevel;
  can_download: boolean;
  access_granted_at: string;
  access_expires_at?: string;
  last_accessed_at?: string;
  access_token: string;
  status: AccessStatus;
  created_by?: string;
  created_at: string;
}

export interface DataRoomContent {
  id: string;
  data_room_id: string;
  content_type: ContentType;
  content_source: string;
  product_id?: string;
  document_title: string;
  document_description?: string;
  file_path?: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  metadata: Record<string, any>;
  source_data_query?: Record<string, any>;
  auto_refresh?: boolean;
  generated_at?: string;
}

export interface DataRoomActivityLog {
  id: string;
  data_room_id: string;
  investor_email: string;
  action: ActivityAction;
  content_id?: string;
  content_title?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface CreateDataRoomInput {
  name: string;
  description?: string;
  access_start_date?: string;
  access_end_date?: string;
  branding_logo_url?: string;
}

export interface InviteInvestorInput {
  investor_email: string;
  investor_name?: string;
  investor_organization?: string;
  access_level: AccessLevel;
  can_download: boolean;
  access_expires_at?: string;
}

export interface AddContentInput {
  content_type: ContentType;
  document_title: string;
  document_description?: string;
  file?: File;
  display_order?: number;
  is_visible?: boolean;
}
