import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardWidgetsProps {
  phaseData: {
    documents: { total: number; completed: number; pending: number; overdue: number };
    gapAnalysis: { total: number; completed: number; pending: number; overdue: number };
  };
  phases: any[];
}

export function DashboardWidgets({ phaseData, phases }: DashboardWidgetsProps) {
  // Document completion data for pie chart
  const docCompletionData = [
    { name: 'Completed', value: phaseData.documents.completed, color: '#10B981' },
    { name: 'Pending', value: phaseData.documents.pending, color: '#F59E0B' },
    { name: 'Overdue', value: phaseData.documents.overdue, color: '#EF4444' }
  ].filter(item => item.value > 0);

  // Phase completion data for bar chart
  const phaseBarData = phases.slice(0, 5).map(phase => ({
    name: phase.name.substring(0, 10),
    completed: phase.status === 'Completed' ? 100 : 50,
    pending: phase.status === 'Completed' ? 0 : 50
  }));

  return (
    <div className="space-y-4">
      {/* Document Completion Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Document Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={docCompletionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {docCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-col justify-center space-y-2 text-xs">
              {docCompletionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}:</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Workload Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Team Workload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {['Sarah Johnson', 'Michael Chen', 'Emma Davis'].map((name, index) => (
            <div key={name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{name}</span>
                <span className="text-muted-foreground">{85 - index * 15}%</span>
              </div>
              <Progress value={85 - index * 15} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Trends Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Performance Trends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Delivery Speed</span>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">+15%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Quality Score</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded">
                92%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">On-Time Completion</span>
            <div className="flex items-center gap-1 text-red-600">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-semibold">-5%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
