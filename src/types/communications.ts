
// Types matching the real database schema

export interface ThreadParticipant {
  id: string;
  thread_id: string;
  user_id: string | null;
  role: string | null;
  is_internal: boolean;
  joined_at: string | null;
  last_read_at: string | null;
  unread_count: number;
  external_email: string | null;
  external_name: string | null;
  external_organization: string | null;
  // Joined from user_profiles
  user_profile?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface CommunicationMessage {
  id: string;
  thread_id: string;
  sender_user_id: string | null;
  sender_participant_id: string | null;
  content: string;
  message_type: string | null;
  reply_to_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  // Joined
  sender_profile?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  storage_path: string;
  signed_url?: string;
  uploaded_at: string | null;
  uploaded_by: string | null;
}

export interface CommunicationThread {
  id: string;
  title: string;
  status: string | null;
  company_id: string | null;
  product_id: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_activity_at: string | null;
  thread_type: string | null;
  related_entity_id: string | null;
  related_entity_name: string | null;
  related_entity_type: string | null;
  // Joined
  participants?: ThreadParticipant[];
  latest_message?: CommunicationMessage | null;
  my_unread_count?: number;
}

// Legacy types kept for backward compat during migration - can remove later
export interface Participant {
  id: string;
  name: string;
  email: string;
  organization: string;
  isInternal: boolean;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: string;
  url: string;
}

export interface Message {
  id: string;
  sender: Participant;
  content: string;
  timestamp: string;
  attachments: Attachment[];
}
