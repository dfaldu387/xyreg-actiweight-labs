
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, AlertTriangle } from "lucide-react";
import { PhaseCleanupDialog } from "./PhaseCleanupDialog";

interface DatabaseCleanupSectionProps {
  companyId: string;
  companyName: string;
}

export function DatabaseCleanupSection({ companyId, companyName }: DatabaseCleanupSectionProps) {
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Cleanup
          </CardTitle>
          <CardDescription>
            Resolve database inconsistencies and import issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-amber-800 mb-1">Common Issues Fixed:</div>
                <ul className="text-amber-700 space-y-1 list-disc list-inside">
                  <li>CSV import failures due to duplicate phase names</li>
                  <li>Inconsistent phase naming (with/without numbering)</li>
                  <li>Database constraint violations during imports</li>
                  <li>Orphaned documents and broken relationships</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Phase Database Cleanup</h4>
              <p className="text-sm text-muted-foreground">
                Clean up duplicate phases and ensure database consistency
              </p>
            </div>
            <Button 
              onClick={() => setIsCleanupDialogOpen(true)}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Database className="h-4 w-4 mr-2" />
              Run Cleanup
            </Button>
          </div>
        </CardContent>
      </Card>

      <PhaseCleanupDialog
        open={isCleanupDialogOpen}
        onOpenChange={setIsCleanupDialogOpen}
        companyId={companyId}
        companyName={companyName}
      />
    </>
  );
}
