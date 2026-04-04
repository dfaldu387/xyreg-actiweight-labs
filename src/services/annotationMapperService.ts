import type { AnnotationData } from "./annotationService";

// Types for annotation position (compatible with both old and new formats)
export interface ScaledPosition {
  boundingRect: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
    pageNumber: number;
  };
  rects: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
    pageNumber: number;
  }>;
  pageNumber: number;
}

export interface Content {
  text?: string;
  image?: string;
}

export interface Comment {
  text: string;
  emoji: string;
}

export interface IHighlight {
  id: string;
  position: ScaledPosition;
  content: Content;
  comment: Comment;
}

export interface NewHighlight {
  position: ScaledPosition;
  content: Content;
  comment: Comment;
}

// Extended highlight interface that includes user information
export interface IHighlightWithUser extends IHighlight {
  userName?: string;
}

/**
 * Service for mapping between react-pdf-highlighter format and database format
 */
export class AnnotationMapperService {
  /**
   * Clean document ID by removing template- prefix if present
   * This ensures the document ID is in proper UUID format for database operations
   */
  static cleanDocumentId(documentId: string): string {
    return documentId.replace(/^template-/, '');
  }
  /**
   * Convert react-pdf-highlighter highlight to database annotation format
   */
  static mapHighlightToAnnotation(
    highlight: IHighlight,
    documentId: string,
    userId: string,
    userName?: string
  ): Omit<AnnotationData, 'id' | 'created_at' | 'updated_at'> {
    // Clean document ID by removing template- prefix if present
    const cleanDocumentId = this.cleanDocumentId(documentId);
    
    return {
      document_id: cleanDocumentId,
      user_id: userId,
      annotation_id: highlight.id,
      annotation_type: 'TextHighlightAnnotation',
      page_number: highlight.position.pageNumber,
      content: highlight.comment.text,
      position: {
        boundingRect: highlight.position.boundingRect,
        rects: highlight.position.rects,
        pageNumber: highlight.position.pageNumber
      },
      style: {
        color: 'rgba(255,205,69,0.5)', // Default highlight color
        opacity: 0.5
      },
      metadata: {
        emoji: highlight.comment.emoji,
        createdBy: 'react-pdf-highlighter',
        originalFormat: 'react-pdf-highlighter',
        userName: userName || 'Unknown User'
      }
    };
  }

  /**
   * Convert database annotation back to react-pdf-highlighter highlight format
   */
  static mapAnnotationToHighlight(annotation: AnnotationData): IHighlightWithUser {
    return {
      id: annotation.annotation_id,
      position: annotation.position as ScaledPosition,
      content: {
        text: annotation.content || '',
        image: annotation.metadata?.image
      },
      comment: {
        text: annotation.content || '',
        emoji: annotation.metadata?.emoji || ''
      },
      userName: annotation.metadata?.userName || 'Unknown User'
    };
  }

  /**
   * Convert NewHighlight (without ID) to database format
   */
  static mapNewHighlightToAnnotation(
    highlight: NewHighlight,
    generatedId: string,
    documentId: string,
    userId: string,
    userName?: string
  ): Omit<AnnotationData, 'id' | 'created_at' | 'updated_at'> {
    const highlightWithId: IHighlight = {
      ...highlight,
      id: generatedId
    };
    
    return this.mapHighlightToAnnotation(highlightWithId, documentId, userId, userName);
  }

  /**
   * Validate annotation data before saving
   */
  static validateAnnotationData(annotation: Omit<AnnotationData, 'id' | 'created_at' | 'updated_at'>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!annotation.document_id) {
      errors.push('Document ID is required');
    } else {
      // Validate UUID format (should not contain template- prefix)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(annotation.document_id)) {
        errors.push('Document ID must be a valid UUID format');
      }
    }

    if (!annotation.user_id) {
      errors.push('User ID is required');
    } else {
      // Validate UUID format for user_id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(annotation.user_id)) {
        errors.push('User ID must be a valid UUID format');
      }
    }

    if (!annotation.annotation_id) {
      errors.push('Annotation ID is required');
    }

    if (!annotation.annotation_type) {
      errors.push('Annotation type is required');
    }

    if (typeof annotation.page_number !== 'number' || annotation.page_number < 1) {
      errors.push('Valid page number is required');
    }

    if (!annotation.position || typeof annotation.position !== 'object') {
      errors.push('Valid position data is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a unique annotation ID
   */
  static generateAnnotationId(): string {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
