import { Save, FileJson } from 'lucide-react';

export interface PresetsSectionProps {
  onSavePreset?: () => void;
  onLoadPreset?: () => void;
}

// [REQ-UI-04] [REQ-STAT-02] Manage Presets
const PresetsSection = ({ onSavePreset, onLoadPreset }: PresetsSectionProps) => (
  <>
    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
      Save your layout, branding, and EXIF settings to a file, or load an existing template file.
    </p>
    <div style={{ display: 'flex', gap: '10px' }}>
      <button type="button" className="btn-preset-save" style={{ flex: 1 }} onClick={onSavePreset}>
        <Save size={14} /> Save preset
      </button>
      <button type="button" className="btn-preset-load" style={{ flex: 1 }} onClick={onLoadPreset}>
        <FileJson size={14} /> Load preset
      </button>
    </div>
  </>
);

export default PresetsSection;
