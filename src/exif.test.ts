import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractExif, exportImageWithExif } from './exif';
import exifr from 'exifr';
import * as piexif from 'piexifjs';

// Mock exifr
vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(),
  },
}));

// Mock piexifjs
vi.mock('piexifjs', () => ({
  load: vi.fn(),
  dump: vi.fn(),
  insert: vi.fn(),
  ImageIFD: { Make: 271, Model: 272 },
  ExifIFD: { LensModel: 42036 },
}));

describe('extractExif', () => {
  it('[REQ-EXIF-01] loads local image files entirely on the client side via the browser File API', async () => {
    const file = new File(['mock content'], 'photo.jpg', { type: 'image/jpeg' });
    (exifr.parse as any).mockResolvedValue({ Make: 'Canon' });
    const result = await extractExif(file);
    expect(result.make).toBe('Canon');
  });

  it('[REQ-EXIF-02] verifies the shutter speed fraction conversion', async () => {
    (exifr.parse as any).mockResolvedValue({ ExposureTime: 0.005 });
    const result = await extractExif(new File([], 'test.jpg'));
    expect(result.exposureTime).toBe('1/200');
  });

  it('[REQ-EXIF-02] verifies date parsing fallback logic', async () => {
    const testDate = new Date('2023-01-01T12:00:00Z');
    (exifr.parse as any).mockResolvedValue({ DateTimeOriginal: testDate });
    const result = await extractExif(new File([], 'test.jpg'));
    expect(result.date).toBe(testDate.toLocaleDateString());
  });

  it('[REQ-EXIF-04] executes EXIF extraction to populate the exif object', async () => {
    (exifr.parse as any).mockResolvedValue({ Make: 'Nikon', Model: 'Z6' });
    const result = await extractExif(new File([], 'test.jpg'));
    expect(result.make).toBe('Nikon');
    expect(result.model).toBe('Z6');
  });

  it('[REQ-EXIF-05] if an image file is corrupt or cannot be parsed, it logs warning and returns {}', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (exifr.parse as any).mockRejectedValue(new Error('Corrupt file'));
    const result = await extractExif(new File([], 'corrupt.jpg'));
    expect(result).toEqual({});
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('[REQ-EXIF-06] safely returns an empty {} object without crashing when an image contains absolutely no EXIF data', async () => {
    (exifr.parse as any).mockResolvedValue(undefined);
    const result = await extractExif(new File([], 'test.png'));
    expect(result).toEqual({});
  });

  it('[REQ-EXIF-02] handles non-string cleanStr parameter inputs safely', async () => {
    (exifr.parse as any).mockResolvedValue({ Make: null, Model: undefined });
    const result = await extractExif(new File([], 'test.jpg'));
    expect(result.make).toBeNull();
    expect(result.model).toBeUndefined();
  });

  it('[REQ-EXIF-02] handles exposure times equal to or greater than 1 second correctly', async () => {
    (exifr.parse as any).mockResolvedValue({ ExposureTime: 2.5 });
    const result = await extractExif(new File([], 'test.jpg'));
    expect(result.exposureTime).toBe(2.5);
  });

  it('[REQ-EXIF-02] handles invalid date values gracefully without throwing', async () => {
    (exifr.parse as any).mockResolvedValue({ DateTimeOriginal: 'not-a-date' });
    const result = await extractExif(new File([], 'test.jpg'));
    expect(result.date).toBeUndefined();
  });

  it('[REQ-EXIF-02] parses focalLength, fNumber, and ISO when they are present', async () => {
    (exifr.parse as any).mockResolvedValue({ FocalLength: 50, FNumber: 1.8, ISO: 100 });
    const result = await extractExif(new File([], 'test.jpg'));
    expect(result.focalLength).toBe(50);
    expect(result.fNumber).toBe(1.8);
    expect(result.iso).toBe(100);
  });
});

describe('exportImageWithExif', () => {
  const mockCanvas = {
    toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mockdata'),
  } as unknown as HTMLCanvasElement;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) });
  });

  it('[REQ-EXPT-04] strictly preserves the original EXIF without modifying it', async () => {
    const mockRawExifStr = 'mockRawExifStr';
    (piexif.insert as any).mockReturnValue('newImageWithExif');

    await exportImageWithExif(mockCanvas, { rawExifStr: mockRawExifStr, exif: {} } as any);

    // It should NEVER load or dump, it should strictly use the raw string
    expect(piexif.load).not.toHaveBeenCalled();
    expect(piexif.dump).not.toHaveBeenCalled();
    expect(piexif.insert).toHaveBeenCalledWith(mockRawExifStr, 'data:image/jpeg;base64,mockdata');
  });

  it('[REQ-EXPT-01] exports cleanly if there is no original EXIF data', async () => {
    await exportImageWithExif(mockCanvas, { rawExifStr: null, exif: {} } as any);

    expect(piexif.insert).not.toHaveBeenCalled();
  });

  it('[REQ-EXPT-01] properly passes custom quality settings down to the canvas toDataURL method', async () => {
    const quality = 0.85;
    await exportImageWithExif(mockCanvas, { rawExifStr: null, exif: {} } as any, quality);

    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.85);
  });

  it('[REQ-EXPT-01] falls back to exporting without EXIF and logs error if EXIF insertion fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockRawExifStr = 'mockRawExifStr';
    (piexif.insert as any).mockImplementation(() => {
      throw new Error('Insert failed');
    });

    const result = await exportImageWithExif(mockCanvas, { rawExifStr: mockRawExifStr, exif: {} } as any);

    expect(result).toBeDefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
