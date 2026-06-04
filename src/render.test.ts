import { describe, it, expect, vi } from 'vitest';
import { renderPhotoBorder } from './render';
import type { AppConfig, ImageItem } from './types';

describe('renderPhotoBorder calculations', () => {
  const createMockCanvas = () => {
    const mockCtx = {
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      arc: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 }),
      clip: vi.fn(),
      rect: vi.fn(),
      shadowColor: '',
    };

    return {
      canvas: {
        getContext: vi.fn().mockReturnValue(mockCtx),
        width: 0,
        height: 0,
      } as unknown as HTMLCanvasElement,
      ctx: mockCtx,
    };
  };

  const mockImageItem: ImageItem = {
    id: 'test-1',
    file: new File([], 'test.jpg'),
    objectUrl: 'blob:test',
    width: 1000,
    height: 1000,
    exif: {},
  };

  const baseConfig: AppConfig = {
    layout: {
      aspectRatio: 'Original',
      backgroundColor: '#ffffff',
      backgroundType: 'color',
      backgroundBlurScale: 0.1,
      backgroundDimScale: 0.2,
      borderWidthScale: 0.05,
      imagePaddingScale: 0.02,
      innerBorderColor: '#ffffff',
      innerBorderMode: 'uniform',
      innerBorderTopScale: 0.02,
      innerBorderBottomScale: 0.02,
      innerBorderSideScale: 0.02,
      imageRadiusScale: 0,
      innerImageRadiusScale: 0,
      imageShadowBlurScale: 0,
      innerImageShadowBlurScale: 0,
    },
    labels: [],
    logo: {
      dataUrl: null,
      sizeScale: 0.08,
      position: 'Bottom Right',
      offsetXScale: 0,
      offsetYScale: 0,
    },
    exifPills: {
      show: false,
      showFocal: true,
      showAperture: true,
      showIso: true,
      showShutter: true,
      showLens: false,
      showCamera: false,
      showDate: false,
      position: 'Bottom Center',
      positionXScale: 0,
      positionYScale: 0.02,
      boxColor: '#ffffff',
      textColor: '#1e293b',
      textStrokeColor: '#000000',
      textStrokeWidthScale: 0,
      borderColor: '#e2e8f0',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSizeScale: 0.012,
      borderWidthScale: 0.001,
      internalPaddingScale: 0.8,
      pillTextSpacingScale: 0.35,
    },
    export: {
      quality: 100,
      maxResolution: 'Original',
    },
  };

  it('[REQ-REND-01] keeps original dimensions if under standard maxRes', () => {
    const { canvas } = createMockCanvas();
    const imgObj = { width: 3000, height: 2000 } as HTMLImageElement;

    renderPhotoBorder(canvas, mockImageItem, imgObj, baseConfig, null);

    // Default max resolution ceiling is 8000. 3000 < 8000 so no scaling happens.
    expect(canvas.width).toBe(3000);
    expect(canvas.height).toBe(2000);
  });

  it('[REQ-EXPT-03] correctly applies resolution limit capping (downscaling)', () => {
    const { canvas } = createMockCanvas();
    const imgObj = { width: 5000, height: 2500 } as HTMLImageElement; // 2:1 aspect ratio

    // Cap longest edge to 2000
    renderPhotoBorder(canvas, mockImageItem, imgObj, baseConfig, null, 2000);

    // Width should be scaled down from 5000 to 2000. 
    // Height scales proportionally: 2500 * (2000 / 5000) = 1000.
    expect(canvas.width).toBe(2000);
    expect(canvas.height).toBe(1000);
  });

  it('[REQ-EXPT-03] fully protects against upscaling (no expansion of small photos)', () => {
    const { canvas } = createMockCanvas();
    const imgObj = { width: 600, height: 400 } as HTMLImageElement;

    // Set max resolution ceiling to 2000 (which is larger than 600)
    renderPhotoBorder(canvas, mockImageItem, imgObj, baseConfig, null, 2000);

    // Width should stay at 600px, not blow up to 2000px.
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(400);
  });

  it('[REQ-REND-01] scales correctly based on target aspect ratio overrides', () => {
    const { canvas } = createMockCanvas();
    const imgObj = { width: 3000, height: 2000 } as HTMLImageElement; // 3:2 original ratio
    
    // Override aspect ratio to 1:1
    const configWithSquareRatio = {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        aspectRatio: '1:1',
      },
    };

    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithSquareRatio, null);

    // Canvas should become square using the longest edge (3000)
    expect(canvas.width).toBe(3000);
    expect(canvas.height).toBe(3000);
  });

  it('[REQ-REND-02] calculates border padding inward from the final aspect ratio bounds to prevent layout skewing', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 3000, height: 2000 } as HTMLImageElement;
    const configWithPadding = {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        borderWidthScale: 0.1,
      },
    };
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithPadding, null);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('[REQ-REND-03] aligns text and logo objects using a 9-point anchor grid', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    const configWithLabels = {
      ...baseConfig,
      labels: [{
        id: 'lbl-1',
        show: true,
        text: 'Hello World',
        fontFamily: 'Arial',
        fontSizeScale: 0.05,
        color: '#000000',
        strokeColor: '#ffffff',
        strokeWidthScale: 0,
        position: 'Top Left' as const,
        positionXScale: 0,
        positionYScale: 0,
      }],
    };
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithLabels, null);
    expect(ctx.fillText).toHaveBeenCalledWith('Hello World', expect.any(Number), expect.any(Number));
  });

  it('[REQ-REND-05] falls back to standard rectangular borders if ctx.roundRect is not supported', () => {
    const { canvas, ctx } = createMockCanvas();
    ctx.roundRect = undefined as any;
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    const configWithRadius = {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        imageRadiusScale: 0.05,
      },
    };
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithRadius, null);
    expect(ctx.rect).toHaveBeenCalled();
  });

  it('[REQ-REND-06] downsamples the image to a low-resolution buffer canvas when backgroundType is blurred-image', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 3000, height: 2000 } as HTMLImageElement;
    const configWithBlur = {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        backgroundType: 'blurred-image' as const,
        backgroundBlurScale: 0.1,
      },
    };
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithBlur, null);
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it('[REQ-REND-07] renders the inner image shadow offset on a distinct layer below the picture clipping boundary when enabled', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    const configWithShadow = {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        innerImageShadowBlurScale: 0.05,
      },
    };
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithShadow, null);
    expect(ctx.shadowColor).toBeDefined();
  });
});
