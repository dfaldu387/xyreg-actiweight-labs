 import React, { useMemo } from 'react';
 import { AreaChart, Area, ResponsiveContainer } from 'recharts';
 import type { MonthlyBucket } from '@/types/costDistribution';
 
 interface DistributionSparklineProps {
   buckets: MonthlyBucket[];
   width?: number | string;
   height?: number;
   color?: string;
 }
 
 export function DistributionSparkline({
   buckets,
   width = '100%',
   height = 24,
   color = 'hsl(211, 100%, 50%)',
 }: DistributionSparklineProps) {
   const chartData = useMemo(() => 
     buckets.map((bucket) => ({
       value: bucket.amount,
     })),
     [buckets]
   );
 
   if (buckets.length === 0) {
     return (
       <div 
         style={{ width, height }} 
         className="flex items-center justify-center text-xs text-muted-foreground"
       >
         No data
       </div>
     );
   }
 
   return (
     <ResponsiveContainer width={width} height={height}>
       <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
         <defs>
           <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
             <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
             <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
           </linearGradient>
         </defs>
         <Area
           type="monotone"
           dataKey="value"
           stroke={color}
           strokeWidth={1.5}
           fill="url(#sparklineGradient)"
           isAnimationActive={false}
         />
       </AreaChart>
     </ResponsiveContainer>
   );
 }