import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, ChevronRight, ChevronDown, Loader2, X, AlertTriangle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';

interface DocItem {
  id: string;
  name: string;
  type: string;
  status: string;
  updated_at: string;
  companyName: string;
  companyId: string;
  productId?: string;
  isStarred?: boolean;
  productName?: string;
  phaseName?: string;
}

interface ReviewDoc {
  id: string;
  name: string;
  status: string;
  due_date: string | null;
}

interface MyDocumentsWidgetProps {
  companyId?: string;
  onRemove?: () => void;
}

const ACTIONABLE_STATUSES = ['Not Started', 'In Progress', 'Under Review', 'In Review', 'Pending', 'Changes Requested'];

export function MyDocumentsWidget({ companyId, onRemove }: MyDocumentsWidgetProps) {
  const { user } = useAuth();
  const { companyRoles } = useCompanyRole();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);

  // My documents query — CI-based: docs where user is initiator, reviewer, or approver + starred
  const { data: drafts, isLoading: draftsLoading } = useQuery({
    queryKey: ['my-documents-widget-ci', user?.id, companyId],
    queryFn: async (): Promise<DocItem[]> => {
      if (!user?.id) return [];

      const companyMap = new Map(companyRoles.map(r => [r.companyId, r.companyName]));

      // 1. Fetch user's group memberships for reviewer/approver group matching
      const { data: membershipData } = await supabase
        .from('reviewer_group_members_new')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      const userGroupIds = (membershipData || []).map(m => m.group_id);

      // 2. Build OR filter for docs the user is associated with
      const orParts: string[] = [
        `uploaded_by.eq.${user.id}`,
        `approved_by.eq.${user.id}`,
        `approver_user_ids.cs.{${user.id}}`,
        `reviewer_user_ids.cs.{${user.id}}`,
      ];
      if (userGroupIds.length > 0) {
        orParts.push(`reviewer_group_ids.ov.{${userGroupIds.join(',')}}`);
        orParts.push(`approver_group_ids.ov.{${userGroupIds.join(',')}}`);
      }

      let query = supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_type, status, updated_at, company_id, product_id')
        .eq('is_excluded', false)
        .or(orParts.join(','))
        .order('updated_at', { ascending: false })
        .limit(10);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data: ciDocs } = await query;

      // 3. Fetch starred documents
      const { data: stars } = await supabase
        .from('document_stars')
        .select('document_id')
        .eq('user_id', user.id);

      const starredIds = new Set((stars || []).map(s => s.document_id));

      // 4. If there are starred docs not already in ciDocs, fetch them
      const ciDocIds = new Set((ciDocs || []).map(d => d.id));
      const missingStarredIds = [...starredIds].filter(id => !ciDocIds.has(id));

      let starredDocs: any[] = [];
      if (missingStarredIds.length > 0) {
        let starredQuery = supabase
          .from('phase_assigned_document_template')
          .select('id, name, document_type, status, updated_at, company_id, product_id')
          .eq('is_excluded', false)
          .in('id', missingStarredIds);
        if (companyId) {
          starredQuery = starredQuery.eq('company_id', companyId);
        }
        const { data } = await starredQuery;
        starredDocs = data || [];
      }

      // 5. Merge and deduplicate
      const allDocs = [...(ciDocs || []), ...starredDocs];
      const seen = new Set<string>();
      const deduped = allDocs.filter(d => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });

      // Sort by updated_at desc
      deduped.sort((a, b) => {
        const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bDate - aDate;
      });

      const top10 = deduped.slice(0, 10);

      // 6. Batch-fetch product names for docs with product_id
      const productIds = [...new Set(top10.map(d => d.product_id).filter(Boolean))] as string[];
      let productMap = new Map<string, { name: string; phase: string | null }>();
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, current_lifecycle_phase')
          .in('id', productIds);
        (products || []).forEach(p => {
          productMap.set(p.id, { name: p.name, phase: p.current_lifecycle_phase });
        });
      }

      return top10.map(doc => {
        const prod = doc.product_id ? productMap.get(doc.product_id) : undefined;
        return {
          id: doc.id,
          name: doc.name || 'Untitled',
          type: doc.document_type || 'document',
          status: doc.status || 'Not Started',
          updated_at: doc.updated_at || '',
          companyName: companyMap.get(doc.company_id || '') || 'Unknown',
          companyId: doc.company_id || '',
          productId: doc.product_id || undefined,
          isStarred: starredIds.has(doc.id),
          productName: prod?.name,
          phaseName: prod?.phase || undefined,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Awaiting review query
  const { data: reviewDocs, isLoading: reviewLoading } = useQuery({
    queryKey: ['pending-documents-widget', companyId, user?.id],
    queryFn: async (): Promise<ReviewDoc[]> => {
      if (!user?.id || !companyId) return [];

      const { data: membershipData } = await supabase
        .from('reviewer_group_members_new')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const reviewerGroupIds = (membershipData || []).map(m => m.group_id);
      if (reviewerGroupIds.length === 0) return [];

      const { data: phaseDocs } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, status, due_date, deadline, company_phases!inner(company_id)')
        .eq('company_phases.company_id', companyId)
        .overlaps('reviewer_group_ids', reviewerGroupIds)
        .eq('is_excluded', false)
        .in('status', ACTIONABLE_STATUSES)
        .limit(10);

      const { data: regularDocs } = await supabase
        .from('documents')
        .select('id, name, status, due_date')
        .eq('company_id', companyId)
        .overlaps('reviewer_group_ids', reviewerGroupIds)
        .in('status', ACTIONABLE_STATUSES)
        .limit(10);

      const allDocs = [
        ...(phaseDocs || []).map((doc: any) => ({
          id: doc.id, name: doc.name, status: doc.status, due_date: doc.due_date || doc.deadline,
        })),
        ...(regularDocs || []).map((doc: any) => ({
          id: doc.id, name: doc.name, status: doc.status, due_date: doc.due_date,
        })),
      ];

      const seen = new Set<string>();
      return allDocs.filter(doc => {
        if (seen.has(doc.id)) return false;
        seen.add(doc.id);
        return true;
      }).slice(0, 5);
    },
    enabled: !!user?.id && !!companyId,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = draftsLoading || reviewLoading;
  const draftItems = drafts || [];
  const reviewItems = reviewDocs || [];
  const totalCount = draftItems.length + reviewItems.length;
  const overdueDocs = reviewItems.filter(d => d.due_date && new Date(d.due_date) < new Date());

  const displayStatus = (status: string) => {
    if (status === 'Under Review') return 'In Review';
    return status;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            My Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading documents…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalCount === 0) return null;

  const currentCompanyRole = companyId
    ? companyRoles.find(r => r.companyId === companyId)
    : companyRoles[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            My Documents
            <Badge variant="secondary" className="text-xs">{totalCount}</Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
            {onRemove && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* My Documents */}
        {draftItems.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">My Documents</p>
            <div className="divide-y divide-border">
              {draftItems.slice(0, isExpanded ? undefined : 3).map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                  onClick={() => setSelectedDoc(item)}
                >
                  <div className="min-w-0 flex-1 flex items-center gap-1.5">
                    {item.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                    <div className="min-w-0 flex-1">
                       <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.type}</span>
                        {item.updated_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/70">
                        {item.productName
                          ? `${item.productName}${item.phaseName ? ` | ${item.phaseName}` : ''}`
                          : 'Enterprise'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{displayStatus(item.status)}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Awaiting Review */}
        {reviewItems.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Awaiting Review</p>
            {overdueDocs.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                <AlertTriangle className="h-4 w-4" />
                {overdueDocs.length} overdue
              </div>
            )}
            <div className="space-y-2">
              {reviewItems.slice(0, isExpanded ? undefined : 3).map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between text-sm p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    if (currentCompanyRole) {
                      navigate(`/app/company/${encodeURIComponent(currentCompanyRole.companyName)}/review`);
                    }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">Document awaiting review</p>
                  </div>
                  <Badge
                    variant={doc.status === 'In Review' || doc.status === 'Under Review' ? 'default' : 'secondary'}
                    className="text-xs ml-2 shrink-0"
                  >
                    {displayStatus(doc.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View All — expand/collapse */}
        {(draftItems.length > 3 || reviewItems.length > 3) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : 'View all documents'}
            {isExpanded ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}
          </Button>
        )}

        {/* Document Draft Side Drawer */}
        <DocumentDraftDrawer
          open={!!selectedDoc}
          onOpenChange={(open) => { if (!open) setSelectedDoc(null); }}
          documentId={selectedDoc?.id || ''}
          documentName={selectedDoc?.name || ''}
          documentType={selectedDoc?.type || ''}
          companyId={selectedDoc?.companyId}
          companyName={selectedDoc?.companyName}
          productId={selectedDoc?.productId}
        />
      </CardContent>
    </Card>
  );
}
