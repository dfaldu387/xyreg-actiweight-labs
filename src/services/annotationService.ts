import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AnnotationData {
  id?: string;
  document_id: string;
  user_id: string;
  annotation_id: string;
  annotation_type: string;
  page_number: number;
  content?: string;
  position: any;
  style?: any;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface AnnotationChangeEvent {
  annotations: AnnotationData[];
  action: 'add' | 'modify' | 'delete';
}

// Define all supported annotation types
export const ANNOTATION_TYPES = {
  TEXT_HIGHLIGHT: 'TextHighlightAnnotation',
  STICKY: 'StickyAnnotation',
  FREE_TEXT: 'FreeTextAnnotation',
  RECTANGLE: 'RectangleAnnotation',
  CIRCLE: 'CircleAnnotation',
  LINE: 'LineAnnotation',
  ARROW: 'ArrowAnnotation',
  POLYGON: 'PolygonAnnotation',
  STAMP: 'StampAnnotation',
  SIGNATURE: 'SignatureAnnotation'
} as const;

export type AnnotationType = typeof ANNOTATION_TYPES[keyof typeof ANNOTATION_TYPES];

// Mapping from short codes to full annotation types
export const ANNOTATION_TYPE_MAPPING: Record<string, AnnotationType> = {
  'n': ANNOTATION_TYPES.TEXT_HIGHLIGHT,
  's': ANNOTATION_TYPES.STICKY,
  'ca': ANNOTATION_TYPES.STICKY, // Sticky notes with 'ca' code
  'f': ANNOTATION_TYPES.FREE_TEXT,
  'r': ANNOTATION_TYPES.RECTANGLE,
  'c': ANNOTATION_TYPES.CIRCLE,
  'l': ANNOTATION_TYPES.LINE,
  'a': ANNOTATION_TYPES.ARROW,
  'p': ANNOTATION_TYPES.POLYGON,
  'st': ANNOTATION_TYPES.STAMP,
  'sig': ANNOTATION_TYPES.SIGNATURE
};

export class AnnotationService {
  /**
   * Get all supported annotation types
   */
  static getSupportedAnnotationTypes(): AnnotationType[] {
    return Object.values(ANNOTATION_TYPES);
  }

  /**
   * Get annotation type display name
   */
  static getAnnotationTypeDisplayName(type: string): string {
    const mapping: Record<string, string> = {
      [ANNOTATION_TYPES.TEXT_HIGHLIGHT]: 'Text Highlight',
      [ANNOTATION_TYPES.STICKY]: 'Sticky Note',
      [ANNOTATION_TYPES.FREE_TEXT]: 'Free Text',
      [ANNOTATION_TYPES.RECTANGLE]: 'Rectangle',
      [ANNOTATION_TYPES.CIRCLE]: 'Circle',
      [ANNOTATION_TYPES.LINE]: 'Line',
      [ANNOTATION_TYPES.ARROW]: 'Arrow',
      [ANNOTATION_TYPES.POLYGON]: 'Polygon',
      [ANNOTATION_TYPES.STAMP]: 'Stamp',
      [ANNOTATION_TYPES.SIGNATURE]: 'Signature'
    };
    return mapping[type] || type;
  }

  /**
   * Get default color for annotation type
   */
  static getDefaultColorForType(type: string): string {
    const colorMapping: Record<string, string> = {
      [ANNOTATION_TYPES.TEXT_HIGHLIGHT]: 'rgba(255,205,69,0.5)', // Yellow
      [ANNOTATION_TYPES.STICKY]: 'rgba(70,130,180,0.8)', // Steel blue
      [ANNOTATION_TYPES.FREE_TEXT]: 'rgba(255,0,0,0.8)', // Red
      [ANNOTATION_TYPES.RECTANGLE]: 'rgba(0,255,0,0.3)', // Green
      [ANNOTATION_TYPES.CIRCLE]: 'rgba(255,165,0,0.3)', // Orange
      [ANNOTATION_TYPES.LINE]: 'rgba(128,0,128,0.8)', // Purple
      [ANNOTATION_TYPES.ARROW]: 'rgba(255,0,255,0.8)', // Magenta
      [ANNOTATION_TYPES.POLYGON]: 'rgba(0,255,255,0.3)', // Cyan
      [ANNOTATION_TYPES.STAMP]: 'rgba(139,69,19,0.8)', // Brown
      [ANNOTATION_TYPES.SIGNATURE]: 'rgba(0,0,0,0.8)' // Black
    };
    return colorMapping[type] || 'rgba(255,205,69,0.5)';
  }

  /**
   * Save annotation to database
   */
  static async saveAnnotation(annotation: Omit<AnnotationData, 'id' | 'created_at' | 'updated_at'>): Promise<AnnotationData | null> {
    // console.log('annotation 123123', annotation);
    try {
      // First check if annotation already exists
      const { data: existingAnnotation, error: checkError } = await (supabase as any)
        .from('document_annotations_test')
        .select('id')
        .eq('annotation_id', annotation.annotation_id)
        .eq('document_id', annotation.document_id)
        .single();

      if (existingAnnotation) {
        // Annotation already exists, return null to indicate no new insertion
        return null;
      }

      // Ensure metadata includes user name if not already present
      const enrichedMetadata = {
        ...annotation.metadata,
        userName: annotation.metadata?.userName || await this.getUserName(annotation.user_id)
      };

      const { data, error } = await (supabase as any)
        .from('document_annotations_test')
        .insert({
          document_id: annotation.document_id,
          user_id: annotation.user_id,
          annotation_id: annotation.annotation_id,
          annotation_type: annotation.annotation_type,
          page_number: annotation.page_number,
          content: annotation.content,
          position: annotation.position,
          style: annotation.style,
          metadata: enrichedMetadata
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation gracefully
        if (error.code === '23505') {
          return null;
        }
        return null;
      }

      return data as AnnotationData;
    } catch (error: any) {
      // Handle unique constraint violation gracefully
      if (error?.code === '23505') {
        return null;
      }
      return null;
    }
  }

  /**
   * Load all annotations for a document
   */
  static async loadAnnotations(documentId: string): Promise<AnnotationData[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('document_annotations_test')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        return [];
      }

      return (data as AnnotationData[]) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get annotations by type for a document
   */
  static async getAnnotationsByType(documentId: string, annotationType: string): Promise<AnnotationData[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('document_annotations_test')
        .select('*')
        .eq('document_id', documentId)
        .eq('annotation_type', annotationType)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        return [];
      }

      return (data as AnnotationData[]) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Clean up duplicate annotations for a document
   * This method removes duplicate annotations based on annotation_id
   */
  static async cleanupDuplicateAnnotations(documentId: string): Promise<number> {
    try {
      // Get all annotations for the document
      const { data: annotations, error } = await (supabase as any)
        .from('document_annotations_test')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error || !annotations) {
        return 0;
      }

      // Group by annotation_id and keep only the first occurrence
      const seenIds = new Set<string>();
      const duplicatesToDelete: string[] = [];

      (annotations as AnnotationData[]).forEach(annotation => {
        if (seenIds.has(annotation.annotation_id)) {
          duplicatesToDelete.push(annotation.id!);
        } else {
          seenIds.add(annotation.annotation_id);
        }
      });

      // Delete duplicate annotations
      if (duplicatesToDelete.length > 0) {
        const { error: deleteError } = await (supabase as any)
          .from('document_annotations_test')
          .delete()
          .in('id', duplicatesToDelete);

        if (deleteError) {
          console.error('Error deleting duplicate annotations:', deleteError);
          return 0;
        }
      }

      return duplicatesToDelete.length;
    } catch (error) {
      console.error('Error cleaning up duplicate annotations:', error);
      return 0;
    }
  }

  /**
   * Get annotation statistics for a document
   */
  static async getAnnotationStats(documentId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await (supabase as any)
        .from('document_annotations_test')
        .select('annotation_type')
        .eq('document_id', documentId)
        .eq('is_deleted', false);

      if (error) {
        return {};
      }

      const stats: Record<string, number> = {};
      (data as AnnotationData[])?.forEach(annotation => {
        const type = annotation.annotation_type;
        stats[type] = (stats[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      return {};
    }
  }

  /**
   * Update an existing annotation
   */
  static async updateAnnotation(annotationId: string, updates: Partial<AnnotationData>): Promise<AnnotationData | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('document_annotations_test')
        .update({
          content: updates.content,
          position: updates.position,
          style: updates.style,
          metadata: updates.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('annotation_id', annotationId)
        .select()
        .single();

      if (error) {
        return null;
      }

      return data as AnnotationData;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete an annotation (soft delete)
   */
  static async deleteAnnotation(annotationId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('document_annotations_test')
        .update({ is_deleted: true })
        .eq('annotation_id', annotationId);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all annotations (for debugging)
   */
  static async getAllAnnotations(): Promise<AnnotationData[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('document_annotations_test')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        return [];
      }

      return (data as AnnotationData[]) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Batch save multiple annotations
   */
  static async batchSaveAnnotations(annotations: Omit<AnnotationData, 'id' | 'created_at' | 'updated_at'>[]): Promise<AnnotationData[]> {
    try {
      // Enrich all annotations with user names in metadata
      const enrichedAnnotations = await Promise.all(
        annotations.map(async (annotation) => ({
          ...annotation,
          metadata: {
            ...annotation.metadata,
            userName: annotation.metadata?.userName || await this.getUserName(annotation.user_id)
          }
        }))
      );

      const { data, error } = await (supabase as any)
        .from('document_annotations_test')
        .insert(enrichedAnnotations)
        .select();

      if (error) {
        return [];
      }

      return (data as AnnotationData[]) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get user name by ID
   */
  static async getUserName(userId: string): Promise<string> {
    try {
      // First try to get from user_profiles with a more generic approach
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (!profileError && profileData) {
        // Use first_name and last_name if available
        if (profileData.first_name && profileData.last_name) {
          return `${profileData.first_name} ${profileData.last_name}`;
        } else if (profileData.first_name) {
          return profileData.first_name;
        } else if (profileData.email) {
          return profileData.email;
        }
      }

      // If user_profiles doesn't work, try auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (!authError && authData?.user) {
        const user = authData.user;
        const name = user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
                    user.email;
        if (name) return name;
      }

      // Fallback to email from auth.users
      if (!authError && authData?.user?.email) {
        return authData.user.email;
      }

      return 'Unknown User';
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Unknown User';
    }
  }

  /**
   * Convert PDFTron annotation to database format
   */
  static async convertPDFTronAnnotation(
    pdfTronAnnotation: any,
    documentId: string,
    userId: string
  ): Promise<Omit<AnnotationData, 'id' | 'created_at' | 'updated_at'>> {
    // Determine the correct annotation type
    let annotationType = pdfTronAnnotation.constructor.name;

    // Handle cases where the constructor name might be abbreviated
    if (annotationType === 'y' || annotationType === 'TextHighlightAnnotation') {
      annotationType = ANNOTATION_TYPES.TEXT_HIGHLIGHT;
    } else if (annotationType === 'StickyAnnotation' || annotationType === 's' || annotationType === 'ca') {
      annotationType = ANNOTATION_TYPES.STICKY;
    } else if (annotationType === 'FreeTextAnnotation' || annotationType === 'f') {
      annotationType = ANNOTATION_TYPES.FREE_TEXT;
    } else if (annotationType === 'RectangleAnnotation' || annotationType === 'r') {
      annotationType = ANNOTATION_TYPES.RECTANGLE;
    } else if (annotationType === 'CircleAnnotation' || annotationType === 'c') { 
      annotationType = ANNOTATION_TYPES.CIRCLE;
    } else if (annotationType === 'LineAnnotation' || annotationType === 'l') {
      annotationType = ANNOTATION_TYPES.LINE;
    } else if (annotationType === 'ArrowAnnotation' || annotationType === 'a') {
      annotationType = ANNOTATION_TYPES.ARROW;
    } else if (annotationType === 'PolygonAnnotation' || annotationType === 'p') {
      annotationType = ANNOTATION_TYPES.POLYGON;
    } else if (annotationType === 'StampAnnotation' || annotationType === 'st') {
      annotationType = ANNOTATION_TYPES.STAMP;
    } else if (annotationType === 'SignatureAnnotation' || annotationType === 'sig') {
      annotationType = ANNOTATION_TYPES.SIGNATURE;
    }

    // Get user name for the author
    const userName = await this.getUserName(userId);

    return {
      document_id: documentId,
      user_id: userId,
      annotation_id: pdfTronAnnotation.Id,
      annotation_type: annotationType,
      page_number: pdfTronAnnotation.getPageNumber(),
      content: pdfTronAnnotation.getContents(),
      position: {
        x: pdfTronAnnotation.getX(),
        y: pdfTronAnnotation.getY(),
        width: pdfTronAnnotation.getWidth(),
        height: pdfTronAnnotation.getHeight(),
        quads: pdfTronAnnotation.getQuads?.() || null
      },
      style: {
        color: (() => {
          try {
            const strokeColor = pdfTronAnnotation.StrokeColor;
            if (strokeColor) {
              // Extract color components properly
              const r = strokeColor.getR ? strokeColor.getR() : 255;
              const g = strokeColor.getG ? strokeColor.getG() : 205;
              const b = strokeColor.getB ? strokeColor.getB() : 69;
              const a = strokeColor.getA ? strokeColor.getA() : 1;
              return `rgba(${r},${g},${b},${a})`;
            }
            return this.getDefaultColorForType(annotationType);
          } catch (error) {
            return this.getDefaultColorForType(annotationType);
          }
        })(),
        fillColor: (() => {
          try {
            const fillColor = pdfTronAnnotation.FillColor;
            if (fillColor) {
              // Extract color components properly
              const r = fillColor.getR ? fillColor.getR() : 255;
              const g = fillColor.getG ? fillColor.getG() : 205;
              const b = fillColor.getB ? fillColor.getB() : 69;
              const a = fillColor.getA ? fillColor.getA() : 1;
              return `rgba(${r},${g},${b},${a})`;
            }
            return this.getDefaultColorForType(annotationType);
          } catch (error) {
            return this.getDefaultColorForType(annotationType);
          }
        })(),
        strokeWidth: pdfTronAnnotation.StrokeThickness,
        opacity: pdfTronAnnotation.Opacity,
        font: pdfTronAnnotation.Font?.toString()
      },
      metadata: {
        author: userName, // Use the actual user name instead of user ID
        subject: pdfTronAnnotation.Subject,
        creationDate: pdfTronAnnotation.CreationDate,
        modifiedDate: pdfTronAnnotation.ModifiedDate,
        flags: pdfTronAnnotation.Flags
      }
    };
  }

  /**
   * Convert database annotation to PDFTron format
   */
  static async convertToPDFTronAnnotation(dbAnnotation: AnnotationData, Annotations: any): Promise<any> {
    // console.log('Converting annotation to PDFTron format:', dbAnnotation.annotation_type, dbAnnotation.annotation_id);

    // Validate required fields
    if (!dbAnnotation.position || !dbAnnotation.page_number) {
      return null;
    }

    // Handle minified annotation types
    let annotationType = dbAnnotation.annotation_type;
    if (annotationType === 'y') {
      annotationType = ANNOTATION_TYPES.TEXT_HIGHLIGHT;
    } else if (annotationType === 's' || annotationType === 'ca') {
      annotationType = ANNOTATION_TYPES.STICKY;
    } else if (annotationType === 'f') {
      annotationType = ANNOTATION_TYPES.FREE_TEXT;
    } else if (annotationType === 'r') {
      annotationType = ANNOTATION_TYPES.RECTANGLE;
    } else if (annotationType === 'c') {
      annotationType = ANNOTATION_TYPES.CIRCLE;
    } else if (annotationType === 'l') {
      annotationType = ANNOTATION_TYPES.LINE;
    } else if (annotationType === 'a') {
      annotationType = ANNOTATION_TYPES.ARROW;
    } else if (annotationType === 'p') {
      annotationType = ANNOTATION_TYPES.POLYGON;
    } else if (annotationType === 'st') {
      annotationType = ANNOTATION_TYPES.STAMP;
    } else if (annotationType === 'sig') {
      annotationType = ANNOTATION_TYPES.SIGNATURE;
    }

    const annotationClass = Annotations[annotationType];
    if (!annotationClass) {
      return null;
    }

    const position = dbAnnotation.position;
    const style = dbAnnotation.style;

    // Create annotation based on type
    let annotation;
    switch (annotationType) {
      case ANNOTATION_TYPES.TEXT_HIGHLIGHT:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          Quads: position.quads || [
            {
              x1: position.x,
              y1: position.y,
              x2: position.x + position.width,
              y2: position.y,
              x3: position.x + position.width,
              y3: position.y + position.height,
              x4: position.x,
              y4: position.y + position.height
            }
          ]
        });
        break;

      case ANNOTATION_TYPES.STICKY:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          X: position.x,
          Y: position.y,
          Width: position.width,
          Height: position.height
        });
        break;

      case ANNOTATION_TYPES.FREE_TEXT:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          X: position.x,
          Y: position.y,
          Width: position.width,
          Height: position.height
        });
        break;

      case ANNOTATION_TYPES.RECTANGLE:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          X: position.x,
          Y: position.y,
          Width: position.width,
          Height: position.height
        });
        break;

      case ANNOTATION_TYPES.CIRCLE:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          X: position.x,
          Y: position.y,
          Width: position.width,
          Height: position.height
        });
        break;

      case ANNOTATION_TYPES.LINE:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          X: position.x,
          Y: position.y,
          Width: position.width,
          Height: position.height
        });
        break;

      case ANNOTATION_TYPES.ARROW:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          X: position.x,
          Y: position.y,
          Width: position.width,
          Height: position.height
        });
        break;

      case ANNOTATION_TYPES.POLYGON:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          X: position.x,
          Y: position.y,
          Width: position.width,
          Height: position.height
        });
        break;

      case ANNOTATION_TYPES.STAMP:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          X: position.x,
          Y: position.y,
          Width: position.width,
          Height: position.height
        });
        break;

      case ANNOTATION_TYPES.SIGNATURE:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          X: position.x,
          Y: position.y,
          Width: position.width,
          Height: position.height
        });
        break;

      default:
        annotation = new annotationClass({
          PageNumber: dbAnnotation.page_number,
          X: position.x,
          Y: position.y,
          Width: position.width,
          Height: position.height
        });
    }

    // Set content
    if (dbAnnotation.content) {
      annotation.setContents(dbAnnotation.content);
    }

    // Set style properties
    if (style) {
      if (style.color) {
        try {
          // Handle malformed color strings like "rgba(NaN,0,0,1)"
          if (typeof style.color === 'string' && style.color.includes('NaN')) {
            // Use default color for malformed colors
            annotation.StrokeColor = new Annotations.Color(255, 205, 69, 1);
            return;
          }

          // Handle different color formats
          if (typeof style.color === 'string') {
            // More flexible regex to handle various formats
            const rgbaMatch = style.color.match(/rgba?\(([^)]+)\)/);
            if (rgbaMatch) {
              const colorValues = rgbaMatch[1].split(',').map(v => v.trim());

              if (colorValues.length >= 3) {
                const r = parseInt(colorValues[0]);
                const g = parseInt(colorValues[1]);
                const b = parseInt(colorValues[2]);
                const a = colorValues.length > 3 ? parseFloat(colorValues[3]) : 1;

                if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                  annotation.StrokeColor = new Annotations.Color(r, g, b, a);
                } else {
                  // Fallback to default color
                  annotation.StrokeColor = new Annotations.Color(255, 205, 69, 1);
                }
              } else {
                annotation.StrokeColor = new Annotations.Color(255, 205, 69, 1);
              }
            } else {
              // Try direct color creation
              annotation.StrokeColor = new Annotations.Color(style.color);
            }
          } else if (Array.isArray(style.color)) {
            annotation.StrokeColor = new Annotations.Color(...style.color);
          } else {
            // Default color
            annotation.StrokeColor = new Annotations.Color(255, 205, 69, 1);
          }
        } catch (error) {
          // Fallback to default color
          try {
            annotation.StrokeColor = new Annotations.Color(255, 205, 69, 1);
          } catch (fallbackError) {
            // Silent fallback
          }
        }
      }

      if (style.fillColor) {
        try {
          // Handle malformed color strings like "rgba(NaN,0,0,1)"
          if (typeof style.fillColor === 'string' && style.fillColor.includes('NaN')) {
            // Use default color for malformed colors
            annotation.FillColor = new Annotations.Color(255, 205, 69, 1);
            return;
          }

          if (typeof style.fillColor === 'string') {
            // More flexible regex to handle various formats
            const rgbaMatch = style.fillColor.match(/rgba?\(([^)]+)\)/);
            if (rgbaMatch) {
              const colorValues = rgbaMatch[1].split(',').map(v => v.trim());

              if (colorValues.length >= 3) {
                const r = parseInt(colorValues[0]);
                const g = parseInt(colorValues[1]);
                const b = parseInt(colorValues[2]);
                const a = colorValues.length > 3 ? parseFloat(colorValues[3]) : 1;

                if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                  annotation.FillColor = new Annotations.Color(r, g, b, a);
                } else {
                  annotation.FillColor = new Annotations.Color(255, 205, 69, 1);
                }
              } else {
                annotation.FillColor = new Annotations.Color(255, 205, 69, 1);
              }
            } else {
              annotation.FillColor = new Annotations.Color(style.fillColor);
            }
          } else if (Array.isArray(style.fillColor)) {
            annotation.FillColor = new Annotations.Color(...style.fillColor);
          } else {
            annotation.FillColor = new Annotations.Color(255, 205, 69, 1);
          }
        } catch (error) {
          try {
            annotation.FillColor = new Annotations.Color(255, 205, 69, 1);
          } catch (fallbackError) {
            // Silent fallback
          }
        }
      }

      if (style.strokeWidth) {
        annotation.StrokeThickness = style.strokeWidth;
      }
      if (style.opacity) {
        annotation.Opacity = style.opacity;
      }
    }

    // Get user name for the author
    const userName = await this.getUserName(dbAnnotation.user_id);

    // Set metadata
    annotation.Author = userName;

    return annotation;
  }
} 