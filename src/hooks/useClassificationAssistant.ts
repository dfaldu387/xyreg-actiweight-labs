
import { useState, useCallback } from 'react';
import { ClassificationSession, Question, QuestionOption, ClassificationResult, ClassISubcategoryAnswers, DecisionPathEntry } from '@/types/classification';
import { classificationQuestions, determineClassISubcategory } from '@/data/mdrClassificationRules';

export function useClassificationAssistant(initialQuestionId?: string) {
  const [session, setSession] = useState<ClassificationSession>({
    currentQuestionId: initialQuestionId || 'initial',
    answers: {},
    path: [initialQuestionId || 'initial']
  });
  
  const [classIAnswers, setClassIAnswers] = useState<ClassISubcategoryAnswers>({
    sterile: null,
    measuring: null,
    reusable: null
  });

  const [decisionPath, setDecisionPath] = useState<DecisionPathEntry[]>([]);

  const getCurrentQuestion = useCallback((): Question | null => {
    return classificationQuestions[session.currentQuestionId] || null;
  }, [session.currentQuestionId]);

  // Build decision path from answers for final result
  const buildDecisionPath = useCallback((answers: Record<string, string>): DecisionPathEntry[] => {
    const path: DecisionPathEntry[] = [];
    for (const [questionId, optionId] of Object.entries(answers)) {
      const question = classificationQuestions[questionId];
      if (question) {
        const option = question.options.find(o => o.id === optionId);
        if (option) {
          path.push({
            questionId,
            questionText: question.text,
            selectedOptionId: optionId,
            selectedOptionText: option.text
          });
        }
      }
    }
    return path;
  }, []);

  const selectOption = useCallback((option: QuestionOption) => {
    const currentQuestion = classificationQuestions[session.currentQuestionId];
    const newAnswers = { ...session.answers, [session.currentQuestionId]: option.id };
    
    // Add to decision path
    const newPathEntry: DecisionPathEntry = {
      questionId: session.currentQuestionId,
      questionText: currentQuestion?.text || '',
      selectedOptionId: option.id,
      selectedOptionText: option.text
    };
    const newDecisionPath = [...decisionPath, newPathEntry];
    setDecisionPath(newDecisionPath);
    
    // Handle Class I subcategory questions specially
    if (session.currentQuestionId === 'classI_sterile') {
      setClassIAnswers(prev => ({ ...prev, sterile: option.id === 'yes' }));
    } else if (session.currentQuestionId === 'classI_measuring') {
      setClassIAnswers(prev => ({ ...prev, measuring: option.id === 'yes' }));
    } else if (session.currentQuestionId === 'classI_reusable') {
      setClassIAnswers(prev => ({ ...prev, reusable: option.id === 'yes' }));
    }
    
    // If this option leads to a final result
    if (option.result) {
      const resultWithPath = {
        ...option.result,
        decisionPath: newDecisionPath
      };
      setSession({
        currentQuestionId: 'final_classification',
        answers: newAnswers,
        path: [...session.path, 'final_classification'],
        result: resultWithPath
      });
      return;
    }
    
    // If this is the final Class I subcategory question, calculate result
    if (session.currentQuestionId === 'classI_reusable') {
      const finalAnswers = {
        ...classIAnswers,
        reusable: option.id === 'yes'
      };
      
      const result = determineClassISubcategory(
        finalAnswers.sterile || false,
        finalAnswers.measuring || false,
        finalAnswers.reusable || false
      );
      
      const resultWithPath = {
        ...result,
        decisionPath: newDecisionPath
      };
      
      setSession({
        currentQuestionId: 'final_classification',
        answers: newAnswers,
        path: [...session.path, 'final_classification'],
        result: resultWithPath
      });
      return;
    }
    
    // Move to next question
    if (option.nextQuestionId) {
      setSession({
        currentQuestionId: option.nextQuestionId,
        answers: newAnswers,
        path: [...session.path, option.nextQuestionId]
      });
    }
  }, [session, classIAnswers, decisionPath]);

  const goBack = useCallback(() => {
    if (session.path.length > 1) {
      const newPath = [...session.path];
      newPath.pop(); // Remove current question
      const previousQuestionId = newPath[newPath.length - 1];
      
      // Remove the answer for the current question
      const newAnswers = { ...session.answers };
      delete newAnswers[session.currentQuestionId];
      
      // Remove last entry from decision path
      const newDecisionPath = decisionPath.slice(0, -1);
      setDecisionPath(newDecisionPath);
      
      // Reset Class I answers if going back from those questions
      if (['classI_sterile', 'classI_measuring', 'classI_reusable'].includes(session.currentQuestionId)) {
        if (session.currentQuestionId === 'classI_sterile') {
          setClassIAnswers(prev => ({ ...prev, sterile: null }));
        } else if (session.currentQuestionId === 'classI_measuring') {
          setClassIAnswers(prev => ({ ...prev, measuring: null }));
        } else if (session.currentQuestionId === 'classI_reusable') {
          setClassIAnswers(prev => ({ ...prev, reusable: null }));
        }
      }
      
      setSession({
        currentQuestionId: previousQuestionId,
        answers: newAnswers,
        path: newPath,
        result: undefined
      });
    }
  }, [session, decisionPath]);

  const restart = useCallback(() => {
    const startQuestionId = initialQuestionId || 'initial';
    setSession({
      currentQuestionId: startQuestionId,
      answers: {},
      path: [startQuestionId]
    });
    setClassIAnswers({
      sterile: null,
      measuring: null,
      reusable: null
    });
    setDecisionPath([]);
  }, [initialQuestionId]);

  const canGoBack = session.path.length > 1;
  const isComplete = session.currentQuestionId === 'final_classification' && session.result;

  return {
    session,
    currentQuestion: getCurrentQuestion(),
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete,
    classIAnswers,
    decisionPath
  };
}
