
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MultiLevelPermissionsDialog } from "@/components/permissions/MultiLevelPermissionsDialog";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserPermissionsProps {
  user: any;
  onUpdatePermissions: (permissions: any) => void;
  onRemove: () => void;
}

export function UserPermissions({ user, onUpdatePermissions, onRemove }: UserPermissionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handlePermissionsUpdate = (companyIds: string[], productAccess: Record<string, string[]>) => {
    onUpdatePermissions({ companyIds, productAccess });
    setDialogOpen(false);
  };
  
  // Color mappings for badges
  const getCompanyBadgeColor = () => "bg-blue-100 text-blue-800";
  const getProductBadgeColor = () => "bg-purple-100 text-purple-800";
  const getDocumentBadgeColor = () => "bg-green-100 text-green-800";
  const getAccessLevelBadgeColor = (level: string) => {
    switch(level) {
      case "View": return "bg-gray-100 text-gray-800";
      case "Edit": return "bg-amber-100 text-amber-800";
      case "Approve": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-lg font-semibold">{user.name}</h4>
            <p className="text-sm text-muted-foreground">{user.email} • {user.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Permissions</Button>
            </DialogTrigger>
            <MultiLevelPermissionsDialog 
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              userId={user.id.toString()}
              userName={user.name}
              initialCompanyAccess={user.permissions?.companies || []}
              initialProductAccess={user.permissions?.productAccess || {}}
              onSave={handlePermissionsUpdate}
            />
          </Dialog>
          <Button variant="ghost" size="icon" onClick={onRemove} className="text-red-500 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium mb-1">Access Levels</h5>
            <div className="flex flex-wrap gap-1">
              {user.permissions?.accessLevels?.map((level: string) => (
                <Badge key={level} className={getAccessLevelBadgeColor(level)} variant="outline">{level}</Badge>
              )) || []}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium mb-1">Companies</h5>
            <div className="flex flex-wrap gap-1">
              {user.permissions?.companies?.map((company: string) => (
                <Badge key={company} className={getCompanyBadgeColor()} variant="outline">{company}</Badge>
              )) || []}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium mb-1">Products</h5>
            <div className="flex flex-wrap gap-1">
              {user.permissions?.products?.map((product: string) => (
                <Badge key={product} className={getProductBadgeColor()} variant="outline">{product}</Badge>
              )) || []}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium mb-1">Documents</h5>
            <div className="flex flex-wrap gap-1">
              {user.permissions?.documents?.map((document: string) => (
                <Badge key={document} className={getDocumentBadgeColor()} variant="outline">{document}</Badge>
              )) || []}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
