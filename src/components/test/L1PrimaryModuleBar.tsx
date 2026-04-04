import React, { useState, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ModuleConfig, SidebarConfig, translateSidebarConfig, filterModulesByRole } from './SidebarConfig';
import { useEffectiveUserRole } from '@/hooks/useEffectiveUserRole';

import { TodoistStyleOnboarding } from '@/components/help/TodoistStyleOnboarding';
import { GlobalHelpSidebar } from '@/components/help/GlobalHelpSidebar';
import { useHelpKeyboardShortcut } from '@/hooks/useHelpKeyboardShortcut';
import { Rocket, BookOpen, Crosshair } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoVertical from '@/assets/logo-vertical.png';
import { useTranslation } from '@/hooks/useTranslation';
import { useNewPricingPlan } from '@/hooks/useNewPricingPlan';
import { useIsInvestor } from '@/hooks/useIsInvestor';

interface L1PrimaryModuleBarProps {
  activeModule: string | null;
  onModuleSelect: (moduleId: string) => void;
  config: SidebarConfig;
  currentProductId?: string | null;
}

export function L1PrimaryModuleBar({ activeModule, onModuleSelect, config, currentProductId }: L1PrimaryModuleBarProps) {
  const { effectiveRole } = useEffectiveUserRole();

  const { lang } = useTranslation();
  const navigate = useNavigate();

  // Get user's pricing plan
  const { isGenesis, planName, isLoading: isPlanLoading } = useNewPricingPlan();

  // Check if user is an investor
  const { isInvestor } = useIsInvestor();

  // Translate the sidebar config for i18n support
  const translatedConfig = useMemo(() => translateSidebarConfig(config, lang), [config, lang]);
  const { modules, companySettingsModule, userProfileModule, enableTooltips, customStyles } = translatedConfig;
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [helpSidebarOpen, setHelpSidebarOpen] = useState(false);

  // Keyboard shortcut to open help (? key)
  useHelpKeyboardShortcut(() => setHelpSidebarOpen(true));

  // console.log('Effective role from user_company_access:', effectiveRole);
  // console.log('Allowed module IDs:', allowedModuleIds);

  // Filter modules based on user role (shared logic with NavigationSearchDialog)
  const filteredModules = filterModulesByRole(modules, effectiveRole as string, isInvestor);

  const renderModuleButton = (module: ModuleConfig) => {
    // L1 modules are always clickable - locks are only shown in L2
    const button = (
      <button
        type="button"
        onClick={() => onModuleSelect(module.id)}
        className={`
          relative w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer
          ${activeModule === module.id
            ? `${customStyles?.primaryColor || 'bg-sidebar-primary'} text-sidebar-primary-foreground shadow-lg`
            : `${customStyles?.textColor || 'text-sidebar-foreground'} hover:${customStyles?.accentColor || 'bg-sidebar-accent'} hover:text-sidebar-accent-foreground`
          }
        `}
      >
        <span className="pointer-events-none">
          {module.icon}
        </span>
      </button>
    );

    if (enableTooltips) {
      return (
        <Tooltip key={module.id}>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="max-w-xs">
            <div className="font-semibold">{module.label}</div>
            {module.description && (
              <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={module.id}>{button}</div>;
  };

  // If user is an investor, show investor-focused L1 with investor modules
  if (isInvestor) {
    return (
      <TooltipProvider>
        <div
          data-tour="sidebar"
          className={`w-16 h-screen fixed left-0 top-0 z-20 ${customStyles?.l1Background || 'bg-sidebar-background'} flex flex-col items-center py-4 space-y-4 overflow-y-auto scrollbar-hide`}
        >
        {/* Logo */}
        <div data-tour="client-compass-logo" className="w-20 h-20 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
          <img
            src={logoVertical}
            alt="Xyreg Logo"
            className="h-20 w-20 object-contain"
          />
        </div>

          {/* Investor Modules */}
          <div className="flex flex-col space-y-2">
            {filteredModules.map(renderModuleButton)}
          </div>

          {/* Bottom spacing */}
          <div className="flex-1" />

          {/* Help Button */}
          {/* <div className="flex flex-col space-y-2 mb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setHelpSidebarOpen(true)}
                  className={`
                    relative w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer
                    ${customStyles?.textColor || 'text-sidebar-foreground'} hover:${customStyles?.accentColor || 'bg-sidebar-accent'} hover:text-sidebar-accent-foreground
                  `}
                >
                  <BookOpen className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <div className="font-semibold">{lang('sidebar.helpShortcut')}</div>
              </TooltipContent>
            </Tooltip>
          </div> */}

          {/* User Profile Module (at bottom) */}
          {renderModuleButton(userProfileModule)}
        </div>

        {/* Global Help Sidebar */}
        <GlobalHelpSidebar open={helpSidebarOpen} onOpenChange={setHelpSidebarOpen} />
      </TooltipProvider>
    );
  }

  // Normal L1 for all users (Genesis and non-Genesis)
  return (
    <TooltipProvider>
      <div
        data-tour="sidebar"
        className={`w-16 h-screen fixed left-0 top-0 z-20 ${customStyles?.l1Background || 'bg-sidebar-background'} flex flex-col items-center py-4 space-y-4 overflow-y-auto scrollbar-hide`}
      >
        {/* Logo */}
        <div data-tour="client-compass-logo" className="w-20 h-20 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
          <img
            src={logoVertical}
            alt="Xyreg Logo"
            className="h-20 w-20 object-contain"
          />
        </div>

        {/* Main Modules */}
        <div className="flex flex-col space-y-2">
          {filteredModules.map(renderModuleButton)}
        </div>

        {/* XyReg Genesis - Below Document Studio (only for Genesis plan) */}
        {isGenesis && (
        <div className="flex flex-col space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  onModuleSelect('genesis');
                  if (currentProductId) {
                    navigate(`/app/product/${currentProductId}/business-case?tab=genesis`);
                  } else {
                    const storedCompany = localStorage.getItem('lastSelectedCompany');
                    if (storedCompany) {
                      navigate(`/app/company/${encodeURIComponent(storedCompany)}/genesis`);
                    } else {
                      navigate('/app/genesis');
                    }
                  }
                }}
                className={`
                  relative w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer
                  ${activeModule === 'genesis' ? 'bg-amber-100 text-amber-700' : `${customStyles?.textColor || 'text-sidebar-foreground'} hover:${customStyles?.accentColor || 'bg-sidebar-accent'} hover:text-sidebar-accent-foreground`}
                `}
              >
                <Crosshair className="w-5 h-5 text-amber-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <div className="font-semibold">XyReg Genesis</div>
            </TooltipContent>
          </Tooltip>
        </div>
        )}

        {/* Bottom spacing */}
        <div className="flex-1" />

        {/* Help Button - Above Get Started */}
        {/* <div className="flex flex-col space-y-2 mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setHelpSidebarOpen(true)}
                className={`
                  relative w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer
                  ${customStyles?.textColor || 'text-sidebar-foreground'} hover:${customStyles?.accentColor || 'bg-sidebar-accent'} hover:text-sidebar-accent-foreground
                `}
              >
                <BookOpen className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <div className="font-semibold">{lang('sidebar.helpShortcut')}</div>
            </TooltipContent>
          </Tooltip>
        </div> */}

        {/* Get Started Button */}
        {/* <div className="flex flex-col space-y-2 mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setShowGetStarted(true)}
                className={`
                  relative w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer
                  ${customStyles?.textColor || 'text-sidebar-foreground'} hover:${customStyles?.accentColor || 'bg-sidebar-accent'} hover:text-sidebar-accent-foreground
                `}
              >
                <Rocket className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <div className="font-semibold">{lang('sidebar.getStarted')}</div>
            </TooltipContent>
          </Tooltip>
        </div> */}

        {/* Company Settings Module - only for admin, company_admin, and consultant (NOT for author) */}
        {companySettingsModule && effectiveRole && ['admin', 'company_admin', 'consultant', 'investor', 'business'].includes(effectiveRole as string) && effectiveRole !== 'author' && renderModuleButton(companySettingsModule)}

        {/* User Profile Module (at bottom) */}
        {/* {renderModuleButton(userProfileModule)} */}
      </div>

      {/* Global Help Sidebar */}
      <GlobalHelpSidebar open={helpSidebarOpen} onOpenChange={setHelpSidebarOpen} />

      {/* Todoist Style Onboarding Dialog */}
      <TodoistStyleOnboarding
        isOpen={showGetStarted}
        onClose={() => setShowGetStarted(false)}
        onComplete={() => setShowGetStarted(false)}
      />
    </TooltipProvider>
  );
}
