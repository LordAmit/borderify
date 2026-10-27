import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Upload, Trash2, Download, X, ImagePlus } from 'lucide-react';
import { useStore } from './store';
import { extractExif, exportImageWithExif } from './exif';
import { renderPhotoBorder } from './render';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import CanvasPreview from './CanvasPreview';
import SidebarControls from './SidebarControls';
import Notice from './controls/Notice';
import { useFontLoader } from './useFontLoader';

import piexif from 'piexifjs';

function App() {
  const { state, addImage, updateConfig, clearAllImages, setActiveImage, removeImage, setNotice, setExportProgress } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const previewDialogRef = useRef<HTMLDivElement>(null);
  const previewCloseRef = useRef<HTMLButtonElement>(null);
  const previewTriggerRef = useRef<HTMLElement | null>(null);

  // [REQ-UI-10] Preview overlay behaves as a modal dialog: focus moves in, Tab stays inside, Escape closes, focus returns to the trigger
  useEffect(() => {
    if (!previewUrl) return;
    previewCloseRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPreviewUrl(null);
        return;
      }
      if (e.key !== 'Tab' || !previewDialogRef.current) return;
      const focusable = previewDialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previewTriggerRef.current?.focus();
    };
  }, [previewUrl]);

  // Re-render the canvas once a font has finished loading
  const refreshPreview = useCallback(() => updateConfig(c => ({ ...c })), [updateConfig]);
  useFontLoader(state.config, state.images, refreshPreview);

  // [ARC-02] [REQ-EXIF-01] [REQ-EXIF-03] [REQ-EXIF-04] Client-side loading via the File API; each file gets EXIF extracted, then joins the queue
  const processFiles = async (files: FileList) => {
    let skipped = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/') && !file.name.match(/\.(jpe?g|png|webp|heic|heif|gif)$/i)) {
        skipped++;
        continue;
      }

      let rawExifStr: string | null = null;
      if (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.name.match(/\.jpe?g$/i)) {
        const reader = new FileReader();
        rawExifStr = await new Promise((resolve) => {
          reader.onload = (e) => {
            try {
              const dataUrl = e.target?.result as string;
              const exifObj = piexif.load(dataUrl);
              const exifStr = piexif.dump(exifObj);
              if (exifStr && exifStr !== "Exif\x00\x00MM\x00*\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00") {
                resolve(exifStr);
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          };
          reader.readAsDataURL(file);
        });
      }

      const exif = await extractExif(file);
      const tempImg = new Image();
      const objectUrl = URL.createObjectURL(file);

      const isLoaded = await new Promise((resolve) => {
        tempImg.onload = () => resolve(true);
        tempImg.onerror = () => resolve(false);
        tempImg.src = objectUrl;
      });

      // [REQ-EXIF-05] Undecodable image: skip it and keep processing the rest of the queue
      if (!isLoaded) {
        skipped++;
        continue;
      }

      addImage({
        id: uuidv4(),
        file,
        objectUrl,
        width: tempImg.naturalWidth || tempImg.width,
        height: tempImg.naturalHeight || tempImg.height,
        exif,
        rawExifStr,
      });
    }

    // [REQ-UI-13] Tell the user how many files were skipped; the rest are already in the queue
    if (skipped > 0) {
      setNotice({
        kind: 'info',
        message: skipped === 1
          ? 'Skipped 1 file that could not be read as an image.'
          : `Skipped ${skipped} files that could not be read as images.`,
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    await processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // [REQ-UI-15] Track enter/leave depth so nested children do not flicker the highlight
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        await processFiles(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // [ARC-02] [REQ-EXPT-02] [REQ-UI-06] Batch export: render every queued image sequentially into one ZIP
  const handleExportBatch = async () => {
    if (state.images.length === 0 || state.exportProgress) return;

    // [REQ-UI-14] Publish progress so the export controls can show it and lock while the ZIP builds
    const total = state.images.length;
    setExportProgress({ done: 0, total });
    try {
      // Create an offscreen canvas
      const canvas = document.createElement('canvas');
      const zip = new JSZip();

      // Load logo if exists
      let logoImg: HTMLImageElement | null = null;
      if (state.config.logo.dataUrl) {
        logoImg = new Image();
        await new Promise((resolve) => {
          logoImg!.onload = resolve;
          logoImg!.src = state.config.logo.dataUrl!;
        });
      }

      for (const [index, image] of state.images.entries()) {
        setExportProgress({ done: index + 1, total });
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = image.objectUrl;
        });

        // [REQ-EXPT-03] Longest-edge limit from export.maxResolution
        let overrideMaxRes = Infinity;
        if (state.config.export?.maxResolution === "4K") overrideMaxRes = 3840;
        if (state.config.export?.maxResolution === "Facebook") overrideMaxRes = 2048;
        if (state.config.export?.maxResolution === "Instagram") overrideMaxRes = 1350;

        // Render to offscreen canvas
        renderPhotoBorder(canvas, image, img, state.config, logoImg, overrideMaxRes);

        const quality = (state.config.export?.quality ?? 100) / 100;
        const blob = await exportImageWithExif(canvas, image, quality);
        if (blob) {
          zip.file(`Bordered-${image.file.name.replace(/\.[^/.]+$/, "")}.jpg`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Batch-Export.zip`;
      link.click();
    } finally {
      setExportProgress(null);
    }
  };

  const handleExportSingle = async () => {
    if (state.images.length === 0) return;

    let targetImage = state.images.find(img => img.id === state.activeImageId);
    if (!targetImage) targetImage = state.images[0];

    const canvas = document.createElement('canvas');
    let logoImg: HTMLImageElement | null = null;
    if (state.config.logo.dataUrl) {
      logoImg = new Image();
      await new Promise((resolve) => {
        logoImg!.onload = resolve;
        logoImg!.src = state.config.logo.dataUrl!;
      });
    }

    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = targetImage.objectUrl;
    });

    // [REQ-EXPT-03] Longest-edge limit from export.maxResolution
    let overrideMaxRes = Infinity;
    if (state.config.export?.maxResolution === "4K") overrideMaxRes = 3840;
    if (state.config.export?.maxResolution === "Facebook") overrideMaxRes = 2048;
    if (state.config.export?.maxResolution === "Instagram") overrideMaxRes = 1350;

    renderPhotoBorder(canvas, targetImage, img, state.config, logoImg, overrideMaxRes);

    const quality = (state.config.export?.quality ?? 100) / 100;
    const blob = await exportImageWithExif(canvas, targetImage, quality);
    if (blob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Bordered-${targetImage.file.name.replace(/\.[^/.]+$/, "")}.jpg`;
      link.click();
    }
  };

  const handlePreviewExport = async () => {
    if (state.images.length === 0) return;
    previewTriggerRef.current = document.activeElement as HTMLElement | null;
    setIsPreviewLoading(true);

    let targetImage = state.images.find(img => img.id === state.activeImageId);
    if (!targetImage) targetImage = state.images[0];

    const canvas = document.createElement('canvas');
    let logoImg: HTMLImageElement | null = null;
    if (state.config.logo.dataUrl) {
      logoImg = new Image();
      await new Promise((resolve) => {
        logoImg!.onload = resolve;
        logoImg!.src = state.config.logo.dataUrl!;
      });
    }

    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = targetImage.objectUrl;
    });

    // [REQ-EXPT-03] Longest-edge limit from export.maxResolution
    let overrideMaxRes = Infinity;
    if (state.config.export?.maxResolution === "4K") overrideMaxRes = 3840;
    if (state.config.export?.maxResolution === "Facebook") overrideMaxRes = 2048;
    if (state.config.export?.maxResolution === "Instagram") overrideMaxRes = 1350;

    renderPhotoBorder(canvas, targetImage, img, state.config, logoImg, overrideMaxRes);

    const quality = (state.config.export?.quality ?? 100) / 100;
    const blob = await exportImageWithExif(canvas, targetImage, quality);
    if (blob) {
      setPreviewUrl(URL.createObjectURL(blob));
    }
    setIsPreviewLoading(false);
  };

  // [REQ-UI-04] Export the active configuration as a JSON file
  const savePresetJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.config, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "border-preset.json");
    dlAnchorElem.click();
  };

  const importPresetRef = useRef<HTMLInputElement>(null);

  // [REQ-STAT-02] [REQ-UI-04] Overwrite the active configuration from an uploaded preset JSON
  const loadPresetJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      // [REQ-UI-12] Reject anything that is not a configuration object and tell the user; current settings stay
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const looksLikeConfig = parsed && typeof parsed === 'object' && typeof parsed.layout === 'object' && Array.isArray(parsed.labels);
        if (!looksLikeConfig) throw new Error('not a Borderify preset');
        updateConfig(() => parsed);
        setNotice(null);
      } catch (err) {
        console.error("Failed to load preset JSON", err);
        setNotice({ kind: 'error', message: `Could not load "${file.name}" as a preset. Your current settings were kept.` });
      }
    };
    reader.readAsText(file);
    if (importPresetRef.current) importPresetRef.current.value = '';
  };

  // [REQ-UI-01] Split-pane layout: workspace (canvas preview) plus SidebarControls (desktop sidebar / mobile drawer)
  return (
    <div
      className="app-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <div className="workspace">
        <header className="top-bar">
          <div className="brand">
            <img src="./favicon.svg" alt="Borderify Logo" className="logo-icon" style={{ width: 32, height: 32 }} />
            <div className="brand-text">
              <h1 className="brand-name">Borderify</h1>
              <span className="byline">
                <span className="byline-credit">Made with ❤️ by <a href="https://github.com/lordamit" target="_blank" rel="noopener noreferrer">Amit Seal Ami</a></span>
                <span className="byline-dot">•</span>
                <a href="https://github.com/lordamit/borderify" target="_blank" rel="noopener noreferrer" className="byline-link">
                  <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '3px' }}>
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  GitHub
                </a>
              </span>
            </div>
          </div>
          <div className="actions">
            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <input
              type="file"
              accept=".json"
              ref={importPresetRef}
              style={{ display: 'none' }}
              onChange={loadPresetJSON}
            />
            <div className="action-group">
              <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} /> Browse
              </button>
              {/* [REQ-STAT-06] [REQ-UI-05] Clear all queued images */}
              <button type="button" className="btn btn-danger" onClick={() => clearAllImages()} disabled={state.images.length === 0} title="Clear All Photos">
                <Trash2 size={16} /> Reset
              </button>
            </div>
          </div>
        </header>

        {state.notice && <Notice notice={state.notice} onDismiss={() => setNotice(null)} />}

        {/* [REQ-UI-15] Highlighted drop target while files are dragged over the app */}
        <div className={`canvas-container${isDragging ? ' drop-active' : ''}`}>
          {isDragging && (
            <div className="drop-overlay" aria-hidden="true">
              <ImagePlus size={28} />
              <span>Drop photos to add them</span>
            </div>
          )}
          {state.images.length === 0 ? (
            <div className="empty-state glass-panel" style={{ padding: '40px', borderRadius: '16px' }}>
              <img src="./favicon.svg" alt="Borderify Empty State" style={{ width: 100, height: 100 }} />
              <h2 style={{ marginBottom: '8px' }}>No Photos Loaded</h2>
              <p style={{ maxWidth: '300px', fontSize: '14px' }}>Start framing your photos by dropping them here.</p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={18} />
                <span>Choose Photos</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <CanvasPreview />
              </div>
              {/* [REQ-UI-05] Image queue: thumbnails with select and delete controls */}
              {state.images.length > 1 && (
                <div style={{
                  height: '80px',
                  flexShrink: 0,
                  display: 'flex',
                  gap: '8px',
                  padding: '8px',
                  overflowX: 'auto',
                  background: 'var(--surface-color)',
                  borderTop: '1px solid var(--surface-border)'
                }}>
                  {state.images.map(img => (
                    <div
                      key={img.id}
                      style={{
                        position: 'relative',
                        height: '100%',
                        flexShrink: 0
                      }}
                    >
                      {/* [REQ-UI-08] [REQ-UI-09] Thumbnail is a pressable button named by the image alt text */}
                      <button
                        type="button"
                        className="thumbnail-select"
                        aria-pressed={state.activeImageId === img.id}
                        onClick={() => setActiveImage(img.id)}
                        style={{
                          opacity: state.activeImageId === img.id ? 1 : 0.5,
                          border: state.activeImageId === img.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                        }}
                      >
                        <img src={img.objectUrl} alt={img.file.name} style={{ height: '100%', objectFit: 'cover', width: 'auto' }} />
                      </button>
                      <button
                        type="button"
                        className="thumbnail-remove-btn"
                        aria-label={`Remove ${img.file.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SidebarControls
        onPreviewExport={handlePreviewExport}
        isPreviewLoading={isPreviewLoading}
        onSavePreset={savePresetJSON}
        onLoadPreset={() => importPresetRef.current?.click()}
        onExportSingle={handleExportSingle}
        onExportBatch={handleExportBatch}
        hasImages={state.images.length > 0}
        hasMultipleImages={state.images.length > 1}
      />

      {previewUrl && (
        <div
          ref={previewDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Export preview"
          style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            gap: '12px'
          }}>
            <button type="button" className="btn btn-primary" onClick={handleExportSingle}>
              <Download size={16} /> Save Image
            </button>
            <button type="button" ref={previewCloseRef} className="btn btn-outline" onClick={() => setPreviewUrl(null)} style={{ background: 'var(--surface-color)' }}>
              <X size={16} /> Close Preview
            </button>
          </div>
          <img src={previewUrl} alt="Export preview of the current image at export quality" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
        </div>
      )}
    </div>
  );
}

export default App;
