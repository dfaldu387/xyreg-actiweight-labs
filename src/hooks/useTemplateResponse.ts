import { useState, useEffect } from 'react';
import { TemplateResponseService, TemplateResponse } from '@/services/templateResponseService';
import { toast } from 'sonner';

export function useTemplateResponse(activityId: string, companyId: string) {
  const [response, setResponse] = useState<TemplateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activityId) return;
    
    const fetchResponse = async () => {
      setLoading(true);
      try {
        const data = await TemplateResponseService.getResponse(activityId);
        setResponse(data);
      } catch (error) {
        console.error('Error fetching template response:', error);
        toast.error('Failed to load template response');
      } finally {
        setLoading(false);
      }
    };

    fetchResponse();
  }, [activityId]);

  const createResponse = async (templateType: string, initialData: any = {}) => {
    try {
      const newResponse = await TemplateResponseService.createResponse(
        activityId,
        companyId,
        templateType,
        initialData
      );
      
      if (newResponse) {
        setResponse(newResponse);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating template response:', error);
      toast.error('Failed to create template response');
      return false;
    }
  };

  const saveProgress = async (sectionId: string, sectionData: any) => {
    if (!response) return false;
    
    setSaving(true);
    try {
      const success = await TemplateResponseService.saveProgress(
        response.id,
        sectionId,
        sectionData
      );
      
      if (success) {
        // Update local state
        setResponse(prev => prev ? {
          ...prev,
          template_data: {
            ...prev.template_data,
            sections: {
              ...prev.template_data.sections,
              [sectionId]: sectionData
            }
          }
        } : null);
      }
      
      return success;
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const markCompleted = async (userId: string) => {
    if (!response) return false;
    
    try {
      const success = await TemplateResponseService.markCompleted(response.id, userId);
      
      if (success) {
        setResponse(prev => prev ? {
          ...prev,
          completion_status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: userId
        } : null);
        toast.success('Template completed successfully');
      }
      
      return success;
    } catch (error) {
      console.error('Error marking template completed:', error);
      toast.error('Failed to complete template');
      return false;
    }
  };

  return {
    response,
    loading,
    saving,
    createResponse,
    saveProgress,
    markCompleted
  };
}