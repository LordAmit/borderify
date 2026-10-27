import React, { useState } from 'react';
import { Type, Square, Database, Image, Download, Save } from 'lucide-react';
import { useStore } from './store';
import StyleGallery from './controls/StyleGallery';
import AccordionSection from './controls/AccordionSection';
import LayoutSection from './sidebar/LayoutSection';
import CaptionSection from './sidebar/CaptionSection';
import LogoSection from './sidebar/LogoSection';
import ExifSection from './sidebar/ExifSection';
import PresetsSection from './sidebar/PresetsSection';
import ExportSection from './sidebar/ExportSection';

export interface SidebarControlsProps {
  onPreviewExport?: () => void;
  isPreviewLoading?: boolean;
  onSavePreset?: () => void;
  onLoadPreset?: () => void;
  onExportSingle?: () => void;
  onExportBatch?: () => void;
  hasImages?: boolean;
  hasMultipleImages?: boolean;
}

type SectionId = 'layout' | 'typography' | 'logo' | 'exif' | 'presets' | 'export';

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
  const { state, updateConfig } = useStore();
  const [openSection, setOpenSection] = useState<SectionId | ''>('layout');

  const toggleSection = (section: SectionId) => {
    setOpenSection(openSection === section ? '' : section);
  };

  // [REQ-UI-02] [REQ-STAT-08] Collapsible sections in fixed order: Layout, Captions, Logo, EXIF, Presets, Export
  const sections: { id: SectionId; title: string; icon: React.ReactNode; body: React.ReactNode }[] = [
    { id: 'layout', title: 'Layout & Border', icon: <Square size={16} />, body: <LayoutSection /> },
    { id: 'typography', title: 'Caption', icon: <Type size={16} />, body: <CaptionSection hasMultipleImages={hasMultipleImages} /> },
    { id: 'logo', title: 'Logo', icon: <Image size={16} />, body: <LogoSection /> },
    { id: 'exif', title: 'EXIF Data', icon: <Database size={16} />, body: <ExifSection /> },
    { id: 'presets', title: 'Presets', icon: <Save size={16} />, body: <PresetsSection onSavePreset={onSavePreset} onLoadPreset={onLoadPreset} /> },
    {
      id: 'export', title: 'Export', icon: <Download size={16} />,
      body: (
        <ExportSection
          onPreviewExport={onPreviewExport}
          isPreviewLoading={isPreviewLoading}
          onExportSingle={onExportSingle}
          onExportBatch={onExportBatch}
          hasImages={hasImages}
          hasMultipleImages={hasMultipleImages}
        />
      )
    },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <span className="label" id="styles-label" style={{ marginBottom: '8px' }}>Styles</span>
        <StyleGallery config={state.config} updateConfig={updateConfig} />

        {sections.map((s) => (
          <AccordionSection
            key={s.id}
            id={s.id}
            title={s.title}
            icon={s.icon}
            open={openSection === s.id}
            onToggle={() => toggleSection(s.id)}
          >
            {s.body}
          </AccordionSection>
        ))}
      </div>
    </div>
  );
};

export default SidebarControls;
