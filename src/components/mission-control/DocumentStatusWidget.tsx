import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCheck, X, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface DocumentStatusWidgetProps {
  companyId?: string;
  onRemove?: () => void;
}

const ACTIONABLE_STATUSES = ['Not Started', 'In Progress', 'Under Review', 'In Review', 'Pending', 'Changes Requested'];

export function DocumentStatusWidget({ companyId, onRemove }: DocumentStatusWidgetProps) {
  const { user } = useAuth();
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const companyName = user?.user_metadata?.lastSelectedCompany || user?.user_metadata?.activeCompany || '';

  const { data: pendingDocs, isLoading } = useQuery({
    queryKey: ['pending-documents', companyId, user?.id],
    queryFn: async () => {
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
      }).slice(0, 10);
    },
    enabled: !!user && !!companyId,
  });

  const overdueDocs = pendingDocs?.filter(d => d.due_date && new Date(d.due_date) < new Date()) || [];

  const displayStatus = (status: string) => {
    if (status === 'Under Review') return 'In Review';
    return status;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-4 w-4" />
            {lang('missionControl.widgets.documentStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const docList = (docs: typeof pendingDocs, maxItems?: number) => (
    <div className="space-y-2">
      {overdueDocs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-destructive font-medium">
          <AlertTriangle className="h-4 w-4" />
          {overdueDocs.length} {lang('missionControl.widgets.docsOverdue')}
        </div>
      )}
      {(docs || []).slice(0, maxItems).map(doc => (
        <div
          key={doc.id}
          className="flex items-center justify-between text-sm p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate(`/app/company/${encodeURIComponent(companyName)}/review`)}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{doc.name}</p>
            <p className="text-xs text-muted-foreground">Document awaiting review</p>
          </div>
          <Badge variant={doc.status === 'In Review' || doc.status === 'Under Review' ? 'default' : 'secondary'} className="text-xs ml-2 shrink-0">
            {displayStatus(doc.status)}
          </Badge>
        </div>
      ))}
      {docs && maxItems && docs.length > maxItems && (
        <p className="text-xs text-muted-foreground text-center">
          +{docs.length - maxItems} {lang('missionControl.widgets.moreDocuments')}
        </p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-4 w-4" />
            {lang('missionControl.widgets.documentStatus')}
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
      <CardContent>
        {(!pendingDocs || pendingDocs.length === 0) ? (
          <p className="text-sm text-muted-foreground">{lang('missionControl.widgets.noDocsPending')}</p>
        ) : isExpanded ? docList(pendingDocs) : docList(pendingDocs, 3)}
      </CardContent>
    </Card>
  );
}
