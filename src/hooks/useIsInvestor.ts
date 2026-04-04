import { useAuth } from "@/context/AuthContext";

/**
 * Hook to check if the current user is an investor.
 * Uses cached value from AuthContext to avoid duplicate API calls.
 */
export function useIsInvestor() {
  // Use cached isInvestor from AuthContext (set during login)
  const { isInvestor, isLoading } = useAuth();

  return {
    isInvestor: isInvestor ?? false,
    isLoading,
  };
}
