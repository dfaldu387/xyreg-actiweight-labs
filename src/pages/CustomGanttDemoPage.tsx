import React from 'react';
import { GanttContainer } from '@/components/gantt/GanttContainer';
import { LIVE_TASKS, LIVE_LINKS, LIVE_DOMAIN } from '@/components/gantt/live.data';

export default function CustomGanttDemoPage() {
    return (
        <div className="flex flex-col h-screen w-screen bg-slate-50">
            <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Custom Gantt — Demo</h1>
                    <p className="text-xs text-slate-500">
                        Live product phase data ({LIVE_TASKS.length} phases · {LIVE_LINKS.length} dependencies).
                    </p>
                </div>
                <a
                    href="/"
                    className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                >
                    ← Back to home
                </a>
            </header>
            <div className="flex-1 min-h-0">
                <GanttContainer
                    tasks={LIVE_TASKS}
                    links={LIVE_LINKS}
                    domain={LIVE_DOMAIN}
                    defaultCollapsed={true}
                />
            </div>
        </div>
    );
}
