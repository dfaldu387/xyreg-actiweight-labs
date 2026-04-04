export interface CompanyVentureBlueprintData {
  activityNotes: Record<number, string>;
  activityFiles: Record<number, { name: string; path: string; uploadedAt?: string } | null>;
  completedActivities: number[];
  activityComments: Record<number, BlueprintComment[]>;
  lastUpdated?: string;
}

export interface BlueprintComment {
  id: string;
  activityId: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FrameworkTemplate {
  id: string;
  name: string;
  description: string;
  category: 'competitive' | 'strategic' | 'operational' | 'performance';
  affectedPhases: number[];
  notes: Record<number, string>; // activity ID -> pre-filled note
}

export interface PhaseData {
  id: number;
  title: string;
  goal: string;
  activities: ActivityData[];
}

export interface ActivityData {
  id: number;
  phaseId: number;
  title: string;
  description: string;
  questions: string;
  linkedTab?: string;
  linkedTabLabel?: string;
}
