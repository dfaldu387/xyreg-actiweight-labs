import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductTemplateHub } from '@/components/document-studio/ProductTemplateHub';

export default function ProductTemplateHubPage() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const productName = searchParams.get('productName');

  if (!productId || !productName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Invalid Product Selection</h2>
          <p className="text-muted-foreground">Please select a product first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-6 py-12">
        <ProductTemplateHub productId={productId} productName={productName} />
      </div>
    </div>
  );
}