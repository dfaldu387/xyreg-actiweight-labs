import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimpleDataTable } from "@/components/ui/SimpleDataTable";
import type { RequirementSpecification } from "./types";
import { Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface RequirementSpecificationsTableProps {
  data: RequirementSpecification[];
  onRowClick?: (requirement: RequirementSpecification) => void;
  onDeleteRequirement?: (requirement: RequirementSpecification) => void;
}

const getStatusBadgeVariant = (status: RequirementSpecification['verification_status']) => {
  switch (status) {
    case 'Not Started':
      return 'secondary'; // Gray
    case 'In Progress':
      return 'default'; // Blue
    case 'Passed':
      return 'default'; // Green (will need custom styling)
    case 'Failed':
      return 'destructive'; // Red
    default:
      return 'secondary';
  }
};

const getStatusBadgeClassName = (status: RequirementSpecification['verification_status']) => {
  switch (status) {
    case 'Passed':
      return 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
    default:
      return '';
  }
};

export function RequirementSpecificationsTable({ 
  data, 
  onRowClick,
  onDeleteRequirement 
}: RequirementSpecificationsTableProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const columns = [
    {
      key: 'requirement_id' as keyof RequirementSpecification,
      header: 'ID',
      cell: (requirement: RequirementSpecification) => (
        <span className="font-mono text-sm">{requirement.requirement_id}</span>
      ),
    },
    {
      key: 'description' as keyof RequirementSpecification,
      header: 'Requirement Description',
      cell: (requirement: RequirementSpecification) => (
        <div className="max-w-md">
          <p className="text-sm line-clamp-3">{requirement.description}</p>
        </div>
      ),
    },
    {
      key: 'traces_to' as keyof RequirementSpecification,
      header: 'Traces to',
      cell: (requirement: RequirementSpecification) => {
        if (!requirement.traces_to || !requirement.traces_to.trim()) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        
        const userNeedIds = requirement.traces_to.split(',').map(id => id.trim()).filter(Boolean);
        
        return (
          <div className="flex flex-wrap gap-1">
            {userNeedIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-md hover:bg-green-100 cursor-pointer transition-colors border border-green-200"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {id}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'linked_risks' as keyof RequirementSpecification,
      header: 'Linked Risks',
      cell: (requirement: RequirementSpecification) => {
        if (!requirement.linked_risks || requirement.linked_risks.trim() === '') {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        
        const hazardIds = requirement.linked_risks.split(',').map(id => id.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1">
            {hazardIds.map((hazardId) => (
              <Badge
                key={hazardId}
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 cursor-pointer text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`${location.pathname}?tab=risk-management&subTab=hazard-traceability-matrix&returnTo=system-requirements`);
                }}
              >
                {hazardId}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'verification_status' as keyof RequirementSpecification,
      header: 'Verification Status',
      cell: (requirement: RequirementSpecification) => (
        <Badge
          variant={getStatusBadgeVariant(requirement.verification_status)}
          className={getStatusBadgeClassName(requirement.verification_status)}
        >
          {requirement.verification_status}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof RequirementSpecification,
      header: 'Actions',
      cell: (requirement: RequirementSpecification) => (
        <div className="flex items-center gap-1">
          {onDeleteRequirement && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequirement(requirement);
              }}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <SimpleDataTable
      data={data}
      columns={columns}
      onRowClick={onRowClick}
      searchable={true}
      pagination={true}
      itemsPerPage={10}
    />
  );
}