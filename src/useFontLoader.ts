import { useEffect, useRef } from 'react';
import type { AppConfig, ImageItem } from './types';

/** How long the font name must stay unchanged before a stylesheet is requested. */
export const FONT_REQUEST_DELAY_MS = 500;

const LINK_ID_PREFIX = 'dynamic-font-';

const isWebFontName = (family: string) => family.length > 0 && !family.includes('sans-serif');
const cleanName = (family: string) => family.replace(/"/g, '').trim();

// Fonts uploaded by the user arrive as base64 and are injected locally; no request is made.
const injectLocalFont = (family: string, dataUrl: string, onReady: () => void) => {
  const id = `custom-local-font-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.innerHTML = `
    @font-face {
      font-family: '${family}';
      src: url('${dataUrl}');
    }
  `;
  document.head.appendChild(style);
  if ('fonts' in document) {
    document.fonts.load(`16px "${family}"`).then(onReady);
  }
};

const createFontLink = (font: string, onReady: () => void) => {
  const link = document.createElement('link');
  link.id = `${LINK_ID_PREFIX}${font.replace(/\s+/g, '-')}`;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;600&display=swap`;
  // When loaded, trigger a re-render so the canvas picks the font up
  link.onload = onReady;
  document.head.appendChild(link);
  if ('fonts' in document) {
    document.fonts.load(`16px "${font}"`).catch(() => { });
  }
  return link;
};

/**
 * Loads every font the configuration refers to. Uploaded fonts are injected at once;
 * Google Fonts names are requested after a short delay so that typing a name does not
 * fire one request per keystroke, and links for abandoned partial names are removed.
 */
// [REQ-UI-16] Debounced web-font requests; superseded partial names never reach the network or are cleaned up
export const useFontLoader = (config: AppConfig, images: ImageItem[], onFontReady: () => void) => {
  const linksRef = useRef(new Map<string, HTMLLinkElement>());

  useEffect(() => {
    const wanted = new Set<string>();
    const collect = (family?: string, dataUrl?: string) => {
      if (!family) return;
      if (dataUrl) {
        injectLocalFont(family, dataUrl, onFontReady);
      } else if (isWebFontName(family)) {
        const name = cleanName(family);
        if (name) wanted.add(name);
      }
    };

    config.labels.forEach((label) => collect(label.fontFamily, label.customFontDataUrl));
    images.forEach((img) => collect(img.captionStyle?.fontFamily, img.captionStyle?.customFontDataUrl));
    collect(config.exifPills.fontFamily);

    const timer = window.setTimeout(() => {
      const links = linksRef.current;
      for (const [name, link] of links) {
        if (!wanted.has(name)) {
          link.remove();
          links.delete(name);
        }
      }
      wanted.forEach((font) => {
        if (!links.has(font)) links.set(font, createFontLink(font, onFontReady));
      });
    }, FONT_REQUEST_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [config.labels, config.exifPills.fontFamily, images, onFontReady]);
};
