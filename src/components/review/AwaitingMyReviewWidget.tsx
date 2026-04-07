import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileSearch, Clock, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';

interface ReviewItem {
  id: string;
  name: string;
  status: string;
  dueDate: string | null;
  companyName: string;
  companyId: string;
}

export function AwaitingMyReviewWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['awaiting-review-widget', user?.id],
    queryFn: async (): Promise<ReviewItem[]> => {
      if (!user?.id) return [];

      // 1. Get user's reviewer groups
      const { data: memberships } = await supabase
        .from('reviewer_group_members_new')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const groupIds = (memberships || []).map(m => m.group_id);
      if (groupIds.length === 0) return [];

      const ACTIONABLE_STATUSES = ['Not Started', 'In Progress', 'Under Review', 'In Review', 'Pending', 'Changes Requested'];

      // 2. Fetch phase-assigned docs needing review
      const { data: docs } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, status, due_date, deadline, company_id, company_phases!inner(company_id)')
        .or(`reviewer_group_ids.ov.{${groupIds.join(',')}},reviewer_user_ids.cs.{${user.id}}`)
        .eq('is_excluded', false)
        .in('status', ACTIONABLE_STATUSES)
        .limit(20);

      if (!docs || docs.length === 0) return [];

      // 3. Get company names
      const companyIds = [...new Set(docs.map(d => {
        const cp = d.company_phases as any;
        return cp?.company_id;
      }).filter(Boolean))];

      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      const companyMap = new Map((companies || []).map(c => [c.id, c.name]));

      return docs.map(doc => {
        const cp = doc.company_phases as any;
        const cId = cp?.company_id || doc.company_id;
        return {
          id: doc.id,
          name: doc.name,
          status: doc.status || 'Pending',
          dueDate: doc.due_date || doc.deadline || null,
          companyName: companyMap.get(cId) || 'Unknown',
          companyId: cId,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const items = data || [];
  const overdueCount = items.filter(i => i.dueDate && isPast(new Date(i.dueDate))).length;
  const displayItems = items.slice(0, 5);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading reviews…</span>
        </div>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Awaiting My Review</h3>
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertCircle className="w-3 h-3" />
              {overdueCount} overdue
            </Badge>
          )}
        </div>
      </div>

      <div className="divide-y divide-border">
        {displayItems.map(item => {
          const isOverdue = item.dueDate && isPast(new Date(item.dueDate));
          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
              onClick={() => navigate(`/app/company/${encodeURIComponent(item.companyName)}/review?highlight=${item.id}&autoopen=true&t=${Date.now()}`)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.companyName}</span>
                  {item.dueDate && (
                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                      <Clock className="w-3 h-3" />
                      {format(new Date(item.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{item.status}</Badge>
            </div>
          );
        })}
      </div>

      {items.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => {
            const firstItem = items[0];
            if (firstItem) {
              navigate(`/app/company/${encodeURIComponent(firstItem.companyName)}/review`);
            }
          }}
        >
          View all {items.length} items
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </Card>
  );
}
