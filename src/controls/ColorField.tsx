export interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  size?: 'md' | 'lg';
}

const ColorField = ({ id, label, value, onChange, size = 'md' }: ColorFieldProps) => (
  <div className="control-group">
    <label className="label" htmlFor={id}>{label}</label>
    <input
      id={id}
      type="color"
      className={`input-field color-input${size === 'lg' ? ' color-input-lg' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default ColorField;
