import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Calendar, 
  Activity, 
  ExternalLink, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  FileCheck
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  name: string;
  status: string;
  document_type: string;
  phase_name?: string;
  uploaded_at?: string;
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
  due_date?: string;
}

interface GapAnalysisEvidenceSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  productId?: string;
  companyId?: string;
  requirement: string;
}

export function GapAnalysisEvidenceSummary({
  open,
  onOpenChange,
  itemId,
  productId,
  companyId,
  requirement
}: GapAnalysisEvidenceSummaryProps) {

  // Fetch linked documents
  const { data: linkedDocuments = [] } = useQuery({
    queryKey: ['gap-linked-documents', itemId],
    queryFn: async () => {
      // First get document IDs
      const { data: links, error: linksError } = await supabase
        .from('gap_document_links')
        .select('document_id')
        .eq('gap_item_id', itemId);
      
      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      // Then fetch document details
      const { data: documents, error: docsError } = await supabase
        .from('company_template_documents_by_phase')
        .select('id, name, status, document_type, uploaded_at')
        .in('id', links.map(link => link.document_id));
      
      if (docsError) throw docsError;
      return documents || [];
    },
    enabled: open && !!itemId
  });

  // Fetch linked audits
  const { data: linkedAudits = [] } = useQuery({
    queryKey: ['gap-linked-audits', itemId],
    queryFn: async () => {
      // First get audit IDs and types
      const { data: links, error: linksError } = await supabase
        .from('gap_audit_links')
        .select('audit_id, audit_type')
        .eq('gap_item_id', itemId);
      
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
    enabled: open && !!itemId && (!!productId || !!companyId),
    refetchOnMount: true,
    staleTime: 0
  });

  // Fetch linked activities
  const { data: linkedActivities = [] } = useQuery({
    queryKey: ['gap-linked-activities', itemId],
    queryFn: async () => {
      // First get activity IDs
      const { data: links, error: linksError } = await supabase
        .from('gap_activity_links')
        .select('activity_id')
        .eq('gap_item_id', itemId);
      
      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      // Then fetch activity details
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, name, status, type, start_date, end_date, due_date, updated_at')
        .in('id', links.map(link => link.activity_id));
      
      if (activitiesError) throw activitiesError;
      return activities || [];
    },
    enabled: open && !!itemId
  });

  // Fetch URL evidence
  const { data: urlEvidence = [] } = useQuery({
    queryKey: ['gap-url-evidence', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_analysis_items')
        .select('evidence_links')
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      
      // Handle both old string[] and new EvidenceItem[] formats
      const evidenceLinks = data?.evidence_links || [];
      return Array.isArray(evidenceLinks) 
        ? evidenceLinks.filter((link: any) => {
            if (typeof link === 'string') {
              return link.startsWith('http');
            }
            return link && typeof link === 'object' && link.url;
          })
        : [];
    },
    enabled: open && !!itemId
  });

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

  const categorizeEvidence = () => {
    const documentation: Array<{
      type: 'document' | 'url';
      name: string;
      status?: string;
      document_type?: string;
      url?: string;
      evidence_type?: string;
      description?: string;
    }> = [];
    
    const verification: Array<{
      type: 'audit' | 'activity' | 'url';
      name: string;
      status?: string;
      audit_type?: string;
      activity_type?: string;
      date?: string;
      url?: string;
      evidence_type?: string;
      description?: string;
    }> = [];

    const compliance: Array<{
      type: 'url';
      name: string;
      url?: string;
      evidence_type?: string;
      description?: string;
    }> = [];

    // Categorize documents
    linkedDocuments.forEach(doc => {
      // Handle potential error objects
      if (doc && typeof doc === 'object' && doc.name) {
        documentation.push({
          type: 'document',
          name: doc.name,
          status: doc.status || 'Unknown',
          document_type: doc.document_type || 'Unknown'
        });
      }
    });

    // Categorize URLs based on their type
    urlEvidence.forEach(evidence => {
      if (typeof evidence === 'string') {
        // Old format - default to documentation
        try {
          documentation.push({
            type: 'url',
            name: new URL(evidence).hostname.replace('www.', ''),
            url: evidence,
            evidence_type: 'Legacy URL'
          });
        } catch (e) {
          // Skip invalid URLs
        }
      } else if (evidence && typeof evidence === 'object' && !Array.isArray(evidence) && 
                 typeof (evidence as any).url === 'string') {
        // New format with structured data
        const evidenceObj = evidence as any;
        const item = {
          type: 'url' as const,
          name: evidenceObj.name || new URL(evidenceObj.url).hostname.replace('www.', ''),
          url: evidenceObj.url,
          evidence_type: evidenceObj.type || 'Documentation',
          description: evidenceObj.description
        };

        switch (evidenceObj.type) {
          case 'Verification':
            verification.push(item);
            break;
          case 'Compliance':
            compliance.push(item);
            break;
          case 'Documentation':
          default:
            documentation.push(item);
            break;
        }
      }
    });

    // Categorize audits as verification
    linkedAudits.forEach(audit => {
      verification.push({
        type: 'audit',
        name: audit.name,
        status: audit.status,
        audit_type: (audit as any).audit_type,
        date: audit.date
      });
    });

    // Categorize activities as verification
    linkedActivities.forEach(activity => {
      verification.push({
        type: 'activity',
        name: activity.name,
        status: activity.status,
        activity_type: activity.type,
        date: activity.due_date
      });
    });

    return { documentation, verification, compliance };
  };

  const { documentation, verification, compliance } = categorizeEvidence();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Evidence Summary
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {requirement}
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Documentation Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Documentation</h3>
                <Badge variant="secondary">{documentation.length}</Badge>
              </div>
              
              {documentation.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No documentation evidence linked</p>
              ) : (
                <div className="space-y-3">
                  {documentation.map((item, index) => (
                    <div
                      key={`doc-${index}`}
                      className="p-3 border rounded-lg bg-blue-50/50 hover:bg-blue-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {item.type === 'document' ? (
                            <FileText className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ExternalLink className="h-4 w-4 text-purple-600" />
                          )}
                          {item.type === 'url' ? (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {item.name}
                            </a>
                          ) : (
                            <span className="font-medium">{item.name}</span>
                          )}
                        </div>
                        
                        {item.status && (
                          <div className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            <Badge variant="outline" className="text-xs">
                              {item.status}
                            </Badge>
                          </div>
                        )}
                        
                        {(item.document_type || item.evidence_type) && (
                          <Badge variant="secondary" className="text-xs">
                            {item.document_type || item.evidence_type}
                          </Badge>
                        )}
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-2 pl-6">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Compliance Section */}
            {compliance.length > 0 && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Compliance</h3>
                    <Badge variant="secondary">{compliance.length}</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {compliance.map((item, index) => (
                      <div
                        key={`comp-${index}`}
                        className="p-3 border rounded-lg bg-purple-50/50 hover:bg-purple-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-purple-600" />
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-purple-600 hover:underline"
                            >
                              {item.name}
                            </a>
                          </div>
                          
                          {item.evidence_type && (
                            <Badge variant="secondary" className="text-xs">
                              {item.evidence_type}
                            </Badge>
                          )}
                        </div>
                        
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-2 pl-6">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Verification Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Verification</h3>
                <Badge variant="secondary">{verification.length}</Badge>
              </div>
              
              {verification.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No verification evidence linked</p>
              ) : (
                <div className="space-y-3">
                  {verification.map((item, index) => (
                    <div
                      key={`ver-${index}`}
                      className="p-3 border rounded-lg bg-green-50/50 hover:bg-green-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {item.type === 'audit' ? (
                            <Calendar className="h-4 w-4 text-green-600" />
                          ) : item.type === 'activity' ? (
                            <Activity className="h-4 w-4 text-orange-600" />
                          ) : (
                            <ExternalLink className="h-4 w-4 text-purple-600" />
                          )}
                          
                          {item.type === 'url' ? (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-purple-600 hover:underline"
                            >
                              {item.name}
                            </a>
                          ) : (
                            <span className="font-medium">{item.name}</span>
                          )}
                        </div>
                        
                        {item.status && (
                          <div className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            <Badge variant="outline" className="text-xs">
                              {item.status}
                            </Badge>
                          </div>
                        )}
                        
                        {(item.audit_type || item.activity_type || item.evidence_type) && (
                          <Badge variant="secondary" className="text-xs">
                            {item.audit_type || item.activity_type || item.evidence_type}
                          </Badge>
                        )}
                        
                        {item.date && (
                          <Badge variant="outline" className="text-xs">
                            {new Date(item.date).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-2 pl-6">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}