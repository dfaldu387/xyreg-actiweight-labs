
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MultiLevelPermissionsDialog } from "./MultiLevelPermissionsDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface PermissionsTableProps {
  users: any[];
  onUpdatePermissions: (userId: number, permissions: any) => void;
  onRemoveUser: (userId: number) => void;
}

export function PermissionsTable({ users, onUpdatePermissions, onRemoveUser }: PermissionsTableProps) {
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">User</TableHead>
            <TableHead>Access Levels</TableHead>
            <TableHead>Companies</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.accessLevels.map((level: string) => (
                    <Badge key={level} variant="outline">{level}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.companies.map((company: string) => (
                    <Badge key={company} variant="outline">{company}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.products.map((product: string) => (
                    <Badge key={product} variant="outline">{product}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.documents.map((document: string) => (
                    <Badge key={document} variant="outline">{document}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setEditingUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    {editingUser?.id === user.id && (
                      <MultiLevelPermissionsDialog
                        open={true}
                        onOpenChange={(open) => !open && setEditingUser(null)}
                        userId={user.id.toString()}
                        userName={user.name}
                        initialCompanyAccess={user.permissions.companies}
                        initialProductAccess={{}}
                        onSave={(companyIds, productAccess) => {
                          onUpdatePermissions(user.id, { companyIds, productAccess });
                          setEditingUser(null);
                        }}
                      />
                    )}
                  </Dialog>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onRemoveUser(user.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
