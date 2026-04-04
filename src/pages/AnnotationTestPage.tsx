import React from 'react';
import { AnnotationDisplayPanel } from '@/components/product/AnnotationDisplayPanel';

export function AnnotationTestPage() {
  // Test document ID - replace with a real document ID from your database
  const testDocumentId = "f9a38915-b474-4602-928a-b1deea85fb41";

  const handleAnnotationFilterChange = (filteredTypes: string[]) => {
    // Annotation filter changed
  };

  const handleAnnotationVisibilityChange = (visibleTypes: string[]) => {
    // Annotation visibility changed
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Annotation Display Test</h1>
        <p className="text-muted-foreground mb-6">
          This page demonstrates the annotation display functionality. 
          It shows all annotation types from the database with filtering and visibility controls.
        </p>
        
        <AnnotationDisplayPanel
          documentId={testDocumentId}
          onAnnotationFilterChange={handleAnnotationFilterChange}
          onAnnotationVisibilityChange={handleAnnotationVisibilityChange}
        />
      </div>
    </div>
  );
} 