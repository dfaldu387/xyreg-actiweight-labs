
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartProduct {
  id: string;
  name: string;
  progress: number;
  status: "On Track" | "At Risk" | "Needs Attention";
  phase?: string;
}

interface ChartProps {
  data: ChartProduct[];
}

export function Chart({ data }: ChartProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track": return "#10b981";
      case "At Risk": return "#f59e0b";
      case "Needs Attention": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          interval={0}
        />
        <YAxis 
          domain={[0, 100]}
          label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value, name, props) => [
            `${value}%`, 
            'Progress',
            props.payload.phase && `Phase: ${props.payload.phase}`
          ]}
          labelFormatter={(label) => `Product: ${label}`}
        />
        <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
