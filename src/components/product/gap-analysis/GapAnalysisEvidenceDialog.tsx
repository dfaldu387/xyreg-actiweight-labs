import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Calendar, 
  Activity, 
  ExternalLink, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { autoLinkMultipleToTechnicalFile } from '@/utils/technicalFileAutoLink';

interface Document {
  id: string;
  name: string;
  status: string;
  document_type: string;
  phase_name?: string;
  uploaded_at?: string;
  isLinked?: boolean;
}

interface Audit {
  id: string;
  name: string;
  status: string;
  date?: string;
  audit_type?: string;
  isLinked?: boolean;
}

interface ActivityItem {
  id: string;
  name: string;
  status: string;
  type: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  phase_id?: string;
  isLinked?: boolean;
}

interface GapAnalysisEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  productId?: string;
  companyId?: string;
  onEvidenceAdded: () => void;
}

export function GapAnalysisEvidenceDialog({
  open,
  onOpenChange,
  itemId,
  productId,
  companyId,
  onEvidenceAdded
}: GapAnalysisEvidenceDialogProps) {
  const [activeTab, setActiveTab] = useState('url');
  const [urlInput, setUrlInput] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedAudits, setSelectedAudits] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Use cached user from context instead of calling getUser()

  // Fetch existing URLs
  const { data: existingUrls = [], refetch: refetchUrls } = useQuery({
    queryKey: ['gap-url-evidence', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_analysis_items')
        .select('evidence_links')
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      
      const evidenceLinks = Array.isArray(data?.evidence_links) ? data.evidence_links : [];
      // Filter for URLs (strings starting with http or objects with url property)
      return evidenceLinks.filter((link: any) => {
        if (typeof link === 'string') return link.startsWith('http');
        return link && typeof link === 'object' && link.url;
      }).map((link: any) => {
        // Normalize to string format for display
        if (typeof link === 'string') return link;
        return link.url || link;
      });
    },
    enabled: open && !!itemId && activeTab === 'url',
    staleTime: 0, // Always refetch to get latest data
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Refetch URLs when switching to URL tab
  useEffect(() => {
    if (open && activeTab === 'url' && itemId) {
      refetchUrls();
    }
  }, [activeTab, open, itemId, refetchUrls]);

  // Fetch existing document links
  const { data: existingDocumentLinks = [] } = useQuery({
    queryKey: ['gap-document-links', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_document_links')
        .select('document_id')
        .eq('gap_item_id', itemId);
      if (error) throw error;
      return data.map(link => link.document_id);
    },
    enabled: open && !!itemId,
    staleTime: 30000, // 30 seconds - prevent duplicate requests
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Fetch available documents
  // Use length instead of array to prevent unnecessary refetches when array reference changes
  const existingDocumentLinksLength = existingDocumentLinks?.length ?? 0;
  const { data: documents = [] } = useQuery({
    queryKey: ['documents-for-gap', productId, companyId, existingDocumentLinksLength],
    queryFn: async () => {
      let query = supabase
        .from('company_template_documents_by_phase')
        .select('id, name, status, document_type, phase_name, uploaded_at')
        .order('name');

      if (productId && companyId) {
        // Product context: show product-specific documents AND company-level documents
        query = query.eq('company_id', companyId).or(`product_id.eq.${productId},product_id.is.null`);
      } else if (productId) {
        // Fallback: only product_id available
        query = query.eq('product_id', productId);
      } else if (companyId) {
        // Company context: show only company-level documents (no product_id)
        query = query.eq('company_id', companyId).is('product_id', null);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }

      // Handle case where data might be null or empty
      if (!data || !Array.isArray(data)) {
        console.warn('No documents found or invalid data format');
        return [];
      }

      return data.map(doc => ({
        id: doc.id,
        name: doc.name,
        status: doc.status,
        document_type: doc.document_type,
        phase_name: doc.phase_name,
        uploaded_at: doc.uploaded_at,
        isLinked: existingDocumentLinks.includes(doc.id)
      }));
    },
    enabled: open && (!!productId || !!companyId) && existingDocumentLinks !== undefined,
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Fetch existing audit links
  const { data: existingAuditLinks = [] } = useQuery({
    queryKey: ['gap-audit-links', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_audit_links')
        .select('audit_id')
        .eq('gap_item_id', itemId);
      if (error) throw error;
      return data.map(link => link.audit_id);
    },
    enabled: open && !!itemId,
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Fetch available audits
  // Use length instead of array to prevent unnecessary refetches when array reference changes
  const existingAuditLinksLength = existingAuditLinks?.length ?? 0;
  const { data: audits = [] } = useQuery({
    queryKey: ['audits-for-gap', productId, companyId, existingAuditLinksLength],
    queryFn: async () => {
      if (productId) {
        const { data, error } = await supabase
          .from('product_audits')
          .select('id, audit_name, status, deadline_date, audit_type')
          .eq('product_id', productId)
          .order('deadline_date', { ascending: true });
        if (error) throw error;
        return data.map(item => ({ 
          id: item.id,
          name: item.audit_name,
          status: item.status,
          date: item.deadline_date,
          audit_type: item.audit_type,
          isLinked: existingAuditLinks.includes(item.id)
        })) as Audit[];
      } else if (companyId) {
        const { data, error } = await supabase
          .from('company_audits')
          .select('id, audit_name, status, deadline_date, audit_type')
          .eq('company_id', companyId)
          .order('audit_name');
        if (error) throw error;
        return data.map(item => ({ 
          id: item.id,
          name: item.audit_name,
          status: item.status,
          date: item.deadline_date,
          audit_type: item.audit_type,
          isLinked: existingAuditLinks.includes(item.id)
        })) as Audit[];
      }
      return [];
    },
    enabled: open && (!!productId || !!companyId) && existingAuditLinks !== undefined
  });

  // Fetch existing activity links
  const { data: existingActivityLinks = [] } = useQuery({
    queryKey: ['gap-activity-links', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_activity_links')
        .select('activity_id')
        .eq('gap_item_id', itemId);
      if (error) throw error;
      return data.map(link => link.activity_id);
    },
    enabled: open && !!itemId,
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Fetch available activities
  // Use length instead of array to prevent unnecessary refetches when array reference changes
  const existingActivityLinksLength = existingActivityLinks?.length ?? 0;
  const { data: activities = [] } = useQuery({
    queryKey: ['activities-for-gap', productId, companyId, existingActivityLinksLength],
    queryFn: async () => {
      if (!companyId) {
        return [];
      }

      let query = supabase
        .from('activities')
        .select('id, name, status, type, start_date, end_date, due_date, updated_at, phase_id')
        .eq('company_id', companyId);

      if (productId) {
        // Product context: show only product-specific activities
        query = query.eq('product_id', productId);
      } else {
        // Company context: show only company-level activities (product_id is null)
        query = query.is('product_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      return (data as ActivityItem[]).map(activity => ({
        ...activity,
        isLinked: existingActivityLinks.includes(activity.id)
      }));
    },
    enabled: open && !!companyId && existingActivityLinks !== undefined
  });

  const handleAddUrl = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    try {
      // Get current evidence links
      const { data: currentItem } = await supabase
        .from('gap_analysis_items')
        .select('evidence_links')
        .eq('id', itemId)
        .single();

      const currentLinks = Array.isArray(currentItem?.evidence_links) ? currentItem.evidence_links : [];
      const updatedLinks = [...currentLinks, urlInput.trim()];

      const { error } = await supabase
        .from('gap_analysis_items')
        .update({ evidence_links: updatedLinks })
        .eq('id', itemId);

      if (error) throw error;

      setUrlInput('');
      // Refresh the URLs list
      await refetchUrls();
      // Invalidate related queries
      await queryClient.invalidateQueries({ queryKey: ['gap-url-evidence', itemId] });
      await queryClient.invalidateQueries({ queryKey: ['gap-ci-counts', itemId] });
      onEvidenceAdded();
      toast.success('URL added successfully');
    } catch (error) {
      console.error('Error adding URL:', error);
      toast.error('Failed to add URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkDocuments = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select at least one document to link');
      return;
    }

    if (!itemId) {
      toast.error('Invalid gap analysis item. Please refresh and try again.');
      return;
    }

    setIsLoading(true);
    try {
      // Filter out already linked documents
      const unlinkedDocuments = selectedDocuments.filter(docId => !existingDocumentLinks.includes(docId));
      
      if (unlinkedDocuments.length === 0) {
        toast.info('All selected documents are already linked');
        setSelectedDocuments([]);
        setIsLoading(false);
        return;
      }

      // Check if gap item exists and is accessible
      const { data: gapItem, error: gapItemError } = await supabase
        .from('gap_analysis_items')
        .select('id, product_id')
        .eq('id', itemId)
        .single();

      if (gapItemError || !gapItem) {
        console.error('[handleLinkDocuments] Gap item not found or not accessible:', {
          itemId,
          error: gapItemError
        });
        toast.error('Gap analysis item not found. Please refresh and try again.');
        setIsLoading(false);
        return;
      }

      // Validate document IDs exist in the documents view
      const { data: validDocuments, error: docValidationError } = await supabase
        .from('company_template_documents_by_phase')
        .select('id')
        .in('id', unlinkedDocuments);

      if (docValidationError) {
        console.error('[handleLinkDocuments] Error validating documents:', docValidationError);
        toast.error('Error validating documents. Please try again.');
        setIsLoading(false);
        return;
      }

      const validDocumentIds = validDocuments?.map(doc => doc.id) || [];
      const invalidDocumentIds = unlinkedDocuments.filter(id => !validDocumentIds.includes(id));

      if (invalidDocumentIds.length > 0) {
        console.warn('[handleLinkDocuments] Some documents are invalid or not accessible:', invalidDocumentIds);
        toast.error(`${invalidDocumentIds.length} document(s) are invalid or not accessible. Please refresh and try again.`);
        setIsLoading(false);
        return;
      }

      // Use cached user from context (no API call needed)
      // Create links with user_id if available
      const links = unlinkedDocuments.map(docId => ({
        gap_item_id: itemId,
        document_id: docId,
        ...(user?.id && { user_id: user.id }) // Add user_id if user is authenticated
      }));

      const { data: insertedLinks, error: insertError } = await supabase
        .from('gap_document_links')
        .insert(links)
        .select();

      if (insertError) {

        let errorMessage = 'Failed to link documents';
        
        if (insertError.code === '42501') {
          errorMessage = 'Permission denied. You do not have permission to link documents to this gap item.';
        } else if (insertError.code === '23503') {
          errorMessage = 'Invalid document or gap item reference. Please refresh and try again.';
        } else if (insertError.code === '23505') {
          errorMessage = 'One or more documents are already linked. Please refresh and try again.';
        } else if (insertError.message) {
          errorMessage = `Failed to link documents: ${insertError.message}`;
        }

        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Auto-link to Technical File (best-effort)
      autoLinkMultipleToTechnicalFile(itemId, unlinkedDocuments, productId).then(() =>
        queryClient.invalidateQueries({ queryKey: ['technical-file-doc-links'] })
      );

      // Invalidate and refetch queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gap-document-links', itemId] }),
        queryClient.invalidateQueries({ queryKey: ['gap-ci-counts', itemId] }),
        queryClient.invalidateQueries({ queryKey: ['documents-for-gap', productId, companyId] }),
        queryClient.invalidateQueries({ queryKey: ['gap-linked-documents', itemId] })
      ]);

      setSelectedDocuments([]);
      onEvidenceAdded();
      
      const alreadyLinkedCount = selectedDocuments.length - unlinkedDocuments.length;
      if (alreadyLinkedCount > 0) {
        toast.success(`${unlinkedDocuments.length} document(s) linked successfully. ${alreadyLinkedCount} were already linked.`);
      } else {
        toast.success(`${unlinkedDocuments.length} document(s) linked successfully`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Failed to link documents: ${error.message}`
        : 'An unexpected error occurred while linking documents. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAudits = async () => {
    if (selectedAudits.length === 0) return;

    setIsLoading(true);
    try {
      // Filter out already linked audits
      const unlinkedAudits = selectedAudits.filter(auditId => !existingAuditLinks.includes(auditId));
      
      if (unlinkedAudits.length === 0) {
        toast.info('All selected audits are already linked');
        setSelectedAudits([]);
        setIsLoading(false);
        return;
      }

      const links = unlinkedAudits.map(auditId => ({
        gap_item_id: itemId,
        audit_id: auditId,
        audit_type: productId ? 'product' : 'company'
      }));

      const { error } = await supabase
        .from('gap_audit_links')
        .insert(links);

      if (error) throw error;

      // Invalidate all related queries to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gap-linked-audits', itemId] }),
        queryClient.invalidateQueries({ queryKey: ['gap-audit-links', itemId] }),
        queryClient.invalidateQueries({ queryKey: ['gap-ci-counts', itemId] }),
        queryClient.invalidateQueries({ queryKey: ['audits-for-gap', productId, companyId] })
      ]);

      setSelectedAudits([]);
      onEvidenceAdded();
      
      const alreadyLinkedCount = selectedAudits.length - unlinkedAudits.length;
      if (alreadyLinkedCount > 0) {
        toast.success(`${unlinkedAudits.length} audit(s) linked successfully. ${alreadyLinkedCount} were already linked.`);
      } else {
        toast.success(`${unlinkedAudits.length} audit(s) linked successfully`);
      }
    } catch (error) {
      console.error('Error linking audits:', error);
      toast.error('Failed to link audits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkActivities = async () => {
    if (selectedActivities.length === 0) return;

    setIsLoading(true);
    try {
      // Filter out already linked activities
      const unlinkedActivities = selectedActivities.filter(activityId => !existingActivityLinks.includes(activityId));
      
      if (unlinkedActivities.length === 0) {
        toast.info('All selected activities are already linked');
        setSelectedActivities([]);
        setIsLoading(false);
        return;
      }

      // Use cached user from context (no API call needed)
      // Create links with user_id if available
      const links = unlinkedActivities.map(activityId => ({
        gap_item_id: itemId,
        activity_id: activityId,
        ...(user?.id && { user_id: user.id }) // Add user_id if user is authenticated
      }));

      const { error } = await supabase
        .from('gap_activity_links')
        .insert(links);

      if (error) throw error;

      // Invalidate all related queries to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gap-activity-links', itemId] }),
        queryClient.invalidateQueries({ queryKey: ['gap-linked-activities', itemId] }),
        queryClient.invalidateQueries({ queryKey: ['gap-ci-counts', itemId] }),
        queryClient.invalidateQueries({ queryKey: ['activities-for-gap', productId, companyId] })
      ]);

      setSelectedActivities([]);
      onEvidenceAdded();
      
      const alreadyLinkedCount = selectedActivities.length - unlinkedActivities.length;
      if (alreadyLinkedCount > 0) {
        toast.success(`${unlinkedActivities.length} activity(ies) linked successfully. ${alreadyLinkedCount} were already linked.`);
      } else {
        toast.success(`${unlinkedActivities.length} activity(ies) linked successfully`);
      }
    } catch (error) {
      console.error('Error linking activities:', error);
      toast.error('Failed to link activities');
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'default';
      case 'in_progress':
      case 'in progress':
      case 'under_review':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Evidence</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="audits" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Audits
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">External URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url-input"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/evidence-document"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading && urlInput.trim()) {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                />
                <Button 
                  onClick={handleAddUrl} 
                  disabled={isLoading || !urlInput.trim()}
                >
                  Add URL
                </Button>
              </div>
            </div>
            
            {/* Existing URLs Preview */}
            {existingUrls.length > 0 && (
              <div className="space-y-2">
                <Label>Existing URLs ({existingUrls.length})</Label>
                <ScrollArea className="max-h-64 overflow-y-auto border rounded-lg p-3">
                  <div className="space-y-2">
                    {existingUrls.map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-purple-800 font-bold flex-shrink-0" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-purple-800 hover:underline truncate max-w-[45rem]"
                          title={url}
                        >
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            {existingUrls.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No URLs added yet. Add your first URL above.
              </p>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Select Documents to Link</Label>
              <Button 
                onClick={handleLinkDocuments}
                disabled={isLoading || selectedDocuments.length === 0}
                size="sm"
              >
                Link {selectedDocuments.length} Document(s)
              </Button>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      doc.isLinked 
                        ? 'border-green-200 bg-green-50 opacity-75 cursor-not-allowed' 
                        : selectedDocuments.includes(doc.id)
                        ? 'border-primary bg-primary/10 cursor-pointer'
                        : 'border-border hover:border-primary/50 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!doc.isLinked) {
                        setSelectedDocuments(prev =>
                          prev.includes(doc.id)
                            ? prev.filter(id => id !== doc.id)
                            : [...prev, doc.id]
                        );
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{doc.name}</span>
                          {doc.isLinked && (
                            <Badge variant="secondary" className="text-xs">Already Linked</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(doc.status)}
                          <Badge variant={getStatusBadgeVariant(doc.status)}>
                            {doc.status}
                          </Badge>
                          {doc.document_type && (
                            <Badge variant="outline">{doc.document_type}</Badge>
                          )}
                        </div>
                        {doc.phase_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Phase: {doc.phase_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No documents available
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="audits" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Select Audits to Link</Label>
              <Button 
                onClick={handleLinkAudits}
                disabled={isLoading || selectedAudits.length === 0}
                size="sm"
              >
                Link {selectedAudits.length} Audit(s)
              </Button>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {audits.map((audit) => (
                  <div
                    key={audit.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      audit.isLinked 
                        ? 'border-green-200 bg-green-50 opacity-75 cursor-not-allowed' 
                        : selectedAudits.includes(audit.id)
                        ? 'border-primary bg-primary/10 cursor-pointer'
                        : 'border-border hover:border-primary/50 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!audit.isLinked) {
                        setSelectedAudits(prev =>
                          prev.includes(audit.id)
                            ? prev.filter(id => id !== audit.id)
                            : [...prev, audit.id]
                        );
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">{audit.name}</span>
                          {audit.isLinked && (
                            <Badge variant="secondary" className="text-xs">Already Linked</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(audit.status)}
                          <Badge variant={getStatusBadgeVariant(audit.status)}>
                            {audit.status}
                          </Badge>
                          {audit.audit_type && (
                            <Badge variant="outline">{audit.audit_type}</Badge>
                          )}
                        </div>
                        {audit.date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Date: {new Date(audit.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {audits.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No audits available
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Select Activities to Link</Label>
              <Button 
                onClick={handleLinkActivities}
                disabled={isLoading || selectedActivities.length === 0}
                size="sm"
              >
                Link {selectedActivities.length} Activity(ies)
              </Button>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      activity.isLinked 
                        ? 'border-green-200 bg-green-50 opacity-75 cursor-not-allowed' 
                        : selectedActivities.includes(activity.id)
                        ? 'border-primary bg-primary/10 cursor-pointer'
                        : 'border-border hover:border-primary/50 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!activity.isLinked) {
                        setSelectedActivities(prev =>
                          prev.includes(activity.id)
                            ? prev.filter(id => id !== activity.id)
                            : [...prev, activity.id]
                        );
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          <span className="font-medium">{activity.name}</span>
                          {activity.isLinked && (
                            <Badge variant="secondary" className="text-xs">Already Linked</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(activity.status)}
                          <Badge variant={getStatusBadgeVariant(activity.status)}>
                            {activity.status}
                          </Badge>
                          <Badge variant="outline">{activity.type}</Badge>
                        </div>
                        {(activity.start_date || activity.end_date || activity.due_date) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.start_date && activity.end_date ? (
                              <>
                                {new Date(activity.start_date).toLocaleDateString()} - {new Date(activity.end_date).toLocaleDateString()}
                              </>
                            ) : activity.due_date ? (
                              <>Due: {new Date(activity.due_date).toLocaleDateString()}</>
                            ) : activity.start_date ? (
                              <>Start: {new Date(activity.start_date).toLocaleDateString()}</>
                            ) : activity.end_date ? (
                              <>End: {new Date(activity.end_date).toLocaleDateString()}</>
                            ) : null}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No activities available
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}