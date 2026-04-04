import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Target,
  BookOpen,
  Play,
  Search,
  HelpCircle,
  Award,
  Calendar,
  Download
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from '@/hooks/useTranslation';

interface HelpAnalyticsData {
  // Usage metrics
  totalHelpViews: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  topHelpTopics: Array<{ id: string; title: string; views: number; avgTime: number }>;
  
  // Search analytics
  totalSearches: number;
  popularSearchTerms: Array<{ term: string; count: number; successRate: number }>;
  noResultsQueries: Array<{ term: string; count: number }>;
  
  // Onboarding metrics
  onboardingCompletionRate: number;
  avgOnboardingTime: number;
  dropoffPoints: Array<{ stage: string; dropoffRate: number }>;
  
  // User engagement
  videoCompletionRates: Array<{ videoId: string; title: string; completionRate: number }>;
  tooltipInteractions: number;
  contextualHelpViews: number;
  
  // Trends
  weeklyTrends: Array<{ date: string; helpViews: number; searches: number; onboardingStarts: number }>;
  userSatisfactionScore: number;
}

interface HelpAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

// Mock analytics service - in real implementation, this would connect to actual analytics backend
class HelpAnalyticsService {
  private static instance: HelpAnalyticsService;
  private events: Array<{ type: string; data: any; timestamp: number; userId?: string }> = [];

  static getInstance(): HelpAnalyticsService {
    if (!this.instance) {
      this.instance = new HelpAnalyticsService();
    }
    return this.instance;
  }

  // Track help system events
  trackEvent(type: string, data: any, userId?: string) {
    const event = {
      type,
      data,
      timestamp: Date.now(),
      userId
    };
    
    this.events.push(event);
    
    // Store in localStorage for persistence
    const stored = localStorage.getItem('xyreg-help-analytics') || '[]';
    try {
      const events = JSON.parse(stored);
      events.push(event);
      // Keep only last 1000 events
      localStorage.setItem('xyreg-help-analytics', JSON.stringify(events.slice(-1000)));
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }
    
  }

  // Load events from localStorage
  loadStoredEvents() {
    const stored = localStorage.getItem('xyreg-help-analytics');
    if (stored) {
      try {
        this.events = JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to load stored events:', error);
      }
    }
  }

  // Generate analytics data from events
  generateAnalytics(): HelpAnalyticsData {
    this.loadStoredEvents();
    
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp > weekAgo);
    
    // Calculate metrics
    const helpViews = recentEvents.filter(e => e.type === 'help_topic_view').length;
    const uniqueUsers = new Set(recentEvents.map(e => e.userId).filter(Boolean)).size;
    const searches = recentEvents.filter(e => e.type === 'help_search').length;
    
    // Mock data - in real implementation, calculate from actual events
    return {
      totalHelpViews: helpViews || 142,
      uniqueUsers: uniqueUsers || 23,
      avgSessionDuration: 4.2,
      topHelpTopics: [
        { id: 'getting-started', title: 'Getting Started with XYREG', views: 45, avgTime: 3.2 },
        { id: 'product-creation', title: 'Product Creation & Setup', views: 32, avgTime: 5.1 },
        { id: 'document-control-system', title: 'Document Control System', views: 28, avgTime: 4.8 },
        { id: 'gap-analysis', title: 'Gap Analysis & Compliance', views: 19, avgTime: 6.2 },
        { id: 'company-setup', title: 'Company Setup & Configuration', views: 15, avgTime: 7.1 }
      ],
      totalSearches: searches || 89,
      popularSearchTerms: [
        { term: 'document upload', count: 23, successRate: 0.87 },
        { term: 'classification', count: 18, successRate: 0.94 },
        { term: 'gap analysis', count: 16, successRate: 0.92 },
        { term: 'milestones', count: 12, successRate: 0.75 },
        { term: 'audit', count: 9, successRate: 0.89 }
      ],
      noResultsQueries: [
        { term: 'pdf export', count: 5 },
        { term: 'integration api', count: 3 },
        { term: 'custom fields', count: 2 }
      ],
      onboardingCompletionRate: 0.68,
      avgOnboardingTime: 12.5,
      dropoffPoints: [
        { stage: 'Welcome & Setup', dropoffRate: 0.15 },
        { stage: 'Company Configuration', dropoffRate: 0.22 },
        { stage: 'Product Management', dropoffRate: 0.18 },
        { stage: 'Document Control', dropoffRate: 0.25 },
        { stage: 'Advanced Features', dropoffRate: 0.32 }
      ],
      videoCompletionRates: [
        { videoId: 'getting-started', title: 'Getting Started Tutorial', completionRate: 0.78 },
        { videoId: 'product-management', title: 'Product Management Guide', completionRate: 0.65 },
        { videoId: 'document-management', title: 'Document Control System', completionRate: 0.71 },
        { videoId: 'gap-analysis', title: 'Gap Analysis Walkthrough', completionRate: 0.59 }
      ],
      tooltipInteractions: 156,
      contextualHelpViews: 78,
      weeklyTrends: [
        { date: '2025-01-11', helpViews: 18, searches: 12, onboardingStarts: 3 },
        { date: '2025-01-12', helpViews: 22, searches: 15, onboardingStarts: 5 },
        { date: '2025-01-13', helpViews: 31, searches: 18, onboardingStarts: 2 },
        { date: '2025-01-14', helpViews: 28, searches: 21, onboardingStarts: 4 },
        { date: '2025-01-15', helpViews: 35, searches: 16, onboardingStarts: 6 },
        { date: '2025-01-16', helpViews: 26, searches: 19, onboardingStarts: 3 },
        { date: '2025-01-17', helpViews: 41, searches: 24, onboardingStarts: 8 }
      ],
      userSatisfactionScore: 4.3
    };
  }
}

export const helpAnalytics = HelpAnalyticsService.getInstance();

export function HelpAnalytics({ isOpen, onClose, userRole }: HelpAnalyticsProps) {
  const { lang } = useTranslation();
  const [analyticsData, setAnalyticsData] = useState<HelpAnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      // Load analytics data
      const data = helpAnalytics.generateAnalytics();
      setAnalyticsData(data);
    }
  }, [isOpen]);

  const formatDuration = (minutes: number) => {
    return `${minutes.toFixed(1)}m`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!isOpen || !analyticsData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed inset-4 bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="flex h-full">
          {/* Header */}
          <div className="flex-1 flex flex-col">
            <div className="border-b border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="bg-gradient-to-br from-primary to-primary/70 p-2 rounded-xl text-white">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    {lang('helpAnalytics.title')}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {lang('helpAnalytics.description')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as any)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="7d">{lang('helpAnalytics.period.7d')}</option>
                    <option value="30d">{lang('helpAnalytics.period.30d')}</option>
                    <option value="90d">{lang('helpAnalytics.period.90d')}</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {lang('helpAnalytics.export')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    ×
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="overview" className="h-full">
                <div className="border-b border-border px-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">{lang('helpAnalytics.tabs.overview')}</TabsTrigger>
                    <TabsTrigger value="content">{lang('helpAnalytics.tabs.content')}</TabsTrigger>
                    <TabsTrigger value="onboarding">{lang('helpAnalytics.tabs.onboarding')}</TabsTrigger>
                    <TabsTrigger value="search">{lang('helpAnalytics.tabs.search')}</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="overview" className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <HelpCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{lang('helpAnalytics.metrics.totalViews')}</p>
                              <p className="text-2xl font-bold">{analyticsData.totalHelpViews}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <Users className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{lang('helpAnalytics.metrics.uniqueUsers')}</p>
                              <p className="text-2xl font-bold">{analyticsData.uniqueUsers}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <Clock className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{lang('helpAnalytics.metrics.avgSession')}</p>
                              <p className="text-2xl font-bold">{formatDuration(analyticsData.avgSessionDuration)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                              <Search className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{lang('helpAnalytics.metrics.searches')}</p>
                              <p className="text-2xl font-bold">{analyticsData.totalSearches}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* User Satisfaction */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          {lang('helpAnalytics.userSatisfaction.title')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold text-green-600">
                            {analyticsData.userSatisfactionScore.toFixed(1)}/5.0
                          </div>
                          <div className="flex-1">
                            <Progress
                              value={(analyticsData.userSatisfactionScore / 5) * 100}
                              className="h-2"
                            />
                          </div>
                          <Badge variant="secondary">
                            {lang('helpAnalytics.userSatisfaction.excellent')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-6">
                    {/* Top Help Topics */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Most Viewed Help Topics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analyticsData.topHelpTopics.map((topic, index) => (
                            <div key={topic.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">#{index + 1}</Badge>
                                <div>
                                  <p className="font-medium">{topic.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {topic.views} views • {formatDuration(topic.avgTime)} avg. time
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">{topic.views}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Video Analytics */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Play className="h-5 w-5" />
                          Video Tutorial Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analyticsData.videoCompletionRates.map((video) => (
                            <div key={video.videoId} className="space-y-2">
                              <div className="flex justify-between">
                                <span className="font-medium">{video.title}</span>
                                <span className="text-sm text-muted-foreground">
                                  {formatPercentage(video.completionRate)} completion
                                </span>
                              </div>
                              <Progress value={video.completionRate * 100} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="onboarding" className="space-y-6">
                    {/* Onboarding Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Completion Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            {formatPercentage(analyticsData.onboardingCompletionRate)}
                          </div>
                          <Progress value={analyticsData.onboardingCompletionRate * 100} className="h-3" />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Average Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600">
                            {formatDuration(analyticsData.avgOnboardingTime)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Time to complete onboarding
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Drop-off Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Drop-off Points</CardTitle>
                        <CardDescription>
                          Where users are leaving the onboarding process
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analyticsData.dropoffPoints.map((point) => (
                            <div key={point.stage} className="space-y-2">
                              <div className="flex justify-between">
                                <span className="font-medium">{point.stage}</span>
                                <span className={`text-sm ${
                                  point.dropoffRate > 0.3 ? 'text-red-600' : 
                                  point.dropoffRate > 0.2 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {formatPercentage(point.dropoffRate)} drop-off
                                </span>
                              </div>
                              <Progress 
                                value={point.dropoffRate * 100} 
                                className={`h-2 ${
                                  point.dropoffRate > 0.3 ? '[&>div]:bg-red-500' : 
                                  point.dropoffRate > 0.2 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="search" className="space-y-6">
                    {/* Popular Search Terms */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Popular Search Terms</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analyticsData.popularSearchTerms.map((term, index) => (
                            <div key={term.term} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">#{index + 1}</Badge>
                                <div>
                                  <p className="font-medium">"{term.term}"</p>
                                  <p className="text-sm text-muted-foreground">
                                    {term.count} searches • {formatPercentage(term.successRate)} success rate
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                variant={term.successRate > 0.8 ? "default" : term.successRate > 0.6 ? "secondary" : "destructive"}
                              >
                                {formatPercentage(term.successRate)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* No Results Queries */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Searches with No Results</CardTitle>
                        <CardDescription>
                          Identify content gaps and improvement opportunities
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analyticsData.noResultsQueries.map((query) => (
                            <div key={query.term} className="flex justify-between items-center p-2 bg-red-50 rounded">
                              <span className="font-medium">"{query.term}"</span>
                              <Badge variant="destructive">{query.count} searches</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for tracking help events
export function useHelpAnalytics() {
  const { user } = useAuth();

  const trackHelpEvent = (type: string, data: any) => {
    helpAnalytics.trackEvent(type, data, user?.id);
  };

  return {
    trackTopicView: (topicId: string, topicTitle: string) => {
      trackHelpEvent('help_topic_view', { topicId, topicTitle });
    },
    trackSearch: (query: string, resultsCount: number) => {
      trackHelpEvent('help_search', { query, resultsCount });
    },
    trackOnboardingStep: (stepId: string, stageId: string, completed: boolean) => {
      trackHelpEvent('onboarding_step', { stepId, stageId, completed });
    },
    trackVideoProgress: (videoId: string, progress: number, completed: boolean) => {
      trackHelpEvent('video_progress', { videoId, progress, completed });
    },
    trackTooltipInteraction: (tooltipId: string, action: string) => {
      trackHelpEvent('tooltip_interaction', { tooltipId, action });
    },
    trackContextualHelp: (route: string, helpKey: string) => {
      trackHelpEvent('contextual_help_view', { route, helpKey });
    }
  };
}
