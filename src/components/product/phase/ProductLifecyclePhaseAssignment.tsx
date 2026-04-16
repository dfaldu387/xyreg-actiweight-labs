import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, Clock, Target, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface ProductLifecyclePhaseAssignmentProps {
  productId: string;
  companyId: string;
  currentPhase?: {
    id: string;
    name: string;
    position?: number;
  };
  onPhaseChange?: () => void;
  className?: string;
}

interface CompanyPhase {
  id: string;
  name: string;
  description?: string;
  position: number;
  
  duration_days?: number;
  estimated_budget?: number;
  budget_currency?: string;
}

interface LifecyclePhaseRecord {
  id: string;
  product_id: string;
  phase_id: string;
  is_current_phase: boolean | null;
  start_date?: string | null;
  end_date?: string | null;
  inserted_at: string;
  updated_at: string;
  progress?: number | null;
  name: string;
}

export function ProductLifecyclePhaseAssignment({
  productId,
  companyId,
  currentPhase,
  onPhaseChange,
  className
}: ProductLifecyclePhaseAssignmentProps) {
  const [availablePhases, setAvailablePhases] = useState<CompanyPhase[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [phaseHistory, setPhaseHistory] = useState<LifecyclePhaseRecord[]>([]);

  // Fetch available phases for the company
  useEffect(() => {
    const fetchAvailablePhases = async () => {
      if (!companyId) return;

      try {
        const { data, error } = await supabase
          .from('company_chosen_phases')
          .select(`
            position,
            company_phases!inner(
              id,
              name,
              description,
              position,
              
              duration_days,
              estimated_budget,
              budget_currency
            )
          `)
          .eq('company_id', companyId)
          .order('position');

        if (error) {
          console.error('Error fetching company phases:', error);
          return;
        }

        const phases = data?.map(item => {
          const companyPhase = item.company_phases as { id: string; name: string; description?: string; category_id?: string } | null;
          if (!companyPhase) return null;
          return {
            ...companyPhase,
            position: item.position
          };
        }).filter(Boolean) as CompanyPhase[] || [];

        setAvailablePhases(phases);
      } catch (error) {
        console.error('Error in fetchAvailablePhases:', error);
      }
    };

    fetchAvailablePhases();
  }, [companyId]);

  // Fetch phase history for the product
  useEffect(() => {
    const fetchPhaseHistory = async () => {
      if (!productId) return;

      try {
        const { data, error } = await supabase
          .from('lifecycle_phases')
          .select(`
            id,
            product_id,
            phase_id,
            is_current_phase,
            start_date,
            end_date,
            inserted_at,
            updated_at,
            progress,
            name,
            company_phases!inner(name, position)
          `)
          .eq('product_id', productId)
          .order('inserted_at', { ascending: false });

        if (error) {
          console.error('Error fetching phase history:', error);
          return;
        }

        setPhaseHistory(data || []);
      } catch (error) {
        console.error('Error in fetchPhaseHistory:', error);
      }
    };

    fetchPhaseHistory();
  }, [productId]);

  const handlePhaseChange = async () => {
    if (!selectedPhaseId || !productId) {
      toast.error('Please select a phase');
      return;
    }

    setIsLoading(true);

    try {
      // First, mark all current phases as non-current
      const { error: clearError } = await supabase
        .from('lifecycle_phases')
        .update({ is_current_phase: false })
        .eq('product_id', productId);

      if (clearError) {
        console.error('Error clearing current phases:', clearError);
        throw clearError;
      }

      // Check if this phase already exists for this product
      const { data: existingPhase, error: checkError } = await supabase
        .from('lifecycle_phases')
        .select('id')
        .eq('product_id', productId)
        .eq('phase_id', selectedPhaseId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing phase:', checkError);
        throw checkError;
      }

      if (existingPhase) {
        // Update existing phase record
        const { error: updateError } = await supabase
          .from('lifecycle_phases')
          .update({ 
            is_current_phase: true,
            start_date: new Date().toISOString().split('T')[0] // Date only
          })
          .eq('id', existingPhase.id);

        if (updateError) {
          console.error('Error updating existing phase:', updateError);
          throw updateError;
        }
      } else {
        // Get the selected phase info before creating the record
        const selectedPhase = availablePhases.find(p => p.id === selectedPhaseId);
        
        // Create new phase record
        const { error: insertError } = await supabase
          .from('lifecycle_phases')
          .insert({
            product_id: productId,
            phase_id: selectedPhaseId,
            is_current_phase: true,
            start_date: new Date().toISOString().split('T')[0],
            progress: 0,
            name: selectedPhase?.name || 'Unknown Phase',
            status: 'active',
            likelihood_of_approval: 0.5
          } as any);

        if (insertError) {
          console.error('Error inserting new phase:', insertError);
          throw insertError;
        }
      }

      const selectedPhase = availablePhases.find(p => p.id === selectedPhaseId);
      toast.success(`Product moved to ${selectedPhase?.name}`);
      
      setIsDialogOpen(false);
      setSelectedPhaseId('');
      onPhaseChange?.();
      
      // Refresh phase history
      const { data, error } = await supabase
        .from('lifecycle_phases')
        .select(`
          id,
          product_id,
          phase_id,
          is_current_phase,
          start_date,
          end_date,
          inserted_at,
          updated_at,
          progress,
          name,
          company_phases!inner(name, position)
        `)
        .eq('product_id', productId)
        .order('inserted_at', { ascending: false });

      if (!error) {
        setPhaseHistory(data || []);
      }

    } catch (error) {
      console.error('Error changing phase:', error);
      toast.error('Failed to change phase');
    } finally {
      setIsLoading(false);
    }
  };

  const getPhaseStatusIcon = (phase: LifecyclePhaseRecord) => {
    if (phase.is_current_phase) {
      return <Clock className="h-4 w-4 text-blue-600" />;
    }
    if (phase.end_date) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    return <Target className="h-4 w-4 text-gray-400" />;
  };

  const getPhaseStatusBadge = (phase: LifecyclePhaseRecord) => {
    if (phase.is_current_phase) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Current</Badge>;
    }
    if (phase.end_date) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    }
    return <Badge variant="outline" className="text-gray-600">Previous</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Lifecycle Phase Assignment
            </CardTitle>
            <CardDescription>
              Manage the product's development stage and track phase progress
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Change Phase
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Lifecycle Phase</DialogTitle>
                <DialogDescription>
                  Select a new development stage for this product
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phase-select">Select Phase</Label>
                  <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
                    <SelectTrigger id="phase-select">
                      <SelectValue placeholder="Choose a phase..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePhases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{phase.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedPhaseId && (
                  <div className="p-3 bg-muted rounded-lg">
                    {(() => {
                      const selectedPhase = availablePhases.find(p => p.id === selectedPhaseId);
                      return selectedPhase ? (
                        <div className="space-y-2">
                          <h4 className="font-medium">{selectedPhase.name}</h4>
                          {selectedPhase.description && (
                            <p className="text-sm text-muted-foreground">
                              {selectedPhase.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {selectedPhase.duration_days && (
                              <span>Duration: ~{selectedPhase.duration_days} days</span>
                            )}
                            {selectedPhase.estimated_budget && (
                              <span>
                                Budget: {selectedPhase.budget_currency || 'USD'} {selectedPhase.estimated_budget}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePhaseChange}
                  disabled={!selectedPhaseId || isLoading}
                >
                  {isLoading ? 'Assigning...' : 'Assign Phase'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Phase Display */}
        {currentPhase ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Current Phase</h3>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                Active
              </Badge>
            </div>
            <div className="p-4 border rounded-lg bg-blue-50/50">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">{currentPhase.name}</h4>
                  <p className="text-sm text-blue-700">
                    Phase position: {currentPhase.position || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
            <h3 className="font-medium text-muted-foreground">No Phase Assigned</h3>
            <p className="text-sm text-muted-foreground">
              This product hasn't been assigned to a lifecycle phase yet
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}