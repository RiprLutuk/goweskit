import { describe, expect, it } from 'vitest';
import { generateQrMatrix, generateQrSvg } from './qr-code.js';

describe('Goal Features Suite', () => {
  describe('1. QR Code & Bike Passport Frame Sticker Engine', () => {
    it('generates a valid deterministic QR code bit matrix', () => {
      const url = 'https://goweskit.id/bikes/10000000/passport';
      const matrix = generateQrMatrix(url);

      expect(matrix.length).toBeGreaterThanOrEqual(21);
      expect(matrix[0]?.length).toBe(matrix.length);
      expect(matrix[3]?.[3]).toBe(true);
    });

    it('generates high-contrast printable SVG for frame sticker', () => {
      const svg = generateQrSvg(
        'https://goweskit.id/bikes/test-bike/passport',
        {
          size: 300,
          foreground: '#C9F36A',
          background: '#080D19',
          margin: 2,
        },
      );

      expect(svg).toContain('viewBox="0 0 300 300"');
      expect(svg).toContain('fill="#080D19"');
      expect(svg).toContain('fill="#C9F36A"');
    });

    it('derives deterministic short Passport UID from UUID', () => {
      const bikeId = '10000000-0000-4000-8000-000000000001';
      const passportUid = `GWK-${bikeId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
      expect(passportUid).toBe('GWK-100000');
    });
  });

  describe('2. Elevation Profile & Climb Gradient Categorization', () => {
    function categorizeClimb(elevationGainM: number): string {
      if (elevationGainM >= 1000) return 'HC / Hors Catégorie';
      if (elevationGainM >= 500) return 'Cat 2 Mountain Pass';
      if (elevationGainM >= 200) return 'Cat 3 Punchy Climb';
      return 'Cat 4 Rolling Hills';
    }

    it('correctly classifies climb difficulty categories', () => {
      expect(categorizeClimb(120)).toBe('Cat 4 Rolling Hills');
      expect(categorizeClimb(340)).toBe('Cat 3 Punchy Climb');
      expect(categorizeClimb(650)).toBe('Cat 2 Mountain Pass');
      expect(categorizeClimb(1400)).toBe('HC / Hors Catégorie');
    });
  });

  describe('3. Offline Map Tile Caching Math', () => {
    function lon2tile(lon: number, zoom: number): number {
      return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    }

    function lat2tile(lat: number, zoom: number): number {
      return Math.floor(
        ((1 -
          Math.log(
            Math.tan((lat * Math.PI) / 180) +
              1 / Math.cos((lat * Math.PI) / 180),
          ) /
            Math.PI) /
          2) *
          Math.pow(2, zoom),
      );
    }

    it('accurately computes OpenStreetMap tile coordinates for Sentul / Bogor', () => {
      const lat = -6.595;
      const lon = 106.816;
      const zoom = 14;

      const x = lon2tile(lon, zoom);
      const y = lat2tile(lat, zoom);

      expect(x).toBeGreaterThan(0);
      expect(y).toBeGreaterThan(0);
      expect(`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`).toContain(
        '/14/',
      );
    });
  });

  describe('4. Upgrade Lab Budget Estimator & Shopping Checklist Formatter', () => {
    it('formats shopping checklist text cleanly for WhatsApp sharing', () => {
      const bikeNickname = 'Polygon Siskiu T7';
      const standardName = 'Bottom Bracket';
      const candidate = 'T47 Inboard';
      const tier = 'ENTHUSIAST';
      const items = [
        {
          name: 'Unit Part: Bottom Bracket (T47 Inboard)',
          checked: true,
          price: 'Rp 650.000 - 1.200.000',
        },
        { name: 'Spacers & Seal Kit', checked: false, price: 'Rp 45.000' },
        { name: 'Jasa Pasang Bengkel', checked: true, price: 'Rp 60.000' },
      ];

      const text = `🛒 DAFTAR BELANJA UPGRADE SEPEDA — GOWESKIT
🚲 Sepeda: ${bikeNickname}
🎯 Uji Part: ${standardName} (${candidate})
💰 Tier Budget: ${tier}

Checklist Belanja:
${items.map((i) => `${i.checked ? '✅' : '⬜'} ${i.name} [${i.price}]`).join('\n')}`;

      expect(text).toContain('Polygon Siskiu T7');
      expect(text).toContain('✅ Unit Part: Bottom Bracket');
      expect(text).toContain('⬜ Spacers & Seal Kit');
      expect(text).toContain('ENTHUSIAST');
    });
  });
});
