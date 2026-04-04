import React from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Shield, 
  Activity, 
  Flag 
} from 'lucide-react';

type TabType = 'dashboard' | 'commercial' | 'regulatory' | 'clinical' | 'milestones';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'commercial', label: 'Commercial & Financial', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'regulatory', label: 'Regulatory Status', icon: <Shield className="h-4 w-4" /> },
  { id: 'clinical', label: 'Clinical Progress', icon: <Activity className="h-4 w-4" /> },
  { id: 'milestones', label: 'Milestones', icon: <Flag className="h-4 w-4" /> },
];

interface InvestorMonitorTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const InvestorMonitorTabs: React.FC<InvestorMonitorTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
