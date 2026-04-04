import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Settings2,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  ArrowRight,
  Layers,
  GitMerge,
  Brain,
  Database
} from "lucide-react";
import { usePhaseTemplateManagement } from '@/hooks/usePhaseTemplateManagement';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useState } from 'react';

interface DocumentOrganizationSectionProps {
  companyId: string;
  onRefreshComplete?: () => void;
}

export function DocumentOrganizationSection({ 
  companyId, 
  onRefreshComplete 
}: DocumentOrganizationSectionProps) {
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  const { 
    analysis, 
    isLoading, 
    healthScore, 
    assignedTemplates,
    unassignedTemplates,
    loadTemplates,
    cleanupTemplates,
    lastAnalyzed 
  } = usePhaseTemplateManagement(companyId);

  const handleCleanup = async () => {
    try {
      await cleanupTemplates();
      onRefreshComplete?.();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await loadTemplates();
      onRefreshComplete?.();
    } catch (error) {
      console.error('Error during refresh:', error);
    }
  };

  const duplicateGroupsCount = Array.isArray(analysis?.duplicateGroups) ? analysis.duplicateGroups.length : 0;
  const totalIssues = duplicateGroupsCount + (analysis?.orphanedTemplates || 0);

  if (showFullDashboard) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Phase Template Management</h3>
          <Button 
            variant="outline" 
            onClick={() => setShowFullDashboard(false)}
          >
            Back to Summary
          </Button>
        </div>
        {/* Future: Detailed phase template dashboard could go here */}
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Detailed phase template management dashboard coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle>Phase Template Organization</CardTitle>
            <Badge variant={healthScore >= 80 ? "default" : "destructive"}>
              {healthScore}% Health
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner className="mr-2" />
            <span>Analyzing phase templates...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && !analysis && (
          <div className="text-center p-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <h3 className="font-medium text-gray-900 mb-2">Analysis Failed</h3>
            <p className="text-sm text-gray-600 mb-4">
              Unable to load phase template data. This may be due to database connectivity issues or missing data.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Success State - Only show when we have analysis data */}
        {!isLoading && analysis && (
          <>
            {/* Health Score Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Template Organization Health</span>
                <span className="font-medium">{healthScore}%</span>
              </div>
              <Progress value={healthScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Based on template assignment status, duplicates, and phase alignment
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                <div className="text-2xl font-bold text-blue-900">
                  {analysis.totalTemplates}
                </div>
                <div className="text-xs text-blue-700">Total Templates</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-600" />
                <div className="text-2xl font-bold text-green-900">
                  {analysis.assignedTemplates}
                </div>
                <div className="text-xs text-green-700">Assigned to Phases</div>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
                <div className="text-2xl font-bold text-yellow-900">{analysis.unassignedTemplates}</div>
                <div className="text-xs text-yellow-700">Unassigned</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Target className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                <div className="text-2xl font-bold text-purple-900">
                  {totalIssues}
                </div>
                <div className="text-xs text-purple-700">Issues Found</div>
              </div>
            </div>

            {/* Issue Summary */}
            {totalIssues > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Phase Template Issues Detected
                    </h4>
                    <div className="space-y-1 text-sm text-yellow-800">
                      {duplicateGroupsCount > 0 && (
                        <div>• {duplicateGroupsCount} duplicate template groups found</div>
                      )}
                      {(analysis?.orphanedTemplates || 0) > 0 && (
                        <div>• {analysis?.orphanedTemplates} templates with assignment issues</div>
                      )}
                      {(analysis?.unassignedTemplates || 0) > 0 && (
                        <div>• {analysis?.unassignedTemplates} templates not assigned to any phase</div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleCleanup}
                      disabled={isLoading}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Auto-Fix Issues
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {totalIssues === 0 && healthScore >= 80 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">
                      Phase Templates Well Organized
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Your phase templates are properly assigned and organized across lifecycle phases.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Assignment Summary */}
            {analysis.totalTemplates > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      Template Assignment Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-800">Assigned:</span>
                        <span className="ml-2 text-blue-700">{analysis.assignedTemplates} templates</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Unassigned:</span>
                        <span className="ml-2 text-blue-700">{analysis.unassignedTemplates} templates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowFullDashboard(true)}
                className="flex-1"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Template Details
              </Button>
            </div>

            {/* Last Analysis Info */}
            {lastAnalyzed && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Last analyzed: {new Date(lastAnalyzed).toLocaleString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
