// Onboarding module types and interfaces

export type ModuleDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ModuleCategory = 
  | 'Core Platform' 
  | 'Product Management' 
  | 'Document Control'
  | 'Compliance & Risk'
  | 'Business & Analysis'
  | 'Administration'
  | 'Collaboration';

export interface ModuleStep {
  id: string;
  title: string;
  content: string;
  interactiveElements?: InteractiveElement[];
  media?: ModuleMedia;
  tips?: string[];
  commonMistakes?: string[];
}

export interface InteractiveElement {
  type: 'hotspot' | 'video' | 'interactive-demo' | 'quiz';
  target?: string;
  tooltip?: string;
  url?: string;
  data?: any;
}

export interface ModuleMedia {
  screenshot?: string;
  video?: string;
  thumbnails?: string[];
}

export interface ModuleExample {
  scenario: string;
  description?: string;
  steps: string[];
  expectedOutcome?: string;
  tips?: string[];
}

export interface ModuleQuickReference {
  shortcuts?: KeyboardShortcut[];
  commonTasks?: CommonTask[];
  cheatSheet?: CheatSheetItem[];
}

export interface KeyboardShortcut {
  key: string;
  action: string;
  context?: string;
}

export interface CommonTask {
  task: string;
  steps: string[];
  estimatedTime?: string;
}

export interface CheatSheetItem {
  title: string;
  description: string;
  icon?: string;
}

export interface ModuleContent {
  id: string;
  translationKey?: string;
  title: string;
  category: ModuleCategory;
  estimatedTime: number; // in minutes
  difficulty: ModuleDifficulty;
  roles: string[];
  
  overview: {
    description: string;
    whoUsesIt: string;
    keyBenefits: string[];
    prerequisites?: string[];
  };
  
  steps: ModuleStep[];
  examples?: ModuleExample[];
  bestPractices: string[];
  relatedModules: string[];
  quickReference?: ModuleQuickReference;
  
  // Completion tracking
  completed?: boolean;
  inProgress?: boolean;
  lastAccessed?: Date;
  completionPercentage?: number;
}

export interface ModuleProgress {
  moduleId: string;
  userId?: string;
  startedAt?: Date;
  completedAt?: Date;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  skippedSteps: number[];
  timeSpent: number; // in seconds
  lastAccessed: Date;
}

export interface OnboardingOverviewState {
  modules: ModuleContent[];
  progress: Record<string, ModuleProgress>;
  completedModules: string[];
  inProgressModules: string[];
  recommendedModules: string[];
  overallProgress: number;
  lastUpdated: Date;
}
