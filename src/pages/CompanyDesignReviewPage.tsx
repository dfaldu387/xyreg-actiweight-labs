import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDesignReviews } from '@/hooks/useDesignReviews';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardCheck } from 'lucide-react';
import { REVIEW_TYPE_LABELS, STATUS_LABELS } from '@/types/designReview';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export default function CompanyDesignReviewPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const { lang } = useTranslation();

  const { data: company } = useQuery({
    queryKey: ['company-by-name', companyName],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, name').eq('name', companyName!).single();
      return data;
    },
    enabled: !!companyName,
  });

  const { reviewsQuery } = useDesignReviews(company?.id);
  const reviews = reviewsQuery.data || [];

  const totalReviews = reviews.length;
  const completedBaselines = reviews.filter(r => r.status === 'completed').length;
  const activeReviews = reviews.filter(r => !['completed', 'cancelled'].includes(r.status)).length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          {lang('designReview.pageTitle')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang('designReview.pageSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{lang('designReview.total')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalReviews}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{lang('designReview.active')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{activeReviews}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{lang('designReview.completed')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{completedBaselines}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang('designReview.drId')}</TableHead>
                <TableHead>{lang('designReview.title')}</TableHead>
                <TableHead>{lang('designReview.type')}</TableHead>
                <TableHead>{lang('designReview.status')}</TableHead>
                <TableHead>{lang('designReview.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{lang('designReview.noReviewsFound')}</TableCell></TableRow>
              ) : reviews.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                  if (r.product_id) navigate(`/app/product/${r.product_id}/design-review/${r.id}`);
                }}>
                  <TableCell className="font-mono text-sm">{r.dr_id}</TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell><Badge variant="outline">{REVIEW_TYPE_LABELS[r.review_type]}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{STATUS_LABELS[r.status]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(r.created_at), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
