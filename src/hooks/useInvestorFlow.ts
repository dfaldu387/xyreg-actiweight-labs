import { useSearchParams } from 'react-router-dom';

/**
 * Hook to detect if user is in an investor flow context
 * Handles both investor-share and venture-blueprint returnTo parameters
 */
export function useInvestorFlow() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  
  const isInInvestorFlow = returnTo === 'investor-share' || returnTo === 'venture-blueprint';
  const isVentureBlueprint = returnTo === 'venture-blueprint';
  const isInvestorShare = returnTo === 'investor-share';
  
  return {
    isInInvestorFlow,
    isVentureBlueprint,
    isInvestorShare,
    returnTo
  };
}
