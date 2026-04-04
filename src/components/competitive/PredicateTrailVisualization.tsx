import React from 'react';
import { SimplePredicateAnalysis } from './SimplePredicateAnalysis';
import { useParams } from 'react-router-dom';
import { useProductDetails } from '@/hooks/useProductDetails';

interface PredicateTrailVisualizationProps {
  kNumber: string;
  maxDepth?: number;
}

export function PredicateTrailVisualization({ kNumber, maxDepth = 3 }: PredicateTrailVisualizationProps) {
  const { productId } = useParams<{ productId: string }>();
  const { data: product } = useProductDetails(productId);
  const companyId = product?.company_id;

  return (
    <SimplePredicateAnalysis 
      initialKNumber={kNumber}
      companyId={companyId || "demo-company-id"}
    />
  );
}