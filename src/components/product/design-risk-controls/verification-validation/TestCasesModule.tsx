import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Clock, AlertTriangle, Filter, TestTube2, Zap, Sparkles, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { TraceabilityLinksService } from "@/services/traceabilityLinksService";
import { vvService } from "@/services/vvService";
import { useTranslation } from "@/hooks/useTranslation";
import { CreateTestCaseDialog } from "./CreateTestCaseDialog";
import { TestCaseDetailDialog } from "./TestCaseDetailDialog";
import { generateUeToVvPrefill, PrefillData } from "@/utils/ueToVvPrefill";
import { generateRcTestCases } from "@/utils/rcToTestCasePrefill";
import { AITestCaseGeneratorDialog } from "../usability-engineering/AITestCaseGeneratorDialog";
import { hazardsService } from "@/services/hazardsService";
import { toast } from "sonner";

interface TestCasesModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function TestCasesModule({ productId, companyId, disabled = false }: TestCasesModuleProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const rcGenerationTriggered = useRef(false);
  const [activeTab, setActiveTab] = useState("verification");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [prefillData, setPrefillData] = useState<PrefillData | undefined>(undefined);
  const [detailTestCase, setDetailTestCase] = useState<any>(null);
  const [editTestCase, setEditTestCase] = useState<any>(null);
  const [showAITestGen, setShowAITestGen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteTestCase = async (testCaseId: string) => {
    setDeletingId(testCaseId);
    try {
      await vvService.deleteTestCase(testCaseId);
      await TraceabilityLinksService.deleteBySourceOrTarget(productId, 'test_case', testCaseId);
      queryClient.invalidateQueries({ queryKey: ['test-cases', productId] });
      toast.success('Test case deleted successfully');
    } catch (error) {
      console.error('Error deleting test case:', error);
      toast.error('Failed to delete test case');
    } finally {
      setDeletingId(null);
    }
  };

  // Fetch usability hazards (HAZ-USE) for AI test case generation
  const { data: usabilityHazards = [] } = useQuery({
    queryKey: ['hazards-usability', productId],
    queryFn: async () => {
      const all = await hazardsService.getHazardsByProduct(productId);
      return all.filter(h => h.category === 'human_factors');
    },
  });

  // Read URL params for auto-open from UE module
  useEffect(() => {
    const createTest = searchParams.get('createTest');
    const fromUE = searchParams.get('fromUE');
    const testLevel = searchParams.get('testLevel') as 'formative' | 'summative' | null;
    const testType = searchParams.get('testType');

    if (createTest === 'true') {
      // Switch to validation tab if specified
      if (testType === 'validation') {
        setActiveTab('validation');
      }

      if (fromUE === 'true' && testLevel) {
        // Fetch UE context and prefill
        generateUeToVvPrefill(productId, testLevel).then((data) => {
          setPrefillData(data);
          setShowCreateDialog(true);
        }).catch((err) => {
          console.error('Failed to generate UE prefill:', err);
          // Still open dialog, just without prefill
          if (testLevel) {
            setPrefillData({ test_level: testLevel });
          }
          setShowCreateDialog(true);
        });
      } else {
        // Open dialog without UE context but with testLevel if provided
        if (testLevel) {
          setPrefillData({ test_level: testLevel });
        }
        setShowCreateDialog(true);
      }

      // Clean up URL params after reading
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('createTest');
      newParams.delete('fromUE');
      newParams.delete('testLevel');
      newParams.delete('testType');
      setSearchParams(newParams, { replace: true });
    }
  }, []); // Run once on mount

  // Handle generateForRC param - batch create RC verification test cases
  useEffect(() => {
    const generateForRC = searchParams.get('generateForRC');
    if (generateForRC === 'true' && !rcGenerationTriggered.current) {
      rcGenerationTriggered.current = true;
      
      // Clean up URL param immediately
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('generateForRC');
      setSearchParams(newParams, { replace: true });

      // Show loading toast
      const loadingToastId = toast.loading('Generating verification test cases for risk controls...');

      generateRcTestCases(productId, companyId)
        .then((count) => {
          toast.dismiss(loadingToastId);
          if (count > 0) {
            toast.success(`Created ${count} verification test cases for risk controls`);
            queryClient.invalidateQueries({ queryKey: ['test-cases'] });
            queryClient.invalidateQueries({ queryKey: ['traceability-matrix'] });
          }
        })
        .catch((err) => {
          toast.dismiss(loadingToastId);
          console.error('Failed to generate RC test cases:', err);
          toast.error('Failed to generate test cases for risk controls');
        });
    }
  }, [searchParams]); // Re-run when searchParams change (important for tab navigation)

  const { data: testCases, isLoading } = useQuery({
    queryKey: ['test-cases', companyId, productId, activeTab, levelFilter, categoryFilter, statusFilter],
    queryFn: () => vvService.getTestCases(companyId, productId, {
      test_type: activeTab as 'verification' | 'validation',
      ...(levelFilter !== 'all' && { test_level: levelFilter }),
      ...(categoryFilter !== 'all' && { category: categoryFilter }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
    }),
  });

  // Auto-open a test case when navigated from the Traceability Matrix.
  // The matrix may pass a verification or validation test case, so we look it up
  // unfiltered (a separate small query) to avoid mismatches with the active tab/filters.
  const { data: allTestCasesForOpen } = useQuery({
    queryKey: ['test-cases-all', companyId, productId],
    queryFn: () => vvService.getTestCases(companyId, productId, {}),
    enabled: !!searchParams.get('openItemId'),
  });

  useEffect(() => {
    const openId = searchParams.get('openItemId');
    if (!openId || !allTestCasesForOpen || allTestCasesForOpen.length === 0) return;
    const found = allTestCasesForOpen.find((tc: any) => tc.id === openId);
    if (found) {
      // Switch tab to match the test case so any background list refreshes correctly
      if (found.test_type === 'validation' || found.test_type === 'verification') {
        setActiveTab(found.test_type);
      }
      setDetailTestCase(found);
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('openItemId');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, allTestCasesForOpen, setSearchParams]);

  const [isGeneratingRC, setIsGeneratingRC] = useState(false);

  const handleCreateTestCase = () => {
    if (disabled) return;
    setPrefillData(undefined);
    setShowCreateDialog(true);
  };

  const handleGenerateRCTestCases = async () => {
    if (disabled || isGeneratingRC) return;
    setIsGeneratingRC(true);
    try {
      const count = await generateRcTestCases(productId, companyId);
      if (count > 0) {
        toast.success(`Created ${count} verification test cases for risk controls`);
        queryClient.invalidateQueries({ queryKey: ['test-cases'] });
        queryClient.invalidateQueries({ queryKey: ['traceability-matrix'] });
      }
    } catch (err) {
      console.error('Failed to generate RC test cases:', err);
      toast.error('Failed to generate test cases for risk controls');
    } finally {
      setIsGeneratingRC(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'under_review':
        return 'outline';
      case 'executed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'executed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'under_review':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <TestTube2 className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'outline';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const TestCaseList = ({ testType }: { testType: 'verification' | 'validation' }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Select value={levelFilter} onValueChange={setLevelFilter} disabled={disabled}>
            <SelectTrigger className="w-[150px]" disabled={disabled}>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={lang('verificationValidation.testCases.level')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang('verificationValidation.testCases.allLevels')}</SelectItem>
              <SelectItem value="unit">{lang('verificationValidation.testCases.unit')}</SelectItem>
              <SelectItem value="integration">{lang('verificationValidation.testCases.integration')}</SelectItem>
              <SelectItem value="system">{lang('verificationValidation.testCases.system')}</SelectItem>
              {testType === 'validation' && <SelectItem value="validation">{lang('verificationValidation.testCases.validation')}</SelectItem>}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={disabled}>
            <SelectTrigger className="w-[150px]" disabled={disabled}>
              <SelectValue placeholder={lang('verificationValidation.testCases.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang('verificationValidation.testCases.allCategories')}</SelectItem>
              <SelectItem value="hardware">{lang('verificationValidation.testCases.hardware')}</SelectItem>
              <SelectItem value="software">{lang('verificationValidation.testCases.software')}</SelectItem>
              <SelectItem value="usability">{lang('verificationValidation.testCases.usability')}</SelectItem>
              {testType === 'validation' && <SelectItem value="clinical">{lang('verificationValidation.testCases.clinical')}</SelectItem>}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter} disabled={disabled}>
            <SelectTrigger className="w-[150px]" disabled={disabled}>
              <SelectValue placeholder={lang('verificationValidation.testCases.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang('verificationValidation.testCases.allStatuses')}</SelectItem>
              <SelectItem value="draft">{lang('verificationValidation.testCases.draft')}</SelectItem>
              <SelectItem value="under_review">{lang('verificationValidation.testCases.underReview')}</SelectItem>
              <SelectItem value="approved">{lang('verificationValidation.testCases.approved')}</SelectItem>
              <SelectItem value="executed">{lang('verificationValidation.testCases.executed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {testType === 'validation' && usabilityHazards.length > 0 && (
            <Button variant="outline" onClick={() => setShowAITestGen(true)} disabled={disabled}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate from Hazards
            </Button>
          )}
          <Button onClick={handleCreateTestCase} disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" />
            {testType === 'verification'
              ? lang('verificationValidation.testCases.createVerificationTest')
              : lang('verificationValidation.testCases.createValidationTest')}
          </Button>
        </div>
      </div>

      {!testCases || testCases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <TestTube2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">
              {testType === 'verification'
                ? lang('verificationValidation.testCases.noVerificationTestCases')
                : lang('verificationValidation.testCases.noValidationTestCases')}
            </h4>
            <p className="text-muted-foreground mb-4">
              {testType === 'verification'
                ? lang('verificationValidation.testCases.createFirstVerificationTestCaseDescription')
                : lang('verificationValidation.testCases.createFirstValidationTestCaseDescription')}
            </p>
            <Button onClick={handleCreateTestCase} disabled={disabled}>
              <Plus className="h-4 w-4 mr-2" />
              {lang('verificationValidation.testCases.createFirstTestCase')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {testCases.map((testCase) => (
            <Card key={testCase.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{testCase.test_case_id}</CardTitle>
                      <Badge variant={getPriorityColor(testCase.priority)}>
                        {testCase.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-medium">{testCase.name}</CardTitle>
                    {testCase.description && (
                      <CardDescription>{testCase.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(testCase.status)} className="gap-1">
                      {getStatusIcon(testCase.status)}
                      {testCase.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium text-foreground">{lang('verificationValidation.testCases.levelLabel')}:</span>
                    <span className="text-muted-foreground ml-2 capitalize">{testCase.test_level}</span>
                  </div>
                  {testCase.category && (
                    <div>
                      <span className="font-medium text-foreground">{lang('verificationValidation.testCases.categoryLabel')}:</span>
                      <span className="text-muted-foreground ml-2 capitalize">{testCase.category}</span>
                    </div>
                  )}
                  {testCase.test_method && (
                    <div>
                      <span className="font-medium text-foreground">{lang('verificationValidation.testCases.methodLabel')}:</span>
                      <span className="text-muted-foreground ml-2 capitalize">{testCase.test_method}</span>
                    </div>
                  )}
                  {testCase.estimated_duration && (
                    <div>
                      <span className="font-medium text-foreground">{lang('verificationValidation.testCases.durationLabel')}:</span>
                      <span className="text-muted-foreground ml-2">{testCase.estimated_duration}m</span>
                    </div>
                  )}
                </div>

                {testCase.preconditions && (
                  <div className="mb-4">
                    <span className="font-medium text-foreground">{lang('verificationValidation.testCases.preconditionsLabel')}:</span>
                    <p className="text-muted-foreground mt-1 text-sm">{testCase.preconditions}</p>
                  </div>
                )}

                {testCase.expected_results && (
                  <div className="mb-4">
                    <span className="font-medium text-foreground">{lang('verificationValidation.testCases.expectedResultsLabel')}:</span>
                    <p className="text-muted-foreground mt-1 text-sm">{testCase.expected_results}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={disabled} onClick={() => setDetailTestCase(testCase)}>
                    <TestTube2 className="h-4 w-4 mr-2" />
                    {lang('verificationValidation.testCases.viewDetails')}
                  </Button>
                  {testCase.status === 'approved' && (
                    <Button variant="outline" size="sm" disabled={disabled}>
                      {lang('verificationValidation.testCases.executeTest')}
                    </Button>
                  )}
                  {testCase.status === 'draft' && (
                    <Button variant="outline" size="sm" disabled={disabled} onClick={() => setEditTestCase(testCase)}>
                      {lang('verificationValidation.testCases.editTestCase')}
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={disabled || deletingId === testCase.id} className="text-destructive hover:text-destructive ml-auto">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete test case</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{testCase.name}"? This will also remove associated traceability links. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTestCase(testCase.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{lang('verificationValidation.testCases.title')}</h3>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{lang('verificationValidation.testCases.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {lang('verificationValidation.testCases.description')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="verification">{lang('verificationValidation.testCases.verificationTests')}</TabsTrigger>
          <TabsTrigger value="validation">{lang('verificationValidation.testCases.validationTests')}</TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="space-y-4">
          <TestCaseList testType="verification" />
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <TestCaseList testType="validation" />
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">{lang('verificationValidation.testCases.testCaseManagement')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('verificationValidation.testCases.verificationTests')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{lang('verificationValidation.testCases.unitDescription')}</li>
                <li>{lang('verificationValidation.testCases.integrationDescription')}</li>
                <li>{lang('verificationValidation.testCases.systemDescription')}</li>
                <li>{lang('verificationValidation.testCases.interfaceDescription')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('verificationValidation.testCases.validationTests')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{lang('verificationValidation.testCases.clinicalDescription')}</li>
                <li>{lang('verificationValidation.testCases.usabilityDescription')}</li>
                <li>{lang('verificationValidation.testCases.validationDescription')}</li>
                <li>{lang('verificationValidation.testCases.acceptanceDescription')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <TestCaseDetailDialog
        testCase={detailTestCase}
        open={!!detailTestCase}
        onOpenChange={(open) => { if (!open) setDetailTestCase(null); }}
      />

      <CreateTestCaseDialog
        open={showCreateDialog || !!editTestCase}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setPrefillData(undefined);
            setEditTestCase(null);
          }
        }}
        productId={productId}
        companyId={companyId}
        testType={activeTab as "verification" | "validation"}
        prefillData={prefillData}
        editTestCase={editTestCase}
      />

      <AITestCaseGeneratorDialog
        open={showAITestGen}
        onOpenChange={setShowAITestGen}
        productId={productId}
        companyId={companyId}
        hazards={usabilityHazards}
      />
    </div>
  );
}
