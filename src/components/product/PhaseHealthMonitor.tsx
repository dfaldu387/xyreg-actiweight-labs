
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, RefreshCw, Activity } from "lucide-react";
import { checkPhaseSystemHealth, validateAndRepairCompanyProducts } from "@/utils/enhancedPhaseSync";
import { toast } from "sonner";

interface PhaseHealthMonitorProps {
  companyId: string;
  onRepairComplete?: () => void;
}

interface HealthMetric {
  name: string;
  value: number;
  status: string;
  details: string;
}

export function PhaseHealthMonitor({ companyId, onRepairComplete }: PhaseHealthMonitorProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [overallHealth, setOverallHealth] = useState<'good' | 'warning' | 'error'>('good');
  const [loading, setLoading] = useState(true);
  const [repairing, setRepairing] = useState(false);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const healthCheck = await checkPhaseSystemHealth(companyId);
      setMetrics(healthCheck.metrics || []);
      setOverallHealth(healthCheck.overallHealth || 'good');
    } catch (error) {
      console.error('Error loading health data:', error);
      toast.error('Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const handleRepairAll = async () => {
    try {
      setRepairing(true);
      const result = await validateAndRepairCompanyProducts(companyId);
      
      if (result.repaired > 0) {
        toast.success(`Successfully repaired ${result.repaired} products`);
        if (onRepairComplete) {
          onRepairComplete();
        }
        // Reload health data to reflect changes
        await loadHealthData();
      } else if (result.errors.length > 0) {
        toast.warning(`Some products could not be repaired: ${result.errors.length} errors`);
      } else {
        toast.info('All products are already properly configured');
      }
    } catch (error) {
      console.error('Error during repair:', error);
      toast.error('Failed to repair products');
    } finally {
      setRepairing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Checking system health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasIssues = overallHealth === 'error' || overallHealth === 'warning';
  const issueCount = metrics.filter(m => m.status === 'error' && m.value > 0).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Phase System Health
          </CardTitle>
          <Badge className={getStatusColor(overallHealth)}>
            {overallHealth === 'good' ? 'Healthy' : overallHealth === 'warning' ? 'Warning' : 'Issues Detected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <div key={metric.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(metric.status)}
                <div>
                  <div className="text-sm font-medium">{metric.details}</div>
                  <div className="text-xs text-muted-foreground capitalize">{metric.name.replace('_', ' ')}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{metric.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {hasIssues && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {issueCount > 0 && `${issueCount} issue${issueCount === 1 ? '' : 's'} detected`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadHealthData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRepairAll}
                  disabled={repairing}
                >
                  <AlertTriangle className={`h-4 w-4 mr-1 ${repairing ? 'animate-pulse' : ''}`} />
                  {repairing ? 'Repairing...' : 'Fix All Issues'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
