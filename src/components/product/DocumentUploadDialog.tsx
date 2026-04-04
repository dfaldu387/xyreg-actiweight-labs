
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseName: string;
  documentName: string;
}

// Sample data - would be replaced with real data from an API
const MOCK_APPROVERS = [
  { id: "1", name: "Jane Smith", role: "QA Manager" },
  { id: "2", name: "John Doe", role: "Regulatory Affairs" },
  { id: "3", name: "Maria Rodriguez", role: "Clinical Director" },
  { id: "4", name: "David Chen", role: "Technical Lead" },
];

export function DocumentUploadDialog({
  open,
  onOpenChange,
  phaseName,
  documentName
}: DocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [customApprover, setCustomApprover] = useState("");
  
  // Get the latest version - in a real app, this would come from an API
  const latestVersion = "1.0"; // Mock latest version
  
  useEffect(() => {
    if (open) {
      // When dialog opens, reset state and set default values
      setFile(null);
      setVersion(`${parseInt(latestVersion) + 0.1}`);
      setChangelog("");
      
      // Pre-fill approvers based on document settings
      // In a real implementation, this would be fetched from settings
      setSelectedApprovers(["1", "2"]); // Default approvers
    }
  }, [open, latestVersion]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const toggleApprover = (approverId: string) => {
    setSelectedApprovers(prev => 
      prev.includes(approverId)
        ? prev.filter(id => id !== approverId)
        : [...prev, approverId]
    );
  };
  
  const addCustomApprover = () => {
    if (customApprover.trim()) {
      // In a real app, you would add the approver to the database
      // For now, we'll just show a toast
      toast.success(`Added custom approver: ${customApprover}`);
      setCustomApprover("");
    }
  };
  
  const handleSubmit = () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    
    if (selectedApprovers.length === 0) {
      toast.error("Please select at least one approver");
      return;
    }
    
    // In a real app, you would upload the file and create the version
    toast.success(`Uploaded ${documentName} v${version} to ${phaseName} phase`);
    
    // Simulate notifications
    selectedApprovers.forEach(id => {
      const approver = MOCK_APPROVERS.find(a => a.id === id);
      toast(`Notification sent to ${approver?.name}`);
    });
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new version of {documentName} for the {phaseName} phase.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Document File</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-center">
              {file ? (
                <div className="w-full">
                  <div className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Drag and drop or click to upload</p>
                    <p className="text-xs text-muted-foreground">Supports PDF, Word, and Excel files</p>
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    Select File
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Version Number */}
          <div className="space-y-2">
            <Label htmlFor="version">Version Number</Label>
            <Input
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.1"
            />
            <p className="text-xs text-muted-foreground">
              Current version: {latestVersion}. Leave blank to auto-increment.
            </p>
          </div>
          
          {/* Change Log */}
          <div className="space-y-2">
            <Label htmlFor="changelog">Change Log</Label>
            <Textarea
              id="changelog"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="Describe the changes made in this version..."
              rows={3}
            />
          </div>
          
          {/* Approvers */}
          <div className="space-y-2">
            <Label>Approvers</Label>
            <div className="border rounded-md p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Select who needs to approve this document.
              </p>
              
              {/* Predefined Approvers */}
              <div className="space-y-2">
                {MOCK_APPROVERS.map(approver => (
                  <div key={approver.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`approver-${approver.id}`} 
                      checked={selectedApprovers.includes(approver.id)}
                      onCheckedChange={() => toggleApprover(approver.id)}
                    />
                    <Label 
                      htmlFor={`approver-${approver.id}`}
                      className="flex items-center cursor-pointer"
                    >
                      <span>{approver.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{approver.role}</Badge>
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* Add Custom Approver */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <Input
                  placeholder="Add approver by email..."
                  value={customApprover}
                  onChange={(e) => setCustomApprover(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addCustomApprover}
                  disabled={!customApprover.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file}>
            <Upload className="h-4 w-4 mr-2" />
            Upload and Notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
