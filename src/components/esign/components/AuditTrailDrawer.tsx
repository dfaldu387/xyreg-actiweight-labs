import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Filter, Loader2 } from 'lucide-react';
import { ESignService } from '../lib/esign.service';
import { AUDIT_ACTIONS } from '../lib/esign.constants';
import type { AuditLogEntry } from '../lib/esign.types';

interface AuditTrailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
}

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  request_created: { label: 'Request Created', variant: 'outline' },
  document_viewed: { label: 'Document Viewed', variant: 'secondary' },
  signer_authenticated: { label: 'Authenticated', variant: 'default' },
  signature_applied: { label: 'Signature Applied', variant: 'default' },
  signature_rejected: { label: 'Signature Rejected', variant: 'destructive' },
  request_completed: { label: 'Request Completed', variant: 'default' },
  request_voided: { label: 'Request Voided', variant: 'destructive' },
  hash_mismatch_detected: { label: 'Hash Mismatch', variant: 'destructive' },
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function AuditTrailDrawer({ open, onOpenChange, documentId, documentName }: AuditTrailDrawerProps) {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch audit log when drawer opens
  useEffect(() => {
    if (open && documentId) {
      setIsLoading(true);
      ESignService.getAuditLog(documentId)
        .then(setAuditLog)
        .catch(err => {
          console.error('[ESign] Failed to fetch audit log:', err);
          setAuditLog([]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, documentId]);

  const filteredLog = actionFilter === 'all'
    ? auditLog
    : auditLog.filter(entry => entry.action === actionFilter);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl z-[60]">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Audit Trail
          </SheetTitle>
          <SheetDescription>
            Immutable audit log for "{documentName}" — Read-only, append-only per 21 CFR Part 11
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.values(AUDIT_ACTIONS).map(action => (
                <SelectItem key={action} value={action}>
                  {ACTION_LABELS[action]?.label || action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredLog.length} entries
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading audit trail...</span>
          </div>
        ) : filteredLog.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No audit trail entries found.
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLog.map(entry => {
                  const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, variant: 'outline' as const };
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs font-mono whitespace-nowrap">
                        {formatDateTime(entry.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.user_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionInfo.variant} className="text-xs">
                          {actionInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {entry.ip_address || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {Object.entries(entry.metadata).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
