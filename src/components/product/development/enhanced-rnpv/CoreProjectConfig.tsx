import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Target,
  BarChart,
  Zap,
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { CoreProjectConfiguration, DevelopmentPhase } from '@/services/enhanced-rnpv/interfaces';
import { toast } from 'sonner';
import { EnhancedGanttChart } from '@/components/product/timeline/EnhancedGanttChart';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductPhases } from '@/hooks/useProductPhases';
import { CoreProjectRNPVSummary } from './CoreProjectRNPVSummary';
import { HelpTooltip } from '@/components/product/device/sections/HelpTooltip';

interface CoreProjectConfigProps {
  productId: string;
  companyId: string;
  configuration: CoreProjectConfiguration;
  onConfigurationChange: (config: CoreProjectConfiguration) => void;
}

interface ExistingPhase {
  id: string;
  name: string;
  estimated_budget: number;
  likelihood_of_success: number; // LoS: Likelihood of Success
  duration_days: number;
  position: number;
  start_date?: string;
  end_date?: string;
  status: string;
}

export function CoreProjectConfig({
  productId,
  companyId,
  configuration,
  onConfigurationChange
}: CoreProjectConfigProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [existingPhases, setExistingPhases] = useState<ExistingPhase[]>([]);
  const [isLoadingPhases, setIsLoadingPhases] = useState(false);
  
  // Fetch actual project dates from milestones
  const { data: product } = useProductDetails(productId);
  
  // Calculate actual project dates from phases
  const projectDates = useMemo(() => {
    if (!existingPhases || existingPhases.length === 0) {
      return {
        projectStartDate: null,
        expectedLaunchDate: null
      };
    }
    
    const phasesWithDates = existingPhases.filter(p => p.start_date);
    const projectStartDate = phasesWithDates.length > 0 
      ? new Date(Math.min(...phasesWithDates.map(p => new Date(p.start_date!).getTime())))
      : null;
      
    // Get expected launch date from product or calculate from phases
    const expectedLaunchDate = product?.projected_launch_date 
      ? new Date(product.projected_launch_date)
      : existingPhases.length > 0 && existingPhases[existingPhases.length - 1].end_date
        ? new Date(existingPhases[existingPhases.length - 1].end_date!)
        : null;
    
    return { projectStartDate, expectedLaunchDate };
  }, [existingPhases, product]);

  const updateConfiguration = (updates: Partial<CoreProjectConfiguration>) => {
    onConfigurationChange({ ...configuration, ...updates });
  };


  // Fetch existing company phases with budget and LoA data
  useEffect(() => {
    const fetchExistingPhases = async () => {
      if (!companyId || !productId) return;
      
      setIsLoadingPhases(true);
      try {
        // Get lifecycle phases with company phase data for this product
        const { data: phaseData, error } = await supabase
          .from('lifecycle_phases')
          .select(`
            id,
            name,
            estimated_budget,
            likelihood_of_success,
            start_date,
            end_date,
            status,
            phase_id,
            company_phases!inner(
              id,
              name,
              estimated_budget,
              position,
              duration_days
            )
          `)
          .eq('product_id', productId);

        if (error) throw error;

        // For each phase, fetch budget items to get actual costs vs budgets
        const phasesWithBudgets = await Promise.all(
          (phaseData || []).map(async (phase) => {
            try {
              // Get budget items for this phase
              const { data: budgetItems, error: budgetError } = await supabase
                .from('phase_budget_items')
                .select('cost, actual_cost, category')
                .eq('phase_id', phase.id);

              if (budgetError) {
                console.error('Error fetching budget items for phase:', phase.name, budgetError);
                return {
                  id: phase.id,
                  name: phase.name || phase.company_phases?.name || 'Unnamed Phase',
                  estimated_budget: phase.estimated_budget || phase.company_phases?.estimated_budget || 0,
                  likelihood_of_success: phase.likelihood_of_success || 100,
                  duration_days: phase.company_phases?.duration_days || 30,
                  position: phase.company_phases?.position || 0,
                  start_date: phase.start_date,
                  end_date: phase.end_date,
                  status: phase.status || 'not_started'
                };
              }

              // Calculate total cost: use actual_cost if available, otherwise use budget cost
              const totalCost = (budgetItems || []).reduce((sum, item) => {
                const effectiveCost = item.actual_cost !== null && item.actual_cost !== undefined 
                  ? item.actual_cost 
                  : item.cost;
                return sum + effectiveCost;
              }, 0);

              console.log(`[CoreProjectConfig] Phase "${phase.name}": ${budgetItems?.length || 0} budget items, total cost: $${totalCost}`);

              return {
                id: phase.id,
                name: phase.name || phase.company_phases?.name || 'Unnamed Phase',
                estimated_budget: totalCost > 0 ? totalCost : (phase.estimated_budget || phase.company_phases?.estimated_budget || 0),
                likelihood_of_success: phase.likelihood_of_success || 100,
                duration_days: phase.company_phases?.duration_days || 30,
                position: phase.company_phases?.position || 0,
                start_date: phase.start_date,
                end_date: phase.end_date,
                status: phase.status || 'not_started'
              };
            } catch (error) {
              console.error('Error processing phase budget:', phase.name, error);
              return {
                id: phase.id,
                name: phase.name || phase.company_phases?.name || 'Unnamed Phase',
                estimated_budget: phase.estimated_budget || phase.company_phases?.estimated_budget || 0,
                likelihood_of_success: phase.likelihood_of_success || 100,
                duration_days: phase.company_phases?.duration_days || 30,
                position: phase.company_phases?.position || 0,
                start_date: phase.start_date,
                end_date: phase.end_date,
                status: phase.status || 'not_started'
              };
            }
          })
        );

        setExistingPhases(phasesWithBudgets.sort((a, b) => a.position - b.position));
        
        // ONLY use real phases from the project - NO synthetic phases
        console.log('[CoreProjectConfig] Found real phases:', phasesWithBudgets.map(p => `${p.name}: $${p.estimated_budget}`));
        
        // Always replace with real phases from the project
        const realDevelopmentPhases = phasesWithBudgets.map((phase, index) => ({
          id: phase.id,
          name: phase.name,
          description: `Real project phase: ${phase.name}`,
          likelihoodOfSuccess: phase.likelihood_of_success,
          duration: Math.max(1, Math.ceil(phase.duration_days / 30)),
          costs: phase.estimated_budget,
          startMonth: index * 2, // Space phases 2 months apart
          dependencies: [],
          isMarketAgnostic: true,
          isContinuous: phase.name.toLowerCase().includes('continuous') || 
                       phase.name.toLowerCase().includes('risk management') ||
                       phase.name.toLowerCase().includes('post-market surveillance') ||
                       phase.name.toLowerCase().includes('supplier management') ||
                       phase.name.toLowerCase().includes('technical documentation'),
          preLaunchCosts: phase.estimated_budget * (phase.name.toLowerCase().includes('risk management') ? 0.6 : 
                         phase.name.toLowerCase().includes('post-market surveillance') ? 0.2 : 1.0),
          postLaunchCosts: phase.estimated_budget * (phase.name.toLowerCase().includes('risk management') ? 0.4 : 
                          phase.name.toLowerCase().includes('post-market surveillance') ? 0.8 : 0.0),
          recurringCostFrequency: (phase.name.toLowerCase().includes('continuous') || 
                                  phase.name.toLowerCase().includes('risk management') ||
                                  phase.name.toLowerCase().includes('post-market surveillance') ||
                                  phase.name.toLowerCase().includes('supplier management') ||
                                  phase.name.toLowerCase().includes('technical documentation')) ? 'yearly' as const : undefined
        }));

        console.log('[CoreProjectConfig] Real development phases for rNPV:', realDevelopmentPhases.map(p => `${p.name}: $${p.costs}, continuous: ${p.isContinuous}`));

        updateConfiguration({
          projectName: product?.name || configuration.projectName || "Core Development Project",
          developmentPhases: realDevelopmentPhases,
          totalInvestment: realDevelopmentPhases.reduce((sum, p) => sum + p.costs, 0)
        });
        
      } catch (error) {
        console.error('Error fetching existing phases:', error);
        toast({
          title: "Error",
          description: "Failed to load existing phases",
          variant: "destructive"
        });
      } finally {
        setIsLoadingPhases(false);
      }
    };

    fetchExistingPhases();
    
    // Set up interval to check for budget updates every 5 seconds when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchExistingPhases();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [companyId, productId, toast]);

  const updatePhase = (phaseId: string, updates: Partial<DevelopmentPhase>) => {
    const updatedPhases = configuration.developmentPhases.map(phase =>
      phase.id === phaseId ? { ...phase, ...updates } : phase
    );
    updateConfiguration({ developmentPhases: updatedPhases });
  };

  const addManualPhase = () => {
    const newPhase: DevelopmentPhase = {
      id: `phase_${Date.now()}`,
      name: 'New Development Phase',
      description: '',
      likelihoodOfSuccess: 80,
      duration: 6,
      costs: 0,
      startMonth: configuration.developmentPhases.length * 6,
      dependencies: [],
      isMarketAgnostic: true
    };

    updateConfiguration({
      developmentPhases: [...configuration.developmentPhases, newPhase]
    });
    setEditingPhase(newPhase.id);
  };

  const removePhase = (phaseId: string) => {
    const updatedPhases = configuration.developmentPhases.filter(phase => phase.id !== phaseId);
    updateConfiguration({ developmentPhases: updatedPhases });
  };

  const totalProjectCost = configuration.developmentPhases.reduce((sum, phase) => sum + phase.costs, 0);
  console.log('[CoreProjectConfig] Current development phases for UI:', configuration.developmentPhases.map(p => `${p.name}: $${p.costs}`));
  console.log('[CoreProjectConfig] Total project cost:', totalProjectCost);
  // Calculate actual project duration from start to launch date
  const totalDuration = useMemo(() => {
    if (projectDates.projectStartDate && projectDates.expectedLaunchDate) {
      const timeDiff = projectDates.expectedLaunchDate.getTime() - projectDates.projectStartDate.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff / 30.44; // Convert to months (average month length)
    }
    // Fallback to development phases if dates not available
    return Math.max(...configuration.developmentPhases.map(phase => phase.startMonth + phase.duration));
  }, [projectDates.projectStartDate, projectDates.expectedLaunchDate, configuration.developmentPhases]);
  const averageLoS = configuration.developmentPhases.reduce((sum, phase) => sum + phase.likelihoodOfSuccess, 0) / configuration.developmentPhases.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Core Project Configuration
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure market-agnostic development phases and project parameters
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              ${totalProjectCost >= 1000000 ? (totalProjectCost / 1000000).toFixed(1) + 'M' : totalProjectCost >= 1000 ? (totalProjectCost / 1000).toFixed(0) + 'K' : totalProjectCost.toFixed(0)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.round(totalDuration)} months
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {averageLoS.toFixed(0)}% avg LoS
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="phases">Development Phases</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input
                    value={configuration.projectName}
                    onChange={(e) => updateConfiguration({ projectName: e.target.value })}
                    placeholder={product?.name || "Core Development Project"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Base Currency</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {configuration.currency} - {
                      configuration.currency === 'USD' ? 'US Dollar' :
                      configuration.currency === 'EUR' ? 'Euro' :
                      configuration.currency === 'GBP' ? 'British Pound' :
                      configuration.currency === 'JPY' ? 'Japanese Yen' :
                      configuration.currency
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currency is set at company level and used for all rNPV calculations
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Discount Rate</Label>
                    <Badge variant="outline" className="font-mono">
                      {(configuration.discountRate * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Slider
                      value={[configuration.discountRate * 100]}
                      onValueChange={([value]) => updateConfiguration({ discountRate: value / 100 })}
                      max={20}
                      min={5}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5%</span>
                      <span>20%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="border-dashed">
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <BarChart className="h-8 w-8 mx-auto text-primary" />
                      <h4 className="font-medium">Project Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Investment</div>
                          <div className="font-semibold">${totalProjectCost >= 1000000 ? (totalProjectCost / 1000000).toFixed(1) + 'M' : totalProjectCost >= 1000 ? (totalProjectCost / 1000).toFixed(0) + 'K' : totalProjectCost.toFixed(0)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Development Time</div>
                          <div className="font-semibold">{Math.round(totalDuration)} months</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Phases</div>
                          <div className="font-semibold">{configuration.developmentPhases.length}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Risk Level</div>
                          <div className="font-semibold">
                            {averageLoS > 80 ? 'Low' : averageLoS > 60 ? 'Medium' : 'High'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {configuration.developmentPhases.length === 0 && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">No development phases configured</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Add development phases to enable rNPV calculations
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Development Phases</h3>
              <div className="flex gap-2">
                <Button onClick={addManualPhase} variant="outline" size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Phase
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  title="Sync latest budget data from milestones"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync Budget
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {configuration.developmentPhases.map((phase, index) => (
                <Card key={phase.id} className={editingPhase === phase.id ? 'ring-2 ring-primary' : ''}>
                  <CardContent className="pt-4">
                    {editingPhase === phase.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Phase Name</Label>
                            <Input
                              value={phase.name}
                              onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Duration (months)</Label>
                            <Input
                              type="number"
                              value={phase.duration}
                              onChange={(e) => updatePhase(phase.id, { duration: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Costs ({configuration.currency})</Label>
                            <Input
                              type="number"
                              value={phase.costs}
                              onChange={(e) => updatePhase(phase.id, { costs: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Likelihood of Success (%)</Label>
                            <div className="space-y-2">
                              <Slider
                                value={[phase.likelihoodOfSuccess]}
                                onValueChange={([value]) => updatePhase(phase.id, { likelihoodOfSuccess: value })}
                                max={100}
                                min={0}
                                step={5}
                              />
                              <div className="text-center text-sm font-medium">
                                {phase.likelihoodOfSuccess}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={phase.description}
                            onChange={(e) => updatePhase(phase.id, { description: e.target.value })}
                            placeholder="Describe this development phase..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditingPhase(null)}>
                            Done
                          </Button>
                          <Button variant="destructive" onClick={() => removePhase(phase.id)}>
                            Remove Phase
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge>{index + 1}</Badge>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{phase.name}</h4>
                              {(phase.isContinuous || phase.name.toLowerCase().includes('risk management') || 
                                phase.name.toLowerCase().includes('post-market surveillance')) && (
                                <Badge variant="secondary" className="text-xs">Continuous</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{phase.duration} months</span>
                              <span>${phase.costs >= 1000000 ? (phase.costs / 1000000).toFixed(1) + 'M' : phase.costs >= 1000 ? (phase.costs / 1000).toFixed(0) + 'K' : phase.costs.toFixed(0)}</span>
                              <span>{phase.likelihoodOfSuccess}% LoS</span>
                              {(phase.name.toLowerCase().includes('risk management') || 
                                phase.name.toLowerCase().includes('post-market surveillance') ||
                                phase.name.toLowerCase().includes('continuous')) && (
                                <span className="text-orange-600">Pre & Post Launch</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPhase(phase.id)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Project Timeline</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Project Start Date</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {projectDates.projectStartDate 
                      ? projectDates.projectStartDate.toLocaleDateString()
                      : 'Not set in milestones'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatically calculated from your earliest phase start date in Milestones
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Expected Launch Date</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {projectDates.expectedLaunchDate 
                      ? projectDates.expectedLaunchDate.toLocaleDateString()
                      : 'Not set in milestones'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>This date marks the transition from development costs to revenue generation in rNPV calculations.</strong> Set in your product details or calculated from your latest phase end date.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Post-Launch Analysis (months)</Label>
                    <HelpTooltip content="This defines how many months after product launch to analyze for rNPV calculations. It determines the time period for evaluating post-launch revenue streams, ongoing costs, and market performance. A longer period provides more comprehensive analysis but may reduce accuracy of distant projections. Typically set between 36-120 months depending on product lifecycle and market dynamics." />
                  </div>
                  <Input
                    type="number"
                    value={configuration.projectTimeline.postLaunchAnalysisPeriodMonths}
                    onChange={(e) => updateConfiguration({
                      projectTimeline: {
                        ...configuration.projectTimeline,
                        postLaunchAnalysisPeriodMonths: parseInt(e.target.value) || 60
                      }
                    })}
                  />
                </div>
              </div>

              {/* Real Project Timeline from Phases */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeline View for rNPV Analysis
                  </CardTitle>
                  <CardDescription>
                    Read-only timeline showing phases used in financial calculations. The expected launch date marks the end of development costs and beginning of revenue generation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {existingPhases.length > 0 ? (
                      <EnhancedGanttChart
                        phases={existingPhases.map(phase => ({
                          id: phase.id,
                          name: phase.name,
                          startDate: phase.start_date ? new Date(phase.start_date) : new Date(),
                          endDate: phase.end_date ? new Date(phase.end_date) : new Date(Date.now() + (phase.duration_days * 24 * 60 * 60 * 1000)),
                          status: phase.status,
                          isCurrentPhase: false,
                          isOverdue: false,
                          position: phase.position,
                          typical_start_day: 0,
                          typical_duration_days: phase.duration_days,
                          is_pre_launch: true
                        }))}
                        product={{ 
                          id: productId, 
                          company_id: companyId,
                          projected_launch_date: product?.projected_launch_date || projectDates.expectedLaunchDate
                        }}
                        companyId={companyId}
                        projectedLaunchDate={product?.projected_launch_date ? new Date(product.projected_launch_date) : projectDates.expectedLaunchDate}
                        hideHeader={true}
                        readOnly={true}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No phases found. Set up your project phases in the Milestones section.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financials" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Financial Overview</h3>
              </div>
              
              {/* Core Project rNPV Pre-Calculation Summary */}
              <CoreProjectRNPVSummary 
                configuration={configuration}
                productId={productId}
                companyId={companyId}
              />

              
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {configuration.developmentPhases.map((phase) => (
                      <div key={phase.id} className="flex items-center justify-between">
                        <span className="font-medium">{phase.name}</span>
                        <span className="font-medium">${phase.costs >= 1000000 ? (phase.costs / 1000000).toFixed(1) + 'M' : phase.costs >= 1000 ? (phase.costs / 1000).toFixed(0) + 'K' : phase.costs.toFixed(0)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>${totalProjectCost >= 1000000 ? (totalProjectCost / 1000000).toFixed(1) + 'M' : totalProjectCost >= 1000 ? (totalProjectCost / 1000).toFixed(0) + 'K' : totalProjectCost.toFixed(0)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {configuration.developmentPhases.map((phase) => (
                      <div key={phase.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{phase.name}</span>
                          <span className="text-sm">{phase.likelihoodOfSuccess}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${phase.likelihoodOfSuccess}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
