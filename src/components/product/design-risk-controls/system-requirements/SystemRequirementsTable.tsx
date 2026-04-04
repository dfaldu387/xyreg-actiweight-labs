import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SimpleDataTable } from '@/components/ui/SimpleDataTable';
import { RequirementSpecification } from '@/components/product/design-risk-controls/requirement-specifications/types';
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface SystemRequirementsTableProps {
  requirements: RequirementSpecification[];
  disabled?: boolean;
  onEditRequirement?: (requirement: RequirementSpecification) => void;
  validUserNeedIds?: string[];
  /** Map of SYSR requirement_id -> array of SWR/HWR IDs that trace to it */
  derivedByMap?: Record<string, { id: string; type: 'software' | 'hardware' }[]>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Passed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Not Started':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCategoryColor = (_category: string) => {
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

export function SystemRequirementsTable({ requirements, disabled = false, onEditRequirement, validUserNeedIds, derivedByMap = {} }: SystemRequirementsTableProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const validUNSet = new Set(validUserNeedIds || []);

  const handleRowClick = (requirement: RequirementSpecification) => {
    if (disabled) return;
    onEditRequirement?.(requirement);
  };

  const isDraft = (row: RequirementSpecification) => 
    row.description?.toLowerCase().startsWith('draft');

  const columns = [
    {
      key: 'requirement_id',
      header: 'ID',
      render: (value: string, row: RequirementSpecification) => (
        <span className={isDraft(row) ? 'text-amber-700 font-semibold' : ''}>
          {value}
        </span>
      ),
    },
    {
      key: 'description',
      header: lang('systemRequirements.form.description'),
      render: (value: string, row: RequirementSpecification) => (
        <span className={isDraft(row) ? 'text-amber-600 italic' : ''}>
          {value}
        </span>
      ),
    },
    {
      key: 'category',
      header: lang('systemRequirements.form.category'),
      render: (value: string) => value ? (
        <Badge variant="outline" className={getCategoryColor(value)}>
          {value}
        </Badge>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'traces_to',
      header: 'Derived From',
      render: (value: string) => {
        if (!value) return <span className="text-muted-foreground">—</span>;
        const ids = value.split(',').map(id => id.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1">
            {ids.map((id) => {
              const isMissing = validUserNeedIds && !validUNSet.has(id);
              return (
                <Badge
                  key={id}
                  variant="outline"
                  className={
                    isMissing
                      ? "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 cursor-pointer text-xs"
                      : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer text-xs"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isMissing) {
                      navigate(`${location.pathname}?tab=requirement-specifications&subTab=user-needs&returnTo=system-requirements`);
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
      key: 'requirement_id',
      header: lang('systemRequirements.form.tracesTo'),
      render: (_: string, row: RequirementSpecification) => {
        const derived = derivedByMap[row.requirement_id];
        if (!derived || derived.length === 0) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {derived.map((item) => (
              <Badge
                key={item.id}
                variant="outline"
                className={
                  item.type === 'software'
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer text-xs"
                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer text-xs"
                }
                onClick={(e) => {
                  e.stopPropagation();
                  const subTab = item.type === 'software' ? 'software-requirements' : 'hardware-requirements';
                  navigate(`${location.pathname}?tab=requirement-specifications&subTab=${subTab}&returnTo=system-requirements`);
                }}
              >
                {item.id}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'linked_risks',
      header: 'Linked Risks',
      render: (value: string) => {
        if (!value) return <span className="text-muted-foreground">—</span>;
        const ids = value.split(',').map((id: string) => id.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1">
            {ids.map((id: string) => (
              <Badge
                key={id}
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 cursor-pointer text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`${location.pathname}?tab=risk-management&subTab=hazard-traceability-matrix&returnTo=system-requirements`);
                }}
              >
                {id}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'verification_status',
      header: lang('systemRequirements.form.verificationStatus'),
      render: (value: string, row: RequirementSpecification) => (
        <div className="flex items-center gap-1.5">
          {isDraft(row) && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
              Draft
            </Badge>
          )}
          <Badge variant="outline" className={getStatusColor(value)}>
            {value}
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <SimpleDataTable
      data={requirements}
      columns={columns}
      searchable={true}
      pagination={true}
      itemsPerPage={10}
      onRowClick={handleRowClick}
    />
  );
}
