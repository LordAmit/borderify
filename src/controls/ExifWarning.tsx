import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

const ExifWarning = ({ children }: { children: ReactNode }) => (
  <div className="exif-warning">
    <AlertTriangle size={16} className="exif-warning-icon" aria-hidden="true" />
    <div>{children}</div>
  </div>
);

export default ExifWarning;
