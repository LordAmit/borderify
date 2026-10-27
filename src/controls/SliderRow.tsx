import { useId } from 'react';
import { RotateCcw } from 'lucide-react';

export interface SliderRowProps {
  label: string;
  value: number;
  min: number | string;
  max: number | string;
  step: number | string;
  onChange: (value: number) => void;
  onReset: () => void;
}

const nudgeStyle = (atLimit: boolean): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  color: 'var(--text-secondary, #94a3b8)',
  cursor: 'pointer',
  padding: 0,
  fontSize: '14px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
  opacity: atLimit ? 0.3 : 0.8,
  minWidth: '28px',
  height: '28px',
  transition: 'all 0.15s ease'
});

// [REQ-UI-03] Slider paired with inline -/+ nudge buttons
const SliderRow = ({ label, value, min, max, step, onChange, onReset }: SliderRowProps) => {
  // [REQ-UI-07] [REQ-UI-09] One generated id ties the visible label to the range input; icon buttons get names from the same label
  const sliderId = useId();
  const numericValue = Number(value) || 0;
  const numericMin = Number(min) || 0;
  const numericMax = Number(max) || 0;
  const numericStep = Number(step) || 0.01;

  const handleNudge = (direction: 'prev' | 'next') => {
    let newVal = direction === 'prev' ? numericValue - numericStep : numericValue + numericStep;
    // Round to step precision to prevent JavaScript floating point errors
    const decimalPlaces = (String(step).split('.')[1] || '').length;
    newVal = parseFloat(newVal.toFixed(decimalPlaces));
    // Clamp between min and max
    newVal = Math.max(numericMin, Math.min(numericMax, newVal));
    onChange(newVal);
  };

  return (
    <div className="compact-slider">
      <div className="label-row">
        <label className="label" title={label} htmlFor={sliderId}>{label}</label>
        {/* [REQ-STAT-03] Reset this setting to its default */}
        <button
          type="button"
          onClick={onReset}
          title="Reset"
          aria-label={`Reset ${label}`}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
        >
          <RotateCcw size={12} />
        </button>
      </div>
      <div className="slider-container">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => handleNudge('prev')}
          style={nudgeStyle(numericValue <= numericMin)}
          disabled={numericValue <= numericMin}
          title="Decrease"
          className="nudge-btn"
        >
          −
        </button>
        <input
          id={sliderId}
          type="range"
          style={{ width: '100%', flex: 1, accentColor: 'var(--accent-color)' }}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => handleNudge('next')}
          style={nudgeStyle(numericValue >= numericMax)}
          disabled={numericValue >= numericMax}
          title="Increase"
          className="nudge-btn"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default SliderRow;
