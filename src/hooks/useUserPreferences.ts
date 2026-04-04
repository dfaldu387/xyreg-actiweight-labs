import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export type PortfolioViewType = "sunburst" | "phases-chart" | "cards" | "phases" | "timeline" | "list" | "categorisation";
export type MilestonesViewType = "milestones" | "gantt" | "gantt-v2" | "costs";

interface UserPreferences {
  default_portfolio_view?: PortfolioViewType;
  default_milestones_view?: MilestonesViewType;
  show_phase_categories?: boolean;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from localStorage
  const loadPreferences = useCallback(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const key = `user_preferences_${user.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Save portfolio view preference
  const savePortfolioViewPreference = useCallback(async (view: PortfolioViewType) => {
    if (!user?.id) return false;

    setIsSaving(true);
    try {
      const key = `user_preferences_${user.id}`;
      const newPreferences = {
        ...preferences,
        default_portfolio_view: view
      };
      
      localStorage.setItem(key, JSON.stringify(newPreferences));
      setPreferences(newPreferences);

      return true;
    } catch (error) {
      console.error('Error saving portfolio view preference:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, preferences]);

  // Save milestones view preference
  const saveMilestonesViewPreference = useCallback(async (view: MilestonesViewType) => {
    if (!user?.id) return false;

    setIsSaving(true);
    try {
      const key = `user_preferences_${user.id}`;
      const newPreferences = {
        ...preferences,
        default_milestones_view: view
      };
      
      localStorage.setItem(key, JSON.stringify(newPreferences));
      setPreferences(newPreferences);

      return true;
    } catch (error) {
      console.error('Error saving milestones view preference:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, preferences]);

  // Save show phase categories preference
  const saveShowPhaseCategoriesPreference = useCallback(async (show: boolean) => {
    if (!user?.id) return false;

    setIsSaving(true);
    try {
      const key = `user_preferences_${user.id}`;
      const newPreferences = {
        ...preferences,
        show_phase_categories: show
      };
      
      localStorage.setItem(key, JSON.stringify(newPreferences));
      setPreferences(newPreferences);

      return true;
    } catch (error) {
      console.error('Error saving show phase categories preference:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, preferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const defaultPortfolioView = preferences.default_portfolio_view || 'sunburst';
  const defaultMilestonesView = preferences.default_milestones_view || 'milestones';
  const showPhaseCategories = preferences.show_phase_categories !== false; // defaults to true

  return {
    preferences,
    isLoading,
    isSaving,
    savePortfolioViewPreference,
    saveMilestonesViewPreference,
    saveShowPhaseCategoriesPreference,
    defaultPortfolioView,
    defaultMilestonesView,
    showPhaseCategories
  };
}