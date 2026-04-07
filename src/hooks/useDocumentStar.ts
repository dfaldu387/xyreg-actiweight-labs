import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export function useDocumentStar(documentId: string | undefined) {
  const { user } = useAuth();
  const [isStarred, setIsStarred] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !documentId) {
      setIsStarred(false);
      return;
    }

    const checkStar = async () => {
      const { data } = await supabase
        .from('document_stars')
        .select('id')
        .eq('user_id', user.id)
        .eq('document_id', documentId)
        .maybeSingle();
      setIsStarred(!!data);
    };
    checkStar();
  }, [user?.id, documentId]);

  const toggleStar = useCallback(async () => {
    if (!user?.id || !documentId) return;
    setIsLoading(true);
    try {
      if (isStarred) {
        await supabase
          .from('document_stars')
          .delete()
          .eq('user_id', user.id)
          .eq('document_id', documentId);
        setIsStarred(false);
        toast.success('Document unstarred');
      } else {
        await supabase
          .from('document_stars')
          .insert({ user_id: user.id, document_id: documentId });
        setIsStarred(true);
        toast.success('Document starred');
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      toast.error('Failed to update star');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, documentId, isStarred]);

  return { isStarred, isLoading, toggleStar };
}
