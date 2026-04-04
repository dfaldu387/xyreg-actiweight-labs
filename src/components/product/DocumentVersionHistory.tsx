
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Check, X, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DocumentViewer } from "./DocumentViewer";
import { useCompanyRole } from "@/context/CompanyRoleContext";

interface DocumentVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  companyId: string;
}

// Sample data - would be replaced with real API data
const mockVersions = [
  {
    version: "2.1",
    status: "Approved",
    uploadDate: "2025-04-18",
    uploadedBy: "Sarah Johnson",
    isActive: true,
    approvalDate: "2025-04-20",
    changelog: "Updated to include new risk mitigation strategies",
    approvers: [
      { name: "John Doe", role: "Regulatory Affairs", status: "Approved", date: "2025-04-19" },
      { name: "Jane Smith", role: "QA Manager", status: "Approved", date: "2025-04-20" }
    ]
  },
  {
    version: "2.0",
    status: "Approved",
    uploadDate: "2025-04-10",
    uploadedBy: "Sarah Johnson",
    isActive: false,
    approvalDate: "2025-04-12",
    changelog: "Major update to comply with new regulatory requirements",
    approvers: [
      { name: "John Doe", role: "Regulatory Affairs", status: "Approved", date: "2025-04-11" },
      { name: "Jane Smith", role: "QA Manager", status: "Approved", date: "2025-04-12" }
    ]
  },
  {
    version: "1.1",
    status: "Rejected",
    uploadDate: "2025-03-28",
    uploadedBy: "David Chen",
    isActive: false,
    approvers: [
      { name: "John Doe", role: "Regulatory Affairs", status: "Rejected", date: "2025-03-29", comment: "Missing critical information about risk classification" },
      { name: "Jane Smith", role: "QA Manager", status: "Pending" }
    ]
  },
  {
    version: "1.0",
    status: "Approved",
    uploadDate: "2025-03-15",
    uploadedBy: "David Chen",
    isActive: false,
    approvalDate: "2025-03-17",
    changelog: "Initial version",
    approvers: [
      { name: "John Doe", role: "Regulatory Affairs", status: "Approved", date: "2025-03-16" },
      { name: "Jane Smith", role: "QA Manager", status: "Approved", date: "2025-03-17" }
    ]
  }
];

export function DocumentVersionHistory({ 
  open, 
  onOpenChange, 
  documentName,
  companyId 
}: DocumentVersionHistoryProps) {
  const { activeRole } = useCompanyRole();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);

  const handleViewDocument = (version: string) => {
    setSelectedVersion(version);
    setDocumentViewerOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and download previous versions of {documentName}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead>Approvers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockVersions.map((version) => (
                  <TableRow 
                    key={version.version}
                    className={cn(version.isActive && "bg-muted/40")}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        v{version.version}
                        {version.isActive && (
                          <Badge variant="outline" className="ml-1">Active</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          version.status === "Approved" ? "bg-success text-success-foreground" : 
                          version.status === "Rejected" ? "bg-destructive text-destructive-foreground" :
                          "bg-warning text-warning-foreground"
                        )}
                      >
                        {version.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          <span>Uploaded: {version.uploadDate}</span>
                        </div>
                        {version.approvalDate && (
                          <div className="flex items-center gap-1 text-xs mt-1">
                            <Check className="h-3 w-3" />
                            <span>Approved: {version.approvalDate}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{version.uploadedBy}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {version.approvers.map((approver, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-xs">
                            {approver.status === "Approved" ? (
                              <Check className="h-3 w-3 text-success" />
                            ) : approver.status === "Rejected" ? (
                              <X className="h-3 w-3 text-destructive" />
                            ) : (
                              <div className="h-3 w-3 rounded-full bg-warning" />
                            )}
                            <span>{approver.name}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDocument(version.version)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {selectedVersion && (
        <DocumentViewer 
          open={documentViewerOpen}
          onOpenChange={setDocumentViewerOpen}
          documentId={`${documentName} v${selectedVersion}`}
          documentName={`${documentName} v${selectedVersion}`}
          companyId={companyId}
          documentFile={null}
          companyRole={activeRole}
          reviewerGroupId="default"
        />
      )}
    </>
  );
}
