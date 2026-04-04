import React, { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Clock, TrendingUp, BookOpen, Lightbulb, X } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface HelpTopic {
  id: string;
  translationKey: string;
  title: string;
  description: string;
  category: string;
  content: string;
  userRoles: string[];
  tags: string[];
  videoUrl?: string;
}

interface SearchResult extends HelpTopic {
  score: number;
  matchedTerms: string[];
  contextualRelevance: number;
}

interface HelpSearchBoxProps {
  helpTopics: HelpTopic[];
  onTopicSelect: (topic: HelpTopic) => void;
  userRole: string;
  className?: string;
}

export function HelpSearchBox({ 
  helpTopics, 
  onTopicSelect, 
  userRole, 
  className 
}: HelpSearchBoxProps) {
  const { lang } = useTranslation();
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularTopics, setPopularTopics] = useState<string[]>([]);
  const location = useLocation();

  // Helper function to get translated topic title
  const getTopicTitle = (topic: HelpTopic): string => {
    if (!topic.translationKey) return topic.title;
    return lang(`enhancedHelp.helpTopics.${topic.translationKey}.title`) || topic.title;
  };

  // Helper function to get translated topic description
  const getTopicDescription = (topic: HelpTopic): string => {
    if (!topic.translationKey) return topic.description;
    return lang(`enhancedHelp.helpTopics.${topic.translationKey}.description`) || topic.description;
  };

  // Helper function to get translated category name
  const getTranslatedCategory = (category: string): string => {
    const categoryKeyMap: Record<string, string> = {
      'Smart Cost Intelligence': 'smartCostIntelligence',
      'Getting Started': 'gettingStarted',
      'Mission Control': 'missionControl',
      'Company Management': 'companyManagement',
      'Product Management': 'productManagement',
      'Document Management': 'documentManagement',
      'Compliance & Gap Analysis': 'complianceGapAnalysis',
      'Audit Management': 'auditManagement',
      'Classification & Risk': 'classificationRisk',
      'User Management': 'userManagement',
      'Business Analysis': 'businessAnalysis',
      'Communications': 'communications',
      'Financial Management': 'financialManagement',
      'Archive Management': 'archiveManagement',
      'Core Platform': 'corePlatform'
    };
    const key = categoryKeyMap[category];
    return key ? lang(`enhancedHelp.categories.${key}`) : category;
  };

  // Load recent searches and popular topics from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('xyreg-help-search-history');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setRecentSearches(data.recent || []);
        setPopularTopics(data.popular || []);
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }, []);

  // Save search history
  const saveSearchHistory = (searchQuery: string, topicId?: string) => {
    const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    const newPopular = topicId 
      ? [topicId, ...popularTopics.filter(id => id !== topicId)].slice(0, 10)
      : popularTopics;

    setRecentSearches(newRecent);
    setPopularTopics(newPopular);

    localStorage.setItem('xyreg-help-search-history', JSON.stringify({
      recent: newRecent,
      popular: newPopular
    }));
  };

  // Get contextual relevance based on current route
  const getContextualRelevance = (topic: HelpTopic): number => {
    const currentPath = location.pathname;
    
    // Route-based relevance scoring
    const routeRelevance: Record<string, string[]> = {
      '/app/mission-control': ['mission-control'],
      '/app/clients': ['mission-control', 'company-dashboard'],
      '/app/company': ['company-setup', 'company-dashboard', 'product-creation'],
      '/app/product': ['product-creation', 'product-lifecycle-management', 'document-control-system'],
      '/app/documents': ['document-control-system', 'template-management'],
      '/app/gap-analysis': ['gap-analysis'],
      '/app/audits': ['audit-management'],
      '/app/users': ['user-management'],
      '/app/business-analysis': ['business-analysis'],
      '/app/communications': ['communications'],
      '/app/billing': ['billing-subscriptions'],
      '/app/archives': ['archive-management']
    };

    for (const [route, topicIds] of Object.entries(routeRelevance)) {
      if (currentPath.includes(route.replace('/app', ''))) {
        if (topicIds.includes(topic.id)) {
          return 1.0; // High relevance
        }
      }
    }

    return 0.0; // No contextual relevance
  };

  // Advanced search algorithm with contextual awareness
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
    if (searchTerms.length === 0) return [];

    const results: SearchResult[] = helpTopics
      .filter(topic => topic.userRoles.includes(userRole))
      .map(topic => {
        let score = 0;
        const matchedTerms: string[] = [];

        // Search in different fields with different weights
        const searchableText = {
          title: { text: topic.title.toLowerCase(), weight: 3.0 },
          description: { text: topic.description.toLowerCase(), weight: 2.0 },
          content: { text: topic.content.toLowerCase(), weight: 1.5 },
          tags: { text: topic.tags.join(' ').toLowerCase(), weight: 2.5 },
          category: { text: topic.category.toLowerCase(), weight: 2.0 }
        };

        searchTerms.forEach(term => {
          Object.entries(searchableText).forEach(([field, { text, weight }]) => {
            if (text.includes(term)) {
              // Exact match bonus
              if (text === term) {
                score += weight * 2;
              } else if (text.startsWith(term)) {
                score += weight * 1.5;
              } else {
                score += weight;
              }
              
              if (!matchedTerms.includes(term)) {
                matchedTerms.push(term);
              }
            }
          });
        });

        // Contextual relevance bonus
        const contextualRelevance = getContextualRelevance(topic);
        if (contextualRelevance > 0) {
          score += contextualRelevance * 2.0; // Boost contextually relevant results
        }

        // Popular topic bonus
        if (popularTopics.includes(topic.id)) {
          score += 0.5;
        }

        return {
          ...topic,
          score,
          matchedTerms,
          contextualRelevance
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Limit to top 8 results

    return results;
  }, [query, helpTopics, userRole, location.pathname, popularTopics]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    saveSearchHistory(searchQuery);
  };

  const handleTopicClick = (topic: HelpTopic) => {
    saveSearchHistory(query, topic.id);
    onTopicSelect(topic);
    setQuery('');
    setIsExpanded(false);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
  };

  const clearSearch = () => {
    setQuery('');
    setIsExpanded(false);
  };

  const suggestedTopics = helpTopics
    .filter(topic => 
      topic.userRoles.includes(userRole) && 
      getContextualRelevance(topic) > 0
    )
    .slice(0, 3);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={lang('helpSearch.placeholder')}
          className="pl-10 pr-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 h-6 w-6 p-0 -translate-y-1/2"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Results Panel */}
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg overflow-y-auto">
            <div className="max-h-80">
              <CardContent className="p-0">
                {query.trim() ? (
                  // Search Results
                  searchResults.length > 0 ? (
                    <div className="p-2">
                      <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                        {lang('helpSearch.searchResults', { count: searchResults.length })}
                      </div>
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => handleTopicClick(result)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-1.5 rounded">
                              <BookOpen className="h-3 w-3 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium line-clamp-1">
                                {getTopicTitle(result)}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {getTopicDescription(result)}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {getTranslatedCategory(result.category)}
                                </Badge>
                                {result.contextualRelevance > 0 && (
                                  <Badge variant="outline" className="text-xs text-primary border-primary/30">
                                    <Lightbulb className="h-2 w-2 mr-1" />
                                    {lang('helpSearch.relevant')}
                                  </Badge>
                                )}
                                {result.videoUrl && (
                                  <Badge variant="outline" className="text-xs">
                                    {lang('helpSearch.video')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{lang('helpSearch.noResults')}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lang('helpSearch.tryDifferent')}
                      </p>
                    </div>
                  )
                ) : (
                  // Default State - Recent searches and suggestions
                  <div className="p-2 space-y-4">
                    {/* Contextual Suggestions */}
                    {suggestedTopics.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          {lang('helpSearch.relevantToPage')}
                        </div>
                        {suggestedTopics.map((topic) => (
                          <div
                            key={topic.id}
                            className="p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                            onClick={() => handleTopicClick(topic)}
                          >
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium line-clamp-1">
                                {getTopicTitle(topic)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lang('helpSearch.recentSearches')}
                        </div>
                        {recentSearches.map((recentQuery, index) => (
                          <div
                            key={index}
                            className="p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                            onClick={() => handleRecentSearchClick(recentQuery)}
                          >
                            <div className="flex items-center gap-2">
                              <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm line-clamp-1">
                                {recentQuery}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Popular Topics */}
                    {popularTopics.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {lang('helpSearch.popularTopics')}
                        </div>
                        {popularTopics.slice(0, 3).map((topicId) => {
                          const topic = helpTopics.find(t => t.id === topicId);
                          if (!topic) return null;
                          
                          return (
                            <div
                              key={topic.id}
                              className="p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                              onClick={() => handleTopicClick(topic)}
                            >
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-3 w-3 text-primary flex-shrink-0" />
                                <span className="text-sm font-medium line-clamp-1">
                                  {getTopicTitle(topic)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty State */}
                    {recentSearches.length === 0 && popularTopics.length === 0 && suggestedTopics.length === 0 && (
                      <div className="p-4 text-center">
                        <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {lang('helpSearch.startTyping')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}