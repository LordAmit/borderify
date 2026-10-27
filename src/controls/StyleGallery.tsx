import type { ReactNode } from 'react';
import { Square, Frame, Maximize } from 'lucide-react';
import type { AppConfig, TextLabel } from '../types';

export interface StyleGalleryProps {
  config: AppConfig;
  updateConfig: (updater: (config: AppConfig) => AppConfig) => void;
}

interface StylePreset {
  name: string;
  icon: ReactNode;
  apply: (c: AppConfig) => AppConfig;
}

const STYLES: StylePreset[] = [
  {
    name: 'Polaroid',
    icon: <Square size={18} />,
    apply: (c) => ({
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
      labels: c.labels.map((l, i): TextLabel => i === 0 ? { ...l, position: 'Bottom Center', positionYScale: -0.02, show: true } : l),
      exifPills: { ...c.exifPills, position: 'Bottom Center', positionYScale: 0.02, show: true }
    })
  },
  {
    name: 'Museum',
    icon: <Frame size={18} />,
    apply: (c) => ({
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
      labels: c.labels.map((l, i): TextLabel => i === 0 ? { ...l, position: 'Bottom Center', positionYScale: 0, show: true } : l),
      exifPills: { ...c.exifPills, position: 'Bottom Center', positionYScale: 0.05, show: true }
    })
  },
  {
    name: 'Minimal',
    icon: <Maximize size={18} />,
    apply: (c) => ({
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
      labels: c.labels.map((l, i): TextLabel => i === 0 ? { ...l, show: true } : l),
      exifPills: { ...c.exifPills, show: false }
    })
  }
];

// Only the Polaroid card can be told apart from the current config (it is the only preset with its own border mode).
const isPresetActive = (preset: StylePreset, config: AppConfig) =>
  preset.name === 'Polaroid' && config.layout.innerBorderMode === 'polaroid';

// [REQ-UI-08] Style cards are buttons so the gallery is keyboard-operable
const StyleGallery = ({ config, updateConfig }: StyleGalleryProps) => (
  <div className="style-gallery" role="group" aria-labelledby="styles-label">
    {STYLES.map((s) => {
      const isActive = isPresetActive(s, config);
      return (
        <button
          key={s.name}
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

export default StyleGallery;
