export interface AdvancedToggleProps {
  label: string;
  open: boolean;
  onToggle: () => void;
}

// [REQ-UI-08] Advanced toggles are buttons with expanded state
const AdvancedToggle = ({ label, open, onToggle }: AdvancedToggleProps) => (
  <button type="button" className="advanced-toggle" aria-expanded={open} onClick={onToggle}>
    <span>{label}</span>
    <span aria-hidden="true">{open ? '−' : '+'}</span>
  </button>
);

export default AdvancedToggle;
