
import { useState, useEffect } from 'react';
import { ComplianceInstanceDueDateService, ComplianceInstanceWithDueDate } from '@/services/complianceInstanceDueDateService';

export function useComplianceInstanceDueDates(productId?: string) {
  const [instances, setInstances] = useState<ComplianceInstanceWithDueDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = async () => {
    if (!productId) {
      setInstances([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await ComplianceInstanceDueDateService.getComplianceInstancesWithDueDates(productId);
      setInstances(data);
    } catch (err) {
      console.error('Error fetching compliance instances:', err);
      setError(err instanceof Error ? err.message : 'Failed to load compliance instances');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDueDate = async (itemId: string, dueDate: string | null) => {
    const success = await ComplianceInstanceDueDateService.updateComplianceInstanceDueDate(itemId, dueDate);
    if (success) {
      // Update local state immediately
      setInstances(prev => prev.map(instance => 
        instance.id === itemId 
          ? { 
              ...instance, 
              dueDate: dueDate || undefined,
              isOverdue: dueDate ? dueDate < new Date().toISOString().split('T')[0] && instance.status !== "compliant" : false
            }
          : instance
      ));
    }
    return success;
  };

  const bulkUpdateDueDates = async (updates: Array<{ id: string; dueDate: string | null }>) => {
    const success = await ComplianceInstanceDueDateService.bulkUpdateDueDates(updates);
    if (success) {
      await fetchInstances(); // Refresh all data after bulk update
    }
    return success;
  };

  const getOverdueCount = () => {
    return instances.filter(instance => instance.isOverdue).length;
  };

  const getUpcomingCount = (days: number = 7) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateString = futureDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    return instances.filter(instance => 
      instance.dueDate && 
      instance.dueDate >= today && 
      instance.dueDate <= futureDateString &&
      instance.status !== "compliant"
    ).length;
  };

  useEffect(() => {
    fetchInstances();
  }, [productId]);

  return {
    instances,
    isLoading,
    error,
    fetchInstances,
    updateDueDate,
    bulkUpdateDueDates,
    getOverdueCount,
    getUpcomingCount
  };
}
