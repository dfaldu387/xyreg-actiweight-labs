import React, { useState } from 'react';
import { HardDrive, AlertTriangle, BookOpen } from 'lucide-react';
import { Dataset } from './types';
import { DatasetCard } from './DatasetCard';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DataVaultColumnProps {
  datasets: Dataset[];
  onDatasetLock: (id: string) => void;
  onDatasetsReorder: (datasets: Dataset[]) => void;
}

export function DataVaultColumn({ datasets, onDatasetLock, onDatasetsReorder }: DataVaultColumnProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showBlockAnimation, setShowBlockAnimation] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const trainingDatasets = datasets.filter(d => d.type === 'TRAINING');
  const testingDatasets = datasets.filter(d => d.type === 'TESTING');

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeDataset = datasets.find(d => d.id === active.id);
    const overDataset = datasets.find(d => d.id === over.id);

    // Block: Don't allow TRAINING to be moved to TESTING zone or vice versa
    if (activeDataset && overDataset && activeDataset.type !== overDataset.type) {
      setShowBlockAnimation(true);
      setTimeout(() => setShowBlockAnimation(false), 600);
      setActiveId(null);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = datasets.findIndex(d => d.id === active.id);
      const newIndex = datasets.findIndex(d => d.id === over.id);
      onDatasetsReorder(arrayMove(datasets, oldIndex, newIndex));
    }

    setActiveId(null);
  };

  const activeDataset = activeId ? datasets.find(d => d.id === activeId) : null;
  const lockedCount = datasets.filter(d => d.isLocked).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Tooltip */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <HardDrive className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-100 font-mono">Controlled Datasets</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-slate-400 hover:text-slate-200 transition-colors">
                    <BookOpen className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs bg-slate-800 border-slate-700 text-slate-100">
                  <p className="text-sm">
                    <strong>Lock datasets</strong> to generate cryptographic hashes (SHA-256). 
                    This proves your training and test data hasn't changed during validation — required by EU AI Act Article 10.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-slate-400">Inputs for model verification</p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mb-4 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Datasets locked:</span>
          <span className={cn(
            lockedCount === datasets.length ? "text-green-400" : "text-amber-400"
          )}>
            {lockedCount} / {datasets.length}
          </span>
        </div>
        <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              lockedCount === datasets.length ? "bg-green-500" : "bg-amber-500"
            )}
            style={{ width: `${(lockedCount / datasets.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Block Animation Overlay */}
      {showBlockAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/30 animate-pulse pointer-events-none">
          <div className="bg-red-900 border border-red-500 rounded-lg p-6 flex items-center gap-3 shadow-2xl">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <span className="text-red-100 font-mono text-lg">Dataset Type Mismatch!</span>
          </div>
        </div>
      )}

      {/* Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Training Section */}
          <div className={cn(
            "p-4 rounded-lg border-2 border-dashed transition-colors",
            activeId && activeDataset?.type === 'TESTING' 
              ? "border-red-500/50 bg-red-900/10" 
              : "border-blue-500/30 bg-blue-500/5"
          )}>
            <h4 className="text-sm font-mono text-blue-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Training Sets
            </h4>
            <SortableContext 
              items={trainingDatasets.map(d => d.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {trainingDatasets.map(dataset => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    onLock={onDatasetLock}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          {/* Testing Section */}
          <div className={cn(
            "p-4 rounded-lg border-2 border-dashed transition-colors",
            activeId && activeDataset?.type === 'TRAINING' 
              ? "border-red-500/50 bg-red-900/10" 
              : "border-orange-500/30 bg-orange-500/5"
          )}>
            <h4 className="text-sm font-mono text-orange-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              Testing Sets
            </h4>
            <SortableContext 
              items={testingDatasets.map(d => d.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {testingDatasets.map(dataset => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    onLock={onDatasetLock}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </div>

        <DragOverlay>
          {activeDataset && (
            <div className="opacity-80">
              <DatasetCard
                dataset={activeDataset}
                onLock={() => {}}
                isDragDisabled
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
