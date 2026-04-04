import { ThreadParticipant } from '@/types/communications';

/** Get display name for a thread participant */
export function getParticipantName(p: ThreadParticipant): string {
  if (p.user_profile) {
    const name = [p.user_profile.first_name, p.user_profile.last_name].filter(Boolean).join(' ');
    return name || p.user_profile.email;
  }
  return p.external_name || p.external_email || 'Unknown';
}

/** Get initials from a participant */
export function getParticipantInitials(p: ThreadParticipant): string {
  const name = getParticipantName(p);
  return name
    .split(' ')
    .map(w => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Get email for a participant */
export function getParticipantEmail(p: ThreadParticipant): string {
  return p.user_profile?.email || p.external_email || '';
}

/** Get organization for a participant */
export function getParticipantOrg(p: ThreadParticipant): string {
  return p.external_organization || p.role || '';
}
