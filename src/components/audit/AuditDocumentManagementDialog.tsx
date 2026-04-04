
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileText, Upload, Link, Download, Eye, Trash2, Plus } from "lucide-react";

interface AuditDocument {
  id: string;
  name: string;
  type: "uploaded" | "linked";
  size?: string;
  uploadDate: string;
  url?: string;
}

interface AuditDocumentManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditName: string;
  auditId: string;
}

export function AuditDocumentManagementDialog({
  open,
  onOpenChange,
  auditName,
  auditId
}: AuditDocumentManagementDialogProps) {
  const [documents, setDocuments] = useState<AuditDocument[]>([
    {
      id: "1",
      name: "Audit Checklist.pdf",
      type: "uploaded",
      size: "245 KB",
      uploadDate: "2025-05-20"
    },
    {
      id: "2", 
      name: "Risk Management File.docx",
      type: "linked",
      uploadDate: "2025-05-18"
    }
  ]);

  const [linkDocumentName, setLinkDocumentName] = useState("");

  const handleUploadDocument = () => {
    // Implementation for file upload
    // console.log("Upload document clicked");
  };

  const handleLinkDocument = () => {
    if (linkDocumentName.trim()) {
      const newDoc: AuditDocument = {
        id: Date.now().toString(),
        name: linkDocumentName,
        type: "linked",
        uploadDate: new Date().toISOString().split('T')[0]
      };
      setDocuments([...documents, newDoc]);
      setLinkDocumentName("");
    }
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Management - {auditName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="manage" className="w-full">
            <TabsList>
              <TabsTrigger value="manage">Manage Documents</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
              <TabsTrigger value="link">Link Existing</TabsTrigger>
            </TabsList>

            <TabsContent value="manage" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Associated Documents</h4>
                    <Badge variant="secondary">{documents.length} documents</Badge>
                  </div>
                  
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents associated with this audit yet.</p>
                      <p className="text-sm">Use the "Upload New" or "Link Existing" tabs to add documents.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {doc.type === "uploaded" ? "Uploaded" : "Linked"}
                                </Badge>
                                {doc.size && <span>{doc.size}</span>}
                                <span>Added: {doc.uploadDate}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" title="View document">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Download document">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Remove document"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Upload New Documents</h4>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
                      </p>
                      <Button onClick={handleUploadDocument}>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="link" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Link Existing Documents</h4>
                    <p className="text-sm text-muted-foreground">
                      Link documents that already exist in the system to this audit.
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="linkDocument">Document Name</Label>
                        <Input
                          id="linkDocument"
                          value={linkDocumentName}
                          onChange={(e) => setLinkDocumentName(e.target.value)}
                          placeholder="Enter document name or search existing documents"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleLinkDocument} disabled={!linkDocumentName.trim()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Link Document
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Available Documents</h5>
                      <div className="max-h-40 overflow-y-auto border rounded p-3 space-y-2">
                        {["Technical File v2.1.pdf", "Risk Assessment Report.docx", "Clinical Evaluation Plan.pdf", "Usability Study Results.xlsx"].map((docName) => (
                          <div key={docName} className="flex items-center justify-between text-sm">
                            <span>{docName}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setLinkDocumentName(docName)}
                            >
                              Select
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
