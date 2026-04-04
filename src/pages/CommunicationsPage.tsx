
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { ThreadList } from "@/components/communications/ThreadList";
import { ThreadListSkeleton } from "@/components/communications/ThreadListSkeleton";
import { NewCommunicationDialog } from "@/components/communications/NewCommunicationDialog";
import { useCommunicationThreads } from "@/hooks/useCommunicationThreads";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

import { useCompanyId } from '@/hooks/useCompanyId';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useTranslation } from '@/hooks/useTranslation';

function CommunicationsPageContent() {
  const { lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const companyId = useCompanyId();

  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMUNICATIONS);
  const isRestricted = !isFeatureEnabled;

  const { threads, isLoading } = useCommunicationThreads({
    companyId: companyId || undefined,
    status: activeTab,
    searchQuery,
  });

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('communications.featureName')}
    >
      <div className="flex-1 space-y-4 p-2 pt-4">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{lang('communications.title')}</h1>
              <p className="text-muted-foreground">
                {lang('communications.subtitle')}
              </p>
            </div>
          </div>

          <ErrorBoundary level="component">
            <NewCommunicationDialog disabled={isRestricted}>
              <Button className="gap-2" disabled={isRestricted}>
                <Plus className="h-4 w-4" />
                {lang('communications.newCommunication')}
              </Button>
            </NewCommunicationDialog>
          </ErrorBoundary>
        </div>

        {isRestricted && <RestrictedPreviewBanner />}

        {/* Filter Tabs */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="all">{lang('communications.tabs.all')}</TabsTrigger>
              <TabsTrigger value="active">{lang('communications.tabs.active')}</TabsTrigger>
              <TabsTrigger value="awaiting-response" className="hidden sm:flex">
                {lang('communications.tabs.awaitingResponse')}
              </TabsTrigger>
              <TabsTrigger value="awaiting-response" className="sm:hidden">
                {lang('communications.tabs.pending')}
              </TabsTrigger>
              <TabsTrigger value="closed">{lang('communications.tabs.closed')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={lang('communications.search.placeholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {(searchQuery || activeTab !== 'all') && (
              <div className="text-sm text-muted-foreground">
                {threads.length === 1
                  ? lang('communications.results.threadFound').replace('{{count}}', '1')
                  : lang('communications.results.threadsFound').replace('{{count}}', String(threads.length))}
              </div>
            )}
          </div>
        </div>

        {/* Communication Threads List */}
        <div>
          {isLoading ? (
            <ThreadListSkeleton />
          ) : (
            <ThreadList
              threads={threads}
              activeFilter={activeTab}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>
    </RestrictedFeatureProvider>
  );
}

export default function CommunicationsPage() {
  return (
    <ErrorBoundary level="page">
      <CommunicationsPageContent />
    </ErrorBoundary>
  );
}
