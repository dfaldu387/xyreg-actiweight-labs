
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Wrench, Trash2, RefreshCw } from "lucide-react";
import { useDocumentCleanup } from "@/hooks/useDocumentCleanup";
import { CleanupResult } from "@/services/documentCleanupService";

interface DocumentCleanupPanelProps {
  productId?: string;
  companyId: string;
  onCleanupComplete?: () => void;
}

export function DocumentCleanupPanel({
  productId,
  companyId,
  onCleanupComplete
}: DocumentCleanupPanelProps) {
  const { isCleaningUp, lastCleanupResult, cleanupProductDocuments, cleanupCompanyDocuments } = useDocumentCleanup();
  const [showDetails, setShowDetails] = useState(false);

  const handleCleanup = async () => {
    let result: CleanupResult;
    
    if (productId) {
      result = await cleanupProductDocuments(productId);
    } else {
      result = await cleanupCompanyDocuments(companyId);
    }
    
    if (result.success && onCleanupComplete) {
      onCleanupComplete();
    }
  };

  const getStatusIcon = (result: CleanupResult | null) => {
    if (!result) return <Wrench className="h-4 w-4" />;
    if (result.success && result.duplicatesRemoved === 0 && result.orphansFixed === 0) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusText = (result: CleanupResult | null) => {
    if (!result) return "Ready for cleanup";
    if (result.success && result.duplicatesRemoved === 0 && result.orphansFixed === 0) {
      return "No issues found";
    }
    if (result.success) {
      return `Cleaned: ${result.duplicatesRemoved} duplicates, ${result.orphansFixed} orphans`;
    }
    return `Failed: ${result.errors.length} errors`;
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {getStatusIcon(lastCleanupResult)}
            Document Cleanup & Prevention
          </div>
          <Button
            onClick={handleCleanup}
            disabled={isCleaningUp}
            variant="outline"
            size="sm"
            className="bg-orange-100 border-orange-300 hover:bg-orange-200"
          >
            {isCleaningUp ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Cleaning...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                Run Cleanup
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status Summary */}
        <div className="flex items-center justify-between p-2 bg-white rounded border">
          <span className="text-sm text-muted-foreground">Status:</span>
          <span className="text-sm font-medium">{getStatusText(lastCleanupResult)}</span>
        </div>

        {/* Last Cleanup Results */}
        {lastCleanupResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Cleanup Results</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="h-6 px-2 text-xs"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>

            <div className="flex gap-2">
              {lastCleanupResult.duplicatesRemoved > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <Trash2 className="h-3 w-3 mr-1" />
                  {lastCleanupResult.duplicatesRemoved} duplicates removed
                </Badge>
              )}
              {lastCleanupResult.orphansFixed > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {lastCleanupResult.orphansFixed} orphans fixed
                </Badge>
              )}
              {lastCleanupResult.errors.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {lastCleanupResult.errors.length} errors
                </Badge>
              )}
            </div>

            {/* Detailed Results */}
            {showDetails && (
              <div className="space-y-2 text-xs">
                {lastCleanupResult.details.map((detail, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-muted-foreground">
                      {detail.action.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{detail.documentName}</span>
                      <Badge variant="outline" className="text-xs">
                        {detail.count}
                      </Badge>
                    </div>
                  </div>
                ))}

                {lastCleanupResult.errors.map((error, index) => (
                  <div key={index} className="p-2 bg-red-50 text-red-700 rounded border border-red-200 text-xs">
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cleanup Features */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Removes duplicate document instances</div>
          <div>• Fixes orphaned documents with missing company IDs</div>
          <div>• Cleans up lifecycle phase inconsistencies</div>
          <div>• Prevents future duplicates during creation</div>
        </div>
      </CardContent>
    </Card>
  );
}
