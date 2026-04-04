import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Play, Users } from "lucide-react";
import { VVService, TestCase, TestExecution } from "@/services/vvService";
import { ExecuteTestDialog } from "./ExecuteTestDialog";
import { TestExecutionHistory } from "./TestExecutionHistory";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { TraceabilityLinksService, TraceabilityLink } from "@/services/traceabilityLinksService";
import { supabase } from "@/integrations/supabase/client";

interface TestExecutionDashboardProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

const levelBadgeVariant = (level: string): "default" | "secondary" | "outline" | "destructive" => {
  if (level === 'formative') return 'outline';
  if (level === 'summative') return 'secondary';
  return 'default';
};

export function TestExecutionDashboard({ productId, companyId, disabled }: TestExecutionDashboardProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { productId: urlProductId } = useParams<{ productId: string }>();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [executions, setExecutions] = useState<Record<string, TestExecution[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [traceabilityMap, setTraceabilityMap] = useState<Record<string, { hazardDisplayId: string; rcDisplayId: string }>>({});

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterType !== "all") filters.test_type = filterType;
      if (filterLevel !== "all") filters.test_level = filterLevel;

      const cases = await VVService.getTestCases(companyId, productId, filters);
      setTestCases(filterPriority !== "all" ? cases.filter(c => c.priority === filterPriority) : cases);

      // Fetch executions for all test cases
      const execMap: Record<string, TestExecution[]> = {};
      await Promise.all(cases.map(async tc => {
        try {
          execMap[tc.id] = await VVService.getTestExecutions(tc.id);
        } catch { execMap[tc.id] = []; }
      }));
      setExecutions(execMap);

      // Fetch traceability links to build testCaseId -> hazard/RC mapping
      try {
        const allLinks = await TraceabilityLinksService.getByProduct(productId);
        const verifyLinks = allLinks.filter(
          l => l.link_type === 'verifies_control' && l.target_type === 'test_case'
        );
        // Get hazard display IDs
        const hazardIds = [...new Set(verifyLinks.map(l => l.source_id))];
        let hazardDisplayMap: Record<string, string> = {};
        if (hazardIds.length > 0) {
          const { data: hazards } = await supabase
            .from('hazards')
            .select('id, hazard_id')
            .in('id', hazardIds);
          if (hazards) {
            hazardDisplayMap = Object.fromEntries(hazards.map(h => [h.id, h.hazard_id]));
          }
        }
        const tMap: Record<string, { hazardDisplayId: string; rcDisplayId: string }> = {};
        for (const link of verifyLinks) {
          const hazDisplayId = hazardDisplayMap[link.source_id] || '';
          const rcDisplayId = hazDisplayId.replace('HAZ-', 'RC-');
          tMap[link.target_id] = { hazardDisplayId: hazDisplayId, rcDisplayId };
        }
        setTraceabilityMap(tMap);
      } catch (err) {
        console.error('Failed to load traceability links:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [companyId, productId, filterType, filterLevel, filterPriority]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute stats
  const getLastResult = (tcId: string): string => {
    const execs = executions[tcId];
    if (!execs || execs.length === 0) return 'not_executed';
    return execs[0].status;
  };

  const stats = {
    total: testCases.length,
    passed: testCases.filter(tc => getLastResult(tc.id) === 'pass').length,
    failed: testCases.filter(tc => getLastResult(tc.id) === 'fail').length,
    blocked: testCases.filter(tc => getLastResult(tc.id) === 'blocked').length,
    notExecuted: testCases.filter(tc => getLastResult(tc.id) === 'not_executed').length,
  };

  const handleExecute = (tc: TestCase) => {
    setSelectedTestCase(tc);
    setDialogOpen(true);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pass': return <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white"><CheckCircle2 className="h-3 w-3" />Pass</Badge>;
      case 'fail': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Fail</Badge>;
      case 'blocked': return <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3" />Blocked</Badge>;
      default: return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Not Executed</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="bg-success/10"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Passed</p><p className="text-2xl font-bold text-success">{stats.passed}</p></CardContent></Card>
        <Card className="bg-destructive/10"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Failed</p><p className="text-2xl font-bold text-destructive">{stats.failed}</p></CardContent></Card>
        <Card className="bg-warning/10"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Blocked</p><p className="text-2xl font-bold text-warning">{stats.blocked}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Not Executed</p><p className="text-2xl font-bold">{stats.notExecuted}</p></CardContent></Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] h-8 text-sm"><SelectValue placeholder="Test Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="verification">Verification</SelectItem>
            <SelectItem value="validation">Validation</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[160px] h-8 text-sm"><SelectValue placeholder="Test Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="software">Software</SelectItem>
            <SelectItem value="hardware">Hardware</SelectItem>
            <SelectItem value="formative">Formative</SelectItem>
            <SelectItem value="summative">Summative</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px] h-8 text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Test Case Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading test cases...</p>
        </div>
      ) : testCases.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No test cases found. Create test cases first in the Test Cases tab.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                 <TableHead>Name</TableHead>
                 <TableHead className="w-[140px]">Linked To</TableHead>
                 <TableHead className="w-[100px]">Type</TableHead>
                 <TableHead className="w-[110px]">Level</TableHead>
                <TableHead className="w-[90px]">Priority</TableHead>
                <TableHead className="w-[130px]">Last Result</TableHead>
                <TableHead className="w-[90px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testCases.map(tc => {
                const lastResult = getLastResult(tc.id);
                const isUsability = tc.test_level === 'formative' || tc.test_level === 'summative';
                return (
                  <React.Fragment key={tc.id}>
                    <TableRow>
                      <TableCell className="text-xs font-mono">{tc.test_case_id}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          {isUsability && <Users className="h-3 w-3 text-primary flex-shrink-0" />}
                          {tc.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {traceabilityMap[tc.id] ? (
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950 w-fit"
                              onClick={() => navigate(`/app/products/${urlProductId}/design-risk-controls?tab=risk-management&returnTo=vv`)}
                            >
                              {traceabilityMap[tc.id].hazardDisplayId}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer border-blue-500 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 w-fit"
                              onClick={() => navigate(`/app/products/${urlProductId}/design-risk-controls?tab=risk-management&returnTo=vv`)}
                            >
                              {traceabilityMap[tc.id].rcDisplayId}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{tc.test_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={levelBadgeVariant(tc.test_level)} className="text-xs capitalize">
                          {tc.test_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs capitalize">{tc.priority}</span>
                      </TableCell>
                      <TableCell>{statusBadge(lastResult)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleExecute(tc)} disabled={disabled}>
                          <Play className="h-3 w-3" /> Execute
                        </Button>
                      </TableCell>
                    </TableRow>
                    {executions[tc.id]?.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-1 px-4">
                          <TestExecutionHistory executions={executions[tc.id]} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Execute Dialog */}
      <ExecuteTestDialog
        testCase={selectedTestCase}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyId={companyId}
        productId={productId}
        onExecutionSaved={() => {
          fetchData();
          queryClient.invalidateQueries({ queryKey: ['traceability-matrix'] });
          queryClient.invalidateQueries({ queryKey: ['traceability-visual'] });
        }}
      />
    </div>
  );
}
