import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimpleDataTable } from "@/components/ui/SimpleDataTable";
import { Hazard, RiskLevel, MitigationType } from "./types";
import { Trash2 } from "lucide-react";

interface HazardTraceabilityTableProps {
  hazards: Hazard[];
  isLoading?: boolean;
  onEditHazard?: (hazard: Hazard) => void;
  onDeleteHazard?: (hazard: Hazard) => void;
}

const getRiskLevelBadgeVariant = (riskLevel: RiskLevel) => {
  switch (riskLevel) {
    case 'Low':
      return 'default'; // Green
    case 'Medium':
      return 'secondary'; // Yellow/Orange
    case 'High':
      return 'destructive'; // Red
    default:
      return 'outline';
  }
};

const getMitigationTypeBadgeVariant = (mitigationType: MitigationType) => {
  switch (mitigationType) {
    case 'Design Control':
      return 'default'; // Blue
    case 'Protective Measure':
      return 'secondary'; // Purple
    case 'Information for Safety':
      return 'outline'; // Gray
    default:
      return 'outline';
  }
};

// Category mapping for display
const getCategoryDisplay = (category: string) => {
  const categoryMap: Record<string, string> = {
    'materials_patient_contact': 'Materials & Patient Contact',
    'combination_other_products': 'Combination with Other Products',
    'human_factors': 'Human Factors',
    'training_requirements': 'Training Requirements',
    'cleaning_maintenance': 'Cleaning & Maintenance',
    'negative_air_pressure': 'Negative Air Pressure',
    'electrical_energy': 'Electrical Energy',
    'sterility_requirements': 'Sterility Requirements',
    'critical_data_storage': 'Critical Data Storage',
    'software_use': 'Software Use',
    'disposal': 'Disposal',
    'manufacturing_residues': 'Manufacturing Residues',
    'transport_storage': 'Transport & Storage',
    'shelf_life': 'Shelf Life',
    'product_realization': 'Product Realization',
    'customer_requirements': 'Customer Requirements',
    'purchasing': 'Purchasing',
    'service_provision': 'Service Provision',
    'monitoring_devices': 'Monitoring Devices'
  };
  return categoryMap[category] || category;
};

export function HazardTraceabilityTable({ hazards, isLoading, onEditHazard }: HazardTraceabilityTableProps) {
  const columns = [
    {
      key: "hazard_id",
      header: "Hazard ID",
      render: (value: string) => (
        <span className="font-mono text-sm font-medium">{value}</span>
      ),
    },
    {
      key: "description",
      header: "Hazard Description",
      render: (value: string) => (
        <div className="max-w-xs">
          <p className="text-sm truncate" title={value}>
            {value}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (value: string) => (
        <Badge variant="outline" className="text-xs">
          {getCategoryDisplay(value)}
        </Badge>
      ),
    },
    {
      key: "foreseeable_sequence_events",
      header: "Foreseeable Sequence",
      render: (value: string) => (
        <div className="max-w-xs">
          <p className="text-sm truncate" title={value || "Not specified"}>
            {value || "Not specified"}
          </p>
        </div>
      ),
    },
    {
      key: "linked_requirements",
      header: "Linked Req.",
      render: (value: string) => {
        if (!value || value.trim() === "") {
          return <span className="text-sm text-muted-foreground">None</span>;
        }
        
        const requirementIds = value.split(',').map(id => id.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1">
            {requirementIds.map((reqId) => (
              <Badge
                key={reqId}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  // Future: navigate to requirement details
                }}
              >
                {reqId}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "initial_risk",
      header: "Initial Risk",
      render: (value: RiskLevel) => (
        value ? (
          <Badge variant={getRiskLevelBadgeVariant(value)}>
            {value}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Not Assessed</span>
        )
      ),
    },
    {
      key: "mitigation_measure",
      header: "Mitigation Measure",
      render: (value: string) => (
        <div className="max-w-xs">
          <p className="text-sm truncate" title={value}>
            {value}
          </p>
        </div>
      ),
    },
    {
      key: "mitigation_type",
      header: "Mitigation Type",
      render: (value: MitigationType) => (
        <Badge variant={getMitigationTypeBadgeVariant(value)} className="text-xs">
          {value}
        </Badge>
      ),
    },
    {
      key: "mitigation_link",
      header: "Mitigation Link",
      render: (value: string, row: Hazard) => {
        if (!value || value.trim() === "") {
          return <span className="text-sm text-muted-foreground">-</span>;
        }
        
        // If mitigation type is Design Control and value looks like a requirement ID, show it as a clickable badge
        if (row.mitigation_type === "Design Control" && value.match(/^[A-Z]+-\d+$/)) {
          return (
            <Badge
              variant="outline"
              className="text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => {
                // Future: navigate to requirement details
              }}
            >
              {value}
            </Badge>
          );
        }
        
        // Otherwise show as plain text
        return (
          <span className="text-sm text-muted-foreground">
            {value}
          </span>
        );
      },
    },
    {
      key: "residual_risk",
      header: "Residual Risk",
      render: (value: RiskLevel) => (
        value ? (
          <Badge variant={getRiskLevelBadgeVariant(value)}>
            {value}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Not Assessed</span>
        )
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Loading hazards...</div>
      </div>
    );
  }

  return (
    <SimpleDataTable
      data={hazards}
      columns={columns}
      onRowClick={onEditHazard}
      searchable
      pagination
    />
  );
}