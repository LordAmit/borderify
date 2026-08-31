// Guards for the constitution's architectural principles ([ARC-NN]).
// These are static checks over the source tree: they fail when code is added that
// breaks a system-level obligation, independent of any single feature.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(srcDir, '..');
const read = (rel: string) => fs.readFileSync(path.join(projectRoot, rel), 'utf-8');
const implFiles = fs
  .readdirSync(srcDir)
  .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith('.d.ts'));
// Remove block comments and full-line // comments so tags and notes cannot trip the checks.
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('Architectural principles (constitution §2)', () => {
  it('[ARC-01] render.ts draws only through CanvasRenderingContext2D, with no DOM or React dependency', () => {
    const render = stripComments(read('src/render.ts'));
    expect(render).not.toMatch(/from ['"]react/);
    expect(render).not.toMatch(/\bdocument\./);
    expect(render).not.toMatch(/\bwindow\./);
    expect(render).toMatch(/canvas\.getContext\('2d'\)/);
    // The export path reads pixels from the canvas, never from the DOM preview.
    expect(stripComments(read('src/exif.ts'))).toMatch(/canvas\.toDataURL\('image\/jpeg'/);
  });

  it('[ARC-02] application modules make no remote requests for image data and contain no analytics or tracking calls', () => {
    // The only remote hosts a module may name: web-font stylesheets and the credit links in the header.
    // Analytics is permitted only as an anonymous page-level snippet in index.html, never inside modules.
    const ALLOWED_REMOTE_HOSTS = ['fonts.googleapis.com', 'github.com'];
    const TELEMETRY_OR_NETWORK = /\b(XMLHttpRequest|sendBeacon|WebSocket|gtag|dataLayer|analytics|posthog|sentry|mixpanel|plausible)\b/;
    for (const f of implFiles) {
      const src = stripComments(read(`src/${f}`));
      expect(src, `${f} uses a network or telemetry API`).not.toMatch(TELEMETRY_OR_NETWORK);
      for (const m of src.matchAll(/https?:\/\/([^/'"`\s]+)/g)) {
        expect(ALLOWED_REMOTE_HOSTS, `${f} references remote host ${m[1]}`).toContain(m[1]);
      }
      for (const m of src.matchAll(/\bfetch\(([^)]*)\)/g)) {
        expect(m[1], `${f}: fetch() must only dereference local data:/blob: URLs`).not.toMatch(/https?:/);
      }
    }
  });

  it('[ARC-02] index.html loads only the app entry and, at most, an anonymous page-analytics script', () => {
    const html = read('index.html');
    const ALLOWED_SCRIPT_HOSTS = ['www.googletagmanager.com', 'www.google-analytics.com'];
    for (const m of html.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/g)) {
      const src = m[1];
      if (!/^https?:/.test(src)) continue; // local entry point (/src/main.tsx)
      const host = new URL(src).host;
      expect(ALLOWED_SCRIPT_HOSTS, `external script from ${host}`).toContain(host);
    }
    // Page analytics must stay anonymous: inline scripts may not hand user identity or image data to the tracker.
    for (const m of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      expect(m[1], 'inline script passes identity or image data to analytics').not.toMatch(/user_id|userId|user_properties|exif/i);
    }
  });

  it('[ARC-03] app state lives in one React Context (store.tsx) and every component reads it through useStore', () => {
    for (const f of implFiles) {
      if (f === 'store.tsx') continue;
      expect(stripComments(read(`src/${f}`)), `${f} creates its own context`).not.toMatch(/createContext\(/);
    }
    expect(read('src/store.tsx')).toMatch(/createContext</);
    for (const c of ['App.tsx', 'CanvasPreview.tsx', 'SidebarControls.tsx']) {
      expect(read(`src/${c}`), `${c} must read state via useStore`).toMatch(/import \{[^}]*\buseStore\b[^}]*\} from '\.\/store'/);
    }
  });
});
