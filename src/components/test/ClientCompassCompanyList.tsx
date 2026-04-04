import React from 'react';
import { Link } from 'react-router-dom';
import { CompanyRole } from '@/types/companyRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ClientCompassCompanyListProps {
  companyRoles: CompanyRole[];
  isCollapsed: boolean;
  customStyles?: { textColor?: string; hoverBg?: string; activeBg?: string };
}

type CompanyStatus = 'On Track' | 'At Risk' | 'Needs Attention';

interface CompanyWithStatus {
  id: string;
  name: string;
  status: CompanyStatus;
  updatedAt: string | null;
}

const getStatusColor = (status: CompanyStatus) => {
  switch (status) {
    case 'On Track': return 'bg-green-500';
    case 'At Risk': return 'bg-red-500';
    case 'Needs Attention': return 'bg-yellow-500';
    default: return 'bg-green-500';
  }
};

const getStatusLabel = (status: CompanyStatus) => {
  switch (status) {
    case 'On Track': return 'All good';
    case 'At Risk': return 'Some concern';
    case 'Needs Attention': return 'Needs attention';
    default: return 'Unknown';
  }
};

export function ClientCompassCompanyList({ companyRoles, isCollapsed, customStyles }: ClientCompassCompanyListProps) {
  const companyIds = companyRoles.map(r => r.companyId);

  const { data: companiesWithStatus = [] } = useQuery({
    queryKey: ['client-compass-companies', companyIds],
    queryFn: async () => {
      if (companyIds.length === 0) return [];

      // Fetch companies and their product statuses in parallel
      const [companiesRes, productsRes] = await Promise.all([
        supabase
          .from('companies')
          .select('id, name, updated_at')
          .in('id', companyIds)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false }),
        supabase
          .from('products')
          .select('company_id, status')
          .in('company_id', companyIds)
          .eq('is_archived', false),
      ]);

      if (companiesRes.error) {
        console.error('[ClientCompassCompanyList] Error fetching companies:', companiesRes.error);
        return [];
      }

      // Build product status map
      const productsByCompany: Record<string, string[]> = {};
      (productsRes.data || []).forEach(p => {
        if (!productsByCompany[p.company_id]) productsByCompany[p.company_id] = [];
        productsByCompany[p.company_id].push(p.status || 'On Track');
      });

      return (companiesRes.data || []).map(c => {
        const statuses = productsByCompany[c.id] || [];
        let status: CompanyStatus = 'On Track';
        if (statuses.some(s => s === 'Needs Attention')) {
          status = 'Needs Attention';
        } else if (statuses.some(s => s === 'At Risk')) {
          status = 'At Risk';
        }
        return { id: c.id, name: c.name, status, updatedAt: c.updated_at };
      });
    },
    enabled: companyIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  if (companiesWithStatus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className={`text-sm ${customStyles?.textColor || 'text-sidebar-foreground'} opacity-70`}>
          No companies found
        </p>
      </div>
    );
  }

  // Recent: top 3 by updated_at (already sorted from query)
  const recentCompanies = companiesWithStatus.slice(0, 3);
  // Remaining: alphabetically sorted
  const remainingCompanies = companiesWithStatus.slice(3).sort((a, b) => a.name.localeCompare(b.name));

  const renderCompanyItem = (company: CompanyWithStatus) => (
    <Tooltip key={company.id}>
      <TooltipTrigger asChild>
        <Link
          to={`/app/company/${encodeURIComponent(company.name)}`}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${customStyles?.hoverBg || 'hover:bg-sidebar-accent'} ${customStyles?.textColor || 'text-sidebar-foreground'}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${getStatusColor(company.status)}`} />
          {!isCollapsed && <span className="truncate">{company.name}</span>}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {company.name} — {getStatusLabel(company.status)}
      </TooltipContent>
    </Tooltip>
  );

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        {companiesWithStatus.map(company => (
          <Tooltip key={company.id}>
            <TooltipTrigger asChild>
              <Link
                to={`/app/company/${encodeURIComponent(company.name)}`}
                className="p-2 rounded-md hover:bg-sidebar-accent transition-colors flex items-center justify-center"
              >
                <span className={`h-3 w-3 rounded-full ${getStatusColor(company.status)}`} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              {company.name} — {getStatusLabel(company.status)}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className="py-2">
      <p className={`text-xs font-semibold uppercase tracking-wider px-3 mb-1 ${customStyles?.textColor || 'text-sidebar-foreground'} opacity-50`}>
        Recent
      </p>
      {recentCompanies.map(renderCompanyItem)}

      {remainingCompanies.length > 0 && (
        <>
          <p className={`text-xs font-semibold uppercase tracking-wider px-3 mt-4 mb-1 ${customStyles?.textColor || 'text-sidebar-foreground'} opacity-50`}>
            All Companies
          </p>
          {remainingCompanies.map(renderCompanyItem)}
        </>
      )}
    </div>
  );
}
