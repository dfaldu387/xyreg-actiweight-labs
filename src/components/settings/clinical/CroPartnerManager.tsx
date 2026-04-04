import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { useCroPartners, CroPartner } from '@/hooks/useCroPartners';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CroPartnerDialog } from './CroPartnerDialog';
import { useTranslation } from '@/hooks/useTranslation';
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

interface CroPartnerManagerProps {
  companyId: string;
}

export function CroPartnerManager({ companyId }: CroPartnerManagerProps) {
  const { lang } = useTranslation();
  const { partners, isLoading, deletePartner, togglePreferred } = useCroPartners(companyId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<CroPartner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPartner, setDeletingPartner] = useState<CroPartner | null>(null);

  const handleEdit = (partner: CroPartner) => {
    setEditingPartner(partner);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPartner(null);
    setDialogOpen(true);
  };

  const handleDelete = (partner: CroPartner) => {
    setDeletingPartner(partner);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingPartner) {
      await deletePartner(deletingPartner.id);
      setDeleteDialogOpen(false);
      setDeletingPartner(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground mb-4">
          {lang('companyClinical.croPartners.noPartners')}
        </p>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {lang('companyClinical.croPartners.addPartner')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {lang('companyClinical.croPartners.addPartner')}
        </Button>
      </div>
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.croPartners.headers.croName')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.croPartners.headers.contactPerson')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.croPartners.headers.email')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.croPartners.headers.specialties')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.croPartners.headers.preferred')}</th>
              <th className="px-4 py-3 text-right text-sm font-medium">{lang('companyClinical.croPartners.headers.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {partners.map((partner) => (
              <tr key={partner.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <span className="font-medium">{partner.name}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {partner.contact_person || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {partner.email || '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {partner.specialty_areas.map((specialty, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePreferred(partner.id, !partner.is_preferred)}
                  >
                    <Star
                      className={`h-4 w-4 ${partner.is_preferred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                    />
                  </Button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(partner)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(partner)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CroPartnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partner={editingPartner}
        companyId={companyId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('companyClinical.croPartners.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('companyClinical.croPartners.deleteDialog.description').replace('{{name}}', deletingPartner?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{lang('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
