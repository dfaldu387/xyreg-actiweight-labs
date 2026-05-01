
// Global error handlers to catch silent failures
window.addEventListener('error', (event) => {
  console.error('[GLOBAL ERROR]', event.error?.message || event.message, event.error?.stack);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[UNHANDLED REJECTION]', event.reason?.message || event.reason, event.reason?.stack);
  // Catch NO_CREDITS errors from any AI call and show the dialog
  const msg = event.reason?.message || event.reason?.toString?.() || '';
  if (msg.includes('NO_CREDITS')) {
    event.preventDefault();
    window.dispatchEvent(new Event('no-ai-credits'));
  }
});

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// React PDF Highlighter CSS is imported internally by the components
import '@svar-ui/react-gantt/all.css';
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { TooltipStyles } from './components/ui/tooltip.tsx'
import { AuthProvider } from './context/AuthContext'
import { DevModeProvider } from './context/DevModeContext'
import { ConfirmDialogProvider } from './components/ui/confirm-dialog'
import { SubscriptionProvider } from './context/SubscriptionContext'
import { CompanyRoleProvider } from './context/CompanyRoleContext'
import { MissionControlProvider } from './context/MissionControlContext'
import { LanguageProvider } from './context/LanguageContext'
import { ErrorBoundary } from './components/error/ErrorBoundary'
import { queryClient } from './lib/query-client'
import { OnboardingTourProvider } from './context/OnboardingTourContext'
import { AdvancedSettingsProvider } from './context/AdvancedSettingsContext'
import { HelpModeProvider } from './context/HelpModeContext'
import { GapAnalysisHelpProvider } from './context/GapAnalysisHelpContext'
import { Toaster } from "sonner";
import { RightRailProvider } from './context/RightRailContext';
import { AiCreditProvider } from './context/AiCreditContext';
import { TokenAuthHandler } from './components/auth/TokenAuthHandler';
// Ensure we have an element to mount the app - BrowserRouter must wrap all providers
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

// Create the root once
const root = createRoot(rootElement);

// Render with proper React import and structure
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary level="critical">
        <QueryClientProvider client={queryClient}>
          <TooltipStyles /> 
          <TokenAuthHandler>
          <DevModeProvider>
            <LanguageProvider>
              <AuthProvider>
                <SubscriptionProvider>
                  <CompanyRoleProvider>
                  <AiCreditProvider>
                  <MissionControlProvider>
                    <AdvancedSettingsProvider>
                      <OnboardingTourProvider>
                        <HelpModeProvider>
                          <GapAnalysisHelpProvider>
                            <ConfirmDialogProvider>
                              <RightRailProvider>
                                <App />
                                <Toaster position="top-center" richColors />
                              </RightRailProvider>
                            </ConfirmDialogProvider>
                          </GapAnalysisHelpProvider>
                        </HelpModeProvider>
                      </OnboardingTourProvider>
                    </AdvancedSettingsProvider>
                  </MissionControlProvider>
                  </AiCreditProvider>
                </CompanyRoleProvider>
                </SubscriptionProvider>
              </AuthProvider>
            </LanguageProvider>
          </DevModeProvider>
          </TokenAuthHandler>
        </QueryClientProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
