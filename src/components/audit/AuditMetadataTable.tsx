
import { useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AuditMetadata } from "@/types/audit";

interface AuditMetadataTableProps {
  auditMetadata: AuditMetadata[];
  onSelectAudit: (auditType: string) => void;
}

export function AuditMetadataTable({ auditMetadata, onSelectAudit }: AuditMetadataTableProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Available Audit Types</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Audit Type</TableHead>
              <TableHead>Lifecycle Phase</TableHead>
              <TableHead>Auditor Type</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Applies To</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Suggested Documents</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditMetadata.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No matching audit types found
                </TableCell>
              </TableRow>
            ) : (
              auditMetadata.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium">{audit.audit_type}</TableCell>
                  <TableCell>{audit.lifecycle_phase || "N/A"}</TableCell>
                  <TableCell>{audit.auditor_type || "N/A"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={audit.purpose || ""}>
                    {audit.purpose || "N/A"}
                  </TableCell>
                  <TableCell>{audit.applies_to || "All"}</TableCell>
                  <TableCell>{audit.duration || "N/A"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={audit.suggested_documents || ""}>
                    {audit.suggested_documents || "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSelectAudit(audit.audit_type)}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Audit
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add a new audit of this type</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
