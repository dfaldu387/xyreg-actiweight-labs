import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GitBranch, CheckCircle, XCircle, Clock, Download, BarChart3 } from 'lucide-react';
import { FDAPredicateService } from '@/services/fdaPredicateService';
import { PredicateTrail } from '@/types/fdaPredicateTrail';
import { toast } from 'sonner';

interface BatchProcessingJob {
  kNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  trail?: PredicateTrail;
  error?: string;
  startTime?: number;
  endTime?: number;
}

interface BatchPredicateProcessorProps {
  kNumbers: string[];
  onComplete: (results: Array<{ kNumber: string; trail?: PredicateTrail; error?: string }>) => void;
  onClose: () => void;
}

export function BatchPredicateProcessor({ kNumbers, onComplete, onClose }: BatchPredicateProcessorProps) {
  const [jobs, setJobs] = useState<BatchProcessingJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [aggregateStats, setAggregateStats] = useState({
    totalUpstream: 0,
    totalDownstream: 0,
    avgTrailDepth: 0,
    uniqueCompanies: new Set<string>(),
    deviceClasses: {} as Record<string, number>
  });

  // Initialize jobs
  useEffect(() => {
    const initialJobs = kNumbers.map(kNumber => ({
      kNumber,
      status: 'pending' as const
    }));
    setJobs(initialJobs);
  }, [kNumbers]);

  const processTrails = async () => {
    setIsProcessing(true);
    const results: Array<{ kNumber: string; trail?: PredicateTrail; error?: string }> = [];
    
    for (let i = 0; i < kNumbers.length; i++) {
      const kNumber = kNumbers[i];
      
      // Update job status to processing
      setJobs(prev => prev.map(job => 
        job.kNumber === kNumber 
          ? { ...job, status: 'processing', startTime: Date.now() }
          : job
      ));

      try {
        const trail = await FDAPredicateService.buildPredicateTrail(kNumber, 3);
        
        // Update job with success
        setJobs(prev => prev.map(job => 
          job.kNumber === kNumber 
            ? { ...job, status: 'completed', trail, endTime: Date.now() }
            : job
        ));

        results.push({ kNumber, trail });
        
        // Update aggregate statistics
        setAggregateStats(prev => {
          const newStats = { ...prev };
          newStats.totalUpstream += trail.upstreamPredicates.length;
          newStats.totalDownstream += trail.downstreamReferences.length;
          
          // Track unique companies
          trail.upstreamPredicates.forEach(device => {
            if (device.applicant) newStats.uniqueCompanies.add(device.applicant);
          });
          trail.downstreamReferences.forEach(device => {
            if (device.applicant) newStats.uniqueCompanies.add(device.applicant);
          });
          
          // Track device classes
          trail.predicateChain.forEach(device => {
            if (device.deviceClass) {
              newStats.deviceClasses[device.deviceClass] = (newStats.deviceClasses[device.deviceClass] || 0) + 1;
            }
          });
          
          return newStats;
        });

      } catch (error) {
        console.error(`Error processing trail for ${kNumber}:`, error);
        
        // Update job with failure
        setJobs(prev => prev.map(job => 
          job.kNumber === kNumber 
            ? { 
                ...job, 
                status: 'failed', 
                error: error instanceof Error ? error.message : 'Unknown error',
                endTime: Date.now() 
              }
            : job
        ));

        results.push({ kNumber, error: error instanceof Error ? error.message : 'Unknown error' });
      }

      setCompletedCount(i + 1);
      
      // Small delay to prevent overwhelming the API
      if (i < kNumbers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Calculate final average trail depth
    setAggregateStats(prev => ({
      ...prev,
      avgTrailDepth: results.reduce((sum, result) => 
        sum + (result.trail?.trailDepth || 0), 0
      ) / results.filter(r => r.trail).length || 0
    }));

    setIsProcessing(false);
    toast.success(`Batch processing completed: ${results.filter(r => r.trail).length}/${results.length} successful`);
    onComplete(results);
  };

  const handleExportResults = () => {
    const successfulJobs = jobs.filter(job => job.trail);
    const exportData = {
      batchId: Date.now(),
      processedAt: new Date().toISOString(),
      summary: {
        total: jobs.length,
        successful: successfulJobs.length,
        failed: jobs.filter(job => job.status === 'failed').length,
        aggregateStats: {
          ...aggregateStats,
          uniqueCompanies: Array.from(aggregateStats.uniqueCompanies)
        }
      },
      trails: successfulJobs.map(job => ({
        kNumber: job.kNumber,
        trail: job.trail,
        processingTime: job.endTime && job.startTime ? job.endTime - job.startTime : null
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predicate-trails-batch-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Batch results exported successfully');
  };

  const progress = (completedCount / kNumbers.length) * 100;
  const successfulTrails = jobs.filter(job => job.trail).length;
  const failedJobs = jobs.filter(job => job.status === 'failed').length;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Batch Predicate Trail Processing
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isProcessing && completedCount === kNumbers.length && (
              <Button onClick={handleExportResults} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Export Results
              </Button>
            )}
            <Button onClick={onClose} size="sm" variant="outline">
              {isProcessing ? 'Minimize' : 'Close'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{kNumbers.length} completed
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-2 border rounded">
              <div className="text-lg font-bold text-green-600">{successfulTrails}</div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div className="p-2 border rounded">
              <div className="text-lg font-bold text-red-600">{failedJobs}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="p-2 border rounded">
              <div className="text-lg font-bold text-blue-600">{kNumbers.length - completedCount}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
        </div>

        {!isProcessing && completedCount === 0 && (
          <div className="text-center py-4">
            <Button onClick={processTrails} size="lg" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Start Batch Processing ({kNumbers.length} devices)
            </Button>
          </div>
        )}

        {/* Aggregate Statistics */}
        {successfulTrails > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Aggregate Analysis
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded">
                  <div className="text-xl font-bold text-primary">{aggregateStats.totalUpstream}</div>
                  <div className="text-xs text-muted-foreground">Total Upstream Predicates</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-xl font-bold text-primary">{aggregateStats.totalDownstream}</div>
                  <div className="text-xs text-muted-foreground">Total Downstream References</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-xl font-bold text-primary">{aggregateStats.avgTrailDepth.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Avg Trail Depth</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-xl font-bold text-primary">{aggregateStats.uniqueCompanies.size}</div>
                  <div className="text-xs text-muted-foreground">Unique Companies</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Job Status List */}
        <Separator />
        <div className="space-y-3">
          <h4 className="font-medium">Processing Status</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {jobs.map(job => (
              <div key={job.kNumber} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{job.kNumber}</Badge>
                  {job.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {job.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                  {job.status === 'processing' && <Clock className="h-4 w-4 text-blue-500 animate-pulse" />}
                  {job.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {job.trail && (
                    <span>
                      {job.trail.upstreamPredicates.length}↑ {job.trail.downstreamReferences.length}↓
                    </span>
                  )}
                  {job.error && (
                    <span className="text-red-600 text-xs max-w-40 truncate">
                      {job.error}
                    </span>
                  )}
                  {job.startTime && job.endTime && (
                    <span className="text-xs">
                      {((job.endTime - job.startTime) / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}