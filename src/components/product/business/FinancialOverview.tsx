import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DevelopmentPhase } from "@/services/enhanced-rnpv/interfaces";
import { formatCurrency } from "@/utils/marketCurrencyUtils";
import { Calendar, TrendingDown, DollarSign, Activity, Edit, AlertCircle, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FinancialOverviewProps {
  developmentPhases: DevelopmentPhase[];
  cumulativeTechnicalLoA: number;
  totalInvestment: number;
  launchDate: Date | null;
  currency: string;
  productId: string;
  companyName: string;
}

export function FinancialOverview({
  developmentPhases,
  cumulativeTechnicalLoA,
  totalInvestment,
  launchDate,
  currency,
  productId,
  companyName
}: FinancialOverviewProps) {
  const coreRNPV = -totalInvestment;
  const successRate = cumulativeTechnicalLoA;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    launchDate ? new Date(launchDate) : undefined
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleEditBudgets = () => {
    navigate(`/app/company/${encodeURIComponent(companyName)}/milestones`);
  };

  const handleSaveLaunchDate = async () => {
    if (!selectedDate) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ projected_launch_date: selectedDate.toISOString().split('T')[0] })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Launch date saved",
        description: "Financial calculations will now use the projected launch date.",
      });

      // Reload the page to recalculate budgets
      window.location.reload();
    } catch (error) {
      console.error('Error saving launch date:', error);
      toast({
        title: "Error",
        description: "Failed to save launch date. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // If no launch date is set, show mandatory date picker
  if (!launchDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview - Launch Date Required</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Launch date required for financial calculations</p>
                  <p className="text-sm">
                    Pre-launch investment analysis requires a projected launch date to determine which development costs occur before market entry. 
                    This ensures accurate budget allocation and NPV calculations.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Set Projected Launch Date</label>
                  <div className="flex gap-2 items-start flex-wrap">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          className="pointer-events-auto"
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button 
                      onClick={handleSaveLaunchDate} 
                      disabled={!selectedDate || isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Launch Date"}
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <div className="flex items-center gap-2 w-full">
          <Edit className="h-4 w-4" />

          <AlertDescription className="flex items-center justify-between w-full">
            <span>
              Budget data is managed in the Milestones page. Edit phase budgets there to update these values.
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleEditBudgets}
              className="ml-4"
            >
              <Edit className="h-3 w-3 mr-2" />
              Edit Budgets
            </Button>
          </AlertDescription>
        </div>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Core Project rNPV Pre-Calculation</CardTitle>
              <CardDescription>
                Risk-adjusted investment analysis for development phase only. This shows the expected cost of bringing the product to market, adjusted for likelihood of technical success.
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                <Calendar className="inline h-3 w-3 mr-1" />
                Projected Launch: <span className="font-semibold">{format(new Date(launchDate), "PPP")}</span>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Core rNPV (Investment Only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  <span className="text-2xl font-bold text-destructive">
                    {formatCurrency(coreRNPV, currency)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Total Investment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {formatCurrency(totalInvestment, currency)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Success Rate (Technical LoA)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-success" />
                  <span className="text-2xl font-bold text-success">
                    {successRate.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Method and Launch Date */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="text-sm font-semibold mb-2">Calculation Method</h4>
              <p className="text-sm text-muted-foreground">
                Phase-gated rNPV using cumulative likelihood of success across all development phases. 
                This represents the risk-adjusted investment required before any revenue is generated.
              </p>
            </div>
            {launchDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expected Launch:</span>
                <span className="font-medium">{launchDate.toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Breakdown by Phase</CardTitle>
                <CardDescription>Nominal development costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {developmentPhases.map((phase) => (
                    <div key={phase.id} className="flex justify-between items-center pb-2 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{phase.name}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(phase.preLaunchCosts || 0, currency)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-border">
                    <span className="text-sm font-bold">Total</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(totalInvestment, currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Analysis by Phase</CardTitle>
                <CardDescription>Likelihood of success for each phase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {developmentPhases.map((phase) => (
                    <div key={phase.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{phase.name}</span>
                        <span className="text-sm font-semibold">
                          {phase.likelihoodOfSuccess}%
                        </span>
                      </div>
                      <Progress 
                        value={phase.likelihoodOfSuccess}
                        className="h-2"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold">Cumulative Success Rate</span>
                      <span className="text-sm font-bold text-success">
                        {successRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={successRate} 
                      className="h-3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
