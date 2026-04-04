import React from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { GovernanceStatus } from '@/services/fieldGovernanceService';

interface GovernanceBookmarkProps {
  status?: GovernanceStatus | null;
  designReviewId?: string | null;
  verdictComment?: string | null;
  approvedAt?: string | null;
  productId?: string;
  sectionLabel?: string;
}

const STATUS_CONFIG: Record<GovernanceStatus, {
  color: string;
  fillClass: string;
  label: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  useCheckIcon: boolean;
}> = {
  draft: {
    color: 'text-blue-400',
    fillClass: '',
    label: 'Draft',
    badgeVariant: 'outline',
    useCheckIcon: false,
  },
  approved: {
    color: 'text-emerald-500',
    fillClass: 'fill-emerald-500',
    label: 'Approved',
    badgeVariant: 'default',
    useCheckIcon: true,
  },
  approved_with_conditions: {
    color: 'text-amber-500',
    fillClass: 'fill-amber-500',
    label: 'Conditional',
    badgeVariant: 'secondary',
    useCheckIcon: false,
  },
  rejected: {
    color: 'text-destructive',
    fillClass: 'fill-destructive',
    label: 'Rejected',
    badgeVariant: 'destructive',
    useCheckIcon: false,
  },
  modified: {
    color: 'text-blue-500',
    fillClass: 'fill-blue-500',
    label: 'Modified',
    badgeVariant: 'secondary',
    useCheckIcon: false,
  },
};

export function GovernanceBookmark({
  status,
  designReviewId,
  verdictComment,
  approvedAt,
  productId,
  sectionLabel,
}: GovernanceBookmarkProps) {
  const navigate = useNavigate();

  // Draft/null: blue outline circle (not yet reviewed)
  if (!status || status === 'draft') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-blue-400"
            title="Not yet reviewed"
          >
            <Circle className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                Pending Review
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Not yet reviewed in a Design Review.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const config = STATUS_CONFIG[status];

  const handleViewDR = () => {
    if (designReviewId && productId) {
      navigate(`/app/product/${productId}/design-review?reviewId=${designReviewId}`);
    }
  };

  const IconComponent = config.useCheckIcon ? CheckCircle2 : Circle;

  const renderPopoverContent = () => {
    switch (status) {
      case 'approved':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>
              {sectionLabel && <span className="text-sm font-medium">{sectionLabel}</span>}
            </div>
            {approvedAt && (
              <p className="text-xs text-muted-foreground">
                Approved on {new Date(approvedAt).toLocaleDateString()}
              </p>
            )}
            {designReviewId && (
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleViewDR}>
                View Design Review →
              </Button>
            )}
          </div>
        );

      case 'approved_with_conditions':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                Approved with Conditions
              </Badge>
            </div>
            {verdictComment && (
              <p className="text-sm border-l-2 border-amber-400 pl-2 italic">
                {verdictComment}
              </p>
            )}
            {approvedAt && (
              <p className="text-xs text-muted-foreground">
                Approved on {new Date(approvedAt).toLocaleDateString()}
              </p>
            )}
            {designReviewId && (
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleViewDR}>
                View Design Review →
              </Button>
            )}
          </div>
        );

      case 'rejected':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Rejected</Badge>
            </div>
            {verdictComment && (
              <p className="text-sm border-l-2 border-destructive pl-2 italic">
                {verdictComment}
              </p>
            )}
            {designReviewId && (
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleViewDR}>
                View Design Review →
              </Button>
            )}
          </div>
        );

      case 'modified':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                Modified Since Approval
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              This section has been modified since the last Design Review approval. A new review is required.
            </p>
            {designReviewId && (
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleViewDR}>
                View Previous Design Review →
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${config.color}`}
          title={config.label}
        >
          <IconComponent className={`h-4 w-4 ${config.fillClass}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        {renderPopoverContent()}
      </PopoverContent>
    </Popover>
  );
}
