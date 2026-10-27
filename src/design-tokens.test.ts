// Static checks for the design-token requirement: contrast of the token pairs the UI relies on,
// and no literal colors, radii or type sizes outside the :root block or inside component markup.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => fs.readFileSync(path.join(srcDir, rel), 'utf-8');

const css = read('index.css');
const rootMatch = css.match(/:root \{([\s\S]*?)\n\}/);
const rootBlock = rootMatch ? rootMatch[1] : '';
const outsideRoot = css.replace(/:root \{[\s\S]*?\n\}/, '');
const tokens: Record<string, string> = Object.fromEntries(
  Array.from(rootBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)).map((m) => [m[1], m[2].trim()])
);

type Rgb = [number, number, number];
type Rgba = [number, number, number, number];

const parseColor = (value: string): Rgba => {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgba = value.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const [r, g, b, a = '1'] = rgba[1].split(',').map((s) => s.trim());
    return [Number(r), Number(g), Number(b), Number(a)];
  }
  throw new Error(`Unparseable color token value: ${value}`);
};

const over = (fg: Rgba, bg: Rgb): Rgb => [0, 1, 2].map((i) => Math.round(fg[i] * fg[3] + bg[i] * (1 - fg[3]))) as Rgb;

const luminance = ([r, g, b]: Rgb) => {
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
};

const contrast = (fg: Rgb, bg: Rgb) => {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Resolve a token to an opaque RGB by compositing translucent layers onto the page background. */
const resolve = (name: string, ...under: string[]): Rgb => {
  const page = parseColor(tokens['bg-color']);
  let base: Rgb = [page[0], page[1], page[2]];
  for (const layer of under) base = over(parseColor(tokens[layer]), base);
  return over(parseColor(tokens[name]), base);
};

const listTsx = (dir: string, prefix = ''): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return listTsx(path.join(dir, entry.name), `${prefix}${entry.name}/`);
    return /\.tsx$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name) ? [`${prefix}${entry.name}`] : [];
  });

describe('[REQ-UI-17] design tokens and contrast', () => {
  it('[REQ-UI-17] every text color pair the UI uses meets 4.5:1', () => {
    expect(Object.keys(tokens).length).toBeGreaterThan(20);
    const pairs: [string, Rgb, Rgb][] = [
      ['primary text on page', resolve('text-primary'), resolve('bg-color')],
      ['secondary text on page', resolve('text-secondary'), resolve('bg-color')],
      ['secondary text on sidebar surface', resolve('text-secondary'), resolve('surface-color')],
      ['white on filled accent button', resolve('on-accent'), resolve('accent-strong')],
      ['white on hovered accent button', resolve('on-accent'), resolve('accent-strong-hover')],
      ['accent text on page', resolve('accent-text'), resolve('bg-color')],
      ['accent text on accent tint', resolve('accent-text'), resolve('accent-tint', 'surface-color')],
      ['accent text on preset button wash', resolve('accent-text'), resolve('accent-wash', 'surface-color')],
      ['danger text on page', resolve('danger-text'), resolve('bg-color')],
      ['danger text on danger tint', resolve('danger-text'), resolve('danger-tint')],
      ['warning text on warning tint', resolve('warning-text'), resolve('warning-tint', 'surface-color')],
      ['secondary text on raised chip', resolve('text-secondary'), resolve('surface-raised', 'surface-color')],
    ];
    const failures = pairs
      .map(([name, fg, bg]) => [name, contrast(fg, bg)] as const)
      .filter(([, ratio]) => ratio < 4.5)
      .map(([name, ratio]) => `${name}: ${ratio.toFixed(2)}:1`);
    expect(failures).toEqual([]);
  });

  it('[REQ-UI-17] colors, radii and type sizes are tokens: no literals outside :root', () => {
    const literalColors = outsideRoot.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|\bwhite\b(?!-space)|\bblack\b/g) ?? [];
    expect(literalColors, 'literal colors outside :root').toEqual([]);
    const literalSizes = outsideRoot.match(/font-size:\s*[0-9.]+px/g) ?? [];
    expect(literalSizes, 'literal font sizes outside :root').toEqual([]);
    const literalRadii = outsideRoot.match(/border-radius:\s*[0-9.]+px/g) ?? [];
    expect(literalRadii, 'literal radii outside :root').toEqual([]);
  });

  it('[REQ-UI-17] component markup carries no inline styles except computed layout values', () => {
    // Only values that depend on runtime data may stay inline; everything else is a class.
    const allowed: Record<string, number> = { 'sidebar/ExportSection.tsx': 1 }; // progress bar width
    const offenders: string[] = [];
    for (const file of listTsx(srcDir)) {
      const count = (read(file).match(/style=\{\{/g) ?? []).length;
      if (count > (allowed[file] ?? 0)) offenders.push(`${file}: ${count} inline style block(s)`);
      // Color literals inside the inline blocks that remain (config data such as preset colors is not styling)
      for (const block of read(file).match(/style=\{\{[^}]*\}\}/g) ?? []) {
        if (/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(block)) offenders.push(`${file}: color literal in inline style ${block.slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
