import { useState } from 'react';
import { Question, QuestionOption, ClassificationSession } from '@/types/classification';
import { japanIVDClassificationQuestions } from '@/data/japanIVDClassificationRules';

export function useJapanIVDClassificationAssistant() {
  const [session, setSession] = useState<ClassificationSession>({ currentQuestionId: 'japan_ivd_initial', answers: {}, path: ['japan_ivd_initial'] });
  const getCurrentQuestion = (): Question | null => japanIVDClassificationQuestions[session.currentQuestionId] || null;
  const selectOption = (option: QuestionOption) => {
    const newAnswers = { ...session.answers, [session.currentQuestionId]: option.id };
    if (option.result) setSession(prev => ({ ...prev, answers: newAnswers, result: option.result }));
    else if (option.nextQuestionId) setSession(prev => ({ ...prev, currentQuestionId: option.nextQuestionId!, answers: newAnswers, path: [...prev.path, option.nextQuestionId!] }));
  };
  const goBack = () => { if (session.path.length > 1) { const newPath = [...session.path]; newPath.pop(); const newAnswers = { ...session.answers }; delete newAnswers[session.currentQuestionId]; setSession({ currentQuestionId: newPath[newPath.length - 1], answers: newAnswers, path: newPath, result: undefined }); } };
  const restart = () => setSession({ currentQuestionId: 'japan_ivd_initial', answers: {}, path: ['japan_ivd_initial'] });
  return { session, currentQuestion: getCurrentQuestion(), selectOption, goBack, restart, canGoBack: session.path.length > 1, isComplete: !!session.result };
}
