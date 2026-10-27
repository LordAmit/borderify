import React, { useState } from 'react';
import { Type, Square, Database, Image, Download, Save, ChevronUp, ChevronDown } from 'lucide-react';
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
  // [REQ-UI-01] Below 768 px the sidebar is a bottom drawer; this flag is the open/collapsed state of that drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleSection = (section: SectionId) => {
    setOpenSection(openSection === section ? '' : section);
  };

  const jumpToSection = (section: SectionId) => {
    setOpenSection(section);
    setDrawerOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && drawerOpen) setDrawerOpen(false);
  };

  // [REQ-UI-02] [REQ-STAT-08] Collapsible sections in fixed order: Layout, Captions, Logo, EXIF, Presets, Export
  const sections: { id: SectionId; title: string; short: string; icon: React.ReactNode; body: React.ReactNode }[] = [
    { id: 'layout', title: 'Layout & Border', short: 'Layout', icon: <Square size={16} />, body: <LayoutSection /> },
    { id: 'typography', title: 'Caption', short: 'Caption', icon: <Type size={16} />, body: <CaptionSection hasMultipleImages={hasMultipleImages} /> },
    { id: 'logo', title: 'Logo', short: 'Logo', icon: <Image size={16} />, body: <LogoSection /> },
    { id: 'exif', title: 'EXIF Data', short: 'EXIF', icon: <Database size={16} />, body: <ExifSection /> },
    { id: 'presets', title: 'Presets', short: 'Presets', icon: <Save size={16} />, body: <PresetsSection onSavePreset={onSavePreset} onLoadPreset={onLoadPreset} /> },
    {
      id: 'export', title: 'Export', short: 'Export', icon: <Download size={16} />,
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
    <aside className={`sidebar${drawerOpen ? ' sidebar-open' : ''}`} aria-label="Settings" onKeyDown={handleKeyDown}>
      {/* Peek bar: only shown by the mobile stylesheet; on desktop the sidebar is always expanded */}
      <div className="drawer-bar">
        <button
          type="button"
          className="drawer-handle"
          aria-expanded={drawerOpen}
          aria-controls="sidebar-content"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <span className="drawer-grip" aria-hidden="true" />
          <span className="drawer-handle-label">Settings</span>
          {drawerOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
        </button>
        <div className="drawer-tabs" role="group" aria-label="Jump to section">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`drawer-tab${openSection === s.id && drawerOpen ? ' active' : ''}`}
              aria-pressed={openSection === s.id && drawerOpen}
              onClick={() => jumpToSection(s.id)}
            >
              {s.icon}
              <span className="drawer-tab-label">{s.short}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-content" id="sidebar-content">
        <span className="label styles-label" id="styles-label">Styles</span>
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
    </aside>
  );
};

export default SidebarControls;
