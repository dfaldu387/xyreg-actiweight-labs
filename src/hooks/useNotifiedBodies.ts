
import { useState, useEffect } from 'react';
import { NotifiedBody, NotifiedBodyScope } from '@/types/notifiedBody';
import { 
  fetchNotifiedBodies, 
  searchNotifiedBodies, 
  getNotifiedBodiesByCountry, 
  getNotifiedBodiesByScope 
} from '@/services/notifiedBodyService';

interface UseNotifiedBodiesResult {
  notifiedBodies: NotifiedBody[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  search: (query: string) => Promise<void>;
  filterByCountry: (country: string) => Promise<void>;
  filterByScope: (scope: Partial<NotifiedBodyScope>) => Promise<void>;
}

export function useNotifiedBodies(): UseNotifiedBodiesResult {
  const [notifiedBodies, setNotifiedBodies] = useState<NotifiedBody[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('Notified Bodies error:', err);
    setError(message);
  };

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotifiedBodies();
      setNotifiedBodies(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const search = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await searchNotifiedBodies(query);
      setNotifiedBodies(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const filterByCountry = async (country: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifiedBodiesByCountry(country);
      setNotifiedBodies(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const filterByScope = async (scope: Partial<NotifiedBodyScope>) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifiedBodiesByScope(scope);
      setNotifiedBodies(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return {
    notifiedBodies,
    loading,
    error,
    refetch,
    search,
    filterByCountry,
    filterByScope
  };
}
