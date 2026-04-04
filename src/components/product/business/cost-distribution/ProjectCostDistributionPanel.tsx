 import React, { useState, useCallback, useMemo, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { CostTypeTable } from './CostTypeTable';
 import { MonthlyDistributionEditor } from './MonthlyDistributionEditor';
 import type { 
   CostDistributionEntry, 
   CostDistributionOutput, 
   PhaseOption,
   CostTypeDefinition,
   DEFAULT_COST_TYPES,
 } from '@/types/costDistribution';
 import { generateCostDistribution } from '@/utils/distributionCalculators';
 import { Plus, TrendingUp } from 'lucide-react';
 import { nanoid } from 'nanoid';
 
 interface ProjectCostDistributionPanelProps {
   productId: string;
   phases: PhaseOption[];
   currency: string;
   discountRate: number;
   initialEntries?: CostDistributionEntry[];
   onDistributionChange: (outputs: CostDistributionOutput[]) => void;
 }
 
 const DEFAULT_COST_TYPES_LIST: CostTypeDefinition[] = [
   { id: 'development', name: 'Development Costs', isRequired: true },
   { id: 'clinical', name: 'Clinical Trial Costs' },
   { id: 'regulatory', name: 'Regulatory Costs' },
   { id: 'manufacturing', name: 'Manufacturing Costs' },
   { id: 'marketing', name: 'Marketing Costs' },
   { id: 'operational', name: 'Operational Costs' },
   { id: 'customer-acquisition', name: 'Customer Acquisition Cost' },
 ];
 
 export function ProjectCostDistributionPanel({
   productId,
   phases,
   currency,
   discountRate,
   initialEntries,
   onDistributionChange,
 }: ProjectCostDistributionPanelProps) {
   const [entries, setEntries] = useState<CostDistributionEntry[]>(initialEntries || []);
   const [selectedEntry, setSelectedEntry] = useState<CostDistributionEntry | null>(null);
   const [editorOpen, setEditorOpen] = useState(false);
   const [selectedCostType, setSelectedCostType] = useState<string>('');
 
   // Get available cost types (not already added)
   const availableCostTypes = useMemo(() => {
     const usedTypeIds = new Set(entries.map(e => e.costTypeId));
     return DEFAULT_COST_TYPES_LIST.filter(ct => !usedTypeIds.has(ct.id));
   }, [entries]);
 
   // Calculate totals
   const totals = useMemo(() => {
     let nominal = 0;
     let riskAdjusted = 0;
     
     entries.forEach(entry => {
       const entryTotal = entry.distribution.reduce((sum, b) => sum + b.amount, 0);
       nominal += entryTotal;
       
       // Simple risk adjustment (proper calculation in MonthlyDistributionEditor)
       const monthlyRate = discountRate / 100 / 12;
       entry.distribution.forEach((bucket, index) => {
         const discountFactor = 1 / Math.pow(1 + monthlyRate, index);
         riskAdjusted += bucket.amount * (entry.phaseLoS / 100) * discountFactor;
       });
     });
     
     return { nominal, riskAdjusted };
   }, [entries, discountRate]);
 
   // Emit changes to parent
   useEffect(() => {
     const outputs: CostDistributionOutput[] = entries.map(entry => ({
       costTypeId: entry.costTypeId,
       costTypeName: entry.costTypeName,
       phaseId: entry.phaseId,
       phaseName: entry.phaseName,
       totalAmount: entry.totalBudget,
       distribution: entry.distribution,
     }));
     onDistributionChange(outputs);
   }, [entries, onDistributionChange]);
 
   const handleAddCostType = useCallback(() => {
     if (!selectedCostType || phases.length === 0) return;
     
     const costType = DEFAULT_COST_TYPES_LIST.find(ct => ct.id === selectedCostType);
     if (!costType) return;
     
     const defaultPhase = phases[0];
     const defaultBudget = 100000;
     
     const newEntry: CostDistributionEntry = {
       id: nanoid(),
       costTypeId: costType.id,
       costTypeName: costType.name,
       phaseId: defaultPhase.id,
       phaseName: defaultPhase.name,
       phaseMonths: defaultPhase.months,
       totalBudget: defaultBudget,
       currency,
       distribution: generateCostDistribution('flat', defaultBudget, defaultPhase.months),
       distributionPreset: 'flat',
       phaseLoS: defaultPhase.loS,
     };
     
     setEntries(prev => [...prev, newEntry]);
     setSelectedCostType('');
   }, [selectedCostType, phases, currency]);
 
   const handleEntryClick = useCallback((entry: CostDistributionEntry) => {
     setSelectedEntry(entry);
     setEditorOpen(true);
   }, []);
 
   const handleEntryUpdate = useCallback((entryId: string, updates: Partial<CostDistributionEntry>) => {
     setEntries(prev => prev.map(entry => {
       if (entry.id !== entryId) return entry;
       
       const updated = { ...entry, ...updates };
       
       // If phase changed, regenerate distribution
       if (updates.phaseMonths && updates.phaseMonths !== entry.phaseMonths) {
         updated.distribution = generateCostDistribution(
           entry.distributionPreset,
           entry.totalBudget,
           updates.phaseMonths
         );
       }
       
       // If budget changed, scale distribution
       if (updates.totalBudget !== undefined && updates.totalBudget !== entry.totalBudget) {
         const factor = updates.totalBudget / (entry.totalBudget || 1);
         updated.distribution = entry.distribution.map(b => ({
           ...b,
           amount: Math.round(b.amount * factor * 100) / 100,
         }));
       }
       
       return updated;
     }));
   }, []);
 
   const handleEntrySave = useCallback((updatedEntry: CostDistributionEntry) => {
     setEntries(prev => prev.map(entry => 
       entry.id === updatedEntry.id ? updatedEntry : entry
     ));
   }, []);
 
   const handleEntryDelete = useCallback((entryId: string) => {
     setEntries(prev => prev.filter(entry => entry.id !== entryId));
   }, []);
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: currency,
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(value);
   };
 
   return (
     <Card className="w-full">
       <CardHeader className="pb-4">
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               <TrendingUp className="h-5 w-5" />
               Project Cost Distribution
             </CardTitle>
             <CardDescription>
               Distribute project costs over time for accurate rNPV calculation
             </CardDescription>
           </div>
           
           {/* Summary */}
           <div className="flex gap-6 text-right">
             <div>
               <div className="text-xs text-muted-foreground">Nominal Total</div>
               <div className="font-semibold">{formatCurrency(totals.nominal)}</div>
             </div>
             <div>
               <div className="text-xs text-muted-foreground">Risk-Adjusted</div>
               <div className="font-semibold text-primary">{formatCurrency(totals.riskAdjusted)}</div>
             </div>
           </div>
         </div>
       </CardHeader>
       
       <CardContent className="space-y-4">
         {/* Add Cost Type */}
         <div className="flex items-center gap-2">
           <Select value={selectedCostType} onValueChange={setSelectedCostType}>
             <SelectTrigger className="w-[240px]">
               <SelectValue placeholder="Select cost type to add" />
             </SelectTrigger>
             <SelectContent>
               {availableCostTypes.map((costType) => (
                 <SelectItem key={costType.id} value={costType.id}>
                   {costType.name}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
           <Button 
             onClick={handleAddCostType}
             disabled={!selectedCostType || phases.length === 0}
             size="sm"
           >
             <Plus className="h-4 w-4 mr-1" />
             Add
           </Button>
         </div>
 
         {/* Cost Type Table */}
         <CostTypeTable
           entries={entries}
           phases={phases}
           currency={currency}
           onEntryClick={handleEntryClick}
           onEntryUpdate={handleEntryUpdate}
           onEntryDelete={handleEntryDelete}
         />
 
         {/* Distribution Editor */}
         <MonthlyDistributionEditor
           entry={selectedEntry}
           isOpen={editorOpen}
           onClose={() => setEditorOpen(false)}
           onSave={handleEntrySave}
           discountRate={discountRate}
         />
       </CardContent>
     </Card>
   );
 }