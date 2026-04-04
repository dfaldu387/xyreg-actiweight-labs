import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { ParetoData, createEmptyParetoData } from '@/types/rcaData';
import { nanoid } from 'nanoid';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  Save, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react';

interface ParetoChartBuilderProps {
  initialData?: ParetoData | null;
  problemDescription?: string;
  onSave: (data: ParetoData) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

interface ParetoItem {
  id: string;
  category: string;
  count: number;
}

export function ParetoChartBuilder({ 
  initialData, 
  problemDescription = '',
  onSave, 
  isLoading = false,
  readOnly = false 
}: ParetoChartBuilderProps) {
  const [problemCategory, setProblemCategory] = useState(
    initialData?.problemCategory || 'Defects by Category'
  );
  const [items, setItems] = useState<ParetoItem[]>(
    initialData?.items?.map(i => ({ id: i.id, category: i.category, count: i.count })) || []
  );
  const [rootCause, setRootCause] = useState(initialData?.rootCause || '');
  const [newCategory, setNewCategory] = useState('');
  const [newCount, setNewCount] = useState('');

  // Calculate percentages and cumulative percentages
  const chartData = useMemo(() => {
    if (items.length === 0) return [];
    
    // Sort by count descending
    const sorted = [...items].sort((a, b) => b.count - a.count);
    const total = sorted.reduce((sum, item) => sum + item.count, 0);
    
    let cumulative = 0;
    return sorted.map(item => {
      const percentage = total > 0 ? (item.count / total) * 100 : 0;
      cumulative += percentage;
      return {
        ...item,
        percentage: Math.round(percentage * 10) / 10,
        cumulativePercentage: Math.round(cumulative * 10) / 10
      };
    });
  }, [items]);

  // Identify vital few (80% threshold)
  const vitalFew = useMemo(() => {
    return chartData
      .filter(item => {
        const itemIndex = chartData.indexOf(item);
        const prevCumulative = itemIndex > 0 ? chartData[itemIndex - 1].cumulativePercentage : 0;
        return prevCumulative < 80;
      })
      .map(item => item.category);
  }, [chartData]);

  const handleAddItem = () => {
    if (!newCategory.trim() || !newCount) return;
    const count = parseInt(newCount, 10);
    if (isNaN(count) || count < 0) return;
    
    setItems(prev => [...prev, {
      id: nanoid(),
      category: newCategory.trim(),
      count
    }]);
    setNewCategory('');
    setNewCount('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'category' | 'count', value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (field === 'count') {
        const count = parseInt(value, 10);
        return { ...item, count: isNaN(count) ? 0 : count };
      }
      return { ...item, [field]: value };
    }));
  };

  const handleSave = useCallback(() => {
    const paretoData: ParetoData = {
      methodology: 'pareto',
      problemCategory,
      items: chartData.map(item => ({
        id: item.id,
        category: item.category,
        count: item.count,
        percentage: item.percentage,
        cumulativePercentage: item.cumulativePercentage
      })),
      vitalFew,
      rootCause,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(paretoData);
  }, [problemCategory, chartData, vitalFew, rootCause, initialData, onSave]);

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Pareto Analysis (80/20)
        </CardTitle>
        <CardDescription>
          Identify the vital few causes responsible for the majority of issues
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Problem Category */}
        <div className="space-y-2">
          <Label>What are you counting?</Label>
          <Input
            value={problemCategory}
            onChange={(e) => setProblemCategory(e.target.value)}
            placeholder="e.g., Defects by Supplier, Complaints by Type"
            disabled={readOnly}
          />
        </div>

        {/* Data Entry Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Data Entry</Label>
            <Badge variant="outline">Total: {total}</Badge>
          </div>

          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-24">Count</TableHead>
                    <TableHead className="w-20">%</TableHead>
                    <TableHead className="w-24">Vital Few</TableHead>
                    {!readOnly && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {readOnly ? (
                          item.category
                        ) : (
                          <Input
                            value={item.category}
                            onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                            className="h-8"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {readOnly ? (
                          item.count
                        ) : (
                          <Input
                            type="number"
                            value={item.count}
                            onChange={(e) => handleUpdateItem(item.id, 'count', e.target.value)}
                            className="h-8"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.percentage}%
                      </TableCell>
                      <TableCell>
                        {vitalFew.includes(item.category) && (
                          <Badge variant="destructive" className="text-xs">
                            <Target className="h-3 w-3 mr-1" />
                            Vital
                          </Badge>
                        )}
                      </TableCell>
                      {!readOnly && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Add New Item */}
          {!readOnly && (
            <div className="flex gap-2">
              <Input
                placeholder="Category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <Input
                type="number"
                placeholder="Count"
                value={newCount}
                onChange={(e) => setNewCount(e.target.value)}
                className="w-24"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <Button variant="outline" size="icon" onClick={handleAddItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="space-y-3">
            <Label>Pareto Chart</Label>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', fontSize: 11 }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-muted-foreground">Count: {data.count}</p>
                          <p className="text-sm text-muted-foreground">Percentage: {data.percentage}%</p>
                          <p className="text-sm text-muted-foreground">Cumulative: {data.cumulativePercentage}%</p>
                          {vitalFew.includes(label) && (
                            <Badge variant="destructive" className="mt-1 text-xs">Vital Few</Badge>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="count" 
                    name="Count"
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={vitalFew.includes(entry.category) 
                          ? 'hsl(var(--destructive))' 
                          : 'hsl(var(--primary))'
                        } 
                      />
                    ))}
                  </Bar>
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="cumulativePercentage" 
                    name="Cumulative %"
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 80% line indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>The 80% threshold identifies the "vital few" causes to prioritize</span>
            </div>
          </div>
        )}

        {/* Vital Few Summary */}
        {vitalFew.length > 0 && (
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-sm">Vital Few Identified</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {vitalFew.length} of {items.length} categories ({Math.round(vitalFew.length / items.length * 100) || 0}%) 
              account for approximately 80% of occurrences:
            </p>
            <div className="flex flex-wrap gap-2">
              {vitalFew.map(category => (
                <Badge key={category} variant="destructive">{category}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Root Cause Summary */}
        <div className="space-y-2">
          <Label>Root Cause Summary</Label>
          <Textarea
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="Based on the Pareto analysis, document the root cause findings..."
            rows={3}
            disabled={readOnly}
          />
          <p className="text-xs text-muted-foreground">
            Focus on the vital few categories identified above. What is the common root cause?
          </p>
        </div>
      </CardContent>

      {!readOnly && (
        <CardFooter className="border-t pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || items.length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Pareto Analysis
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
