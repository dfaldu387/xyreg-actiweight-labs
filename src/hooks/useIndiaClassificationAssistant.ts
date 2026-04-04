import { useState, useCallback } from 'react';
import { ClassificationSession, Question, QuestionOption } from '@/types/classification';
import { indiaClassificationQuestions } from '@/data/indiaClassificationRules';

export function useIndiaClassificationAssistant() {
  const [session, setSession] = useState<ClassificationSession>({
    currentQuestionId: 'initial',
    answers: {},
    path: ['initial']
  });

  const getCurrentQuestion = useCallback((): Question | null => {
    return indiaClassificationQuestions[session.currentQuestionId] || null;
  }, [session.currentQuestionId]);

  const selectOption = useCallback((option: QuestionOption) => {
    const newAnswers = {
      ...session.answers,
      [session.currentQuestionId]: option.id
    };

    if (option.result) {
      setSession(prev => ({
        ...prev,
        answers: newAnswers,
        result: option.result
      }));
    } else if (option.nextQuestionId) {
      setSession(prev => ({
        ...prev,
        currentQuestionId: option.nextQuestionId!,
        answers: newAnswers,
        path: [...prev.path, option.nextQuestionId!]
      }));
    }
  }, [session]);

  const goBack = useCallback(() => {
    if (session.path.length > 1) {
      const newPath = [...session.path];
      newPath.pop();
      const previousQuestionId = newPath[newPath.length - 1];
      
      const newAnswers = { ...session.answers };
      delete newAnswers[session.currentQuestionId];

      setSession({
        currentQuestionId: previousQuestionId,
        answers: newAnswers,
        path: newPath,
        result: undefined
      });
    }
  }, [session]);

  const restart = useCallback(() => {
    setSession({
      currentQuestionId: 'initial',
      answers: {},
      path: ['initial']
    });
  }, []);

  const canGoBack = session.path.length > 1;
  const isComplete = !!session.result;
  const currentQuestion = getCurrentQuestion();

  return {
    session,
    currentQuestion,
    selectOption,
    goBack,
    restart,
    canGoBack,
    isComplete
  };
}
