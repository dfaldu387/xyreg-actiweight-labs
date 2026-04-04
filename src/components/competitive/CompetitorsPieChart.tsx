import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ExternalLink, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useCallback } from 'react';

interface CompetitorData {
  name: string;
  products: number;
  percentage: number;
  website?: string;
  color: string;
}

interface CompetitorsPieChartProps {
  competitorsByOrganization: Record<string, number>;
  totalCompetitors: number;
  className?: string;
}

// Predefined colors for pie chart segments
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
  '#87d068'
];

export function CompetitorsPieChart({ 
  competitorsByOrganization, 
  totalCompetitors, 
  className 
}: CompetitorsPieChartProps) {
  // Memoize chart data to prevent infinite re-renders
  const chartData = useMemo((): CompetitorData[] => {
    return Object.entries(competitorsByOrganization)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Show top 10 competitors
      .map(([name, products], index) => ({
        name,
        products,
        percentage: (products / totalCompetitors) * 100,
        website: getCompanyWebsite(name),
        color: COLORS[index % COLORS.length]
      }));
  }, [competitorsByOrganization, totalCompetitors]);

  // Memoize legend payload to prevent re-renders
  const legendPayload = useMemo(() => {
    return chartData.map((data) => ({
      value: data.name,
      color: data.color,
      type: 'square' as const
    }));
  }, [chartData]);

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.products} products ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  }, []);

  // Render legend separately to avoid re-render issues
  const renderLegend = () => {
    return (
      <div className="grid grid-cols-1 gap-2 mt-4">
        {chartData.map((data, index) => (
          <div key={`legend-${data.name}-${index}`} className="flex items-center justify-between p-2 rounded border">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: data.color }}
              />
              <span className="text-sm font-medium truncate">{data.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {data.products} ({data.percentage.toFixed(1)}%)
              </span>
              {data.website && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => window.open(data.website, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Product Distribution by Company
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No competitor data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Product Distribution by Company
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="products"
                label={({ percentage }) => `${percentage.toFixed(1)}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {renderLegend()}
        </div>
      </CardContent>
    </Card>
  );
}

// Simple website resolver - in a real app, this could be enhanced with a service
function getCompanyWebsite(companyName: string): string | undefined {
  const websites: Record<string, string> = {
    'Medtronic': 'https://www.medtronic.com',
    'Johnson & Johnson': 'https://www.jnj.com',
    'Abbott': 'https://www.abbott.com',
    'Boston Scientific': 'https://www.bostonscientific.com',
    'Stryker': 'https://www.stryker.com',
    'Becton Dickinson': 'https://www.bd.com',
    'Siemens Healthineers': 'https://www.siemens-healthineers.com',
    'GE Healthcare': 'https://www.gehealthcare.com',
    'Philips': 'https://www.philips.com',
    'Zimmer Biomet': 'https://www.zimmerbiomet.com'
  };
  
  // Try exact match first
  if (websites[companyName]) {
    return websites[companyName];
  }
  
  // Try partial match
  for (const [key, url] of Object.entries(websites)) {
    if (companyName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(companyName.toLowerCase())) {
      return url;
    }
  }
  
  return undefined;
}