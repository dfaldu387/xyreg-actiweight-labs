import { Badge } from '@/components/ui/badge';
import { SimpleDataTable } from '@/components/ui/SimpleDataTable';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserNeed } from './types';
import { AlertTriangle } from 'lucide-react';

interface UserNeedsTableProps {
  userNeeds: UserNeed[];
  isLoading: boolean;
  onEditUserNeed?: (userNeed: UserNeed) => void;
  disabled?: boolean;
}

export function UserNeedsTable({ userNeeds, isLoading, onEditUserNeed, disabled = false }: UserNeedsTableProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Collect all user_need_ids to query linked requirements
  const userNeedIds = userNeeds.map(un => un.user_need_id).filter(Boolean);
  const productId = userNeeds[0]?.product_id;

  // Fetch all requirement_specifications for this product that have traces_to set
  const { data: allReqSpecs = [] } = useQuery({
    queryKey: ['linked-reqs-for-user-needs', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('requirement_specifications')
        .select('requirement_id, traces_to')
        .eq('product_id', productId)
        .not('traces_to', 'is', null);
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId && userNeedIds.length > 0,
  });

  // Fetch all existing requirement IDs for missing link detection
  const { data: allExistingReqs = [] } = useQuery({
    queryKey: ['all-existing-req-ids', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('requirement_specifications')
        .select('requirement_id')
        .eq('product_id', productId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });

  const existingReqIds = new Set(allExistingReqs.map(r => r.requirement_id));

  // Build a map: user_need_id -> list of requirement_ids that trace to it
  const linkedReqsMap = new Map<string, string[]>();
  for (const spec of allReqSpecs) {
    if (!spec.traces_to) continue;
    const tracedIds = spec.traces_to.split(',').map((id: string) => id.trim()).filter(Boolean);
    for (const unId of tracedIds) {
      if (!linkedReqsMap.has(unId)) {
        linkedReqsMap.set(unId, []);
      }
      linkedReqsMap.get(unId)!.push(spec.requirement_id);
    }
  }

  const handleRowClick = (userNeed: UserNeed) => {
    if (disabled) return;
    onEditUserNeed?.(userNeed);
  };

  const columns = [
    {
      key: 'user_need_id',
      header: lang('userNeeds.table.id'),
    },
    {
      key: 'description',
      header: lang('userNeeds.table.description'),
    },
    {
      key: 'category',
      header: lang('userNeeds.table.category'),
      render: (value: string) => (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
        >
          {value || lang('userNeeds.categories.general')}
        </Badge>
      ),
    },
    {
      key: 'linked_requirements',
      header: 'Traces To',
      render: (_value: string, row: UserNeed) => {
        const reqs = linkedReqsMap.get(row.user_need_id) || [];
        if (reqs.length === 0) return <span className="text-muted-foreground">—</span>;

        return (
          <div className="flex flex-wrap gap-1">
            {reqs.map((id) => {
              const isMissing = !existingReqIds.has(id);
              return (
                <Badge
                  key={id}
                  variant="outline"
                  className={
                    isMissing
                      ? "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 cursor-pointer text-xs"
                      : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer text-xs"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isMissing) {
                      navigate(`${location.pathname}?tab=requirement-specifications&subTab=system-requirements&returnTo=user-needs`);
                    }
                  }}
                >
                  {isMissing && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {id}
                </Badge>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: lang('userNeeds.table.status'),
      render: (value: 'Met' | 'Not Met') => (
        <Badge
          variant={value === 'Met' ? 'default' : 'secondary'}
          className={
            value === 'Met'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
          }
        >
          {value === 'Met' ? lang('userNeeds.status.met') : lang('userNeeds.status.notMet')}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">{lang('userNeeds.loading')}</div>
      </div>
    );
  }

  return (
    <SimpleDataTable
      data={userNeeds}
      columns={columns}
      searchable={true}
      pagination={true}
      itemsPerPage={10}
      onRowClick={handleRowClick}
    />
  );
}
