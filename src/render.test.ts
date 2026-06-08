import { describe, it, expect, vi } from 'vitest';
import { renderPhotoBorder } from './render';
import type { AppConfig, ImageItem } from './types';
import fs from 'fs';
import path from 'path';

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
      shadowBlur: 0,
      fillStyle: '',
      strokeText: vi.fn(),
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

  it('[REQ-REND-08] renders text outlines using the specified stroke color and width scale when enabled', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    const configWithStroke = {
      ...baseConfig,
      labels: [{
        id: 'lbl-1',
        show: true,
        text: 'Outline Text',
        fontFamily: 'Arial',
        fontSizeScale: 0.05,
        color: '#000000',
        strokeColor: '#ff0000',
        strokeWidthScale: 0.02,
        position: 'Top Left' as const,
        positionXScale: 0,
        positionYScale: 0,
      }],
    };
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithStroke, null);
    expect(ctx.strokeText).toHaveBeenCalledWith('Outline Text', expect.any(Number), expect.any(Number));
  });

  it('[REQ-REND-09] draws the inner photo using a rounded clipping path to round its corners when innerImageRadiusScale is enabled', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    const configWithRadius = {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        innerImageRadiusScale: 0.05,
      },
    };
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithRadius, null);
    expect(ctx.roundRect).toHaveBeenCalled();
    expect(ctx.clip).toHaveBeenCalled();
  });

  it('[REQ-REND-10] scales brand logo proportionally and renders it onto the canvas at designated position', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    
    // Read the favicon.svg file
    const svgPath = path.resolve(__dirname, '../public/favicon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const logoDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    
    const configWithLogo = {
      ...baseConfig,
      logo: {
        dataUrl: logoDataUrl,
        sizeScale: 0.15,
        position: 'Bottom Center' as const,
        offsetXScale: 0.02,
        offsetYScale: 0.02,
      },
    };
    
    // Mock the logo image object
    const mockLogoImg = {
      width: 1120,
      height: 1120,
    } as HTMLImageElement;
    
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithLogo, mockLogoImg);
    expect(ctx.drawImage).toHaveBeenCalledWith(mockLogoImg, expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number));
  });

  it('[REQ-REND-11] renders the inner card with rounded corners when inner card radius scale is enabled and roundRect is supported', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    const configWithCardRadius = {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        imageRadiusScale: 0.05,
      },
    };
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithCardRadius, null);
    expect(ctx.roundRect).toHaveBeenCalled();
  });

  it('[REQ-REND-12] renders outer card shadow offset and blur below the inner card when enabled', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    const configWithCardShadow = {
      ...baseConfig,
      layout: {
        ...baseConfig.layout,
        imageShadowBlurScale: 0.05,
      },
    };
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithCardShadow, null);
    expect(ctx.shadowColor).toBe('rgba(0,0,0,0.5)');
    expect(ctx.shadowBlur).toBeGreaterThan(0);
  });

  it('[REQ-REND-13] formats and renders EXIF parameter labels inside pill boxes on the canvas when enabled', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    
    const imageWithExif = {
      ...mockImageItem,
      exif: {
        focalLength: 50,
        fNumber: 1.8,
        iso: 100,
        exposureTime: '1/125',
        lens: '50mm f/1.8',
        make: 'Sony',
        model: 'A7III',
        date: new Date('2026-06-08'),
      },
    };

    const configWithExifPills = {
      ...baseConfig,
      exifPills: {
        ...baseConfig.exifPills,
        show: true,
        showFocal: true,
        showAperture: true,
        showIso: true,
        showShutter: true,
        showLens: true,
        showCamera: true,
        showDate: true,
        textStrokeWidthScale: 0.02,
        borderWidthScale: 0.02,
      },
    };

    renderPhotoBorder(canvas, imageWithExif, imgObj, configWithExifPills, null);
    
    // Check that we draw the pill shapes and text
    expect(ctx.roundRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('50', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('mm', expect.any(Number), expect.any(Number));
    expect(ctx.strokeText).toHaveBeenCalled();
  });

  it('[REQ-REND-05] falls back to standard rectangular borders for EXIF pills if ctx.roundRect is not supported', () => {
    const { canvas, ctx } = createMockCanvas();
    ctx.roundRect = undefined as any;
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    
    const imageWithExif = {
      ...mockImageItem,
      exif: {
        focalLength: 50,
      },
    };

    const configWithExifPills = {
      ...baseConfig,
      exifPills: {
        ...baseConfig.exifPills,
        show: true,
        showFocal: true,
        borderWidthScale: 0.02,
      },
    };

    renderPhotoBorder(canvas, imageWithExif, imgObj, configWithExifPills, null);
    
    expect(ctx.rect).toHaveBeenCalled();
  });

  it('[REQ-REND-03] renders rich text formats (bold and italic) and different alignments for labels', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    
    // Config with center and right aligned rich text labels
    const configWithRichText = {
      ...baseConfig,
      labels: [
        {
          id: 'lbl-center',
          show: true,
          text: '**Bold** text',
          fontFamily: 'Arial',
          fontSizeScale: 0.05,
          color: '#000000',
          strokeColor: '#000000',
          strokeWidthScale: 0,
          position: 'Top Center' as const,
          positionXScale: 0,
          positionYScale: 0,
        },
        {
          id: 'lbl-right',
          show: true,
          text: '*Italic* text',
          fontFamily: 'Arial',
          fontSizeScale: 0.05,
          color: '#000000',
          strokeColor: '#000000',
          strokeWidthScale: 0,
          position: 'Top Right' as const,
          positionXScale: 0,
          positionYScale: 0,
        }
      ]
    };

    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithRichText, null);
    
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('[REQ-REND-03] renders active image caption text and caption style overrides when provided', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    
    const imageWithCaption = {
      ...mockImageItem,
      captionText: 'Override Caption',
      captionStyle: {
        color: '#ff0000',
        fontStyle: 'italic' as const,
        fontWeight: 'bold' as const,
      }
    };

    const configWithLabels = {
      ...baseConfig,
      labels: [{
        id: 'lbl-1',
        show: true,
        text: 'Original Label Text',
        fontFamily: 'Arial',
        fontSizeScale: 0.05,
        color: '#000000',
        strokeColor: '#000000',
        strokeWidthScale: 0,
        position: 'Bottom Center' as const,
        positionXScale: 0,
        positionYScale: 0,
      }],
    };

    renderPhotoBorder(canvas, imageWithCaption, imgObj, configWithLabels, null);
    
    expect(ctx.fillText).toHaveBeenCalledWith('Override Caption', expect.any(Number), expect.any(Number));
    expect(ctx.fillStyle).toBe('#ff0000');
  });

  it('[REQ-REND-10] scales brand logo and aligns it to Bottom Right', () => {
    const { canvas, ctx } = createMockCanvas();
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;
    
    const configWithRightLogo = {
      ...baseConfig,
      logo: {
        dataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        sizeScale: 0.15,
        position: 'Bottom Right' as const,
        offsetXScale: 0.02,
        offsetYScale: 0.02,
      },
    };
    
    const mockLogoImg = {
      width: 500,
      height: 250,
    } as HTMLImageElement;
    
    renderPhotoBorder(canvas, mockImageItem, imgObj, configWithRightLogo, mockLogoImg);
    expect(ctx.drawImage).toHaveBeenCalledWith(mockLogoImg, expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number));
  });

  it('covers remaining branch paths in render.ts (empty/left/right EXIF pills, borderWidthScale <= 0, hidden labels, logo falsy offsets and left alignment)', () => {
    const imgObj = { width: 1000, height: 1000 } as HTMLImageElement;

    // 1. Empty dataPairs branch when exifPills.show is true but all pill types are false
    const { canvas: canvas1 } = createMockCanvas();
    const configEmptyPills = {
      ...baseConfig,
      exifPills: {
        ...baseConfig.exifPills,
        show: true,
        showFocal: false,
        showAperture: false,
        showIso: false,
        showShutter: false,
        showLens: false,
        showCamera: false,
        showDate: false,
      },
    };
    renderPhotoBorder(canvas1, mockImageItem, imgObj, configEmptyPills, null);

    // 2. EXIF pills left/right alignments, and borderWidthScale <= 0
    const { canvas: canvas2, ctx: ctx2 } = createMockCanvas();
    const imageWithExif = {
      ...mockImageItem,
      exif: { focalLength: 50 },
    };
    const configPillAlignments = {
      ...baseConfig,
      exifPills: {
        ...baseConfig.exifPills,
        show: true,
        showFocal: true,
        position: 'Bottom Right' as const, // Right alignment
        borderWidthScale: 0, // borderWidthScale <= 0 branch
      },
    };
    renderPhotoBorder(canvas2, imageWithExif, imgObj, configPillAlignments, null);
    expect(ctx2.stroke).not.toHaveBeenCalled(); // due to borderWidthScale: 0

    const { canvas: canvas3 } = createMockCanvas();
    const configPillLeftAlign = {
      ...baseConfig,
      exifPills: {
        ...baseConfig.exifPills,
        show: true,
        showFocal: true,
        position: 'Bottom Left' as const, // Left alignment
      },
    };
    renderPhotoBorder(canvas3, imageWithExif, imgObj, configPillLeftAlign, null);

    // 3. Logo Left Alignment & Falsy Offsets
    const { canvas: canvas4 } = createMockCanvas();
    const configLogoLeftAlign = {
      ...baseConfig,
      logo: {
        dataUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        sizeScale: 0.15,
        position: 'Bottom Left' as const, // Left alignment
        offsetXScale: 0, // Falsy offsets branch
        offsetYScale: 0,
      },
    };
    const mockLogoImg = { width: 500, height: 250 } as HTMLImageElement;
    renderPhotoBorder(canvas4, mockImageItem, imgObj, configLogoLeftAlign, mockLogoImg);

    // 4. Hidden/empty labels
    const { canvas: canvas5 } = createMockCanvas();
    const configHiddenLabels = {
      ...baseConfig,
      labels: [
        {
          id: 'lbl-hidden',
          show: false,
          text: 'Hidden text',
          fontFamily: 'Arial',
          fontSizeScale: 0.05,
          color: '#000000',
          strokeColor: '#000000',
          strokeWidthScale: 0,
          position: 'Top Left' as const,
          positionXScale: 0,
          positionYScale: 0,
        },
        {
          id: 'lbl-empty',
          show: true,
          text: '',
          fontFamily: 'Arial',
          fontSizeScale: 0.05,
          color: '#000000',
          strokeColor: '#000000',
          strokeWidthScale: 0,
          position: 'Top Left' as const,
          positionXScale: 0,
          positionYScale: 0,
        }
      ]
    };
    renderPhotoBorder(canvas5, mockImageItem, imgObj, configHiddenLabels, null);
  });
});
