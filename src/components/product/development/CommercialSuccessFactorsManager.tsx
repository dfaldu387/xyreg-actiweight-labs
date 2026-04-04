import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { LikelihoodOfApprovalSlider } from '@/components/product/timeline/LikelihoodOfApprovalSlider';
import { 
  CommercialSuccessFactorService, 
  CommercialSuccessFactor, 
  CommercialFactorCategory,
  CommercialRiskCalculation 
} from '@/services/commercialSuccessFactorService';
import { useToast } from '@/hooks/use-toast';

interface CommercialSuccessFactorsManagerProps {
  productId: string;
  companyId: string;
  markets?: string[];
  onRiskCalculationChange?: (calculation: CommercialRiskCalculation) => void;
  onFactorsChange?: (factors: CommercialSuccessFactor[], combinedLoA: number) => void;
}

export const CommercialSuccessFactorsManager: React.FC<CommercialSuccessFactorsManagerProps> = ({
  productId,
  companyId,
  markets = [],
  onRiskCalculationChange,
  onFactorsChange
}) => {
  const [factors, setFactors] = useState<CommercialSuccessFactor[]>([]);
  const [categories, setCategories] = useState<CommercialFactorCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFactor, setNewFactor] = useState<Partial<CommercialSuccessFactor>>({
    name: '',
    description: '',
    likelihood_of_success: 75,
    market_codes: markets,
    is_active: true
  });
  const [riskCalculation, setRiskCalculation] = useState<CommercialRiskCalculation | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [productId]);

  useEffect(() => {
    // Calculate risk whenever factors change
    if (factors.length > 0) {
      const calculation = CommercialSuccessFactorService.calculateCombinedCommercialLoS(factors);
      setRiskCalculation(calculation);
      onRiskCalculationChange?.(calculation);
      onFactorsChange?.(factors, calculation.combinedCommercialLoS);
    }
  }, [factors, onRiskCalculationChange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [factorsData, categoriesData] = await Promise.all([
        CommercialSuccessFactorService.getCommercialFactors(productId),
        CommercialSuccessFactorService.getCommercialFactorCategories()
      ]);
      
      setFactors(factorsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading commercial factors:', error);
      toast({
        title: "Error",
        description: "Failed to load commercial success factors",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFactor = async () => {
    try {
      if (!newFactor.name) {
        toast({
          title: "Error",
          description: "Factor name is required",
          variant: "destructive"
        });
        return;
      }

      const savedFactor = await CommercialSuccessFactorService.saveCommercialFactor({
        ...newFactor,
        product_id: productId,
        company_id: companyId,
        position: factors.length
      });

      setFactors(prev => [...prev, savedFactor]);
      setNewFactor({
        name: '',
        description: '',
        likelihood_of_success: 75,
        market_codes: markets,
        is_active: true
      });
      setShowAddForm(false);
      
      toast({
        title: "Success",
        description: "Commercial success factor added",
      });
    } catch (error) {
      console.error('Error adding factor:', error);
      toast({
        title: "Error",
        description: "Failed to add commercial success factor",
        variant: "destructive"
      });
    }
  };

  const handleUpdateFactor = async (factorId: string, updates: Partial<CommercialSuccessFactor>) => {
    try {
      const factor = factors.find(f => f.id === factorId);
      if (!factor) return;

      await CommercialSuccessFactorService.saveCommercialFactor({
        ...factor,
        ...updates
      });

      setFactors(prev => prev.map(f => 
        f.id === factorId ? { ...f, ...updates } : f
      ));
    } catch (error) {
      console.error('Error updating factor:', error);
      toast({
        title: "Error",
        description: "Failed to update factor",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFactor = async (factorId: string) => {
    try {
      await CommercialSuccessFactorService.deleteCommercialFactor(factorId);
      setFactors(prev => prev.filter(f => f.id !== factorId));
      
      toast({
        title: "Success",
        description: "Commercial success factor deleted",
      });
    } catch (error) {
      console.error('Error deleting factor:', error);
      toast({
        title: "Error",
        description: "Failed to delete factor",
        variant: "destructive"
      });
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'very_high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'very_high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commercial Success Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Summary Card */}
      {riskCalculation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Commercial Risk Assessment
            </CardTitle>
            <CardDescription>
              Overall likelihood of commercial success based on defined factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-primary">
                  {riskCalculation.combinedCommercialLoS.toFixed(1)}%
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getRiskLevelColor(riskCalculation.riskLevel)}`}>
                  {getRiskIcon(riskCalculation.riskLevel)}
                  <span className="font-medium capitalize">
                    {riskCalculation.riskLevel.replace('_', ' ')} Risk
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Based on {riskCalculation.individualFactors.length} active factors
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Factors Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Commercial Success Factors</CardTitle>
          <CardDescription>
            Define and manage post-regulatory approval hurdles that affect commercial success
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Factor Button */}
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Commercial Success Factor
            </Button>
          )}

          {/* Add Factor Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Factor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Factor Name</label>
                  <Input
                    value={newFactor.name || ''}
                    onChange={(e) => setNewFactor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Reimbursement Code Approval"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={newFactor.category_id || ''}
                    onValueChange={(value) => {
                      const category = categories.find(c => c.id === value);
                      setNewFactor(prev => ({ 
                        ...prev, 
                        category_id: value,
                        name: category?.name || prev.name,
                        description: category?.description || prev.description
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newFactor.description || ''}
                    onChange={(e) => setNewFactor(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this commercial success factor..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Likelihood of Success (%)</label>
                  <LikelihoodOfApprovalSlider
                    likelihood={newFactor.likelihood_of_success || 75}
                    onUpdate={(value) => setNewFactor(prev => ({ ...prev, likelihood_of_success: value }))}
                    editable={true}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddFactor}>Add Factor</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Factors List */}
          {factors.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <h3 className="font-medium">Current Factors</h3>
              
              {factors.map((factor, index) => (
                <Card key={factor.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 pt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{factor.name}</h4>
                          {factor.description && (
                            <p className="text-sm text-muted-foreground">{factor.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFactor(factor.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4">
                      <div className="flex-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Likelihood of Success
                          </label>
                          <LikelihoodOfApprovalSlider
                            likelihood={factor.likelihood_of_success}
                            onUpdate={(value) => handleUpdateFactor(factor.id, { likelihood_of_success: value })}
                            editable={true}
                            size="sm"
                          />
                        </div>
                        
                        {factor.estimated_timeline_months && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {factor.estimated_timeline_months}mo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {factors.length === 0 && !showAddForm && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No commercial success factors defined yet.</p>
              <p className="text-sm">Add factors to assess commercial risk post-regulatory approval.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
