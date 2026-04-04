
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ArrowRightLeft } from "lucide-react";

interface PhaseManagementHeaderProps {
  onOpenCleanupDialog: () => void;
  onOpenTransferDialog: () => void;
  onOpenImportDialog: () => void;
}

export function PhaseManagementHeader({
  onOpenCleanupDialog,
  onOpenTransferDialog,
  onOpenImportDialog
}: PhaseManagementHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              Lifecycle Phase Management
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your company's development phases with dual numbering. Changes automatically sync document assignments.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onOpenCleanupDialog}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clean Up Duplicates
            </Button>
            <Button
              variant="outline"
              onClick={onOpenTransferDialog}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer Documents
            </Button>
            <Button
              onClick={onOpenImportDialog}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Phases
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
