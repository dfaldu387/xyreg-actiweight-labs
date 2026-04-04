import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle2, XCircle, Clock, Info, BarChart3, Plus, FlaskConical } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ValidationResultsTabProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function ValidationResultsTab({ productId, companyId, disabled }: ValidationResultsTabProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Fetch validation test cases (formative and summative)
  const { data: validationTests, isLoading } = useQuery({
    queryKey: ['usability-validation-tests', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('product_id', productId)
        .eq('test_type', 'validation')
        .in('test_level', ['formative', 'summative'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleNavigateToVV = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'verification-validation');
    newParams.set('subTab', 'test-cases');
    navigate(`?${newParams.toString()}`);
  };

  const handleCreateTest = (level: 'formative' | 'summative') => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'verification-validation');
    newParams.set('subTab', 'test-cases');
    newParams.set('createTest', 'true');
    newParams.set('testType', 'validation');
    newParams.set('testLevel', level);
    newParams.set('fromUE', 'true');
    navigate(`?${newParams.toString()}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'passed':
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'passed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'executed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formativeTests = validationTests?.filter((t: any) => t.test_level === 'formative') || [];
  const summativeTests = validationTests?.filter((t: any) => t.test_level === 'summative') || [];

  // Calculate summary stats
  const totalTests = validationTests?.length || 0;
  const executedTests = validationTests?.filter((t: any) => 
    ['executed', 'passed', 'approved'].includes(t.status?.toLowerCase())
  ).length || 0;
  const passedTests = validationTests?.filter((t: any) => 
    ['passed', 'approved'].includes(t.status?.toLowerCase())
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Validation Results</h3>
          <p className="text-sm text-muted-foreground">
            IEC 62366-1 Clauses 5.7/5.9 - Formative & Summative Evaluation Results
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleCreateTest('formative')} disabled={disabled}>
            <FlaskConical className="h-4 w-4 mr-2" />
            Create Formative Test
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleCreateTest('summative')} disabled={disabled}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Create Summative Test
          </Button>
          <Button variant="outline" size="sm" onClick={handleNavigateToVV} disabled={disabled}>
            <ExternalLink className="h-4 w-4 mr-2" />
            V&V Module
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This view aggregates validation test results from the V&V module.
          Use the buttons above to create new formative or summative tests directly.
        </AlertDescription>
      </Alert>

      {/* Summary Stats */}
      {totalTests > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold">{totalTests}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Formative</p>
                  <p className="text-2xl font-bold">{formativeTests.length}</p>
                </div>
                <Badge variant="outline">Iterative</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Summative</p>
                  <p className="text-2xl font-bold">{summativeTests.length}</p>
                </div>
                <Badge variant="outline">Final</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-2xl font-bold">
                    {executedTests > 0 ? Math.round((passedTests / executedTests) * 100) : 0}%
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : validationTests && validationTests.length > 0 ? (
        <div className="space-y-6">
          {/* Formative Tests */}
          {formativeTests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formative Evaluation Results</CardTitle>
                <CardDescription>Iterative testing during development</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formativeTests.map((test: any) => (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <p className="font-medium">{test.title}</p>
                          <p className="text-sm text-muted-foreground">{test.test_case_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.category && <Badge variant="outline">{test.category}</Badge>}
                        <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summative Tests */}
          {summativeTests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summative Evaluation Results</CardTitle>
                <CardDescription>Final validation with representative users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summativeTests.map((test: any) => (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <p className="font-medium">{test.title}</p>
                          <p className="text-sm text-muted-foreground">{test.test_case_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.category && <Badge variant="outline">{test.category}</Badge>}
                        <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Validation Test Results</h4>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              No formative or summative validation tests have been created yet. 
              Use the buttons above to create usability tests.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleCreateTest('formative')} disabled={disabled}>
                <FlaskConical className="h-4 w-4 mr-2" />
                Create Formative Test
              </Button>
              <Button variant="outline" onClick={() => handleCreateTest('summative')} disabled={disabled}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create Summative Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
