import React, { useState } from 'react';
import { FileKey, Plus, Eye, Trash2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal } from 'lucide-react';
import { useDataRooms } from '@/hooks/useDataRooms';
import { useDataRoomAccess } from '@/hooks/useDataRoomAccess';
import { useDataRoomActivityLog } from '@/hooks/useDataRoomActivityLog';
import { DataRoomWizard } from './DataRoomWizard';
import { DataRoom } from '@/types/dataRoom';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface DataRoomManagerProps {
  companyId: string;
  disabled?: boolean;
}

export function DataRoomManager({ companyId, disabled = false }: DataRoomManagerProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<DataRoom | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const { lang } = useTranslation();
  const { dataRooms, isLoading, deleteDataRoom, activateDataRoom } = useDataRooms(companyId);

  // Get stats
  const activeRooms = dataRooms.filter(r => r.status === 'active').length;
  const draftRooms = dataRooms.filter(r => r.status === 'draft').length;

  // Get total active investors across all rooms
  const totalActiveInvestors = dataRooms.reduce((sum, room) => {
    // This would need to be fetched properly, for now using 0
    return sum;
  }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">{lang('commercial.investors.dataRoom.statusActive')}</Badge>;
      case 'draft':
        return <Badge variant="secondary">{lang('commercial.investors.dataRoom.statusDraft')}</Badge>;
      case 'archived':
        return <Badge variant="outline">{lang('commercial.investors.dataRoom.statusArchived')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleDelete = (id: string) => {
    if (disabled) return;
    setRoomToDelete(id);
    setDeleteDialogOpen(true);
    setOpenDropdownId(null);
  };

  const confirmDelete = () => {
    if (disabled) return;
    if (roomToDelete) {
      deleteDataRoom(roomToDelete);
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  const handleEdit = (room: DataRoom) => {
    if (disabled) return;
    setSelectedRoom(room);
    setShowWizard(true);
    setOpenDropdownId(null);
  };

  const handleActivate = (id: string) => {
    if (disabled) return;
    activateDataRoom(id);
    setOpenDropdownId(null);
  };

  const handleCreateRoom = () => {
    if (disabled) return;
    setSelectedRoom(null);
    setShowWizard(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-end">
        <Button onClick={handleCreateRoom} disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          {lang('commercial.investors.dataRoom.createButton')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('commercial.investors.dataRoom.activeDataRooms')}</CardTitle>
            <FileKey className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRooms}</div>
            <p className="text-xs text-muted-foreground">
              {draftRooms} {lang('commercial.investors.dataRoom.inDraft')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('commercial.investors.dataRoom.activeInvestors')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveInvestors}</div>
            <p className="text-xs text-muted-foreground">
              {lang('commercial.investors.dataRoom.withActiveAccess')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('commercial.investors.dataRoom.totalDataRooms')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataRooms.length}</div>
            <p className="text-xs text-muted-foreground">
              {lang('commercial.investors.dataRoom.allTimeCreated')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('commercial.investors.dataRoom.dataRooms')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{lang('commercial.investors.dataRoom.loading')}</div>
            </div>
          ) : dataRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileKey className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{lang('commercial.investors.dataRoom.noRoomsYet')}</h3>
              <p className="text-muted-foreground mb-4">
                {lang('commercial.investors.dataRoom.createFirstRoom')}
              </p>
              <Button onClick={handleCreateRoom} disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                {lang('commercial.investors.dataRoom.createButton')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang('commercial.investors.dataRoom.name')}</TableHead>
                  <TableHead>{lang('commercial.investors.dataRoom.status')}</TableHead>
                  <TableHead>{lang('commercial.investors.dataRoom.investors')}</TableHead>
                  <TableHead>{lang('commercial.investors.dataRoom.created')}</TableHead>
                  <TableHead className="text-right">{lang('commercial.investors.dataRoom.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{getStatusBadge(room.status)}</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>
                      {format(new Date(room.created_at), 'MMM d, yyyy')}
                    </TableCell>
                     <TableCell className="text-right">
                       <DropdownMenu
                         open={openDropdownId === room.id}
                         onOpenChange={(open) => !disabled && setOpenDropdownId(open ? room.id : null)}
                       >
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="sm" disabled={disabled}>
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleEdit(room)}>
                             <Eye className="h-4 w-4 mr-2" />
                             {lang('commercial.investors.dataRoom.viewEdit')}
                           </DropdownMenuItem>
                           {room.status === 'draft' && (
                             <DropdownMenuItem onClick={() => handleActivate(room.id)}>
                               <CheckCircle className="h-4 w-4 mr-2" />
                               {lang('commercial.investors.dataRoom.activate')}
                             </DropdownMenuItem>
                           )}
                           <DropdownMenuItem
                             onClick={() => handleDelete(room.id)}
                             className="text-destructive"
                           >
                             <Trash2 className="h-4 w-4 mr-2" />
                             {lang('commercial.investors.dataRoom.archive')}
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

       {/* Wizard Dialog */}
       <DataRoomWizard
         open={showWizard}
         onOpenChange={(open) => {
           setShowWizard(open);
           if (!open) {
             setSelectedRoom(null);
             setOpenDropdownId(null);
           }
         }}
         companyId={companyId}
         dataRoom={selectedRoom}
       />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setRoomToDelete(null);
            setOpenDropdownId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('commercial.investors.dataRoom.archiveDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('commercial.investors.dataRoom.archiveDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('commercial.investors.dataRoom.archiveDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {lang('commercial.investors.dataRoom.archiveDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
