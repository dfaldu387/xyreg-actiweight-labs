
import { useState, useCallback } from 'react';
import { DrawingPath } from './useDrawingTool';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDrawingAnnotations(documentId: string) {
  const [annotations, setAnnotations] = useState<DrawingPath[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const saveAnnotation = useCallback(async (path: DrawingPath) => {
    if (!documentId) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return false;
      }

      // Convert drawing path to document_highlights format
      const annotationData = {
        document_id: documentId,
        user_id: user.id,
        page_number: path.pageNumber,
        highlighted_text: `Drawing annotation (${path.tool})`,
        start_offset: 0,
        end_offset: 0,
        color: path.color,
        position: {
          type: 'drawing',
          id: path.id,
          points: path.points,
          width: path.width,
          tool: path.tool,
          timestamp: path.timestamp
        }
      };

      const { error } = await supabase
        .from('document_highlights')
        .insert(annotationData);

      if (error) {
        console.error('Error saving annotation:', error);
        toast.error('Failed to save annotation');
        return false;
      }

      console.log('✅ Annotation saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving annotation:', error);
      toast.error('Failed to save annotation');
      return false;
    }
  }, [documentId]);

  const loadAnnotations = useCallback(async () => {
    if (!documentId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_highlights')
        .select('*')
        .eq('document_id', documentId)
        .not('position->type', 'is', null); // Only get drawing annotations

      if (error) {
        console.error('Error loading annotations:', error);
        toast.error('Failed to load annotations');
        return;
      }

      const loadedPaths: DrawingPath[] = data
        .filter(annotation => annotation.position && typeof annotation.position === 'object' && 'type' in annotation.position)
        .map(annotation => {
          const pos = annotation.position as any;
          return {
            id: pos.id,
            points: pos.points,
            color: annotation.color,
            width: pos.width,
            tool: pos.tool,
            pageNumber: annotation.page_number,
            timestamp: pos.timestamp
          };
        });

      setAnnotations(loadedPaths);
      console.log(`✅ Loaded ${loadedPaths.length} annotations`);
    } catch (error) {
      console.error('Error loading annotations:', error);
      toast.error('Failed to load annotations');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  const deleteAllAnnotations = useCallback(async () => {
    if (!documentId) return;

    try {
      const { error } = await supabase
        .from('document_highlights')
        .delete()
        .eq('document_id', documentId)
        .not('position->type', 'is', null); // Only delete drawing annotations

      if (error) {
        console.error('Error deleting annotations:', error);
        toast.error('Failed to delete annotations');
        return false;
      }

      setAnnotations([]);
      toast.success('All annotations deleted');
      return true;
    } catch (error) {
      console.error('Error deleting annotations:', error);
      toast.error('Failed to delete annotations');
      return false;
    }
  }, [documentId]);

  return {
    annotations,
    isLoading,
    saveAnnotation,
    loadAnnotations,
    deleteAllAnnotations,
    setAnnotations
  };
}
