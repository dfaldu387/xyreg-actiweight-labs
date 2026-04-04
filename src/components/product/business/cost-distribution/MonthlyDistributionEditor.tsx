 import React, { useState, useMemo, useCallback } from 'react';
 import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
 import { Button } from '@/components/ui/button';
 import { Switch } from '@/components/ui/switch';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { DraggableBarChart } from './DraggableBarChart';
 import type { MonthlyBucket, DistributionPreset, CostDistributionEntry } from '@/types/costDistribution';
 import { 
   generateCostDistribution, 
   calculateRiskAdjustedCostValue 
 } from '@/utils/distributionCalculators';
 import { TrendingUp, Lock, Unlock, Grid3X3, LayoutGrid } from 'lucide-react';
 
 interface MonthlyDistributionEditorProps {
   entry: CostDistributionEntry | null;
   isOpen: boolean;
   onClose: () => void;
   onSave: (updatedEntry: CostDistributionEntry) => void;
   discountRate: number;
 }
 
 export function MonthlyDistributionEditor({
   entry,
   isOpen,
   onClose,
   onSave,
   discountRate,
 }: MonthlyDistributionEditorProps) {
   const [localBuckets, setLocalBuckets] = useState<MonthlyBucket[]>(entry?.distribution || []);
   const [localTotal, setLocalTotal] = useState(entry?.totalBudget || 0);
   const [lockTotal, setLockTotal] = useState(true);
   const [snapToGrid, setSnapToGrid] = useState(false);
   const [gridStep, setGridStep] = useState(500);
   const [activePreset, setActivePreset] = useState<DistributionPreset>(entry?.distributionPreset || 'flat');
 
   // Reset state when entry changes
   React.useEffect(() => {
     if (entry) {
       setLocalBuckets(entry.distribution);
       setLocalTotal(entry.totalBudget);
       setActivePreset(entry.distributionPreset);
     }
   }, [entry]);
 
   const handleBucketsChange = useCallback((newBuckets: MonthlyBucket[]) => {
     setLocalBuckets(newBuckets);
     setActivePreset('custom');
     if (!lockTotal) {
       const newTotal = newBuckets.reduce((sum, b) => sum + b.amount, 0);
       setLocalTotal(Math.round(newTotal * 100) / 100);
     }
   }, [lockTotal]);
 
   const handlePresetClick = useCallback((preset: DistributionPreset) => {
     if (!entry) return;
     const newBuckets = generateCostDistribution(preset, localTotal, entry.phaseMonths);
     setLocalBuckets(newBuckets);
     setActivePreset(preset);
   }, [entry, localTotal]);
 
   const handleMonthInputChange = useCallback((index: number, value: string) => {
     const numValue = parseFloat(value) || 0;
     const newBuckets = [...localBuckets];
     newBuckets[index] = {
       ...newBuckets[index],
       amount: Math.max(0, numValue),
     };
     
     if (lockTotal) {
       // Proportionally adjust other buckets
       const oldValue = localBuckets[index].amount;
       const delta = numValue - oldValue;
       const otherBuckets = newBuckets.filter((_, i) => i !== index);
       const otherTotal = otherBuckets.reduce((sum, b) => sum + b.amount, 0);
       
       if (otherTotal > 0 && delta !== 0) {
         const factor = (otherTotal - delta) / otherTotal;
         newBuckets.forEach((bucket, i) => {
           if (i !== index) {
             bucket.amount = Math.max(0, Math.round(bucket.amount * factor * 100) / 100);
           }
         });
       }
     }
     
     // Recalculate weights
     const total = newBuckets.reduce((sum, b) => sum + b.amount, 0);
     newBuckets.forEach(b => {
       b.weight = total > 0 ? b.amount / total : 1 / newBuckets.length;
     });
     
     setLocalBuckets(newBuckets);
     setActivePreset('custom');
     
     if (!lockTotal) {
       setLocalTotal(Math.round(total * 100) / 100);
     }
   }, [localBuckets, lockTotal]);
 
   const handleSave = useCallback(() => {
     if (!entry) return;
     onSave({
       ...entry,
       distribution: localBuckets,
       totalBudget: localTotal,
       distributionPreset: activePreset,
     });
     onClose();
   }, [entry, localBuckets, localTotal, activePreset, onSave, onClose]);
 
   const { nominal, riskAdjusted } = useMemo(() => {
     if (!entry) return { nominal: 0, riskAdjusted: 0 };
     return calculateRiskAdjustedCostValue(localBuckets, entry.phaseLoS, discountRate);
   }, [localBuckets, entry, discountRate]);
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: entry?.currency || 'USD',
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(value);
   };
 
   if (!entry) return null;
 
   const presets: { key: DistributionPreset; label: string; icon?: React.ReactNode }[] = [
     { key: 'flat', label: 'Flat' },
     { key: 's-curve', label: 'S-Curve' },
     { key: 'front-loaded', label: 'Front-Loaded' },
     { key: 'back-loaded', label: 'Back-Loaded' },
   ];
 
   return (
     <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
       <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
         <SheetHeader className="mb-6">
           <div className="flex items-center gap-2">
             <SheetTitle>{entry.costTypeName}</SheetTitle>
             <Badge variant="outline" className="ml-2">
               {entry.phaseName}
             </Badge>
           </div>
           <SheetDescription>
             Distribute {formatCurrency(localTotal)} across {entry.phaseMonths} months
           </SheetDescription>
         </SheetHeader>
 
         {/* Interactive Chart */}
         <div className="relative mb-6 p-4 bg-secondary/30 rounded-lg border border-border">
           <DraggableBarChart
             buckets={localBuckets}
             onBucketsChange={handleBucketsChange}
             lockTotal={lockTotal}
             totalBudget={localTotal}
             currency={entry.currency}
             snapToGrid={snapToGrid}
             gridStep={gridStep}
           />
         </div>
 
         {/* Controls */}
         <div className="space-y-4 mb-6">
           {/* Toggles Row */}
           <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-2">
               {lockTotal ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
               <Label htmlFor="lock-total" className="text-sm">Lock Total</Label>
               <Switch
                 id="lock-total"
                 checked={lockTotal}
                 onCheckedChange={setLockTotal}
               />
             </div>
             
             <div className="flex items-center gap-2">
               <Grid3X3 className="h-4 w-4" />
               <Label htmlFor="snap-grid" className="text-sm">Snap to Grid</Label>
               <Switch
                 id="snap-grid"
                 checked={snapToGrid}
                 onCheckedChange={setSnapToGrid}
               />
             </div>
           </div>
           
           {/* Grid Step Input */}
           {snapToGrid && (
             <div className="flex items-center gap-2">
               <Label htmlFor="grid-step" className="text-sm whitespace-nowrap">Grid Step:</Label>
               <Input
                 id="grid-step"
                 type="number"
                 value={gridStep}
                 onChange={(e) => setGridStep(parseInt(e.target.value) || 100)}
                 className="w-24"
                 min={100}
                 step={100}
               />
             </div>
           )}
 
           {/* Preset Buttons */}
           <div className="flex flex-wrap gap-2">
             {presets.map(({ key, label }) => (
               <Button
                 key={key}
                 variant={activePreset === key ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => handlePresetClick(key)}
               >
                 {label}
               </Button>
             ))}
           </div>
         </div>
 
         {/* Monthly Input Fields */}
         <div className="mb-6">
           <Label className="text-sm font-medium mb-2 block">Monthly Amounts</Label>
           <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-secondary/20 rounded-lg">
             {localBuckets.map((bucket, index) => (
               <div key={bucket.month} className="flex flex-col">
                 <span className="text-xs text-muted-foreground mb-1">M{bucket.month}</span>
                 <Input
                   type="number"
                   value={bucket.amount}
                   onChange={(e) => handleMonthInputChange(index, e.target.value)}
                   className="h-8 text-xs px-2"
                   min={0}
                 />
               </div>
             ))}
           </div>
         </div>
 
         {/* Real-time Summary */}
         <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-3">
           <div className="flex items-center justify-between">
             <span className="text-sm text-muted-foreground">Nominal Total</span>
             <span className="font-semibold">{formatCurrency(nominal)}</span>
           </div>
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-1">
               <TrendingUp className="h-4 w-4 text-primary" />
               <span className="text-sm text-muted-foreground">
                 Risk-Adjusted ({entry.phaseLoS}% LoS, {discountRate}% WACC)
               </span>
             </div>
             <span className="font-semibold text-primary">{formatCurrency(riskAdjusted)}</span>
           </div>
           {nominal > 0 && (
             <div className="text-xs text-muted-foreground text-right">
               {((riskAdjusted / nominal) * 100).toFixed(1)}% of nominal
             </div>
           )}
         </div>
 
         {/* Action Buttons */}
         <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
           <Button variant="outline" onClick={onClose}>
             Cancel
           </Button>
           <Button onClick={handleSave}>
             Apply Distribution
           </Button>
         </div>
       </SheetContent>
     </Sheet>
   );
 }