import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Question } from '@/types/classification';

interface ClassificationDecisionPathProps {
  path: string[];
  answers: Record<string, string>;
  questions: Record<string, Question>;
  resultClass?: string;
  resultRule?: string;
}

// Generate a narrative summary from the decision path
function generateNarrativeSummary(
  path: string[],
  answers: Record<string, string>,
  questions: Record<string, Question>,
  resultClass?: string,
  resultRule?: string
): string | null {
  if (!resultClass || !resultRule) return null;

  const decisionPath = path.filter(qId => qId !== 'final_classification');
  if (decisionPath.length === 0) return null;

  // Build the narrative from the path
  const pathDescriptions: string[] = [];
  
  decisionPath.forEach((questionId) => {
    const question = questions[questionId];
    const answerId = answers[questionId];
    const selectedOption = question?.options.find(opt => opt.id === answerId);
    
    if (question && selectedOption) {
      // Use a simplified version of the answer for the narrative
      pathDescriptions.push(selectedOption.text.toLowerCase());
    }
  });

  // Construct the narrative
  if (pathDescriptions.length === 0) return null;

  const classText = resultClass.replace(/^Class\s*/i, '');
  const ruleRef = resultRule.replace(/IVDR\s*/i, '').replace(/Annex VIII,\s*/i, '');

  return `This device was classified as Class ${classText} under ${ruleRef}. The classification was determined based on the following assessment: ${pathDescriptions.join('; ')}.`;
}

export function ClassificationDecisionPath({
  path,
  answers,
  questions,
  resultClass,
  resultRule
}: ClassificationDecisionPathProps) {
  // Filter out the final_classification step from the path
  const decisionPath = path.filter(qId => qId !== 'final_classification');

  if (decisionPath.length === 0) {
    return null;
  }

  const narrativeSummary = generateNarrativeSummary(path, answers, questions, resultClass, resultRule);

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <span className="text-muted-foreground">📋</span>
        Decision Path
      </h4>
      
      {/* Narrative Summary */}
      {narrativeSummary && (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm text-foreground leading-relaxed">
          {narrativeSummary}
        </div>
      )}

      {/* Step-by-step breakdown */}
      <div className="border rounded-md bg-muted/30 p-4 space-y-4">
        {decisionPath.map((questionId, index) => {
          const question = questions[questionId];
          const answerId = answers[questionId];
          const selectedOption = question?.options.find(opt => opt.id === answerId);

          if (!question) return null;

          return (
            <div key={questionId} className="space-y-1">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {question.text}
                  </p>
                  {selectedOption && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                      <span>{selectedOption.text}</span>
                    </div>
                  )}
                </div>
              </div>
              {index < decisionPath.length - 1 && (
                <div className="ml-3 border-l-2 border-dashed border-muted-foreground/30 h-3" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
