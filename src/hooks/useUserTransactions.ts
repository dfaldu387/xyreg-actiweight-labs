import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string;
  type?: 'payment_intent' | 'subscription';
}

export function useUserTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: invokeError } = await supabase.functions.invoke('get-user-transactions');

      if (invokeError) throw invokeError;

      if (data?.transactions) {
        setTransactions(data.transactions);
        
        // Calculate total paid (only successful transactions)
        const total = data.transactions
          .filter((t: Transaction) => t.status === 'succeeded')
          .reduce((sum: number, t: Transaction) => sum + (t.amount / 100), 0);
        
        setTotalPaid(total);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
      setTransactions([]);
      setTotalPaid(0);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    transactions,
    totalPaid,
    isLoading,
    error,
    refreshTransactions: fetchTransactions
  };
}
