import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
interface ArchiveCompanyDialogProps {
  companyId: string;
  companyName: string;
  onArchived?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
}
export function ArchiveCompanyDialog({
  companyId,
  companyName,
  onArchived,
  variant = "outline"
}: ArchiveCompanyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { lang } = useTranslation();
  const handleArchive = async () => {
    if (!user?.id) {
      toast({
        title: lang('companyDashboard.authenticationError'),
        description: lang('companyDashboard.mustBeLoggedIn'),
        variant: "destructive"
      });
      return;
    }
    try {
      setIsArchiving(true);
      const { error } = await supabase.from('companies').update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: user.id
      }).eq('id', companyId);
      if (error) throw error;
      toast({
        title: lang('companyDashboard.companyArchived'),
        description: `${companyName} ${lang('companyDashboard.companyArchivedDescription')}`
      });

      // Invalidate relevant queries to refresh data - use predicate to catch all query key variations
      await queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'simple-clients-fixed'
      });
      await queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'simple-clients'
      });
      await queryClient.invalidateQueries({
        queryKey: ['company-products']
      });
      await queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'client-compass-companies'
      });
      setIsOpen(false);
      if (onArchived) {
        onArchived();
      } else {
        // Navigate back to clients page if no callback provided
        navigate("/app/clients");
      }
    } catch (error: any) {
      toast({
        title: lang('common.error'),
        description: `${lang('companyDashboard.failedToArchive')}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsArchiving(false);
    }
  };
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} className="flex items-center gap-2">
          <Archive className="h-4 w-4" />
          {lang('companyDashboard.archiveCompanyTitle')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{lang('companyDashboard.archiveCompanyTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {lang('companyDashboard.archiveCompanyConfirmation')} <strong>{companyName}</strong>? {lang('companyDashboard.archiveCompanyDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault();
              handleArchive();
            }}
            disabled={isArchiving}
          >
            {isArchiving ? lang('companyDashboard.archiving') : lang('companyDashboard.archive')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}