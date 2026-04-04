import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  FolderX,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  Loader2
} from 'lucide-react';
import { NoPhaseService } from '@/services/noPhaseService';
import { toast } from 'sonner';

interface NoPhaseStats {
  totalCompanies: number;
  companiesWithNoPhase: number;
  companiesWithoutNoPhase: { id: string; name: string }[];
  companiesWithoutChosenPhase: { id: string; name: string }[];
}

export default function NoPhaseInitialization() {
  const [stats, setStats] = useState<NoPhaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCompany, setCurrentCompany] = useState('');
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [isFixingChosen, setIsFixingChosen] = useState(false);
  const [fixChosenResult, setFixChosenResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await NoPhaseService.getNoPhaseStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching No Phase stats:', error);
      toast.error('Failed to fetch No Phase statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleInitializeAll = async () => {
    if (!stats || stats.companiesWithoutNoPhase.length === 0) {
      toast.info('All companies already have No Phase initialized');
      return;
    }

    setIsInitializing(true);
    setProgress(0);
    setCurrentCompany('');
    setResult(null);

    try {
      const result = await NoPhaseService.initializeNoPhaseForAllCompanies(
        (current, total, companyName) => {
          setProgress(Math.round((current / total) * 100));
          setCurrentCompany(companyName);
        }
      );

      setResult(result);

      if (result.failed === 0) {
        toast.success(`Successfully initialized No Phase for ${result.success} companies`);
      } else {
        toast.warning(`Completed with ${result.failed} errors. ${result.success} companies updated.`);
      }

      // Refresh stats
      await fetchStats();
    } catch (error) {
      console.error('Error initializing No Phase:', error);
      toast.error('Failed to initialize No Phase for companies');
    } finally {
      setIsInitializing(false);
      setProgress(0);
      setCurrentCompany('');
    }
  };

  const handleFixChosenPhases = async () => {
    if (!stats || stats.companiesWithoutChosenPhase.length === 0) {
      toast.info('All companies already have No Phase in chosen phases');
      return;
    }

    setIsFixingChosen(true);
    setFixChosenResult(null);

    try {
      const result = await NoPhaseService.fixMissingChosenPhases(
        (current, total, companyName) => {
          setProgress(Math.round((current / total) * 100));
          setCurrentCompany(companyName);
        }
      );

      setFixChosenResult(result);

      if (result.failed === 0) {
        toast.success(`Fixed chosen phases for ${result.success} companies`);
      } else {
        toast.warning(`Completed with ${result.failed} errors. ${result.success} companies fixed.`);
      }

      await fetchStats();
    } catch (error) {
      console.error('Error fixing chosen phases:', error);
      toast.error('Failed to fix chosen phases');
    } finally {
      setIsFixingChosen(false);
      setProgress(0);
      setCurrentCompany('');
    }
  };

  const allInitialized = stats && stats.companiesWithoutNoPhase.length === 0;
  const allChosenFixed = stats && stats.companiesWithoutChosenPhase.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderX className="h-5 w-5" />
          No Phase Initialization
        </CardTitle>
        <CardDescription>
          Initialize the "No Phase" entry for all companies. Documents without a specific phase will be assigned to this phase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Section */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <>
            {/* Status Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Companies</p>
                      <p className="text-2xl font-bold">{stats.totalCompanies}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">With No Phase</p>
                      <p className="text-2xl font-bold text-green-600">{stats.companiesWithNoPhase}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Without No Phase</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.companiesWithoutNoPhase.length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Missing from Active Phases</p>
                      <p className={`text-2xl font-bold ${stats.companiesWithoutChosenPhase.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.companiesWithoutChosenPhase.length}
                      </p>
                    </div>
                    {stats.companiesWithoutChosenPhase.length > 0 ? (
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar during initialization */}
            {isInitializing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Initializing: {currentCompany}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Result Alert */}
            {result && (
              <Alert variant={result.failed > 0 ? "destructive" : "default"}>
                {result.failed > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle>Initialization Complete</AlertTitle>
                <AlertDescription>
                  <p>Successfully initialized: {result.success} companies</p>
                  {result.failed > 0 && (
                    <>
                      <p>Failed: {result.failed} companies</p>
                      <ul className="mt-2 list-disc list-inside text-sm">
                        {result.errors.slice(0, 5).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li>...and {result.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Companies without No Phase list */}
            {stats.companiesWithoutNoPhase.length > 0 && !isInitializing && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Companies without No Phase:</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {stats.companiesWithoutNoPhase.map((company) => (
                    <Badge key={company.id} variant="outline">
                      {company.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Companies missing from chosen phases list */}
            {stats.companiesWithoutChosenPhase.length > 0 && !isFixingChosen && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Companies with No Phase NOT in active phases (company_chosen_phases):</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {stats.companiesWithoutChosenPhase.map((company) => (
                    <Badge key={company.id} variant="destructive">
                      {company.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Fix Chosen Phases Result */}
            {fixChosenResult && (
              <Alert variant={fixChosenResult.failed > 0 ? "destructive" : "default"}>
                {fixChosenResult.failed > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle>Fix Active Phases Complete</AlertTitle>
                <AlertDescription>
                  <p>Successfully fixed: {fixChosenResult.success} companies</p>
                  {fixChosenResult.failed > 0 && (
                    <p>Failed: {fixChosenResult.failed} companies</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleInitializeAll}
                disabled={isInitializing || allInitialized}
                className="flex items-center gap-2"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : allInitialized ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    All Companies Initialized
                  </>
                ) : (
                  <>
                    <FolderX className="h-4 w-4" />
                    Initialize No Phase for All Companies
                  </>
                )}
              </Button>

              <Button
                onClick={handleFixChosenPhases}
                disabled={isFixingChosen || allChosenFixed}
                variant={allChosenFixed ? "outline" : "destructive"}
                className="flex items-center gap-2"
              >
                {isFixingChosen ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fixing...
                  </>
                ) : allChosenFixed ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    All Active Phases Fixed
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Fix Missing Active Phases
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={fetchStats}
                disabled={isLoading || isInitializing || isFixingChosen}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Info Alert */}
            {allInitialized && allChosenFixed && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>All Set!</AlertTitle>
                <AlertDescription>
                  All companies have the "No Phase" entry in both company_phases and company_chosen_phases. New companies will automatically get "No Phase" when created.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to load No Phase statistics. Please try again.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
