import type { Position } from '../types';

export interface GridPositionSelectorProps {
  value: Position;
  onChange: (position: Position) => void;
  label?: string;
}

const GRID: Position[][] = [
  ['Top Left', 'Top Center', 'Top Right'],
  ['Middle Left', 'Center', 'Middle Right'],
  ['Bottom Left', 'Bottom Center', 'Bottom Right']
];

// [REQ-UI-08] Position dots are focusable buttons named after the position they select
const GridPositionSelector = ({ value, onChange, label }: GridPositionSelectorProps) => (
  <div className="grid-position-selector" role="group" aria-label={label}>
    {GRID.flat().map((pos) => (
      <button
        key={pos}
        type="button"
        className={`grid-dot ${value === pos ? 'active' : ''}`}
        aria-pressed={value === pos}
        aria-label={pos}
        onClick={() => onChange(pos)}
        title={pos}
      />
    ))}
  </div>
);

export default GridPositionSelector;
