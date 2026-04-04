import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFDAPredicateTrail } from '@/hooks/useFDAPredicateSearch';
import { Loader2, Search, AlertCircle } from 'lucide-react';

export function EnhancedPredicateTest() {
  const [kNumber, setKNumber] = useState('K240062');
  const [searchKNumber, setSearchKNumber] = useState('');
  
  const { 
    data: trailData, 
    isLoading, 
    error, 
    refetch 
  } = useFDAPredicateTrail(searchKNumber || undefined, 3, { enabled: Boolean(searchKNumber) });

  const handleSearch = () => {
    setSearchKNumber(kNumber);
    refetch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Enhanced Predicate Trail Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter K-number (e.g., K240062)"
              value={kNumber}
              onChange={(e) => setKNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !kNumber}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700 text-sm">
                Error: {error.message}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {trailData && (
        <Card>
          <CardHeader>
            <CardTitle>Predicate Trail Results for {searchKNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {trailData.upstreamPredicates?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Upstream Predicates</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {trailData.downstreamReferences?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Downstream References</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {trailData.trailDepth || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Trail Depth</div>
              </div>
              
              <div className="text-center">
                <Badge variant={trailData.hasUpstream || trailData.hasDownstream ? "default" : "secondary"}>
                  {trailData.hasUpstream || trailData.hasDownstream ? "Connected" : "Isolated"}
                </Badge>
              </div>
            </div>

            {trailData.targetDevice && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Target Device</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>Device Name:</strong> {trailData.targetDevice.deviceName || 'N/A'}</div>
                  <div><strong>Applicant:</strong> {trailData.targetDevice.applicant || 'N/A'}</div>
                  <div><strong>Product Code:</strong> {trailData.targetDevice.productCode || 'N/A'}</div>
                  <div><strong>Device Class:</strong> {trailData.targetDevice.deviceClass || 'N/A'}</div>
                  <div><strong>Decision Date:</strong> {trailData.targetDevice.decisionDate || 'N/A'}</div>
                  <div><strong>Summary Length:</strong> {trailData.targetDevice.statementOrSummary?.length || 0} chars</div>
                </div>
              </div>
            )}

            {trailData.upstreamPredicates && trailData.upstreamPredicates.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Upstream Predicates ({trailData.upstreamPredicates.length})</h4>
                <div className="space-y-2">
                  {trailData.upstreamPredicates.map((device, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline">{device.kNumber}</Badge>
                        <span className="text-xs text-muted-foreground">{device.decisionDate}</span>
                      </div>
                      <div className="text-sm font-medium">{device.deviceName || 'Unknown Device'}</div>
                      <div className="text-xs text-muted-foreground">{device.applicant}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trailData.downstreamReferences && trailData.downstreamReferences.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Downstream References ({trailData.downstreamReferences.length})</h4>
                <div className="space-y-2">
                  {trailData.downstreamReferences.map((device, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="secondary">{device.kNumber}</Badge>
                        <span className="text-xs text-muted-foreground">{device.decisionDate}</span>
                      </div>
                      <div className="text-sm font-medium">{device.deviceName || 'Unknown Device'}</div>
                      <div className="text-xs text-muted-foreground">{device.applicant}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!trailData.upstreamPredicates || trailData.upstreamPredicates.length === 0) && 
             (!trailData.downstreamReferences || trailData.downstreamReferences.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No predicate connections found for this device.</p>
                <p className="text-sm mt-1">This could indicate:</p>
                <ul className="text-xs mt-2 list-disc list-inside">
                  <li>The device has no explicit predicate references</li>
                  <li>Document content is limited (only summary available)</li>
                  <li>The device uses novel technology without clear predicates</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}