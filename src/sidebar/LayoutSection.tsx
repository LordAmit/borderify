import { useState } from 'react';
import { useStore, defaultConfig } from '../store';
import type { LayoutSettings, TextLabel } from '../types';
import SliderRow from '../controls/SliderRow';
import ChipGroup from '../controls/ChipGroup';
import ColorField from '../controls/ColorField';
import AdvancedToggle from '../controls/AdvancedToggle';

const RATIO_OPTIONS = [
  { label: 'ORIG', value: 'Original' },
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
];

const LayoutSection = () => {
  const { state, updateConfig } = useStore();
  const config = state.config;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const setLayout = (patch: Partial<LayoutSettings>) =>
    updateConfig((c) => ({ ...c, layout: { ...c.layout, ...patch } }));

  const changeBorderMode = (mode: LayoutSettings['innerBorderMode']) => {
    updateConfig((c) => {
      const next = { ...c, layout: { ...c.layout, innerBorderMode: mode } };
      // Auto-apply logic for Polaroid mode
      if (mode === 'polaroid') {
        next.layout.innerBorderTopScale = 0.05;
        next.layout.innerBorderBottomScale = 0.12;
        next.layout.backgroundBlurScale = 0.02;
        next.labels = next.labels.map((l, i): TextLabel => i === 0 ? { ...l, positionYScale: -0.03, show: true } : l);
        next.exifPills = { ...next.exifPills, positionYScale: 0.03, show: true };
      } else if (mode === 'uniform') {
        next.labels = next.labels.map((l, i): TextLabel => i === 0 ? { ...l, positionYScale: 0, show: true } : l);
        next.exifPills = { ...next.exifPills, positionYScale: 0, show: true };
      }
      return next;
    });
  };

  return (
    <>
      <div className="control-group">
        <span className="label">Ratio</span>
        <ChipGroup
          label="Ratio"
          value={config.layout.aspectRatio}
          onChange={(val) => setLayout({ aspectRatio: val })}
          options={RATIO_OPTIONS}
        />
      </div>

      <div className="control-group">
        <label className="label" htmlFor="layout-background-type">Background</label>
        <select
          id="layout-background-type"
          className="input-field"
          value={config.layout.backgroundType}
          onChange={(e) => setLayout({ backgroundType: e.target.value as LayoutSettings['backgroundType'] })}
        >
          <option value="color">Solid Color</option>
          <option value="blurred-image">Blurred Photo (Desktop only)</option>
        </select>
      </div>

      {config.layout.backgroundType === 'color' && (
        <ColorField
          id="layout-background-color"
          label="Background"
          height={40}
          value={config.layout.backgroundColor}
          onChange={(backgroundColor) => setLayout({ backgroundColor })}
        />
      )}

      {config.layout.backgroundType === 'blurred-image' && (
        <>
          <SliderRow
            label="Blur Amount"
            value={config.layout.backgroundBlurScale}
            min="0" max="0.2" step="0.005"
            onChange={(val) => setLayout({ backgroundBlurScale: val })}
            onReset={() => setLayout({ backgroundBlurScale: defaultConfig.layout.backgroundBlurScale })}
          />
          <SliderRow
            label="Dim Overlay"
            value={config.layout.backgroundDimScale}
            min="0" max="0.8" step="0.01"
            onChange={(val) => setLayout({ backgroundDimScale: val })}
            onReset={() => setLayout({ backgroundDimScale: defaultConfig.layout.backgroundDimScale })}
          />
        </>
      )}

      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
        <SliderRow
          label={`Frame Size: ${(config.layout.borderWidthScale * 100).toFixed(0)}%`}
          value={config.layout.borderWidthScale}
          min="0" max="0.5" step="0.01"
          onChange={(val) => setLayout({ borderWidthScale: val })}
          onReset={() => setLayout({ borderWidthScale: defaultConfig.layout.borderWidthScale })}
        />
      </div>

      <ColorField
        id="layout-frame-color"
        label="Frame"
        value={config.layout.innerBorderColor}
        onChange={(innerBorderColor) => setLayout({ innerBorderColor })}
      />

      <AdvancedToggle label="Advanced Border & Effects" open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />

      {showAdvanced && (
        <div className="advanced-section">
          <div className="control-group">
            <label className="label" htmlFor="layout-border-style">Border Style</label>
            <select
              id="layout-border-style"
              className="input-field"
              value={config.layout.innerBorderMode}
              onChange={(e) => changeBorderMode(e.target.value as LayoutSettings['innerBorderMode'])}
            >
              <option value="uniform">Even Border</option>
              <option value="polaroid">Polaroid</option>
              <option value="custom">Advanced / Manual</option>
            </select>
          </div>

          {config.layout.innerBorderMode === 'uniform' && (
            <SliderRow
              label="Edge Thickness"
              value={config.layout.innerBorderSideScale}
              min="0" max="0.3" step="0.005"
              onChange={(val) => setLayout({ innerBorderSideScale: val, innerBorderTopScale: val, innerBorderBottomScale: val })}
              onReset={() => setLayout({
                innerBorderSideScale: defaultConfig.layout.innerBorderSideScale,
                innerBorderTopScale: defaultConfig.layout.innerBorderTopScale,
                innerBorderBottomScale: defaultConfig.layout.innerBorderBottomScale
              })}
            />
          )}

          {config.layout.innerBorderMode === 'polaroid' && (
            <>
              <SliderRow
                label="Edge Thickness"
                value={config.layout.innerBorderSideScale}
                min="0" max="0.3" step="0.005"
                onChange={(val) => setLayout({ innerBorderSideScale: val, innerBorderTopScale: val })}
                onReset={() => setLayout({ innerBorderSideScale: defaultConfig.layout.innerBorderSideScale, innerBorderTopScale: defaultConfig.layout.innerBorderTopScale })}
              />
              <SliderRow
                label="Signature Space"
                value={config.layout.innerBorderBottomScale}
                min="0" max="0.3" step="0.005"
                onChange={(val) => setLayout({ innerBorderBottomScale: val })}
                onReset={() => setLayout({ innerBorderBottomScale: defaultConfig.layout.innerBorderBottomScale })}
              />
            </>
          )}

          {config.layout.innerBorderMode === 'custom' && (
            <>
              <SliderRow
                label="Top Edge"
                value={config.layout.innerBorderTopScale}
                min="0" max="0.3" step="0.005"
                onChange={(val) => setLayout({ innerBorderTopScale: val })}
                onReset={() => setLayout({ innerBorderTopScale: defaultConfig.layout.innerBorderTopScale })}
              />
              <SliderRow
                label="Bottom Edge"
                value={config.layout.innerBorderBottomScale}
                min="0" max="0.3" step="0.005"
                onChange={(val) => setLayout({ innerBorderBottomScale: val })}
                onReset={() => setLayout({ innerBorderBottomScale: defaultConfig.layout.innerBorderBottomScale })}
              />
              <SliderRow
                label="Side Edges"
                value={config.layout.innerBorderSideScale}
                min="0" max="0.3" step="0.005"
                onChange={(val) => setLayout({ innerBorderSideScale: val })}
                onReset={() => setLayout({ innerBorderSideScale: defaultConfig.layout.innerBorderSideScale })}
              />
            </>
          )}

          <SliderRow
            label="Frame Rounding"
            value={config.layout.imageRadiusScale}
            min="0" max="0.1" step="0.005"
            onChange={(val) => setLayout({ imageRadiusScale: val })}
            onReset={() => setLayout({ imageRadiusScale: defaultConfig.layout.imageRadiusScale })}
          />
          <SliderRow
            label="Photo Rounding"
            value={config.layout.innerImageRadiusScale}
            min="0" max="0.1" step="0.005"
            onChange={(val) => setLayout({ innerImageRadiusScale: val })}
            onReset={() => setLayout({ innerImageRadiusScale: defaultConfig.layout.innerImageRadiusScale || 0 })}
          />
          <SliderRow
            label="Frame Shadow"
            value={config.layout.imageShadowBlurScale}
            min="0" max="0.1" step="0.005"
            onChange={(val) => setLayout({ imageShadowBlurScale: val })}
            onReset={() => setLayout({ imageShadowBlurScale: defaultConfig.layout.imageShadowBlurScale })}
          />
          <SliderRow
            label="Photo Shadow"
            value={config.layout.innerImageShadowBlurScale}
            min="0" max="0.1" step="0.005"
            onChange={(val) => setLayout({ innerImageShadowBlurScale: val })}
            onReset={() => setLayout({ innerImageShadowBlurScale: defaultConfig.layout.innerImageShadowBlurScale || 0 })}
          />
          <SliderRow
            label="Photo Spacing"
            value={config.layout.imagePaddingScale}
            min="0" max="0.2" step="0.005"
            onChange={(val) => setLayout({ imagePaddingScale: val })}
            onReset={() => setLayout({ imagePaddingScale: defaultConfig.layout.imagePaddingScale })}
          />
          <SliderRow
            label="Photo Border"
            value={config.layout.photoBorderWidthScale}
            min="0" max="0.05" step="0.001"
            onChange={(val) => setLayout({ photoBorderWidthScale: val })}
            onReset={() => setLayout({ photoBorderWidthScale: defaultConfig.layout.photoBorderWidthScale || 0 })}
          />

          <ColorField
            id="layout-photo-border-color"
            label="Photo Border Color"
            value={config.layout.photoBorderColor || '#000000'}
            onChange={(photoBorderColor) => setLayout({ photoBorderColor })}
          />
        </div>
      )}
    </>
  );
};

export default LayoutSection;
