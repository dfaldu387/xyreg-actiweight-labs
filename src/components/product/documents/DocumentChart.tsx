import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

interface ChartData {
  phase: string;
  active: number;
  pending: number;
  overdue: number;
  approved: number;
  report: number;
  total: number;
  isActivePhase?: boolean;
  isPhaseComplete?: boolean;
}

interface DocumentChartProps {
  data: ChartData[];
  onSegmentClick?: (phase: string, status: string) => void;
}

export function DocumentChart({ data, onSegmentClick }: DocumentChartProps) {
  const { lang } = useTranslation();
  const sortedData = React.useMemo(() => data, [data]);
  // console.log('data DocumentChart', data);
  const activePhaseCount = React.useMemo(
    () => data.filter(item => item.isActivePhase).length,
    [data]
  );

  const aggregatedTotals = React.useMemo(() => {
    return sortedData.reduce(
      (acc, item) => {
        acc.active += item.active;
        acc.pending += item.pending;
        acc.overdue += item.overdue;
        acc.approved += item.approved;
        acc.report += item.report;
        acc.total += item.total;
        return acc;
      },
      { approved: 0, active: 0, pending: 0, overdue: 0, report: 0, total: 0 }
    );
  }, [sortedData]);

  const donutData = React.useMemo(() => {
    return [
      { name: lang('documentChart.active'), value: aggregatedTotals.active, color: "hsl(221.2 83.2% 53.3%)" },
      { name: lang('documentChart.pending'), value: aggregatedTotals.pending, color: "hsl(var(--muted))" },
      { name: lang('documentChart.overdue'), value: aggregatedTotals.overdue, color: "hsl(0 84.2% 60.2%)" },
      { name: lang('documentChart.approved'), value: aggregatedTotals.approved, color: "hsl(142.1 70% 45%)" },
      { name: lang('documentChart.report'), value: aggregatedTotals.report, color: "hsl(142.1 70% 45%)" }, // Green same as Approved
    ].filter((segment) => segment.value > 0);
  }, [aggregatedTotals, lang]);

  const completionPercentage = aggregatedTotals.total > 0
    ? Math.round((aggregatedTotals.approved / aggregatedTotals.total) * 100)
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

      return (
        <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">
            {label === lang('documentChart.coreDocuments') ? label : `${label} ${lang('documentChart.phase')}`}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground capitalize">
                  {entry.dataKey}: {entry.value}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-1 mt-2">
              <span className="text-sm font-medium text-foreground">
                {lang('documentChart.totalDocuments').replace('{{count}}', total.toString())}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: any, index: number, event: any) => {
    // Determine which segment was clicked based on the Y coordinate
    const rect = event.target.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const totalHeight = rect.height;

    const { approved, active, pending, overdue, report } = data;
    const total = approved + active + pending + overdue + report;

    if (total === 0) return;

    // Calculate segment boundaries (stacked from bottom)
    const approvedHeight = (approved / total) * totalHeight;
    const activeHeight = (active / total) * totalHeight;
    const pendingHeight = (pending / total) * totalHeight;
    const overdueHeight = (overdue / total) * totalHeight;

    let status = '';
    if (clickY > totalHeight - approvedHeight) {
      status = 'approved';
    } else if (clickY > totalHeight - approvedHeight - activeHeight) {
      status = 'active';
    } else if (clickY > totalHeight - approvedHeight - activeHeight - pendingHeight) {
      status = 'pending';
    } else if (clickY > totalHeight - approvedHeight - activeHeight - pendingHeight - overdueHeight) {
      status = 'overdue';
    } else {
      status = 'report';
    }

    onSegmentClick?.(data.phase, status);
  };

  const dividerPosition =
    sortedData.length > 0 ? (activePhaseCount / sortedData.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="xl:w-1/3">
        <div className="h-full rounded-2xl bg-muted/40 p-6 shadow-inner flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {lang('documentChart.overallCompletion')}
          </div>

          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData.length > 0 ? donutData : [{ name: "Empty", value: 1, color: "hsl(var(--muted))" }]}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={3}
                  stroke="transparent"
                >
                  {(donutData.length > 0 ? donutData : [{ name: "Empty", value: 1, color: "hsl(var(--muted))" }]).map((entry, index) => (
                    <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-bold text-foreground">{completionPercentage}%</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{lang('documentChart.complete')}</span>
              <Badge variant="outline" className="mt-2">
                {aggregatedTotals.approved} / {aggregatedTotals.total || 0} {lang('documentChart.docs')}
              </Badge>
            </div>
          </div>

          <div className="mt-6 w-full space-y-3">
            {[
              { label: lang('documentChart.active'), value: aggregatedTotals.active, color: "bg-blue-600" },
              { label: lang('documentChart.pending'), value: aggregatedTotals.pending, color: "bg-muted-foreground/40" },
              { label: lang('documentChart.overdue'), value: aggregatedTotals.overdue, color: "bg-red-500" },
              { label: lang('documentChart.approved'), value: aggregatedTotals.approved, color: "bg-green-500" },
              { label: lang('documentChart.report'), value: aggregatedTotals.report, color: "bg-green-500" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="xl:flex-1">
        <div className="relative w-full h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="phase" 
                angle={-35}
                height={130}
                textAnchor="end"
                interval={0}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Stacked bars - order matters for visual stacking */}
              <Bar 
                dataKey="approved" 
                stackId="status"
                name="Approved"
                onClick={handleBarClick}
                className="cursor-pointer"
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-approved-${entry.phase}-${index}`}
                    fill={
                      entry.isPhaseComplete
                        ? "hsl(142.1 76.2% 36.3%)"
                        : "hsl(142.1 62% 55%)"
                    }
                  />
                ))}
              </Bar>
              <Bar
                dataKey="report"
                stackId="status"
                name="Report"
                onClick={handleBarClick}
                className="cursor-pointer"
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-report-${entry.phase}-${index}`}
                    fill="hsl(142.1 62% 55%)"
                  />
                ))}
              </Bar>
              <Bar 
                dataKey="active" 
                stackId="status"
                name="Active"
                onClick={handleBarClick}
                className="cursor-pointer"
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-active-${entry.phase}-${index}`}
                    fill={
                      entry.isPhaseComplete
                        ? "hsl(142.1 50% 30%)"
                        : "hsl(221.2 83.2% 53.3%)"
                    }
                  />
                ))}
              </Bar>
              <Bar 
                dataKey="pending" 
                stackId="status"
                name="Pending"
                onClick={handleBarClick}
                className="cursor-pointer"
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-pending-${entry.phase}-${index}`}
                    fill={
                      entry.isPhaseComplete
                        ? "hsl(142.1 45% 35%)"
                        : "hsl(var(--muted))"
                    }
                  />
                ))}
              </Bar>
              <Bar
                dataKey="overdue"
                stackId="status"
                name="Overdue"
                onClick={handleBarClick}
                className="cursor-pointer"
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-overdue-${entry.phase}-${index}`}
                    fill={
                      entry.isPhaseComplete
                        ? "hsl(0 84.2% 60.2%)"
                        : "hsl(0 84.2% 60.2%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {activePhaseCount > 0 && activePhaseCount < sortedData.length && (
            <div
              className="pointer-events-none absolute top-8 bottom-8 w-px bg-border/70"
              style={{ left: `${dividerPosition}%` }}
            >
              <span className="absolute -top-6 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {lang('documentChart.active')}
              </span>
              <span className="absolute -bottom-6 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {lang('documentChart.upcoming')}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-green-500" />
            <span>{lang('documentChart.finishedApproved')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-blue-600" />
            <span>{lang('documentChart.activeInProgress')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-muted-foreground/50" />
            <span>{lang('documentChart.pendingInNonActivePhase')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-red-500" />
            <span>{lang('documentChart.delayedOverdue')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-green-500" />
            <span>{lang('documentChart.reportIsRecord')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}