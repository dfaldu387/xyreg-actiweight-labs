import React, { useState } from "react";
import { EfficiencyKPICard } from "./EfficiencyKPICard";
import { EfficiencyFilters } from "./EfficiencyFilters";
import { useEfficiencyData } from "@/hooks/useEfficiencyData";
import { EfficiencyFilters as FiltersType } from "@/types/operationalEfficiency";
import { Settings, Target, Clock, CheckCircle, DollarSign, BarChart3 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function OperationalEfficiencyDashboard() {
  const { lang } = useTranslation();
  const [filters, setFilters] = useState<FiltersType>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
      preset: 'last30days'
    },
    productLine: undefined,
    facility: undefined
  });

  const { data, isLoading } = useEfficiencyData(filters);

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-16 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{lang('executiveKPI.operationalEfficiencyDashboard')}</h2>
          <p className="text-muted-foreground">
            {lang('executiveKPI.realTimeManufacturingPerformance')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <EfficiencyFilters 
        filters={filters} 
        onFiltersChange={handleFiltersChange} 
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Overall Equipment Effectiveness (OEE) */}
        <EfficiencyKPICard
          title={lang('executiveKPI.overallEquipmentEffectiveness')}
          value={data.oee.percentage}
          format="percentage"
          status={data.oee.percentage >= 85 ? "success" : data.oee.percentage >= 65 ? "warning" : "danger"}
          trend={{
            direction: data.oee.trend >= 0 ? "up" : "down",
            percentage: Math.abs(data.oee.trend),
            label: lang('executiveKPI.vsPreviousPeriod')
          }}
          sparklineData={data.oee.sparklineData}
          icon={<Settings className="h-4 w-4" />}
          visualization="circular"
          subtitle={
            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
              <div className="text-center">
                <div className="font-medium">{data.oee.availability}%</div>
                <div className="text-muted-foreground">{lang('executiveKPI.availability')}</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{data.oee.performance}%</div>
                <div className="text-muted-foreground">{lang('executiveKPI.performance')}</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{data.oee.quality}%</div>
                <div className="text-muted-foreground">{lang('executiveKPI.quality')}</div>
              </div>
            </div>
          }
          tooltipContent={{
            formula: "OEE = Availability × Performance × Quality",
            description: "Overall Equipment Effectiveness measures how efficiently manufacturing equipment is utilized"
          }}
        />

        {/* Throughput */}
        <EfficiencyKPICard
          title={lang('executiveKPI.throughput')}
          value={data.throughput.units}
          format="number"
          unit={`Units / ${data.throughput.timeFrame}`}
          status="neutral"
          trend={{
            direction: data.throughput.trend >= 0 ? "up" : "down",
            percentage: Math.abs(data.throughput.trend),
            label: lang('executiveKPI.vsPreviousPeriod')
          }}
          sparklineData={data.throughput.sparklineData}
          icon={<Target className="h-4 w-4" />}
          visualization="number"
          tooltipContent={{
            formula: "Throughput = Number of good units produced / Time frame",
            description: "Total number of acceptable units produced within a specific time period"
          }}
        />

        {/* Cycle Time */}
        <EfficiencyKPICard
          title={lang('executiveKPI.cycleTime')}
          value={data.cycleTime.hours}
          format="decimal"
          unit={lang('executiveKPI.hours')}
          status="neutral"
          trend={{
            direction: data.cycleTime.trend <= 0 ? "up" : "down", // Lower cycle time is better
            percentage: Math.abs(data.cycleTime.trend),
            label: lang('executiveKPI.vsPreviousPeriod')
          }}
          sparklineData={data.cycleTime.sparklineData}
          icon={<Clock className="h-4 w-4" />}
          visualization="number"
          tooltipContent={{
            formula: "Cycle Time = Process End Time - Process Start Time",
            description: "Average time required to produce one unit from start to finish"
          }}
        />

        {/* First Pass Yield (FPY) */}
        <EfficiencyKPICard
          title={lang('executiveKPI.firstPassYield')}
          value={data.firstPassYield.percentage}
          format="percentage"
          status={data.firstPassYield.percentage >= 95 ? "success" : data.firstPassYield.percentage >= 90 ? "warning" : "danger"}
          trend={{
            direction: data.firstPassYield.trend >= 0 ? "up" : "down",
            percentage: Math.abs(data.firstPassYield.trend),
            label: lang('executiveKPI.vsPreviousPeriod')
          }}
          sparklineData={data.firstPassYield.sparklineData}
          icon={<CheckCircle className="h-4 w-4" />}
          visualization="donut"
          tooltipContent={{
            formula: "FPY = (Good units produced first time) / (Total units started) × 100",
            description: "Percentage of units that pass quality inspection on the first attempt"
          }}
        />

        {/* Manufacturing Cost per Unit */}
        <EfficiencyKPICard
          title={lang('executiveKPI.manufacturingCostPerUnit')}
          value={data.manufacturingCost.cost}
          format="currency"
          currency={data.manufacturingCost.currency}
          status="neutral"
          trend={{
            direction: data.manufacturingCost.trend <= 0 ? "up" : "down", // Lower cost is better
            percentage: Math.abs(data.manufacturingCost.trend),
            label: lang('executiveKPI.vsPreviousPeriod')
          }}
          sparklineData={data.manufacturingCost.sparklineData}
          icon={<DollarSign className="h-4 w-4" />}
          visualization="number"
          tooltipContent={{
            formula: "Manufacturing Cost per Unit = Total Manufacturing Costs / Total Units Produced",
            description: "Average cost to produce one unit including materials, labor, and overhead"
          }}
        />

        {/* Capacity Utilization Rate */}
        <EfficiencyKPICard
          title={lang('executiveKPI.capacityUtilizationRate')}
          value={data.capacityUtilization.percentage}
          format="percentage"
          status={data.capacityUtilization.percentage >= 85 ? "success" : data.capacityUtilization.percentage >= 65 ? "warning" : "danger"}
          trend={{
            direction: data.capacityUtilization.trend >= 0 ? "up" : "down",
            percentage: Math.abs(data.capacityUtilization.trend),
            label: lang('executiveKPI.vsPreviousPeriod')
          }}
          sparklineData={data.capacityUtilization.sparklineData}
          icon={<BarChart3 className="h-4 w-4" />}
          visualization="circular"
          tooltipContent={{
            formula: "Capacity Utilization = (Actual Output / Total Possible Output) × 100",
            description: "Percentage of total production capacity currently being utilized"
          }}
        />
      </div>
    </div>
  );
}