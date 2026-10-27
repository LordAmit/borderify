import { useState } from 'react';
import { Bold, Italic } from 'lucide-react';
import { useStore, defaultConfig } from '../store';
import type { TextLabel } from '../types';
import SliderRow from '../controls/SliderRow';
import TagBar from '../controls/TagBar';
import PositionField from '../controls/PositionField';
import ColorField from '../controls/ColorField';
import ExifWarning from '../controls/ExifWarning';
import { useActiveImage } from './useActiveImage';

type CaptionStyle = Partial<Omit<TextLabel, 'id' | 'text' | 'show'>>;

const CAPTION_TAGS = ['{make}', '{model}', '{iso}', '{shutter}', '{f}', '{focal}', '{lens}', '{date}'];

const applyAllBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.05)'
};
const applyAllCheckboxStyle: React.CSSProperties = { width: '15px', height: '15px', accentColor: '#38bdf8', cursor: 'pointer' };
const applyAllLabelStyle: React.CSSProperties = { fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' };

export interface CaptionSectionProps {
  hasMultipleImages?: boolean;
}

const CaptionSection = ({ hasMultipleImages }: CaptionSectionProps) => {
  const { state, updateConfig, updateImageCaption, updateImageCaptionStyle, clearAllImageCaptionStyles, setState } = useStore();
  const { activeImage, hasExif } = useActiveImage();
  const config = state.config;
  const [applyCaptionToAll, setApplyCaptionToAll] = useState(false);
  const [applyStyleToAll, setApplyStyleToAll] = useState(false);

  if (config.labels.length === 0) return null;

  const currentCaption = activeImage?.captionText ?? (config.labels[0]?.text || '');
  const activeLabelStyle: TextLabel = activeImage?.captionStyle
    ? { ...config.labels[0], ...activeImage.captionStyle }
    : config.labels[0];

  const setFirstLabel = (updates: CaptionStyle) =>
    updateConfig((c) => ({ ...c, labels: c.labels.map((l, i): TextLabel => i === 0 ? { ...l, ...updates } : l) }));

  const handleStyleChange = (updates: CaptionStyle) => {
    if (applyStyleToAll) {
      setFirstLabel(updates);
      clearAllImageCaptionStyles();
    } else if (state.activeImageId) {
      updateImageCaptionStyle(state.activeImageId, updates);
    } else {
      setFirstLabel(updates);
    }
  };

  const handleToggleApplyStyleAll = (checked: boolean) => {
    setApplyStyleToAll(checked);
    if (checked) {
      setFirstLabel(activeImage?.captionStyle || {});
      clearAllImageCaptionStyles();
    }
  };

  const handleCaptionChange = (newVal: string) => {
    if (applyCaptionToAll) {
      setState((prev) => ({ ...prev, images: prev.images.map((img) => ({ ...img, captionText: newVal })) }));
    } else if (state.activeImageId) {
      updateImageCaption(state.activeImageId, newVal);
    } else {
      updateConfig((c) => ({ ...c, labels: [{ ...c.labels[0], text: newVal }] }));
    }
  };

  const handleToggleApplyAll = (checked: boolean) => {
    setApplyCaptionToAll(checked);
    if (checked) {
      setState((prev) => ({ ...prev, images: prev.images.map((img) => ({ ...img, captionText: currentCaption })) }));
    }
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const isBold = activeLabelStyle.fontWeight === 'bold';
  const isItalic = activeLabelStyle.fontStyle === 'italic';

  return (
    <>
      {activeImage && !hasExif && (
        <ExifWarning>
          No EXIF data detected in this photo. Dynamic tags like <code>{`{make}`}</code> or <code>{`{model}`}</code> will remain blank.
        </ExifWarning>
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
        <TagBar value={currentCaption} onChange={handleCaptionChange} tags={CAPTION_TAGS} />

        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
          Tip: You can format text as <code>**bold**</code> and <code>*italic*</code>
        </div>

        {hasMultipleImages && (
          <div style={{ ...applyAllBoxStyle, marginTop: '12px' }}>
            <input
              type="checkbox"
              id="apply-caption-all"
              checked={applyCaptionToAll}
              onChange={(e) => handleToggleApplyAll(e.target.checked)}
              style={applyAllCheckboxStyle}
            />
            <label htmlFor="apply-caption-all" style={applyAllLabelStyle}>
              Apply same caption to all {state.images.length} photos in batch
            </label>
          </div>
        )}
      </div>

      {hasMultipleImages && (
        <div style={{ ...applyAllBoxStyle, marginBottom: '16px' }}>
          <input
            type="checkbox"
            id="apply-style-all"
            checked={applyStyleToAll}
            onChange={(e) => handleToggleApplyStyleAll(e.target.checked)}
            style={applyAllCheckboxStyle}
          />
          <label htmlFor="apply-style-all" style={applyAllLabelStyle}>
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
            onChange={handleFontUpload}
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
            aria-pressed={isBold}
            className={`btn btn-outline ${isBold ? 'active' : ''}`}
            style={{ padding: '0 12px', minWidth: '40px', borderColor: isBold ? 'var(--accent-color)' : '' }}
            onClick={() => handleStyleChange({ fontWeight: isBold ? 'normal' : 'bold' })}
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            aria-label="Italic"
            aria-pressed={isItalic}
            className={`btn btn-outline ${isItalic ? 'active' : ''}`}
            style={{ padding: '0 12px', minWidth: '40px', borderColor: isItalic ? 'var(--accent-color)' : '' }}
            onClick={() => handleStyleChange({ fontStyle: isItalic ? 'normal' : 'italic' })}
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
        onChange={(val) => handleStyleChange({ fontSizeScale: val })}
        onReset={() => handleStyleChange({ fontSizeScale: defaultConfig.labels[0].fontSizeScale })}
      />

      <PositionField
        label="Text Position"
        value={activeLabelStyle.position}
        onChange={(position) => handleStyleChange({ position })}
      />

      <div className="flex-row">
        <ColorField id="caption-color" label="Color" value={activeLabelStyle.color} onChange={(color) => handleStyleChange({ color })} />
        <ColorField id="caption-stroke-color" label="Border" value={activeLabelStyle.strokeColor || '#000000'} onChange={(strokeColor) => handleStyleChange({ strokeColor })} />
      </div>

      <SliderRow
        label="Offset X"
        value={activeLabelStyle.positionXScale}
        min="-0.5" max="0.5" step="0.005"
        onChange={(val) => handleStyleChange({ positionXScale: val })}
        onReset={() => handleStyleChange({ positionXScale: 0 })}
      />
      <SliderRow
        label="Offset Y"
        value={activeLabelStyle.positionYScale}
        min="-0.5" max="0.5" step="0.005"
        onChange={(val) => handleStyleChange({ positionYScale: val })}
        onReset={() => handleStyleChange({ positionYScale: 0 })}
      />
      <SliderRow
        label="Outline"
        value={activeLabelStyle.strokeWidthScale}
        min="0" max="0.02" step="0.001"
        onChange={(val) => handleStyleChange({ strokeWidthScale: val })}
        onReset={() => handleStyleChange({ strokeWidthScale: defaultConfig.labels[0].strokeWidthScale })}
      />
    </>
  );
};

export default CaptionSection;
