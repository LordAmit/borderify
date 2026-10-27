import { AlertTriangle, Info, X } from 'lucide-react';
import type { Notice as NoticeModel } from '../types';

export interface NoticeProps {
  notice: NoticeModel;
  onDismiss: () => void;
}

/** Inline, dismissible message. Errors interrupt (role="alert"); info waits its turn (role="status"). */
const Notice = ({ notice, onDismiss }: NoticeProps) => (
  <div className={`notice notice-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
    {notice.kind === 'error' ? <AlertTriangle size={16} aria-hidden="true" /> : <Info size={16} aria-hidden="true" />}
    <span className="notice-message">{notice.message}</span>
    <button type="button" className="notice-dismiss" aria-label="Dismiss notice" onClick={onDismiss}>
      <X size={14} />
    </button>
  </div>
);

export default Notice;
