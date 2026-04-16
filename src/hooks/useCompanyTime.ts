import { useState, useEffect } from "react";
import { companyTimeTrackingService } from "@/services/companyTimeTrackingService";

interface CompanyTime {
  totalSeconds: number;
  weeklySeconds: number;
  isLoading: boolean;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return "< 1m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function useCompanyTime(companyId: string | undefined): CompanyTime {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [weeklySeconds, setWeeklySeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchTime = async () => {
      setIsLoading(true);
      const [total, weekly] = await Promise.all([
        companyTimeTrackingService.getTotalTime(companyId),
        companyTimeTrackingService.getWeeklyTime(companyId),
      ]);
      if (!cancelled) {
        setTotalSeconds(total);
        setWeeklySeconds(weekly);
        setIsLoading(false);
      }
    };

    fetchTime();
    return () => { cancelled = true; };
  }, [companyId]);

  return { totalSeconds, weeklySeconds, isLoading };
}
