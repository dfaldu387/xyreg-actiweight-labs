import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Small pill rendered at the top of each specialist Business Case tab.
 * Communicates that the tab is one step of the Venture Blueprint guided flow,
 * and allows the user to jump back to the blueprint view.
 */
interface BlueprintStepBadgeProps {
  /** Human-readable step label, e.g. "Step 22 · Revenue Forecast" */
  stepLabel: string;
  /** Whether this step is part of the investor-essentials track */
  investorEssential?: boolean;
  className?: string;
}

export function BlueprintStepBadge({
  stepLabel,
  investorEssential = true,
  className,
}: BlueprintStepBadgeProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If we got here via the blueprint, prefer "back". Otherwise jump to it.
  const cameFromBlueprint = searchParams.get('returnTo') === 'venture-blueprint';

  const handleClick = () => {
    const productMatch = window.location.pathname.match(/\/product\/([^/]+)/);
    const productId = productMatch?.[1];
    if (!productId) return;
    navigate(`/app/product/${productId}/business-case?tab=venture-blueprint`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100',
        className,
      )}
    >
      {investorEssential ? (
        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
      ) : (
        <Star className="h-3 w-3 text-amber-500" />
      )}
      <span className="opacity-80">Part of</span>
      <span className="font-semibold">Venture Blueprint</span>
      <span className="opacity-60">·</span>
      <span>{stepLabel}</span>
      {investorEssential && (
        <span className="ml-1 rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
          Investor essential
        </span>
      )}
      <ArrowLeft className="ml-1 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
