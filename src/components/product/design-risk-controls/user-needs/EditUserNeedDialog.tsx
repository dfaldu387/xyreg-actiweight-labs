import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { EditUserNeedForm } from "./EditUserNeedForm";
import type { UserNeed, UpdateUserNeedRequest } from "./types";

interface EditUserNeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userNeed: UserNeed | null;
  onSave: (id: string, updates: UpdateUserNeedRequest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  companyId: string;
}

export function EditUserNeedDialog({
  open,
  onOpenChange,
  userNeed,
  onSave,
  onDelete,
  isLoading = false,
  disabled = false,
  companyId,
}: EditUserNeedDialogProps) {
  const { lang } = useTranslation();
  
  const handleOpenChange = (newOpen: boolean) => {
    if (disabled && newOpen) return;
    onOpenChange(newOpen);
  };
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Query for SYSRs that trace to this user need
  const { data: affectedRequirements = [] } = useQuery({
    queryKey: ['affected-reqs-for-un', userNeed?.user_need_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requirement_specifications')
        .select('requirement_id')
        .like('traces_to', `%${userNeed!.user_need_id}%`);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userNeed?.user_need_id,
  });

  if (!userNeed) return null;

  const handleSave = async (updates: UpdateUserNeedRequest) => {
    if (disabled) return;
    await onSave(userNeed.id, updates);
    handleOpenChange(false);
  };

  const handleDelete = async () => {
    if (disabled) return;
    await onDelete(userNeed.id);
    setShowDeleteDialog(false);
    handleOpenChange(false);
  };

  const handleCancel = () => {
    handleOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang('userNeeds.dialog.edit.title')}: {userNeed.user_need_id}</DialogTitle>
          </DialogHeader>
          <EditUserNeedForm
            userNeed={userNeed}
            onSave={handleSave}
            onDelete={() => {
              if (disabled) return;
              setShowDeleteDialog(true);
            }}
            onCancel={handleCancel}
            isLoading={isLoading}
            disabled={disabled}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {lang('userNeeds.dialog.delete.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang('userNeeds.dialog.delete.description').replace('{id}', userNeed.user_need_id)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {affectedRequirements.length > 0 && (
            <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800 mb-2">
                The following requirements will lose their traceability link:
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                {affectedRequirements.map((req) => (
                  <li key={req.requirement_id} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-orange-600 rounded-full" />
                    {req.requirement_id} → {userNeed.user_need_id}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {lang('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}