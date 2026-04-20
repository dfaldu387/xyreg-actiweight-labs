import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveUserRole } from '@/hooks/useEffectiveUserRole';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RecheckStandardButtonProps {
  frameworkKey: string;
  label?: string;
}

/**
 * Super-admin-only button to manually trigger a status re-check
 * for a specific standard via the `check-standard-status` edge function.
 */
export function RecheckStandardButton({ frameworkKey, label }: RecheckStandardButtonProps) {
  const { effectiveRole } = useEffectiveUserRole();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  if (effectiveRole !== 'super_admin') return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-standard-status', {
        body: { framework_key: frameworkKey },
      });
      if (error) throw error;
      const result = data?.results?.[0];
      if (result?.success) {
        toast.success(
          result.status === 'Superseded' && result.successor_name
            ? `${frameworkKey} → Superseded by ${result.successor_name}`
            : `${frameworkKey}: ${result.status}`
        );
      } else {
        toast.warning(`${frameworkKey}: check completed with issues`);
      }
      await queryClient.invalidateQueries({ queryKey: ['standard-version-status'] });
    } catch (err: any) {
      console.error('Re-check failed:', err);
      toast.error(`Re-check failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            disabled={loading}
            className="h-7 px-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {label && <span className="ml-1 text-xs">{label}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">Re-check status now (super admin)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
