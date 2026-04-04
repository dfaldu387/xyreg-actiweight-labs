
export class DraftStorage {
  private static getKey(productId: string, section: string): string {
    return `npv_draft_${productId}_${section}`;
  }

  static saveDraft<T>(productId: string, section: string, data: T): void {
    try {
      const key = this.getKey(productId, section);
      const draftData = {
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(draftData));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }

  static loadDraft<T>(productId: string, section: string): T | null {
    try {
      const key = this.getKey(productId, section);
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const draftData = JSON.parse(stored);
      
      // Check if draft is not too old (24 hours)
      const draftAge = Date.now() - new Date(draftData.timestamp).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (draftAge > maxAge) {
        this.clearDraft(productId, section);
        return null;
      }

      return draftData.data;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }

  static clearDraft(productId: string, section: string): void {
    try {
      const key = this.getKey(productId, section);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }

  static hasDraft(productId: string, section: string): boolean {
    const draft = this.loadDraft(productId, section);
    return draft !== null;
  }

  static getDraftAge(productId: string, section: string): number | null {
    try {
      const key = this.getKey(productId, section);
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const draftData = JSON.parse(stored);
      return Date.now() - new Date(draftData.timestamp).getTime();
    } catch (error) {
      return null;
    }
  }
}
