import { useState } from 'react';
import { Question, QuestionOption, ClassificationSession } from '@/types/classification';
import { euSaMDClassificationQuestions } from '@/data/euSaMDClassificationRules';

export function useEUSaMDClassificationAssistant() {
  const [session, setSession] = useState<ClassificationSession>({
    currentQuestionId: 'eu_samd_initial',
    answers: {},
    path: ['eu_samd_initial']
  });

  const getCurrentQuestion = (): Question | null => {
    return euSaMDClassificationQuestions[session.currentQuestionId] || null;
  };

  const selectOption = (option: QuestionOption) => {
    const newAnswers = {
      ...session.answers,
      [session.currentQuestionId]: option.id
    };

    if (option.result) {
      // Final result reached
      setSession(prev => ({
        ...prev,
        answers: newAnswers,
        result: option.result
      }));
    } else if (option.nextQuestionId) {
      // Navigate to next question
      setSession(prev => ({
        ...prev,
        currentQuestionId: option.nextQuestionId!,
        answers: newAnswers,
        path: [...prev.path, option.nextQuestionId!]
      }));
    }
  };

  const goBack = () => {
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
  };

  const restart = () => {
    setSession({
      currentQuestionId: 'eu_samd_initial',
      answers: {},
      path: ['eu_samd_initial']
    });
  };

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