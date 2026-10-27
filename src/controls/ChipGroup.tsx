export interface ChipOption {
  label: string;
  value: string;
}

export interface ChipGroupProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

// [REQ-UI-08] Chips are real buttons that expose their selected state
const ChipGroup = ({ options, value, onChange, label }: ChipGroupProps) => (
  <div className="chip-group" role="group" aria-label={label}>
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        className={`chip ${value === opt.value ? 'active' : ''}`}
        aria-pressed={value === opt.value}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default ChipGroup;
