import { describe, expect, it } from 'vitest';
import { generateQrMatrix, generateQrSvg } from './qr-code.js';

describe('Pure TypeScript QR Code Generator', () => {
  it('generates valid 2D bit matrix with standard finder patterns', () => {
    const matrix = generateQrMatrix('https://goweskit.id/bikes/demo/passport');
    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix[0]?.length).toBe(matrix.length);

    // Top-left finder pattern center (row 3, col 3) is true
    expect(matrix[3]?.[3]).toBe(true);
    // Top-left finder pattern ring (row 1, col 1) is false
    expect(matrix[1]?.[1]).toBe(false);
  });

  it('generates clean SVG markup with configurable colors', () => {
    const svg = generateQrSvg('https://goweskit.id/bikes/10000000/passport', {
      size: 240,
      foreground: '#00ff66',
      background: '#070d18',
    });

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 240 240"');
    expect(svg).toContain('fill="#070d18"');
    expect(svg).toContain('fill="#00ff66"');
    expect(svg).toContain('<path d="M');
  });
});
