import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { DocumentReviewers } from '@/components/settings/document-control/DocumentReviewers';
import { ReviewerItem } from '@/types/client';

interface ReviewerSelectionSectionProps {
  reviewers: ReviewerItem[];
  onReviewersChange: (reviewers: ReviewerItem[]) => void;
}

export function ReviewerSelectionSection({ 
  reviewers, 
  onReviewersChange 
}: ReviewerSelectionSectionProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Document Reviewers
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add reviewers who will receive this document for review and approval.
        </p>
      </CardHeader>
      <CardContent>
        <DocumentReviewers
          reviewers={reviewers}
          onReviewersChange={onReviewersChange}
        />
      </CardContent>
    </Card>
  );
}
