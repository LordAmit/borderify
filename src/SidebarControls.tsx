import React, { useState, useId } from 'react';
import { useStore, defaultConfig } from './store';
import type { TextLabel } from './types';
import { Type, Square, Database, RotateCcw, Frame, Maximize, Image, Bold, Italic, Download, FileJson, Save, Archive, AlertTriangle } from 'lucide-react';

// [REQ-UI-03] Slider paired with inline -/+ nudge buttons
const SliderRow = ({ label, value, min, max, step, onChange, onReset }: any) => {
  // [REQ-UI-07] [REQ-UI-09] One generated id ties the visible label to the range input; icon buttons get names from the same label
  const sliderId = useId();
  const numericValue = parseFloat(value) || 0;
  const numericMin = parseFloat(min) || 0;
  const numericMax = parseFloat(max) || 0;
  const numericStep = parseFloat(step) || 0.01;

  const handleNudge = (direction: 'prev' | 'next') => {
    let newVal = direction === 'prev' ? numericValue - numericStep : numericValue + numericStep;
    // Round to step precision to prevent JavaScript floating point errors
    const decimalPlaces = (step.toString().split('.')[1] || '').length;
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
          style={{
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
            opacity: numericValue <= numericMin ? 0.3 : 0.8,
            minWidth: '28px',
            height: '28px',
            transition: 'all 0.15s ease'
          }}
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
          style={{
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
            opacity: numericValue >= numericMax ? 0.3 : 0.8,
            minWidth: '28px',
            height: '28px',
            transition: 'all 0.15s ease'
          }}
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

// [REQ-UI-08] Chips are real buttons that expose their selected state
const ChipGroup = ({ options, value, onChange, label }: any) => (
  <div className="chip-group" role="group" aria-label={label}>
    {options.map((opt: any) => (
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

// [REQ-UI-08] Position dots are focusable buttons named after the position they select
const GridPositionSelector = ({ value, onChange, label }: any) => {
  const grid = [
    ['Top Left', 'Top Center', 'Top Right'],
    ['Middle Left', 'Center', 'Middle Right'],
    ['Bottom Left', 'Bottom Center', 'Bottom Right']
  ];

  return (
    <div className="grid-position-selector" role="group" aria-label={label}>
      {grid.flat().map((pos) => (
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
};

const StyleGallery = ({ config, updateConfig }: any) => {
  const styles = [
    {
      id: 'polaroid',
      name: 'Polaroid',
      icon: <Square size={18} />,
      apply: (c: any) => ({
        ...c,
        layout: {
          ...c.layout,
          aspectRatio: '1:1',
          backgroundType: 'blurred-image',
          backgroundBlurScale: 0.02,
          innerBorderMode: 'polaroid',
          innerBorderSideScale: 0.02,
          innerBorderTopScale: 0.02,
          innerBorderBottomScale: 0.12,
          borderWidthScale: 0.05,
        },
        labels: c.labels.map((l: any, i: number) => i === 0 ? { ...l, position: 'Bottom Center', positionYScale: -0.02, show: true } : l),
        exifPills: { ...c.exifPills, position: 'Bottom Center', positionYScale: 0.02, show: true }
      })
    },
    {
      id: 'museum',
      name: 'Museum',
      icon: <Frame size={18} />,
      apply: (c: any) => ({
        ...c,
        layout: {
          ...c.layout,
          aspectRatio: 'Original',
          backgroundType: 'color',
          backgroundColor: '#ffffff',
          innerBorderMode: 'uniform',
          innerBorderSideScale: 0.05,
          innerBorderTopScale: 0.05,
          innerBorderBottomScale: 0.05,
          borderWidthScale: 0.08,
        },
        labels: c.labels.map((l: any, i: number) => i === 0 ? { ...l, position: 'Bottom Center', positionYScale: 0, show: true } : l),
        exifPills: { ...c.exifPills, position: 'Bottom Center', positionYScale: 0.05, show: true }
      })
    },
    {
      id: 'minimal',
      name: 'Minimal',
      icon: <Maximize size={18} />,
      apply: (c: any) => ({
        ...c,
        layout: {
          ...c.layout,
          aspectRatio: 'Original',
          backgroundType: 'color',
          backgroundColor: '#ffffff',
          innerBorderMode: 'uniform',
          innerBorderSideScale: 0,
          innerBorderTopScale: 0,
          innerBorderBottomScale: 0,
          borderWidthScale: 0.03,
        },
        labels: c.labels.map((l: any, i: number) => i === 0 ? { ...l, show: true } : l),
        exifPills: { ...c.exifPills, show: false }
      })
    }
  ];

  return (
    // [REQ-UI-08] Style cards are buttons so the gallery is keyboard-operable
    <div className="style-gallery" role="group" aria-labelledby="styles-label">
      {styles.map(s => {
        const isActive = config.layout.innerBorderMode === s.id;
        return (
          <button
            key={s.id}
            type="button"
            className={`style-card ${isActive ? 'active' : ''}`}
            aria-pressed={isActive}
            onClick={() => updateConfig(s.apply)}
          >
            {s.icon}
            <span className="style-card-title">{s.name}</span>
          </button>
        );
      })}
    </div>
  );
};



const TagBar = ({ value, onChange, tags }: { value: string, onChange: (val: string) => void, tags: string[] }) => {
  return (
    // [REQ-UI-08] EXIF tag chips are toggle buttons
    <div className="chip-group" role="group" aria-label="Caption EXIF tags" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {tags.map(tagStr => {
        const isActive = value.includes(tagStr);
        const tagName = tagStr.replace('{', '').replace('}', '');
        return (
          <button
            key={tagStr}
            type="button"
            className="chip"
            aria-pressed={isActive}
            aria-label={`${isActive ? 'Remove' : 'Add'} ${tagName} tag`}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
              borderRadius: '4px',
              cursor: 'pointer',
              border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: isActive ? '#38bdf8' : '#94a3b8',
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              if (isActive) {
                const newText = value.replace(tagStr, '').replace(/\s+/g, ' ').trim();
                onChange(newText);
              } else {
                const newText = value + ` ${tagStr}`;
                onChange(newText.trim());
              }
            }}
          >
            {isActive ? '−' : '+'}{tagName}
          </button>
        );
      })}
    </div>
  );
};

interface SidebarControlsProps {
  onPreviewExport?: () => void;
  isPreviewLoading?: boolean;
  onSavePreset?: () => void;
  onLoadPreset?: () => void;
  onExportSingle?: () => void;
  onExportBatch?: () => void;
  hasImages?: boolean;
  hasMultipleImages?: boolean;
}

const SidebarControls: React.FC<SidebarControlsProps> = ({
  onPreviewExport,
  isPreviewLoading,
  onSavePreset,
  onLoadPreset,
  onExportSingle,
  onExportBatch,
  hasImages,
  hasMultipleImages
}) => {
  const { state, updateConfig, updateImageCaption, updateImageCaptionStyle, clearAllImageCaptionStyles, setState } = useStore();
  const config = state.config;
  const activeImageObj = state.images.find(img => img.id === state.activeImageId);
  const currentCaption = activeImageObj?.captionText ?? (config.labels[0]?.text || '');
  const hasExif = activeImageObj && Object.values(activeImageObj.exif).some(val => val !== undefined && val !== null && val !== '');

  const [openSection, setOpenSection] = useState<string>('layout');
  const [showAdvancedLayout, setShowAdvancedLayout] = useState(false);
  const [showAdvancedExif, setShowAdvancedExif] = useState(false);
  const [applyCaptionToAll, setApplyCaptionToAll] = useState(false);
  const [applyStyleToAll, setApplyStyleToAll] = useState(false);

  const activeLabelStyle = activeImageObj?.captionStyle 
    ? { ...config.labels[0], ...activeImageObj.captionStyle } 
    : config.labels[0];

  const handleStyleChange = (updates: Partial<Omit<TextLabel, 'id' | 'text' | 'show'>>) => {
    if (applyStyleToAll) {
      updateConfig(c => ({
        ...c,
        labels: c.labels.map((l: any, i: number) => i === 0 ? { ...l, ...updates } : l)
      }));
      clearAllImageCaptionStyles();
    } else if (state.activeImageId) {
      updateImageCaptionStyle(state.activeImageId, updates);
    } else {
      updateConfig(c => ({
        ...c,
        labels: c.labels.map((l: any, i: number) => i === 0 ? { ...l, ...updates } : l)
      }));
    }
  };

  const handleToggleApplyStyleAll = (checked: boolean) => {
    setApplyStyleToAll(checked);
    if (checked) {
      const activeStyle = activeImageObj?.captionStyle || {};
      updateConfig(c => ({
        ...c,
        labels: c.labels.map((l: any, i: number) => i === 0 ? { ...l, ...activeStyle } : l)
      }));
      clearAllImageCaptionStyles();
    }
  };

  const handleCaptionChange = (newVal: string) => {
    if (applyCaptionToAll) {
      setState((prev: any) => ({
        ...prev,
        images: prev.images.map((img: any) => ({ ...img, captionText: newVal }))
      }));
    } else if (state.activeImageId) {
      updateImageCaption(state.activeImageId, newVal);
    } else {
      updateConfig(c => ({
        ...c,
        labels: [{ ...c.labels[0], text: newVal }]
      }));
    }
  };

  const handleToggleApplyAll = (checked: boolean) => {
    setApplyCaptionToAll(checked);
    if (checked) {
      setState((prev: any) => ({
        ...prev,
        images: prev.images.map((img: any) => ({ ...img, captionText: currentCaption }))
      }));
    }
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? '' : section);
  };

  const projectedDimensions = React.useMemo(() => {
    if (!activeImageObj) return null;
    let overrideMaxRes = Infinity;
    if (config.export?.maxResolution === "4K") overrideMaxRes = 3840;
    if (config.export?.maxResolution === "Facebook") overrideMaxRes = 2048;
    if (config.export?.maxResolution === "Instagram") overrideMaxRes = 1350;

    let scaleLimit = 1;
    const longestEdge = Math.max(activeImageObj.width, activeImageObj.height);
    if (longestEdge > overrideMaxRes) {
      scaleLimit = overrideMaxRes / longestEdge;
    }

    let targetRatio = activeImageObj.width / activeImageObj.height;
    if (config.layout.aspectRatio !== "Original") {
      const [w, h] = config.layout.aspectRatio.split(':').map(Number);
      if (w && h) targetRatio = w / h;
    }

    const baseLength = longestEdge * scaleLimit;
    let cWidth, cHeight;
    if (targetRatio > 1) {
      cWidth = baseLength;
      cHeight = baseLength / targetRatio;
    } else {
      cHeight = baseLength;
      cWidth = baseLength * targetRatio;
    }

    return { w: Math.round(cWidth), h: Math.round(cHeight) };
  }, [activeImageObj, config.export?.maxResolution, config.layout.aspectRatio]);

  return (
    <div className="sidebar">
      <div className="sidebar-content">

        <span className="label" id="styles-label" style={{ marginBottom: '8px' }}>Styles</span>
        <StyleGallery config={config} updateConfig={updateConfig} />

        {/* [REQ-UI-02] [REQ-STAT-08] Collapsible sections in fixed order: Layout, Captions, Logo, EXIF, Presets, Export */}
        {/* [REQ-UI-11] Section headers expose expanded state and point at the panel they control */}
        {/* Layout Settings */}
        <div className="accordion-item">
          <button className="accordion-header" type="button" aria-expanded={openSection === 'layout'} aria-controls="section-layout" onClick={() => toggleSection('layout')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Square size={16} /> Layout & Border
            </div>
            <span aria-hidden="true">{openSection === 'layout' ? '▲' : '▼'}</span>
          </button>

          {openSection === 'layout' && (
            <div className="accordion-body" id="section-layout">
              <div className="control-group">
                <span className="label">Ratio</span>
                <ChipGroup
                  label="Ratio"
                  value={config.layout.aspectRatio}
                  onChange={(val: string) => updateConfig(c => ({ ...c, layout: { ...c.layout, aspectRatio: val } }))}
                  options={[
                    { label: 'ORIG', value: 'Original' },
                    { label: '1:1', value: '1:1' },
                    { label: '4:3', value: '4:3' },
                    { label: '3:4', value: '3:4' },
                    { label: '3:2', value: '3:2' },
                    { label: '2:3', value: '2:3' },
                    { label: '16:9', value: '16:9' },
                    { label: '9:16', value: '9:16' },
                  ]}
                />
              </div>

              <div className="control-group">
                <label className="label" htmlFor="layout-background-type">Background</label>
                <select
                  id="layout-background-type"
                  className="input-field"
                  value={config.layout.backgroundType}
                  onChange={(e) => updateConfig(c => ({ ...c, layout: { ...c.layout, backgroundType: e.target.value as any } }))}
                >
                  <option value="color">Solid Color</option>
                  <option value="blurred-image">Blurred Photo (Desktop only)</option>
                </select>
              </div>

              {config.layout.backgroundType === 'color' && (
                <div className="control-group">
                  <label className="label" htmlFor="layout-background-color">Background</label>
                  <input
                    id="layout-background-color"
                    type="color"
                    className="input-field"
                    style={{ height: '40px', padding: '2px' }}
                    value={config.layout.backgroundColor}
                    onChange={(e) => updateConfig(c => ({ ...c, layout: { ...c.layout, backgroundColor: e.target.value } }))}
                  />
                </div>
              )}

              {config.layout.backgroundType === 'blurred-image' && (
                <>
                  <SliderRow
                    label="Blur Amount"
                    value={config.layout.backgroundBlurScale}
                    min="0" max="0.2" step="0.005"
                    onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, backgroundBlurScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, backgroundBlurScale: defaultConfig.layout.backgroundBlurScale } }))}
                  />
                  <SliderRow
                    label="Dim Overlay"
                    value={config.layout.backgroundDimScale}
                    min="0" max="0.8" step="0.01"
                    onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, backgroundDimScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, backgroundDimScale: defaultConfig.layout.backgroundDimScale } }))}
                  />
                </>
              )}

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                <SliderRow
                  label={`Frame Size: ${(config.layout.borderWidthScale * 100).toFixed(0)}%`}
                  value={config.layout.borderWidthScale}
                  min="0" max="0.5" step="0.01"
                  onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, borderWidthScale: val } }))}
                  onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, borderWidthScale: defaultConfig.layout.borderWidthScale } }))}
                />
              </div>

              <div className="control-group">
                <label className="label" htmlFor="layout-frame-color">Frame</label>
                <input
                  id="layout-frame-color"
                  type="color"
                  className="input-field"
                  style={{ height: '36px', padding: '2px' }}
                  value={config.layout.innerBorderColor}
                  onChange={(e) => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderColor: e.target.value } }))}
                />
              </div>

              {/* [REQ-UI-08] Advanced toggles are buttons with expanded state */}
              <button
                type="button"
                className="advanced-toggle"
                aria-expanded={showAdvancedLayout}
                onClick={() => setShowAdvancedLayout(!showAdvancedLayout)}
              >
                <span>Advanced Border & Effects</span>
                <span aria-hidden="true">{showAdvancedLayout ? '−' : '+'}</span>
              </button>

              {showAdvancedLayout && (
                <div className="advanced-section">
                  <div className="control-group">
                    <label className="label" htmlFor="layout-border-style">Border Style</label>
                    <select
                      id="layout-border-style"
                      className="input-field"
                      value={config.layout.innerBorderMode}
                      onChange={(e) => {
                        const mode = e.target.value as any;
                        updateConfig(c => {
                          const newConfig = { ...c, layout: { ...c.layout, innerBorderMode: mode } };
                          // Auto-apply logic for Polaroid mode
                          if (mode === 'polaroid') {
                            newConfig.layout.innerBorderTopScale = 0.05;
                            newConfig.layout.innerBorderBottomScale = 0.12;
                            newConfig.layout.backgroundBlurScale = 0.02;
                            newConfig.labels = newConfig.labels.map((l: any, i: number) => i === 0 ? { ...l, positionYScale: -0.03, show: true } : l);
                            newConfig.exifPills = { ...newConfig.exifPills, positionYScale: 0.03, show: true };
                          } else if (mode === 'uniform') {
                            newConfig.labels = newConfig.labels.map((l: any, i: number) => i === 0 ? { ...l, positionYScale: 0, show: true } : l);
                            newConfig.exifPills = { ...newConfig.exifPills, positionYScale: 0, show: true };
                          }
                          return newConfig;
                        });
                      }}
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
                      onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderSideScale: val, innerBorderTopScale: val, innerBorderBottomScale: val } }))}
                      onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderSideScale: defaultConfig.layout.innerBorderSideScale, innerBorderTopScale: defaultConfig.layout.innerBorderTopScale, innerBorderBottomScale: defaultConfig.layout.innerBorderBottomScale } }))}
                    />
                  )}

                  {config.layout.innerBorderMode === 'polaroid' && (
                    <>
                      <SliderRow
                        label="Edge Thickness"
                        value={config.layout.innerBorderSideScale}
                        min="0" max="0.3" step="0.005"
                        onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderSideScale: val, innerBorderTopScale: val } }))}
                        onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderSideScale: defaultConfig.layout.innerBorderSideScale, innerBorderTopScale: defaultConfig.layout.innerBorderTopScale } }))}
                      />
                      <SliderRow
                        label="Signature Space"
                        value={config.layout.innerBorderBottomScale}
                        min="0" max="0.3" step="0.005"
                        onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderBottomScale: val } }))}
                        onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderBottomScale: defaultConfig.layout.innerBorderBottomScale } }))}
                      />
                    </>
                  )}

                  {config.layout.innerBorderMode === 'custom' && (
                    <>
                      <SliderRow
                        label="Top Edge"
                        value={config.layout.innerBorderTopScale}
                        min="0" max="0.3" step="0.005"
                        onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderTopScale: val } }))}
                        onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderTopScale: defaultConfig.layout.innerBorderTopScale } }))}
                      />
                      <SliderRow
                        label="Bottom Edge"
                        value={config.layout.innerBorderBottomScale}
                        min="0" max="0.3" step="0.005"
                        onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderBottomScale: val } }))}
                        onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderBottomScale: defaultConfig.layout.innerBorderBottomScale } }))}
                      />

                      <SliderRow
                        label="Side Edges"
                        value={config.layout.innerBorderSideScale}
                        min="0" max="0.3" step="0.005"
                        onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderSideScale: val } }))}
                        onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, innerBorderSideScale: defaultConfig.layout.innerBorderSideScale } }))}
                      />
                    </>
                  )}

                  <SliderRow
                    label="Frame Rounding"
                    value={config.layout.imageRadiusScale}
                    min="0" max="0.1" step="0.005"
                    onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, imageRadiusScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, imageRadiusScale: defaultConfig.layout.imageRadiusScale } }))}
                  />

                  <SliderRow
                    label="Photo Rounding"
                    value={config.layout.innerImageRadiusScale}
                    min="0" max="0.1" step="0.005"
                    onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, innerImageRadiusScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, innerImageRadiusScale: defaultConfig.layout.innerImageRadiusScale || 0 } }))}
                  />

                  <SliderRow
                    label="Frame Shadow"
                    value={config.layout.imageShadowBlurScale}
                    min="0" max="0.1" step="0.005"
                    onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, imageShadowBlurScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, imageShadowBlurScale: defaultConfig.layout.imageShadowBlurScale } }))}
                  />

                  <SliderRow
                    label="Photo Shadow"
                    value={config.layout.innerImageShadowBlurScale}
                    min="0" max="0.1" step="0.005"
                    onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, innerImageShadowBlurScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, innerImageShadowBlurScale: defaultConfig.layout.innerImageShadowBlurScale || 0 } }))}
                  />

                  <SliderRow
                    label="Photo Spacing"
                    value={config.layout.imagePaddingScale}
                    min="0" max="0.2" step="0.005"
                    onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, imagePaddingScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, imagePaddingScale: defaultConfig.layout.imagePaddingScale } }))}
                  />

                  <SliderRow
                    label="Photo Border"
                    value={config.layout.photoBorderWidthScale}
                    min="0" max="0.05" step="0.001"
                    onChange={(val: number) => updateConfig(c => ({ ...c, layout: { ...c.layout, photoBorderWidthScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, layout: { ...c.layout, photoBorderWidthScale: defaultConfig.layout.photoBorderWidthScale || 0 } }))}
                  />

                  <div className="control-group">
                    <label className="label" htmlFor="layout-photo-border-color">Photo Border Color</label>
                    <input
                      id="layout-photo-border-color"
                      type="color"
                      className="input-field"
                      style={{ height: '36px', padding: '2px' }}
                      value={config.layout.photoBorderColor || '#000000'}
                      onChange={(e) => updateConfig(c => ({ ...c, layout: { ...c.layout, photoBorderColor: e.target.value } }))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caption Settings */}
        <div className="accordion-item">
          <button className="accordion-header" type="button" aria-expanded={openSection === 'typography'} aria-controls="section-typography" onClick={() => toggleSection('typography')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Type size={16} /> Caption
            </div>
            <span aria-hidden="true">{openSection === 'typography' ? '▲' : '▼'}</span>
          </button>

          {openSection === 'typography' && config.labels.length > 0 && (
            <div className="accordion-body" id="section-typography">
              {activeImageObj && !hasExif && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.2)',
                  borderRadius: '8px',
                  color: '#facc15',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  marginBottom: '16px'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <div>No EXIF data detected in this photo. Dynamic tags like <code>{`{make}`}</code> or <code>{`{model}`}</code> will remain blank.</div>
                </div>
              )}
              <div className="control-group">
                <label className="label" htmlFor="caption-text">Caption Text</label>
                <textarea
                  id="caption-text"
                  className="input-field"
                  rows={2}
                  style={{ resize: 'vertical' }}
                  value={currentCaption}
                  onChange={(e) => handleCaptionChange(e.target.value)}
                  placeholder="Enter caption for this photo..."
                />
                <TagBar
                  value={currentCaption}
                  onChange={handleCaptionChange}
                  tags={['{make}', '{model}', '{iso}', '{shutter}', '{f}', '{focal}', '{lens}', '{date}']}
                />

                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
                  Tip: You can format text as <code>**bold**</code> and <code>*italic*</code>
                </div>

                {hasMultipleImages && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <input
                      type="checkbox"
                      id="apply-caption-all"
                      checked={applyCaptionToAll}
                      onChange={(e) => handleToggleApplyAll(e.target.checked)}
                      style={{
                        width: '15px',
                        height: '15px',
                        accentColor: '#38bdf8',
                        cursor: 'pointer'
                      }}
                    />
                    <label
                      htmlFor="apply-caption-all"
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      Apply same caption to all {state.images.length} photos in batch
                    </label>
                  </div>
                )}
              </div>

              {hasMultipleImages && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <input
                    type="checkbox"
                    id="apply-style-all"
                    checked={applyStyleToAll}
                    onChange={(e) => handleToggleApplyStyleAll(e.target.checked)}
                    style={{
                      width: '15px',
                      height: '15px',
                      accentColor: '#38bdf8',
                      cursor: 'pointer'
                    }}
                  />
                  <label
                    htmlFor="apply-style-all"
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Apply same styling to all {state.images.length} photos in batch
                  </label>
                </div>
              )}

              <div className="control-group">
                <label className="label" htmlFor="caption-font">Font</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="caption-font"
                    type="text"
                    className="input-field"
                    value={activeLabelStyle.fontFamily}
                    onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
                  />
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    id="font-upload"
                    aria-label="Upload font file"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64Url = event.target?.result as string;

                        // Inject font into document
                        const style = document.createElement('style');
                        style.innerHTML = `
                          @font-face {
                            font-family: '${fontName}';
                            src: url('${base64Url}');
                          }
                        `;
                        document.head.appendChild(style);

                        // Force DOM to load font before rendering
                        document.fonts.load(`16px "${fontName}"`).then(() => {
                          handleStyleChange({ fontFamily: fontName, customFontDataUrl: base64Url });
                        });
                      };
                      reader.readAsDataURL(file);

                      e.target.value = ''; // reset
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => document.getElementById('font-upload')?.click()}
                    title="Upload Font"
                    aria-label="Upload font file"
                    style={{ padding: '8px', minWidth: '40px' }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label="Bold"
                    aria-pressed={activeLabelStyle.fontWeight === 'bold'}
                    className={`btn btn-outline ${activeLabelStyle.fontWeight === 'bold' ? 'active' : ''}`}
                    style={{ padding: '0 12px', minWidth: '40px', borderColor: activeLabelStyle.fontWeight === 'bold' ? 'var(--accent-color)' : '' }}
                    onClick={() => handleStyleChange({ fontWeight: activeLabelStyle.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Italic"
                    aria-pressed={activeLabelStyle.fontStyle === 'italic'}
                    className={`btn btn-outline ${activeLabelStyle.fontStyle === 'italic' ? 'active' : ''}`}
                    style={{ padding: '0 12px', minWidth: '40px', borderColor: activeLabelStyle.fontStyle === 'italic' ? 'var(--accent-color)' : '' }}
                    onClick={() => handleStyleChange({ fontStyle: activeLabelStyle.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  >
                    <Italic size={16} />
                  </button>
                </div>
                <small style={{ display: 'block', marginTop: '4px', color: '#94a3b8', fontSize: '11px' }}>Alternatively, upload a .ttf/.otf file</small>
              </div>

              <SliderRow
                label="Size"
                value={activeLabelStyle.fontSizeScale}
                min="0.005" max="0.30" step="0.005"
                onChange={(val: number) => handleStyleChange({ fontSizeScale: val })}
                onReset={() => handleStyleChange({ fontSizeScale: defaultConfig.labels[0].fontSizeScale })}
              />

              <div className="control-group">
                <span className="label">Text Position</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <GridPositionSelector
                    label="Text Position"
                    value={activeLabelStyle.position}
                    onChange={(pos: any) => handleStyleChange({ position: pos })}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{activeLabelStyle.position}</div>
                </div>
              </div>

              <div className="flex-row">
                <div className="control-group">
                  <label className="label" htmlFor="caption-color">Color</label>
                  <input
                    id="caption-color"
                    type="color"
                    className="input-field"
                    style={{ height: '36px', padding: '2px' }}
                    value={activeLabelStyle.color}
                    onChange={(e) => handleStyleChange({ color: e.target.value })}
                  />
                </div>
                <div className="control-group">
                  <label className="label" htmlFor="caption-stroke-color">Border</label>
                  <input
                    id="caption-stroke-color"
                    type="color"
                    className="input-field"
                    style={{ height: '36px', padding: '2px' }}
                    value={activeLabelStyle.strokeColor || '#000000'}
                    onChange={(e) => handleStyleChange({ strokeColor: e.target.value })}
                  />
                </div>
              </div>

              <SliderRow
                label="Offset X"
                value={activeLabelStyle.positionXScale}
                min="-0.5" max="0.5" step="0.005"
                onChange={(val: number) => handleStyleChange({ positionXScale: val })}
                onReset={() => handleStyleChange({ positionXScale: 0 })}
              />
              <SliderRow
                label="Offset Y"
                value={activeLabelStyle.positionYScale}
                min="-0.5" max="0.5" step="0.005"
                onChange={(val: number) => handleStyleChange({ positionYScale: val })}
                onReset={() => handleStyleChange({ positionYScale: 0 })}
              />
              <SliderRow
                label="Outline"
                value={activeLabelStyle.strokeWidthScale}
                min="0" max="0.02" step="0.001"
                onChange={(val: number) => handleStyleChange({ strokeWidthScale: val })}
                onReset={() => handleStyleChange({ strokeWidthScale: defaultConfig.labels[0].strokeWidthScale })}
              />
            </div>
          )}
        </div>

        {/* Logo Settings */}
        <div className="accordion-item">
          <button className="accordion-header" type="button" aria-expanded={openSection === 'logo'} aria-controls="section-logo" onClick={() => toggleSection('logo')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image size={16} /> Logo
            </div>
            <span aria-hidden="true">{openSection === 'logo' ? '▲' : '▼'}</span>
          </button>

          {openSection === 'logo' && (
            <div className="accordion-body" id="section-logo">
              <div className="control-group">
                <label className="label" htmlFor="logo-upload">Upload Logo</label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        updateConfig(c => ({ ...c, logo: { ...c.logo, dataUrl: event.target?.result as string } }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="input-field"
                />
              </div>

              {config.logo.dataUrl && (
                <>
                  <div className="control-group">
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ width: '100%' }}
                      onClick={() => updateConfig(c => ({ ...c, logo: { ...c.logo, dataUrl: null } }))}
                    >
                      Clear Logo
                    </button>
                  </div>

                  <SliderRow
                    label="Size"
                    value={config.logo.sizeScale}
                    min="0.01" max="0.30" step="0.01"
                    onChange={(val: number) => updateConfig(c => ({ ...c, logo: { ...c.logo, sizeScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, logo: { ...c.logo, sizeScale: defaultConfig.logo.sizeScale } }))}
                  />

                  <div className="control-group">
                    <span className="label">Position</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <GridPositionSelector
                        label="Logo Position"
                        value={config.logo.position}
                        onChange={(pos: any) => updateConfig(c => ({
                          ...c, logo: { ...c.logo, position: pos }
                        }))}
                      />
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{config.logo.position}</div>
                    </div>
                  </div>

                  <SliderRow
                    label="Offset X"
                    value={config.logo.offsetXScale}
                    min="-0.5" max="0.5" step="0.005"
                    onChange={(val: number) => updateConfig(c => ({ ...c, logo: { ...c.logo, offsetXScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, logo: { ...c.logo, offsetXScale: 0 } }))}
                  />
                  <SliderRow
                    label="Offset Y"
                    value={config.logo.offsetYScale}
                    min="-0.5" max="0.5" step="0.005"
                    onChange={(val: number) => updateConfig(c => ({ ...c, logo: { ...c.logo, offsetYScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, logo: { ...c.logo, offsetYScale: 0 } }))}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* EXIF Setting */}
        <div className="accordion-item">
          <button className="accordion-header" type="button" aria-expanded={openSection === 'exif'} aria-controls="section-exif" onClick={() => toggleSection('exif')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} /> EXIF Data
            </div>
            <span aria-hidden="true">{openSection === 'exif' ? '▲' : '▼'}</span>
          </button>

          {openSection === 'exif' && (
            <div className="accordion-body" id="section-exif">
              {activeImageObj && !hasExif && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.2)',
                  borderRadius: '8px',
                  color: '#facc15',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  marginBottom: '16px'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <div>No EXIF data detected in this photo. Dynamic EXIF pills cannot be shown.</div>
                </div>
              )}
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.exifPills.show}
                  onChange={(e) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, show: e.target.checked } }))}
                />
                Show EXIF Pills
              </label>

              {config.exifPills.show && (
                <>
                  <div className="control-group">
                    <span className="label">EXIF Position</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <GridPositionSelector
                        label="EXIF Position"
                        value={config.exifPills.position}
                        onChange={(pos: any) => updateConfig(c => ({
                          ...c, exifPills: { ...c.exifPills, position: pos }
                        }))}
                      />
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{config.exifPills.position}</div>
                    </div>
                  </div>

                  <SliderRow
                    label="Size"
                    value={config.exifPills.fontSizeScale}
                    min="0.002" max="0.05" step="0.001"
                    onChange={(val: number) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, fontSizeScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, fontSizeScale: defaultConfig.exifPills.fontSizeScale } }))}
                  />

                  <SliderRow
                    label="Padding"
                    value={config.exifPills.internalPaddingScale}
                    min="0.1" max="2.0" step="0.05"
                    onChange={(val: number) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, internalPaddingScale: val } }))}
                    onReset={() => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, internalPaddingScale: 0.8 } }))}
                  />


                  <div className="control-group">
                    <span className="label">Displayed Data</span>
                    {/* [REQ-UI-08] Displayed-data chips are toggle buttons */}
                    <div className="chip-group" role="group" aria-label="Displayed Data" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {[
                        { key: 'showCamera', label: 'Camera' },
                        { key: 'showLens', label: 'Lens' },
                        { key: 'showAperture', label: 'Aperture' },
                        { key: 'showIso', label: 'ISO' },
                        { key: 'showShutter', label: 'Shutter' },
                        { key: 'showFocal', label: 'Focal' },
                        { key: 'showDate', label: 'Date' },
                      ].map(item => {
                        const isActive = (config.exifPills as any)[item.key];
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
                            onClick={() => updateConfig(c => ({
                              ...c, exifPills: { ...c.exifPills, [item.key]: !isActive }
                            }))}
                          >
                            {isActive ? '✓ ' : '+ '}{item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>


                  <button
                    type="button"
                    className="advanced-toggle"
                    aria-expanded={showAdvancedExif}
                    onClick={() => setShowAdvancedExif(!showAdvancedExif)}
                  >
                    <span>Advanced EXIF Positioning & Styles</span>
                    <span aria-hidden="true">{showAdvancedExif ? '−' : '+'}</span>
                  </button>

                  {showAdvancedExif && (
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
                            onChange={(e) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, customCameraText: e.target.value } }))}
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
                            onChange={(e) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, customLensText: e.target.value } }))}
                          />
                        </div>
                      </div>

                      <SliderRow
                        label="Offset X"
                        value={config.exifPills.positionXScale}
                        min="-0.5" max="0.5" step="0.01"
                        onChange={(val: number) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, positionXScale: val } }))}
                        onReset={() => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, positionXScale: defaultConfig.exifPills.positionXScale } }))}
                      />
                      <SliderRow
                        label="Offset Y"
                        value={config.exifPills.positionYScale}
                        min="-0.5" max="0.5" step="0.01"
                        onChange={(val: number) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, positionYScale: val } }))}
                        onReset={() => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, positionYScale: defaultConfig.exifPills.positionYScale } }))}
                      />

                      <div className="flex-row">
                        <div className="control-group">
                          <label className="label" htmlFor="exif-box-color">Background</label>
                          <input
                            id="exif-box-color"
                            type="color"
                            className="input-field"
                            style={{ height: '36px', padding: '2px' }}
                            value={config.exifPills.boxColor}
                            onChange={(e) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, boxColor: e.target.value } }))}
                          />
                        </div>
                        <div className="control-group">
                          <label className="label" htmlFor="exif-text-color">Text</label>
                          <input
                            id="exif-text-color"
                            type="color"
                            className="input-field"
                            style={{ height: '36px', padding: '2px' }}
                            value={config.exifPills.textColor}
                            onChange={(e) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, textColor: e.target.value } }))}
                          />
                        </div>
                        <div className="control-group">
                          <label className="label" htmlFor="exif-stroke-color">Border</label>
                          <input
                            id="exif-stroke-color"
                            type="color"
                            className="input-field"
                            style={{ height: '36px', padding: '2px' }}
                            value={config.exifPills.textStrokeColor || '#000000'}
                            onChange={(e) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, textStrokeColor: e.target.value } }))}
                          />
                        </div>
                      </div>

                      <div className="control-group">
                        <label className="label" htmlFor="exif-font">EXIF Font</label>
                        <input
                          id="exif-font"
                          type="text"
                          className="input-field"
                          value={config.exifPills.fontFamily}
                          onChange={(e) => updateConfig(c => ({
                            ...c, exifPills: { ...c.exifPills, fontFamily: e.target.value }
                          }))}
                        />
                      </div>

                      <SliderRow
                        label="Stroke"
                        value={config.exifPills.textStrokeWidthScale || 0}
                        min="0" max="0.02" step="0.001"
                        onChange={(val: number) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, textStrokeWidthScale: val } }))}
                        onReset={() => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, textStrokeWidthScale: defaultConfig.exifPills.textStrokeWidthScale || 0 } }))}
                      />

                      <SliderRow
                        label="Outline"
                        value={config.exifPills.borderWidthScale}
                        min="0" max="0.02" step="0.001"
                        onChange={(val: number) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, borderWidthScale: val } }))}
                        onReset={() => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, borderWidthScale: defaultConfig.exifPills.borderWidthScale } }))}
                      />

                      <SliderRow
                        label="Line Spacing"
                        value={config.exifPills.pillTextSpacingScale}
                        min="0.2" max="0.8" step="0.01"
                        onChange={(val: number) => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, pillTextSpacingScale: val } }))}
                        onReset={() => updateConfig(c => ({ ...c, exifPills: { ...c.exifPills, pillTextSpacingScale: 0.35 } }))}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* [REQ-UI-04] [REQ-STAT-02] Manage Presets */}
        <div className="accordion-item">
          <button className="accordion-header" type="button" aria-expanded={openSection === 'presets'} aria-controls="section-presets" onClick={() => toggleSection('presets')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Presets
            </div>
            <span aria-hidden="true">{openSection === 'presets' ? '▲' : '▼'}</span>
          </button>

          {openSection === 'presets' && (
            <div className="accordion-body" id="section-presets">
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                Save your layout, branding, and EXIF settings to a file, or load an existing template file.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-preset-save"
                  style={{ flex: 1 }}
                  onClick={onSavePreset}
                >
                  <Save size={14} /> Save preset
                </button>
                <button
                  type="button"
                  className="btn-preset-load"
                  style={{ flex: 1 }}
                  onClick={onLoadPreset}
                >
                  <FileJson size={14} /> Load preset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* [REQ-EXPT-03] [REQ-UI-06] Export Settings */}
        <div className="accordion-item">
          <button className="accordion-header" type="button" aria-expanded={openSection === 'export'} aria-controls="section-export" onClick={() => toggleSection('export')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Export
            </div>
            <span aria-hidden="true">{openSection === 'export' ? '▲' : '▼'}</span>
          </button>

          {openSection === 'export' && (
            <div className="accordion-body" id="section-export">
              <div className="control-group">
                <label className="label" htmlFor="export-resolution">Resolution Limit</label>
                <select
                  id="export-resolution"
                  className="input-field"
                  value={config.export?.maxResolution || "Original"}
                  onChange={(e) => updateConfig(c => ({
                    ...c, export: { ...c.export, maxResolution: e.target.value as any }
                  }))}
                >
                  <option value="Original">Original (No Scaling)</option>
                  <option value="4K">4K (Max 3840px)</option>
                  <option value="Facebook">Facebook (Max 2048px)</option>
                  <option value="Instagram">Instagram (Max 1350px)</option>
                </select>
                {projectedDimensions && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'right' }}>
                    Output: {projectedDimensions.w} × {projectedDimensions.h} px
                  </div>
                )}
              </div>

              <SliderRow
                label="JPEG Quality"
                value={config.export?.quality || 100}
                min="1" max="100" step="1"
                onChange={(val: number) => updateConfig(c => ({ ...c, export: { ...c.export, quality: val } }))}
                onReset={() => updateConfig(c => ({ ...c, export: { ...c.export, quality: 100 } }))}
              />

              {onPreviewExport && (
                <button
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
                  onClick={onPreviewExport}
                  disabled={isPreviewLoading}
                >
                  <Image size={16} />
                  {isPreviewLoading ? 'Generating...' : 'Preview Export Quality'}
                </button>
              )}

              {hasImages && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={onExportSingle}
                  >
                    <Download size={16} /> Save Current Image
                  </button>
                  {hasMultipleImages && (
                    <button
                      className="btn btn-outline"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={onExportBatch}
                    >
                      <Archive size={16} /> Save All (ZIP)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SidebarControls;
