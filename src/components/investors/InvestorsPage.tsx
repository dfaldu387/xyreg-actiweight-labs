import React from 'react';
import { QuickShareCard } from './QuickShareCard';
import { DataRoomsUpgradeCard } from './DataRoomsUpgradeCard';
import { DataRoomManager } from '@/components/data-room/DataRoomManager';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { useRestrictedFeature } from '@/contexts/RestrictedFeatureContext';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { useTranslation } from '@/hooks/useTranslation';

interface InvestorsPageProps {
  companyId: string;
  companyName: string;
}

export function InvestorsPage({ companyId, companyName }: InvestorsPageProps) {
  // Restriction check - double security pattern
  const { isRestricted: contextRestricted } = useRestrictedFeature();
  const { isMenuAccessKeyEnabled } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_INVESTORS);
  const isRestricted = contextRestricted || !isFeatureEnabled;

  const { lang } = useTranslation();
  const { currentPlan } = usePlanPermissions();

  // Free plan (Starter) users cannot access data rooms
  // Only Professional and Enterprise plans have access
  const canAccessDataRooms = currentPlan === 'professional' || currentPlan === 'enterprise';

  return (
    <div className="space-y-6">
      {/* Quick Share Card - Always visible to all users */}
      <QuickShareCard companyId={companyId} companyName={companyName} disabled={isRestricted} />

      {/* Data Rooms Section - Conditional based on plan */}
      {canAccessDataRooms ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{lang('commercial.investors.title')}</h2>
            <p className="text-muted-foreground">
              {lang('commercial.investors.subtitle')}
            </p>
          </div>
          <DataRoomManager companyId={companyId} disabled={isRestricted} />
        </div>
      ) : (
        <DataRoomsUpgradeCard companyName={companyName} />
      )}
    </div>
  );
}
