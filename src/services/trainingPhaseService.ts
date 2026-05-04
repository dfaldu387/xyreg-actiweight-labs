import { supabase } from '@/integrations/supabase/client';
import type { TrainingPhase } from '@/types/training';

/**
 * Locked Read → Quiz → Sign workflow.
 * Phase machine is materialized on training_records.phase for fast Mission Control queries.
 */

export async function startReading(recordId: string) {
  const { data: existing } = await supabase
    .from('training_records')
    .select('read_started_at, phase')
    .eq('id', recordId)
    .single();

  const updates: Record<string, unknown> = { phase: 'reading' as TrainingPhase };
  if (!existing?.read_started_at) updates.read_started_at = new Date().toISOString();
  if (!existing?.read_started_at) updates.started_at = new Date().toISOString();

  const { error } = await supabase
    .from('training_records')
    .update(updates as any)
    .eq('id', recordId);
  if (error) throw error;
}

export async function heartbeatRead(recordId: string, addedSeconds: number) {
  const { data } = await supabase
    .from('training_records')
    .select('read_seconds')
    .eq('id', recordId)
    .single();
  const next = Math.max(0, (data?.read_seconds ?? 0) + Math.round(addedSeconds));
  const { error } = await supabase
    .from('training_records')
    .update({ read_seconds: next } as any)
    .eq('id', recordId);
  if (error) throw error;
  return next;
}

export async function completeReading(recordId: string, requiresQuiz: boolean) {
  const phase: TrainingPhase = requiresQuiz ? 'quiz_ready' : 'sign_ready';
  const { error } = await supabase
    .from('training_records')
    .update({
      phase,
      read_completed_at: new Date().toISOString(),
    } as any)
    .eq('id', recordId);
  if (error) throw error;
}

export async function submitQuizAttempt(params: {
  recordId: string;
  moduleId: string;
  userId: string;
  companyId: string;
  answers: Array<{ question_id: string; chosen_index: number; correct: boolean }>;
  passThreshold: number;
  maxAttempts: number;
}) {
  const correctCount = params.answers.filter(a => a.correct).length;
  const score = Math.round((correctCount / Math.max(1, params.answers.length)) * 100);
  const passed = score >= params.passThreshold;

  const { error: attErr } = await supabase.from('training_quiz_attempts' as any).insert({
    record_id: params.recordId,
    module_id: params.moduleId,
    user_id: params.userId,
    company_id: params.companyId,
    answers: params.answers,
    score,
    passed,
  });
  if (attErr) throw attErr;

  const { data: rec } = await supabase
    .from('training_records')
    .select('quiz_attempts_count')
    .eq('id', params.recordId)
    .single();
  const attempts = ((rec as any)?.quiz_attempts_count ?? 0) + 1;

  const updates: Record<string, unknown> = {
    quiz_attempts_count: attempts,
    quiz_score: score,
  };
  if (passed) {
    updates.quiz_passed_at = new Date().toISOString();
    updates.phase = 'sign_ready' as TrainingPhase;
  } else if (attempts >= params.maxAttempts) {
    updates.phase = 'quiz_failed' as TrainingPhase;
  } else {
    updates.phase = 'quiz_ready' as TrainingPhase;
  }

  const { error: updErr } = await supabase
    .from('training_records')
    .update(updates as any)
    .eq('id', params.recordId);
  if (updErr) throw updErr;

  return { score, passed, attempts };
}

function hashSignature(parts: string[]): string {
  // Simple non-crypto hash for traceability (not auth). Used for audit display only.
  let h = 0;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return `sig_${(h >>> 0).toString(16)}_${Date.now().toString(36)}`;
}

export async function signAndComplete(params: {
  recordId: string;
  moduleId: string;
  userId: string;
  email: string;
  password: string;
  attestationText: string;
  moduleVersion: string;
}) {
  // Re-auth as 21 CFR Part 11 second component
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });
  if (authErr) throw new Error('Password verification failed');

  const ts = new Date().toISOString();
  const sigHash = hashSignature([
    params.userId,
    params.moduleId,
    params.moduleVersion,
    ts,
  ]);

  const { error } = await supabase
    .from('training_records')
    .update({
      phase: 'completed' as TrainingPhase,
      status: 'completed',
      signed_at: ts,
      signature_hash: sigHash,
      signature_data: {
        signedAt: ts,
        userAgent: navigator.userAgent,
        attestationText: params.attestationText,
        moduleVersion: params.moduleVersion,
      },
      completed_at: ts,
    } as any)
    .eq('id', params.recordId);
  if (error) throw error;

  return { signedAt: ts, signatureHash: sigHash };
}