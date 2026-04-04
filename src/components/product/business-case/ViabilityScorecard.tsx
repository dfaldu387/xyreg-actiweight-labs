import React, { useState, useEffect } from 'react';
import { ViabilityWizard, ViabilityAnswers } from './viability/ViabilityWizard';
import { ViabilityResults } from './viability/ViabilityResults';
import { useViabilityScorecard } from '@/hooks/useViabilityScorecard';
import { Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ViabilityScorecardProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function ViabilityScorecard({ productId, companyId, disabled = false }: ViabilityScorecardProps) {
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<ViabilityAnswers | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const { 
    scorecard, 
    answersFromScorecard, 
    derivedAnswers,
    derivedFieldsInfo,
    isLoading, 
    saveScorecard, 
    isSaving 
  } = useViabilityScorecard(productId, companyId);

  // Check if any fields were derived from Genesis data
  const hasDerivedFields = Object.keys(derivedFieldsInfo).length > 0;

  // Load existing scorecard data on mount (but not when user is resetting)
  useEffect(() => {
    if (isResetting) return;
    
    if (scorecard && answersFromScorecard) {
      setAnswers(answersFromScorecard);
      setScore(scorecard.total_score);
      setShowResults(true);
    }
  }, [scorecard, answersFromScorecard, isResetting]);

  const handleComplete = (wizardAnswers: ViabilityAnswers, calculatedScore: number) => {
    setIsResetting(false);
    setAnswers(wizardAnswers);
    setScore(calculatedScore);
    setShowResults(true);

    // Auto-save to database
    const scores = {
      total: calculatedScore,
      regulatory: Math.round(calculatedScore * 0.3),
      clinical: Math.round(calculatedScore * 0.3),
      reimbursement: Math.round(calculatedScore * 0.2),
      technical: Math.round(calculatedScore * 0.2),
    };

    saveScorecard({ answers: wizardAnswers, scores });
  };

  const handleReset = () => {
    setIsResetting(true);
    setShowResults(false);
    setScore(0);
    setAnswers(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Block handlers when disabled
  const handleCompleteWrapper = (wizardAnswers: ViabilityAnswers, calculatedScore: number) => {
    if (disabled) return;
    handleComplete(wizardAnswers, calculatedScore);
  };

  const handleResetWrapper = () => {
    if (disabled) return;
    handleReset();
  };

  return (
    <div className="py-8">
      {/* Show info banner when data was pre-populated from Genesis */}
      {!showResults && hasDerivedFields && !scorecard && (
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Some fields have been pre-populated from your Genesis data. You can review and modify them as needed.
          </AlertDescription>
        </Alert>
      )}
      
      {!showResults ? (
        <ViabilityWizard 
          onComplete={handleCompleteWrapper} 
          initialAnswers={answersFromScorecard || undefined}
          derivedFieldsInfo={derivedFieldsInfo}
          isSaving={isSaving}
          disabled={disabled}
        />
      ) : (
        answers && <ViabilityResults score={score} answers={answers} onReset={handleResetWrapper} disabled={disabled} />
      )}
    </div>
  );
}
