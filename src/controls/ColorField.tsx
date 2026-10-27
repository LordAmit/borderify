export interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

const ColorField = ({ id, label, value, onChange, height = 36 }: ColorFieldProps) => (
  <div className="control-group">
    <label className="label" htmlFor={id}>{label}</label>
    <input
      id={id}
      type="color"
      className="input-field"
      style={{ height: `${height}px`, padding: '2px' }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default ColorField;
