
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - longer for better performance
      gcTime: 1000 * 60 * 30, // 30 minutes cache time
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Disable automatic reconnect refetch
      refetchOnMount: false, // Use cache when mounting
      retry: 1, // Reduced retry count for better performance
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Faster retry with lower max
    },
    mutations: {
      retry: false,
      gcTime: 1000 * 60 * 10, // 10 minutes for mutations
    }
  },
});
