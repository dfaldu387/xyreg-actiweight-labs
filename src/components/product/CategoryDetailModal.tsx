import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Paperclip, Plus } from "lucide-react";
import { getStatusColor } from "@/utils/statusUtils";
import { DocumentComments } from "./DocumentComments";
import { DocumentCommentInput } from "./DocumentCommentInput";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Comment {
  id?: string;  // Make id optional since our mock data doesn't include it
  author: string;
  comment: string;
  timestamp: string;
  text?: string;  // Add text field to satisfy DocumentComments component
  page?: number;  // Add page field to satisfy DocumentComments component
}

interface CategoryDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: {
    id: string;
    title: string;
    type: "certification" | "document" | "audit" | "gap";
    description?: string;
    status: string;
    data?: {
      date?: string;
      expiryDate?: string;
      dueDate?: string;
      standard?: string;
      issuer?: string;
      evidenceLinks?: string[];
      documents?: string[];
      comments?: Comment[];
      onAddDocument?: (document: string) => void;
      approvalStatus?: {
        overall: "Draft" | "Pending" | "Approved" | "Rejected";
        approvers: Array<{
          name: string;
          status: "Pending" | "Approved" | "Rejected";
          date?: string;
        }>;
      };
    };
  };
}

export function CategoryDetailModal({ 
  open, 
  onOpenChange,
  category 
}: CategoryDetailModalProps) {
  const [newComment, setNewComment] = useState("");
  const [newDocumentName, setNewDocumentName] = useState("");
  
  const handleAddComment = () => {
    if (newComment.trim()) {
      toast.success("Comment added");
      setNewComment("");
      // In a real app, this would send the comment to the backend
    }
  };
  
  const handleAddDocument = () => {
    if (newDocumentName.trim() && category.data?.onAddDocument) {
      category.data.onAddDocument(newDocumentName);
      setNewDocumentName("");
      toast.success(`Document "${newDocumentName}" added to ${category.title}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{category.title}</DialogTitle>
          <DialogDescription>
            {category.type === "certification" && "Certification details"}
            {category.type === "document" && "Document details"}
            {category.type === "audit" && "Audit details"}
            {category.type === "gap" && "Gap details"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(category.status)}>
              {category.status}
            </Badge>
            
            {category.data?.date && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{category.data.date}</span>
              </div>
            )}
            
            {category.data?.expiryDate && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Expires: {category.data.expiryDate}</span>
              </div>
            )}
            
            {category.data?.dueDate && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Due: {category.data.dueDate}</span>
              </div>
            )}
          </div>
          
          {/* Show standard and issuer for certifications */}
          {category.type === "certification" && category.data?.standard && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Standard: </span> 
                {category.data.standard}
              </div>
              {category.data.issuer && (
                <div className="text-sm">
                  <span className="font-medium">Issuing Body: </span> 
                  {category.data.issuer}
                </div>
              )}
            </div>
          )}
          
          {/* Approval Status Section */}
          {category.data?.approvalStatus && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Approval Status</h4>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Status:</span>
                  <Badge variant={
                    category.data.approvalStatus.overall === "Approved" ? "default" :
                    category.data.approvalStatus.overall === "Rejected" ? "destructive" :
                    category.data.approvalStatus.overall === "Pending" ? "secondary" : "outline"
                  }>
                    {category.data.approvalStatus.overall}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Approvers:</span>
                  <ul className="mt-1 space-y-1">
                    {category.data.approvalStatus.approvers.map((approver, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span>{approver.name}</span>
                        <div className="flex items-center gap-2">
                          {approver.date && (
                            <span className="text-xs text-muted-foreground">{approver.date}</span>
                          )}
                          <Badge variant={
                            approver.status === "Approved" ? "default" :
                            approver.status === "Rejected" ? "destructive" : "outline"
                          }>
                            {approver.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Evidence Links / Documents */}
          {(category.data?.evidenceLinks?.length || category.data?.documents?.length) ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Documents</h4>
              <ul className="space-y-2 text-sm">
                {category.data?.evidenceLinks?.map((link, index) => (
                  <li key={`evidence-${index}`} className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-primary" />
                    <span>{link}</span>
                  </li>
                ))}
                {category.data?.documents?.map((doc, index) => (
                  <li key={`doc-${index}`} className="flex items-center">
                    <Paperclip className="h-4 w-4 mr-2 text-primary" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          
          {/* Add Document section - available only for audits */}
          {category.type === "audit" && category.data?.onAddDocument && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Add Document</h4>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Document name"
                  value={newDocumentName}
                  onChange={(e) => setNewDocumentName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddDocument}
                  disabled={!newDocumentName.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          )}
          
          {/* Comments - Use new DocumentComments component without props */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Comments</h4>
            <DocumentComments documentId={category.id} reviewerGroupId="default" />
          </div>
          
          {/* Add Comment - Use new DocumentCommentInput component */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Add Comment</h4>
            <DocumentCommentInput documentId={category.id} />
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
