
export interface CommentThread {
  id: string;
  document_id: string;
  is_internal: boolean;
  position?: {
    x: number;  
    y: number;
    reviewer_group_id?: string;
    reviewer_group_name?: string;
  };
  created_at: string;
  updated_at: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  comment_status?: 'open' | 'resolved' | 'pending';
  comment_priority?: 'low' | 'normal' | 'high' | 'urgent';
  user_profiles?: {
    first_name: string;
    last_name: string;
    email?: string;
  };
}

export interface CommentPosition {
  x: number;
  y: number;
  scroll_top?: number;
  scroll_left?: number;
  viewport_width?: number;
  viewport_height?: number;
  reviewer_group_id?: string;
  reviewer_group_name?: string;
}

export interface EnhancedCommentPosition extends CommentPosition {
  page_number: number;
  page_x: number;
  page_y: number;
  scale: number;
  text_context?: {
    selectedText: string;
    beforeText: string;
    afterText: string;
  };
  document_dimensions?: {
    pageWidth: number;
    pageHeight: number;
    documentWidth: number;
    documentHeight: number;
  };
}

// Add the missing interfaces for DocumentComments
export interface CreateCommentThreadData {
  document_id: string;
  is_internal: boolean;
  position?: CommentPosition | EnhancedCommentPosition;
}

export interface CreateCommentData {
  thread_id: string;
  content: string;
}
