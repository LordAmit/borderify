import type { Position } from '../types';
import GridPositionSelector from './GridPositionSelector';

export interface PositionFieldProps {
  label: string;
  groupLabel?: string;
  value: Position;
  onChange: (position: Position) => void;
}

/** A labelled position grid with the current position printed beside it. */
const PositionField = ({ label, groupLabel, value, onChange }: PositionFieldProps) => (
  <div className="control-group">
    <span className="label">{label}</span>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <GridPositionSelector label={groupLabel ?? label} value={value} onChange={onChange} />
      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{value}</div>
    </div>
  </div>
);

export default PositionField;
