import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface InvestorMonitorHeaderProps {
  companyName: string;
  logoUrl?: string | null;
  lastUpdated?: string | null;
}

export const InvestorMonitorHeader: React.FC<InvestorMonitorHeaderProps> = ({
  companyName,
  logoUrl,
  lastUpdated,
}) => {
  const formattedDate = lastUpdated 
    ? format(new Date(lastUpdated), 'MMM d, yyyy')
    : 'N/A';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Company Name */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-slate-200">
              <AvatarImage src={logoUrl || undefined} alt={companyName} />
              <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-medium">
                {companyName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{companyName}</h1>
              <p className="text-xs text-slate-500">Investor Monitor</p>
            </div>
          </div>

          {/* Right: Last Updated Badge */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">
              Last Updated: {formattedDate}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
};
