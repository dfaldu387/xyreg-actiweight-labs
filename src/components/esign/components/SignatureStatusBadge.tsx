import { STATUS_COLORS } from '../lib/esign.constants';
import type { RequestStatus } from '../lib/esign.types';

interface SignatureStatusBadgeProps {
  status: RequestStatus | 'none';
  signedCount?: number;
  totalCount?: number;
}

export function SignatureStatusBadge({ status, signedCount, totalCount }: SignatureStatusBadgeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.none;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'pending' ? 'bg-yellow-500' :
        status === 'in_progress' ? 'bg-blue-500' :
        status === 'completed' ? 'bg-green-500' :
        status === 'voided' ? 'bg-red-500' :
        'bg-gray-400'
      }`} />
      {colors.label}
      {signedCount !== undefined && totalCount !== undefined && status !== 'none' && (
        <span className="opacity-70">({signedCount} of {totalCount})</span>
      )}
    </span>
  );
}
