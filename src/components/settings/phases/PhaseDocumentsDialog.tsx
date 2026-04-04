
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus } from "lucide-react";

interface PhaseDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseId: string | null;
  phaseName: string | null;
}

export function PhaseDocumentsDialog({
  open,
  onOpenChange,
  phaseId,
  phaseName
}: PhaseDocumentsDialogProps) {
  const [documents, setDocuments] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (phaseId && open) {
      // Load documents for this phase
      // This is a placeholder - implement actual document loading
      setDocuments([]);
    }
  }, [phaseId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Documents for {phaseName}</DialogTitle>
          <DialogDescription>
            View and manage all documents associated with the {phaseName} phase.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Phase Documents</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Document
            </Button>
          </div>
          
          {documents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents</h3>
                <p className="text-muted-foreground">
                  No documents have been added to this phase yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{doc.name}</CardTitle>
                      <Badge variant="outline">{doc.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
