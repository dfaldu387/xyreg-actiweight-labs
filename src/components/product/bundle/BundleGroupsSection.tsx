import React from 'react';
import { useProductBundles, useRemoveBundleMember } from '@/hooks/useProductBundleGroups';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight, Package, MoreVertical, Pencil, Trash2, UserPlus, Settings2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProductLink } from '@/components/product/ProductLink';
import { EditBundleDialog } from './EditBundleDialog';
import { DeleteBundleDialog } from './DeleteBundleDialog';
import { AddBundleMemberDialog } from './AddBundleMemberDialog';
import { EditBundleMemberDialog } from './EditBundleMemberDialog';
import { toast } from 'sonner';

interface BundleGroupsSectionProps {
  productId: string;
}

export function BundleGroupsSection({ productId }: BundleGroupsSectionProps) {
  const { data: bundles, isLoading } = useProductBundles(productId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bundle Groups</CardTitle>
          <CardDescription>Bundles this product belongs to</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!bundles || bundles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bundle Groups</CardTitle>
          <CardDescription>Bundles this product belongs to</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This product is not part of any bundle groups yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bundle Groups</CardTitle>
        <CardDescription>
          This product is a member of {bundles.length} bundle{bundles.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bundles.map((bundle) => (
          <BundleGroupCard 
            key={bundle.id} 
            bundle={bundle} 
            currentProductId={productId}
            companyId={bundle.company_id}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface BundleGroupCardProps {
  bundle: any;
  currentProductId: string;
  companyId: string;
}

function BundleGroupCard({ bundle, currentProductId, companyId }: BundleGroupCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = React.useState(false);
  const [editMemberDialogOpen, setEditMemberDialogOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<any>(null);
  
  const removeMemberMutation = useRemoveBundleMember();

  // Fetch product details for all members
  const { data: memberProducts } = useQuery({
    queryKey: ['bundle-member-products', bundle.id],
    queryFn: async () => {
      const productIds = bundle.members
        .filter((m: any) => m.product_id)
        .map((m: any) => m.product_id);

      if (productIds.length === 0) return [];

      const { data } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      return data || [];
    },
    enabled: isOpen,
  });

  // Fetch sibling group details for all members
  const { data: memberSiblingGroups } = useQuery({
    queryKey: ['bundle-member-sibling-groups', bundle.id],
    queryFn: async () => {
      const siblingGroupIds = bundle.members
        .filter((m: any) => m.sibling_group_id)
        .map((m: any) => m.sibling_group_id);

      if (siblingGroupIds.length === 0) return [];

      const { data } = await supabase
        .from('product_sibling_groups')
        .select('id, name')
        .in('id', siblingGroupIds);

      return data || [];
    },
    enabled: isOpen,
  });

  const currentMember = bundle.members.find((m: any) => m.product_id === currentProductId);
  const isPrimary = currentMember?.is_primary || false;

  const getRelationshipColor = (type: string) => {
    const colors: Record<string, string> = {
      component: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      accessory: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
      consumable: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
      required: 'bg-red-500/10 text-red-700 dark:text-red-400',
      optional: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
      replacement_part: 'bg-green-500/10 text-green-700 dark:text-green-400',
    };
    return colors[type] || colors.component;
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMemberMutation.mutateAsync(memberId);
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const existingProductIds = bundle.members
    .filter((m: any) => m.product_id)
    .map((m: any) => m.product_id);

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="border rounded-lg overflow-hidden">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="transition-transform duration-200">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <Package className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{bundle.bundle_name}</h4>
                    {isPrimary && (
                      <Badge variant="secondary" className="text-xs">
                        Primary Product
                      </Badge>
                    )}
                  </div>
                  {bundle.description && (
                    <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {bundle.members.length} member{bundle.members.length !== 1 ? 's' : ''}
                    </Badge>
                    {currentMember && (
                      <Badge className={`text-xs ${getRelationshipColor(currentMember.relationship_type)}`}>
                        {currentMember.relationship_type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Bundle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAddMemberDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Bundle
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="space-y-2 border-t p-4 bg-muted/20">
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Bundle Members:</h5>
              {!memberProducts && bundle.members.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner />
                </div>
              )}
              {bundle.members.map((member: any) => {
                const product = memberProducts?.find((p: any) => p.id === member.product_id);
                const siblingGroup = memberSiblingGroups?.find((sg: any) => sg.id === member.sibling_group_id);
                const isCurrentProduct = member.product_id === currentProductId;

                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      isCurrentProduct ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {member.product_id ? (
                        <ProductLink productId={member.product_id} className="text-sm font-medium hover:underline">
                          {product?.name || 'Loading...'}
                        </ProductLink>
                      ) : (
                        <span className="text-sm font-medium">
                          {siblingGroup?.name || 'Loading...'}
                        </span>
                      )}
                      {isCurrentProduct && (
                        <Badge variant="outline" className="text-xs">
                          This Product
                        </Badge>
                      )}
                      {member.is_primary && !isCurrentProduct && (
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getRelationshipColor(member.relationship_type)}`}>
                        {member.relationship_type}
                      </Badge>
                      {member.multiplier && member.multiplier !== 1 && (
                        <Badge variant="outline" className="text-xs">
                          ×{member.multiplier}
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(member);
                              setEditMemberDialogOpen(true);
                            }}
                          >
                            <Settings2 className="h-4 w-4 mr-2" />
                            Edit Properties
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <EditBundleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        bundleId={bundle.id}
        currentName={bundle.bundle_name}
        currentDescription={bundle.description}
      />

      <DeleteBundleDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        bundleId={bundle.id}
        bundleName={bundle.bundle_name}
        memberCount={bundle.members.length}
      />

      <AddBundleMemberDialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        bundleId={bundle.id}
        companyId={companyId}
        existingMemberIds={existingProductIds}
      />

      {selectedMember && (
        <EditBundleMemberDialog
          open={editMemberDialogOpen}
          onOpenChange={setEditMemberDialogOpen}
          memberId={selectedMember.id}
          currentRelationshipType={selectedMember.relationship_type}
          currentMultiplier={selectedMember.multiplier}
        />
      )}
    </>
  );
}
