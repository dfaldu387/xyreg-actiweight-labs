 import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
 import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
 import type { MonthlyBucket } from '@/types/costDistribution';
 import { normalizeCostDistribution, snapToGridStep } from '@/utils/distributionCalculators';
 import { cn } from '@/lib/utils';
 
 interface DraggableBarChartProps {
   buckets: MonthlyBucket[];
   onBucketsChange: (newBuckets: MonthlyBucket[]) => void;
   lockTotal: boolean;
   totalBudget: number;
   currency: string;
   snapToGrid: boolean;
   gridStep?: number;
   height?: number;
 }
 
 export function DraggableBarChart({
   buckets,
   onBucketsChange,
   lockTotal,
   totalBudget,
   currency,
   snapToGrid,
   gridStep = 500,
   height = 280,
 }: DraggableBarChartProps) {
   const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
   const [isDragging, setIsDragging] = useState(false);
   const containerRef = useRef<HTMLDivElement>(null);
   const dragStartRef = useRef<{ y: number; value: number } | null>(null);
 
   const maxValue = useMemo(() => {
     const max = Math.max(...buckets.map(b => b.amount), 1);
     return Math.ceil(max * 1.2 / 100) * 100; // Round up to nearest 100 with 20% buffer
   }, [buckets]);
 
   const chartData = useMemo(() => 
     buckets.map((bucket) => ({
       name: `M${bucket.month}`,
       value: bucket.amount,
       month: bucket.month,
     })),
     [buckets]
   );
 
   const handleMouseDown = useCallback((index: number, event: React.MouseEvent) => {
     event.preventDefault();
     setActiveBarIndex(index);
     setIsDragging(true);
     dragStartRef.current = {
       y: event.clientY,
       value: buckets[index].amount,
     };
   }, [buckets]);
 
   const handleMouseMove = useCallback((event: MouseEvent) => {
     if (!isDragging || activeBarIndex === null || !dragStartRef.current || !containerRef.current) {
       return;
     }
 
     const containerRect = containerRef.current.getBoundingClientRect();
     const chartHeight = containerRect.height - 60; // Account for axis
     const deltaY = dragStartRef.current.y - event.clientY;
     const valuePerPixel = maxValue / chartHeight;
     
     let newValue = dragStartRef.current.value + (deltaY * valuePerPixel);
     newValue = Math.max(0, newValue);
     
     if (snapToGrid && gridStep > 0) {
       newValue = snapToGridStep(newValue, gridStep);
     }
     
     newValue = Math.round(newValue * 100) / 100;
 
     const newBuckets = [...buckets];
     newBuckets[activeBarIndex] = {
       ...newBuckets[activeBarIndex],
       amount: newValue,
     };
 
     if (lockTotal) {
       // Normalize to maintain total budget
       const normalized = normalizeCostDistribution(newBuckets, totalBudget);
       onBucketsChange(normalized);
     } else {
       // Recalculate weights based on new amounts
       const newTotal = newBuckets.reduce((sum, b) => sum + b.amount, 0);
       const updated = newBuckets.map(b => ({
         ...b,
         weight: newTotal > 0 ? b.amount / newTotal : 1 / newBuckets.length,
       }));
       onBucketsChange(updated);
     }
   }, [isDragging, activeBarIndex, buckets, lockTotal, totalBudget, maxValue, snapToGrid, gridStep, onBucketsChange]);
 
   const handleMouseUp = useCallback(() => {
     setIsDragging(false);
     setActiveBarIndex(null);
     dragStartRef.current = null;
   }, []);
 
   useEffect(() => {
     if (isDragging) {
       window.addEventListener('mousemove', handleMouseMove);
       window.addEventListener('mouseup', handleMouseUp);
       document.body.style.cursor = 'ns-resize';
       document.body.style.userSelect = 'none';
     }
     
     return () => {
       window.removeEventListener('mousemove', handleMouseMove);
       window.removeEventListener('mouseup', handleMouseUp);
       document.body.style.cursor = '';
       document.body.style.userSelect = '';
     };
   }, [isDragging, handleMouseMove, handleMouseUp]);
 
   const formatCurrency = (value: number) => {
     if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
     if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
     return value.toFixed(0);
   };
 
   // Custom bar shape with drag handle
   const CustomBar = (props: any) => {
     const { x, y, width, height: barHeight, index } = props;
     const isActive = activeBarIndex === index;
     const isHovered = false; // Can add hover state if needed
     
     return (
       <g>
         {/* Main bar */}
         <rect
           x={x}
           y={y}
           width={width}
           height={Math.max(0, barHeight)}
           rx={4}
           ry={4}
           fill={isActive ? 'hsl(211, 100%, 55%)' : 'hsl(211, 100%, 50%)'}
           className={cn(
             'transition-all duration-150',
             isActive && 'drop-shadow-[0_0_8px_rgba(0,122,255,0.6)]'
           )}
           style={{
             filter: isActive ? 'drop-shadow(0 0 8px rgba(0, 122, 255, 0.6))' : undefined,
           }}
         />
         {/* Drag handle (top of bar) */}
         <rect
           x={x}
           y={y - 4}
           width={width}
           height={12}
           fill="transparent"
           className="cursor-ns-resize"
           onMouseDown={(e) => handleMouseDown(index, e)}
         />
         {/* Visual drag indicator */}
         <line
           x1={x + width * 0.3}
           y1={y + 2}
           x2={x + width * 0.7}
           y2={y + 2}
           stroke="rgba(255,255,255,0.6)"
           strokeWidth={2}
           strokeLinecap="round"
         />
       </g>
     );
   };
 
   return (
     <div 
       ref={containerRef}
       className={cn(
         "w-full select-none",
         isDragging && "cursor-ns-resize"
       )}
     >
       <ResponsiveContainer width="100%" height={height}>
         <BarChart
           data={chartData}
           margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
         >
           <XAxis 
             dataKey="name" 
             axisLine={{ stroke: 'hsl(var(--border))' }}
             tickLine={false}
             tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
           />
           <YAxis 
             domain={[0, maxValue]}
             axisLine={{ stroke: 'hsl(var(--border))' }}
             tickLine={false}
             tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
             tickFormatter={formatCurrency}
             width={60}
           />
           {snapToGrid && gridStep > 0 && (
             Array.from({ length: Math.floor(maxValue / gridStep) }, (_, i) => (
               <ReferenceLine 
                 key={i}
                 y={(i + 1) * gridStep} 
                 stroke="hsl(var(--border))" 
                 strokeDasharray="3 3"
                 strokeOpacity={0.5}
               />
             ))
           )}
           <Bar 
             dataKey="value" 
             shape={<CustomBar />}
             isAnimationActive={!isDragging}
           >
             {chartData.map((_, index) => (
               <Cell 
                 key={`cell-${index}`}
                 cursor="ns-resize"
               />
             ))}
           </Bar>
         </BarChart>
       </ResponsiveContainer>
       
       {isDragging && (
         <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
           Adjusting M{activeBarIndex !== null ? activeBarIndex + 1 : ''}
         </div>
       )}
     </div>
   );
 }