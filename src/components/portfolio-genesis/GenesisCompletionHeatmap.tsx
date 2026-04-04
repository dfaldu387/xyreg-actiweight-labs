import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, X, FileText, Target, Map, Layers, Users, Flag, FlaskConical, BarChart3, DollarSign } from 'lucide-react';
import type { DeviceGenesisMetrics, PortfolioGenesisMetrics } from '@/hooks/usePortfolioGenesisMetrics';
import { cn } from '@/lib/utils';

interface GenesisCompletionHeatmapProps {
  devices: DeviceGenesisMetrics[];
  checklistTotals: PortfolioGenesisMetrics['checklistTotals'];
  totalDevices: number;
}

const CHECKLIST_ITEMS = [
  { key: 'deviceDescription', label: 'Device Description', icon: FileText },
  { key: 'viabilityScorecard', label: 'Viability Scorecard', icon: Target },
  { key: 'ventureBlueprint', label: 'Venture Blueprint', icon: Map },
  { key: 'businessCanvas', label: 'Business Canvas', icon: Layers },
  { key: 'teamProfile', label: 'Team Profile', icon: Users },
  { key: 'essentialGates', label: 'Essential Gates', icon: Flag },
  { key: 'clinicalEvidence', label: 'Clinical Evidence', icon: FlaskConical },
  { key: 'marketSizing', label: 'Market Sizing', icon: BarChart3 },
  { key: 'reimbursementStrategy', label: 'Reimbursement', icon: DollarSign },
] as const;

export function GenesisCompletionHeatmap({ devices, checklistTotals, totalDevices }: GenesisCompletionHeatmapProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Checklist Completion Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 border-b font-medium text-sm min-w-[150px]">Device</th>
                {CHECKLIST_ITEMS.map(item => (
                  <th key={item.key} className="p-2 border-b text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map(device => (
                <tr 
                  key={device.productId}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/app/product/${device.productId}/business-case?tab=venture-blueprint`)}
                >
                  <td className="p-2 border-b text-sm font-medium truncate max-w-[150px]" title={device.productName}>
                    {device.productName}
                  </td>
                  {CHECKLIST_ITEMS.map(item => {
                    const isComplete = device.checklistCompletion[item.key];
                    return (
                      <td key={item.key} className="p-2 border-b text-center">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center mx-auto",
                          isComplete ? "bg-emerald-100" : "bg-red-100"
                        )}>
                          {isComplete ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <X className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-muted/30 font-medium">
                <td className="p-2 text-sm">Completion Rate</td>
                {CHECKLIST_ITEMS.map(item => {
                  const count = checklistTotals[item.key];
                  const percentage = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
                  return (
                    <td key={item.key} className="p-2 text-center text-sm">
                      <span className={cn(
                        percentage >= 80 ? "text-emerald-600" : 
                        percentage >= 50 ? "text-amber-600" : "text-red-600"
                      )}>
                        {percentage}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
