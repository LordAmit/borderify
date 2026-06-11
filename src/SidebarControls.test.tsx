import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import SidebarControls from './SidebarControls';
import { StoreProvider, useStore } from './store';

// Helper component to verify state changes
const StateViewer = () => {
  const { state } = useStore();
  return (
    <pre data-testid="store-state">
      {JSON.stringify({
        aspectRatio: state.config.layout.aspectRatio,
        backgroundType: state.config.layout.backgroundType,
        backgroundColor: state.config.layout.backgroundColor,
        borderWidthScale: state.config.layout.borderWidthScale,
        innerBorderMode: state.config.layout.innerBorderMode,
        imageRadiusScale: state.config.layout.imageRadiusScale,
        labels: state.config.labels,
        logo: state.config.logo,
        exifPills: state.config.exifPills,
        export: state.config.export,
        imagesLength: state.images.length,
      }, null, 2)}
    </pre>
  );
};

const setupTest = (props = {}) => {
  return render(
    <StoreProvider>
      <div style={{ display: 'flex' }}>
        <SidebarControls
          onPreviewExport={vi.fn()}
          isPreviewLoading={false}
          onSavePreset={vi.fn()}
          onLoadPreset={vi.fn()}
          onExportSingle={vi.fn()}
          onExportBatch={vi.fn()}
          hasImages={true}
          hasMultipleImages={true}
          {...props}
        />
        <StateViewer />
      </div>
    </StoreProvider>
  );
};

describe('SidebarControls Settings Interactions', () => {
  it('toggles accordion sections upon header clicks', () => {
    setupTest();
    // Default open section is layout. Captions section should be collapsed
    expect(screen.queryByText(/Caption Text/i)).not.toBeInTheDocument();

    // Click Caption header to expand
    const captionHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Caption'))!;
    fireEvent.click(captionHeader);
    expect(screen.getByText(/Caption Text/i)).toBeInTheDocument();

    // Click EXIF header to expand
    const exifHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('EXIF Data'))!;
    fireEvent.click(exifHeader);
    expect(screen.getByText(/Show EXIF Pills/i)).toBeInTheDocument();
  });

  it('updates Aspect Ratio config correctly', () => {
    setupTest();
    const ratioButton = screen.getByText('1:1');
    fireEvent.click(ratioButton);

    const stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.aspectRatio).toBe('1:1');
  });

  it('toggles Advanced Border & Effects and manipulates custom sliders', () => {
    setupTest();
    
    // Toggle advanced section
    const advancedToggle = screen.getByText(/Advanced Border & Effects/i);
    fireEvent.click(advancedToggle);

    // Find the border style select specifically by checking options
    const selects = screen.getAllByRole('combobox');
    const borderStyleSelect = selects.find(sel => {
      const options = Array.from(sel.querySelectorAll('option'));
      return options.some(opt => opt.value === 'custom');
    }) as HTMLSelectElement;

    fireEvent.change(borderStyleSelect, { target: { value: 'custom' } });

    const stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.innerBorderMode).toBe('custom');
  });

  it('nudges sliders using increase and decrease buttons', () => {
    setupTest();

    // Find nudge buttons for Frame Size
    const frameSizeLabel = screen.getByText(/Frame Size/i);
    // Find parent container of Frame Size label to locate the correct nudge buttons
    const container = frameSizeLabel.closest('.compact-slider');
    expect(container).not.toBeNull();

    const nudgeButtons = container!.querySelectorAll('.nudge-btn');
    expect(nudgeButtons.length).toBe(2);

    const decreaseButton = Array.from(nudgeButtons).find(btn => btn.textContent === '−');
    const increaseButton = Array.from(nudgeButtons).find(btn => btn.textContent === '+');

    expect(increaseButton).toBeDefined();
    expect(decreaseButton).toBeDefined();

    // Increment frame size
    fireEvent.click(increaseButton!);
    let stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    const initialWidth = stateObj.borderWidthScale;

    // Trigger nudge button to increase
    fireEvent.click(increaseButton!);
    stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.borderWidthScale).toBeGreaterThan(initialWidth);

    // Trigger nudge button to decrease
    fireEvent.click(decreaseButton!);
    stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.borderWidthScale).toBe(initialWidth);
  });

  it('updates caption text and tags', () => {
    setupTest();
    const captionHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Caption'))!;
    fireEvent.click(captionHeader);

    const textarea = screen.getByPlaceholderText(/Enter caption for this photo.../i);
    fireEvent.change(textarea, { target: { value: 'Beautiful Shot' } });

    const stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.labels[0].text).toBe('Beautiful Shot');
  });

  it('manages Logo panel controls', () => {
    const originalReadAsDataURL = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsDataURL = function(this: FileReader) {
      if (this.onload) {
        this.onload({ target: { result: 'data:image/png;base64,mock-logo-url' } } as any);
      }
    };

    setupTest();
    const logoHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Logo'))!;
    fireEvent.click(logoHeader);
    
    // Check if Upload Logo file input exists
    const fileInput = screen.getByText(/Upload Logo/i).closest('.control-group')?.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();

    const file = new File(['logo-binary'], 'logo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Grid dots position selection
    const dots = document.querySelectorAll('.grid-dot');
    if (dots.length > 0) {
      fireEvent.click(dots[0]);
    }

    // Nudge logo sizes and offsets
    const logoBody = logoHeader.closest('.accordion-item')?.querySelector('.accordion-body');
    const logoNudges = logoBody?.querySelectorAll('.nudge-btn') || [];
    logoNudges.forEach(btn => fireEvent.click(btn));

    // Clear logo
    const clearLogoBtn = screen.getByText(/Clear Logo/i);
    expect(clearLogoBtn).toBeInTheDocument();
    fireEvent.click(clearLogoBtn);

    FileReader.prototype.readAsDataURL = originalReadAsDataURL;
  });

  it('toggles EXIF configurations and filters', () => {
    setupTest();
    const exifHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('EXIF Data'))!;
    fireEvent.click(exifHeader);

    const showPillsCheckbox = screen.getByText(/Show EXIF Pills/i).querySelector('input') || screen.getByText(/Show EXIF Pills/i);
    fireEvent.click(showPillsCheckbox);

    let stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.exifPills.show).toBe(false);

    // Toggle back on
    fireEvent.click(showPillsCheckbox);
    stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.exifPills.show).toBe(true);
  });

  it('triggers preset save and load callbacks', () => {
    const onSave = vi.fn();
    const onLoad = vi.fn();
    setupTest({ onSavePreset: onSave, onLoadPreset: onLoad });

    const presetsHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Presets'))!;
    fireEvent.click(presetsHeader);
    
    const saveBtn = screen.getByText(/Save preset/i);
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalled();

    const loadBtn = screen.getByText(/Load preset/i);
    fireEvent.click(loadBtn);
    expect(onLoad).toHaveBeenCalled();
  });

  it('triggers single and batch export actions', () => {
    const onSingle = vi.fn();
    const onBatch = vi.fn();
    setupTest({ onExportSingle: onSingle, onExportBatch: onBatch });

    const exportHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Export'))!;
    fireEvent.click(exportHeader);

    const singleBtn = screen.getByText(/Save Current Image/i);
    fireEvent.click(singleBtn);
    expect(onSingle).toHaveBeenCalled();

    const batchBtn = screen.getByText(/Save All \(ZIP\)/i);
    fireEvent.click(batchBtn);
    expect(onBatch).toHaveBeenCalled();
  });

  it('toggles and modifies Advanced EXIF properties', () => {
    setupTest();
    const exifHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('EXIF Data'))!;
    fireEvent.click(exifHeader);

    // Toggle advanced section
    const advancedToggle = screen.getByText(/Advanced EXIF Positioning & Styles/i);
    fireEvent.click(advancedToggle);

    // Custom camera input
    const cameraInput = screen.getByPlaceholderText('e.g. {make} {model}');
    fireEvent.change(cameraInput, { target: { value: 'My Custom Camera' } });

    // Custom lens input
    const lensInput = screen.getByPlaceholderText('e.g. {lens}');
    fireEvent.change(lensInput, { target: { value: 'My Custom Lens' } });

    // EXIF font family
    const fontInput = screen.getByText('EXIF Font').closest('.control-group')!.querySelector('input[type="text"]')!;
    expect(fontInput).toBeDefined();
    fireEvent.change(fontInput, { target: { value: 'Courier New' } });

    const stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.exifPills.customCameraText).toBe('My Custom Camera');
    expect(stateObj.exifPills.customLensText).toBe('My Custom Lens');
    expect(stateObj.exifPills.fontFamily).toBe('Courier New');
  });

  it('toggles individual EXIF metadata display chips', () => {
    setupTest();
    const exifHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('EXIF Data'))!;
    fireEvent.click(exifHeader);

    // Click Camera pill chip to toggle it on/off
    const cameraChip = screen.getByText(/\+ Camera/i) || screen.getByText(/✓ Camera/i);
    fireEvent.click(cameraChip);

    let stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.exifPills.showCamera).toBe(true);

    fireEvent.click(screen.getByText(/✓ Camera/i));
    stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.exifPills.showCamera).toBe(false);

    // Click all remaining chips
    const chips = ['Lens', 'Aperture', 'ISO', 'Shutter', 'Focal', 'Date'];
    chips.forEach(c => {
      const el = screen.queryByText(new RegExp('(\\+|✓) ' + c, 'i'));
      if (el) fireEvent.click(el);
    });
  });

  it('selects preset styles from gallery', () => {
    setupTest();
    const museumCard = screen.getByText('Museum');
    fireEvent.click(museumCard);

    let stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.innerBorderMode).toBe('uniform');

    const minimalCard = screen.getByText('Minimal');
    fireEvent.click(minimalCard);
    stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.exifPills.show).toBe(false);
  });

  it('configures export settings', () => {
    setupTest();
    const exportHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Export'))!;
    fireEvent.click(exportHeader);

    // Change resolution limit
    const selects = screen.getAllByRole('combobox');
    const resLimitSelect = selects.find(sel => {
      const options = Array.from(sel.querySelectorAll('option'));
      return options.some(opt => opt.value === '4K');
    }) as HTMLSelectElement;
    fireEvent.change(resLimitSelect, { target: { value: '4K' } });

    const stateObj = JSON.parse(screen.getByTestId('store-state').textContent || '{}');
    expect(stateObj.export.maxResolution).toBe('4K');
  });

  it('interacts with all color inputs, background types, checkboxes, nudges, and styling controls', () => {
    setupTest();

    // 1. Change Background Type
    const selectElements = screen.getAllByRole('combobox');
    const bgSelect = selectElements.find(sel => {
      const options = Array.from(sel.querySelectorAll('option'));
      return options.some(opt => opt.value === 'blurred-image');
    }) as HTMLSelectElement;
    fireEvent.change(bgSelect, { target: { value: 'color' } });

    // Change color input
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
      fireEvent.change(input, { target: { value: '#ff0000' } });
    });

    // 2. Expand Layout advanced section
    const advancedToggle = screen.getByText(/Advanced Border & Effects/i);
    fireEvent.click(advancedToggle);

    // Change Inner Border mode
    const selects = screen.getAllByRole('combobox');
    const borderStyleSelect = selects.find(sel => {
      const options = Array.from(sel.querySelectorAll('option'));
      return options.some(opt => opt.value === 'custom');
    }) as HTMLSelectElement;
    
    fireEvent.change(borderStyleSelect, { target: { value: 'polaroid' } });
    fireEvent.change(borderStyleSelect, { target: { value: 'uniform' } });

    // Click Reset on compact sliders
    const resets = document.querySelectorAll('button[title="Reset"]');
    resets.forEach(btn => fireEvent.click(btn));

    // Nudge buttons
    const nudges = document.querySelectorAll('.nudge-btn');
    nudges.forEach(btn => fireEvent.click(btn));

    // 3. Caption Tab Settings
    const captionHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Caption'))!;
    fireEvent.click(captionHeader);

    // Checkboxes
    const applyCaptionAll = document.getElementById('apply-caption-all');
    if (applyCaptionAll) fireEvent.click(applyCaptionAll);
    const applyStyleAll = document.getElementById('apply-style-all');
    if (applyStyleAll) fireEvent.click(applyStyleAll);

    // Click styling outline buttons (bold, italic)
    const captionBody = captionHeader.closest('.accordion-item')?.querySelector('.accordion-body');
    const outlineButtons = captionBody?.querySelectorAll('.btn-outline') || [];
    outlineButtons.forEach(btn => fireEvent.click(btn));

    // Tag list click
    const makeTag = screen.getAllByText(/make/i).find(el => el.classList.contains('chip'));
    if (makeTag) fireEvent.click(makeTag);

    // Font upload mock
    const fontUpload = document.getElementById('font-upload') as HTMLInputElement;
    if (fontUpload) {
      const file = new File(['font'], 'font.woff2', { type: 'font/woff2' });
      fireEvent.change(fontUpload, { target: { files: [file] } });
    }

    // 4. Logo settings
    const logoHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Logo'))!;
    fireEvent.click(logoHeader);

    const logoUpload = screen.getByText(/Upload Logo/i).closest('.control-group')?.querySelector('input[type="file"]') as HTMLInputElement;
    if (logoUpload) {
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      fireEvent.change(logoUpload, { target: { files: [file] } });
    }

    // Nudge logo sizes and offsets
    const logoBody = logoHeader.closest('.accordion-item')?.querySelector('.accordion-body');
    const logoNudges = logoBody?.querySelectorAll('.nudge-btn') || [];
    logoNudges.forEach(btn => fireEvent.click(btn));

    // Grid dots position selection
    const dots = document.querySelectorAll('.grid-dot');
    if (dots.length > 0) {
      fireEvent.click(dots[0]);
    }

    // Clear logo
    const clearLogoBtn = screen.queryByText(/Clear Logo/i);
    if (clearLogoBtn) fireEvent.click(clearLogoBtn);

    // 5. Advanced EXIF positioning nudges
    const exifHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('EXIF Data'))!;
    fireEvent.click(exifHeader);

    const advancedExifToggle = screen.getByText(/Advanced EXIF Positioning & Styles/i);
    fireEvent.click(advancedExifToggle);

    const exifBody = exifHeader.closest('.accordion-item')?.querySelector('.accordion-body');
    const exifNudges = exifBody?.querySelectorAll('.nudge-btn') || [];
    exifNudges.forEach(btn => fireEvent.click(btn));
  });
});
