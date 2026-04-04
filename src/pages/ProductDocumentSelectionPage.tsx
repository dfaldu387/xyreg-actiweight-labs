import React from 'react';
import { ProductSelection } from '@/components/document-studio/ProductSelection';

export default function ProductDocumentSelectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-6 py-12">
        <ProductSelection />
      </div>
    </div>
  );
}