import React, { useState, useEffect } from 'react';
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
  Database,
  FileX,
  Target,
  ArrowRight,
  Layers,
  GitMerge,
  TrendingDown
} from "lucide-react";
import { DocumentOrganizationService, DocumentAnalysis } from '@/services/documentOrganizationService';
import { toast } from 'sonner';

interface DocumentOrganizationDashboardProps {
  companyId: string;
  onCleanupComplete?: () => void;
}

export function DocumentOrganizationDashboard({ 
  companyId, 
  onCleanupComplete 
}: DocumentOrganizationDashboardProps) {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const analyzeDocuments = async () => {
    setIsAnalyzing(true);
    try {
      const result = await DocumentOrganizationService.analyzeDocumentOrganization(companyId);
      setAnalysis(result);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Document analysis failed:', error);
      toast.error('Failed to analyze documents');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performCleanup = async () => {
    if (!analysis) return;
    
    setIsCleaningUp(true);
    try {
      const result = await DocumentOrganizationService.performComprehensiveCleanup(companyId);
      
      if (result.success) {
        toast.success('Phase 3 document organization cleanup completed successfully!');
        await analyzeDocuments(); // Refresh analysis
        onCleanupComplete?.();
      } else {
        toast.error(`Phase 3 cleanup completed with ${result.errors.length} errors`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error('Failed to perform cleanup');
    } finally {
      setIsCleaningUp(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      analyzeDocuments();
    }
  }, [companyId]);

  const getHealthScore = (): number => {
    if (!analysis) return 0;
    
    const totalIssues = 
      analysis.duplicateGroups.length + 
      analysis.orphanedDocuments.length + 
      analysis.incorrectScopes.length +
      analysis.phaseAssignmentIssues.testPhases.length;
    
    const maxExpectedIssues = Math.max(analysis.totalDocuments * 0.1, 10);
    return Math.max(0, Math.min(100, 100 - (totalIssues / maxExpectedIssues) * 100));
  };

  const getTotalIssues = (): number => {
    if (!analysis) return 0;
    return analysis.duplicateGroups.length + 
           analysis.orphanedDocuments.length + 
           analysis.incorrectScopes.length +
           analysis.phaseAssignmentIssues.testPhases.length +
           (analysis.phaseAssignmentIssues.templateConsolidationCandidates?.length || 0) +
           (analysis.phaseAssignmentIssues.overDistributed?.length || 0);
  };

  const healthScore = getHealthScore();
  const totalIssues = getTotalIssues();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Document Organization Analysis
              <Badge variant="outline" className="ml-2">Phase 3: Template Consolidation</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={analyzeDocuments}
                disabled={isAnalyzing}
                variant="outline"
                size="sm"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Analysis
                  </>
                )}
              </Button>
              {analysis && totalIssues > 0 && (
                <Button
                  onClick={performCleanup}
                  disabled={isCleaningUp}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isCleaningUp ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Phase 3 Cleanup...
                    </>
                  ) : (
                    <>
                      <GitMerge className="h-4 w-4 mr-2" />
                      Phase 3 Auto-Fix
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {analysis ? (
            <>
              {/* Health Score */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Document Organization Health</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.totalDocuments} total documents analyzed
                      {lastAnalyzed && (
                        <span className="ml-2">
                          • Last checked {lastAnalyzed.toLocaleTimeString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{Math.round(healthScore)}%</span>
                    {healthScore >= 80 ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    )}
                  </div>
                </div>
                <Progress value={healthScore} className="w-full" />
              </div>

              {/* Enhanced Scope Breakdown with Phase 3 Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded border">
                  <div className="text-lg font-bold text-blue-600">
                    {analysis.scopeBreakdown.companyTemplates}
                  </div>
                  <div className="text-xs text-blue-700">Company Templates</div>
                  <div className="text-xs text-muted-foreground">
                    ~{Math.ceil(analysis.scopeBreakdown.companyTemplates * 0.15)} after consolidation
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded border">
                  <div className="text-lg font-bold text-green-600">
                    {analysis.scopeBreakdown.companyDocuments}
                  </div>
                  <div className="text-xs text-green-700">Company Documents</div>
                  <div className="text-xs text-muted-foreground">Company-wide documents</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded border">
                  <div className="text-lg font-bold text-purple-600">
                    {analysis.scopeBreakdown.productDocuments}
                  </div>
                  <div className="text-xs text-purple-700">Product Documents</div>
                  <div className="text-xs text-muted-foreground">Product-specific instances</div>
                </div>
              </div>

              {/* Phase 3 Template Consolidation Analysis */}
              {analysis.phaseAssignmentIssues.templateConsolidationCandidates && 
               analysis.phaseAssignmentIssues.templateConsolidationCandidates.length > 0 && (
                <Alert className="border-purple-200 bg-purple-50">
                  <Layers className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <strong className="text-purple-800">Phase 3: Template Consolidation Analysis</strong>
                      <div className="text-sm text-purple-700">
                        <p>{analysis.phaseAssignmentIssues.templateConsolidationCandidates.length} template groups identified for consolidation:</p>
                        <ul className="mt-2 space-y-1 ml-4">
                          <li>• Similar templates with duplicate functionality</li>
                          <li>• Templates scattered across multiple phases unnecessarily</li>
                          <li>• Naming inconsistencies causing template proliferation</li>
                        </ul>
                        <div className="mt-2 flex items-center gap-2 text-purple-600">
                          <TrendingDown className="h-3 w-3" />
                          <span>Estimated reduction: {analysis.scopeBreakdown.companyTemplates} → {Math.ceil(analysis.scopeBreakdown.companyTemplates * 0.15)} templates</span>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Phase 3 Over-Distribution Analysis */}
              {analysis.phaseAssignmentIssues.overDistributed && 
               analysis.phaseAssignmentIssues.overDistributed.length > 0 && (
                <Alert className="border-indigo-200 bg-indigo-50">
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <strong className="text-indigo-800">Phase 3: Over-Distribution Analysis</strong>
                      <div className="text-sm text-indigo-700">
                        <p>{analysis.phaseAssignmentIssues.overDistributed.length} documents are over-distributed across phases:</p>
                        <ul className="mt-2 space-y-1 ml-4">
                          <li>• Documents assigned to more than 5 phases</li>
                          <li>• Reduces phase focus and clarity</li>
                          <li>• Creates maintenance overhead</li>
                        </ul>
                        <div className="mt-2 flex items-center gap-2 text-indigo-600">
                          <ArrowRight className="h-3 w-3" />
                          <span>Auto-optimization will limit documents to 2-3 most relevant phases</span>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Enhanced Issues Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="text-center p-2 bg-red-50 rounded border">
                  <div className="text-lg font-bold text-red-600">
                    {analysis.duplicateGroups.length}
                  </div>
                  <div className="text-xs text-red-700">Duplicate Groups</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded border">
                  <div className="text-lg font-bold text-orange-600">
                    {analysis.orphanedDocuments.length}
                  </div>
                  <div className="text-xs text-orange-700">Orphaned Docs</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded border">
                  <div className="text-lg font-bold text-yellow-600">
                    {analysis.incorrectScopes.length}
                  </div>
                  <div className="text-xs text-yellow-700">Wrong Scope</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded border">
                  <div className="text-lg font-bold text-amber-600">
                    {analysis.phaseAssignmentIssues.testPhases.length}
                  </div>
                  <div className="text-xs text-amber-700">Test Phases</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded border">
                  <div className="text-lg font-bold text-purple-600">
                    {analysis.phaseAssignmentIssues.templateConsolidationCandidates?.length || 0}
                  </div>
                  <div className="text-xs text-purple-700">Template Groups</div>
                </div>
                <div className="text-center p-2 bg-indigo-50 rounded border">
                  <div className="text-lg font-bold text-indigo-600">
                    {analysis.phaseAssignmentIssues.overDistributed?.length || 0}
                  </div>
                  <div className="text-xs text-indigo-700">Over-Distributed</div>
                </div>
              </div>

              {/* Detailed Issues - Enhanced for Phase 3 */}
              {totalIssues > 0 && (
                <div className="space-y-4">
                  <h5 className="font-medium flex items-center gap-2">
                    <GitMerge className="h-4 w-4" />
                    Phase 3 Comprehensive Issues Analysis
                  </h5>

                  {/* Phase 3 specific alerts */}
                  {analysis.phaseAssignmentIssues.templateConsolidationCandidates && 
                   analysis.phaseAssignmentIssues.templateConsolidationCandidates.length > 0 && (
                    <Alert>
                      <Layers className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{analysis.phaseAssignmentIssues.templateConsolidationCandidates.length} template consolidation opportunities</strong>. 
                        Phase 3 will merge similar templates and standardize naming conventions to create a cleaner template library.
                      </AlertDescription>
                    </Alert>
                  )}

                  {analysis.phaseAssignmentIssues.overDistributed && 
                   analysis.phaseAssignmentIssues.overDistributed.length > 0 && (
                    <Alert>
                      <Target className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{analysis.phaseAssignmentIssues.overDistributed.length} over-distributed documents</strong>. 
                        Phase 3 will optimize phase assignments to keep documents only in their most relevant phases.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Keep existing Phase 2 alerts */}
                  {analysis.incorrectScopes.length > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <Target className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <strong className="text-yellow-800">Phase 2: Scope Correction Analysis</strong>
                          <div className="text-sm text-yellow-700">
                            <p>{analysis.incorrectScopes.length} documents found with incorrect scope assignments:</p>
                            <ul className="mt-2 space-y-1 ml-4">
                              <li>• Documents with product IDs incorrectly marked as templates</li>
                              <li>• Product documents without proper product associations</li>
                              <li>• Templates mixed in product document scope</li>
                            </ul>
                            <div className="mt-2 flex items-center gap-2 text-yellow-600">
                              <span>Auto-correction will:</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>Fix scope assignments based on document relationships</span>
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {analysis.duplicateGroups.length > 0 && (
                    <Alert>
                      <FileX className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{analysis.duplicateGroups.length} duplicate document groups</strong> found. 
                        These are documents with identical names that may be redundant.
                        <div className="mt-2 text-sm">
                          Examples: {analysis.duplicateGroups.slice(0, 3).map(g => `"${g.name}" (${g.count} copies)`).join(', ')}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {analysis.incorrectScopes.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{analysis.incorrectScopes.length} documents with incorrect scope</strong>. 
                        Phase 2 will automatically correct these based on document relationships and product associations.
                      </AlertDescription>
                    </Alert>
                  )}

                  {analysis.phaseAssignmentIssues.testPhases.length > 0 && (
                    <Alert>
                      <Settings2 className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{analysis.phaseAssignmentIssues.testPhases.length} documents assigned to test phases</strong>. 
                        These should be reassigned to proper lifecycle phases.
                      </AlertDescription>
                    </Alert>
                  )}

                  {analysis.orphanedDocuments.length > 0 && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{analysis.orphanedDocuments.length} orphaned documents</strong> found. 
                        These documents lack proper company or product associations.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Action Summary */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {totalIssues > 0 ? (
                    <Badge variant="destructive">
                      {totalIssues} issues require Phase 3 optimization
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Document organization is fully optimized!
                    </Badge>
                  )}
                </div>
                {totalIssues > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Click "Phase 3 Auto-Fix" to execute comprehensive template consolidation and optimization
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                Click "Refresh Analysis" to scan your document organization
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
