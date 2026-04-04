import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserWithRole } from "@/types/company";

interface AddUserDialogProps {
  onAddUser: (user: UserWithRole) => void;
}

export function AddUserDialog({ onAddUser }: AddUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Viewer");
  const [isExternal, setIsExternal] = useState(false);
  const [companyAccess, setCompanyAccess] = useState<'single' | 'multi'>('single');
  const [functionalArea, setFunctionalArea] = useState("");
  const [externalRole, setExternalRole] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !role) {
      return;
    }
    
    // Create the UserWithRole object with all required properties
    const newUser: UserWithRole = {
      id: "temp-id", // This will be overwritten in HierarchicalPermissions
      name,
      email,
      role,
      isExternal,
      companyAccess,
      functionalArea: isExternal ? undefined : functionalArea,
      externalRole: isExternal ? externalRole : undefined,
      // Set default avatar
      avatar: "/lovable-uploads/02014fd0-fa08-4991-8c74-927898d5ef28.png",
      permissions: {
        companies: [],
        products: [],
        documents: [],
        accessLevels: ["View"]
      }
    };
    
    onAddUser(newUser);
    
    // Reset form
    setName("");
    setEmail("");
    setRole("Viewer");
    setIsExternal(false);
    setCompanyAccess('single');
    setFunctionalArea("");
    setExternalRole("");
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add User</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role" className="text-right">
            Role
          </Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Viewer">Viewer</SelectItem>
              <SelectItem value="Editor">Editor</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              {/* Add more roles as needed */}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="companyAccess" className="text-right">
            Company Access
          </Label>
          <Select value={companyAccess} onValueChange={(value) => setCompanyAccess(value as 'single' | 'multi')}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select access type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="multi">Multi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="isExternal" className="text-right">
            External
          </Label>
          <Input
            type="checkbox"
            id="isExternal"
            checked={isExternal}
            onChange={(e) => setIsExternal(e.target.checked)}
            className="col-span-3"
          />
        </div>
        
        {/* Conditional Category Selection */}
        {!isExternal && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="functionalArea" className="text-right">
              Department
            </Label>
            <Select value={functionalArea} onValueChange={setFunctionalArea}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="R&D - Software">R&D - Software</SelectItem>
                <SelectItem value="R&D - Hardware/Engineering">R&D - Hardware/Engineering</SelectItem>
                <SelectItem value="R&D - Materials Science">R&D - Materials Science</SelectItem>
                <SelectItem value="Quality Assurance (QA)">Quality Assurance (QA)</SelectItem>
                <SelectItem value="Regulatory Affairs (RA)">Regulatory Affairs (RA)</SelectItem>
                <SelectItem value="Clinical Affairs">Clinical Affairs</SelectItem>
                <SelectItem value="Manufacturing/Operations">Manufacturing/Operations</SelectItem>
                <SelectItem value="Marketing & Labeling">Marketing & Labeling</SelectItem>
                <SelectItem value="Management/Executive">Management/Executive</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {isExternal && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="externalRole" className="text-right">
              Role
            </Label>
            <Select value={externalRole} onValueChange={setExternalRole}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Consultant">Consultant</SelectItem>
                <SelectItem value="Auditor">Auditor</SelectItem>
                <SelectItem value="Contract Manufacturer">Contract Manufacturer</SelectItem>
                <SelectItem value="Distributor">Distributor</SelectItem>
                <SelectItem value="Key Opinion Leader (KOL)">Key Opinion Leader (KOL)</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form>
      <DialogFooter>
        <Button type="submit">Add User</Button>
      </DialogFooter>
    </DialogContent>
  );
}
