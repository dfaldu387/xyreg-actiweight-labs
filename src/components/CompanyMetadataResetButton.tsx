import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { resetUserCompanyMetadata } from '@/utils/companyMetadataReset';
import { useCompanyRole } from '@/context/CompanyRoleContext';

/**
 * Development utility button to reset company metadata preferences
 * This helps fix issues where the account keeps switching to specific companies
 */
export function CompanyMetadataResetButton() {
  const [isResetting, setIsResetting] = useState(false);
  const { refreshCompanyRoles } = useCompanyRole();

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const result = await resetUserCompanyMetadata();
      if (result.success) {
        // Refresh company roles to pick up the new selection logic
        await refreshCompanyRoles();
        // Reload the page to fully reset the app state
        window.location.reload();
      }
    } catch (error) {
      console.error('Error resetting company metadata:', error);
    } finally {
      setIsResetting(false);
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReset}
      disabled={isResetting}
      className="gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      {isResetting ? 'Resetting...' : 'Reset Company Prefs'}
    </Button>
  );
}