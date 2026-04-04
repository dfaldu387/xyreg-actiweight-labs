import { useQuery } from '@tanstack/react-query';
import { capaService } from '@/services/capaService';

/**
 * Hook to get the count of CAPAs escalated from devices for a company
 */
export function useEscalatedCAPACount(companyId: string | undefined) {
  return useQuery({
    queryKey: ['escalated-capa-count', companyId],
    queryFn: () => capaService.getEscalatedCAPACount(companyId!),
    enabled: !!companyId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get CAPAs escalated from a specific device
 */
export function useEscalatedCAPAsByDevice(deviceId: string | undefined) {
  return useQuery({
    queryKey: ['escalated-capas-by-device', deviceId],
    queryFn: () => capaService.getEscalatedCAPAsByDevice(deviceId!),
    enabled: !!deviceId,
    staleTime: 30000,
  });
}
