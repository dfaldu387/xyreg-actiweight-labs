
// Global error handlers to catch silent failures
window.addEventListener('error', (event) => {
  console.error('[GLOBAL ERROR]', event.error?.message || event.message, event.error?.stack);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[UNHANDLED REJECTION]', event.reason?.message || event.reason, event.reason?.stack);
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
          <DevModeProvider>
            <LanguageProvider>
              <AuthProvider>
                <SubscriptionProvider>
                  <CompanyRoleProvider>
                  <MissionControlProvider>
                    <AdvancedSettingsProvider>
                      <OnboardingTourProvider>
                        <HelpModeProvider>
                          <GapAnalysisHelpProvider>
                            <ConfirmDialogProvider>
                              <App />
                              <Toaster position="top-center" richColors />
                            </ConfirmDialogProvider>
                          </GapAnalysisHelpProvider>
                        </HelpModeProvider>
                      </OnboardingTourProvider>
                    </AdvancedSettingsProvider>
                  </MissionControlProvider>
                </CompanyRoleProvider>
                </SubscriptionProvider>
              </AuthProvider>
            </LanguageProvider>
          </DevModeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
