import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit2 } from "lucide-react";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useCompanyBasicUDIGroups } from "@/hooks/useCompanyBasicUDIGroups";
import { useUpdateBasicUDIGroupName } from "@/hooks/useBasicUDIGroupMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UngroupedProductsList } from "@/components/product/basic-udi/UngroupedProductsList";
import { CreateSiblingGroupDialog } from "@/components/product/basic-udi/CreateSiblingGroupDialog";
import { BasicUDIStats } from "@/components/product/basic-udi/BasicUDIStats";
import { SiblingGroupCardWrapper } from "@/components/product/basic-udi/SiblingGroupCardWrapper";
import { toast } from "sonner";

export default function BasicUDIDetail() {
  const { companyName, basicUdiDi } = useParams<{ companyName: string; basicUdiDi: string }>();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const decodedBasicUdiDi = decodeURIComponent(basicUdiDi || "");
  
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const { data: clusters = [], isLoading } = useCompanyBasicUDIGroups(companyId);
  const updateGroupName = useUpdateBasicUDIGroupName();

  const cluster = clusters.find(c => c.basicUDI === decodedBasicUdiDi);

  React.useEffect(() => {
    if (cluster?.groupName) {
      setGroupName(cluster.groupName);
    }
  }, [cluster?.groupName]);

  const handleBack = () => {
    navigate(`/app/company/${encodeURIComponent(companyName!)}/basic-udi-overview`);
  };

  const handleSaveGroupName = async () => {
    if (!companyId || !groupName.trim()) return;

    await updateGroupName.mutateAsync({
      groupId: cluster?.groupId,
      basicUdiDi: decodedBasicUdiDi,
      companyId,
      name: groupName.trim(),
    });

    setEditingName(false);
  };

  const breadcrumbs = [
    { label: "Companies", onClick: () => navigate('/app/clients') },
    { label: companyName!, onClick: () => navigate(`/app/company/${encodeURIComponent(companyName!)}`) },
    { label: "Basic UDI-DI Groups", onClick: handleBack },
    { label: cluster?.groupName || decodedBasicUdiDi },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="space-y-6">
        <ConsistentPageHeader breadcrumbs={breadcrumbs} title="Group Not Found" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">This Basic UDI-DI group could not be found.</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  const ungroupedProducts = cluster.products.filter(p => !cluster.groupedProductIds.has(p.id));

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="font-semibold">{cluster.groupName || "Unnamed Device Family"}</div>
              <div className="text-sm text-muted-foreground font-normal">Basic UDI-DI: {decodedBasicUdiDi}</div>
            </div>
          </div>
        }
        subtitle={
          editingName ? (
            <div className="flex items-center gap-2 mt-2">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="max-w-xs"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveGroupName} disabled={updateGroupName.isPending}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {cluster.groupName || "No name set"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingName(true)}
                className="h-6 px-2"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )
        }
        actions={
          <Button onClick={() => setShowCreateGroup(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Sibling Group
          </Button>
        }
      />

      {/* Statistics */}
      <div className="px-2">
        <BasicUDIStats cluster={cluster} />
      </div>

      {/* Sibling Groups */}
      <div className="px-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Sibling Groups ({cluster.siblingGroups.length})
          </h2>
        </div>

        {cluster.siblingGroups.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No sibling groups defined yet. Create a group to organize product variants.
            </p>
            <Button onClick={() => setShowCreateGroup(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create First Group
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cluster.siblingGroups.map((group) => (
              <SiblingGroupCardWrapper
                key={group.id}
                groupId={group.id}
                companyId={companyId!}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ungrouped Products */}
      {ungroupedProducts.length > 0 && (
        <div className="px-2">
          <UngroupedProductsList
            products={ungroupedProducts}
            basicUdiDi={decodedBasicUdiDi}
            companyId={companyId!}
            onCreateGroup={() => setShowCreateGroup(true)}
          />
        </div>
      )}

      {/* Create Sibling Group Dialog */}
      <CreateSiblingGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        basicUdiDi={decodedBasicUdiDi}
        companyId={companyId!}
        availableProducts={ungroupedProducts}
      />
    </div>
  );
}
