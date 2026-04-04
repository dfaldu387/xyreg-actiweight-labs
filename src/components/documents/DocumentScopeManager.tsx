
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyTemplateManager } from "./CompanyTemplateManager";
import { CompanyDocumentManager } from "./CompanyDocumentManager";
import { ProductDocumentManager } from "./ProductDocumentManager";

interface DocumentScopeManagerProps {
  companyId: string;
  productId?: string;
  currentPhase?: string;
  scope?: 'templates' | 'company' | 'product' | 'all';
  onDocumentUpdate?: (document: any) => void;
  disabled?: boolean;
}

export function DocumentScopeManager({
  companyId,
  productId,
  currentPhase,
  scope = 'all',
  onDocumentUpdate,
  disabled = false
}: DocumentScopeManagerProps) {
  
  // If specific scope is requested, show only that component
  if (scope === 'templates') {
    return <CompanyTemplateManager companyId={companyId} disabled={disabled} />;
  }

  if (scope === 'company') {
    return <CompanyDocumentManager companyId={companyId} disabled={disabled} />;
  }

  if (scope === 'product' && productId) {
    return (
      <ProductDocumentManager
        productId={productId}
        companyId={companyId}
        currentPhase={currentPhase}
        onDocumentUpdate={onDocumentUpdate}
        disabled={disabled}
      />
    );
  }

  // Show all scopes in tabs for full manager
  return (
    <Tabs defaultValue="product" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="product" disabled={!productId}>
          Product Documents
        </TabsTrigger>
        <TabsTrigger value="company">
          Company Documents
        </TabsTrigger>
        <TabsTrigger value="templates">
          Phase Templates
        </TabsTrigger>
      </TabsList>

      {productId && (
        <TabsContent value="product">
          <ProductDocumentManager
            productId={productId}
            companyId={companyId}
            currentPhase={currentPhase}
            onDocumentUpdate={onDocumentUpdate}
            disabled={disabled}
          />
        </TabsContent>
      )}

      <TabsContent value="company">
        <CompanyDocumentManager companyId={companyId} disabled={disabled} />
      </TabsContent>

      <TabsContent value="templates">
        <CompanyTemplateManager companyId={companyId} disabled={disabled} />
      </TabsContent>
    </Tabs>
  );
}
