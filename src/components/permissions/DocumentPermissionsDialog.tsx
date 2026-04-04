
import { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DocumentPermissionsDialogProps {
  user: any;
  onUpdate: (updatedUser: any) => void;
}

export function DocumentPermissionsDialog({ user, onUpdate }: DocumentPermissionsDialogProps) {
  const [docPermissions, setDocPermissions] = useState(user.docs);

  const handlePermissionChange = (docName: string, permission: string, checked: boolean) => {
    setDocPermissions(docPermissions.map((doc: any) => 
      doc.name === docName 
        ? { ...doc, perms: { ...doc.perms, [permission]: checked } } 
        : doc
    ));
  };

  const handleSave = () => {
    const updatedUser = {
      ...user,
      docs: docPermissions
    };
    onUpdate(updatedUser);
  };

  return (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Document Permissions for {user.name}</DialogTitle>
      </DialogHeader>
      
      <div className="py-4 max-h-[60vh] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead className="text-center">View</TableHead>
              <TableHead className="text-center">Comment</TableHead>
              <TableHead className="text-center">Upload</TableHead>
              <TableHead className="text-center">Approve</TableHead>
              <TableHead className="text-center">Share Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docPermissions.map((doc: any) => (
              <TableRow key={doc.name}>
                <TableCell>{doc.name}</TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={doc.perms.view}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(doc.name, "view", checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={doc.perms.comment}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(doc.name, "comment", checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={doc.perms.upload}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(doc.name, "upload", checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={doc.perms.approve}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(doc.name, "approve", checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={doc.perms.shareComments}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(doc.name, "shareComments", checked as boolean)
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => onUpdate(user)}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  );
}
