import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
interface ArchiveProductDialogProps {
  productId: string;
  productName: string;
  companyName?: string;
  onArchived?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
}
export function ArchiveProductDialog({
  productId,
  productName,
  companyName,
  onArchived,
  variant = "outline"
}: ArchiveProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const handleArchive = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to archive a product",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsArchiving(true);

      // Get company information if not provided
      let targetCompanyName = companyName;
      if (!targetCompanyName) {
        const {
          data: productData,
          error: productError
        } = await supabase.from('products').select(`
            company_id,
            companies!inner(name)
          `).eq('id', productId).single();
        if (productError) {
          console.error('Error fetching product company:', productError);
        } else {
          targetCompanyName = productData.companies.name;
        }
      }
      const {
        error
      } = await supabase.from('products').update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: user.id
      }).eq('id', productId);
      if (error) throw error;

      // Invalidate sidebar product list so archived device disappears immediately
      await queryClient.resetQueries({ queryKey: ['sidebarCompanyProducts'] });
      await queryClient.invalidateQueries({ queryKey: ['company-products'] });
      await queryClient.invalidateQueries({ queryKey: ['products-basic-udi'] });

      toast({
        title: "Product Archived",
        description: `${productName} has been archived successfully`
      });
      setIsOpen(false);

      // Navigate to company dashboard if we have the company name
      if (targetCompanyName) {
        navigate(`/app/company/${encodeURIComponent(targetCompanyName)}`);
      } else {
        // Fallback to client compass
        navigate("/app/clients");
      }
      if (onArchived) {
        onArchived();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to archive device: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsArchiving(false);
    }
  };
  return <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="icon">
          <Archive className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Device</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive <strong>{productName}</strong>? The device will be moved to the archives and 
            will no longer be visible in the main device listing. It can be restored later from the Archives section.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={e => {
          e.preventDefault();
          handleArchive();
        }} disabled={isArchiving}>
            {isArchiving ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>;
}