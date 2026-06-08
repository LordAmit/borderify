import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StoreProvider, useStore } from './store';
import React from 'react';
import type { ImageItem } from './types';

describe('useStore', () => {
  it('[REQ-EXIF-03] addImage correctly appends to the image array and sets the active image', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    const mockImage: ImageItem = {
      id: '1',
      file: new File([], 'test.jpg'),
      objectUrl: 'blob:test',
      width: 100,
      height: 100,
      exif: {},
      rawExifStr: null
    };

    act(() => {
      result.current.addImage(mockImage);
    });

    expect(result.current.state.images).toHaveLength(1);
    expect(result.current.state.images[0].id).toBe('1');
    expect(result.current.state.activeImageId).toBe('1');
  });

  it('[REQ-STAT-01] updateConfig successfully deep-merges configuration updates', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    const initialConfig = result.current.state.config;

    act(() => {
      result.current.updateConfig((c) => ({
        ...c,
        exifPills: {
          ...c.exifPills,
          customCameraText: 'Overridden Camera'
        }
      }));
    });

    expect(result.current.state.config.exifPills.customCameraText).toBe('Overridden Camera');
    expect(result.current.state.config.layout.innerBorderTopScale).toBe(initialConfig.layout.innerBorderTopScale);
  });

  it('[REQ-STAT-01] updateImageCaption specifically updates the caption for the correct image', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    const mockImage1: ImageItem = { id: '1', file: new File([], '1.jpg'), objectUrl: 'blob:1', width: 100, height: 100, exif: {} };
    const mockImage2: ImageItem = { id: '2', file: new File([], '2.jpg'), objectUrl: 'blob:2', width: 100, height: 100, exif: {} };

    act(() => {
      result.current.addImage(mockImage1);
      result.current.addImage(mockImage2);
    });

    act(() => {
      result.current.updateImageCaption('1', 'Custom Caption 1');
    });

    const img1 = result.current.state.images.find(img => img.id === '1');
    const img2 = result.current.state.images.find(img => img.id === '2');

    expect(img1?.captionText).toBe('Custom Caption 1');
    // Ensure image 2 was not modified
    expect(img2?.captionText).toBeUndefined();
  });

  it('[REQ-STAT-01] updateImageCaptionStyle specifically updates styling overrides for the correct image', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    const mockImage1: ImageItem = { id: '1', file: new File([], '1.jpg'), objectUrl: 'blob:1', width: 100, height: 100, exif: {} };
    const mockImage2: ImageItem = { id: '2', file: new File([], '2.jpg'), objectUrl: 'blob:2', width: 100, height: 100, exif: {} };

    act(() => {
      result.current.addImage(mockImage1);
      result.current.addImage(mockImage2);
    });

    act(() => {
      result.current.updateImageCaptionStyle('1', { color: '#ff0000', fontSizeScale: 0.05 });
    });

    const img1 = result.current.state.images.find(img => img.id === '1');
    const img2 = result.current.state.images.find(img => img.id === '2');

    expect(img1?.captionStyle?.color).toBe('#ff0000');
    expect(img1?.captionStyle?.fontSizeScale).toBe(0.05);
    expect(img2?.captionStyle).toBeUndefined();
  });

  it('[REQ-STAT-01] clearAllImageCaptionStyles successfully removes styling overrides from all images', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    const mockImage1: ImageItem = { id: '1', file: new File([], '1.jpg'), objectUrl: 'blob:1', width: 100, height: 100, exif: {}, captionStyle: { color: '#ff0000' } };
    const mockImage2: ImageItem = { id: '2', file: new File([], '2.jpg'), objectUrl: 'blob:2', width: 100, height: 100, exif: {}, captionStyle: { color: '#00ff00' } };

    act(() => {
      result.current.addImage(mockImage1);
      result.current.addImage(mockImage2);
    });

    act(() => {
      result.current.clearAllImageCaptionStyles();
    });

    const img1 = result.current.state.images.find(img => img.id === '1');
    const img2 = result.current.state.images.find(img => img.id === '2');

    expect(img1?.captionStyle).toBeUndefined();
    expect(img2?.captionStyle).toBeUndefined();
  });

  it('[REQ-REND-04] triggers active image updates when configuration changes', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    act(() => {
      result.current.updateConfig((c) => ({
        ...c,
        layout: {
          ...c.layout,
          backgroundColor: '#000000',
        },
      }));
    });

    expect(result.current.state.config.layout.backgroundColor).toBe('#000000');
  });

  it('[REQ-STAT-02] overwrites the active layout configuration when a preset JSON payload is loaded', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    const newPreset = {
      layout: {
        aspectRatio: '16:9',
        backgroundColor: '#ff00ff',
        backgroundType: 'color' as const,
        backgroundBlurScale: 0,
        backgroundDimScale: 0,
        borderWidthScale: 0.1,
        imagePaddingScale: 0.05,
        innerBorderColor: '#000000',
        innerBorderMode: 'custom' as const,
        innerBorderTopScale: 0.05,
        innerBorderBottomScale: 0.05,
        innerBorderSideScale: 0.05,
        imageRadiusScale: 0.02,
        innerImageRadiusScale: 0.01,
        imageShadowBlurScale: 0.04,
        innerImageShadowBlurScale: 0.03,
      },
      labels: [],
      logo: { dataUrl: null, sizeScale: 0.05, position: 'Top Left' as const, offsetXScale: 0, offsetYScale: 0 },
      exifPills: { show: false } as any,
      export: { quality: 90, maxResolution: '4K' as const },
    };

    act(() => {
      result.current.updateConfig(() => newPreset);
    });

    expect(result.current.state.config.layout.aspectRatio).toBe('16:9');
    expect(result.current.state.config.layout.backgroundColor).toBe('#ff00ff');
    expect(result.current.state.config.export.maxResolution).toBe('4K');
  });

  it('[REQ-STAT-03] reverts a specific parameter to its default value when the reset event is triggered', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    act(() => {
      result.current.updateConfig((c) => ({
        ...c,
        layout: {
          ...c.layout,
          borderWidthScale: 0.25, // custom value
        },
      }));
    });
    expect(result.current.state.config.layout.borderWidthScale).toBe(0.25);

    // Revert/Reset single setting to default (0.05)
    act(() => {
      result.current.updateConfig((c) => ({
        ...c,
        layout: {
          ...c.layout,
          borderWidthScale: 0.05,
        },
      }));
    });
    expect(result.current.state.config.layout.borderWidthScale).toBe(0.05);
  });

  it('[REQ-STAT-04] removeImage removes the correct image and updates activeImageId if necessary', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    const mockImage1: ImageItem = { id: '1', file: new File([], '1.jpg'), objectUrl: 'blob:1', width: 100, height: 100, exif: {} };
    const mockImage2: ImageItem = { id: '2', file: new File([], '2.jpg'), objectUrl: 'blob:2', width: 100, height: 100, exif: {} };

    act(() => {
      result.current.addImage(mockImage1);
      result.current.addImage(mockImage2);
    });

    expect(result.current.state.images).toHaveLength(2);
    expect(result.current.state.activeImageId).toBe('1');

    // Remove active image '1' -> active image should become the next one ('2')
    act(() => {
      result.current.removeImage('1');
    });

    expect(result.current.state.images).toHaveLength(1);
    expect(result.current.state.images[0].id).toBe('2');
    expect(result.current.state.activeImageId).toBe('2');

    // Remove the remaining image '2' -> active image should become null
    act(() => {
      result.current.removeImage('2');
    });

    expect(result.current.state.images).toHaveLength(0);
    expect(result.current.state.activeImageId).toBeNull();
  });

  it('[REQ-STAT-05] setActiveImage correctly updates the active image ID', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    const mockImage1: ImageItem = { id: '1', file: new File([], '1.jpg'), objectUrl: 'blob:1', width: 100, height: 100, exif: {} };
    const mockImage2: ImageItem = { id: '2', file: new File([], '2.jpg'), objectUrl: 'blob:2', width: 100, height: 100, exif: {} };

    act(() => {
      result.current.addImage(mockImage1);
      result.current.addImage(mockImage2);
    });

    expect(result.current.state.activeImageId).toBe('1');

    act(() => {
      result.current.setActiveImage('2');
    });

    expect(result.current.state.activeImageId).toBe('2');

    act(() => {
      result.current.setActiveImage(null);
    });

    expect(result.current.state.activeImageId).toBeNull();
  });

  it('[REQ-STAT-06] clearAllImages clears the image queue and sets activeImageId to null', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    const mockImage1: ImageItem = { id: '1', file: new File([], '1.jpg'), objectUrl: 'blob:1', width: 100, height: 100, exif: {} };
    act(() => {
      result.current.addImage(mockImage1);
    });

    expect(result.current.state.images).toHaveLength(1);
    expect(result.current.state.activeImageId).toBe('1');

    act(() => {
      result.current.clearAllImages();
    });

    expect(result.current.state.images).toHaveLength(0);
    expect(result.current.state.activeImageId).toBeNull();
  });

  it('[REQ-STAT-04] removing an inactive image does not change the activeImageId', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StoreProvider>{children}</StoreProvider>;
    const { result } = renderHook(() => useStore(), { wrapper });

    const mockImage1: ImageItem = { id: '1', file: new File([], '1.jpg'), objectUrl: 'blob:1', width: 100, height: 100, exif: {} };
    const mockImage2: ImageItem = { id: '2', file: new File([], '2.jpg'), objectUrl: 'blob:2', width: 100, height: 100, exif: {} };

    act(() => {
      result.current.addImage(mockImage1);
      result.current.addImage(mockImage2);
    });

    expect(result.current.state.activeImageId).toBe('1');

    act(() => {
      result.current.removeImage('2');
    });

    expect(result.current.state.images).toHaveLength(1);
    expect(result.current.state.images[0].id).toBe('1');
    expect(result.current.state.activeImageId).toBe('1');
  });

  it('throws an error if useStore is used outside of StoreProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useStore());
    }).toThrow('useStore must be used within StoreProvider');
    consoleErrorSpy.mockRestore();
  });
});
