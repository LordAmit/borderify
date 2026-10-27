import { Save, FileJson } from 'lucide-react';

export interface PresetsSectionProps {
  onSavePreset?: () => void;
  onLoadPreset?: () => void;
}

// [REQ-UI-04] [REQ-STAT-02] Manage Presets
const PresetsSection = ({ onSavePreset, onLoadPreset }: PresetsSectionProps) => (
  <>
    <p className="section-note">
      Save your layout, branding, and EXIF settings to a file, or load an existing template file.
    </p>
    <div className="preset-actions">
      <button type="button" className="btn-preset-save" onClick={onSavePreset}>
        <Save size={14} /> Save preset
      </button>
      <button type="button" className="btn-preset-load" onClick={onLoadPreset}>
        <FileJson size={14} /> Load preset
      </button>
    </div>
  </>
);

export default PresetsSection;
