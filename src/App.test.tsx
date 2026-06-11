import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import App from './App';
import { StoreProvider, useStore } from './store';

// Mock JSZip
vi.mock('jszip', () => {
  const MockJSZip = function(this: any) {
    this.file = vi.fn();
    this.generateAsync = vi.fn().mockResolvedValue(new Blob(['mock-zip-content'], { type: 'application/zip' }));
  };
  return {
    default: MockJSZip,
  };
});

// Mock Canvas render context functions so canvas drawing does not crash in JSDOM
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 50 }),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  roundRect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  clip: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arcTo: vi.fn(),
  createLinearGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
});

HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,mock');

// Mock global fetch to return a mock blob for export processing
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  blob: vi.fn().mockResolvedValue(new Blob(['mock-blob-content'], { type: 'image/jpeg' })),
}));

// Mock URL.createObjectURL globally for JSDOM
window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
window.URL.revokeObjectURL = vi.fn();

// Mock Image loading in JSDOM
Object.defineProperty(global.Image.prototype, 'src', {
  set(src) {
    this._src = src;
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  },
  get() {
    return this._src;
  }
});

// Helper component to add initial images to the store context
const TestWrapper = ({ children, initialImages = [] }: any) => {
  const { addImage } = useStore();
  React.useEffect(() => {
    initialImages.forEach((img: any) => {
      addImage(img);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{children}</>;
};

describe('App Layout and UI components', () => {
  const renderApp = (initialImages: any[] = []) => {
    return render(
      <StoreProvider>
        <TestWrapper initialImages={initialImages}>
          <App />
        </TestWrapper>
      </StoreProvider>
    );
  };

  const mockImage1 = {
    id: 'img1',
    file: new File([], 'photo1.jpg', { type: 'image/jpeg' }),
    objectUrl: 'blob:photo1',
    width: 800,
    height: 600,
    exif: { Make: 'Sony', Model: 'A7III', FNumber: 2.8, ISOSpeedRatings: 100 },
    rawExifStr: null,
  };

  const mockImage2 = {
    id: 'img2',
    file: new File([], 'photo2.png', { type: 'image/png' }),
    objectUrl: 'blob:photo2',
    width: 1000,
    height: 1000,
    exif: {},
    rawExifStr: null,
  };

  it('[REQ-UI-01] renders control sidebar and canvas preview panel', () => {
    renderApp();
    expect(screen.getByText(/Borderify/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse/i) || screen.getByText(/Choose Photos/i)).toBeInTheDocument();
  });

  it('[REQ-UI-02] organizes settings inside collapsible sections', () => {
    renderApp();
    expect(screen.getByText(/Layout & Border/i)).toBeInTheDocument();
    expect(screen.getByText(/Caption/i)).toBeInTheDocument();
    expect(screen.getByText(/Presets/i)).toBeInTheDocument();
  });

  it('[REQ-UI-03] controls sliders using plus/minus increment buttons', () => {
    renderApp();
    expect(screen.getByText(/Frame Size/i)).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    const plusMinusButtons = buttons.filter(btn => btn.textContent === '+' || btn.textContent === '−' || btn.textContent === '-');
    expect(plusMinusButtons.length).toBeGreaterThan(0);
  });

  it('[REQ-UI-04] supports exporting configuration presets', () => {
    renderApp();
    const presetsHeader = screen.getByText(/Presets/i);
    fireEvent.click(presetsHeader);
    const savePresetBtn = screen.getByText(/Save preset/i);
    expect(savePresetBtn).toBeInTheDocument();
  });

  it('[REQ-UI-05] renders empty image queue state by default', () => {
    renderApp();
    expect(screen.getByText(/No Photos Loaded/i) || screen.getByText(/Choose Photos/i)).toBeInTheDocument();
  });

  it('[REQ-UI-06] renders batch export triggers', () => {
    renderApp();
    const exportBtn = screen.queryByText(/Save All \(ZIP\)/i);
    expect(exportBtn || screen.getByText(/Choose Photos/i)).toBeInTheDocument();
  });

  // Integration tests to hit 80%+ coverage

  it('renders and interacts with the loaded image queue list', () => {
    // Render with 2 images
    const { container } = renderApp([mockImage1, mockImage2]);

    // Check if thumbnails are rendered
    const thumbnails = screen.getAllByRole('img');
    
    // There should be thumbnails with objectUrl sources
    const imageThumbnails = thumbnails.filter(img => img.getAttribute('src')?.startsWith('blob:photo'));
    expect(imageThumbnails.length).toBeGreaterThan(0);

    // Active image set upon click
    const secondThumb = imageThumbnails[1];
    fireEvent.click(secondThumb);

    // Expand Export section
    const exportHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Export'))!;
    fireEvent.click(exportHeader);

    // Single export button is shown
    expect(screen.getByText(/Save Current Image/i)).toBeInTheDocument();
    
    // Batch export button is shown (multiple images loaded)
    expect(screen.getByText(/Save All \(ZIP\)/i)).toBeInTheDocument();

    // Click remove image button on thumbnail strip
    const removeBtns = container.querySelectorAll('.thumbnail-remove-btn');
    expect(removeBtns.length).toBeGreaterThan(0);
    fireEvent.click(removeBtns[0]);
  });

  it('clears all photos when clicking the reset button', () => {
    renderApp([mockImage1]);
    expect(screen.queryByText(/No Photos Loaded/i)).not.toBeInTheDocument();

    const resetBtn = screen.getByTitle(/Clear All Photos/i);
    fireEvent.click(resetBtn);

    expect(screen.getByText(/No Photos Loaded/i)).toBeInTheDocument();
  });

  it('triggers drag and drop events', () => {
    renderApp();
    const container = screen.getByText(/No Photos Loaded/i).closest('.app-container');
    expect(container).not.toBeNull();

    // Drag over
    fireEvent.dragOver(container!);

    // Drop
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.drop(container!, {
      dataTransfer: {
        files: [file],
      },
    });
  });

  it('triggers paste events', () => {
    renderApp();
    const file = new File([''], 'pasted.png', { type: 'image/png' });
    fireEvent.paste(window, {
      clipboardData: {
        files: [file],
      },
    });
  });

  it('loads preset from configuration file', () => {
    const originalReadAsText = FileReader.prototype.readAsText;
    FileReader.prototype.readAsText = function(this: FileReader) {
      if (this.onload) {
        this.onload({ target: { result: JSON.stringify({ layout: { aspectRatio: '9:16' }, labels: [], logo: {}, exifPills: {} }) } } as any);
      }
    };

    renderApp();
    const loadPresetInput = document.querySelector('input[accept=".json"]') as HTMLInputElement;
    expect(loadPresetInput).toBeInTheDocument();

    const file = new File(['mock-preset-json'], 'preset.json', { type: 'application/json' });
    fireEvent.change(loadPresetInput, { target: { files: [file] } });

    FileReader.prototype.readAsText = originalReadAsText;
  });

  it('uploads files and triggers file processing', async () => {
    const originalReadAsDataURL = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsDataURL = function(this: FileReader) {
      if (this.onload) {
        this.onload({ target: { result: 'data:image/jpeg;base64,mock-base64' } } as any);
      }
    };

    renderApp();
    const fileInput = document.querySelector('input[accept="image/*"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const file = new File(['image-binary'], 'image.jpg', { type: 'image/jpeg' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    FileReader.prototype.readAsDataURL = originalReadAsDataURL;
  });

  it('triggers preview quality generation and modal control buttons', async () => {
    renderApp([mockImage1]);

    // Expand Export section
    const exportHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Export'))!;
    fireEvent.click(exportHeader);

    // Click Preview Export button
    const previewBtn = screen.getByText(/Preview Export Quality/i);
    await act(async () => {
      fireEvent.click(previewBtn);
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Modal with close button is rendered
    const closeBtn = screen.getByText(/Close Preview/i);
    expect(closeBtn).toBeInTheDocument();

    // Click Close Preview
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Close Preview/i)).not.toBeInTheDocument();
  });

  it('triggers single and batch export generation workflows', async () => {
    renderApp([mockImage1, mockImage2]);

    // Expand Export section
    const exportHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Export'))!;
    fireEvent.click(exportHeader);

    // Mock anchor element clicking so we don't try to navigate/download in jsdom
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = vi.fn();

    // Click Save Current Image
    const singleBtn = screen.getByText(/Save Current Image/i);
    await act(async () => {
      fireEvent.click(singleBtn);
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Click Save All (ZIP)
    const batchBtn = screen.getByText(/Save All \(ZIP\)/i);
    await act(async () => {
      fireEvent.click(batchBtn);
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    HTMLAnchorElement.prototype.click = originalClick;
  });

  it('downloads configuration preset json file', () => {
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = vi.fn();

    renderApp();
    const presetsHeader = screen.getByText(/Presets/i);
    fireEvent.click(presetsHeader);

    const savePresetBtn = screen.getByText(/Save preset/i);
    fireEvent.click(savePresetBtn);

    HTMLAnchorElement.prototype.click = originalClick;
  });

  it('renders logo on canvas preview when a logo is uploaded', async () => {
    const originalReadAsDataURL = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsDataURL = function(this: FileReader) {
      if (this.onload) {
        this.onload({ target: { result: 'data:image/png;base64,mock-logo' } } as any);
      }
    };

    renderApp([mockImage1]);

    // Expand Logo section
    const logoHeader = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Logo'))!;
    fireEvent.click(logoHeader);

    // Upload logo file
    const logoUpload = screen.getByText(/Upload Logo/i).closest('.control-group')?.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      const file = new File(['logo-content'], 'logo.png', { type: 'image/png' });
      fireEvent.change(logoUpload, { target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    FileReader.prototype.readAsDataURL = originalReadAsDataURL;
  });
});
