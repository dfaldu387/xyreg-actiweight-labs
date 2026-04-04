import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
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
import { Package2, Box, GitBranch, FlaskConical, MapPin, MoreVertical, Edit, Trash2, PackageOpen } from 'lucide-react';
import { useDeleteBundleGroup } from '@/hooks/useProductBundleGroups';
import { EditBundleDialog } from '@/components/product/bundle/EditBundleDialog';
import type { CompanyBundle } from '@/hooks/useCompanyBundles';
import { toast } from 'sonner';

interface BundleCardProps {
  bundle: CompanyBundle;
  companyName?: string;
}

export function BundleCard({ bundle, companyName }: BundleCardProps) {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteMutation = useDeleteBundleGroup();

  const handleCardClick = () => {
    // Navigate to standalone bundle builder
    navigate(`/app/bundle/${bundle.id}/build`);
  };

  const handleBuildBundle = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/app/bundle/${bundle.id}/build`);
  };

  const handleEditDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditDialog(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(bundle.id);
      toast.success('Bundle deleted successfully');
    } catch {
      toast.error('Failed to delete bundle');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/5 to-background overflow-hidden"
        onClick={handleCardClick}
      >
      {/* Thumbnail Image */}
      {bundle.thumbnail_url && (
        <div className="w-full h-32 overflow-hidden bg-muted">
          <img 
            src={bundle.thumbnail_url} 
            alt={bundle.bundle_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base line-clamp-2 leading-tight">
                  {bundle.bundle_name}
                </h3>
                {bundle.is_feasibility_study && (
                  <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-xs">
                    <FlaskConical className="h-3 w-3 mr-1" />
                    Feasibility
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleBuildBundle}>
                <PackageOpen className="h-4 w-4 mr-2" />
                Build Bundle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditDetails}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Bundle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {bundle.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {bundle.description}
          </p>
        )}

        {/* Target Markets */}
        {bundle.target_markets && bundle.target_markets.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
            {bundle.target_markets.slice(0, 3).map((market) => (
              <Badge key={market} variant="outline" className="text-xs">
                {market}
              </Badge>
            ))}
            {bundle.target_markets.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{bundle.target_markets.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {bundle.product_members.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Box className="h-3 w-3" />
              {bundle.product_members.length} {bundle.product_members.length === 1 ? 'Product' : 'Products'}
            </Badge>
          )}
          {bundle.sibling_group_members.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <GitBranch className="h-3 w-3" />
              {bundle.sibling_group_members.length} {bundle.sibling_group_members.length === 1 ? 'Group' : 'Groups'}
            </Badge>
          )}
        </div>

        {/* Show member preview */}
        {(bundle.product_members.length > 0 || bundle.sibling_group_members.length > 0) && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">Bundle Contains:</p>
            <div className="space-y-1">
              {bundle.product_members.slice(0, 2).map((product) => (
                <div key={product.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Box className="h-3 w-3" />
                  <span className="truncate">{product.name}</span>
                </div>
              ))}
              {bundle.sibling_group_members.slice(0, 2).map((group) => (
                <div key={group.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitBranch className="h-3 w-3" />
                  <span className="truncate">{group.name}</span>
                </div>
              ))}
              {bundle.member_count > 4 && (
                <p className="text-xs text-muted-foreground italic">
                  +{bundle.member_count - 4} more...
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>Total: {bundle.member_count} {bundle.member_count === 1 ? 'item' : 'items'}</span>
          <span>Created {new Date(bundle.created_at).toLocaleDateString()}</span>
        </div>
      </CardFooter>
    </Card>

    {/* Edit Bundle Dialog */}
    <EditBundleDialog
      open={showEditDialog}
      onOpenChange={setShowEditDialog}
      bundleId={bundle.id}
      currentName={bundle.bundle_name}
      currentDescription={bundle.description}
      isFeasibilityStudy={bundle.is_feasibility_study}
      currentTargetMarkets={bundle.target_markets || []}
    />

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Bundle?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "<strong>{bundle.bundle_name}</strong>"? 
            This will remove the bundle and all its {bundle.member_count} member(s). 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Bundle'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
