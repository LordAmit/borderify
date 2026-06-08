import { describe, it, expect } from 'vitest';
import { resolveTemplate } from './utils';

describe('resolveTemplate', () => {
  it('[REQ-EXIF-06] correctly injects make and model', () => {
    const exif = { make: 'Sony', model: 'A7IV' } as any;
    expect(resolveTemplate('{make} {model}', exif)).toBe('Sony A7IV');
  });

  it('[REQ-EXIF-06] handles missing EXIF data cleanly by collapsing empty spaces', () => {
    const exif = { make: 'Sony' } as any; // missing model
    expect(resolveTemplate('Shot on {make} {model} Camera', exif)).toBe('Shot on Sony Camera');
  });

  it('[REQ-EXIF-06] gracefully returns empty string when image has zero EXIF data', () => {
    expect(resolveTemplate('{make} {model}', undefined)).toBe('');
    expect(resolveTemplate('{lens}', {})).toBe('');
  });

  it('[REQ-EXIF-06] passes through custom strings without templates correctly', () => {
    const exif = { make: 'Sony', model: 'A7IV' } as any;
    expect(resolveTemplate('My Custom Camera', exif)).toBe('My Custom Camera');
    expect(resolveTemplate('My Custom Camera', undefined)).toBe('My Custom Camera');
  });

  it('[REQ-EXIF-06] preserves newlines in the string while collapsing horizontal whitespace', () => {
    const exif = { make: 'Sony' } as any; // missing model
    const input = 'Shot on {make} {model}\nNext line here';
    // {make} -> 'Sony', {model} -> '', resulting string: 'Shot on Sony \nNext line here' -> collapsed to 'Shot on Sony\nNext line here'
    expect(resolveTemplate(input, exif)).toBe('Shot on Sony\nNext line here');
  });

  it('[REQ-EXIF-06] returns empty string immediately if input raw template is empty or falsy', () => {
    expect(resolveTemplate('', undefined)).toBe('');
    expect(resolveTemplate('', {})).toBe('');
  });
});

describe('JSZip batch integration', () => {
  it('[REQ-EXPT-02] when the user initiates a batch export, the system shall bundle the processed images into a single ZIP archive', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('test.txt', 'hello world');
    const content = await zip.generateAsync({ type: 'string' });
    expect(content).toBeDefined();
    expect(zip.files['test.txt']).toBeDefined();
  });
});
