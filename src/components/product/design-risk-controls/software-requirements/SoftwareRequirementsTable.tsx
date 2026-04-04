import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SimpleDataTable } from '@/components/ui/SimpleDataTable';
import { RequirementSpecification } from '@/components/product/design-risk-controls/requirement-specifications/types';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface SoftwareRequirementsTableProps {
  requirements: RequirementSpecification[];
  disabled?: boolean;
  onEditRequirement?: (requirement: RequirementSpecification) => void;
  validSystemReqIds?: string[];
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

export function SoftwareRequirementsTable({ requirements, disabled = false, onEditRequirement, validSystemReqIds }: SoftwareRequirementsTableProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const validSYSRSet = new Set(validSystemReqIds || []);

  const handleRowClick = (requirement: RequirementSpecification) => {
    if (disabled) return;
    onEditRequirement?.(requirement);
  };

  const columns = [
    {
      key: 'requirement_id',
      header: 'ID',
    },
    {
      key: 'description',
      header: 'Description',
    },
    {
      key: 'category',
      header: 'Category',
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
              const isMissing = validSystemReqIds && !validSYSRSet.has(id);
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
                      navigate(`${location.pathname}?tab=requirement-specifications&subTab=system-requirements&returnTo=software-requirements`);
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
                  navigate(`${location.pathname}?tab=risk-management&subTab=hazard-traceability-matrix&returnTo=software-requirements`);
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
      header: 'Verification Status',
      render: (value: string) => (
        <Badge variant="outline" className={getStatusColor(value)}>
          {value}
        </Badge>
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
