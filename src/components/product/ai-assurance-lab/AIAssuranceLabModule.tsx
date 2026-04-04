import React, { useState, useCallback, useEffect } from 'react';
import { Shield, FlaskConical, X, HelpCircle, Database, Lock, Snowflake, Play, CheckCircle2, ChevronRight } from 'lucide-react';
import { DataVaultColumn } from './DataVaultColumn';
import { ModelRegistryColumn } from './ModelRegistryColumn';
import { BiasMatrixColumn } from './BiasMatrixColumn';
import { TerminalLog } from './TerminalLog';
import { Dataset, AIModel, BiasMetric } from './types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIAssuranceLabModuleProps {
  productId: string;
  companyId: string;
}

// Mock data
const initialDatasets: Dataset[] = [
  { id: 'ds-1', name: 'ChestXray_Train_2024', size: '10k images', type: 'TRAINING', isLocked: false },
  { id: 'ds-2', name: 'CT_Lung_Primary', size: '5k scans', type: 'TRAINING', isLocked: false },
  { id: 'ds-3', name: 'ChestXray_Test_Holdout', size: '2k images', type: 'TESTING', isLocked: false },
  { id: 'ds-4', name: 'CT_Validation_Set', size: '1k scans', type: 'TESTING', isLocked: false },
];

const initialModel: AIModel = {
  id: 'model-1',
  name: 'Lung_Net_v2.0',
  version: '2.0.0',
  hash: '8f4a7c2e91b3d56f1a0e8c4b7d9f2a3e5c6b8d1f4a7e2c9b0d3f6a8e1c4b7d2b1',
  status: 'trained',
};

const mockBiasMetrics: BiasMetric[] = [
  { demographic: 'Male', precision: 96.2, recall: 94.8, f1Score: 95.5 },
  { demographic: 'Female', precision: 93.1, recall: 78.4, f1Score: 85.1 },
  { demographic: 'Pediatric', precision: 88.7, recall: 91.2, f1Score: 89.9 },
];

const verificationLogs = [
  '[INFO] Initializing verification pipeline...',
  '[INFO] Loading model snapshot: Lung_Net_v2.0',
  '[INFO] Validating dataset integrity...',
  '[SUCCESS] Dataset hashes verified',
  '[INFO] Running inference on test set...',
  '[INFO] Processing demographic: Male',
  '[INFO] Processing demographic: Female',
  '[WARN] Recall below threshold for Female demographic',
  '[INFO] Processing demographic: Pediatric',
  '[INFO] Calculating performance metrics...',
  '[INFO] Generating stratification report...',
  '[SUCCESS] Verification complete - Results ready',
];

// Workflow steps for the progress indicator
const workflowSteps = [
  { id: 1, label: 'Lock Datasets', icon: Lock, description: 'Ensure data integrity' },
  { id: 2, label: 'Freeze Model', icon: Snowflake, description: 'Lock model version' },
  { id: 3, label: 'Run Verification', icon: Play, description: 'Execute bias tests' },
  { id: 4, label: 'Review Results', icon: CheckCircle2, description: 'Assess compliance' },
];

// Welcome Banner Component
function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bg-gradient-to-r from-indigo-900/50 to-slate-800/50 border border-indigo-700/50 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-lg flex-shrink-0">
            <HelpCircle className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-100 font-mono">
                Getting Started with AI Assurance Lab
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Verify your AI model meets EU AI Act fairness requirements before deployment.
              </p>
            </div>
            
            {/* Visual Workflow */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-800/70 px-3 py-2 rounded-lg border border-slate-700">
                <Database className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-mono text-slate-200">1. Lock Datasets</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
              <div className="flex items-center gap-2 bg-slate-800/70 px-3 py-2 rounded-lg border border-slate-700">
                <Snowflake className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-mono text-slate-200">2. Freeze Model</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
              <div className="flex items-center gap-2 bg-slate-800/70 px-3 py-2 rounded-lg border border-slate-700">
                <Play className="h-4 w-4 text-green-400" />
                <span className="text-sm font-mono text-slate-200">3. Run Verification</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-400">
              Open the Help panel (?) for detailed guidance on EU AI Act compliance and bias testing.
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
          aria-label="Dismiss welcome banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// Progress Stepper Component
function WorkflowStepper({ 
  allDatasetsLocked, 
  modelFrozen, 
  isProcessing, 
  isResultsVisible 
}: { 
  allDatasetsLocked: boolean;
  modelFrozen: boolean;
  isProcessing: boolean;
  isResultsVisible: boolean;
}) {
  const getCurrentStep = () => {
    if (isResultsVisible) return 4;
    if (isProcessing) return 3;
    if (modelFrozen) return 3;
    if (allDatasetsLocked) return 2;
    return 1;
  };
  
  const currentStep = getCurrentStep();
  
  return (
    <div className="flex items-center justify-center gap-2 mb-6 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
      {workflowSteps.map((step, index) => {
        const StepIcon = step.icon;
        const isComplete = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "p-2 rounded-full transition-all",
                isComplete && "bg-green-500/20 text-green-400 ring-2 ring-green-500/30",
                isCurrent && "bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/50 animate-pulse",
                !isComplete && !isCurrent && "bg-slate-700/50 text-slate-500"
              )}>
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span className={cn(
                "text-xs font-mono",
                isComplete && "text-green-400",
                isCurrent && "text-indigo-300",
                !isComplete && !isCurrent && "text-slate-500"
              )}>
                {step.label}
              </span>
            </div>
            {index < workflowSteps.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 mx-1",
                step.id < currentStep ? "bg-green-500" : "bg-slate-700"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function AIAssuranceLabModule({ productId, companyId }: AIAssuranceLabModuleProps) {
  const [datasets, setDatasets] = useState<Dataset[]>(initialDatasets);
  const [model, setModel] = useState<AIModel>(initialModel);
  const [biasMetrics, setBiasMetrics] = useState<BiasMetric[]>([]);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  // Check localStorage for first-time visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('ai-assurance-lab-welcome-seen');
    if (hasSeenWelcome) {
      setShowWelcomeBanner(false);
    }
  }, []);

  const handleDismissWelcome = () => {
    setShowWelcomeBanner(false);
    localStorage.setItem('ai-assurance-lab-welcome-seen', 'true');
  };

  const handleDatasetLock = (id: string) => {
    setDatasets(prev => prev.map(ds => {
      if (ds.id === id && !ds.isLocked) {
        // Generate mock hash
        const hash = Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        return { ...ds, isLocked: true, hash };
      }
      return ds;
    }));
  };

  const handleDatasetsReorder = (newDatasets: Dataset[]) => {
    setDatasets(newDatasets);
  };

  const handleModelStatusChange = (status: AIModel['status']) => {
    setModel(prev => ({ ...prev, status }));
  };

  const handleRunVerification = () => {
    setShowTerminal(true);
    setIsProcessing(true);
    setIsResultsVisible(false);
  };

  const handleVerificationComplete = useCallback(() => {
    setIsProcessing(false);
    setBiasMetrics(mockBiasMetrics);
    setIsResultsVisible(true);
    // Mark model as validated
    setModel(prev => ({ ...prev, status: 'validated' }));
  }, []);

  const allDatasetsLocked = datasets.every(d => d.isLocked);
  const canRunVerification = model.status === 'frozen' && allDatasetsLocked;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Global Header */}
      <div className="border-b border-slate-700 bg-slate-950 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <FlaskConical className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-slate-100">AI Assurance Lab</h1>
              <p className="text-sm text-slate-400">EU AI Act Compliance Verification Environment</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-sm",
              isResultsVisible && biasMetrics.some(m => m.recall < 80 || m.precision < 80 || m.f1Score < 80)
                ? "bg-amber-900/30 border-amber-700 text-amber-300"
                : isResultsVisible
                  ? "bg-green-900/30 border-green-700 text-green-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
            )}>
              <Shield className="h-4 w-4" />
              <span>EU AI Act Status: </span>
              <span className="font-bold">
                {isResultsVisible 
                  ? (biasMetrics.some(m => m.recall < 80 || m.precision < 80 || m.f1Score < 80) ? 'REVIEW' : 'COMPLIANT')
                  : 'PENDING'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Banner */}
        {showWelcomeBanner && (
          <WelcomeBanner onDismiss={handleDismissWelcome} />
        )}

        {/* Progress Stepper */}
        <WorkflowStepper 
          allDatasetsLocked={allDatasetsLocked}
          modelFrozen={model.status === 'frozen' || model.status === 'validated'}
          isProcessing={isProcessing}
          isResultsVisible={isResultsVisible}
        />

        {/* 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Column 1: Data Vault */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
            <DataVaultColumn
              datasets={datasets}
              onDatasetLock={handleDatasetLock}
              onDatasetsReorder={handleDatasetsReorder}
            />
          </div>

          {/* Column 2: Model Registry */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
            <ModelRegistryColumn
              model={model}
              onModelStatusChange={handleModelStatusChange}
              onRunTest={handleRunVerification}
              isTestRunning={isProcessing}
            />
          </div>

          {/* Column 3: Bias Matrix */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
            <BiasMatrixColumn
              metrics={biasMetrics}
              isVisible={isResultsVisible}
            />
          </div>
        </div>

        {/* Terminal Log */}
        {showTerminal && (
          <div className="mb-6">
            <TerminalLog
              logs={verificationLogs}
              isProcessing={isProcessing}
              onComplete={handleVerificationComplete}
            />
          </div>
        )}

        {/* Global Run Verification Button */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handleRunVerification}
            disabled={!canRunVerification || isProcessing}
            className={cn(
              "px-8 py-6 text-lg font-mono",
              canRunVerification && !isProcessing
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            )}
          >
            <FlaskConical className="h-5 w-5 mr-2" />
            Run Verification Pipeline
          </Button>
        </div>

        {!canRunVerification && !isProcessing && (
          <p className="text-center text-sm text-amber-400 font-mono mt-4">
            {!allDatasetsLocked 
              ? "⚠ Lock all datasets before running verification"
              : "⚠ Freeze the model before running verification"}
          </p>
        )}
      </div>
    </div>
  );
}
