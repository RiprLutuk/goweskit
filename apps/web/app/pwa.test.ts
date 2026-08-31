import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PWA configuration and assets', () => {
  it('has a valid web manifest with standalone display and shortcuts', () => {
    const manifestPath = resolve(__dirname, '../public/manifest.webmanifest');
    expect(existsSync(manifestPath)).toBe(true);

    const manifestContent = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifestContent.name).toBe(
      'GowesKit — Cycling Knowledge & Workshop',
    );
    expect(manifestContent.short_name).toBe('GowesKit');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.orientation).toBe('portrait-primary');
    expect(manifestContent.theme_color).toBe('#17202A');
    expect(manifestContent.background_color).toBe('#FFFDF7');
    expect(manifestContent.icons.length).toBeGreaterThanOrEqual(2);
    expect(manifestContent.shortcuts.length).toBeGreaterThanOrEqual(4);
  });

  it('has a service worker script with precache and cache fallbacks', () => {
    const swPath = resolve(__dirname, '../public/sw.js');
    expect(existsSync(swPath)).toBe(true);

    const swContent = readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('goweskit-static-');
    expect(swContent).toContain('PRECACHE_URLS');
    expect(swContent).toContain("addEventListener('install'");
    expect(swContent).toContain("addEventListener('activate'");
    expect(swContent).toContain("addEventListener('fetch'");
  });

  it('has app icons in public directory', () => {
    const icon192 = resolve(__dirname, '../public/icons/icon-192.svg');
    const iconMaster = resolve(__dirname, '../public/icons/icon.svg');
    const favicon = resolve(__dirname, '../public/favicon.svg');

    expect(existsSync(icon192)).toBe(true);
    expect(existsSync(iconMaster)).toBe(true);
    expect(existsSync(favicon)).toBe(true);
  });
});
