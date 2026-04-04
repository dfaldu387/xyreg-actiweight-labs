import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Plus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useHighLevelRisks, type HighLevelRisk } from '@/hooks/useHighLevelRisks';
import { useAuth } from '@/context/AuthContext';
import { RISK_CATEGORIES, getRiskLevelColor } from '@/constants/highLevelRiskOptions';
import { HighLevelRiskCard } from './HighLevelRiskCard';
import { AddHighLevelRiskDialog } from './AddHighLevelRiskDialog';
import { EditHighLevelRiskDialog } from './EditHighLevelRiskDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HighLevelRiskAssessmentProps {
  productId: string;
  companyId?: string;
  isInGenesisFlow?: boolean;
  isStepComplete?: boolean;
}

export function HighLevelRiskAssessment({ productId, companyId: propCompanyId, isInGenesisFlow = false, isStepComplete = false }: HighLevelRiskAssessmentProps) {
  const { user } = useAuth();
  const companyId = propCompanyId || user?.user_metadata?.activeCompany || '';
  
  const {
    risks,
    risksByCategory,
    summary,
    isLoading,
    createRisk,
    updateRisk,
    deleteRisk,
    updateStatus,
    isCreating,
    isUpdating,
    isDeleting,
  } = useHighLevelRisks(productId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<HighLevelRisk | null>(null);
  const [deletingRiskId, setDeletingRiskId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Clinical: true,
    Technical: true,
    Regulatory: true,
    Commercial: true,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleEditRisk = (risk: HighLevelRisk) => {
    setEditingRisk(risk);
  };

  const handleDeleteConfirm = () => {
    if (deletingRiskId) {
      deleteRisk(deletingRiskId);
      setDeletingRiskId(null);
    }
  };

  const mitigationRate = summary.total > 0 
    ? Math.round((summary.mitigated / summary.total) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Border logic: green if this tab has data, yellow if neither tab has data, no border if only other tab has data
  const hasOwnData = summary.total > 0;
  const getBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (hasOwnData) return 'border-2 border-emerald-500 bg-emerald-50/30';
    if (!isStepComplete) return 'border-2 border-amber-400 bg-amber-50/30'; // Neither tab has data
    return ''; // Other tab has data, no border here
  };

  if (summary.total === 0) {
    return (
      <>
        <Card className={`bg-card border ${getBorderClass()}`}>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">No High-Level Risks Identified</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Start by identifying potential business-level risks across Clinical, Technical, Regulatory, and Commercial categories.
                </p>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add First Risk
              </Button>
            </div>
          </CardContent>
        </Card>

        <AddHighLevelRiskDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={(input) => {
            createRisk(input, {
              onSuccess: () => setIsAddDialogOpen(false),
            });
          }}
          productId={productId}
          companyId={companyId}
          isLoading={isCreating}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className={`bg-card ${getBorderClass()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              High-Level Risk Assessment
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {summary.total} {summary.total === 1 ? 'Risk' : 'Risks'}
              </Badge>
              <Badge
                variant="secondary"
                className={mitigationRate >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  mitigationRate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
              >
                {mitigationRate}% Mitigated
              </Badge>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Risk
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Status Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">Mitigated</span>
              </div>
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">{summary.mitigated}</div>
            </div>
            <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">In Progress</span>
              </div>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{summary.inProgress}</div>
            </div>
            <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">Open</span>
              </div>
              <div className="text-3xl font-bold text-red-700 dark:text-red-400">{summary.open}</div>
            </div>
          </div>

          {/* Category Breakdown Mini Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RISK_CATEGORIES.map((category) => {
              const categoryRisks = risksByCategory[category] || [];
              const mitigated = categoryRisks.filter(r => r.status === 'Mitigated').length;
              const inProgress = categoryRisks.filter(r => r.status === 'In Progress').length;
              const open = categoryRisks.filter(r => r.status === 'Open').length;

              return (
                <div key={category} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-sm">{category}</span>
                    {categoryRisks.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {categoryRisks.length}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mitigated > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {mitigated}
                      </span>
                    )}
                    {inProgress > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        {inProgress}
                      </span>
                    )}
                    {open > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3" />
                        {open}
                      </span>
                    )}
                    {categoryRisks.length === 0 && (
                      <span className="text-xs text-muted-foreground">No risks</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Risk Lists by Category */}
      {RISK_CATEGORIES.map((category) => {
        const categoryRisks = risksByCategory[category] || [];
        if (categoryRisks.length === 0) return null;

        return (
          <Card key={category} className="bg-card">
            <Collapsible
              open={expandedCategories[category]}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {expandedCategories[category] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      {category} Risks
                      <Badge variant="outline" className="ml-2">
                        {categoryRisks.length}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {categoryRisks.some(r => r.risk_level === 'Critical') && (
                        <Badge className={getRiskLevelColor('Critical')}>
                          {categoryRisks.filter(r => r.risk_level === 'Critical').length} Critical
                        </Badge>
                      )}
                      {categoryRisks.some(r => r.risk_level === 'High') && (
                        <Badge className={getRiskLevelColor('High')}>
                          {categoryRisks.filter(r => r.risk_level === 'High').length} High
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {categoryRisks.map((risk) => (
                      <HighLevelRiskCard
                        key={risk.id}
                        risk={risk}
                        onEdit={handleEditRisk}
                        onDelete={setDeletingRiskId}
                        onStatusChange={updateStatus}
                      />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Add Dialog */}
      <AddHighLevelRiskDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(input) => {
          createRisk(input, {
            onSuccess: () => setIsAddDialogOpen(false),
          });
        }}
        productId={productId}
        companyId={companyId}
        isLoading={isCreating}
      />

      {/* Edit Dialog */}
      <EditHighLevelRiskDialog
        open={!!editingRisk}
        onOpenChange={(open) => !open && setEditingRisk(null)}
        onSubmit={(input) => {
          updateRisk(input, {
            onSuccess: () => setEditingRisk(null),
          });
        }}
        risk={editingRisk}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRiskId} onOpenChange={(open) => !open && setDeletingRiskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Risk?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this risk. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
