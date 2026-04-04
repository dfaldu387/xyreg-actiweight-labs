/**
 * CompanyContextService - Centralized company context management
 *
 * This service provides a single source of truth for company context,
 * preventing the "jumping company" issue caused by multiple conflicting sources.
 */

const STORAGE_KEY = 'xyreg_company_context_v2';
const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours (increased from 30 min)

export interface StoredCompanyContext {
  companyId: string;
  companyName: string;
  lastUpdated: number;
  source: 'user_selection' | 'url_navigation' | 'metadata' | 'primary' | 'fallback';
  isIntentional: boolean; // True if user explicitly selected this company
}

class CompanyContextServiceClass {
  private listeners: Set<(context: StoredCompanyContext | null) => void> = new Set();
  private currentContext: StoredCompanyContext | null = null;

  constructor() {
    // Initialize from storage
    this.currentContext = this.getFromStorage();

    // Listen for storage changes from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
    }
  }

  /**
   * Get the current company context
   */
  get(): StoredCompanyContext | null {
    // Check if cached context is still valid
    if (this.currentContext && this.isExpired(this.currentContext)) {
      
      this.clear();
      return null;
    }
    return this.currentContext;
  }

  /**
   * Get company ID (convenience method)
   */
  getCompanyId(): string | null {
    return this.get()?.companyId || null;
  }

  /**
   * Set the company context
   * @param companyId - The company ID
   * @param companyName - The company name
   * @param source - Where this context came from
   * @param isIntentional - Whether user explicitly selected this company
   */
  set(
    companyId: string,
    companyName: string,
    source: StoredCompanyContext['source'],
    isIntentional: boolean = false
  ): void {
    // Don't override intentional selection with non-intentional one
    if (this.currentContext?.isIntentional && !isIntentional) {
      // Check if it's the same company - update timestamp
      if (this.currentContext.companyId === companyId) {
        this.currentContext.lastUpdated = Date.now();
        this.saveToStorage(this.currentContext);
        return;
      }

      // Different company but current was intentional - log but don't override
      return;
    }

    const newContext: StoredCompanyContext = {
      companyId,
      companyName,
      lastUpdated: Date.now(),
      source,
      isIntentional
    };

    

    this.currentContext = newContext;
    this.saveToStorage(newContext);
    this.notifyListeners(newContext);
  }

  /**
   * Set context from user's explicit selection (highest priority)
   */
  setFromUserSelection(companyId: string, companyName: string): void {
    this.set(companyId, companyName, 'user_selection', true);
  }

  /**
   * Set context from URL navigation (only if no intentional selection exists)
   */
  setFromUrlNavigation(companyId: string, companyName: string): void {
    this.set(companyId, companyName, 'url_navigation', false);
  }

  /**
   * Set context from user metadata (fallback)
   */
  setFromMetadata(companyId: string, companyName: string): void {
    this.set(companyId, companyName, 'metadata', false);
  }

  /**
   * Set context from primary company (fallback)
   */
  setFromPrimary(companyId: string, companyName: string): void {
    this.set(companyId, companyName, 'primary', false);
  }

  /**
   * Force set context (bypasses intentional check - use sparingly)
   */
  forceSet(companyId: string, companyName: string, source: StoredCompanyContext['source']): void {
    const newContext: StoredCompanyContext = {
      companyId,
      companyName,
      lastUpdated: Date.now(),
      source,
      isIntentional: source === 'user_selection'
    };

    

    this.currentContext = newContext;
    this.saveToStorage(newContext);
    this.notifyListeners(newContext);
  }

  /**
   * Clear the company context
   */
  clear(): void {
    
    this.currentContext = null;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    this.notifyListeners(null);
  }

  /**
   * Subscribe to context changes
   */
  subscribe(listener: (context: StoredCompanyContext | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check if the context matches a specific company
   */
  isCompany(companyId: string): boolean {
    return this.currentContext?.companyId === companyId;
  }

  /**
   * Check if user has made an intentional selection
   */
  hasIntentionalSelection(): boolean {
    return this.currentContext?.isIntentional ?? false;
  }

  /**
   * Refresh the timestamp (keep context alive)
   */
  touch(): void {
    if (this.currentContext) {
      this.currentContext.lastUpdated = Date.now();
      this.saveToStorage(this.currentContext);
    }
  }

  // Private methods

  private getFromStorage(): StoredCompanyContext | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const context = JSON.parse(stored) as StoredCompanyContext;

      if (this.isExpired(context)) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return context;
    } catch (e) {
      console.error('[CompanyContextService] Error reading from storage:', e);
      return null;
    }
  }

  private saveToStorage(context: StoredCompanyContext): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    } catch (e) {
      console.error('[CompanyContextService] Error saving to storage:', e);
    }
  }

  private isExpired(context: StoredCompanyContext): boolean {
    return Date.now() - context.lastUpdated > EXPIRATION_MS;
  }

  private handleStorageChange = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY) {
      
      this.currentContext = this.getFromStorage();
      this.notifyListeners(this.currentContext);
    }
  };

  private notifyListeners(context: StoredCompanyContext | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(context);
      } catch (e) {
        console.error('[CompanyContextService] Error in listener:', e);
      }
    });
  }
}

// Export singleton instance
export const CompanyContextService = new CompanyContextServiceClass();

// Export for testing
export { CompanyContextServiceClass };
