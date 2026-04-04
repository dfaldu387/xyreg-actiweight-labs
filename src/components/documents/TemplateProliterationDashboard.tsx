
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  RefreshCw,
  GitMerge,
  Layers,
  Target,
  Brain,
  TrendingDown,
  ArrowRight,
  Zap
} from "lucide-react";
import { DocumentOrganizationDashboard } from './DocumentOrganizationDashboard';
import { DocumentIntelligenceDashboard } from './DocumentIntelligenceDashboard';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface CompanyStats {
  id: string;
  name: string;
  totalDocuments: number;
  totalPhases: number;
  averageDocsPerPhase: number;
  duplicateGroups: number;
  healthScore: number;
}

interface SystemStats {
  totalCompanies: number;
  totalDocuments: number;
  totalPhases: number;
  systemAverageDocsPerPhase: number;
  companiesWithIssues: number;
  estimatedReduction: number;
}

export function TemplateProliterationDashboard() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');

  const analyzeSystemWide = async () => {
    setIsAnalyzing(true);
    try {
      // Get all companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_archived', false);

      if (companiesError) throw companiesError;

      const companyAnalyses: CompanyStats[] = [];
      let totalSystemDocs = 0;
      let totalSystemPhases = 0;
      let companiesWithProblems = 0;

      for (const company of companies || []) {
        // Get company phases - FIXED: Use company_phases
        const { data: phases } = await supabase
          .from('company_chosen_phases')
          .select(`
            position,
            company_phases!inner(id, name)
          `)
          .eq('company_id', company.id);

        const phaseCount = phases?.length || 0;

        // Get documents for this company
        const { data: documents } = await supabase
          .from('phase_assigned_documents')
          .select('*')
          .in('phase_id', (phases || []).map(p => p.company_phases.id));

        const docCount = documents?.length || 0;
        const avgDocsPerPhase = phaseCount > 0 ? docCount / phaseCount : 0;

        // Identify duplicates (simplified)
        const docNames = documents?.map(d => d.name.toLowerCase()) || [];
        const duplicateGroups = new Set(docNames.filter((name, index) => 
          docNames.indexOf(name) !== index
        )).size;

        // Calculate health score
        const healthScore = Math.max(0, 100 - (avgDocsPerPhase - 15) * 2);
        
        if (avgDocsPerPhase > 30) companiesWithProblems++;

        companyAnalyses.push({
          id: company.id,
          name: company.name,
          totalDocuments: docCount,
          totalPhases: phaseCount,
          averageDocsPerPhase: avgDocsPerPhase,
          duplicateGroups,
          healthScore
        });

        totalSystemDocs += docCount;
        totalSystemPhases += phaseCount;
      }

      const systemAverage = totalSystemPhases > 0 ? totalSystemDocs / totalSystemPhases : 0;
      const estimatedReduction = Math.max(0, systemAverage - 15);

      setSystemStats({
        totalCompanies: companies?.length || 0,
        totalDocuments: totalSystemDocs,
        totalPhases: totalSystemPhases,
        systemAverageDocsPerPhase: systemAverage,
        companiesWithIssues: companiesWithProblems,
        estimatedReduction
      });

      setCompanyStats(companyAnalyses.sort((a, b) => b.averageDocsPerPhase - a.averageDocsPerPhase));
      
      toast.success(`System analysis complete: ${companies?.length || 0} companies analyzed`);

    } catch (error) {
      // console.error('[SystemAnalysis] Failed:', error);
      toast.error('Failed to analyze system');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    analyzeSystemWide();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Template Proliferation Solution</h1>
          <p className="text-muted-foreground">
            Comprehensive 4-phase system to solve the systemic document template issue
          </p>
        </div>
        <Button
          onClick={analyzeSystemWide}
          disabled={isAnalyzing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing System...
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4 mr-2" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Phase 1: Analysis
          </TabsTrigger>
          <TabsTrigger value="consolidation" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Phase 2: Consolidation
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Phase 3: Optimization
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Phase 4: Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          {/* System Overview */}
          {systemStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System-Wide Template Proliferation Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded border">
                    <div className="text-2xl font-bold text-blue-600">
                      {systemStats.totalCompanies}
                    </div>
                    <div className="text-sm text-blue-700">Total Companies</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded border">
                    <div className="text-2xl font-bold text-red-600">
                      {Math.round(systemStats.systemAverageDocsPerPhase)}
                    </div>
                    <div className="text-sm text-red-700">Avg Docs/Phase</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded border">
                    <div className="text-2xl font-bold text-orange-600">
                      {systemStats.companiesWithIssues}
                    </div>
                    <div className="text-sm text-orange-700">Companies Affected</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded border">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(systemStats.estimatedReduction)}
                    </div>
                    <div className="text-sm text-green-700">Docs to Reduce</div>
                  </div>
                </div>

                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Critical System Issue Detected:</strong> The sync_document_matrix_from_static() function has created massive template proliferation. 
                    Average of {Math.round(systemStats.systemAverageDocsPerPhase)} documents per phase instead of the optimal 10-15. 
                    This affects {systemStats.companiesWithIssues} out of {systemStats.totalCompanies} companies.
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Solution: 4-Phase Document Organization System</h5>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Phase 2: Template Consolidation - Merge duplicate templates</p>
                    <p>• Phase 3: Scope Optimization - Fix document assignments</p>
                    <p>• Phase 4: Intelligence Analysis - AI-powered optimization</p>
                    <p>• Target: Reduce to 10-15 core templates per phase</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Company Analysis (Worst First)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {companyStats.map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {company.totalDocuments} docs across {company.totalPhases} phases
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${
                          company.averageDocsPerPhase > 50 ? 'text-red-600' :
                          company.averageDocsPerPhase > 30 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {Math.round(company.averageDocsPerPhase)}
                        </div>
                        <div className="text-xs text-muted-foreground">docs/phase</div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedCompany(company.id);
                          setActiveTab('consolidation');
                        }}
                        size="sm"
                        variant={company.averageDocsPerPhase > 30 ? "destructive" : "outline"}
                      >
                        {company.averageDocsPerPhase > 30 ? "Fix Issues" : "Optimize"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consolidation">
          {selectedCompany ? (
            <DocumentOrganizationDashboard 
              companyId={selectedCompany}
              onCleanupComplete={() => {
                analyzeSystemWide();
                toast.success('Phase 2-3 consolidation completed for company');
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Select a company from the Analysis tab to perform template consolidation</p>
                <Button onClick={() => setActiveTab('analysis')} variant="outline">
                  Go to Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimization">
          {selectedCompany ? (
            <DocumentOrganizationDashboard 
              companyId={selectedCompany}
              onCleanupComplete={() => {
                analyzeSystemWide();
                toast.success('Phase 3 optimization completed for company');
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Select a company from the Analysis tab to perform scope optimization</p>
                <Button onClick={() => setActiveTab('analysis')} variant="outline">
                  Go to Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="intelligence">
          {selectedCompany ? (
            <DocumentIntelligenceDashboard 
              companyId={selectedCompany}
              onOptimizationComplete={() => {
                analyzeSystemWide();
                toast.success('Phase 4 intelligence optimization completed');
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Select a company from the Analysis tab to run Phase 4 intelligence analysis</p>
                <Button onClick={() => setActiveTab('analysis')} variant="outline">
                  Go to Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
