
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionToggle } from "./PermissionToggle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type PermissionLevel = "A" | "E" | "V";

export interface Entity {
  id: string;
  name: string;
  type: "company" | "product" | "document";
  permissions: PermissionLevel[];
  isOverride?: boolean;
}

interface HierarchicalPermissionsEditorProps {
  userId: string;
  userName: string;
  companies: Entity[];
  products: Entity[];
  documents: Entity[];
  onPermissionChange: (entityId: string, entityType: string, permissions: PermissionLevel[]) => void;
  onOverrideToggle: (entityId: string, entityType: string, isOverride: boolean) => void;
  currentUserPermissionLevel?: PermissionLevel; // Added to restrict permissions based on current user's level
}

export function HierarchicalPermissionsEditor({
  userId,
  userName,
  companies,
  products,
  documents,
  onPermissionChange,
  onOverrideToggle,
  currentUserPermissionLevel = "A" // Default to Admin if not specified
}: HierarchicalPermissionsEditorProps) {
  
  const handlePermissionChange = (entityId: string, entityType: string, permissions: PermissionLevel[]) => {
    console.log("Permission change in editor:", entityId, entityType, permissions);
    onPermissionChange(entityId, entityType, permissions);
  };

  const getProductCompanyId = (productId: string) => {
    return productId.split("-")[0];
  };

  const getDocumentProductId = (documentId: string) => {
    const parts = documentId.split("-");
    return `${parts[0]}-${parts[1]}`;
  };

  const getCompanyPermissions = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company?.permissions || [];
  };

  const getProductPermissions = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product?.isOverride) {
      return product.permissions;
    }
    
    const companyId = getProductCompanyId(productId);
    return getCompanyPermissions(companyId);
  };

  const getDocumentPermissions = (documentId: string) => {
    const document = documents.find((d) => d.id === documentId);
    if (document?.isOverride) {
      return document.permissions;
    }
    
    const productId = getDocumentProductId(documentId);
    return getProductPermissions(productId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Settings for {userName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Companies</h3>
          {companies.map((company) => (
            <div key={company.id} className="border p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{company.name}</h4>
                <PermissionToggle
                  value={company.permissions}
                  onChange={(permissions) => handlePermissionChange(company.id, 'company', permissions)}
                  userPermissionLevel={currentUserPermissionLevel}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Products</h3>
          {products.map((product) => {
            const companyId = getProductCompanyId(product.id);
            const companyPermissions = getCompanyPermissions(companyId);
            const isInherited = !product.isOverride;

            return (
              <div key={product.id} className="border p-4 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{product.name}</h4>
                  <div className="flex items-center gap-4">
                    <PermissionToggle
                      value={isInherited ? companyPermissions : product.permissions}
                      onChange={(permissions) => handlePermissionChange(product.id, 'product', permissions)}
                      isInherited={isInherited}
                      userPermissionLevel={currentUserPermissionLevel}
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`override-${product.id}`}
                        checked={product.isOverride}
                        onCheckedChange={(checked) => onOverrideToggle(product.id, 'product', checked)}
                      />
                      <Label htmlFor={`override-${product.id}`}>Override</Label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Documents</h3>
          {documents.map((document) => {
            const productId = getDocumentProductId(document.id);
            const productPermissions = getProductPermissions(productId);
            const isInherited = !document.isOverride;

            return (
              <div key={document.id} className="border p-4 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{document.name}</h4>
                  <div className="flex items-center gap-4">
                    <PermissionToggle
                      value={isInherited ? productPermissions : document.permissions}
                      onChange={(permissions) => handlePermissionChange(document.id, 'document', permissions)}
                      isInherited={isInherited}
                      userPermissionLevel={currentUserPermissionLevel}
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`override-${document.id}`}
                        checked={document.isOverride}
                        onCheckedChange={(checked) => onOverrideToggle(document.id, 'document', checked)}
                      />
                      <Label htmlFor={`override-${document.id}`}>Override</Label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
