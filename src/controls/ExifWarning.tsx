import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

const ExifWarning = ({ children }: { children: ReactNode }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(234, 179, 8, 0.08)',
    border: '1px solid rgba(234, 179, 8, 0.2)',
    borderRadius: '8px',
    color: '#facc15',
    fontSize: '12px',
    lineHeight: '1.4',
    marginBottom: '16px'
  }}>
    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
    <div>{children}</div>
  </div>
);

export default ExifWarning;
