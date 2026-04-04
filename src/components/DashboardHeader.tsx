
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AddClientDialog } from "@/components/AddClientDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffectiveUserRole } from "@/hooks/useEffectiveUserRole";

interface DashboardHeaderProps {
  refreshClients?: () => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  clientCount?: number;
  disabled?: boolean;
}

export function DashboardHeader({
  refreshClients,
  searchTerm = "",
  onSearchChange,
  statusFilter = "all",
  onStatusFilterChange,
  clientCount = 0,
  disabled = false
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const { effectiveRole } = useEffectiveUserRole();
  const canAddClient = effectiveRole === 'admin' || effectiveRole === 'super_admin' || effectiveRole === 'consultant';

  const handleSearchChange = (value: string) => {
    if (disabled) return;
    onSearchChange?.(value);
  };

  const handleStatusFilterChange = (value: string) => {
    if (disabled) return;
    onStatusFilterChange?.(value);
  };

  return (
    <div className="sticky top-16 z-10 w-full bg-background/95 rounded-lg shadow-sm">
      <div className="space-y-4 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate('/clients')}
            >
              {lang('clients.clientCompass')}
            </h1>
            <p className="text-muted-foreground">{lang('clients.monitorManagePortfolio')}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* <Button variant="outline" size="icon" className="relative" disabled={disabled}>
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">3</Badge>
            </Button> */}
            {canAddClient && <AddClientDialog onClientAdded={refreshClients} disabled={disabled} />}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={lang('clients.searchPlaceholder')}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          {clientCount > 1 && (
            <Select value={statusFilter} onValueChange={handleStatusFilterChange} disabled={disabled}>
              <SelectTrigger className="w-full sm:w-[180px]" disabled={disabled}>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={lang('clients.filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang('clients.allStatus')}</SelectItem>
                <SelectItem value="on-track">{lang('clients.onTrack')}</SelectItem>
                <SelectItem value="at-risk">{lang('clients.atRisk')}</SelectItem>
                <SelectItem value="attention">{lang('clients.needsAttention')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
