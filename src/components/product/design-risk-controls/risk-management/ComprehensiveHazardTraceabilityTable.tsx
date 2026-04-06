import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimpleDataTable } from "@/components/ui/data-table/SimpleDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, EyeOff } from "lucide-react";
import { Hazard, RiskLevel, calculateRiskLevel } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { InheritanceExclusionPopover } from "@/components/shared/InheritanceExclusionPopover";
import { ItemExclusionScope } from "@/hooks/useInheritanceExclusion";

interface ComprehensiveHazardTraceabilityTableProps {
  hazards: Hazard[];
  isLoading?: boolean;
  onEditHazard?: (hazard: Hazard) => void;
  onDeleteHazard?: (hazard: Hazard) => void;
  disabled?: boolean;
  isVariant?: boolean;
  belongsToFamily?: boolean;
  isHazardExcluded?: (hazardId: string) => boolean;
  getExclusionScope?: (itemId: string) => ItemExclusionScope;
  onSetExclusionScope?: (itemId: string, scope: ItemExclusionScope) => void;
  getExclusionSummary?: (itemId: string, totalProducts: number) => string;
  companyId?: string;
  currentProductId?: string;
  familyProductIds?: string[];
}

type ViewMode = 'summary' | 'comprehensive';

export function ComprehensiveHazardTraceabilityTable({
  hazards,
  isLoading,
  onEditHazard,
  onDeleteHazard,
  disabled = false,
  isVariant = false,
  belongsToFamily = false,
  isHazardExcluded,
  getExclusionScope,
  onSetExclusionScope,
  getExclusionSummary,
  companyId,
  currentProductId,
  familyProductIds,
}: ComprehensiveHazardTraceabilityTableProps) {
  const { lang } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  

  const getRiskLevelBadgeVariant = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'default';
      case 'Medium': return 'secondary';
      case 'High': return 'destructive';
      case 'Very High': return 'destructive';
      default: return 'outline';
    }
  };

  const categoryLabels: Record<string, string> = {
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
    'monitoring_devices': 'Monitoring Devices',
  };

  // Scope column — shows Device Applicability popover for all family members
  const scopeColumn: ColumnDef<Hazard> = {
    id: "scope",
    header: "Scope",
    size: 100,
    cell: ({ row }) => {
      const hazard = row.original;
      if (!companyId || !currentProductId || !getExclusionScope || !onSetExclusionScope) return null;
      return (
        <InheritanceExclusionPopover
          companyId={companyId}
          currentProductId={currentProductId}
          itemId={hazard.id}
          exclusionScope={getExclusionScope(hazard.id)}
          onScopeChange={onSetExclusionScope}
          defaultCurrentDeviceOnly
          familyProductIds={familyProductIds}
        />
      );
    },
  };

  // Source column (only for variants)
  const sourceColumn: ColumnDef<Hazard> = {
    id: "source",
    header: "Source",
    size: 120,
    cell: ({ row }) => {
      const hazard = row.original;
      if (hazard.isInheritedFromMaster) {
        const excluded = isHazardExcluded?.(hazard.id) ?? false;
        const label = `From ${hazard.masterProductName}`;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={`text-xs inline-block max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap border-blue-300 bg-blue-50 text-blue-700 ${excluded ? 'opacity-50' : ''}`}>
                  {label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return (
        <Badge variant="outline" className="text-xs">
          Local
        </Badge>
      );
    },
  };

  // Helper to wrap cell content with dim styling for excluded inherited hazards
  const wrapWithExclusionStyle = (hazard: Hazard, content: React.ReactNode) => {
    if (isHazardExcluded?.(hazard.id)) {
      return <div className="opacity-40">{content}</div>;
    }
    return content;
  };

  // Summary view columns
  const summaryColumns: ColumnDef<Hazard>[] = [
    ...(isVariant ? [sourceColumn] : []),
    {
      accessorKey: "hazard_id",
      header: lang('riskManagement.table.hazardId'),
      cell: ({ row }) => {
        const isDraft = (row.getValue("description") as string)?.toLowerCase().startsWith('draft');
        return wrapWithExclusionStyle(row.original, (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isDraft ? 'text-amber-600' : ''}`}>{row.getValue("hazard_id")}</span>
            {isDraft && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">Draft</Badge>
            )}
          </div>
        ));
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        if (!category) return <span className="text-muted-foreground text-xs">-</span>;
        return wrapWithExclusionStyle(row.original, (
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {categoryLabels[category] || category}
          </Badge>
        ));
      },
    },
    {
      accessorKey: "description",
      header: lang('riskManagement.table.hazardDescription'),
      cell: ({ row }) => {
        const isDraft = (row.getValue("description") as string)?.toLowerCase().startsWith('draft');
        return wrapWithExclusionStyle(row.original, (
          <div className={`max-w-xs truncate ${isDraft ? 'italic text-amber-700' : ''}`} title={row.getValue("description")}>
            {row.getValue("description")}
          </div>
        ));
      },
    },
    {
      header: lang('riskManagement.table.initialRisk'),
      cell: ({ row }) => {
        const hazard = row.original;
        const calculatedLevel = hazard.initial_severity && hazard.initial_probability
          ? calculateRiskLevel(hazard.initial_severity, hazard.initial_probability)
          : hazard.initial_risk;

        return wrapWithExclusionStyle(hazard, calculatedLevel ? (
          <Badge variant={getRiskLevelBadgeVariant(calculatedLevel)}>
            {calculatedLevel}
          </Badge>
        ) : <span className="text-muted-foreground">{lang('riskManagement.table.notAssessed')}</span>);
      },
    },
    {
      header: lang('riskManagement.table.residualRisk'),
      cell: ({ row }) => {
        const hazard = row.original;
        const calculatedLevel = hazard.residual_severity && hazard.residual_probability
          ? calculateRiskLevel(hazard.residual_severity, hazard.residual_probability)
          : hazard.residual_risk;

        return wrapWithExclusionStyle(hazard, calculatedLevel ? (
          <Badge variant={getRiskLevelBadgeVariant(calculatedLevel)}>
            {calculatedLevel}
          </Badge>
        ) : <span className="text-muted-foreground">{lang('riskManagement.table.notAssessed')}</span>);
      },
    },
    {
      accessorKey: "risk_control_measure",
      header: lang('riskManagement.table.riskControl'),
      cell: ({ row }) => {
        const measure = row.getValue("risk_control_measure") as string || (row.original as any).mitigation_measure;
        return wrapWithExclusionStyle(row.original, (
          <div className="max-w-xs truncate" title={measure}>
            {measure || <span className="text-muted-foreground">{lang('riskManagement.table.notSpecified')}</span>}
          </div>
        ));
      },
    },
    ...[scopeColumn],
  ];

  // Comprehensive view columns
  const comprehensiveColumns: ColumnDef<Hazard>[] = [
    ...(isVariant ? [sourceColumn] : []),
    {
      accessorKey: "hazard_id",
      header: lang('riskManagement.table.hazardId'),
      cell: ({ row }) => wrapWithExclusionStyle(row.original, (
        <div className="font-medium">{row.getValue("hazard_id")}</div>
      )),
    },
    {
      accessorKey: "description",
      header: lang('riskManagement.table.hazard'),
      cell: ({ row }) => wrapWithExclusionStyle(row.original, (
        <div className="max-w-xs">{row.getValue("description")}</div>
      )),
    },
    {
      accessorKey: "hazardous_situation",
      header: lang('riskManagement.table.hazardousSituation'),
      cell: ({ row }) => wrapWithExclusionStyle(row.original, (
        <div className="max-w-xs truncate" title={row.getValue("hazardous_situation")}>
          {row.getValue("hazardous_situation") || <span className="text-muted-foreground">-</span>}
        </div>
      )),
    },
    {
      accessorKey: "potential_harm",
      header: lang('riskManagement.table.potentialHarm'),
      cell: ({ row }) => wrapWithExclusionStyle(row.original, (
        <div className="max-w-xs truncate" title={row.getValue("potential_harm")}>
          {row.getValue("potential_harm") || <span className="text-muted-foreground">-</span>}
        </div>
      )),
    },
    {
      header: lang('riskManagement.table.initialRiskSxP'),
      cell: ({ row }) => {
        const hazard = row.original;
        if (hazard.initial_severity && hazard.initial_probability) {
          const level = calculateRiskLevel(hazard.initial_severity, hazard.initial_probability);
          return wrapWithExclusionStyle(hazard, (
            <div className="space-y-1">
              <Badge variant={getRiskLevelBadgeVariant(level!)} className="text-xs">
                {level}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {hazard.initial_severity}×{hazard.initial_probability}
              </div>
            </div>
          ));
        }
        return wrapWithExclusionStyle(hazard, hazard.initial_risk ? (
          <Badge variant={getRiskLevelBadgeVariant(hazard.initial_risk)}>
            {hazard.initial_risk}
          </Badge>
        ) : <span className="text-muted-foreground">{lang('riskManagement.table.notAssessed')}</span>);
      },
    },
    {
      accessorKey: "risk_control_measure",
      header: lang('riskManagement.table.riskControlMeasure'),
      cell: ({ row }) => {
        const measure = row.getValue("risk_control_measure") as string || (row.original as any).mitigation_measure;
        return wrapWithExclusionStyle(row.original, (
          <div className="max-w-xs truncate" title={measure}>
            {measure || <span className="text-muted-foreground">{lang('riskManagement.table.notSpecified')}</span>}
          </div>
        ));
      },
    },
    {
      header: lang('riskManagement.table.residualRiskSxP'),
      cell: ({ row }) => {
        const hazard = row.original;
        if (hazard.residual_severity && hazard.residual_probability) {
          const level = calculateRiskLevel(hazard.residual_severity, hazard.residual_probability);
          return wrapWithExclusionStyle(hazard, (
            <div className="space-y-1">
              <Badge variant={getRiskLevelBadgeVariant(level!)} className="text-xs">
                {level}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {hazard.residual_severity}×{hazard.residual_probability}
              </div>
            </div>
          ));
        }
        return wrapWithExclusionStyle(hazard, hazard.residual_risk ? (
          <Badge variant={getRiskLevelBadgeVariant(hazard.residual_risk)}>
            {hazard.residual_risk}
          </Badge>
        ) : <span className="text-muted-foreground">{lang('riskManagement.table.notAssessed')}</span>);
      },
    },
    {
      accessorKey: "verification_effectiveness",
      header: lang('riskManagement.table.verification'),
      cell: ({ row }) => wrapWithExclusionStyle(row.original, (
        <div className="max-w-xs truncate" title={row.getValue("verification_effectiveness")}>
          {row.getValue("verification_effectiveness") || <span className="text-muted-foreground">-</span>}
        </div>
      )),
    },
    ...[scopeColumn],
  ];


  if (isLoading) {
    return <div className="text-center py-4">{lang('riskManagement.table.loadingHazards')}</div>;
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'summary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('summary')}
          >
            <Eye className="h-4 w-4 mr-1" />
            {lang('riskManagement.table.summaryView')}
          </Button>
          <Button
            variant={viewMode === 'comprehensive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('comprehensive')}
          >
            <EyeOff className="h-4 w-4 mr-1" />
            {lang('riskManagement.table.comprehensiveView')}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {hazards.length} {hazards.length !== 1 ? lang('riskManagement.table.hazards') : lang('riskManagement.table.hazard')}
        </div>
      </div>

      {/* Data Table */}
      <div className="space-y-2">
        <SimpleDataTable
          data={hazards}
          columns={viewMode === 'summary' ? summaryColumns : comprehensiveColumns}
          searchPlaceholder={lang('riskManagement.table.searchHazards')}
          enableSearch
          onRowClick={onEditHazard}
        />
      </div>
    </div>
  );
}
