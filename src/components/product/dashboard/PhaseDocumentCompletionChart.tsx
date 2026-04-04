import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { usePhaseDocuments } from "@/hooks/usePhaseDocuments";

interface PhaseDocumentCompletionChartProps {
  productId: string;
  companyId: string;
  phases: Array<{ id: string; name: string; position: number }>;
}

export function PhaseDocumentCompletionChart({ productId, companyId, phases }: PhaseDocumentCompletionChartProps) {
  const { phaseDocuments } = usePhaseDocuments(companyId, productId);

  // Calculate document stats per phase and overall
  const { phaseChartData, overallData } = useMemo(() => {
    if (!phaseDocuments || typeof phaseDocuments !== 'object' || phases.length === 0) {
      return { phaseChartData: [], overallData: [] };
    }

    // Convert phaseDocuments object to flat array
    const allDocs = Object.values(phaseDocuments).flat();

    let totalApproved = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    const phaseData = phases.map((phase) => {
      const phaseDocs = allDocs.filter((doc: any) => doc.phase_id === phase.id);
      
      const stats = phaseDocs.reduce((acc: any, doc: any) => {
        const status = doc.status || 'Not Started';
        const dueDate = doc.deadline || doc.due_date;
        
        if (status === 'Completed' || status === 'Approved') {
          acc.approved++;
        } else {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          
          if (dueDate) {
            const dueDateObj = new Date(dueDate);
            dueDateObj.setHours(23, 59, 59, 999);
            
            if (dueDateObj < today) {
              acc.overdue++;
            } else {
              acc.pending++;
            }
          } else {
            acc.pending++;
          }
        }
        return acc;
      }, { approved: 0, pending: 0, overdue: 0 });

      totalApproved += stats.approved;
      totalPending += stats.pending;
      totalOverdue += stats.overdue;

      // Shorten phase name for chart display
      const shortName = phase.name.length > 15 
        ? phase.name.substring(0, 15) + '...' 
        : phase.name;

      return {
        name: shortName,
        fullName: phase.name,
        approved: stats.approved,
        pending: stats.pending,
        overdue: stats.overdue,
        total: stats.approved + stats.pending + stats.overdue
      };
    }).filter((phase) => phase.total > 0); // Only show phases with documents

    // Overall donut chart data
    const overall = [
      { name: 'Approved', value: totalApproved, color: 'hsl(142, 76%, 36%)' },
      { name: 'Pending', value: totalPending, color: 'hsl(38, 92%, 50%)' },
      { name: 'Overdue', value: totalOverdue, color: 'hsl(0, 84%, 60%)' }
    ].filter((item) => item.value > 0);

    return { phaseChartData: phaseData, overallData: overall };
  }, [phaseDocuments, phases]);

  if (phaseChartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Document Completion by Phase
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground">No documents assigned to phases yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Assign documents to lifecycle phases to track completion progress
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Document Completion by Phase
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Donut Chart - Left Side */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overallData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {overallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-2 mt-2">
              {overallData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="text-sm font-medium">{item.name}:</span>
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Bar Chart - Right Side */}
          <div className="lg:col-span-2">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={phaseChartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    label={{ 
                      value: 'Documents', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--foreground))' }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    labelFormatter={(label) => {
                      const phase = phaseChartData.find(p => p.name === label);
                      return phase?.fullName || label;
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="square"
                  />
                  <Bar 
                    dataKey="approved" 
                    stackId="a" 
                    fill="hsl(142, 76%, 36%)" 
                    name="Approved"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="pending" 
                    stackId="a" 
                    fill="hsl(38, 92%, 50%)" 
                    name="Pending"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="overdue" 
                    stackId="a" 
                    fill="hsl(0, 84%, 60%)" 
                    name="Overdue"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
