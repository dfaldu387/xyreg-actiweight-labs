import { useState, useEffect } from "react";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Archive, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { BomService } from "@/services/bomService";
import type { BomRevision } from "@/types/bom";

export function ArchivedBomRevisions() {
  const [revisions, setRevisions] = useState<BomRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingRestore, setConfirmingRestore] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchArchived = async () => {
    try {
      setLoading(true);
      const data = await BomService.getArchivedRevisions();
      setRevisions(data);
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to load archived BOM revisions: ${error.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArchived(); }, []);

  const handleRestore = async (id: string) => {
    try {
      await BomService.restoreRevision(id);
      toast({ title: "Revision Restored", description: "The BOM revision has been restored." });
      fetchArchived();
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to restore revision: ${error.message}`, variant: "destructive" });
    }
    setConfirmingRestore(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Archived BOM Revisions</h2>
        <Button variant="outline" size="sm" onClick={fetchArchived}>Refresh</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : revisions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Archive className="mx-auto h-12 w-12 mb-2 opacity-20" />
          <p>No archived BOM revisions found</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Revision</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Archived Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revisions.map((rev) => (
                <TableRow key={rev.id}>
                  <TableCell className="font-mono font-semibold">Rev {rev.revision}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rev.status}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{rev.currency} {rev.total_cost.toFixed(2)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{rev.description || '—'}</TableCell>
                  <TableCell>
                    {rev.archived_at ? format(new Date(rev.archived_at), 'PPP') : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmingRestore(rev.id)} title="Restore revision">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!confirmingRestore} onOpenChange={() => setConfirmingRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore BOM Revision</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the BOM revision, making it visible again in the device's BOM list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmingRestore && handleRestore(confirmingRestore)}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
