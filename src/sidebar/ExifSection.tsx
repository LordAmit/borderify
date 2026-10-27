import { useState } from 'react';
import { useStore, defaultConfig } from '../store';
import type { ExifPillSettings } from '../types';
import SliderRow from '../controls/SliderRow';
import PositionField from '../controls/PositionField';
import ColorField from '../controls/ColorField';
import AdvancedToggle from '../controls/AdvancedToggle';
import ExifWarning from '../controls/ExifWarning';
import { useActiveImage } from './useActiveImage';

type ExifToggleKey = 'showCamera' | 'showLens' | 'showAperture' | 'showIso' | 'showShutter' | 'showFocal' | 'showDate';

const DISPLAYED_DATA: { key: ExifToggleKey; label: string }[] = [
  { key: 'showCamera', label: 'Camera' },
  { key: 'showLens', label: 'Lens' },
  { key: 'showAperture', label: 'Aperture' },
  { key: 'showIso', label: 'ISO' },
  { key: 'showShutter', label: 'Shutter' },
  { key: 'showFocal', label: 'Focal' },
  { key: 'showDate', label: 'Date' },
];

const ExifSection = () => {
  const { state, updateConfig } = useStore();
  const { activeImage, hasExif } = useActiveImage();
  const config = state.config;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const setPills = (patch: Partial<ExifPillSettings>) =>
    updateConfig((c) => ({ ...c, exifPills: { ...c.exifPills, ...patch } }));

  return (
    <>
      {activeImage && !hasExif && (
        <ExifWarning>No EXIF data detected in this photo. Dynamic EXIF pills cannot be shown.</ExifWarning>
      )}
      <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={config.exifPills.show}
          onChange={(e) => setPills({ show: e.target.checked })}
        />
        Show EXIF Pills
      </label>

      {config.exifPills.show && (
        <>
          <PositionField
            label="EXIF Position"
            value={config.exifPills.position}
            onChange={(position) => setPills({ position })}
          />

          <SliderRow
            label="Size"
            value={config.exifPills.fontSizeScale}
            min="0.002" max="0.05" step="0.001"
            onChange={(val) => setPills({ fontSizeScale: val })}
            onReset={() => setPills({ fontSizeScale: defaultConfig.exifPills.fontSizeScale })}
          />
          <SliderRow
            label="Padding"
            value={config.exifPills.internalPaddingScale}
            min="0.1" max="2.0" step="0.05"
            onChange={(val) => setPills({ internalPaddingScale: val })}
            onReset={() => setPills({ internalPaddingScale: 0.8 })}
          />

          <div className="control-group">
            <span className="label">Displayed Data</span>
            {/* [REQ-UI-08] Displayed-data chips are toggle buttons */}
            <div className="chip-group" role="group" aria-label="Displayed Data" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {DISPLAYED_DATA.map((item) => {
                const isActive = config.exifPills[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={isActive}
                    className={`chip ${isActive ? 'active' : ''}`}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                      color: isActive ? '#38bdf8' : '#94a3b8',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      userSelect: 'none'
                    }}
                    onClick={() => setPills({ [item.key]: !isActive })}
                  >
                    {isActive ? '✓ ' : '+ '}{item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <AdvancedToggle label="Advanced EXIF Positioning & Styles" open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />

          {showAdvanced && (
            <div className="advanced-section">
              <div className="flex-row">
                <div className="control-group">
                  <label className="label" htmlFor="exif-custom-camera">Custom Camera</label>
                  <input
                    id="exif-custom-camera"
                    type="text"
                    className="input-field"
                    placeholder="e.g. {make} {model}"
                    value={config.exifPills.customCameraText || ''}
                    onChange={(e) => setPills({ customCameraText: e.target.value })}
                  />
                </div>
                <div className="control-group">
                  <label className="label" htmlFor="exif-custom-lens">Custom Lens</label>
                  <input
                    id="exif-custom-lens"
                    type="text"
                    className="input-field"
                    placeholder="e.g. {lens}"
                    value={config.exifPills.customLensText || ''}
                    onChange={(e) => setPills({ customLensText: e.target.value })}
                  />
                </div>
              </div>

              <SliderRow
                label="Offset X"
                value={config.exifPills.positionXScale}
                min="-0.5" max="0.5" step="0.01"
                onChange={(val) => setPills({ positionXScale: val })}
                onReset={() => setPills({ positionXScale: defaultConfig.exifPills.positionXScale })}
              />
              <SliderRow
                label="Offset Y"
                value={config.exifPills.positionYScale}
                min="-0.5" max="0.5" step="0.01"
                onChange={(val) => setPills({ positionYScale: val })}
                onReset={() => setPills({ positionYScale: defaultConfig.exifPills.positionYScale })}
              />

              <div className="flex-row">
                <ColorField id="exif-box-color" label="Background" value={config.exifPills.boxColor} onChange={(boxColor) => setPills({ boxColor })} />
                <ColorField id="exif-text-color" label="Text" value={config.exifPills.textColor} onChange={(textColor) => setPills({ textColor })} />
                <ColorField id="exif-stroke-color" label="Border" value={config.exifPills.textStrokeColor || '#000000'} onChange={(textStrokeColor) => setPills({ textStrokeColor })} />
              </div>

              <div className="control-group">
                <label className="label" htmlFor="exif-font">EXIF Font</label>
                <input
                  id="exif-font"
                  type="text"
                  className="input-field"
                  value={config.exifPills.fontFamily}
                  onChange={(e) => setPills({ fontFamily: e.target.value })}
                />
              </div>

              <SliderRow
                label="Stroke"
                value={config.exifPills.textStrokeWidthScale || 0}
                min="0" max="0.02" step="0.001"
                onChange={(val) => setPills({ textStrokeWidthScale: val })}
                onReset={() => setPills({ textStrokeWidthScale: defaultConfig.exifPills.textStrokeWidthScale || 0 })}
              />
              <SliderRow
                label="Outline"
                value={config.exifPills.borderWidthScale}
                min="0" max="0.02" step="0.001"
                onChange={(val) => setPills({ borderWidthScale: val })}
                onReset={() => setPills({ borderWidthScale: defaultConfig.exifPills.borderWidthScale })}
              />
              <SliderRow
                label="Line Spacing"
                value={config.exifPills.pillTextSpacingScale}
                min="0.2" max="0.8" step="0.01"
                onChange={(val) => setPills({ pillTextSpacingScale: val })}
                onReset={() => setPills({ pillTextSpacingScale: 0.35 })}
              />
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ExifSection;
