
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductPermissionsDialog } from "@/components/permissions/ProductPermissionsDialog";
import { DocumentPermissionsDialog } from "@/components/permissions/DocumentPermissionsDialog";

const documents = [
  "Risk Management Plan",
  "GSPR Checklist",
  "IFU & Label",
  "Clinical Eval Rep."
];

interface UserPermissions {
  id: number;
  name: string;
  role: string;
  company: {
    view: boolean;
    edit: boolean;
    upload: boolean;
    requestReview: boolean;
  };
  product: {
    view: boolean;
    edit: boolean;
    upload: boolean;
    requestReview: boolean;
  };
  docs: {
    name: string;
    perms: {
      view: boolean;
      comment: boolean;
      upload: boolean;
      approve: boolean;
      shareComments: boolean;
    };
  }[];
}

export function PermissionsMatrix() {
  const [rows, setRows] = useState<UserPermissions[]>([
    {
      id: 1,
      name: "Alice (alice@xyreg.com)",
      role: "Admin",
      company: { view: true, edit: true, upload: true, requestReview: true },
      product: { view: true, edit: true, upload: true, requestReview: true },
      docs: documents.map(name => ({ name, perms: { view: true, comment: true, upload: true, approve: true, shareComments: true } })),
    },
    {
      id: 2,
      name: "Bob (bob@xyreg.com)",
      role: "Editor",
      company: { view: true, edit: true, upload: false, requestReview: false },
      product: { view: true, edit: false, upload: false, requestReview: false },
      docs: documents.map(name => ({ name, perms: { view: true, comment: true, upload: false, approve: false, shareComments: true } })),
    },
    {
      id: 3,
      name: "NB (nb@example.com)",
      role: "NB",
      company: { view: true, edit: false, upload: false, requestReview: true },
      product: { view: true, edit: false, upload: false, requestReview: true },
      docs: documents.map(name => ({ name, perms: { view: true, comment: false, upload: false, approve: false, shareComments: false } })),
    },
  ]);

  const toggleCompany = (id: number, key: keyof UserPermissions["company"]) => {
    setRows(rows.map(r => r.id === id ? { ...r, company: { ...r.company, [key]: !r.company[key] } } : r));
  };
  
  const toggleProduct = (id: number, key: keyof UserPermissions["product"]) => {
    setRows(rows.map(r => r.id === id ? { ...r, product: { ...r.product, [key]: !r.product[key] } } : r));
  };
  
  const toggleDoc = (rowId: number, docName: string, perm: keyof UserPermissions["docs"][number]["perms"]) => {
    setRows(rows.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        docs: r.docs.map(d => d.name === docName ? { ...d, perms: { ...d.perms, [perm]: !d.perms[perm] } } : d)
      };
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Permissions Matrix</h3>
        <Button>Add Stakeholder</Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="border-r">Stakeholder</TableHead>
              <TableHead rowSpan={2} className="border-r">Role</TableHead>
              <TableHead colSpan={4} className="text-center border-r">Company-Wide Permissions</TableHead>
              <TableHead rowSpan={2} className="text-center border-r">Product Permissions</TableHead>
              <TableHead rowSpan={2} className="text-center">Document Overrides</TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-center">View</TableHead>
              <TableHead className="text-center">Edit</TableHead>
              <TableHead className="text-center">Upload</TableHead>
              <TableHead className="text-center border-r">Request Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={r.company.view} 
                    onCheckedChange={() => toggleCompany(r.id, "view")}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={r.company.edit} 
                    onCheckedChange={() => toggleCompany(r.id, "edit")}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={r.company.upload} 
                    onCheckedChange={() => toggleCompany(r.id, "upload")}
                  />
                </TableCell>
                <TableCell className="text-center border-r">
                  <Checkbox 
                    checked={r.company.requestReview} 
                    onCheckedChange={() => toggleCompany(r.id, "requestReview")}
                  />
                </TableCell>
                <TableCell className="text-center border-r">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Select Products...</Button>
                    </DialogTrigger>
                    <ProductPermissionsDialog 
                      open={false}
                      onOpenChange={() => {}}
                      userId={r.id.toString()}
                      userName={r.name}
                      companyId="dummy-company-id"
                      companyName="Dummy Company"
                      initialProductAccess={[]}
                      onSave={(productIds) => {
                        // console.log('Product permissions updated:', productIds);
                      }}
                    />
                  </Dialog>
                </TableCell>
                <TableCell className="text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Select Documents...</Button>
                    </DialogTrigger>
                    <DocumentPermissionsDialog user={r} onUpdate={(updatedUser) => {
                      setRows(rows.map(row => row.id === updatedUser.id ? updatedUser : row));
                    }} />
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
