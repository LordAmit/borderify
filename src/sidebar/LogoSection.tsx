import { useStore, defaultConfig } from '../store';
import type { LogoSettings } from '../types';
import SliderRow from '../controls/SliderRow';
import PositionField from '../controls/PositionField';

const LogoSection = () => {
  const { state, updateConfig } = useStore();
  const config = state.config;

  const setLogo = (patch: Partial<LogoSettings>) =>
    updateConfig((c) => ({ ...c, logo: { ...c.logo, ...patch } }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setLogo({ dataUrl: event.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="control-group">
        <label className="label" htmlFor="logo-upload">Upload Logo</label>
        <input
          id="logo-upload"
          type="file"
          accept="image/png, image/jpeg, image/svg+xml"
          onChange={handleLogoUpload}
          className="input-field"
        />
      </div>

      {config.logo.dataUrl && (
        <>
          <div className="control-group">
            <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={() => setLogo({ dataUrl: null })}>
              Clear Logo
            </button>
          </div>

          <SliderRow
            label="Size"
            value={config.logo.sizeScale}
            min="0.01" max="0.30" step="0.01"
            onChange={(val) => setLogo({ sizeScale: val })}
            onReset={() => setLogo({ sizeScale: defaultConfig.logo.sizeScale })}
          />

          <PositionField
            label="Position"
            groupLabel="Logo Position"
            value={config.logo.position}
            onChange={(position) => setLogo({ position })}
          />

          <SliderRow
            label="Offset X"
            value={config.logo.offsetXScale}
            min="-0.5" max="0.5" step="0.005"
            onChange={(val) => setLogo({ offsetXScale: val })}
            onReset={() => setLogo({ offsetXScale: 0 })}
          />
          <SliderRow
            label="Offset Y"
            value={config.logo.offsetYScale}
            min="-0.5" max="0.5" step="0.005"
            onChange={(val) => setLogo({ offsetYScale: val })}
            onReset={() => setLogo({ offsetYScale: 0 })}
          />
        </>
      )}
    </>
  );
};

export default LogoSection;
