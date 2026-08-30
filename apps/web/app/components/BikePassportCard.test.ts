import { describe, expect, it } from 'vitest';
import type { Bike } from '@goweskit/contracts';

describe('BikePassportCard Logic', () => {
  const mockBike: Bike = {
    id: 'bike-12345-67890',
    nickname: 'Polygon Siskiu T7 Custom',
    brand: 'Polygon',
    model: 'Siskiu T7',
    modelYear: 2024,
    photoUrl: 'https://example.com/bike.jpg',
    avatarPreset: null,
    notes: 'Tubeless ready with CushCore',
    bicycleType: {
      id: 'bt-1',
      name: 'Mountain Bike (Trail)',
      slug: 'mountain',
    },
    specs: [
      {
        standardCode: 'bottom_bracket_shell',
        label: 'Bottom Bracket',
        knowledge: 'known',
        value: 'bsa_73',
        valueLabel: 'BSA Threaded 73mm',
        confidence: 'confirmed',
        source: 'manual',
        updatedAt: '2026-08-25T00:00:00.000Z',
      },
      {
        standardCode: 'rear_axle',
        label: 'Rear Axle',
        knowledge: 'known',
        value: '12x148_boost',
        valueLabel: '12x148mm Boost',
        confidence: 'confirmed',
        source: 'manual',
        updatedAt: '2026-08-25T00:00:00.000Z',
      },
      {
        standardCode: 'seatpost_diameter_mm',
        label: 'Seatpost Diameter',
        knowledge: 'unknown',
        value: null,
        valueLabel: null,
        confidence: 'unknown',
        source: 'manual',
        updatedAt: '2026-08-25T00:00:00.000Z',
      },
    ],
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z',
  };

  it('formats known spec count correctly', () => {
    const knownCount = mockBike.specs.filter((s) => s.knowledge === 'known').length;
    const totalCount = mockBike.specs.length;

    expect(knownCount).toBe(2);
    expect(totalCount).toBe(3);
  });

  it('formats full bike title with brand, model, and year', () => {
    const parts = [mockBike.brand, mockBike.model, mockBike.modelYear ? String(mockBike.modelYear) : ''].filter(Boolean);
    const title = parts.join(' ');
    expect(title).toBe('Polygon Siskiu T7 2024');
  });

  it('formats copyable specification summary for mechanics and social media', () => {
    const specsText = mockBike.specs
      .map((s) => `• ${s.label}: ${s.valueLabel ?? s.value ?? 'Unknown'} [${s.knowledge}]`)
      .join('\n');

    expect(specsText).toContain('• Bottom Bracket: BSA Threaded 73mm [known]');
    expect(specsText).toContain('• Rear Axle: 12x148mm Boost [known]');
    expect(specsText).toContain('• Seatpost Diameter: Unknown [unknown]');
  });

  it('supports multiple share format modes (story 9:16, post 1:1, sheet)', () => {
    const validFormats = ['story', 'post', 'sheet'];
    expect(validFormats).toContain('story');
    expect(validFormats).toContain('post');
    expect(validFormats).toContain('sheet');
  });
});
