import React, { useState } from 'react';
import { GapAnalysisItem } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Calendar,
  Activity,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Plus
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface GapItemExpandedEvidenceProps {
  item: GapAnalysisItem;
  companyId?: string;
  onEvidenceChange: () => void;
  disabled?: boolean;
}

interface Document {
  id: string;
  name: string;
  status: string;
  document_type: string;
  phase_name?: string;
}

interface Audit {
  id: string;
  name: string;
  status: string;
  date?: string;
  audit_type?: string;
}

interface ActivityItem {
  id: string;
  name: string;
  status: string;
  type: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
}

export function GapItemExpandedEvidence({
  item,
  companyId,
  onEvidenceChange,
  disabled = false
}: GapItemExpandedEvidenceProps) {
  const { lang } = useTranslation();
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch linked documents
  const { data: linkedDocuments = [], refetch: refetchDocuments } = useQuery({
    queryKey: ['gap-linked-documents', item.id],
    queryFn: async () => {
      const { data: links, error: linksError } = await supabase
        .from('gap_document_links')
        .select('document_id')
        .eq('gap_item_id', item.id);
      
      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const { data: documents, error: docsError } = await supabase
        .from('company_template_documents_by_phase')
        .select('id, name, status, document_type, phase_name')
        .in('id', links.map(link => link.document_id));
      
      if (docsError) throw docsError;
      return documents || [];
    },
    staleTime: 60000, // 1 minute - prevent duplicate requests
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Fetch linked audits
  const { data: linkedAudits = [], refetch: refetchAudits } = useQuery({
    queryKey: ['gap-linked-audits', item.id],
    queryFn: async () => {
      const { data: links, error: linksError } = await supabase
        .from('gap_audit_links')
        .select('audit_id, audit_type')
        .eq('gap_item_id', item.id);
      
      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      // Separate links by audit_type
      const productAuditIds = links.filter(link => link.audit_type === 'product').map(link => link.audit_id);
      const companyAuditIds = links.filter(link => link.audit_type === 'company').map(link => link.audit_id);

      const allAudits = [];

      // Fetch product audits if any exist
      if (productAuditIds.length > 0) {
        const { data: audits, error: auditsError } = await supabase
          .from('product_audits')
          .select('id, audit_name, status, deadline_date, audit_type')
          .in('id', productAuditIds);
        
        if (auditsError) throw auditsError;
        if (audits) {
          allAudits.push(...audits.map(audit => ({
            id: audit.id,
            name: audit.audit_name,
            status: audit.status,
            date: audit.deadline_date,
            audit_type: audit.audit_type
          })));
        }
      }

      // Fetch company audits if any exist
      if (companyAuditIds.length > 0 && companyId) {
        const { data: audits, error: auditsError } = await supabase
          .from('company_audits')
          .select('id, audit_name, status, deadline_date, audit_type')
          .in('id', companyAuditIds);
        
        if (auditsError) throw auditsError;
        if (audits) {
          allAudits.push(...audits.map(audit => ({
            id: audit.id,
            name: audit.audit_name,
            status: audit.status,
            date: audit.deadline_date,
            audit_type: audit.audit_type
          })));
        }
      }

      return allAudits;
    },
    staleTime: 0, // Always refetch to get latest data
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Fetch linked activities
  const { data: linkedActivities = [], refetch: refetchActivities } = useQuery({
    queryKey: ['gap-linked-activities', item.id],
    queryFn: async () => {
      const { data: links, error: linksError } = await supabase
        .from('gap_activity_links')
        .select('activity_id')
        .eq('gap_item_id', item.id);
      
      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, name, status, type, start_date, end_date, due_date, updated_at')
        .in('id', links.map(link => link.activity_id));
      
      if (activitiesError) throw activitiesError;
      return activities || [];
    },
    staleTime: 60000, // 1 minute - prevent duplicate requests
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Get URL evidence
  const urlEvidence = Array.isArray(item.evidenceLinks) 
    ? item.evidenceLinks.filter((link: any) => {
        if (typeof link === 'string') return link.startsWith('http');
        return link && typeof link === 'object' && link.url;
      })
    : [];

  const handleAddUrl = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    try {
      const currentLinks = Array.isArray(item.evidenceLinks) ? item.evidenceLinks : [];
      const updatedLinks = [...currentLinks, urlInput.trim()];

      const { error } = await supabase
        .from('gap_analysis_items')
        .update({ evidence_links: updatedLinks })
        .eq('id', item.id);

      if (error) throw error;

      setUrlInput('');
      setShowUrlForm(false);
      onEvidenceChange();
      toast.success('URL added successfully');
    } catch (error) {
      console.error('Error adding URL:', error);
      toast.error('Failed to add URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUrl = async (urlToRemove: string) => {
    setIsLoading(true);
    try {
      const currentLinks = Array.isArray(item.evidenceLinks) ? item.evidenceLinks : [];
      const updatedLinks = currentLinks.filter((link: any) => {
        if (typeof link === 'string') return link !== urlToRemove;
        return link && typeof link === 'object' && link.url !== urlToRemove;
      });

      const { error } = await supabase
        .from('gap_analysis_items')
        .update({ evidence_links: updatedLinks })
        .eq('id', item.id);

      if (error) throw error;

      onEvidenceChange();
      toast.success('URL removed successfully');
    } catch (error) {
      console.error('Error removing URL:', error);
      toast.error('Failed to remove URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    setIsLoading(true);
    try {
      // Delete the link and verify it was deleted
      const { data: deletedData, error } = await supabase
        .from('gap_document_links')
        .delete()
        .eq('gap_item_id', item.id)
        .eq('document_id', documentId)
        .select();

      if (error) {
        console.error('[handleRemoveDocument] Delete error:', error);
        throw error;
      }

      // Verify deletion succeeded
      if (!deletedData || deletedData.length === 0) {
        console.warn('[handleRemoveDocument] No rows deleted - link may not exist or permission denied');
        toast.error('Document link not found or you do not have permission to delete it');
        setIsLoading(false);
        return;
      }

      // Wait a brief moment to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 100));

      // Invalidate all related queries to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gap-linked-documents', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['gap-document-links', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['gap-ci-counts', item.id] }),
        // Invalidate all documents-for-gap queries (with any productId/companyId combination)
        queryClient.invalidateQueries({ queryKey: ['documents-for-gap'], exact: false })
      ]);

      // Refetch local query after invalidation
      await refetchDocuments();
      
      // Trigger parent component updates
      onEvidenceChange();
      
      toast.success('Document removed successfully');
    } catch (error: any) {
      console.error('[handleRemoveDocument] Error removing document:', error);

      // Provide specific error messages
      let errorMessage = 'Failed to remove document';
      if (error?.code === '42501') {
        errorMessage = 'Permission denied. You do not have permission to delete this document link.';
      } else if (error?.message) {
        errorMessage = `Failed to remove document: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAudit = async (auditId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('gap_audit_links')
        .delete()
        .eq('gap_item_id', item.id)
        .eq('audit_id', auditId);

      if (error) throw error;

      // Invalidate all related queries to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gap-linked-audits', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['gap-audit-links', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['gap-ci-counts', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['audits-for-gap'] })
      ]);

      refetchAudits();
      onEvidenceChange();
      toast.success('Audit removed successfully');
    } catch (error) {
      console.error('Error removing audit:', error);
      toast.error('Failed to remove audit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveActivity = async (activityId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('gap_activity_links')
        .delete()
        .eq('gap_item_id', item.id)
        .eq('activity_id', activityId);

      if (error) throw error;

      // Invalidate all related queries to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gap-linked-activities', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['gap-activity-links', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['gap-ci-counts', item.id] }),
        queryClient.invalidateQueries({ queryKey: ['activities-for-gap'] })
      ]);

      refetchActivities();
      onEvidenceChange();
      toast.success('Activity removed successfully');
    } catch (error) {
      console.error('Error removing activity:', error);
      toast.error('Failed to remove activity');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
      case 'in progress':
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 p-4 bg-muted/30 rounded-lg">
      {/* Documents Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold">{lang('gapAnalysis.gapItemEvidence.documents')}</h4>
            <Badge variant="secondary">{linkedDocuments.length}</Badge>
          </div>
        </div>

        {linkedDocuments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{lang('gapAnalysis.gapItemEvidence.noDocumentsLinked')}</p>
        ) : (
          <div className="space-y-2">
            {linkedDocuments.filter(doc => doc && typeof doc === 'object' && doc.id).map((doc: Document) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-background border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="font-medium">{doc.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(doc.status)}
                      <Badge variant="outline" className="text-xs">
                        {doc.status}
                      </Badge>
                      {doc.document_type && (
                        <Badge variant="secondary" className="text-xs">
                          {doc.document_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => !disabled && handleRemoveDocument(doc.id)}
                  disabled={isLoading || disabled}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Audits Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold">{lang('gapAnalysis.gapItemEvidence.audits')}</h4>
            <Badge variant="secondary">{linkedAudits.length}</Badge>
          </div>
        </div>

        {linkedAudits.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{lang('gapAnalysis.gapItemEvidence.noAuditsLinked')}</p>
        ) : (
          <div className="space-y-2">
            {linkedAudits.map((audit: Audit) => (
              <div
                key={audit.id}
                className="flex items-center justify-between p-3 bg-background border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="font-medium">{audit.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(audit.status)}
                      <Badge variant="outline" className="text-xs">
                        {audit.status}
                      </Badge>
                      {audit.date && (
                        <Badge variant="secondary" className="text-xs">
                          {new Date(audit.date).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => !disabled && handleRemoveAudit(audit.id)}
                  disabled={isLoading || disabled}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Activities Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            <h4 className="font-semibold">{lang('gapAnalysis.gapItemEvidence.activities')}</h4>
            <Badge variant="secondary">{linkedActivities.length}</Badge>
          </div>
        </div>

        {linkedActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{lang('gapAnalysis.gapItemEvidence.noActivitiesLinked')}</p>
        ) : (
          <div className="space-y-2">
            {linkedActivities.map((activity: ActivityItem) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-background border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <div>
                    <span className="font-medium">{activity.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(activity.status)}
                      <Badge variant="outline" className="text-xs">
                        {activity.status}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {activity.type}
                      </Badge>
                      {(activity.start_date || activity.end_date || activity.due_date) && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.start_date && activity.end_date ? (
                            `${new Date(activity.start_date).toLocaleDateString()} - ${new Date(activity.end_date).toLocaleDateString()}`
                          ) : activity.due_date ? (
                            `${lang('gapAnalysis.gapItemEvidence.due')} ${new Date(activity.due_date).toLocaleDateString()}`
                          ) : activity.start_date ? (
                            `${lang('gapAnalysis.gapItemEvidence.start')} ${new Date(activity.start_date).toLocaleDateString()}`
                          ) : activity.end_date ? (
                            `${lang('gapAnalysis.gapItemEvidence.end')} ${new Date(activity.end_date).toLocaleDateString()}`
                          ) : null}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => !disabled && handleRemoveActivity(activity.id)}
                  disabled={isLoading || disabled}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* URLs Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold">{lang('gapAnalysis.gapItemEvidence.urls')}</h4>
            <Badge variant="secondary">{urlEvidence.length}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => !disabled && setShowUrlForm(!showUrlForm)}
            className="flex items-center gap-1"
            disabled={disabled}
          >
            <Plus className="h-3 w-3" />
            {lang('gapAnalysis.gapItemEvidence.addUrl')}
          </Button>
        </div>

        {showUrlForm && (
          <div className="mb-4 p-3 bg-background border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="url-input">{lang('gapAnalysis.gapItemEvidence.urlLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  id="url-input"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/evidence"
                  className="flex-1"
                />
                <Button
                  onClick={() => !disabled && handleAddUrl()}
                  disabled={isLoading || !urlInput.trim() || disabled}
                  size="sm"
                >
                  {lang('gapAnalysis.gapItemEvidence.add')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUrlForm(false);
                    setUrlInput('');
                  }}
                  size="sm"
                >
                  {lang('gapAnalysis.gapItemEvidence.cancel')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {urlEvidence.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{lang('gapAnalysis.gapItemEvidence.noUrlsLinked')}</p>
        ) : (
          <div className="space-y-2">
            {urlEvidence.map((evidence: any, index: number) => {
              const url = typeof evidence === 'string' ? evidence : evidence.url;
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-background border rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                    <ExternalLink className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-purple-600 hover:underline max-w-[62rem] truncate min-w-0 flex-1"
                      title={url}
                    >
                      {url}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => !disabled && handleRemoveUrl(url)}
                    disabled={isLoading || disabled}
                    className="text-destructive hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}