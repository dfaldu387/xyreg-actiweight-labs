import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Target, Users } from "lucide-react";
import { Hazard, calculateRiskLevel, getSeverityLabel, getProbabilityLabel } from "./types";
import { HazardCategory } from "@/services/kolService";

interface HazardTableProps {
  hazards: Hazard[];
  categories: HazardCategory[];
  onEdit: (hazard: Hazard) => void;
  onDelete: (hazardId: string) => void;
  onAssignToKOL: (hazard: Hazard) => void;
  isLoading?: boolean;
}

export function HazardTable({ 
  hazards, 
  categories, 
  onEdit, 
  onDelete, 
  onAssignToKOL,
  isLoading = false 
}: HazardTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (hazardId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(hazardId)) {
      newExpanded.delete(hazardId);
    } else {
      newExpanded.add(hazardId);
    }
    setExpandedRows(newExpanded);
  };

  const getCategoryInfo = (categoryId?: string) => {
    if (!categoryId) return { name: 'Uncategorized', color: '#6b7280' };
    const category = categories.find(c => c.id === categoryId);
    return category ? { name: category.name, color: category.color } : { name: 'Unknown', color: '#6b7280' };
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Very High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssessmentStatusColor = (status: string) => {
    switch (status) {
      case 'assessed': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'unassessed': 
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (hazards.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hazards identified</h3>
        <p className="text-gray-500">Start by generating hazards with AI or create them manually.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hazard ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Initial Risk
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Residual Risk
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assessment Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hazards.map((hazard) => {
              const isExpanded = expandedRows.has(hazard.id);
              const categoryInfo = getCategoryInfo(hazard.category_id);
              const initialRisk = calculateRiskLevel(hazard.initial_severity, hazard.initial_probability);
              const residualRisk = calculateRiskLevel(hazard.residual_severity, hazard.residual_probability);
              const isDraft = hazard.description?.toLowerCase().startsWith('draft');

              return (
                <React.Fragment key={hazard.id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleRow(hazard.id)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isDraft ? 'text-amber-600' : 'text-gray-900'}`}>
                          {hazard.hazard_id}
                        </span>
                        {isDraft && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                            Draft
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge 
                        variant="outline" 
                        style={{ 
                          borderColor: categoryInfo.color,
                          color: categoryInfo.color,
                          backgroundColor: `${categoryInfo.color}10`
                        }}
                      >
                        {categoryInfo.name}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`text-sm max-w-xs truncate ${isDraft ? 'italic text-amber-700' : 'text-gray-900'}`}>
                        {hazard.description}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {hazard.initial_severity && hazard.initial_probability ? (
                        <div className="flex flex-col space-y-1">
                          <Badge className={getRiskLevelColor(initialRisk)}>
                            {initialRisk}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {hazard.initial_severity}×{hazard.initial_probability}
                          </span>
                        </div>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          Not Assessed
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {hazard.residual_severity && hazard.residual_probability ? (
                        <div className="flex flex-col space-y-1">
                          <Badge className={getRiskLevelColor(residualRisk)}>
                            {residualRisk}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {hazard.residual_severity}×{hazard.residual_probability}
                          </span>
                        </div>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          Not Assessed
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge className={getAssessmentStatusColor(hazard.assessment_status || 'unassessed')}>
                        {hazard.assessment_status?.replace('_', ' ') || 'Unassessed'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(hazard);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssignToKOL(hazard);
                          }}
                          title="Assign to KOL for assessment"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(hazard.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {hazard.foreseeable_sequence_events && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Foreseeable Sequence of Events</h4>
                              <p className="text-gray-700">{hazard.foreseeable_sequence_events}</p>
                            </div>
                          )}
                          {hazard.hazardous_situation && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Hazardous Situation</h4>
                              <p className="text-gray-700">{hazard.hazardous_situation}</p>
                            </div>
                          )}
                          {hazard.potential_harm && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Potential Harm</h4>
                              <p className="text-gray-700">{hazard.potential_harm}</p>
                            </div>
                          )}
                          {hazard.risk_control_measure && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Risk Control Measure</h4>
                              <p className="text-gray-700">{hazard.risk_control_measure}</p>
                            </div>
                          )}
                          {hazard.verification_implementation && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Verification Implementation</h4>
                              <p className="text-gray-700">{hazard.verification_implementation}</p>
                            </div>
                          )}
                          {hazard.verification_effectiveness && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Verification Effectiveness</h4>
                              <p className="text-gray-700">{hazard.verification_effectiveness}</p>
                            </div>
                          )}
                          {hazard.initial_severity && hazard.initial_probability && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Initial Risk Assessment</h4>
                              <p className="text-gray-700">
                                Severity: {getSeverityLabel(hazard.initial_severity)} ({hazard.initial_severity})
                                <br />
                                Probability: {getProbabilityLabel(hazard.initial_probability)} ({hazard.initial_probability})
                              </p>
                            </div>
                          )}
                          {hazard.residual_severity && hazard.residual_probability && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Residual Risk Assessment</h4>
                              <p className="text-gray-700">
                                Severity: {getSeverityLabel(hazard.residual_severity)} ({hazard.residual_severity})
                                <br />
                                Probability: {getProbabilityLabel(hazard.residual_probability)} ({hazard.residual_probability})
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}