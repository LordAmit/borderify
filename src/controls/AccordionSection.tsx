import type { ReactNode } from 'react';

export interface AccordionSectionProps {
  id: string;
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

// [REQ-UI-11] Section headers expose expanded state and point at the panel they control
const AccordionSection = ({ id, title, icon, open, onToggle, children }: AccordionSectionProps) => (
  <div className="accordion-item">
    <button className="accordion-header" type="button" aria-expanded={open} aria-controls={`section-${id}`} onClick={onToggle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon} {title}
      </div>
      <span aria-hidden="true">{open ? '▲' : '▼'}</span>
    </button>
    {open && (
      <div className="accordion-body" id={`section-${id}`}>
        {children}
      </div>
    )}
  </div>
);

export default AccordionSection;
