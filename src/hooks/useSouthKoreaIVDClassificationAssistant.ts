import { useState } from 'react';
import { Question, QuestionOption, ClassificationSession } from '@/types/classification';
import { southKoreaIVDClassificationQuestions } from '@/data/southKoreaIVDClassificationRules';

export function useSouthKoreaIVDClassificationAssistant() {
  const [session, setSession] = useState<ClassificationSession>({ currentQuestionId: 'korea_ivd_initial', answers: {}, path: ['korea_ivd_initial'] });
  const getCurrentQuestion = (): Question | null => southKoreaIVDClassificationQuestions[session.currentQuestionId] || null;
  const selectOption = (option: QuestionOption) => {
    const newAnswers = { ...session.answers, [session.currentQuestionId]: option.id };
    if (option.result) setSession(prev => ({ ...prev, answers: newAnswers, result: option.result }));
    else if (option.nextQuestionId) setSession(prev => ({ ...prev, currentQuestionId: option.nextQuestionId!, answers: newAnswers, path: [...prev.path, option.nextQuestionId!] }));
  };
  const goBack = () => { if (session.path.length > 1) { const newPath = [...session.path]; newPath.pop(); const newAnswers = { ...session.answers }; delete newAnswers[session.currentQuestionId]; setSession({ currentQuestionId: newPath[newPath.length - 1], answers: newAnswers, path: newPath, result: undefined }); } };
  const restart = () => setSession({ currentQuestionId: 'korea_ivd_initial', answers: {}, path: ['korea_ivd_initial'] });
  return { session, currentQuestion: getCurrentQuestion(), selectOption, goBack, restart, canGoBack: session.path.length > 1, isComplete: !!session.result };
}
