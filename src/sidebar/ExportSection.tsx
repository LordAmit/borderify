import { useMemo } from 'react';
import { Image, Download, Archive } from 'lucide-react';
import { useStore } from '../store';
import type { ExportSettings } from '../types';
import SliderRow from '../controls/SliderRow';
import { useActiveImage } from './useActiveImage';

export interface ExportSectionProps {
  onPreviewExport?: () => void;
  isPreviewLoading?: boolean;
  onExportSingle?: () => void;
  onExportBatch?: () => void;
  hasImages?: boolean;
  hasMultipleImages?: boolean;
}

const MAX_EDGE: Record<ExportSettings['maxResolution'], number> = {
  Original: Infinity,
  '4K': 3840,
  Facebook: 2048,
  Instagram: 1350,
};

// [REQ-EXPT-03] [REQ-UI-06] Export Settings
const ExportSection = ({ onPreviewExport, isPreviewLoading, onExportSingle, onExportBatch, hasImages, hasMultipleImages }: ExportSectionProps) => {
  const { state, updateConfig } = useStore();
  const { activeImage } = useActiveImage();
  const config = state.config;

  const setExport = (patch: Partial<ExportSettings>) =>
    updateConfig((c) => ({ ...c, export: { ...c.export, ...patch } }));

  const projectedDimensions = useMemo(() => {
    if (!activeImage) return null;
    const overrideMaxRes = MAX_EDGE[config.export?.maxResolution ?? 'Original'] ?? Infinity;

    const longestEdge = Math.max(activeImage.width, activeImage.height);
    const scaleLimit = longestEdge > overrideMaxRes ? overrideMaxRes / longestEdge : 1;

    let targetRatio = activeImage.width / activeImage.height;
    if (config.layout.aspectRatio !== 'Original') {
      const [w, h] = config.layout.aspectRatio.split(':').map(Number);
      if (w && h) targetRatio = w / h;
    }

    const baseLength = longestEdge * scaleLimit;
    const cWidth = targetRatio > 1 ? baseLength : baseLength * targetRatio;
    const cHeight = targetRatio > 1 ? baseLength / targetRatio : baseLength;
    return { w: Math.round(cWidth), h: Math.round(cHeight) };
  }, [activeImage, config.export?.maxResolution, config.layout.aspectRatio]);

  return (
    <>
      <div className="control-group">
        <label className="label" htmlFor="export-resolution">Resolution Limit</label>
        <select
          id="export-resolution"
          className="input-field"
          value={config.export?.maxResolution || 'Original'}
          onChange={(e) => setExport({ maxResolution: e.target.value as ExportSettings['maxResolution'] })}
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
        onChange={(val) => setExport({ quality: val })}
        onReset={() => setExport({ quality: 100 })}
      />

      {onPreviewExport && (
        <button
          type="button"
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
          <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onExportSingle}>
            <Download size={16} /> Save Current Image
          </button>
          {hasMultipleImages && (
            <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={onExportBatch}>
              <Archive size={16} /> Save All (ZIP)
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default ExportSection;
