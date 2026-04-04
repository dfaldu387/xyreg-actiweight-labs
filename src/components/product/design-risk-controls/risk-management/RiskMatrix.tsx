import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityLevel, ProbabilityLevel, RiskLevel, calculateRiskLevel, getSeverityLabel, getProbabilityLabel } from "./types";
import { useTranslation } from "@/hooks/useTranslation";

interface RiskMatrixProps {
  selectedSeverity?: SeverityLevel;
  selectedProbability?: ProbabilityLevel;
  onCellClick?: (severity: SeverityLevel, probability: ProbabilityLevel) => void;
  readonly?: boolean;
}

export function RiskMatrix({
  selectedSeverity,
  selectedProbability,
  onCellClick,
  readonly = false
}: RiskMatrixProps) {
  const { lang } = useTranslation();
  const severityLevels: SeverityLevel[] = [5, 4, 3, 2, 1]; // Top to bottom (Catastrophic to Negligible)
  const probabilityLevels: ProbabilityLevel[] = [1, 2, 3, 4, 5]; // Left to right (Very Rare to Very Likely)

  const getRiskColor = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Very High': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isSelected = (s: SeverityLevel, p: ProbabilityLevel): boolean => {
    return selectedSeverity === s && selectedProbability === p;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{lang('riskManagement.riskMatrix.title')}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {lang('riskManagement.riskMatrix.description')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Selected Risk Level Display */}
          {selectedSeverity && selectedProbability && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{lang('riskManagement.riskMatrix.riskLevel')}:</span>
              <Badge 
                variant="outline" 
                className={getRiskColor(calculateRiskLevel(selectedSeverity, selectedProbability)!)}
              >
                {calculateRiskLevel(selectedSeverity, selectedProbability)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ({getSeverityLabel(selectedSeverity)} × {getProbabilityLabel(selectedProbability)})
              </span>
            </div>
          )}

          {/* Risk Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-xs font-medium text-center border border-gray-300 bg-gray-50">
                    S\P
                  </th>
                  {probabilityLevels.map((prob) => (
                    <th 
                      key={prob} 
                      className="p-2 text-xs font-medium text-center border border-gray-300 bg-gray-50 min-w-[60px]"
                    >
                      <div>{prob}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {getProbabilityLabel(prob)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {severityLevels.map((sev) => (
                  <tr key={sev}>
                    <td className="p-2 text-xs font-medium border border-gray-300 bg-gray-50 text-center">
                      <div>{sev}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {getSeverityLabel(sev)}
                      </div>
                    </td>
                    {probabilityLevels.map((prob) => {
                      const riskLevel = calculateRiskLevel(sev, prob)!;
                      const selected = isSelected(sev, prob);
                      
                      return (
                        <td 
                          key={`${sev}-${prob}`}
                          className={`
                            p-2 border border-gray-300 text-center text-xs font-medium
                            ${getRiskColor(riskLevel)}
                            ${selected ? 'ring-2 ring-primary ring-offset-1' : ''}
                            ${!readonly && onCellClick ? 'cursor-pointer hover:opacity-80' : ''}
                          `}
                          onClick={() => !readonly && onCellClick?.(sev, prob)}
                        >
                          <div className="font-semibold">{sev * prob}</div>
                          <div className="text-[10px] mt-1">{riskLevel}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="text-muted-foreground">{lang('riskManagement.riskMatrix.riskLevels')}:</div>
            {['Low', 'Medium', 'High', 'Very High'].map((level) => (
              <Badge
                key={level}
                variant="outline"
                className={`${getRiskColor(level as RiskLevel)} text-xs`}
              >
                {lang(`riskManagement.riskMatrix.levels.${level.toLowerCase().replace(' ', '')}`)}
              </Badge>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            <div><strong>S:</strong> {lang('riskManagement.riskMatrix.severityLegend')}</div>
            <div><strong>P:</strong> {lang('riskManagement.riskMatrix.probabilityLegend')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}