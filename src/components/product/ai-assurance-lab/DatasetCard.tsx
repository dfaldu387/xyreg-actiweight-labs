import React, { useState } from 'react';
import { Lock, Unlock, Database, GripVertical, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dataset } from './types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DatasetCardProps {
  dataset: Dataset;
  onLock: (id: string) => void;
  isDragDisabled?: boolean;
}

export function DatasetCard({ dataset, onLock, isDragDisabled }: DatasetCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: dataset.id,
    disabled: isDragDisabled || dataset.isLocked
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleLockClick = () => {
    if (!dataset.isLocked) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmLock = () => {
    onLock(dataset.id);
    setShowConfirmDialog(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "bg-slate-800/50 border rounded-lg p-4 transition-all",
          isDragging ? "opacity-50 border-indigo-500 shadow-lg shadow-indigo-500/20" : "border-slate-700",
          dataset.isLocked ? "border-green-700/50" : "hover:border-slate-600"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          {!dataset.isLocked && (
            <button
              {...attributes}
              {...listeners}
              className="p-1 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          {/* Icon */}
          <div className={cn(
            "p-2 rounded-lg",
            dataset.type === 'TRAINING' ? "bg-blue-500/20" : "bg-orange-500/20"
          )}>
            <Database className={cn(
              "h-4 w-4",
              dataset.type === 'TRAINING' ? "text-blue-400" : "text-orange-400"
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-slate-100 font-mono truncate">
                {dataset.name}
              </h4>
              <span className={cn(
                "px-2 py-0.5 text-xs font-mono rounded",
                dataset.type === 'TRAINING' 
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
              )}>
                {dataset.type}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">{dataset.size}</p>
            {dataset.hash ? (
              <p className="text-xs text-green-400 font-mono mt-1 truncate">
                Hash: {dataset.hash.slice(0, 12)}...
              </p>
            ) : (
              <p className="text-xs text-slate-500 font-mono mt-1">
                Click lock to generate hash
              </p>
            )}
          </div>

          {/* Lock Button */}
          <button
            onClick={handleLockClick}
            disabled={dataset.isLocked}
            className={cn(
              "p-2 rounded-lg transition-colors",
              dataset.isLocked 
                ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
            )}
            title={dataset.isLocked ? "Dataset locked - integrity verified" : "Lock dataset to generate SHA-256 hash"}
          >
            {dataset.isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-slate-100">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Lock Dataset Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              <span className="block mb-2">
                You are about to lock <strong className="text-slate-200 font-mono">{dataset.name}</strong>.
              </span>
              <span className="block mb-2">
                This action generates a cryptographic SHA-256 hash to prove data immutability for regulatory compliance (EU AI Act Article 10).
              </span>
              <span className="block text-amber-400/80 font-medium">
                ⚠️ This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLock}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <Lock className="h-4 w-4 mr-2" />
              Lock Dataset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
