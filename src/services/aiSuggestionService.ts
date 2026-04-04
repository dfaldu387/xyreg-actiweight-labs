/**
 * AI Suggestion Service
 * Manages inline AI suggestions with accept/reject functionality
 */

import { DocumentContent } from '@/types/documentComposer';

export interface AISuggestion {
  id: string;
  contentId: string;
  originalContent: string;
  suggestedContent: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export class AISuggestionService {
  private static suggestions: Map<string, AISuggestion> = new Map();

  /**
   * Create a new AI suggestion for content
   */
  static createSuggestion(
    contentId: string, 
    originalContent: string, 
    suggestedContent: string
  ): AISuggestion {
    const suggestion: AISuggestion = {
      id: `suggestion_${contentId}_${Date.now()}`,
      contentId,
      originalContent,
      suggestedContent,
      timestamp: new Date(),
      status: 'pending'
    };

    this.suggestions.set(contentId, suggestion);
    return suggestion;
  }

  /**
   * Accept a suggestion and apply the suggested content
   */
  static acceptSuggestion(contentId: string): string | null {
    const suggestion = this.suggestions.get(contentId);
    if (!suggestion) return null;

    suggestion.status = 'accepted';
    return suggestion.suggestedContent;
  }

  /**
   * Reject a suggestion and keep the original content
   */
  static rejectSuggestion(contentId: string): string | null {
    const suggestion = this.suggestions.get(contentId);
    if (!suggestion) return null;

    suggestion.status = 'rejected';
    this.suggestions.delete(contentId);
    return suggestion.originalContent;
  }

  /**
   * Get a pending suggestion for content
   */
  static getPendingSuggestion(contentId: string): AISuggestion | null {
    const suggestion = this.suggestions.get(contentId);
    return suggestion && suggestion.status === 'pending' ? suggestion : null;
  }

  /**
   * Check if content has a pending suggestion
   */
  static hasPendingSuggestion(contentId: string): boolean {
    return this.getPendingSuggestion(contentId) !== null;
  }

  /**
   * Clear all suggestions
   */
  static clearSuggestions(): void {
    this.suggestions.clear();
  }

  /**
   * Get all pending suggestions
   */
  static getAllPendingSuggestions(): AISuggestion[] {
    return Array.from(this.suggestions.values()).filter(s => s.status === 'pending');
  }

  /**
   * Mark content as containing AI-generated suggestion for highlighting
   */
  static markAsSuggestion(originalContent: string, suggestedContent: string): string {
    return `<div class="ai-suggestion-container" data-original="${encodeURIComponent(originalContent)}" data-suggested="${encodeURIComponent(suggestedContent)}">${originalContent}</div>`;
  }

  /**
   * Extract suggestion data from marked content
   */
  static extractSuggestionData(content: string): { original: string, suggested: string } | null {
    const match = content.match(/data-original="([^"]*)" data-suggested="([^"]*)"/);
    if (!match) return null;

    return {
      original: decodeURIComponent(match[1]),
      suggested: decodeURIComponent(match[2])
    };
  }
}