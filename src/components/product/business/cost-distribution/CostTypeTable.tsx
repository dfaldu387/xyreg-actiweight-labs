 import React from 'react';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Button } from '@/components/ui/button';
 import { DistributionSparkline } from './DistributionSparkline';
 import type { CostDistributionEntry, PhaseOption, DistributionPreset } from '@/types/costDistribution';
 import { Settings2, Trash2 } from 'lucide-react';
 
 interface CostTypeTableProps {
   entries: CostDistributionEntry[];
   phases: PhaseOption[];
   currency: string;
   onEntryClick: (entry: CostDistributionEntry) => void;
   onEntryUpdate: (entryId: string, updates: Partial<CostDistributionEntry>) => void;
   onEntryDelete?: (entryId: string) => void;
 }
 
 const presetLabels: Record<DistributionPreset, string> = {
   'flat': 'Flat',
   's-curve': 'S-Curve',
   'front-loaded': 'Front',
   'back-loaded': 'Back',
   'custom': 'Custom',
 };
 
 export function CostTypeTable({
   entries,
   phases,
   currency,
   onEntryClick,
   onEntryUpdate,
   onEntryDelete,
 }: CostTypeTableProps) {
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: currency,
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(value);
   };
 
   const handlePhaseChange = (entryId: string, phaseId: string) => {
     const phase = phases.find(p => p.id === phaseId);
     if (phase) {
       onEntryUpdate(entryId, {
         phaseId: phase.id,
         phaseName: phase.name,
         phaseMonths: phase.months,
         phaseLoS: phase.loS,
       });
     }
   };
 
   const handleBudgetChange = (entryId: string, value: string) => {
     const numValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
     onEntryUpdate(entryId, { totalBudget: numValue });
   };
 
   return (
     <div className="rounded-lg border border-border overflow-hidden">
       <Table>
         <TableHeader>
           <TableRow className="bg-secondary/30">
             <TableHead className="w-[180px]">Cost Type</TableHead>
             <TableHead className="w-[160px]">Phase</TableHead>
             <TableHead className="w-[140px]">Total Budget</TableHead>
             <TableHead className="w-[120px]">Distribution</TableHead>
             <TableHead className="w-[60px]"></TableHead>
           </TableRow>
         </TableHeader>
         <TableBody>
           {entries.map((entry) => (
             <TableRow 
               key={entry.id}
               className="cursor-pointer hover:bg-secondary/50 transition-colors"
               onClick={() => onEntryClick(entry)}
             >
               <TableCell className="font-medium">
                 {entry.costTypeName}
               </TableCell>
               <TableCell onClick={(e) => e.stopPropagation()}>
                 <Select
                   value={entry.phaseId}
                   onValueChange={(value) => handlePhaseChange(entry.id, value)}
                 >
                   <SelectTrigger className="h-8 text-xs">
                     <SelectValue placeholder="Select phase" />
                   </SelectTrigger>
                   <SelectContent>
                     {phases.map((phase) => (
                       <SelectItem key={phase.id} value={phase.id}>
                         {phase.name} ({phase.months}mo)
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </TableCell>
               <TableCell onClick={(e) => e.stopPropagation()}>
                 <Input
                   type="text"
                   value={formatCurrency(entry.totalBudget)}
                   onChange={(e) => handleBudgetChange(entry.id, e.target.value)}
                   className="h-8 text-xs w-28"
                 />
               </TableCell>
               <TableCell>
                 <div className="flex items-center gap-2">
                   <DistributionSparkline 
                     buckets={entry.distribution} 
                     width={60} 
                     height={24}
                   />
                   <Badge variant="outline" className="text-xs">
                     {presetLabels[entry.distributionPreset]}
                   </Badge>
                 </div>
               </TableCell>
               <TableCell onClick={(e) => e.stopPropagation()}>
                 <div className="flex items-center gap-1">
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-7 w-7"
                     onClick={() => onEntryClick(entry)}
                   >
                     <Settings2 className="h-4 w-4" />
                   </Button>
                   {onEntryDelete && (
                     <Button
                       variant="ghost"
                       size="icon"
                       className="h-7 w-7 text-destructive hover:text-destructive"
                       onClick={() => onEntryDelete(entry.id)}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   )}
                 </div>
               </TableCell>
             </TableRow>
           ))}
           {entries.length === 0 && (
             <TableRow>
               <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                 No cost entries. Add a cost type to get started.
               </TableCell>
             </TableRow>
           )}
         </TableBody>
       </Table>
     </div>
   );
 }