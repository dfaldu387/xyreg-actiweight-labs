
import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, List, LayoutGrid } from "lucide-react";
import { ThreadList } from "@/components/communications/ThreadList";
import { ThreadListSkeleton } from "@/components/communications/ThreadListSkeleton";
import { ThreadKanbanBoard } from "@/components/communications/ThreadKanbanBoard";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const companyId = useCompanyId();

  const view = searchParams.get('view') === 'board' ? 'board' : 'list';
  const setView = (v: 'list' | 'board') => {
    const next = new URLSearchParams(searchParams);
    if (v === 'board') next.set('view', 'board'); else next.delete('view');
    setSearchParams(next, { replace: true });
  };

  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMUNICATIONS);
  const isRestricted = !isFeatureEnabled;

  // For board view: pull all threads (any status) so columns can show closed at the bottom.
  // For list view: respect the selected tab.
  const { threads, isLoading } = useCommunicationThreads({
    companyId: companyId || undefined,
    status: view === 'board' ? 'all' : activeTab,
    searchQuery: view === 'board' ? '' : searchQuery,
  });

  // Board view needs closed threads too; refetch with status=closed and merge if open list excludes them.
  const { threads: closedThreads = [] } = useCommunicationThreads({
    companyId: companyId || undefined,
    status: view === 'board' ? 'closed' : 'all',
  });

  const boardThreads = useMemo(() => {
    if (view !== 'board') return [];
    const seen = new Set<string>();
    const merged = [...threads, ...closedThreads].filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    return merged;
  }, [view, threads, closedThreads]);

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

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border bg-background p-0.5">
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 gap-1"
                onClick={() => setView('list')}
                title="List view"
              >
                <List className="h-4 w-4" />
                List
              </Button>
              <Button
                variant={view === 'board' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 gap-1"
                onClick={() => setView('board')}
                title="Module-grouped board"
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </Button>
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
        </div>

        {isRestricted && <RestrictedPreviewBanner />}

        {view === 'list' && (
          <>
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
                  <TabsTrigger value="all">{lang('communications.tabs.all')}</TabsTrigger>
                  <TabsTrigger value="active">{lang('communications.tabs.active')}</TabsTrigger>
                  <TabsTrigger value="awaiting-response">
                    {lang('communications.tabs.awaitingResponse')}
                  </TabsTrigger>
                  <TabsTrigger value="closed">{lang('communications.tabs.closed')}</TabsTrigger>
                </TabsList>
              </Tabs>

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
          </>
        )}

        {view === 'board' && (
          <div>
            {isLoading ? (
              <ThreadListSkeleton />
            ) : (
              <ThreadKanbanBoard threads={boardThreads} />
            )}
          </div>
        )}
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
