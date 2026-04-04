
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  Target,
  FileText,
  GitMerge,
  BarChart3,
  Shield,
  Workflow,
  Layers
} from "lucide-react";
import { useDocumentIntelligence } from '@/hooks/useDocumentIntelligence';

interface DocumentIntelligenceDashboardProps {
  companyId: string;
  onOptimizationComplete?: () => void;
}

export function DocumentIntelligenceDashboard({ 
  companyId, 
  onOptimizationComplete 
}: DocumentIntelligenceDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { 
    intelligence, 
    isAnalyzing, 
    isOptimizing,
    intelligenceScore,
    criticalRecommendations,
    optimizationCount,
    analyzeIntelligence,
    performOptimization,
    lastAnalyzed 
  } = useDocumentIntelligence(companyId);

  const handleOptimization = async () => {
    const success = await performOptimization();
    if (success) {
      onOptimizationComplete?.();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Phase 4: Advanced Document Intelligence
              <Badge variant="outline" className="ml-2 bg-gradient-to-r from-purple-50 to-blue-50">
                AI-Powered Analysis
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={analyzeIntelligence}
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
                    <Brain className="h-4 w-4 mr-2" />
                    Refresh Analysis
                  </>
                )}
              </Button>
              {intelligence && optimizationCount > 0 && (
                <Button
                  onClick={handleOptimization}
                  disabled={isOptimizing}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Phase 4 Optimizing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      AI Auto-Optimize
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {intelligence ? (
            <>
              {/* Intelligence Score Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Document Intelligence Score</h4>
                    <p className="text-sm text-muted-foreground">
                      AI-powered analysis of content, workflow, and compliance
                      {lastAnalyzed && (
                        <span className="ml-2">
                          • Last analyzed {lastAnalyzed.toLocaleTimeString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{Math.round(intelligenceScore)}%</span>
                    {intelligenceScore >= 90 ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : intelligenceScore >= 70 ? (
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
                <Progress value={intelligenceScore} className="w-full" />
              </div>

              {/* Intelligence Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-purple-50 rounded-lg border">
                  <div className="text-lg font-bold text-purple-600">
                    {intelligence.contentAnalysis.duplicateContentGroups.length}
                  </div>
                  <div className="text-xs text-purple-700">Content Duplicates</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border">
                  <div className="text-lg font-bold text-blue-600">
                    {intelligence.workflowOptimization.bottleneckAnalysis.filter(b => b.completionRate < 50).length}
                  </div>
                  <div className="text-xs text-blue-700">Workflow Bottlenecks</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border">
                  <div className="text-lg font-bold text-red-600">
                    {intelligence.complianceIntelligence.regulatoryGaps.length}
                  </div>
                  <div className="text-xs text-red-700">Regulatory Gaps</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border">
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(intelligence.complianceIntelligence.complianceScore)}%
                  </div>
                  <div className="text-xs text-green-700">Compliance Score</div>
                </div>
              </div>

              {/* Critical Recommendations Alert */}
              {criticalRecommendations.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <strong className="text-red-800">Critical Issues Detected</strong>
                      <div className="text-sm text-red-700">
                        {criticalRecommendations.map((rec, index) => (
                          <div key={index} className="mb-2">
                            <p className="font-medium">{rec.title}</p>
                            <p className="text-xs">{rec.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Detailed Analysis Tabs */}
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="content">Content Analysis</TabsTrigger>
                  <TabsTrigger value="workflow">Workflow</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recommendations Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          AI Recommendations ({intelligence.recommendations.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {intelligence.recommendations.slice(0, 3).map((rec, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm">{rec.title}</h5>
                              <Badge variant={rec.priority === 'critical' ? 'destructive' : 'outline'}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{rec.description}</p>
                            <p className="text-xs text-blue-600 mt-1">{rec.impact}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Intelligence Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Content Quality</span>
                            <span className="font-medium">
                              {Math.max(0, 100 - intelligence.contentAnalysis.contentQualityIssues.length * 10)}%
                            </span>
                          </div>
                          <Progress value={Math.max(0, 100 - intelligence.contentAnalysis.contentQualityIssues.length * 10)} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Workflow Efficiency</span>
                            <span className="font-medium">
                              {Math.round(intelligence.workflowOptimization.bottleneckAnalysis.reduce((avg, b) => avg + b.completionRate, 0) / 
                              Math.max(intelligence.workflowOptimization.bottleneckAnalysis.length, 1))}%
                            </span>
                          </div>
                          <Progress value={intelligence.workflowOptimization.bottleneckAnalysis.reduce((avg, b) => avg + b.completionRate, 0) / 
                              Math.max(intelligence.workflowOptimization.bottleneckAnalysis.length, 1)} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Regulatory Compliance</span>
                            <span className="font-medium">{Math.round(intelligence.complianceIntelligence.complianceScore)}%</span>
                          </div>
                          <Progress value={intelligence.complianceIntelligence.complianceScore} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-4">
                    {/* Duplicate Content Groups */}
                    {intelligence.contentAnalysis.duplicateContentGroups.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Duplicate Content Groups ({intelligence.contentAnalysis.duplicateContentGroups.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {intelligence.contentAnalysis.duplicateContentGroups.slice(0, 5).map((group, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="font-medium">{group.documents.length} similar documents</h6>
                                  <Badge variant="outline">
                                    {Math.round(group.similarityScore * 100)}% similar
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {group.documents.slice(0, 3).map(doc => doc.name).join(', ')}
                                  {group.documents.length > 3 && ` +${group.documents.length - 3} more`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Missing Documents */}
                    {intelligence.contentAnalysis.missingDocuments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Missing Critical Documents ({intelligence.contentAnalysis.missingDocuments.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {intelligence.contentAnalysis.missingDocuments.map((doc, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="font-medium">{doc.documentName}</h6>
                                  <Badge variant={doc.priority === 'high' ? 'destructive' : 'outline'}>
                                    {doc.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">{doc.reason}</p>
                                <p className="text-xs text-blue-600">
                                  Suggested phases: {doc.suggestedPhases.join(', ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="workflow" className="space-y-4">
                  <div className="space-y-4">
                    {/* Bottleneck Analysis */}
                    {intelligence.workflowOptimization.bottleneckAnalysis.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Workflow className="h-4 w-4" />
                            Workflow Bottleneck Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {intelligence.workflowOptimization.bottleneckAnalysis.map((bottleneck, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="font-medium">{bottleneck.phaseName}</h6>
                                  <Badge variant={bottleneck.completionRate < 50 ? 'destructive' : 'outline'}>
                                    {Math.round(bottleneck.completionRate)}% complete
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  {bottleneck.documentCount} documents in phase
                                </div>
                                {bottleneck.suggestions.length > 0 && (
                                  <div className="text-xs text-blue-600">
                                    Suggestions: {bottleneck.suggestions.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Phase Sequence Issues */}
                    {intelligence.workflowOptimization.phaseSequenceIssues.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <GitMerge className="h-4 w-4" />
                            Phase Sequence Issues ({intelligence.workflowOptimization.phaseSequenceIssues.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {intelligence.workflowOptimization.phaseSequenceIssues.slice(0, 5).map((issue, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <h6 className="font-medium mb-2">{issue.documentName}</h6>
                                <p className="text-sm text-muted-foreground mb-2">{issue.reason}</p>
                                <div className="text-xs">
                                  <p className="text-red-600">Current: {issue.currentPhases.join(' → ')}</p>
                                  <p className="text-green-600">Recommended: {issue.recommendedSequence.join(' → ')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4">
                  <div className="space-y-4">
                    {/* Regulatory Gaps */}
                    {intelligence.complianceIntelligence.regulatoryGaps.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Regulatory Compliance Gaps ({intelligence.complianceIntelligence.regulatoryGaps.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {intelligence.complianceIntelligence.regulatoryGaps.map((gap, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="font-medium">{gap.regulation}</h6>
                                  <Badge variant={gap.priority === 'critical' ? 'destructive' : 'outline'}>
                                    {gap.priority}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  Missing documents: {gap.missingDocuments.join(', ')}
                                </div>
                                {gap.marketImpact.length > 0 && (
                                  <div className="text-xs text-blue-600">
                                    Market impact: {gap.marketImpact.slice(0, 3).join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Device Class Requirements */}
                    {intelligence.complianceIntelligence.deviceClassRequirements.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Device Class Compliance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {intelligence.complianceIntelligence.deviceClassRequirements.map((req, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <h6 className="font-medium mb-2">{req.deviceClass}</h6>
                                <div className="text-sm space-y-1">
                                  <p><span className="text-muted-foreground">Required:</span> {req.requiredDocuments.length}</p>
                                  <p><span className="text-muted-foreground">Current:</span> {req.currentDocuments.length}</p>
                                  {req.gaps.length > 0 && (
                                    <p className="text-red-600">Missing: {req.gaps.slice(0, 3).join(', ')}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Summary */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  {optimizationCount > 0 ? (
                    <Badge variant="destructive">
                      {optimizationCount} optimizations available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Document intelligence fully optimized!
                    </Badge>
                  )}
                </div>
                {optimizationCount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Click "AI Auto-Optimize" to execute intelligent improvements
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Advanced Document Intelligence</h3>
              <p className="text-muted-foreground mb-4">
                AI-powered analysis of document content, workflow optimization, and regulatory compliance
              </p>
              <Button onClick={analyzeIntelligence} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Start AI Analysis
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
